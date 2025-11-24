/**
 * Debate Command - Start a multi-agent council debate
 */

import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import chalk from 'chalk';
import ora from 'ora';
import { config } from '../config/storage.js';
import { DebateApp } from '../ui/apps/DebateApp.js';
import { randomLoadingMessage, randomQuote } from '../ui/quotes.js';

export const debateCommand = new Command('debate')
  .description('Start a multi-model AI council debate')
  .argument('<query>', 'The question or topic to debate')
  .option('-r, --rounds <number>', 'Number of debate rounds', '3')
  .option('-p, --personas <names...>', 'Specific personas to include')
  .option('--no-streaming', 'Disable streaming responses')
  .option('--no-quirks', 'Disable personality quirks and quotes')
  .action(async (query: string, options) => {
    const spinner = ora({
      text: chalk.cyan(randomLoadingMessage()),
      spinner: 'dots',
    }).start();

    try {
      // Validate configuration
      const provider = config.get('provider');
      if (!config.has('apiKey')) {
        spinner.fail(chalk.red('No API key configured'));
        console.log(
          chalk.dim('\nRun: ') + chalk.cyan('polymind init') + chalk.dim(' to set up')
        );
        process.exit(1);
      }

      const rounds = parseInt(options.rounds, 10);
      if (isNaN(rounds) || rounds < 1 || rounds > 10) {
        spinner.fail(chalk.red('Rounds must be between 1 and 10'));
        process.exit(1);
      }

      spinner.succeed(chalk.green('Council assembled!'));

      // Show random quote if quirks enabled
      if (options.quirks && config.get('quirks')) {
        console.log(chalk.dim(`\n"${randomQuote()}"\n`));
      }

      // Render the debate UI
      const { waitUntilExit } = render(
        React.createElement(DebateApp, {
          query,
          rounds,
          personas: options.personas,
          streaming: options.streaming,
          quirks: options.quirks,
        })
      );

      await waitUntilExit();
    } catch (error) {
      spinner.fail(chalk.red('Failed to start debate'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
