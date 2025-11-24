#!/usr/bin/env node

/**
 * PolyMind CLI - Global Entry Point
 * Install globally: npm install -g @polymind/cli
 * Run: polymind debate "Should AI have rights?"
 */

import { Command } from 'commander';
import chalk from 'chalk';
import gradient from 'gradient-string';
import updateNotifier from 'update-notifier';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { debateCommand } from './commands/debate.js';
import { chatCommand } from './commands/chat.js';
import { interactiveCommand } from './commands/interactive.js';
import { configCommand } from './commands/config.js';
import { statusCommand } from './commands/status.js';
import { initCommand } from './commands/init.js';
import { personasCommand } from './commands/personas.js';
import { printBanner } from './ui/banner.js';
import { checkEnvironment } from './utils/env-check.js';
import { validateEnv, getSafeErrorMessage } from './utils/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// Check for updates
updateNotifier({ pkg }).notify();

const program = new Command();

program
  .name('polymind')
  .description(
    chalk.cyan('🎭 PolyMind - Multi-model AI council debates in your terminal')
  )
  .version(pkg.version, '-v, --version', 'Show version number')
  .helpOption('-h, --help', 'Show help')
  .addHelpText('before', printBanner(pkg.version))
  .addHelpText(
    'after',
    `
${chalk.dim('Examples:')}
  ${chalk.cyan('$')} polymind debate "Should we colonize Mars?"
  ${chalk.cyan('$')} polymind chat --persona explorer
  ${chalk.cyan('$')} polymind init --provider gemini
  ${chalk.cyan('$')} polymind status
  
${chalk.dim('Documentation:')} ${chalk.blue('https://polymind.ai/docs')}
${chalk.dim('Report issues:')} ${chalk.blue('https://github.com/reyyanxahmed/polymind/issues')}
    `
  );

// Add commands
program.addCommand(interactiveCommand); // Main interactive mode (like Gemini/Copilot)
program.addCommand(debateCommand);
program.addCommand(chatCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);
program.addCommand(initCommand);
program.addCommand(personasCommand);

// Global error handler with security
process.on('unhandledRejection', (error: Error) => {
  const safeMessage = getSafeErrorMessage(error);
  console.error(chalk.red('✗ Error:'), safeMessage);
  if (process.env.DEBUG === 'true') {
    console.error(chalk.dim('Debug info:'), error.stack);
  }
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  const safeMessage = getSafeErrorMessage(error);
  console.error(chalk.red('✗ Fatal error:'), safeMessage);
  if (process.env.DEBUG === 'true') {
    console.error(chalk.dim('Debug info:'), error.stack);
  }
  process.exit(1);
});

// Validate environment before running
const envCheck = validateEnv();
if (!envCheck.success) {
  console.error(chalk.red('✗ Environment validation failed:'));
  envCheck.errors?.forEach(err => console.error(chalk.yellow('  •'), err));
  console.error(chalk.dim('\\nRun'), chalk.cyan('polymind init'), chalk.dim('to configure'));
  process.exit(1);
}

checkEnvironment();

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
