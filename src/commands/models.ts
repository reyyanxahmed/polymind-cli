import { Command } from 'commander';
import chalk from 'chalk';
import { PROVIDERS } from '../core/streaming-client.js';

interface ModelInfo {
	name: string;
	description: string;
	modalities: string;
}

const GEMINI_MODEL_INFO: Record<string, ModelInfo> = {
	'gemini-3-pro-preview': {
		name: 'Gemini 3 Pro Preview',
		description: 'Most powerful agentic & reasoning model (Public Preview)',
		modalities: 'Text, Image, Video, Audio, PDF',
	},
	'gemini-3-pro-image-preview': {
		name: 'Gemini 3 Pro Image Preview',
		description: 'Specialized for advanced image generation & editing',
		modalities: 'Image and Text',
	},
	'gemini-2.5-pro': {
		name: 'Gemini 2.5 Pro',
		description: 'State-of-the-art reasoning (1M token context)',
		modalities: 'Text, Image, Video, Audio, PDF',
	},
	'gemini-2.5-flash': {
		name: 'Gemini 2.5 Flash',
		description: 'Fast, versatile, cost-effective model',
		modalities: 'Text, Image, Video, Audio, PDF',
	},
	'gemini-2.5-flash-lite': {
		name: 'Gemini 2.5 Flash Lite',
		description: 'Ultra-efficient (highest speed, lowest latency)',
		modalities: 'Text, Image, Video, Audio, PDF',
	},
	'gemini-2.5-flash-preview-tts': {
		name: 'Gemini 2.5 Flash TTS',
		description: 'Specialized Text-to-Speech model',
		modalities: 'Text → Audio',
	},
	'gemini-2.0-flash-exp': {
		name: 'Gemini 2.0 Flash Experimental',
		description: 'Experimental fast model',
		modalities: 'Text, Multimodal',
	},
	'gemini-1.5-pro': {
		name: 'Gemini 1.5 Pro',
		description: 'Previous generation pro model (proven stability)',
		modalities: 'Text, Multimodal',
	},
	'gemini-1.5-flash': {
		name: 'Gemini 1.5 Flash',
		description: 'Previous generation flash model',
		modalities: 'Text, Multimodal',
	},
	'gemini-1.0-pro': {
		name: 'Gemini 1.0 Pro',
		description: 'Original Gemini model (basic capabilities)',
		modalities: 'Text',
	},
};

export const modelsCommand = new Command('models')
	.description('List all available AI models and their capabilities')
	.option('-p, --provider <provider>', 'Filter by provider (gemini, openai, anthropic)')
	.option('-v, --verbose', 'Show detailed information')
	.action(async (options) => {
		console.log(chalk.cyan('\n🤖 Available AI Models\n'));

		const providers = options.provider
			? [options.provider]
			: Object.keys(PROVIDERS);

		for (const provider of providers) {
			const info = PROVIDERS[provider as keyof typeof PROVIDERS];
			if (!info) {
				console.log(chalk.red(`Unknown provider: ${provider}\n`));
				continue;
			}

			console.log(chalk.bold(`${info.name}:`));
			console.log(chalk.dim(`  Default Model: ${info.defaultModel}`));
			console.log(chalk.dim(`  Total Models: ${info.models.length}\n`));

			if (options.verbose || provider === 'gemini') {
				for (const model of info.models) {
					const modelInfo = GEMINI_MODEL_INFO[model];
					if (modelInfo) {
						console.log(chalk.cyan(`  ${model}`));
						console.log(chalk.dim(`    ${modelInfo.description}`));
						console.log(chalk.dim(`    Modalities: ${modelInfo.modalities}`));
					} else {
						console.log(chalk.cyan(`  ${model}`));
					}
				}
				console.log('');
			} else {
				console.log(chalk.dim('  Models:'));
				for (const model of info.models) {
					console.log(chalk.dim(`    • ${model}`));
				}
				console.log('');
			}
		}

		// Usage examples
		console.log(chalk.bold('Usage Examples:\n'));

		console.log(chalk.dim('  Single model chat:'));
		console.log(chalk.cyan('    $ polymind live --model gemini-3-pro-preview\n'));

		console.log(chalk.dim('  LLM Council with multiple Gemini models:'));
		console.log(chalk.cyan('    $ polymind council "Your question" \\\n'));
		console.log(chalk.cyan('        --gemini-key $GEMINI_API_KEY\n'));

		console.log(chalk.dim('  Custom council members:'));
		console.log(chalk.cyan('    $ polymind council "Your question" \\\n'));
		console.log(chalk.cyan('        --members \\\n'));
		console.log(chalk.cyan('          "Gemini 3 Pro:gemini:gemini-3-pro-preview" \\\n'));
		console.log(chalk.cyan('          "Gemini Flash:gemini:gemini-2.5-flash" \\\n'));
		console.log(chalk.cyan('        --chairman "Gemini 3 Pro"\n'));

		console.log(chalk.dim('\nFor more details, see: GEMINI_MODELS.md\n'));
	});
