/**
 * Status Command - Show system status and statistics
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../config/storage.js';

export const statusCommand = new Command('status')
  .description('Show PolyMind system status')
  .action(async () => {
    console.log(chalk.cyan('\n📊 PolyMind Status\n'));

    // System Info
    console.log(chalk.bold('System:'));
    console.log(
      chalk.dim('  Node:'),
      process.versions.node,
      chalk.green('✓')
    );
    console.log(chalk.dim('  Platform:'), process.platform);
    console.log(chalk.dim('  Arch:'), process.arch);

    // Configuration
    console.log(chalk.bold('\nConfiguration:'));
    const cfg = config.getAll();
    console.log(chalk.dim('  Provider:'), cfg.provider);
    console.log(
      chalk.dim('  API Key:'),
      cfg.apiKey ? chalk.green('✓ Configured') : chalk.red('✗ Missing')
    );
    console.log(chalk.dim('  Theme:'), cfg.theme);
    console.log(chalk.dim('  Streaming:'), cfg.streaming ? 'Enabled' : 'Disabled');
    console.log(chalk.dim('  Animations:'), cfg.animations ? 'Enabled' : 'Disabled');
    console.log(chalk.dim('  Quirks:'), cfg.quirks ? 'Enabled' : 'Disabled');

    // Environment
    console.log(chalk.bold('\nEnvironment:'));
    console.log(
      chalk.dim('  GEMINI_API_KEY:'),
      process.env.GEMINI_API_KEY ? chalk.green('✓ Set') : chalk.yellow('○ Not set')
    );
    console.log(chalk.dim('  DEBUG:'), process.env.DEBUG || 'false');

    // Paths
    console.log(chalk.bold('\nPaths:'));
    console.log(chalk.dim('  Config:'), config.getPath());

    console.log('');
  });
