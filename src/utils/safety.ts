/**
 * Safety utilities for detecting and preventing dangerous operations
 */

export interface SafetyCheck {
	isDangerous: boolean;
	reasons: string[];
	patterns: string[];
}

/**
 * Dangerous command patterns that require user confirmation
 */
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
	// Destructive file operations
	{ pattern: /rm\s+-rf/i, reason: 'Recursive force deletion' },
	{ pattern: /rm\s+.*--no-preserve-root/i, reason: 'Deletion without root protection' },
	{ pattern: />\s*\/dev\/sd[a-z]/i, reason: 'Direct disk write' },
	{ pattern: /dd\s+.*of=/i, reason: 'Direct disk dump' },

	// Privilege escalation
	{ pattern: /sudo/i, reason: 'Elevated privileges' },
	{ pattern: /su\s+/i, reason: 'User switching' },

	// Filesystem operations
	{ pattern: /mkfs/i, reason: 'Filesystem creation' },
	{ pattern: /fdisk/i, reason: 'Partition manipulation' },
	{ pattern: /parted/i, reason: 'Partition editing' },

	// Permission changes
	{ pattern: /chmod\s+777/i, reason: 'Insecure permissions' },
	{ pattern: /chmod\s+-R\s+777/i, reason: 'Recursive insecure permissions' },
	{ pattern: /chown\s+-R/i, reason: 'Recursive ownership change' },

	// Git destructive operations
	{ pattern: /git\s+push\s+.*--force/i, reason: 'Force push' },
	{ pattern: /git\s+push\s+.*-f\b/i, reason: 'Force push' },
	{ pattern: /git\s+reset\s+--hard/i, reason: 'Hard reset' },
	{ pattern: /git\s+clean\s+-[df]x/i, reason: 'Force clean' },
	{ pattern: /git\s+branch\s+-D/i, reason: 'Force delete branch' },

	// Package manager operations
	{ pattern: /npm\s+install\s+-g/i, reason: 'Global package installation' },
	{ pattern: /pip\s+install.*--break-system-packages/i, reason: 'System package override' },

	// Network operations
	{ pattern: /curl.*\|\s*bash/i, reason: 'Execute remote script' },
	{ pattern: /wget.*\|\s*bash/i, reason: 'Execute remote script' },
	{ pattern: /curl.*\|\s*sh/i, reason: 'Execute remote script' },

	// System modification
	{ pattern: /systemctl\s+disable/i, reason: 'Disable system service' },
	{ pattern: /systemctl\s+stop/i, reason: 'Stop system service' },
	{ pattern: /kill\s+-9/i, reason: 'Force kill process' },
	{ pattern: /pkill/i, reason: 'Kill processes by name' },

	// Archive extraction to root
	{ pattern: /tar.*-C\s*\//i, reason: 'Extract to root directory' },
	{ pattern: /unzip.*-d\s*\//i, reason: 'Extract to root directory' },
];

/**
 * Analyze a command for dangerous patterns
 */
export function checkCommandSafety(command: string): SafetyCheck {
	const reasons: string[] = [];
	const patterns: string[] = [];

	for (const { pattern, reason } of DANGEROUS_PATTERNS) {
		if (pattern.test(command)) {
			reasons.push(reason);
			patterns.push(pattern.source);
		}
	}

	return {
		isDangerous: reasons.length > 0,
		reasons,
		patterns,
	};
}

/**
 * Check if a file path is safe to write to
 */
export function checkFileWriteSafety(path: string): SafetyCheck {
	const reasons: string[] = [];
	const patterns: string[] = [];

	// Protect system directories
	const systemDirs = [
		'/bin',
		'/sbin',
		'/usr/bin',
		'/usr/sbin',
		'/etc',
		'/boot',
		'/sys',
		'/proc',
		'/dev',
	];

	for (const dir of systemDirs) {
		if (path.startsWith(dir)) {
			reasons.push(`Writing to system directory: ${dir}`);
			patterns.push(dir);
		}
	}

	// Protect important project files
	const protectedFiles = [
		'package.json',
		'package-lock.json',
		'tsconfig.json',
		'.gitignore',
		'.git/config',
	];

	for (const file of protectedFiles) {
		if (path.endsWith(file)) {
			reasons.push(`Modifying protected file: ${file}`);
			patterns.push(file);
		}
	}

	return {
		isDangerous: reasons.length > 0,
		reasons,
		patterns,
	};
}

/**
 * Format safety warning message
 */
export function formatSafetyWarning(check: SafetyCheck): string {
	if (!check.isDangerous) {
		return '';
	}

	const lines = [
		'⚠️  DANGER WARNING ⚠️',
		'',
		'This operation is potentially dangerous:',
		...check.reasons.map((r) => `  • ${r}`),
		'',
		'Please review carefully before proceeding.',
	];

	return lines.join('\n');
}

/**
 * Sanitize command for display (hide sensitive data)
 */
export function sanitizeCommand(command: string): string {
	// Hide API keys, tokens, passwords
	return command
		.replace(/api[_-]?key[=\s]+[^\s]+/gi, 'api_key=***')
		.replace(/token[=\s]+[^\s]+/gi, 'token=***')
		.replace(/password[=\s]+[^\s]+/gi, 'password=***')
		.replace(/secret[=\s]+[^\s]+/gi, 'secret=***')
		.replace(/Bearer\s+[^\s]+/gi, 'Bearer ***');
}

/**
 * Check if path is within project directory (prevent escaping)
 */
export function isPathSafe(path: string, projectRoot: string): boolean {
	// Resolve to absolute path and check if it starts with project root
	const { resolve } = require('node:path');
	const absolutePath = resolve(projectRoot, path);
	return absolutePath.startsWith(projectRoot);
}

/**
 * Get list of safe commands that don't require confirmation
 */
export const SAFE_COMMANDS = [
	'ls',
	'cd',
	'pwd',
	'cat',
	'less',
	'more',
	'head',
	'tail',
	'grep',
	'find',
	'echo',
	'date',
	'whoami',
	'which',
	'type',
	'git status',
	'git log',
	'git diff',
	'git branch',
	'npm list',
	'npm outdated',
	'npm search',
	'node --version',
	'npm --version',
	'git --version',
];

/**
 * Check if command is in safe list
 */
export function isSafeCommand(command: string): boolean {
	const normalized = command.trim().toLowerCase();
	return SAFE_COMMANDS.some(safe => normalized.startsWith(safe));
}
