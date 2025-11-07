# Story 1.9: CLI Foundation - Basic Commands

Status: ready-for-dev

## Story

As a developer using the orchestrator,
I want command-line tools to control the orchestrator locally,
So that I can start workflows, check status, and debug issues.

## Acceptance Criteria

1. ✅ Implement CLI using commander.js or yargs
2. ✅ Commands: start-workflow, pause, resume, status, list-projects
3. ✅ `orchestrator start-workflow --project <id> --workflow <path>`
4. ✅ `orchestrator status --project <id>` shows current phase and progress
5. ✅ `orchestrator logs --project <id> --tail` shows recent logs
6. ✅ Color-coded output for better readability
7. ✅ --help documentation for each command
8. ✅ Proper error handling with actionable messages

## Tasks / Subtasks

- [ ] **Task 1**: CLI framework setup and project structure (AC: #1)
  - [ ] Install commander.js ^11.0.0 dependency
  - [ ] Create `backend/src/cli/index.ts` as main entry point
  - [ ] Create `backend/src/cli/commands/` directory for command implementations
  - [ ] Configure TypeScript for CLI compilation
  - [ ] Add CLI executable script to package.json: `"orchestrator": "tsx src/cli/index.ts"`
  - [ ] Create CLI main program with version, description, and global options

- [ ] **Task 2**: Implement start-workflow command (AC: #2, #3)
  - [ ] Create `commands/start-workflow.ts`
  - [ ] Command signature: `orchestrator start-workflow --project <id> --workflow <path>`
  - [ ] Validate project ID exists (check .bmad/project-config.yaml)
  - [ ] Validate workflow path exists and is readable
  - [ ] Load ProjectConfig for the specified project
  - [ ] Instantiate WorkflowEngine with workflow path
  - [ ] Call WorkflowEngine.execute() to start workflow
  - [ ] Display progress messages with color coding
  - [ ] Handle errors gracefully (project not found, workflow parse errors, execution failures)
  - [ ] Return appropriate exit codes (0 = success, 1 = error)

- [ ] **Task 3**: Implement status command (AC: #2, #4)
  - [ ] Create `commands/status.ts`
  - [ ] Command signature: `orchestrator status --project <id>`
  - [ ] Load workflow state from StateManager.loadState(projectId)
  - [ ] Display current phase (Analysis, Planning, Solutioning, Implementation)
  - [ ] Display current workflow name and step number
  - [ ] Display workflow status (running, paused, completed, error)
  - [ ] Display active agents (if any)
  - [ ] Display recent activity (last 5 events)
  - [ ] Color-code by status: green (completed), yellow (running), red (error)
  - [ ] Handle case where project has no active workflow

- [ ] **Task 4**: Implement logs command (AC: #2, #5)
  - [ ] Create `commands/logs.ts`
  - [ ] Command signature: `orchestrator logs --project <id> [--tail <n>]`
  - [ ] Default tail to 50 lines if not specified
  - [ ] Read log file from logs/{projectId}.log
  - [ ] Parse and format log entries (timestamp, level, message)
  - [ ] Color-code by log level: debug (gray), info (white), warn (yellow), error (red)
  - [ ] Support --tail flag to limit output lines
  - [ ] Handle missing log file gracefully
  - [ ] Stream logs in real-time if --follow flag (optional)

- [ ] **Task 5**: Implement pause command (AC: #2)
  - [ ] Create `commands/pause.ts`
  - [ ] Command signature: `orchestrator pause --project <id>`
  - [ ] Load current workflow state
  - [ ] Update status to 'paused' in WorkflowState
  - [ ] Save state via StateManager
  - [ ] Signal running workflow engine to stop after current step
  - [ ] Display confirmation message
  - [ ] Handle case where no workflow is running

- [ ] **Task 6**: Implement resume command (AC: #2)
  - [ ] Create `commands/resume.ts`
  - [ ] Command signature: `orchestrator resume --project <id>`
  - [ ] Load workflow state from StateManager
  - [ ] Validate state exists and status is 'paused' or 'error'
  - [ ] Instantiate WorkflowEngine
  - [ ] Call WorkflowEngine.resumeFromState(state)
  - [ ] Display resume confirmation with current step
  - [ ] Handle case where workflow is already running or completed

- [ ] **Task 7**: Implement list-projects command (AC: #2)
  - [ ] Create `commands/list-projects.ts`
  - [ ] Command signature: `orchestrator list-projects`
  - [ ] Scan projects/ directory for project folders
  - [ ] Load project-config.yaml for each project
  - [ ] Display table with: Project ID, Name, Current Phase, Status
  - [ ] Color-code by status (active projects in green)
  - [ ] Sort by most recently active
  - [ ] Handle empty projects directory gracefully

- [ ] **Task 8**: Implement list-agents command (bonus)
  - [ ] Create `commands/list-agents.ts`
  - [ ] Command signature: `orchestrator list-agents --project <id>`
  - [ ] Query AgentPool for active agents
  - [ ] Display table with: Agent Name, LLM Model, Status, Duration, Est. Cost
  - [ ] Color-code by agent status (active in green)
  - [ ] Show total estimated cost for project
  - [ ] Handle case where no agents are active

- [ ] **Task 9**: Implement state command (bonus)
  - [ ] Create `commands/state.ts`
  - [ ] Command signature: `orchestrator state --project <id>`
  - [ ] Load complete workflow state from StateManager
  - [ ] Display detailed state information: workflow config, variables, agent activity
  - [ ] Format as JSON with --json flag for machine parsing
  - [ ] Pretty-print by default for human readability
  - [ ] Useful for debugging workflow issues

- [ ] **Task 10**: Color-coded output and formatting (AC: #6)
  - [ ] Install chalk ^5.0.0 or similar for terminal colors
  - [ ] Create color utility: `cli/utils/colors.ts`
  - [ ] Define color scheme:
    - Success: green
    - Warning: yellow
    - Error: red
    - Info: cyan
    - Debug: gray
  - [ ] Apply colors consistently across all commands
  - [ ] Support --no-color flag to disable colors (for CI/CD)
  - [ ] Test output in different terminals (light/dark themes)

- [ ] **Task 11**: Help documentation (AC: #7)
  - [ ] Add command descriptions to commander definitions
  - [ ] Provide examples for each command
  - [ ] `orchestrator --help` shows command list
  - [ ] `orchestrator <command> --help` shows detailed command help
  - [ ] Include common use cases in examples:
    - Starting a PRD workflow
    - Checking project status
    - Viewing logs after error
    - Resuming after crash
  - [ ] Document global options: --verbose, --no-color, --config

- [ ] **Task 12**: Error handling and validation (AC: #8)
  - [ ] Create error handler utility: `cli/utils/error-handler.ts`
  - [ ] Centralized error handling for all commands
  - [ ] Error types:
    - ProjectNotFoundError → "Project '{id}' not found. Run 'orchestrator list-projects' to see available projects."
    - WorkflowNotFoundError → "Workflow file not found at '{path}'. Check the path and try again."
    - WorkflowParseError → "Failed to parse workflow: {message}"
    - WorkflowExecutionError → "Workflow execution failed: {message}"
  - [ ] Always provide actionable resolution steps
  - [ ] Log errors to file while displaying user-friendly messages
  - [ ] Exit with appropriate codes (0 = success, 1 = error)

- [ ] **Task 13**: Integration with WorkflowEngine and StateManager (AC: #2, #3, #4)
  - [ ] Import WorkflowEngine from `backend/src/core/WorkflowEngine.ts` (Story 1.7)
  - [ ] Import StateManager from `backend/src/core/StateManager.ts` (Story 1.5)
  - [ ] Import ProjectConfig from `backend/src/core/ProjectConfig.ts` (Story 1.1)
  - [ ] Ensure CLI can instantiate and control these core components
  - [ ] Pass project-specific config to WorkflowEngine
  - [ ] Use StateManager for all state queries and updates
  - [ ] Handle component initialization errors gracefully

- [ ] **Task 14**: Testing and validation
  - [ ] Write unit tests for each command handler
  - [ ] Test command parsing and validation
  - [ ] Test error handling for all error types
  - [ ] Test color output (with and without --no-color)
  - [ ] Test help documentation display
  - [ ] Integration test: Start workflow → Pause → Resume → Check status
  - [ ] Integration test: Start workflow → Error → Check logs
  - [ ] Test with missing/invalid project IDs
  - [ ] Test with missing/invalid workflow paths

## Dev Notes

### Architecture Context

This story implements the **CLI Foundation** component from Epic 1 tech spec (Section 2.1: Services and Modules). The CLI provides local command-line control of the orchestrator, enabling developers to start workflows, monitor execution, and debug issues without requiring the web dashboard.

**Key Design Decisions:**
- Use commander.js for CLI framework (simpler API than yargs)
- Color-coded output for better user experience (chalk library)
- Tight integration with WorkflowEngine and StateManager
- Actionable error messages with resolution steps
- Support for both interactive and CI/CD use (--no-color flag)

[Source: docs/tech-spec-epic-1.md#CLI]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Dependencies:
  - `commander` ^11.0.0 - CLI framework
  - `chalk` ^5.0.0 - Terminal colors
  - WorkflowEngine from Story 1.7 (start/pause/resume workflows)
  - StateManager from Story 1.5 (query workflow state)
  - ProjectConfig from Story 1.1 (load project settings)

**CLI Framework Choice: Commander.js**
- Simple, declarative API for defining commands
- Built-in help generation
- Type-safe with TypeScript
- Well-maintained and widely used
- Better documentation than yargs

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── cli/
│   │   │   ├── index.ts                ← Main CLI entry point
│   │   │   ├── commands/
│   │   │   │   ├── start-workflow.ts   ← Start workflow command
│   │   │   │   ├── pause.ts            ← Pause workflow command
│   │   │   │   ├── resume.ts           ← Resume workflow command
│   │   │   │   ├── status.ts           ← Status query command
│   │   │   │   ├── logs.ts             ← Logs display command
│   │   │   │   ├── list-projects.ts    ← Project list command
│   │   │   │   ├── list-agents.ts      ← Agent list command
│   │   │   │   └── state.ts            ← State query command
│   │   │   └── utils/
│   │   │       ├── colors.ts           ← Color scheme utilities
│   │   │       └── error-handler.ts    ← Error handling utilities
│   │   └── core/
│   │       ├── WorkflowEngine.ts       ← Story 1.7 (dependency)
│   │       ├── StateManager.ts         ← Story 1.5 (dependency)
│   │       └── ProjectConfig.ts        ← Story 1.1 (dependency)
│   ├── tests/
│   │   └── cli/
│   │       └── commands.test.ts        ← CLI command tests
│   └── package.json                     ← Add commander, chalk
```

[Source: docs/tech-spec-epic-1.md#Project-Structure]

### CLI Command Interface

**CLI Main Program:**
```typescript
// src/cli/index.ts
import { Command } from 'commander';
import { startWorkflow } from './commands/start-workflow';
import { pause } from './commands/pause';
import { resume } from './commands/resume';
import { status } from './commands/status';
import { logs } from './commands/logs';
import { listProjects } from './commands/list-projects';
import { listAgents } from './commands/list-agents';
import { state } from './commands/state';

const program = new Command();

program
  .name('orchestrator')
  .description('Agent Orchestrator - Autonomous BMAD workflow execution')
  .version('1.0.0');

// Global options
program
  .option('--verbose', 'Verbose output')
  .option('--no-color', 'Disable colored output');

// Workflow control commands
program
  .command('start-workflow')
  .description('Start a new workflow execution')
  .requiredOption('-p, --project <id>', 'Project ID')
  .requiredOption('-w, --workflow <path>', 'Workflow YAML path')
  .action(startWorkflow);

program
  .command('pause')
  .description('Pause workflow execution')
  .requiredOption('-p, --project <id>', 'Project ID')
  .action(pause);

program
  .command('resume')
  .description('Resume paused workflow')
  .requiredOption('-p, --project <id>', 'Project ID')
  .action(resume);

// Status query commands
program
  .command('status')
  .description('Show project status and progress')
  .requiredOption('-p, --project <id>', 'Project ID')
  .action(status);

program
  .command('logs')
  .description('Show project logs')
  .requiredOption('-p, --project <id>', 'Project ID')
  .option('-t, --tail <n>', 'Number of lines to show', '50')
  .option('-f, --follow', 'Stream logs in real-time')
  .action(logs);

program
  .command('list-projects')
  .description('List all orchestrator projects')
  .action(listProjects);

program
  .command('list-agents')
  .description('List active agents for a project')
  .requiredOption('-p, --project <id>', 'Project ID')
  .action(listAgents);

program
  .command('state')
  .description('Show detailed workflow state')
  .requiredOption('-p, --project <id>', 'Project ID')
  .option('--json', 'Output as JSON')
  .action(state);

program.parse();
```

[Source: docs/tech-spec-epic-1.md#CLI-Commands]

### Command Implementation Pattern

**Example: Status Command**
```typescript
// src/cli/commands/status.ts
import { StateManager } from '../../core/StateManager';
import { colors } from '../utils/colors';
import { handleError } from '../utils/error-handler';

export async function status(options: { project: string }): Promise<void> {
  try {
    const { project } = options;

    // Load state
    const stateManager = new StateManager();
    const state = await stateManager.loadState(project);

    if (!state) {
      console.log(colors.warning(`No active workflow for project: ${project}`));
      return;
    }

    // Display status
    console.log(colors.header(`\n📊 Project Status: ${state.project.name}`));
    console.log(colors.info(`\nPhase: ${await stateManager.getProjectPhase(project)}`));
    console.log(colors.info(`Workflow: ${state.currentWorkflow}`));
    console.log(colors.info(`Step: ${state.currentStep}`));

    // Color-code by status
    const statusColor = {
      'running': colors.success,
      'paused': colors.warning,
      'completed': colors.success,
      'error': colors.error
    }[state.status] || colors.info;

    console.log(statusColor(`Status: ${state.status.toUpperCase()}`));

    // Active agents
    if (state.agentActivity.length > 0) {
      console.log(colors.header(`\n🤖 Active Agents:`));
      state.agentActivity.forEach(agent => {
        console.log(colors.info(`  - ${agent.agentName}: ${agent.action}`));
      });
    }

    console.log(); // Empty line for spacing

  } catch (error) {
    handleError(error, 'Failed to get project status');
    process.exit(1);
  }
}
```

[Source: docs/tech-spec-epic-1.md#CLI-Implementation]

### Color Scheme Utilities

**Color Utility:**
```typescript
// src/cli/utils/colors.ts
import chalk from 'chalk';

// Check if colors should be disabled
const useColors = process.argv.includes('--no-color') ? false : true;

export const colors = {
  success: (text: string) => useColors ? chalk.green(text) : text,
  error: (text: string) => useColors ? chalk.red(text) : text,
  warning: (text: string) => useColors ? chalk.yellow(text) : text,
  info: (text: string) => useColors ? chalk.cyan(text) : text,
  debug: (text: string) => useColors ? chalk.gray(text) : text,
  header: (text: string) => useColors ? chalk.bold.blue(text) : text,
  highlight: (text: string) => useColors ? chalk.yellow(text) : text,
};
```

[Source: docs/tech-spec-epic-1.md#CLI-Colors]

### Error Handling Strategy

**Error Types and Messages:**
1. **ProjectNotFoundError**: Project directory or config missing → "Project '{id}' not found. Run 'orchestrator list-projects' to see available projects."
2. **WorkflowNotFoundError**: Workflow file missing → "Workflow file not found at '{path}'. Check the path and try again."
3. **WorkflowParseError**: Invalid YAML or XML → "Failed to parse workflow: {message}. Check workflow syntax at line {line}."
4. **WorkflowExecutionError**: Runtime error during execution → "Workflow execution failed at step {step}: {message}"
5. **StateLoadError**: Cannot load state → "Cannot load project state. Project may not have been initialized."

**Error Handler Implementation:**
```typescript
// src/cli/utils/error-handler.ts
import { colors } from './colors';

export function handleError(error: unknown, context: string): void {
  console.error(colors.error(`\n❌ ${context}`));

  if (error instanceof Error) {
    console.error(colors.error(`   ${error.message}`));

    // Provide actionable resolution steps
    if (error.message.includes('not found')) {
      console.error(colors.info(`\n💡 Try: orchestrator list-projects`));
    } else if (error.message.includes('parse')) {
      console.error(colors.info(`\n💡 Check workflow YAML syntax and variable references`));
    } else if (error.message.includes('permission')) {
      console.error(colors.info(`\n💡 Check file permissions and run with appropriate access`));
    }

    // Verbose mode: show stack trace
    if (process.argv.includes('--verbose')) {
      console.error(colors.debug(`\n${error.stack}`));
    }
  } else {
    console.error(colors.error(`   Unknown error occurred`));
  }

  console.error(); // Empty line for spacing
}
```

[Source: docs/tech-spec-epic-1.md#Error-Handling]

### Integration Points

**Depends On:**
- Story 1.7: WorkflowEngine (start, pause, resume workflows)
- Story 1.5: StateManager (query state, load/save workflow state)
- Story 1.1: ProjectConfig (load project configuration)

**Used By:**
- Developer users (primary interface for local orchestrator control)
- Epic 2-5: Workflow execution triggered via CLI
- Story 1.11-1.12: Testing and CI/CD (command-line automation)

[Source: docs/epics.md#Story-Dependencies]

### Testing Strategy

**Unit Tests (60% of coverage):**
- Test command parsing and option validation
- Test error handling for each error type
- Test color output (with and without --no-color)
- Test help documentation generation
- Mock WorkflowEngine and StateManager for isolated testing

**Integration Tests (30% of coverage):**
- Test workflow lifecycle: start → pause → resume → check status
- Test error scenarios: invalid project, missing workflow, parse errors
- Test logs command with real log files
- Test list-projects with sample project directory

**E2E Tests (10% of coverage):**
- Complete workflow execution via CLI
- Multi-step workflow with state persistence
- Crash recovery: start → kill process → resume
- Error recovery: start → error → logs → fix → resume

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### Performance Considerations

**CLI Startup Time:**
- Target: <500ms from command invocation to first output
- Lazy-load heavy dependencies (WorkflowEngine, StateManager)
- Cache parsed configs when possible
- Minimize initialization overhead

**Response Time:**
- Status queries: <100ms
- Logs display: <200ms for 50 lines
- List commands: <300ms for 10 projects
- Start workflow: Variable (workflow-dependent)

**Resource Usage:**
- CLI process: <50MB memory usage
- Exit promptly after command completion
- No long-running processes (except --follow logs)

[Source: docs/tech-spec-epic-1.md#Performance]

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#CLI)
- **Architecture**: [docs/architecture.md#CLI-Interface](../architecture.md)
- **Story Source**: [docs/epics.md#Story-1-9](../epics.md)
- **Commander.js Documentation**: https://github.com/tj/commander.js
- **Chalk Documentation**: https://github.com/chalk/chalk
- **Dependencies**: Story 1.7 (WorkflowEngine), Story 1.5 (StateManager), Story 1.1 (ProjectConfig)
- **Used By**: All developers using the orchestrator locally

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-9-cli-foundation-basic-commands.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
