/**
 * Story File Parsers - Parse story markdown files with YAML frontmatter
 *
 * Extracts:
 * - YAML frontmatter (status, dependencies)
 * - Story statement (As a... I want... So that...)
 * - Acceptance criteria
 * - Technical notes
 * - Tasks and subtasks
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { TechnicalNotes } from '../types.js';

/**
 * Parsed story structure
 */
export interface ParsedStory {
  /** Story file path (for caching) */
  filePath: string;

  /** Story identifier (e.g., "5-2-story-context-generator") */
  id: string;

  /** Story title */
  title: string;

  /** Status from YAML frontmatter */
  status: string;

  /** User story description */
  description: string;

  /** Acceptance criteria list */
  acceptanceCriteria: string[];

  /** Technical notes */
  technicalNotes?: TechnicalNotes & {
    affectedFiles?: string[];
    patterns?: string[];
    constraints?: string[];
  };

  /** Dependencies on other stories */
  dependencies?: string[];

  /** Tasks and subtasks */
  tasks?: string[];
}

/**
 * Parse story markdown file with YAML frontmatter
 *
 * Story files follow this structure:
 * ```markdown
 * # Story X.Y: Title
 *
 * Status: ready-for-dev
 *
 * ## Story
 *
 * As a **role**,
 * I want **action**,
 * so that **benefit**.
 *
 * ## Acceptance Criteria
 *
 * ### AC1: Title
 * - [ ] Criterion 1
 * - [ ] Criterion 2
 *
 * ## Tasks / Subtasks
 *
 * - [ ] Task 1
 *   - [ ] Subtask 1.1
 * ```
 *
 * @param storyFilePath Absolute path to story file
 * @returns Parsed story structure
 * @throws Error if file not found or parsing fails
 */
export async function parseStoryFile(storyFilePath: string): Promise<ParsedStory> {
  try {
    // Read story file
    const content = await fs.readFile(storyFilePath, 'utf-8');

    // Parse YAML frontmatter (if present)
    const parsed = matter(content);
    const markdown = parsed.content;
    const frontmatter = parsed.data;

    // Extract story ID and title from filename or first heading
    const id = path.basename(storyFilePath, '.md');

    // Extract title from first # heading
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : id;

    // Extract status (from frontmatter or Status: line)
    let status = frontmatter.status || 'unknown';
    const statusMatch = markdown.match(/^Status:\s+(.+)$/m);
    if (statusMatch && statusMatch[1]) {
      status = statusMatch[1].trim();
    }

    // Extract story description (As a... I want... so that...)
    const description = extractStoryDescription(markdown);

    // Extract acceptance criteria
    const acceptanceCriteria = extractAcceptanceCriteria(markdown);

    // Extract technical notes
    const technicalNotes = extractTechnicalNotes(markdown);

    // Extract dependencies
    const dependencies = extractDependencies(markdown);

    // Extract tasks
    const tasks = extractTasks(markdown);

    return {
      filePath: storyFilePath,
      id,
      title,
      status,
      description,
      acceptanceCriteria,
      technicalNotes,
      dependencies,
      tasks
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Story file not found: ${storyFilePath}`);
    }
    throw new Error(
      `Failed to parse story file: ${(error as Error).message}`
    );
  }
}

/**
 * Extract story description (As a... I want... so that...)
 */
function extractStoryDescription(markdown: string): string {
  // Look for ## Story section
  const storyMatch = markdown.match(/##\s+Story\s+([\s\S]*?)(?=\n##|$)/);
  if (!storyMatch || !storyMatch[1]) {
    return '';
  }

  const storySection = storyMatch[1].trim();

  // Extract As a, I want, so that structure
  const asAMatch = storySection.match(/As a\s+\*\*(.+?)\*\*/i);
  const iWantMatch = storySection.match(/I want\s+\*\*(.+?)\*\*/i);
  const soThatMatch = storySection.match(/so that\s+\*\*(.+?)\*\*/i);

  if (asAMatch && asAMatch[1] && iWantMatch && iWantMatch[1] && soThatMatch && soThatMatch[1]) {
    return `As a ${asAMatch[1]}, I want ${iWantMatch[1]}, so that ${soThatMatch[1]}`;
  }

  // Fallback: return first paragraph
  const firstPara = storySection.split('\n\n')[0];
  return firstPara ? firstPara.trim() : '';
}

/**
 * Extract acceptance criteria from markdown
 */
function extractAcceptanceCriteria(markdown: string): string[] {
  const criteria: string[] = [];

  // Look for ## Acceptance Criteria section
  // Use greedy matching to capture all ACs until next section or end
  const acMatch = markdown.match(
    /##\s+Acceptance Criteria\s+([\s\S]*)(?=\n##|$)/
  );
  if (!acMatch || !acMatch[1]) {
    return criteria;
  }

  const acSection = acMatch[1];

  // Match each AC block: ### AC#: Title followed by content
  // Use \s* to match any whitespace (including newlines) before next AC
  const acPattern = /###\s+AC\d+:\s*([^\n]+)\n([\s\S]*?)(?=\s*###\s+AC\d+:|$)/g;
  const matches = acSection.matchAll(acPattern);

  for (const match of matches) {
    const title = match[1] ? match[1].trim() : '';
    const content = match[2] ? match[2].trim() : '';

    // Get checklist items
    const items = content
      .split('\n')
      .filter(line => line.match(/^-\s+\[.\]/))
      .map(line => line.replace(/^-\s+\[.\]\s+/, '').trim());

    if (items.length > 0) {
      criteria.push(`${title}:\n${items.map(item => `- ${item}`).join('\n')}`);
    } else if (title) {
      // Include AC even if no items (just title)
      criteria.push(title);
    }
  }

  return criteria;
}

/**
 * Extract technical notes from Dev Notes section
 */
function extractTechnicalNotes(
  markdown: string
): TechnicalNotes & {
  affectedFiles?: string[];
  patterns?: string[];
  constraints?: string[];
} | undefined {
  // Look for ## Dev Notes section
  const devNotesMatch = markdown.match(
    /##\s+Dev Notes\s+([\s\S]*?)(?=\n##|$)/
  );
  if (!devNotesMatch || !devNotesMatch[1]) {
    return undefined;
  }

  const devNotesSection = devNotesMatch[1];

  // Extract Architecture Alignment subsection
  const archAlignMatch = devNotesSection.match(
    /###\s+Architecture Alignment\s+([\s\S]*)(?=\n###|$)/
  );
  const architectureAlignment = archAlignMatch && archAlignMatch[1]
    ? archAlignMatch[1].trim()
    : undefined;

  // Extract Key Design Decisions
  const designMatch = devNotesSection.match(
    /###\s+Key Design Decisions\s+([\s\S]*)(?=\n###|$)/
  );
  const designDecisions = designMatch && designMatch[1]
    ? extractListItems(designMatch[1])
    : undefined;

  // Extract Testing Standards
  const testingMatch = devNotesSection.match(
    /###\s+Testing Standards\s+([\s\S]*)(?=\n###|$)/
  );
  const testingStandards = testingMatch && testingMatch[1] ? testingMatch[1].trim() : undefined;

  // Extract References
  const refsMatch = devNotesSection.match(
    /###\s+References\s+([\s\S]*)(?=\n###|$)/
  );
  const references = refsMatch && refsMatch[1] ? extractListItems(refsMatch[1]) : undefined;

  // Extract affected files (look for file structure or paths)
  const affectedFiles = extractAffectedFiles(devNotesSection);

  // Extract patterns mentioned
  const patterns = extractPatterns(devNotesSection);

  // Extract constraints
  const constraints = extractConstraints(devNotesSection);

  return {
    architectureAlignment,
    designDecisions,
    testingStandards,
    references,
    affectedFiles,
    patterns,
    constraints
  };
}

/**
 * Extract dependencies from story file
 */
function extractDependencies(markdown: string): string[] | undefined {
  // Look for dependencies in Dev Notes
  const depsMatch = markdown.match(
    /depends on\s+Story\s+([\d.]+)/gi
  );

  if (!depsMatch) {
    return undefined;
  }

  // Extract story IDs (e.g., "5.1" -> "5-1")
  return depsMatch.map(match => {
    const idMatch = match.match(/([\d.]+)$/);
    if (!idMatch || !idMatch[1]) return '';
    // Replace periods with hyphens and remove trailing hyphens
    return idMatch[1].replace(/\./g, '-').replace(/-+$/, '');
  }).filter(Boolean);
}

/**
 * Extract tasks and subtasks
 */
function extractTasks(markdown: string): string[] | undefined {
  // Look for ## Tasks / Subtasks section
  const tasksMatch = markdown.match(
    /##\s+Tasks\s*\/?\s*Subtasks\s+([\s\S]*?)(?=\n##|$)/
  );
  if (!tasksMatch || !tasksMatch[1]) {
    return undefined;
  }

  const tasksSection = tasksMatch[1];

  // Extract all task lines (preserve hierarchy with indentation)
  const tasks: string[] = [];
  const lines = tasksSection.split('\n');

  for (const line of lines) {
    if (line.match(/^-\s+\[.\]/)) {
      // Main task
      tasks.push(line.trim());
    } else if (line.match(/^\s+-\s+\[.\]/)) {
      // Subtask (indented)
      tasks.push(line.trim());
    }
  }

  return tasks.length > 0 ? tasks : undefined;
}

/**
 * Extract list items from markdown
 */
function extractListItems(text: string): string[] | undefined {
  const items = text
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

/**
 * Extract affected files from dev notes
 */
function extractAffectedFiles(devNotes: string): string[] | undefined {
  const files: string[] = [];

  // Look for file paths (e.g., src/implementation/context/StoryContextGenerator.ts)
  const filePattern = /(?:^|\s)([a-zA-Z0-9_-]+\/[a-zA-Z0-9_/-]+\.[a-z]+)/gm;
  const matches = devNotes.matchAll(filePattern);

  for (const match of matches) {
    if (match[1]) {
      files.push(match[1]);
    }
  }

  // Also look for File Structure section with code blocks
  const fileStructMatch = devNotes.match(
    /###\s+File Structure:?\s*```([\s\S]*?)```/
  );
  if (fileStructMatch && fileStructMatch[1]) {
    const structLines = fileStructMatch[1].split('\n');
    for (const line of structLines) {
      // Match tree structure: ├── or └── followed by filename
      const treeMatch = line.match(/(?:├──|└──)\s+([a-zA-Z0-9_/-]+\.[a-z]+)/);
      if (treeMatch && treeMatch[1]) {
        files.push(treeMatch[1]);
      }
      // Also match simple file listings
      const simpleMatch = line.match(/^\s*([a-zA-Z0-9_/-]+\.[a-z]+)\s*$/);
      if (simpleMatch && simpleMatch[1]) {
        files.push(simpleMatch[1]);
      }
    }
  }

  // Alternative: look for **File Structure:** without code blocks
  const altStructMatch = devNotes.match(
    /\*\*File Structure:\*\*\s+([\s\S]*?)(?=\n###|$)/
  );
  if (altStructMatch && altStructMatch[1]) {
    const structLines = altStructMatch[1].split('\n');
    for (const line of structLines) {
      const fileMatch = line.match(/(?:├─|└─|├──|└──)\s+([a-zA-Z0-9_/-]+\.[a-z]+)/);
      if (fileMatch && fileMatch[1]) {
        files.push(fileMatch[1]);
      }
    }
  }

  return files.length > 0 ? [...new Set(files)] : undefined;
}

/**
 * Extract design patterns mentioned in dev notes
 */
function extractPatterns(devNotes: string): string[] | undefined {
  const patterns: string[] = [];

  // Common patterns to look for
  const patternKeywords = [
    'singleton',
    'factory',
    'strategy',
    'observer',
    'decorator',
    'adapter',
    'facade',
    'microkernel',
    'event-driven',
    'repository',
    'service'
  ];

  const lowerText = devNotes.toLowerCase();
  for (const keyword of patternKeywords) {
    if (lowerText.includes(keyword)) {
      patterns.push(keyword);
    }
  }

  return patterns.length > 0 ? [...new Set(patterns)] : undefined;
}

/**
 * Extract constraints from dev notes
 */
function extractConstraints(devNotes: string): string[] | undefined {
  const constraints: string[] = [];

  // Look for MUST, CRITICAL, IMPORTANT statements
  const lines = devNotes.split('\n');
  for (const line of lines) {
    if (
      line.match(/\b(MUST|CRITICAL|IMPORTANT|REQUIRED)\b/i) ||
      line.includes('constraint') ||
      line.includes('requirement')
    ) {
      constraints.push(line.trim());
    }
  }

  return constraints.length > 0 ? constraints : undefined;
}
