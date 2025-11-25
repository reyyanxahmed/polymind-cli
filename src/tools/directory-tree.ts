import { BaseTool, type ToolParameter, type ToolResult } from './base.js';
import {
	scanDirectory,
	formatTree,
	flattenTree,
	searchTree,
	type DirectoryNode,
} from '../utils/directory-scanner.js';

/**
 * Tool for scanning directory structure
 * Returns JSON tree representation of directory contents
 */
export class DirectoryTreeTool extends BaseTool {
	readonly name = 'directory_tree';
	readonly description = 'Scan directory structure and return a tree representation';
	readonly parameters: ToolParameter[] = [
		{
			name: 'path',
			type: 'string',
			description: 'Path to scan (default: current directory)',
			required: false,
			default: '.',
		},
		{
			name: 'maxDepth',
			type: 'number',
			description: 'Maximum depth to traverse (default: 10)',
			required: false,
			default: 10,
		},
		{
			name: 'maxFiles',
			type: 'number',
			description: 'Maximum number of files to include (default: 1000)',
			required: false,
			default: 1000,
		},
		{
			name: 'format',
			type: 'string',
			description: 'Output format: "json" or "tree" (default: tree)',
			required: false,
			default: 'tree',
		},
	];
	readonly requiresConfirmation = false;

	constructor(private workingDirectory: string) {
		super();
	}

	async execute(args: Record<string, any>): Promise<ToolResult> {
		try {
			this.validateArgs(args);

			const path = (args.path as string) || '.';
			const maxDepth = (args.maxDepth as number) || 10;
			const maxFiles = (args.maxFiles as number) || 1000;
			const format = (args.format as string) || 'tree';

			// Resolve path
			const scanPath = path === '.' ? this.workingDirectory : path;

			// Scan directory
			const options = {
				maxDepth,
				maxFiles,
			};

			const result = await scanDirectory(scanPath, options);

			// Format output based on requested format
			let output: any;
			if (format === 'json') {
				output = result.tree;
			} else if (format === 'tree') {
				output = formatTree(result.tree);
			} else if (format === 'flat') {
				output = flattenTree(result.tree);
			} else {
				return this.error(`Invalid format: ${format}`);
			}

			return this.success(output, {
				path: scanPath,
				stats: result.stats,
				format,
			});
		} catch (error) {
			return this.error(
				`Directory scan failed: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

/**
 * Tool for searching within directory tree
 * Finds files matching a pattern
 */
export class DirectorySearchTool extends BaseTool {
	readonly name = 'directory_search';
	readonly description = 'Search for files matching a pattern in directory tree';
	readonly parameters: ToolParameter[] = [
		{
			name: 'pattern',
			type: 'string',
			description: 'Pattern to search for in file names',
			required: true,
		},
		{
			name: 'path',
			type: 'string',
			description: 'Path to search in (default: current directory)',
			required: false,
			default: '.',
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
			const path = (args.path as string) || '.';

			// Resolve path
			const scanPath = path === '.' ? this.workingDirectory : path;

			// Scan directory
			const result = await scanDirectory(scanPath);

			// Search tree
			const matches = searchTree(result.tree, pattern);

			return this.success(matches, {
				pattern,
				path: scanPath,
				totalMatches: matches.length,
			});
		} catch (error) {
			return this.error(
				`Directory search failed: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}
