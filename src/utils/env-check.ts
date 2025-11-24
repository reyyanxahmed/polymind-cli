/**
 * Environment Validation
 */

import chalk from 'chalk';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export function checkEnvironment(): void {
  // Check Node version
  const nodeVersion = process.versions.node;
  const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
  
  if (majorVersion < 18) {
    console.error(
      chalk.red('✗ Error: Node.js 18.17.0 or higher is required.')
    );
    console.error(
      chalk.dim(`  Current version: ${nodeVersion}`)
    );
    console.error(
      chalk.dim('  Update: https://nodejs.org/')
    );
    process.exit(1);
  }
}

export function hasApiKey(provider: string = 'gemini'): boolean {
  const envKey = provider === 'gemini' ? 'GEMINI_API_KEY' : 'API_KEY';
  return !!process.env[envKey];
}

export function getConfigPath(): string {
  return join(homedir(), '.polymind', 'config.json');
}

export function isConfigured(): boolean {
  return existsSync(getConfigPath());
}
