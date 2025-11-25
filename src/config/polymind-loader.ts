import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { constants } from 'node:fs';

export interface PolymindContext {
	projectOverview: string;
	techStack: string;
	architecture: string;
	developmentGuidelines: string;
	agentInstructions: string;
	currentStatus: string;
	filePath: string;
}

/**
 * Load and parse polymind.md from current directory or parent directories
 * Traverses up the directory tree until polymind.md is found or root is reached
 */
export async function loadPolymindContext(startDir: string = process.cwd()): Promise<PolymindContext | null> {
	let currentDir = startDir;
	const root = dirname(currentDir);

	// Traverse up to 10 levels to prevent infinite loops
	for (let i = 0; i < 10; i++) {
		const polymindPath = join(currentDir, 'polymind.md');

		try {
			// Check if file exists
			await access(polymindPath, constants.R_OK);

			// Read file content
			const content = await readFile(polymindPath, 'utf-8');

			// Parse sections
			const context = parsePolymindContent(content, polymindPath);
			return context;
		} catch (error) {
			// File doesn't exist or can't be read, try parent directory
			const parentDir = dirname(currentDir);

			// Reached filesystem root
			if (parentDir === currentDir) {
				break;
			}

			currentDir = parentDir;
		}
	}

	return null;
}

/**
 * Parse polymind.md content into structured sections
 * Extracts markdown sections based on ## headers
 */
function parsePolymindContent(content: string, filePath: string): PolymindContext {
	const sections: Record<string, string> = {};

	// Split by ## headers
	const headerRegex = /^## (.+)$/gm;
	const matches = [...content.matchAll(headerRegex)];

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const header = match[1].trim();
		const startIndex = match.index! + match[0].length;
		const endIndex = matches[i + 1]?.index ?? content.length;

		const sectionContent = content.slice(startIndex, endIndex).trim();
		sections[header] = sectionContent;
	}

	return {
		projectOverview: sections['Project Overview'] || '',
		techStack: sections['Tech Stack'] || '',
		architecture: sections['Architecture'] || '',
		developmentGuidelines: sections['Development Guidelines'] || '',
		agentInstructions: sections['Agent Instructions'] || '',
		currentStatus: sections['Current Status'] || '',
		filePath,
	};
}

/**
 * Format polymind context for AI system prompt
 * Creates a concise summary suitable for model context
 */
export function formatContextForPrompt(context: PolymindContext): string {
	const parts = [
		'# Project Context (from polymind.md)',
		'',
		'## Overview',
		context.projectOverview,
		'',
		'## Architecture',
		context.architecture,
		'',
		'## Agent Instructions',
		context.agentInstructions,
		'',
		'## Current Status',
		context.currentStatus,
	];

	return parts.join('\n');
}

/**
 * Get a summary of polymind context for display
 * Returns key information in a compact format
 */
export function getContextSummary(context: PolymindContext): string {
	const lines = [
		`📄 Loaded context from: ${context.filePath}`,
		'',
		'Sections available:',
		context.projectOverview ? '  ✓ Project Overview' : '  ✗ Project Overview',
		context.techStack ? '  ✓ Tech Stack' : '  ✗ Tech Stack',
		context.architecture ? '  ✓ Architecture' : '  ✗ Architecture',
		context.developmentGuidelines
			? '  ✓ Development Guidelines'
			: '  ✗ Development Guidelines',
		context.agentInstructions
			? '  ✓ Agent Instructions'
			: '  ✗ Agent Instructions',
		context.currentStatus ? '  ✓ Current Status' : '  ✗ Current Status',
	];

	return lines.join('\n');
}
