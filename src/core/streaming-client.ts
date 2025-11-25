import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StreamChunk {
	text: string;
	done: boolean;
	usage?: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
	};
}

export interface ModelInfo {
	id: string;
	name: string;
	provider: string;
	description?: string;
}

// Gemini model registry with fallback order
export const GEMINI_MODELS: Record<string, ModelInfo> = {
	'gemini-3-pro-preview': {
		id: 'gemini-3-pro-preview',
		name: 'Gemini 3 Pro Preview',
		provider: 'gemini',
		description: 'Most advanced agentic model (may be overloaded)',
	},
	'gemini-3-pro-image-preview': {
		id: 'gemini-3-pro-image-preview',
		name: 'Gemini 3 Pro Image Preview',
		provider: 'gemini',
		description: 'Multimodal with advanced image understanding',
	},
	'gemini-2.5-pro': {
		id: 'gemini-2.5-pro',
		name: 'Gemini 2.5 Pro',
		provider: 'gemini',
		description: 'Extremely strong reasoning with 1M token context',
	},
	'gemini-2.5-flash': {
		id: 'gemini-2.5-flash',
		name: 'Gemini 2.5 Flash',
		provider: 'gemini',
		description: 'Fast and reliable, rarely overloaded',
	},
	'gemini-2.5-flash-lite': {
		id: 'gemini-2.5-flash-lite',
		name: 'Gemini 2.5 Flash Lite',
		provider: 'gemini',
		description: 'Ultra-efficient for simple tasks',
	},
	'gemini-2.0-flash-exp': {
		id: 'gemini-2.0-flash-exp',
		name: 'Gemini 2.0 Flash Experimental',
		provider: 'gemini',
		description: 'Next-generation experimental model',
	},
	'gemini-1.5-pro': {
		id: 'gemini-1.5-pro',
		name: 'Gemini 1.5 Pro',
		provider: 'gemini',
		description: 'Stable production model',
	},
	'gemini-1.5-flash': {
		id: 'gemini-1.5-flash',
		name: 'Gemini 1.5 Flash',
		provider: 'gemini',
		description: 'Fast and cost-effective',
	},
};

// Provider registry
export const PROVIDERS = {
	gemini: {
		name: 'Google Gemini',
		defaultModel: 'gemini-3-pro-preview',
		models: Object.keys(GEMINI_MODELS),
	},
	openai: {
		name: 'OpenAI',
		defaultModel: 'gpt-4o',
		models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
	},
	anthropic: {
		name: 'Anthropic',
		defaultModel: 'claude-3.5-sonnet',
		models: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
	},
	xai: {
		name: 'xAI',
		defaultModel: 'grok-beta',
		models: ['grok-beta'],
	},
};

// Fallback order for when models are overloaded
const FALLBACK_ORDER = ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'];

export class StreamingClient {
	private provider: string;
	private apiKey: string;
	private model: string;
	private geminiClient?: GoogleGenerativeAI;
	private history: Array<{ role: string; content: string }> = [];

	constructor(provider: string, apiKey: string, model?: string) {
		this.provider = provider;
		this.apiKey = apiKey;
		this.model = model || 'gemini-3-pro-preview';

		if (provider === 'gemini') {
			this.geminiClient = new GoogleGenerativeAI(apiKey);
		}
	}

	/**
	 * Exponential backoff retry logic for 503 errors
	 */
	private async retryWithBackoff<T>(
		fn: () => Promise<T>,
		modelName: string,
		delays: number[] = [1000, 2500, 5000, 10000]
	): Promise<T> {
		for (let i = 0; i < delays.length; i++) {
			try {
				return await fn();
			} catch (error: any) {
				const is503 =
					error.status === 503 ||
					error.message?.includes('overloaded') ||
					error.message?.includes('503');

				if (is503 && i < delays.length - 1) {
					console.error(`⚠️  ${modelName} overloaded. Retrying in ${delays[i] / 1000}s...`);
					await new Promise((resolve) => setTimeout(resolve, delays[i]));
					continue;
				}

				// If it's the last retry or not a 503, throw
				throw error;
			}
		}

		throw new Error(`Model ${modelName} overloaded after all retries. Try again later.`);
	}

	/**
	 * Try models in fallback order if primary fails
	 */
	private async streamWithFallback(
		prompt: string,
		systemPrompt?: string
	): Promise<AsyncGenerator<StreamChunk>> {
		const currentModelIndex = FALLBACK_ORDER.indexOf(this.model);
		const modelsToTry =
			currentModelIndex >= 0
				? FALLBACK_ORDER.slice(currentModelIndex)
				: [this.model, ...FALLBACK_ORDER];

		let lastError: Error | null = null;

		for (const modelId of modelsToTry) {
			try {
				console.log(`🔄 Attempting with ${GEMINI_MODELS[modelId]?.name || modelId}...`);
				return await this.streamGemini(prompt, systemPrompt, modelId);
			} catch (error: any) {
				lastError = error;
				const is503 =
					error.status === 503 ||
					error.message?.includes('overloaded') ||
					error.message?.includes('503');

				if (is503) {
					console.error(
						`❌ ${GEMINI_MODELS[modelId]?.name || modelId} overloaded. Trying fallback...`
					);
					continue;
				}

				// If not a 503, throw immediately
				throw error;
			}
		}

		throw (
			lastError ||
			new Error('All models overloaded. Please try again in a few minutes.')
		);
	}

	/**
	 * Stream from Gemini with retry logic
	 */
	private async streamGemini(
		prompt: string,
		systemPrompt?: string,
		modelId?: string
	): Promise<AsyncGenerator<StreamChunk>> {
		if (!this.geminiClient) {
			throw new Error('Gemini client not initialized');
		}

		const actualModel = modelId || this.model;

		return this.retryWithBackoff(async () => {
			const model = this.geminiClient!.getGenerativeModel({ model: actualModel });

			const parts: any[] = [];
			if (systemPrompt) {
				parts.push({ text: systemPrompt });
			}
			parts.push({ text: prompt });

			const result = await model.generateContentStream({
				contents: [{ role: 'user', parts }],
				generationConfig: {
					maxOutputTokens: 8192,
					temperature: 0.7,
				},
			});

			// Create async generator
			return (async function* () {
				let inputTokens = 0;
				let outputTokens = 0;

				for await (const chunk of result.stream) {
					const text = chunk.text();
					outputTokens += 1; // Approximate

					yield {
						text,
						done: false,
						usage: {
							inputTokens,
							outputTokens,
							totalTokens: inputTokens + outputTokens,
						},
					};
				}

				const response = await result.response;
				inputTokens = response.usageMetadata?.promptTokenCount || 0;
				outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

				yield {
					text: '',
					done: true,
					usage: {
						inputTokens,
						outputTokens,
						totalTokens: inputTokens + outputTokens,
					},
				};
			})();
		}, GEMINI_MODELS[actualModel]?.name || actualModel);
	}

	/**
	 * Public API: Stream with automatic fallback
	 */
	async *stream(prompt: string, systemPrompt?: string): AsyncGenerator<StreamChunk> {
		if (this.provider === 'gemini') {
			const generator = await this.streamWithFallback(prompt, systemPrompt);
			yield* generator;
		} else {
			throw new Error(`Provider ${this.provider} not yet implemented`);
		}
	}

	/**
	 * Switch provider/model dynamically
	 */
	switchProvider(provider: string, apiKey: string, model?: string): void {
		this.provider = provider;
		this.apiKey = apiKey;
		this.model = model || this.model;

		if (provider === 'gemini') {
			this.geminiClient = new GoogleGenerativeAI(apiKey);
		}
	}

	/**
	 * Get available models for current provider
	 */
	getAvailableModels(): ModelInfo[] {
		if (this.provider === 'gemini') {
			return Object.values(GEMINI_MODELS);
		}
		return [];
	}

	/**
	 * Get current model info
	 */
	getCurrentModel(): ModelInfo | null {
		return GEMINI_MODELS[this.model] || null;
	}

	/**
	 * Stream chat with history support
	 */
	async *streamChat(message: string, systemPrompt?: string): AsyncGenerator<StreamChunk> {
		this.history.push({ role: 'user', content: message });
		yield* this.stream(message, systemPrompt);
	}

	/**
	 * Clear chat history
	 */
	clearHistory(): void {
		this.history = [];
	}

	/**
	 * Get model info by ID
	 */
	getModelInfo(modelId: string): ModelInfo | null {
		return GEMINI_MODELS[modelId] || null;
	}
}
