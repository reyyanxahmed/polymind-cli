/**
 * Init Command - Initial setup wizard
 */

import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import chalk from 'chalk';
import { InitWizard } from '../ui/apps/InitWizard.js';

export const initCommand = new Command('init')
  .description('Initialize PolyMind CLI configuration')
  .option('--provider <name>', 'LLM provider (gemini, claude, gpt, ollama)')
  .option('--api-key <key>', 'API key for the provider')
  .action(async (options) => {
    console.log(chalk.cyan('\n🎭 Welcome to PolyMind CLI Setup!\n'));

    const { waitUntilExit } = render(
      React.createElement(InitWizard, {
        initialProvider: options.provider,
        initialApiKey: options.apiKey,
      })
    );

    await waitUntilExit();
  });
