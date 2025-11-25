import { FileReadTool } from './file-read.js';
import { FileSearchTool } from './file-search.js';
import { DirectoryTreeTool, DirectorySearchTool } from './directory-tree.js';
import { BaseTool, type ToolResult } from './base.js';

export interface ToolExecutorContext {
	workingDirectory: string;
	confirmCallback?: (message: string) => Promise<boolean>;
}

export interface ToolDefinition {
	name: string;
	description: string;
	parameters: {
		type: 'object';
		properties: Record<string, any>;
		required: string[];
	};
}

/**
 * Tool registry and executor
 * Manages available tools and coordinates their execution
 */
export class ToolExecutor {
	private tools: Map<string, BaseTool> = new Map();
	private context: ToolExecutorContext;

	constructor(context: ToolExecutorContext) {
		this.context = context;
		this.registerDefaultTools();
	}

	/**
	 * Register default tools
	 */
	private registerDefaultTools(): void {
		const tools = [
			new FileReadTool(this.context.workingDirectory),
			new FileSearchTool(this.context.workingDirectory),
			new DirectoryTreeTool(this.context.workingDirectory),
			new DirectorySearchTool(this.context.workingDirectory),
		];

		for (const tool of tools) {
			this.registerTool(tool);
		}
	}

	/**
	 * Register a new tool
	 */
	registerTool(tool: BaseTool): void {
		this.tools.set(tool.name, tool);
	}

	/**
	 * Get a tool by name
	 */
	getTool(name: string): BaseTool | undefined {
		return this.tools.get(name);
	}

	/**
	 * Get all registered tools
	 */
	getAllTools(): BaseTool[] {
		return Array.from(this.tools.values());
	}

	/**
	 * Execute a tool by name with arguments
	 */
	async executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
		const tool = this.tools.get(name);

		if (!tool) {
			return {
				success: false,
				error: `Tool not found: ${name}`,
			};
		}

		// Check if confirmation is required
		if (tool.requiresConfirmation && this.context.confirmCallback) {
			const confirmed = await this.context.confirmCallback(
				`Tool "${name}" requires confirmation. Proceed?`
			);

			if (!confirmed) {
				return {
					success: false,
					error: 'Tool execution cancelled by user',
				};
			}
		}

		try {
			return await tool.execute(args);
		} catch (error) {
			return {
				success: false,
				error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Get tool definitions for AI models
	 * Returns tools in a format suitable for function calling
	 */
	getToolDefinitions(): ToolDefinition[] {
		return this.getAllTools().map((tool) => ({
			name: tool.name,
			description: tool.description,
			parameters: {
				type: 'object' as const,
				properties: tool.parameters.reduce(
					(acc, param) => {
						acc[param.name] = {
							type: param.type,
							description: param.description,
						};
						return acc;
					},
					{} as Record<string, any>
				),
				required: tool.parameters.filter((p) => p.required).map((p) => p.name),
			},
		}));
	}
}

// Re-export for convenience
export { BaseTool } from './base.js';
export { FileReadTool } from './file-read.js';
export { FileSearchTool } from './file-search.js';
export { DirectoryTreeTool, DirectorySearchTool } from './directory-tree.js';
