/**
 * WorkflowEngine - Execute BMAD workflows with step-by-step execution
 * Handles variable substitution, conditional logic, state persistence, and crash recovery
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  WorkflowConfig,
  WorkflowState,
  Step,
  Action,
  Check,
  EngineOptions,
  ProjectInfo
} from '../types/workflow.types.js';
import { WorkflowExecutionError } from '../types/errors.types.js';
import { WorkflowParser } from './WorkflowParser.js';
import { StateManager } from './StateManager.js';
import { ProjectConfig } from '../config/ProjectConfig.js';
import { TemplateProcessor } from './TemplateProcessor.js';

/**
 * WorkflowEngine class
 * Executes BMAD workflows autonomously with state management and crash recovery
 */
export class WorkflowEngine {
  private workflowPath: string;
  private workflowParser: WorkflowParser;
  private stateManager: StateManager;
  private templateProcessor: TemplateProcessor;
  private projectRoot: string;
  private yoloMode: boolean;
  private workflowConfig?: WorkflowConfig;
  private steps: Step[] = [];
  private currentStepIndex: number = 0;
  private variables: Record<string, any> = {};
  private projectInfo?: ProjectInfo;

  // Pre-compiled regex patterns for better performance
  private static readonly STEP_REGEX = /<step\s+n="(\d+)"\s+goal="([^"]+)"(?:\s+optional="(true|false)")?(?:\s+if="([^"]+)")?>(.*?)<\/step>/gs;
  private static readonly ACTION_REGEX = /<action(?:\s+if="([^"]+)")?>(.*?)<\/action>/gs;
  private static readonly ASK_REGEX = /<ask>(.*?)<\/ask>/gs;
  private static readonly OUTPUT_REGEX = /<output>(.*?)<\/output>/gs;
  private static readonly TEMPLATE_OUTPUT_REGEX = /<template-output(?:\s+file="([^"]+)")?(.*?)>(.*?)<\/template-output>/gs;
  private static readonly ELICIT_REGEX = /<elicit-required>(.*?)<\/elicit-required>/gs;
  private static readonly GOTO_REGEX = /<goto\s+step="(\d+)"\s*\/?>/g;
  private static readonly INVOKE_WORKFLOW_REGEX = /<invoke-workflow\s+path="([^"]+)"\s*\/?>/g;
  private static readonly INVOKE_TASK_REGEX = /<invoke-task\s+path="([^"]+)"\s*\/?>/g;
  private static readonly CHECK_REGEX = /<check\s+if="([^"]+)">(.*?)<\/check>/gs;
  private static readonly VARIABLE_REGEX = /\{\{([a-zA-Z0-9_.-]+)(?:\|([^}]+))?\}\}/g;

  /**
   * Create a new WorkflowEngine instance
   * @param workflowPath Path to workflow.yaml file
   * @param options Engine configuration options
   */
  constructor(workflowPath: string, options: EngineOptions = {}) {
    if (!workflowPath || typeof workflowPath !== 'string') {
      throw new WorkflowExecutionError('workflowPath must be a non-empty string');
    }

    this.workflowPath = workflowPath;
    this.projectRoot = options.projectRoot || process.cwd();
    this.yoloMode = options.yoloMode || false;
    this.workflowParser = options.workflowParser || new WorkflowParser(this.projectRoot);
    this.stateManager = options.stateManager || new StateManager(this.projectRoot);
    this.templateProcessor = new TemplateProcessor({
      basePath: this.projectRoot,
      strictMode: true,
      preserveWhitespace: true,
    });
  }

  /**
   * Execute workflow from start
   * Parses workflow, initializes state, and executes steps sequentially
   */
  async execute(): Promise<void> {
    try {
      console.log(`[WorkflowEngine] Starting workflow: ${this.workflowPath}`);
      console.log(`[WorkflowEngine] YOLO mode: ${this.yoloMode}`);

      // Parse workflow.yaml
      this.workflowConfig = await this.workflowParser.parseYAML(this.workflowPath);

      // Resolve variables
      const configPath = path.join(this.projectRoot, '.bmad', 'project-config.yaml');
      const projectConfig = await ProjectConfig.loadConfig(configPath);
      this.workflowConfig = await this.workflowParser.resolveVariables(
        this.workflowConfig,
        projectConfig
      );

      // Validate workflow
      const validation = await this.workflowParser.validateWorkflow(this.workflowConfig);
      if (!validation.isValid) {
        throw new WorkflowExecutionError(
          `Workflow validation failed:\n${validation.errors.join('\n')}`,
          undefined,
          undefined,
          { errors: validation.errors, warnings: validation.warnings }
        );
      }

      // Parse instructions.md
      this.steps = await this.parseInstructions(this.workflowConfig.instructions);
      console.log(`[WorkflowEngine] Loaded ${this.steps.length} steps`);

      // Initialize workflow variables
      this.variables = {
        ...this.workflowConfig.variables,
        'project-root': this.projectRoot,
        date: new Date().toISOString().split('T')[0]
      };

      // Initialize project info
      this.projectInfo = {
        id: path.basename(this.projectRoot),
        name: this.workflowConfig.name,
        level: 0 // Default level, should be set from config
      };

      // Initialize execution state
      await this.saveState(0, 'running');

      // Execute steps sequentially
      for (let i = 0; i < this.steps.length; i++) {
        this.currentStepIndex = i;
        const step = this.steps[i];

        if (!step) {
          throw new WorkflowExecutionError(
            'Step is undefined in workflow execution',
            i
          );
        }

        console.log(`\n[WorkflowEngine] Executing Step ${step.number}: ${step.goal}`);

        // Skip optional steps in YOLO mode
        if (this.yoloMode && step.optional) {
          console.log(`[WorkflowEngine] Skipping optional step in YOLO mode`);
          continue;
        }

        // Evaluate step condition
        if (step.condition && !(await this.evaluateCondition(step.condition, this.variables))) {
          console.log(`[WorkflowEngine] Skipping step due to condition: ${step.condition}`);
          continue;
        }

        // Execute the step
        await this.executeStep(step);

        // Save state after step completion
        await this.saveState(step.number, 'running');
      }

      // Mark workflow as completed
      await this.saveState(this.steps.length, 'completed');
      console.log(`\n[WorkflowEngine] Workflow completed successfully`);
    } catch (error) {
      console.error(`[WorkflowEngine] Workflow execution failed:`, error);
      await this.saveState(this.currentStepIndex, 'error');
      throw error;
    }
  }

  /**
   * Resume workflow from saved state
   * @param state Saved workflow state
   */
  async resumeFromState(state: WorkflowState): Promise<void> {
    try {
      console.log(`[WorkflowEngine] Resuming workflow from step ${state.currentStep}`);

      // Validate state matches current workflow
      const stateWorkflowPath = path.resolve(state.currentWorkflow);
      const currentWorkflowPath = path.resolve(this.workflowPath);

      if (stateWorkflowPath !== currentWorkflowPath) {
        throw new WorkflowExecutionError(
          `State workflow path (${state.currentWorkflow}) does not match current workflow (${this.workflowPath})`,
          undefined,
          undefined,
          { stateWorkflow: state.currentWorkflow, currentWorkflow: this.workflowPath }
        );
      }

      // Restore state
      this.projectInfo = state.project;
      this.variables = state.variables;
      this.currentStepIndex = state.currentStep;

      // Parse workflow config and instructions
      this.workflowConfig = await this.workflowParser.parseYAML(this.workflowPath);
      const configPath = path.join(this.projectRoot, '.bmad', 'project-config.yaml');
      const projectConfig = await ProjectConfig.loadConfig(configPath);
      this.workflowConfig = await this.workflowParser.resolveVariables(
        this.workflowConfig,
        projectConfig
      );
      this.steps = await this.parseInstructions(this.workflowConfig.instructions);

      console.log(`[WorkflowEngine] Resuming from step ${state.currentStep + 1}`);

      // Resume execution from next step after the one saved in state
      // If state.currentStep is 2, we've completed step 2, so resume from step 3 (index 2)
      const resumeIndex = state.currentStep;

      // Resume execution from next step
      for (let i = resumeIndex; i < this.steps.length; i++) {
        this.currentStepIndex = i;
        const step = this.steps[i];

        if (!step) {
          throw new WorkflowExecutionError(
            'Step is undefined in workflow resume',
            i
          );
        }

        console.log(`\n[WorkflowEngine] Executing Step ${step.number}: ${step.goal}`);

        // Skip optional steps in YOLO mode
        if (this.yoloMode && step.optional) {
          console.log(`[WorkflowEngine] Skipping optional step in YOLO mode`);
          continue;
        }

        // Evaluate step condition
        if (step.condition && !(await this.evaluateCondition(step.condition, this.variables))) {
          console.log(`[WorkflowEngine] Skipping step due to condition: ${step.condition}`);
          continue;
        }

        // Execute the step
        await this.executeStep(step);

        // Save state after step completion
        await this.saveState(step.number, 'running');
      }

      // Mark workflow as completed
      await this.saveState(this.steps.length, 'completed');
      console.log(`\n[WorkflowEngine] Workflow resumed and completed successfully`);
    } catch (error) {
      console.error(`[WorkflowEngine] Workflow resume failed:`, error);
      await this.saveState(this.currentStepIndex, 'error');
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   * @param step Step to execute
   */
  async executeStep(step: Step): Promise<void> {
    try {
      // Parse actions from step content if not already parsed
      if (!step.actions) {
        step.actions = this.parseActions(step.content);
      }

      // Parse checks from step content if not already parsed
      if (!step.checks) {
        step.checks = this.parseChecks(step.content);
      }

      // Execute actions sequentially
      for (const action of step.actions || []) {
        // Replace variables in action content
        const resolvedContent = this.replaceVariables(action.content, this.variables);

        // Evaluate action condition
        if (action.condition && !(await this.evaluateCondition(action.condition, this.variables))) {
          console.log(`[WorkflowEngine] Skipping action due to condition: ${action.condition}`);
          continue;
        }

        // Execute action based on type
        await this.executeAction(action, resolvedContent);
      }

      // Execute conditional checks
      for (const check of step.checks || []) {
        if (await this.evaluateCondition(check.condition, this.variables)) {
          console.log(`[WorkflowEngine] Check passed: ${check.condition}`);
          for (const action of check.actions) {
            const resolvedContent = this.replaceVariables(action.content, this.variables);
            await this.executeAction(action, resolvedContent);
          }
        }
      }
    } catch (error) {
      throw new WorkflowExecutionError(
        `Step ${step.number} ("${step.goal}") execution failed: ${(error as Error).message}`,
        step.number,
        error as Error,
        {
          stepGoal: step.goal,
          stepContent: step.content.substring(0, 200),
          workflowPath: this.workflowPath
        }
      );
    }
  }

  /**
   * Execute an individual action
   * @param action Action to execute
   * @param resolvedContent Content with variables resolved
   */
  private async executeAction(action: Action, resolvedContent: string): Promise<void> {
    switch (action.type) {
      case 'action':
        console.log(`[WorkflowEngine] Action: ${resolvedContent}`);
        break;

      case 'ask':
        if (!this.yoloMode) {
          console.log(`[WorkflowEngine] Prompt: ${resolvedContent}`);
          // In a real implementation, this would prompt the user
          // For now, we'll just log it
        } else {
          console.log(`[WorkflowEngine] Skipping prompt in YOLO mode: ${resolvedContent}`);
        }
        break;

      case 'output':
        console.log(`[WorkflowEngine] Output: ${resolvedContent}`);
        break;

      case 'template-output': {
        // Extract file attribute and template content
        const outputFile = action.attributes?.file;

        if (!outputFile) {
          console.warn(`[WorkflowEngine] template-output missing file attribute, skipping`);
          break;
        }

        // Resolve variables in output file path
        const resolvedOutputFile = this.replaceVariables(outputFile, this.variables);

        try {
          // Process template content with current variables
          const processedContent = this.templateProcessor.processTemplate(
            resolvedContent,
            this.variables
          );

          // Write processed template to output file
          await this.templateProcessor.writeOutput(
            processedContent,
            resolvedOutputFile
          );

          if (!this.yoloMode) {
            console.log(`[WorkflowEngine] Template rendered: ${resolvedOutputFile}`);
            console.log(`[WorkflowEngine] Template output checkpoint reached`);
            // In a real implementation, this would show template output for approval
          } else {
            console.log(`[WorkflowEngine] Auto-approved template output: ${resolvedOutputFile}`);
          }
        } catch (error) {
          console.error(`[WorkflowEngine] Template processing failed:`, error);
          throw new WorkflowExecutionError(
            `Failed to process template: ${(error as Error).message}`
          );
        }
        break;
      }

      case 'elicit-required':
        if (!this.yoloMode) {
          console.log(`[WorkflowEngine] Elicit required: ${resolvedContent}`);
          // In a real implementation, this would show elicitation menu
        } else {
          console.log(`[WorkflowEngine] Skipping elicitation in YOLO mode`);
        }
        break;

      case 'goto': {
        const targetStep = parseInt(action.attributes?.step || '0', 10);
        await this.handleGoto(targetStep);
        break;
      }

      case 'invoke-workflow': {
        const workflowPath = action.attributes?.path || '';
        await this.invokeWorkflow(workflowPath, this.variables);
        break;
      }

      case 'invoke-task': {
        const taskPath = action.attributes?.path || '';
        await this.invokeTask(taskPath, this.variables);
        break;
      }

      default:
        console.warn(`[WorkflowEngine] Unknown action type: ${action.type}`);
    }
  }

  /**
   * Parse instructions markdown file into Step objects with nested tags
   * @param markdownFile Path to instructions markdown file
   * @returns Array of Step objects
   */
  private async parseInstructions(markdownFile: string): Promise<Step[]> {
    try {
      const fileContents = await fs.readFile(markdownFile, 'utf-8');
      const steps: Step[] = [];

      // Use pre-compiled regex pattern (reset lastIndex for reuse)
      WorkflowEngine.STEP_REGEX.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = WorkflowEngine.STEP_REGEX.exec(fileContents)) !== null) {
        const numberStr = match[1];
        const goal = match[2];
        const optional = match[3];
        const condition = match[4];
        const content = match[5];

        if (!numberStr || !goal || !content) {
          throw new WorkflowExecutionError(
            'Invalid step format: missing required attributes',
            undefined,
            undefined,
            { match: match[0] }
          );
        }

        steps.push({
          number: parseInt(numberStr, 10),
          goal,
          content: content.trim(),
          optional: optional === 'true',
          condition: condition || undefined
        });
      }

      // Validate step numbers are sequential
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step) {
          throw new WorkflowExecutionError(
            `Step at index ${i} is undefined`,
            i + 1
          );
        }
        if (step.number !== i + 1) {
          throw new WorkflowExecutionError(
            `Step numbers must be sequential. Expected step ${i + 1}, found step ${step.number}`,
            step.number
          );
        }
      }

      return steps;
    } catch (error) {
      throw new WorkflowExecutionError(
        `Failed to parse instructions file: ${(error as Error).message}`,
        undefined,
        error as Error,
        { markdownFile }
      );
    }
  }

  /**
   * Parse action tags from step content
   * Excludes actions inside <check> blocks (those are parsed separately)
   * @param content Step content
   * @returns Array of actions
   */
  private parseActions(content: string): Action[] {
    const actions: Action[] = [];

    // Remove <check> blocks from content before parsing actions
    // This prevents actions inside check blocks from being executed unconditionally
    const contentWithoutChecks = content.replace(WorkflowEngine.CHECK_REGEX, '');

    // Parse <action> tags - reset lastIndex for reuse
    WorkflowEngine.ACTION_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WorkflowEngine.ACTION_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[2]) {
        actions.push({
          type: 'action',
          content: match[2].trim(),
          condition: match[1] || undefined
        });
      }
    }

    // Parse <ask> tags
    WorkflowEngine.ASK_REGEX.lastIndex = 0;
    while ((match = WorkflowEngine.ASK_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[1]) {
        actions.push({
          type: 'ask',
          content: match[1].trim()
        });
      }
    }

    // Parse <output> tags
    WorkflowEngine.OUTPUT_REGEX.lastIndex = 0;
    while ((match = WorkflowEngine.OUTPUT_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[1]) {
        actions.push({
          type: 'output',
          content: match[1].trim()
        });
      }
    }

    // Parse <template-output> tags
    WorkflowEngine.TEMPLATE_OUTPUT_REGEX.lastIndex = 0;
    while ((match = WorkflowEngine.TEMPLATE_OUTPUT_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[3]) {
        actions.push({
          type: 'template-output',
          content: match[3].trim(),
          attributes: { file: match[1] || '' }
        });
      }
    }

    // Parse <elicit-required> tags
    WorkflowEngine.ELICIT_REGEX.lastIndex = 0;
    while ((match = WorkflowEngine.ELICIT_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[1]) {
        actions.push({
          type: 'elicit-required',
          content: match[1].trim()
        });
      }
    }

    // Parse <goto> tags
    WorkflowEngine.GOTO_REGEX.lastIndex = 0;
    while ((match = WorkflowEngine.GOTO_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[1]) {
        actions.push({
          type: 'goto',
          content: `Jump to step ${match[1]}`,
          attributes: { step: match[1] }
        });
      }
    }

    // Parse <invoke-workflow> tags
    WorkflowEngine.INVOKE_WORKFLOW_REGEX.lastIndex = 0;
    while ((match = WorkflowEngine.INVOKE_WORKFLOW_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[1]) {
        actions.push({
          type: 'invoke-workflow',
          content: `Invoke workflow ${match[1]}`,
          attributes: { path: match[1] }
        });
      }
    }

    // Parse <invoke-task> tags
    WorkflowEngine.INVOKE_TASK_REGEX.lastIndex = 0;
    while ((match = WorkflowEngine.INVOKE_TASK_REGEX.exec(contentWithoutChecks)) !== null) {
      if (match[1]) {
        actions.push({
          type: 'invoke-task',
          content: `Invoke task ${match[1]}`,
          attributes: { path: match[1] }
        });
      }
    }

    return actions;
  }

  /**
   * Parse check blocks from step content
   * @param content Step content
   * @returns Array of checks
   */
  private parseChecks(content: string): Check[] {
    const checks: Check[] = [];

    // Parse <check> tags - reset lastIndex for reuse
    WorkflowEngine.CHECK_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WorkflowEngine.CHECK_REGEX.exec(content)) !== null) {
      const condition = match[1];
      const checkContent = match[2];

      if (!condition || !checkContent) {
        continue;
      }

      // Parse actions within the check block
      const checkActions = this.parseActions(checkContent.trim());

      checks.push({
        condition,
        actions: checkActions
      });
    }

    return checks;
  }

  /**
   * Replace variables in text with resolved values
   * Supports {{variable}}, {{nested.variable}}, {{variable|default}}
   * @param text Text containing variables
   * @param vars Variable map
   * @returns Text with variables replaced
   */
  private replaceVariables(text: string, vars: Record<string, any>): string {
    // Use pre-compiled regex pattern (reset lastIndex for reuse)
    WorkflowEngine.VARIABLE_REGEX.lastIndex = 0;

    return text.replace(WorkflowEngine.VARIABLE_REGEX, (_match, variableName, defaultValue) => {
      // Support nested variables (e.g., user.name)
      const value = this.getNestedValue(vars, variableName);

      if (value !== undefined) {
        return String(value);
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new WorkflowExecutionError(
        `Undefined variable: {{${variableName}}}\n\nAvailable variables:\n${Object.keys(vars).map(k => `- ${k}`).join('\n')}\n\nResolution:\n1. Add ${variableName} to workflow variables in workflow.yaml\n2. Use default value: {{${variableName}|default_value}}\n3. Skip this step if not critical`,
        this.currentStepIndex,
        undefined,
        { variableName, availableVariables: Object.keys(vars) }
      );
    });
  }

  /**
   * Get nested value from object using dot notation
   * @param obj Object to traverse
   * @param key Dot-notated key (e.g., "user.name")
   * @returns Value or undefined
   */
  private getNestedValue(obj: any, key: string): any {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }

  /**
   * Evaluate conditional expression
   * Supports: ==, !=, <, >, <=, >=, AND, OR, NOT, "file exists", "variable is defined"
   * @param condition Condition expression
   * @param context Execution context with variables
   * @returns Boolean result
   */
  private async evaluateCondition(condition: string, context: Record<string, any>): Promise<boolean> {
    try {
      // Replace variables in condition first
      const resolvedCondition = this.replaceVariables(condition, context);

      // Handle special conditions
      if (resolvedCondition.includes('file exists')) {
        const filePathMatch = resolvedCondition.match(/file\s+(.+?)\s+exists/);
        if (filePathMatch && filePathMatch[1]) {
          const filePath = filePathMatch[1].trim();
          try {
            // Async check for file existence
            await fs.access(filePath);
            return true;
          } catch {
            return false;
          }
        }
      }

      if (resolvedCondition.includes('file not exists')) {
        const filePathMatch = resolvedCondition.match(/file\s+(.+?)\s+not exists/);
        if (filePathMatch && filePathMatch[1]) {
          const filePath = filePathMatch[1].trim();
          try {
            await fs.access(filePath);
            return false;
          } catch {
            return true;
          }
        }
      }

      if (resolvedCondition.includes('is defined')) {
        const varMatch = resolvedCondition.match(/(\w+)\s+is defined/);
        if (varMatch && varMatch[1]) {
          return context[varMatch[1]] !== undefined;
        }
      }

      if (resolvedCondition.includes('is empty')) {
        const varMatch = resolvedCondition.match(/(\w+)\s+is empty/);
        if (varMatch && varMatch[1]) {
          const value = context[varMatch[1]];
          return value === undefined || value === null || value === '';
        }
      }

      if (resolvedCondition.includes('is true')) {
        const varMatch = resolvedCondition.match(/(\w+)\s+is true/);
        if (varMatch && varMatch[1]) {
          return context[varMatch[1]] === true;
        }
      }

      if (resolvedCondition.includes('is false')) {
        const varMatch = resolvedCondition.match(/(\w+)\s+is false/);
        if (varMatch && varMatch[1]) {
          return context[varMatch[1]] === false;
        }
      }

      // Handle logical operators
      if (resolvedCondition.includes(' AND ')) {
        const parts = resolvedCondition.split(' AND ');
        const results = await Promise.all(parts.map(part => this.evaluateCondition(part.trim(), context)));
        return results.every(result => result);
      }

      if (resolvedCondition.includes(' OR ')) {
        const parts = resolvedCondition.split(' OR ');
        const results = await Promise.all(parts.map(part => this.evaluateCondition(part.trim(), context)));
        return results.some(result => result);
      }

      if (resolvedCondition.startsWith('NOT ')) {
        const innerCondition = resolvedCondition.substring(4).trim();
        return !(await this.evaluateCondition(innerCondition, context));
      }

      // Handle comparison operators
      const comparisonRegex = /^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+?)$/;
      const comparisonMatch = resolvedCondition.match(comparisonRegex);
      if (comparisonMatch) {
        const left = comparisonMatch[1];
        const operator = comparisonMatch[2];
        const right = comparisonMatch[3];

        if (!left || !operator || !right) {
          return false;
        }

        const leftValue = this.parseValue(left.trim());
        const rightValue = this.parseValue(right.trim());

        switch (operator) {
          case '==':
            return leftValue == rightValue;
          case '!=':
            return leftValue != rightValue;
          case '<':
            return leftValue < rightValue;
          case '>':
            return leftValue > rightValue;
          case '<=':
            return leftValue <= rightValue;
          case '>=':
            return leftValue >= rightValue;
        }
      }

      // Default: treat as boolean
      return resolvedCondition === 'true';
    } catch (error) {
      console.warn(`[WorkflowEngine] Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  /**
   * Parse a value from a string (number, boolean, or string)
   * @param value String value to parse
   * @returns Parsed value
   */
  private parseValue(value: string): any {
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Parse number
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Parse boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Return as string
    return value;
  }

  /**
   * Handle goto tag (jump to specified step)
   * @param stepNumber Target step number
   */
  private async handleGoto(stepNumber: number): Promise<void> {
    console.log(`[WorkflowEngine] Jumping to step ${stepNumber}`);

    // Validate target step exists
    const targetIndex = this.steps.findIndex(s => s.number === stepNumber);
    if (targetIndex === -1) {
      throw new WorkflowExecutionError(
        `Invalid goto target: step ${stepNumber} does not exist`,
        this.currentStepIndex,
        undefined,
        { targetStep: stepNumber, availableSteps: this.steps.map(s => s.number) }
      );
    }

    // Update current step index
    this.currentStepIndex = targetIndex - 1; // -1 because the loop will increment
  }

  /**
   * Invoke nested workflow
   * @param workflowPath Path to nested workflow
   * @param inputs Input variables for nested workflow
   */
  private async invokeWorkflow(workflowPath: string, inputs: Record<string, any>): Promise<void> {
    console.log(`[WorkflowEngine] Invoking nested workflow: ${workflowPath}`);

    try {
      // Resolve relative path
      const resolvedPath = path.isAbsolute(workflowPath)
        ? workflowPath
        : path.join(this.projectRoot, workflowPath);

      // Create nested workflow engine
      const nestedEngine = new WorkflowEngine(resolvedPath, {
        yoloMode: this.yoloMode,
        projectRoot: this.projectRoot,
        stateManager: this.stateManager,
        workflowParser: this.workflowParser
      });

      // Set input variables
      nestedEngine.variables = { ...this.variables, ...inputs };

      // Execute nested workflow
      await nestedEngine.execute();

      console.log(`[WorkflowEngine] Nested workflow completed: ${workflowPath}`);
    } catch (error) {
      throw new WorkflowExecutionError(
        `Nested workflow failed: ${(error as Error).message}`,
        this.currentStepIndex,
        error as Error,
        { workflowPath }
      );
    }
  }

  /**
   * Invoke task file
   * @param taskPath Path to task file
   * @param _params Task parameters
   */
  private async invokeTask(taskPath: string, _params: Record<string, any>): Promise<void> {
    console.log(`[WorkflowEngine] Invoking task: ${taskPath}`);

    try {
      // Resolve relative path
      const resolvedPath = path.isAbsolute(taskPath)
        ? taskPath
        : path.join(this.projectRoot, taskPath);

      // Read task file
      const taskContent = await fs.readFile(resolvedPath, 'utf-8');

      // For now, just log the task content
      // In a full implementation, this would execute the task
      console.log(`[WorkflowEngine] Task content:\n${taskContent}`);

      console.log(`[WorkflowEngine] Task completed: ${taskPath}`);
    } catch (error) {
      throw new WorkflowExecutionError(
        `Task execution failed: ${(error as Error).message}`,
        this.currentStepIndex,
        error as Error,
        { taskPath }
      );
    }
  }

  /**
   * Save workflow state
   * @param currentStep Current step number
   * @param status Workflow status
   */
  private async saveState(
    currentStep: number,
    status: 'running' | 'paused' | 'completed' | 'error'
  ): Promise<void> {
    if (!this.projectInfo) {
      console.warn('[WorkflowEngine] Cannot save state: project info not initialized');
      return;
    }

    const state: WorkflowState = {
      project: this.projectInfo,
      currentWorkflow: this.workflowPath,
      currentStep,
      status,
      variables: this.variables,
      agentActivity: [],
      startTime: new Date(),
      lastUpdate: new Date()
    };

    await this.stateManager.saveState(state);
    console.log(`[WorkflowEngine] State saved: step ${currentStep}, status ${status}`);
  }
}
