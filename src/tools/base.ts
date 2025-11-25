/**
 * Base class for implementing tools
 */

export interface ToolParameter {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	description: string;
	required: boolean;
	default?: any;
}

export interface ToolResult {
	success: boolean;
	data?: any;
	error?: string;
	metadata?: Record<string, any>;
}

export abstract class BaseTool {
	abstract readonly name: string;
	abstract readonly description: string;
	abstract readonly parameters: ToolParameter[];
	abstract readonly requiresConfirmation: boolean;

	abstract execute(args: Record<string, any>): Promise<ToolResult>;

	/**
	 * Validate tool arguments against parameter definitions
	 */
	protected validateArgs(args: Record<string, any>): void {
		for (const param of this.parameters) {
			if (param.required && !(param.name in args)) {
				throw new Error(`Missing required parameter: ${param.name}`);
			}

			if (param.name in args) {
				const value = args[param.name];
				const valueType = Array.isArray(value) ? 'array' : typeof value;

				if (valueType !== param.type) {
					throw new Error(
						`Invalid type for parameter ${param.name}: expected ${param.type}, got ${valueType}`
					);
				}
			}
		}
	}

	/**
	 * Create a success result
	 */
	protected success(data: any, metadata?: Record<string, any>): ToolResult {
		return { success: true, data, metadata };
	}

	/**
	 * Create an error result
	 */
	protected error(error: string, metadata?: Record<string, any>): ToolResult {
		return { success: false, error, metadata };
	}
}
