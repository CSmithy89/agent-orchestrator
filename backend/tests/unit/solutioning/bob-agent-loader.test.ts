/**
 * Unit tests for Bob Agent Persona Loader
 *
 * Tests persona loading, parsing, caching, and error handling.
 * Verifies AC #1: Bob Persona Loading
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import { loadBobPersona, clearPersonaCache, BobPersona } from '../../../src/solutioning/bob-agent-loader.js';

// Mock fs/promises module
vi.mock('fs/promises');

// Fixture: Bob persona markdown
const FIXTURE_BOB_PERSONA = `# Bob - Scrum Master

## Role

Scrum Master specializing in epic formation, story decomposition, and dependency detection.

## System Prompt

You are Bob, an expert Scrum Master with over 15 years of experience.

### Your Personality

- **Systematic**: You follow BMAD patterns
- **Pragmatic**: You balance idealism with constraints

### Your Approach

1. **Analyze PRD Holistically**: Understand full requirements
2. **Form Business-Value Epics**: Group by user value
3. **Vertical Slice Stories**: End-to-end functionality

### Your Standards

- **Epic Naming**: Business value not technical component
- **Story Format**: Always "As a..., I want..., So that..."
- **Confidence Threshold**: 0.75

### BMAD Story Patterns

You follow these proven patterns:

1. **Data Models First**: Create schemas before business logic
2. **Auth Before Protected**: Authentication before features
3. **API Before Frontend**: Backend endpoints before integration

## Specialized Prompts

### Epic Formation

Epic formation guidelines...

### Story Decomposition

Story decomposition guidelines...
`;

describe('Bob Agent Persona Loader', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearPersonaCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadBobPersona()', () => {
    it('should load and parse Bob persona from markdown file', async () => {
      // Mock successful file read
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      const persona = await loadBobPersona();

      expect(persona).toBeDefined();
      expect(persona.role).toContain('Scrum Master');
      expect(persona.systemPrompt).toContain('Bob');
      expect(persona.capabilities).toBeDefined(); // Capabilities may be empty if parsing fails
      expect(persona.decisionApproach).toBeTruthy();
      expect(persona.storyPatterns).toContain('Data Models First');
      expect(persona.rawContent).toBe(FIXTURE_BOB_PERSONA);
    });

    it('should parse role section correctly', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      const persona = await loadBobPersona();

      expect(persona.role).toBe('Scrum Master specializing in epic formation, story decomposition, and dependency detection.');
    });

    it('should extract capabilities from system prompt', async () => {
      const personaWithCapabilities = `# Bob - Scrum Master

## Role

Scrum Master

## System Prompt

You are Bob, an expert Scrum Master.

Your core expertise lies in:

- **Epic Formation**: Analyzing PRDs to identify natural feature groupings
- **Story Decomposition**: Breaking epics into vertical-slice stories
- **Dependency Detection**: Identifying technical dependencies

### Your Personality

Test
`;

      vi.mocked(fs.readFile).mockResolvedValue(personaWithCapabilities);

      const persona = await loadBobPersona();

      expect(persona.capabilities.length).toBeGreaterThan(0);
      expect(persona.capabilities.some(c => c.includes('Epic Formation'))).toBe(true);
    });

    it('should extract story patterns section', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      const persona = await loadBobPersona();

      expect(persona.storyPatterns).toContain('Data Models First');
      expect(persona.storyPatterns).toContain('Auth Before Protected');
      expect(persona.storyPatterns).toContain('API Before Frontend');
    });

    it('should cache persona to avoid repeated file reads', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      // First call - should read file
      await loadBobPersona();
      expect(fs.readFile).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await loadBobPersona();
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Still only 1 call

      // Third call - should still use cache
      await loadBobPersona();
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should throw helpful error when persona file not found', async () => {
      const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(loadBobPersona()).rejects.toThrow('Bob persona file not found');
      await expect(loadBobPersona()).rejects.toThrow('bmad/bmm/agents/bob.md');
      await expect(loadBobPersona()).rejects.toThrow('Please create the persona file');
    });

    it('should throw error when persona file read fails', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(loadBobPersona()).rejects.toThrow('Failed to load Bob persona');
      await expect(loadBobPersona()).rejects.toThrow('Permission denied');
    });

    it('should handle malformed markdown gracefully', async () => {
      const malformedPersona = `# Bob
This is not properly structured markdown
`;

      vi.mocked(fs.readFile).mockResolvedValue(malformedPersona);

      const persona = await loadBobPersona();

      // Should still return persona object with defaults
      expect(persona).toBeDefined();
      expect(persona.rawContent).toBe(malformedPersona);
      // Capabilities may be empty if parsing fails
      expect(persona.capabilities).toBeDefined();
    });

    it('should handle empty persona file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('');

      const persona = await loadBobPersona();

      expect(persona).toBeDefined();
      expect(persona.role).toBe('Scrum Master'); // Default value
      expect(persona.rawContent).toBe('');
    });

    it('should resolve correct persona file path', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      await loadBobPersona();

      // Check that readFile was called with correct path
      const readFileCall = vi.mocked(fs.readFile).mock.calls[0];
      const calledPath = readFileCall[0] as string;
      expect(calledPath).toContain('bmad');
      expect(calledPath).toContain('bmm');
      expect(calledPath).toContain('agents');
      expect(calledPath).toContain('bob.md');
    });
  });

  describe('clearPersonaCache()', () => {
    it('should clear cache and force next load to read from file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      // First load
      await loadBobPersona();
      expect(fs.readFile).toHaveBeenCalledTimes(1);

      // Clear cache
      clearPersonaCache();

      // Next load should read from file again
      await loadBobPersona();
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should allow cache to work again after clearing', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      // First load
      await loadBobPersona();
      clearPersonaCache();

      // Load after clear
      await loadBobPersona();
      const callsAfterClear = vi.mocked(fs.readFile).mock.calls.length;

      // Next load should use cache
      await loadBobPersona();
      expect(fs.readFile).toHaveBeenCalledTimes(callsAfterClear);
    });
  });

  describe('BobPersona interface', () => {
    it('should return all required fields', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(FIXTURE_BOB_PERSONA);

      const persona: BobPersona = await loadBobPersona();

      expect(persona).toHaveProperty('role');
      expect(persona).toHaveProperty('systemPrompt');
      expect(persona).toHaveProperty('capabilities');
      expect(persona).toHaveProperty('decisionApproach');
      expect(persona).toHaveProperty('storyPatterns');
      expect(persona).toHaveProperty('rawContent');

      expect(typeof persona.role).toBe('string');
      expect(typeof persona.systemPrompt).toBe('string');
      expect(Array.isArray(persona.capabilities)).toBe(true);
      expect(typeof persona.decisionApproach).toBe('string');
      expect(typeof persona.storyPatterns).toBe('string');
      expect(typeof persona.rawContent).toBe('string');
    });
  });
});
