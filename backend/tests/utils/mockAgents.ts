/**
 * Mock Agent Factory Utilities
 *
 * Provides mock implementations of agents, LLM clients, and services
 * for unit testing without real API calls.
 */

import { vi } from 'vitest';
import type { LLMConfig } from '../../src/types/llm.types.js';

/**
 * Create mock LLM client with standard response behavior
 *
 * @param responses Optional array of mock responses (cycles through them)
 * @returns Mock LLM client with generateText method
 *
 * @example
 * ```typescript
 * const mockClient = createMockLLMClient(['Response 1', 'Response 2']);
 * const result = await mockClient.generateText('prompt');
 * // result.text === 'Response 1'
 * ```
 */
export const createMockLLMClient = (responses: string[] = ['Mock LLM response']) => {
  let callCount = 0;

  return {
    generateText: vi.fn().mockImplementation(async () => {
      const response = responses[callCount % responses.length];
      callCount++;
      return {
        text: response,
        usage: { inputTokens: 10, outputTokens: 20 }
      };
    }),
    streamText: vi.fn(),
    getModelInfo: vi.fn().mockReturnValue({
      model: 'mock-model',
      provider: 'mock-provider'
    })
  };
};

/**
 * Create mock LLMFactory for dependency injection
 *
 * @param mockClient Optional pre-configured mock client
 * @returns Mock LLMFactory
 *
 * @example
 * ```typescript
 * const mockFactory = createMockLLMFactory();
 * const agent = await MaryAgent.create(config, mockFactory);
 * // Agent uses mocked LLM without real API calls
 * ```
 */
export const createMockLLMFactory = (mockClient?: any) => {
  const client = mockClient || createMockLLMClient();

  return {
    createClient: vi.fn().mockResolvedValue(client),
    registerProvider: vi.fn(),
    getProvider: vi.fn(),
    listProviders: vi.fn().mockReturnValue(['mock-provider'])
  };
};

/**
 * Create mock DecisionEngine with configurable decision behavior
 *
 * @param defaultDecision Default decision to return ('proceed', 'escalate', etc.)
 * @param defaultConfidence Default confidence level (0-1)
 * @returns Mock DecisionEngine
 *
 * @example
 * ```typescript
 * const mockDE = createMockDecisionEngine('proceed', 0.95);
 * const decision = await mockDE.makeDecision(context);
 * // decision.decision === 'proceed', confidence === 0.95
 * ```
 */
export const createMockDecisionEngine = (
  defaultDecision: string = 'proceed',
  defaultConfidence: number = 0.95
) => {
  return {
    makeDecision: vi.fn().mockResolvedValue({
      decision: defaultDecision,
      confidence: defaultConfidence,
      reasoning: 'Mock decision reasoning',
      alternatives: []
    }),
    evaluateConfidence: vi.fn().mockReturnValue(defaultConfidence),
    setThreshold: vi.fn()
  };
};

/**
 * Create mock EscalationQueue for testing escalation flow
 *
 * @returns Mock EscalationQueue
 *
 * @example
 * ```typescript
 * const mockQueue = createMockEscalationQueue();
 * await mockQueue.add('Test escalation', { reason: 'low confidence' });
 * const items = mockQueue.getAll();
 * // items.length === 1
 * ```
 */
export const createMockEscalationQueue = () => {
  const queue: any[] = [];

  return {
    add: vi.fn().mockImplementation(async (message: string, context: any) => {
      queue.push({ message, context, timestamp: Date.now() });
      return { id: queue.length.toString() };
    }),
    getAll: vi.fn().mockImplementation(() => [...queue]),
    get: vi.fn().mockImplementation((id: string) => queue[parseInt(id) - 1]),
    resolve: vi.fn().mockImplementation((id: string) => {
      const index = parseInt(id) - 1;
      if (index >= 0 && index < queue.length) {
        queue.splice(index, 1);
      }
    }),
    clear: vi.fn().mockImplementation(() => {
      queue.length = 0;
    })
  };
};

/**
 * Create mock StateManager for testing state persistence
 *
 * @returns Mock StateManager
 *
 * @example
 * ```typescript
 * const mockState = createMockStateManager();
 * await mockState.save('key', { data: 'value' });
 * const data = await mockState.load('key');
 * ```
 */
export const createMockStateManager = () => {
  const store = new Map<string, any>();

  return {
    save: vi.fn().mockImplementation(async (key: string, data: any) => {
      store.set(key, data);
    }),
    load: vi.fn().mockImplementation(async (key: string) => {
      return store.get(key);
    }),
    delete: vi.fn().mockImplementation(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn().mockImplementation(async () => {
      return Array.from(store.keys());
    }),
    clear: vi.fn().mockImplementation(async () => {
      store.clear();
    })
  };
};

/**
 * Create standard test LLM config
 *
 * @param overrides Optional config overrides
 * @returns LLM configuration for testing
 *
 * @example
 * ```typescript
 * const config = createTestLLMConfig({ temperature: 0.5 });
 * // config.provider === 'claude-code', temperature === 0.5
 * ```
 */
export const createTestLLMConfig = (overrides?: Partial<LLMConfig>): LLMConfig => {
  return {
    provider: 'claude-code',
    model: 'claude-sonnet-4-5',
    temperature: 0.3,
    maxTokens: 4000,
    ...overrides
  };
};

/**
 * Create mock agent with standard behavior
 *
 * Useful for testing agent interactions without implementing full agent logic.
 *
 * @param name Agent name
 * @param responses Optional array of responses
 * @returns Mock agent
 *
 * @example
 * ```typescript
 * const mockMary = createMockAgent('Mary', ['Requirements analyzed']);
 * const result = await mockMary.analyzeRequirements('Build auth');
 * // result.text === 'Requirements analyzed'
 * ```
 */
export const createMockAgent = (name: string, responses: string[] = ['Mock agent response']) => {
  let callCount = 0;

  return {
    name,
    process: vi.fn().mockImplementation(async () => {
      const response = responses[callCount % responses.length];
      callCount++;
      return { text: response };
    }),
    getState: vi.fn().mockReturnValue({}),
    setState: vi.fn()
  };
};
