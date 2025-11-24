/**
 * Premium ASCII Banner with Gradient
 */

import gradient from 'gradient-string';
import chalk from 'chalk';

const BANNER = `
 ██████╗  ██████╗ ██╗  ██╗   ██╗███╗   ███╗██╗███╗   ██╗██████╗ 
 ██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝████╗ ████║██║████╗  ██║██╔══██╗
 ██████╔╝██║   ██║██║   ╚████╔╝ ██╔████╔██║██║██╔██╗ ██║██║  ██║
 ██╔═══╝ ██║   ██║██║    ╚██╔╝  ██║╚██╔╝██║██║██║╚██╗██║██║  ██║
 ██║     ╚██████╔╝███████╗██║   ██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
 ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ 
`;

const TAGLINE = 'Multi-Model AI Council Deliberation Platform';

export function printBanner(version: string): string {
  const coloredBanner = gradient.rainbow.multiline(BANNER);
  const tagline = chalk.dim(TAGLINE);
  const versionLine = chalk.gray(`v${version} | Built with ♥ by PolyMind Team`);
  
  return `\n${coloredBanner}\n${' '.repeat(18)}${tagline}\n${' '.repeat(22)}${versionLine}\n`;
}

export function printMiniBanner(): string {
  return gradient.pastel.multiline('🎭 PolyMind Council');
}
