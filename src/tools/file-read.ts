import { readFile } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { BaseTool, type ToolParameter, type ToolResult } from './base.js';

/**
 * Tool for reading file contents
 * Safely reads files with size limits
 */
export class FileReadTool extends BaseTool {
	readonly name = 'file_read';
	readonly description = 'Read the contents of a file';
	readonly parameters: ToolParameter[] = [
		{
			name: 'path',
			type: 'string',
			description: 'Path to the file to read (relative or absolute)',
			required: true,
		},
		{
			name: 'encoding',
			type: 'string',
			description: 'File encoding (default: utf-8)',
			required: false,
			default: 'utf-8',
		},
	];
	readonly requiresConfirmation = false;

	constructor(private workingDirectory: string) {
		super();
	}

	async execute(args: Record<string, any>): Promise<ToolResult> {
		try {
			this.validateArgs(args);

			const path = args.path as string;
			const encoding = (args.encoding as string) || 'utf-8';

			// Resolve path
			const absolutePath = isAbsolute(path)
				? path
				: join(this.workingDirectory, path);

			// Read file with size limit (1MB)
			const MAX_SIZE = 1024 * 1024;
			const content = await readFile(absolutePath, encoding as any);

			if (content.length > MAX_SIZE) {
				return this.error(
					`File too large: ${content.length} bytes (max: ${MAX_SIZE} bytes)`,
					{ size: content.length, maxSize: MAX_SIZE }
				);
			}

			return this.success(content, {
				path: absolutePath,
				size: content.length,
				encoding,
			});
		} catch (error) {
			return this.error(
				`Failed to read file: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}
