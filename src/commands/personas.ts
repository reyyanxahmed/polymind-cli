/**
 * Personas Command - Manage AI personas
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { render } from 'ink';
import React from 'react';
import { PersonaList } from '../ui/apps/PersonaList.js';

export const personasCommand = new Command('personas')
  .alias('persona')
  .description('Manage AI personas')
  .addCommand(
    new Command('list')
      .description('List all available personas')
      .action(async () => {
        const { waitUntilExit } = render(React.createElement(PersonaList));
        await waitUntilExit();
      })
  )
  .addCommand(
    new Command('info')
      .description('Show detailed persona information')
      .argument('<name>', 'Persona name')
      .action((name: string) => {
        console.log(chalk.cyan(`\n📋 Persona: ${name}\n`));
        console.log(chalk.dim('Use:'), chalk.cyan(`polymind chat --persona ${name}`));
      })
  );
