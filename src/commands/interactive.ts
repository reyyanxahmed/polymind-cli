/**
 * Interactive Chat Command - Gemini/Copilot-style interface
 * Activates persistent TUI with slash commands
 */

import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { InteractiveChatApp } from '../ui/apps/InteractiveChatApp.js';

export const interactiveCommand = new Command('interactive')
  .alias('i')
  .description('Start interactive chat session with slash commands')
  .option('-p, --persona <name>', 'Start with specific persona')
  .option('--no-quirks', 'Disable personality features')
  .action(async (options) => {
    const { waitUntilExit } = render(
      React.createElement(InteractiveChatApp, {
        initialPersona: options.persona,
        quirksEnabled: options.quirks,
      })
    );
    await waitUntilExit();
  });
