/**
 * XML Generator - Generate Story Context XML documents for LLM consumption
 *
 * Creates structured XML documents that are easy for LLMs to parse and understand.
 * Handles XML escaping for special characters in code and content.
 */

import type { ContextData } from './tokenizer.js';

/**
 * Generate Story Context XML document
 *
 * Structure:
 * ```xml
 * <story-context id="story-id" v="1.0">
 *   <metadata>...</metadata>
 *   <story>...</story>
 *   <prd-context>...</prd-context>
 *   <architecture-context>...</architecture-context>
 *   <onboarding-docs>...</onboarding-docs>
 *   <existing-code>...</existing-code>
 *   <dependency-context>...</dependency-context>
 * </story-context>
 * ```
 *
 * @param context Context data to convert to XML
 * @returns XML document string
 */
export function generateXML(context: ContextData): string {
  const { story, prdContext, architectureContext, onboardingDocs, existingCode, dependencyContext } = context;

  const xml: string[] = [];

  // XML declaration and root element
  xml.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  xml.push(`<story-context id="${escapeXML(story.id)}" v="1.0">`);

  // Metadata
  xml.push(`  <metadata>`);
  xml.push(`    <storyId>${escapeXML(story.id)}</storyId>`);
  xml.push(`    <title>${escapeXML(story.title)}</title>`);
  xml.push(`    <status>${escapeXML(story.status)}</status>`);
  xml.push(`    <generatedAt>${new Date().toISOString()}</generatedAt>`);
  xml.push(`    <generator>StoryContextGenerator</generator>`);
  xml.push(`  </metadata>`);

  // Story
  xml.push(`  <story>`);
  xml.push(`    <description>${escapeXML(story.description)}</description>`);

  // Acceptance criteria
  xml.push(`    <acceptanceCriteria>`);
  for (const ac of story.acceptanceCriteria) {
    xml.push(`      <criterion><![CDATA[${escapeCData(ac)}]]></criterion>`);
  }
  xml.push(`    </acceptanceCriteria>`);

  // Technical notes
  if (story.technicalNotes) {
    xml.push(`    <technicalNotes>`);

    if (story.technicalNotes.architectureAlignment) {
      xml.push(`      <architectureAlignment><![CDATA[${escapeCData(story.technicalNotes.architectureAlignment)}]]></architectureAlignment>`);
    }

    if (story.technicalNotes.designDecisions && story.technicalNotes.designDecisions.length > 0) {
      xml.push(`      <designDecisions>`);
      for (const decision of story.technicalNotes.designDecisions) {
        xml.push(`        <decision>${escapeXML(decision)}</decision>`);
      }
      xml.push(`      </designDecisions>`);
    }

    if (story.technicalNotes.affectedFiles && story.technicalNotes.affectedFiles.length > 0) {
      xml.push(`      <affectedFiles>`);
      for (const file of story.technicalNotes.affectedFiles) {
        xml.push(`        <file>${escapeXML(file)}</file>`);
      }
      xml.push(`      </affectedFiles>`);
    }

    if (story.technicalNotes.patterns && story.technicalNotes.patterns.length > 0) {
      xml.push(`      <patterns>`);
      for (const pattern of story.technicalNotes.patterns) {
        xml.push(`        <pattern>${escapeXML(pattern)}</pattern>`);
      }
      xml.push(`      </patterns>`);
    }

    if (story.technicalNotes.constraints && story.technicalNotes.constraints.length > 0) {
      xml.push(`      <constraints>`);
      for (const constraint of story.technicalNotes.constraints) {
        xml.push(`        <constraint><![CDATA[${escapeCData(constraint)}]]></constraint>`);
      }
      xml.push(`      </constraints>`);
    }

    if (story.technicalNotes.references && story.technicalNotes.references.length > 0) {
      xml.push(`      <references>`);
      for (const ref of story.technicalNotes.references) {
        xml.push(`        <reference>${escapeXML(ref)}</reference>`);
      }
      xml.push(`      </references>`);
    }

    xml.push(`    </technicalNotes>`);
  }

  // Dependencies
  if (story.dependencies && story.dependencies.length > 0) {
    xml.push(`    <dependencies>`);
    for (const dep of story.dependencies) {
      xml.push(`      <dependency>${escapeXML(dep)}</dependency>`);
    }
    xml.push(`    </dependencies>`);
  }

  // Tasks
  if (story.tasks && story.tasks.length > 0) {
    xml.push(`    <tasks>`);
    for (const task of story.tasks) {
      xml.push(`      <task><![CDATA[${escapeCData(task)}]]></task>`);
    }
    xml.push(`    </tasks>`);
  }

  xml.push(`  </story>`);

  // PRD Context
  xml.push(`  <prd-context>`);
  xml.push(`    <![CDATA[${escapeCData(prdContext)}]]>`);
  xml.push(`  </prd-context>`);

  // Architecture Context
  xml.push(`  <architecture-context>`);
  xml.push(`    <![CDATA[${escapeCData(architectureContext)}]]>`);
  xml.push(`  </architecture-context>`);

  // Onboarding Docs
  xml.push(`  <onboarding-docs>`);
  xml.push(`    <![CDATA[${escapeCData(onboardingDocs)}]]>`);
  xml.push(`  </onboarding-docs>`);

  // Existing Code
  xml.push(`  <existing-code>`);
  for (const codeFile of existingCode) {
    xml.push(`    <file>`);
    xml.push(`      <path>${escapeXML(codeFile.file)}</path>`);
    xml.push(`      <relevance>${escapeXML(codeFile.relevance)}</relevance>`);
    if (codeFile.content) {
      xml.push(`      <content><![CDATA[${escapeCData(codeFile.content)}]]></content>`);
    } else {
      xml.push(`      <content></content>`);
      xml.push(`      <note>File does not exist - to be created</note>`);
    }
    xml.push(`    </file>`);
  }
  xml.push(`  </existing-code>`);

  // Dependency Context (optional)
  if (dependencyContext !== undefined) {
    xml.push(`  <dependency-context>`);
    xml.push(`    <![CDATA[${escapeCData(dependencyContext)}]]>`);
    xml.push(`  </dependency-context>`);
  }

  // Close root element
  xml.push(`</story-context>`);

  return xml.join('\n');
}

/**
 * Escape special XML characters
 *
 * Escapes: < > & " '
 *
 * @param text Text to escape
 * @returns XML-safe text
 */
function escapeXML(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Make content safe for inclusion inside CDATA sections.
 * Splits "]]]>" sequences into adjacent CDATA blocks to prevent premature section closure.
 *
 * Example: "foo]]>bar" → "foo]]]]><![CDATA[>bar"
 *
 * @param text Text to escape for CDATA
 * @returns CDATA-safe text
 */
function escapeCData(text: string | undefined): string {
  if (!text) return '';
  return text.replace(/]]>/g, ']]]]><![CDATA[>');
}

/**
 * Validate XML structure (basic check)
 *
 * Checks that all opening tags have corresponding closing tags.
 * Note: This is a basic validation - for production use, consider using a proper XML parser.
 *
 * @param xml XML string to validate
 * @returns true if valid, false otherwise
 */
export function validateXML(xml: string): boolean {
  try {
    // Basic tag matching check
    const openTags: string[] = [];
    const tagPattern = /<(\/?)([\w-]+)(\s[^>]*)?>/g;

    let match;
    while ((match = tagPattern.exec(xml)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2];

      if (!tagName || !match[0]) continue;

      if (isClosing) {
        // Check if this closes the most recent open tag
        const lastOpen = openTags.pop();
        if (lastOpen !== tagName) {
          console.error(`XML validation error: Mismatched tag </${tagName}>, expected </${lastOpen}>`);
          return false;
        }
      } else if (!match[0].endsWith('/>')) {
        // Self-closing tags don't need to be tracked
        openTags.push(tagName);
      }
    }

    // Check if all tags are closed
    if (openTags.length > 0) {
      console.error(`XML validation error: Unclosed tags: ${openTags.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`XML validation error: ${(error as Error).message}`);
    return false;
  }
}
