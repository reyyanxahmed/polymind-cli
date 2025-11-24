/**
 * Chat Command - Direct one-on-one chat with a persona
 */

import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import chalk from 'chalk';
import ora from 'ora';
import { config } from '../config/storage.js';
import { ChatApp } from '../ui/apps/ChatApp.js';

export const chatCommand = new Command('chat')
  .description('Chat directly with an AI persona')
  .option('-p, --persona <name>', 'Persona to chat with', 'explorer')
  .option('--no-streaming', 'Disable streaming responses')
  .action(async (options) => {
    const spinner = ora({
      text: chalk.cyan('Connecting to persona...'),
      spinner: 'dots',
    }).start();

    try {
      if (!config.has('apiKey')) {
        spinner.fail(chalk.red('No API key configured'));
        console.log(
          chalk.dim('\nRun: ') + chalk.cyan('polymind init') + chalk.dim(' to set up')
        );
        process.exit(1);
      }

      spinner.succeed(chalk.green(`Connected to ${options.persona}!`));

      const { waitUntilExit } = render(
        React.createElement(ChatApp, {
          persona: options.persona,
          streaming: options.streaming,
        })
      );

      await waitUntilExit();
    } catch (error) {
      spinner.fail(chalk.red('Failed to start chat'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
