/**
 * Config Command - View and edit configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../config/storage.js';

export const configCommand = new Command('config')
  .description('View and manage configuration')
  .addCommand(
    new Command('get')
      .description('Get configuration value')
      .argument('[key]', 'Configuration key to get')
      .action((key?: string) => {
        if (key) {
          const value = config.get(key as any);
          console.log(chalk.cyan(key + ':'), value);
        } else {
          const all = config.getAll();
          console.log(chalk.cyan('\n⚙️  PolyMind Configuration:\n'));
          Object.entries(all).forEach(([k, v]) => {
            console.log(chalk.dim(k + ':'), v);
          });
          console.log(chalk.dim('\nConfig file:'), config.getPath());
        }
      })
  )
  .addCommand(
    new Command('set')
      .description('Set configuration value')
      .argument('<key>', 'Configuration key')
      .argument('<value>', 'Configuration value')
      .action((key: string, value: string) => {
        try {
          // Parse boolean and number values
          let parsedValue: any = value;
          if (value === 'true') parsedValue = true;
          else if (value === 'false') parsedValue = false;
          else if (!isNaN(Number(value))) parsedValue = Number(value);

          config.set(key as any, parsedValue);
          console.log(chalk.green('✓'), chalk.cyan(key), 'set to', parsedValue);
        } catch (error) {
          console.error(
            chalk.red('✗ Failed to set config:'),
            error instanceof Error ? error.message : String(error)
          );
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('reset')
      .description('Reset configuration to defaults')
      .action(() => {
        config.reset();
        console.log(chalk.green('✓ Configuration reset to defaults'));
      })
  )
  .addCommand(
    new Command('path')
      .description('Show configuration file path')
      .action(() => {
        console.log(config.getPath());
      })
  );
