import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { CouncilApp } from '../ui/apps/CouncilApp.js';
import { config } from '../config/storage.js';
import chalk from 'chalk';

interface CouncilMember {
	id: string;
	name: string;
	provider: 'gemini' | 'openai' | 'anthropic' | 'xai';
	model: string;
	apiKey: string;
	role?: 'chairman';
}

export const councilCommand = new Command('council')
	.description('Query the LLM Council for collaborative AI responses')
	.argument('<query>', 'Question to ask the council')
	.option('-m, --members <members...>', 'Council members (format: name:provider:model)', [])
	.option('-c, --chairman <chairman>', 'Designated chairman (member name)')
	.option('--gemini-deep', 'Use Gemini Deep Reasoning Council preset (requires GEMINI_API_KEY)')
	.option('--gemini-key <key>', 'Gemini API key (or use GEMINI_API_KEY env var)')
	.option('--openai-key <key>', 'OpenAI API key (or use OPENAI_API_KEY env var)')
	.option('--anthropic-key <key>', 'Anthropic API key (or use ANTHROPIC_API_KEY env var)')
	.option('--xai-key <key>', 'xAI API key (or use XAI_API_KEY env var)')
	.action(async (query: string, options: any) => {
		// Get API keys from options or environment
		const geminiKey =
			options.geminiKey ||
			process.env.GEMINI_API_KEY ||
			config.get('apiKey');
		const openaiKey = options.openaiKey || process.env.OPENAI_API_KEY;
		const anthropicKey = options.anthropicKey || process.env.ANTHROPIC_API_KEY;
		const xaiKey = options.xaiKey || process.env.XAI_API_KEY;

		// Build council members
		let members: CouncilMember[] = [];

		// Handle Gemini Deep preset
		if (options.geminiDeep) {
			if (!geminiKey) {
				console.error(chalk.red('✗ Gemini Deep preset requires GEMINI_API_KEY'));
				console.log(
					chalk.dim('\nSet your API key:\n') +
						chalk.cyan('  export GEMINI_API_KEY="your-key"\n') +
						chalk.dim('Or use:\n') +
						chalk.cyan('  polymind council "query" --gemini-key "your-key" --gemini-deep')
				);
				process.exit(1);
			}

			// Build Gemini Deep Reasoning Council
			members = [
				{
					id: 'gemini-3-pro-chairman',
					name: 'Gemini 3 Pro (Chairman)',
					provider: 'gemini',
					model: 'gemini-3-pro-preview',
					apiKey: geminiKey,
					role: 'chairman',
				},
				{
					id: 'gemini-3-pro-member',
					name: 'Gemini 3 Pro',
					provider: 'gemini',
					model: 'gemini-3-pro-preview',
					apiKey: geminiKey,
				},
				{
					id: 'gemini-2.5-pro',
					name: 'Gemini 2.5 Pro',
					provider: 'gemini',
					model: 'gemini-2.5-pro',
					apiKey: geminiKey,
				},
				{
					id: 'gemini-2.5-flash',
					name: 'Gemini 2.5 Flash',
					provider: 'gemini',
					model: 'gemini-2.5-flash',
					apiKey: geminiKey,
				},
			];

			// Allow chairman override
			if (options.chairman) {
				const newChairman = members.find((m) => m.name === options.chairman);
				if (newChairman) {
					// Remove chairman role from all
					members.forEach((m) => delete m.role);
					// Set new chairman
					newChairman.role = 'chairman';
				} else {
					console.error(
						chalk.yellow(
							`⚠ Chairman "${options.chairman}" not found in Gemini Deep preset. Using default.`
						)
					);
				}
			}
		} else if (options.members.length === 0) {
			// Default council: Use available API keys with latest models
			if (geminiKey) {
				members.push({
					id: 'gemini-3-pro',
					name: 'Gemini 3 Pro',
					provider: 'gemini',
					model: 'gemini-3-pro-preview',
					apiKey: geminiKey,
				});
				// Add a second Gemini member with different model for diversity
				members.push({
					id: 'gemini-flash',
					name: 'Gemini 2.5 Flash',
					provider: 'gemini',
					model: 'gemini-2.5-flash',
					apiKey: geminiKey,
				});
			}
			if (openaiKey) {
				members.push({
					id: 'gpt4-turbo',
					name: 'GPT-4 Turbo',
					provider: 'openai',
					model: 'gpt-4-turbo',
					apiKey: openaiKey,
				});
			}
			if (anthropicKey) {
				members.push({
					id: 'claude-sonnet',
					name: 'Claude Sonnet',
					provider: 'anthropic',
					model: 'claude-3-sonnet',
					apiKey: anthropicKey,
				});
			}
			if (xaiKey) {
				members.push({
					id: 'grok-2',
					name: 'Grok 2',
					provider: 'xai',
					model: 'grok-2',
					apiKey: xaiKey,
				});
			}

			if (members.length === 0) {
				console.error(chalk.red('✗ No API keys found. Please provide at least one API key.'));
				console.log(
					chalk.dim('\nOptions:\n') +
						chalk.cyan('  --gemini-key <key>\n') +
						chalk.cyan('  --openai-key <key>\n') +
						chalk.cyan('  --anthropic-key <key>\n') +
						chalk.cyan('  --xai-key <key>\n\n') +
						chalk.dim('Or set environment variables:\n') +
						chalk.cyan('  GEMINI_API_KEY\n') +
						chalk.cyan('  OPENAI_API_KEY\n') +
						chalk.cyan('  ANTHROPIC_API_KEY\n') +
						chalk.cyan('  XAI_API_KEY')
				);
				process.exit(1);
			}
		} else {
			// Parse custom members from CLI
			for (const memberStr of options.members) {
				const [name, provider, model] = memberStr.split(':');
				let apiKey = '';

				if (provider === 'gemini') apiKey = geminiKey || '';
				else if (provider === 'openai') apiKey = openaiKey || '';
				else if (provider === 'anthropic') apiKey = anthropicKey || '';
				else if (provider === 'xai') apiKey = xaiKey || '';

				if (!apiKey) {
					console.error(chalk.red(`✗ No API key found for provider: ${provider}`));
					process.exit(1);
				}

				members.push({
					id: `${provider}-${model.replace(/\./g, '-')}`,
					name,
					provider: provider as any,
					model,
					apiKey,
				});
			}
		}

		// Designate chairman (skip if already set by preset)
		const hasChairman = members.some((m) => m.role === 'chairman');
		if (!hasChairman) {
			const chairmanName = options.chairman || members[0].name;
			const chairmanMember = members.find((m) => m.name === chairmanName);

			if (chairmanMember) {
				chairmanMember.role = 'chairman';
			} else {
				console.error(chalk.red(`✗ Chairman not found: ${chairmanName}`));
				process.exit(1);
			}
		}

		// Get chairman member for display
		const chairmanMember = members.find((m) => m.role === 'chairman');

		// Validate we have at least 2 non-chairman members
		const regularMembers = members.filter((m) => m.role !== 'chairman');
		if (regularMembers.length < 2) {
			console.error(chalk.red('✗ Council requires at least 2 regular members (plus 1 chairman)'));
			console.log(
				chalk.dim('Current setup: ' + regularMembers.length + ' member(s) + 1 chairman')
			);
			process.exit(1);
		}

		// Show council composition
		console.log(chalk.cyan('\n🏛️  LLM Council Composition:\n'));

		if (options.geminiDeep) {
			console.log(chalk.bold.yellow('Preset: Gemini Deep Reasoning Council'));
			console.log('');
		}

		console.log(chalk.bold('Council Members:'));
		for (const member of regularMembers) {
			console.log(
				chalk.dim('  •') +
					` ${member.name} ${chalk.dim(`(${member.provider}/${member.model})`)}`
			);
		}

		console.log(chalk.bold('\nChairman:'));
		console.log(
			chalk.dim('  👑') +
				` ${chairmanMember?.name} ${chalk.dim(`(${chairmanMember?.provider}/${chairmanMember?.model})`)}`
		);

		console.log(
			chalk.dim(
				'\n📊 Stage 1: First Opinions → Stage 2: Peer Review → Stage 3: Chairman Synthesis\n'
			)
		);

		// Launch TUI
		const { waitUntilExit } = render(React.createElement(CouncilApp, { members, query }));
		await waitUntilExit();
	});
