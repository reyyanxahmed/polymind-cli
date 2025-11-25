/**
 * Live Command - Main interactive TUI with streaming
 */

import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { config } from '../config/storage.js';
import { LiveChatApp } from '../ui/apps/LiveChatApp.js';

export const liveCommand = new Command('live')
	.alias('l')
	.description('Start live streaming chat session (default mode)')
	.option('-m, --model <name>', 'AI model to use')
	.option('-p, --provider <name>', 'AI provider (gemini, openai, anthropic)')
	.option('--rag', 'Enable RAG (Retrieval-Augmented Generation)')
	.option('--no-rag', 'Disable RAG mode')
	.action(async (options) => {
		try {
			// Get configuration
			const provider = options.provider || config.get('provider');
			const apiKey = config.get('apiKey');

			if (!apiKey) {
				console.error(chalk.red('✗ No API key configured'));
				console.log(chalk.dim('\nRun: ') + chalk.cyan('polymind init') + chalk.dim(' to set up'));
				process.exit(1);
			}

			const model = options.model;
			const enableRAG = options.rag !== undefined ? options.rag : true;

			const { waitUntilExit } = render(
				React.createElement(LiveChatApp, {
					apiKey,
					provider,
					model,
					workingDirectory: process.cwd(),
					enableRAG,
				})
			);

			await waitUntilExit();
		} catch (error) {
			console.error(chalk.red('✗ Failed to start live chat'));
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});
