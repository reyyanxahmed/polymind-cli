import { readFile, readdir } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { BaseTool, type ToolParameter, type ToolResult } from './base.js';

interface SearchMatch {
	file: string;
	line: number;
	content: string;
}

/**
 * Tool for searching file contents
 * Performs grep-style search across files
 */
export class FileSearchTool extends BaseTool {
	readonly name = 'file_search';
	readonly description = 'Search for a pattern in files within a directory';
	readonly parameters: ToolParameter[] = [
		{
			name: 'pattern',
			type: 'string',
			description: 'Pattern to search for (supports regex)',
			required: true,
		},
		{
			name: 'directory',
			type: 'string',
			description: 'Directory to search in (default: current directory)',
			required: false,
			default: '.',
		},
		{
			name: 'filePattern',
			type: 'string',
			description: 'File pattern to match (e.g., "*.ts", "*.tsx")',
			required: false,
		},
		{
			name: 'caseSensitive',
			type: 'boolean',
			description: 'Whether search is case-sensitive (default: false)',
			required: false,
			default: false,
		},
	];
	readonly requiresConfirmation = false;

	constructor(private workingDirectory: string) {
		super();
	}

	async execute(args: Record<string, any>): Promise<ToolResult> {
		try {
			this.validateArgs(args);

			const pattern = args.pattern as string;
			const directory = (args.directory as string) || '.';
			const filePattern = args.filePattern as string | undefined;
			const caseSensitive = (args.caseSensitive as boolean) || false;

			// Resolve directory
			const absoluteDir = isAbsolute(directory)
				? directory
				: join(this.workingDirectory, directory);

			// Create search regex
			const flags = caseSensitive ? 'g' : 'gi';
			const searchRegex = new RegExp(pattern, flags);

			// Create file pattern regex if provided
			let fileRegex: RegExp | undefined;
			if (filePattern) {
				const pattern = filePattern.replace(/\*/g, '.*').replace(/\?/g, '.');
				fileRegex = new RegExp(`^${pattern}$`);
			}

			// Search files
			const matches = await this.searchDirectory(absoluteDir, searchRegex, fileRegex);

			return this.success(matches, {
				pattern,
				directory: absoluteDir,
				filePattern,
				totalMatches: matches.length,
			});
		} catch (error) {
			return this.error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async searchDirectory(
		dir: string,
		searchRegex: RegExp,
		fileRegex?: RegExp
	): Promise<SearchMatch[]> {
		const matches: SearchMatch[] = [];
		const MAX_MATCHES = 100; // Limit matches to prevent overwhelming results

		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				if (matches.length >= MAX_MATCHES) break;

				// Skip common excluded directories
				if (
					entry.isDirectory() &&
					['node_modules', '.git', 'dist', 'build'].includes(entry.name)
				) {
					continue;
				}

				const fullPath = join(dir, entry.name);

				if (entry.isDirectory()) {
					// Recursively search subdirectories
					const subMatches = await this.searchDirectory(fullPath, searchRegex, fileRegex);
					matches.push(...subMatches);
				} else if (entry.isFile()) {
					// Check if file matches pattern
					if (fileRegex && !fileRegex.test(entry.name)) {
						continue;
					}

					// Search file contents
					try {
						const content = await readFile(fullPath, 'utf-8');
						const lines = content.split('\n');

						for (let i = 0; i < lines.length; i++) {
							if (searchRegex.test(lines[i])) {
								matches.push({
									file: fullPath,
									line: i + 1,
									content: lines[i].trim(),
								});

								if (matches.length >= MAX_MATCHES) break;
							}
						}
					} catch {
						// Skip files that can't be read
					}
				}
			}
		} catch {
			// Skip directories that can't be read
		}

		return matches;
	}
}
