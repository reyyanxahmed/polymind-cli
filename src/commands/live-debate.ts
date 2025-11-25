/**
 * Debate Command - Live multi-agent council debate
 */

import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import chalk from 'chalk';
import { config } from '../config/storage.js';
import { LiveDebateApp } from '../ui/apps/LiveDebateApp.js';

export const liveDebateCommand = new Command('debate')
	.description('Start a live multi-agent council debate')
	.argument('<query>', 'The question or topic to debate')
	.option('-r, --rounds <number>', 'Number of debate rounds', '3')
	.option('-m, --model <name>', 'AI model to use')
	.option('-p, --provider <name>', 'AI provider (gemini, openai, anthropic)')
	.action(async (query: string, options: any) => {
		try {
			const provider = options.provider || config.get('provider');
			const apiKey = config.get('apiKey');

			if (!apiKey) {
				console.error(chalk.red('✗ No API key configured'));
				console.log(chalk.dim('\nRun: ') + chalk.cyan('polymind init') + chalk.dim(' to set up'));
				process.exit(1);
			}

			const rounds = parseInt(options.rounds, 10);
			if (isNaN(rounds) || rounds < 1 || rounds > 5) {
				console.error(chalk.red('✗ Rounds must be between 1 and 5'));
				process.exit(1);
			}

			const { waitUntilExit } = render(
				React.createElement(LiveDebateApp, {
					query,
					apiKey,
					provider,
					model: options.model,
					rounds,
				})
			);

			await waitUntilExit();
		} catch (error) {
			console.error(chalk.red('✗ Failed to start debate'));
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});
