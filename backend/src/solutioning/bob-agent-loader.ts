/**
 * Bob Agent Persona Loader
 *
 * Loads Bob (Scrum Master) agent persona from markdown file with caching.
 * Provides structured persona data for agent initialization.
 *
 * @module solutioning/bob-agent-loader
 * @see bmad/bmm/agents/bob.md - Bob persona definition
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Structured Bob persona data
 */
export interface BobPersona {
  /** Agent role and primary responsibilities */
  role: string;

  /** Complete system prompt for agent initialization */
  systemPrompt: string;

  /** Agent capabilities list */
  capabilities: string[];

  /** Decision-making approach and standards */
  decisionApproach: string;

  /** BMAD story patterns and quality checklist */
  storyPatterns: string;

  /** Raw markdown content */
  rawContent: string;
}

/**
 * Cached persona to avoid repeated file reads
 */
let cachedPersona: BobPersona | null = null;

/**
 * Load Bob agent persona from markdown file
 *
 * Reads bmad/bmm/agents/bob.md and parses into structured format.
 * Caches result to avoid repeated file system access.
 *
 * @returns Promise resolving to BobPersona object
 * @throws Error if persona file not found or malformed
 *
 * @example
 * ```typescript
 * const persona = await loadBobPersona();
 * console.log(persona.role); // "Scrum Master specializing in..."
 * ```
 */
export async function loadBobPersona(): Promise<BobPersona> {
  // Return cached persona if available
  if (cachedPersona) {
    return cachedPersona;
  }

  // Resolve persona file path
  const personaPath = path.join(process.cwd(), 'bmad', 'bmm', 'agents', 'bob.md');

  try {
    // Read persona markdown file
    const rawContent = await fs.readFile(personaPath, 'utf-8');

    // Parse persona sections
    const persona = parsePersonaMarkdown(rawContent);

    // Cache for future calls
    cachedPersona = persona;

    return persona;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Bob persona file not found at ${personaPath}. ` +
        `Please create the persona file with role definition, capabilities, and BMAD patterns.`
      );
    }
    throw new Error(`Failed to load Bob persona: ${(error as Error).message}`);
  }
}

/**
 * Parse Bob persona markdown into structured format
 *
 * Extracts sections:
 * - Role (## Role section)
 * - System Prompt (## System Prompt section)
 * - Capabilities (parsed from system prompt)
 * - Decision Approach (from Your Approach and Your Standards sections)
 * - Story Patterns (from BMAD Story Patterns section)
 *
 * @param markdown Raw markdown content
 * @returns Structured BobPersona object
 */
function parsePersonaMarkdown(markdown: string): BobPersona {
  // Extract role section
  const roleMatch = markdown.match(/## Role\s+(.*?)(?=\n##|$)/s);
  const role = roleMatch?.[1]?.trim() ?? 'Scrum Master';

  // Extract system prompt section
  const systemPromptMatch = markdown.match(/## System Prompt\s+(.*?)(?=\n## Specialized Prompts|$)/s);
  const systemPrompt = systemPromptMatch?.[1]?.trim() ?? '';

  // Extract capabilities from core expertise bullet points
  const capabilitiesMatch = systemPrompt.match(/Your core expertise lies in:\s+(.*?)(?=\n### Your Personality|$)/s);
  const capabilities: string[] = [];
  if (capabilitiesMatch?.[1]) {
    const capabilityLines = capabilitiesMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
    capabilities.push(...capabilityLines.map(line => line.replace(/^-\s*\*\*([^:]+):\*\*\s*(.*)/, '$1: $2').trim()));
  }

  // Extract decision approach (Your Approach and Your Standards sections)
  const approachMatch = systemPrompt.match(/### Your Approach\s+(.*?)(?=\n### BMAD Story Patterns|### Your Standards|$)/s);
  const standardsMatch = systemPrompt.match(/### Your Standards\s+(.*?)(?=\n### BMAD Story Patterns|$)/s);
  const decisionApproach = [
    approachMatch?.[1]?.trim() ?? '',
    standardsMatch?.[1]?.trim() ?? ''
  ].filter(Boolean).join('\n\n');

  // Extract BMAD story patterns section
  const patternsMatch = markdown.match(/### BMAD Story Patterns\s+(.*?)(?=\n### Story Constraints|## Specialized Prompts|$)/s);
  const storyPatterns = patternsMatch?.[1]?.trim() ?? '';

  return {
    role,
    systemPrompt,
    capabilities,
    decisionApproach,
    storyPatterns,
    rawContent: markdown
  };
}

/**
 * Clear cached persona (useful for testing)
 *
 * Forces next loadBobPersona() call to read from file system.
 * Only used in test scenarios.
 *
 * @internal
 */
export function clearPersonaCache(): void {
  cachedPersona = null;
}
