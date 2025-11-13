/**
 * Context Extractors - Extract relevant sections from PRD, architecture, onboarding, code, and dependencies
 *
 * Each extractor implements intelligent filtering to keep context under token limits while
 * preserving the most relevant information for story implementation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger.js';
import { ExistingCodeFile } from '../types.js';
import { ParsedStory } from './parsers.js';
import { calculateTokens } from './tokenizer.js';

/**
 * Extract relevant PRD sections based on story keywords
 *
 * Strategy:
 * 1. Extract keywords from story description and acceptance criteria
 * 2. Find PRD sections matching those keywords
 * 3. Include surrounding context (±1 section) for continuity
 * 4. Optimize to stay under token limit
 *
 * @param prdPath Path to PRD file or directory
 * @param story Parsed story
 * @param tokenLimit Token limit for PRD context
 * @returns PRD context string
 */
export async function extractRelevantPRDSections(
  prdPath: string,
  story: ParsedStory,
  tokenLimit: number
): Promise<string> {
  try {
    // Check if PRD path exists
    const stats = await fs.stat(prdPath);

    let prdContent = '';

    if (stats.isDirectory()) {
      // Sharded PRD: read all files
      const files = await fs.readdir(prdPath);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        const filePath = path.join(prdPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        prdContent += `\n\n## From ${file}\n\n${content}`;
      }
    } else {
      // Single PRD file
      prdContent = await fs.readFile(prdPath, 'utf-8');
    }

    // Extract keywords from story
    const keywords = extractKeywords(story);

    // Find relevant sections
    const sections = splitIntoSections(prdContent);
    const relevantSections = findRelevantSections(sections, keywords);

    // Build context with surrounding sections
    const context = buildContextWithSurrounding(
      sections,
      relevantSections,
      tokenLimit
    );

    logger.info('PRD context extracted', {
      totalSections: sections.length,
      relevantSections: relevantSections.length,
      tokens: calculateTokens(context)
    });

    return context;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.warn('PRD file not found', { prdPath });
      return ''; // PRD is optional
    }
    throw error;
  }
}

/**
 * Extract relevant architecture sections based on affected files and components
 *
 * Strategy:
 * 1. Map affected files to architecture components/modules
 * 2. Extract sections describing those components
 * 3. Include design patterns, constraints, and coding standards
 * 4. Optimize to stay under token limit
 *
 * @param archPath Path to architecture file or directory
 * @param story Parsed story
 * @param tokenLimit Token limit for architecture context
 * @returns Architecture context string
 */
export async function extractRelevantArchSections(
  archPath: string,
  story: ParsedStory,
  tokenLimit: number
): Promise<string> {
  try {
    // Check if architecture path exists
    const stats = await fs.stat(archPath);

    let archContent = '';

    if (stats.isDirectory()) {
      // Sharded architecture: read all files
      const files = await fs.readdir(archPath);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        const filePath = path.join(archPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        archContent += `\n\n## From ${file}\n\n${content}`;
      }
    } else {
      // Single architecture file
      archContent = await fs.readFile(archPath, 'utf-8');
    }

    // Extract component names from affected files
    const affectedFiles = story.technicalNotes?.affectedFiles || [];
    const components = extractComponentNames(affectedFiles);

    // Add story patterns to search keywords
    const patterns = story.technicalNotes?.patterns || [];
    const keywords = [...components, ...patterns];

    // Find relevant sections
    const sections = splitIntoSections(archContent);
    const relevantSections = findRelevantSections(sections, keywords);

    // Build context
    const context = buildContextWithSurrounding(
      sections,
      relevantSections,
      tokenLimit
    );

    logger.info('Architecture context extracted', {
      totalSections: sections.length,
      relevantSections: relevantSections.length,
      tokens: calculateTokens(context)
    });

    return context;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.warn('Architecture file not found', { archPath });
      return ''; // Architecture is optional
    }
    throw error;
  }
}

/**
 * Load onboarding documentation
 *
 * Loads coding standards, testing patterns, security practices, etc.
 *
 * @param onboardingPath Path to onboarding docs directory
 * @param tokenLimit Token limit for onboarding docs
 * @returns Onboarding docs string
 */
export async function loadOnboardingDocs(
  onboardingPath: string,
  tokenLimit: number
): Promise<string> {
  try {
    const stats = await fs.stat(onboardingPath);

    if (!stats.isDirectory()) {
      logger.warn('Onboarding path is not a directory', { onboardingPath });
      return '';
    }

    // Read all markdown files in onboarding directory
    const files = await fs.readdir(onboardingPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    let content = '';

    for (const file of mdFiles) {
      const filePath = path.join(onboardingPath, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      content += `\n\n## ${file.replace('.md', '')}\n\n${fileContent}`;
    }

    // Trim to token limit
    const tokens = calculateTokens(content);
    if (tokens > tokenLimit) {
      logger.warn('Onboarding docs exceed token limit, trimming', {
        tokens,
        limit: tokenLimit
      });
      content = trimToTokenLimit(content, tokenLimit);
    }

    logger.info('Onboarding docs loaded', {
      files: mdFiles.length,
      tokens: calculateTokens(content)
    });

    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.info('Onboarding directory not found (optional)', {
        onboardingPath
      });
      return ''; // Onboarding docs are optional
    }
    throw error;
  }
}

/**
 * Load existing code files mentioned in story
 *
 * @param projectRoot Project root directory
 * @param affectedFiles List of file paths relative to project root
 * @param tokenLimit Token limit for existing code
 * @returns Array of existing code files
 */
export async function loadRelevantCode(
  projectRoot: string,
  affectedFiles: string[],
  tokenLimit: number
): Promise<ExistingCodeFile[]> {
  const codeFiles: ExistingCodeFile[] = [];
  let totalTokens = 0;

  for (const file of affectedFiles) {
    // Resolve file path
    const filePath = file.startsWith('/')
      ? file
      : path.join(projectRoot, file);

    try {
      // Check if file exists
      await fs.access(filePath);

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const tokens = calculateTokens(content);

      // Check token budget
      if (totalTokens + tokens > tokenLimit) {
        logger.warn('Code file exceeds token budget, truncating', {
          file,
          tokens,
          remaining: tokenLimit - totalTokens
        });

        // Truncate to fit budget
        const truncated = trimToTokenLimit(content, tokenLimit - totalTokens);
        codeFiles.push({
          file,
          content: truncated,
          relevance: `Modified by this story (truncated to fit token budget)`
        });
        totalTokens = tokenLimit; // Update total tokens to reflect truncation
        break; // Stop loading more files
      }

      // Add full file
      codeFiles.push({
        file,
        content,
        relevance: determineRelevance(file)
      });

      totalTokens += tokens;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - flag for creation
        codeFiles.push({
          file,
          content: '',
          relevance: 'New file to be created by this story'
        });
      } else {
        logger.warn('Failed to read code file', {
          file,
          error: (error as Error).message
        });
      }
    }
  }

  logger.info('Code files loaded', {
    total: codeFiles.length,
    existing: codeFiles.filter(f => f.content).length,
    new: codeFiles.filter(f => !f.content).length,
    tokens: totalTokens
  });

  return codeFiles;
}

/**
 * Load context from prerequisite stories
 *
 * Extracts key implementation details, services/interfaces created, and architectural decisions
 * from dependency stories.
 *
 * @param storiesPath Path to stories directory
 * @param dependencies List of story IDs (e.g., ["5-1-core-agent-infrastructure"])
 * @returns Dependency context string
 */
export async function loadDependencyContext(
  storiesPath: string,
  dependencies: string[]
): Promise<string | undefined> {
  if (dependencies.length === 0) {
    return undefined;
  }

  let context = '# Prerequisite Stories Context\n\n';

  for (const depId of dependencies) {
    try {
      // Find story file matching dependency ID
      const files = await fs.readdir(storiesPath);
      const storyFile = files.find(f => f.startsWith(depId) && f.endsWith('.md'));

      if (!storyFile) {
        logger.warn('Dependency story file not found', { depId });
        continue;
      }

      const storyPath = path.join(storiesPath, storyFile);
      const content = await fs.readFile(storyPath, 'utf-8');

      // Extract Dev Agent Record section (implementation details)
      const devRecordMatch = content.match(
        /##\s+Dev Agent Record\s+([\s\S]*?)(?=\n##|$)/
      );

      if (devRecordMatch && devRecordMatch[1]) {
        const devRecord = devRecordMatch[1];

        // Extract File List
        const fileListMatch = devRecord.match(
          /###\s+File List\s+([\s\S]*?)(?=\n###|$)/
        );
        const fileList = fileListMatch && fileListMatch[1] ? fileListMatch[1].trim() : '';

        // Extract Completion Notes
        const notesMatch = devRecord.match(
          /###\s+Completion Notes List\s+([\s\S]*?)(?=\n###|$)/
        );
        const notes = notesMatch && notesMatch[1] ? notesMatch[1].trim() : '';

        context += `## From Story ${depId}\n\n`;
        if (fileList) {
          context += `### Files Created/Modified:\n${fileList}\n\n`;
        }
        if (notes) {
          context += `### Implementation Notes:\n${notes}\n\n`;
        }
      }

      // Also extract key architectural decisions from Dev Notes
      const devNotesMatch = content.match(
        /##\s+Dev Notes\s+([\s\S]*?)(?=\n##|$)/
      );

      if (devNotesMatch && devNotesMatch[1]) {
        const archMatch = devNotesMatch[1].match(
          /###\s+Architecture Alignment\s+([\s\S]*?)(?=\n###|$)/
        );
        if (archMatch && archMatch[1]) {
          context += `### Architectural Context:\n${archMatch[1].trim()}\n\n`;
        }
      }
    } catch (error) {
      logger.warn('Failed to load dependency context', {
        depId,
        error: (error as Error).message
      });
    }
  }

  return context.length > 50 ? context : undefined;
}

/**
 * Extract keywords from story for PRD/architecture matching
 */
function extractKeywords(story: ParsedStory): string[] {
  const keywords: string[] = [];

  // Add words from story description
  const descWords = story.description
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !isStopWord(w));
  keywords.push(...descWords);

  // Add words from acceptance criteria
  for (const ac of story.acceptanceCriteria) {
    const acWords = ac
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3 && !isStopWord(w));
    keywords.push(...acWords);
  }

  // Add technical terms from title
  const titleWords = story.title
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(w => w.length > 3);
  keywords.push(...titleWords);

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Check if word is a stop word (common word to ignore)
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'that', 'with', 'from', 'this', 'will', 'have', 'been',
    'were', 'their', 'there', 'what', 'when', 'where', 'which',
    'should', 'would', 'could', 'about', 'other', 'into'
  ]);
  return stopWords.has(word);
}

/**
 * Split document into sections
 */
function splitIntoSections(content: string): Section[] {
  const sections: Section[] = [];
  const lines = content.split('\n');

  let currentSection: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Check for heading (# or ##)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: headingMatch[2],
        level: headingMatch[1].length,
        content: '',
        lineStart: i
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += line + '\n';
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Section structure
 */
interface Section {
  title: string;
  level: number;
  content: string;
  lineStart: number;
}

/**
 * Find sections relevant to keywords
 */
function findRelevantSections(
  sections: Section[],
  keywords: string[]
): number[] {
  const relevantIndices: number[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section) continue;

    const text = (section.title + ' ' + section.content).toLowerCase();

    // Check if any keyword appears in section
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        relevantIndices.push(i);
        break;
      }
    }
  }

  return relevantIndices;
}

/**
 * Build context with surrounding sections for continuity
 */
function buildContextWithSurrounding(
  sections: Section[],
  relevantIndices: number[],
  tokenLimit: number
): string {
  if (relevantIndices.length === 0) {
    // No relevant sections found - return summary
    return sections
      .slice(0, 3)
      .map(s => `## ${s.title}\n\n${s.content}`)
      .join('\n\n');
  }

  // Include ±1 section around each relevant section
  const indicesToInclude = new Set<number>();

  for (const idx of relevantIndices) {
    indicesToInclude.add(idx);
    if (idx > 0) indicesToInclude.add(idx - 1);
    if (idx < sections.length - 1) indicesToInclude.add(idx + 1);
  }

  // Sort indices
  const sortedIndices = Array.from(indicesToInclude).sort((a, b) => a - b);

  // Build context
  let context = '';
  for (const idx of sortedIndices) {
    const section = sections[idx];
    if (section) {
      context += `${'#'.repeat(section.level)} ${section.title}\n\n${section.content}\n\n`;

      // Check token limit
      if (calculateTokens(context) > tokenLimit) {
        logger.warn('Context exceeds token limit, truncating');
        return trimToTokenLimit(context, tokenLimit);
      }
    }
  }

  return context;
}

/**
 * Extract component names from file paths
 */
function extractComponentNames(filePaths: string[]): string[] {
  const components: string[] = [];

  for (const filePath of filePaths) {
    // Extract directory names as component names
    const parts = filePath.split('/');

    for (const part of parts) {
      if (
        part &&
        !part.includes('.') &&
        part !== 'src' &&
        part !== 'tests' &&
        part.length > 2
      ) {
        components.push(part);
      }
    }

    // Also extract filename without extension
    const filename = parts[parts.length - 1];
    if (filename) {
      const nameWithoutExt = filename.split('.')[0];
      if (nameWithoutExt) {
        components.push(nameWithoutExt);
      }
    }
  }

  return [...new Set(components)]; // Remove duplicates
}

/**
 * Determine relevance explanation for a code file
 */
function determineRelevance(filePath: string): string {
  if (filePath.includes('test')) {
    return 'Test file showing expected behavior and usage patterns';
  }
  if (filePath.includes('types')) {
    return 'Type definitions and interfaces to maintain compatibility';
  }
  if (filePath.includes('utils')) {
    return 'Utility functions available for reuse';
  }
  if (filePath.includes('core')) {
    return 'Core infrastructure and patterns to follow';
  }
  return 'Existing file to be modified or referenced by this story';
}

/**
 * Trim content to token limit (approximate)
 */
function trimToTokenLimit(content: string, tokenLimit: number): string {
  const charLimit = tokenLimit * 4; // Approximate: 1 token ≈ 4 chars
  if (content.length <= charLimit) {
    return content;
  }

  // Trim to character limit
  return content.slice(0, charLimit) + '\n\n... [truncated to fit token budget]';
}
