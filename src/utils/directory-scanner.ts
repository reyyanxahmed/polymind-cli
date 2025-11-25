import { readdir, stat } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

export interface DirectoryNode {
	name: string;
	path: string;
	type: 'file' | 'directory';
	size?: number;
	children?: DirectoryNode[];
}

export interface ScanStats {
	totalFiles: number;
	totalDirectories: number;
	totalSize: number;
	depth: number;
	excluded: number;
}

export interface ScanOptions {
	maxDepth?: number;
	maxFiles?: number;
	maxFileSize?: number;
	excludePatterns?: string[];
	includeHidden?: boolean;
}

export interface ScanResult {
	tree: DirectoryNode;
	stats: ScanStats;
}

/**
 * Default exclusion patterns for common build artifacts and dependencies
 */
const DEFAULT_EXCLUDES = [
	'node_modules',
	'.git',
	'dist',
	'build',
	'.next',
	'out',
	'__pycache__',
	'.pytest_cache',
	'.venv',
	'venv',
	'env',
	'.env',
	'coverage',
	'.nyc_output',
	'.turbo',
	'.vercel',
	'.cache',
	'*.log',
	'.DS_Store',
	'Thumbs.db',
	'.idea',
	'.vscode',
	'*.pyc',
	'*.pyo',
	'*.pyd',
	'.Python',
	'pip-log.txt',
	'*.swp',
	'*.swo',
	'*~',
];

/**
 * Scan directory and build a JSON tree representation
 */
export async function scanDirectory(rootPath: string, options: ScanOptions = {}): Promise<ScanResult> {
	const opts: Required<ScanOptions> = {
		maxDepth: options.maxDepth ?? 10,
		maxFiles: options.maxFiles ?? 1000,
		maxFileSize: options.maxFileSize ?? 1024 * 1024, // 1MB
		excludePatterns: options.excludePatterns ?? DEFAULT_EXCLUDES,
		includeHidden: options.includeHidden ?? false,
	};

	const stats: ScanStats = {
		totalFiles: 0,
		totalDirectories: 0,
		totalSize: 0,
		depth: 0,
		excluded: 0,
	};

	const tree = await scanNode(rootPath, rootPath, 0, opts, stats);

	return { tree, stats };
}

/**
 * Recursively scan a file or directory node
 */
async function scanNode(
	nodePath: string,
	rootPath: string,
	depth: number,
	options: Required<ScanOptions>,
	stats: ScanStats
): Promise<DirectoryNode> {
	const name = basename(nodePath);
	const relativePath = relative(rootPath, nodePath) || '.';

	// Check if we've reached max depth
	if (depth > options.maxDepth) {
		stats.excluded++;
		return {
			name,
			path: relativePath,
			type: 'directory',
			children: [],
		};
	}

	// Check if we've reached max files
	if (stats.totalFiles >= options.maxFiles) {
		stats.excluded++;
		return {
			name,
			path: relativePath,
			type: 'file',
		};
	}

	// Get file/directory stats
	const fileStat = await stat(nodePath);

	// Update depth tracker
	stats.depth = Math.max(stats.depth, depth);

	// Handle files
	if (fileStat.isFile()) {
		stats.totalFiles++;
		stats.totalSize += fileStat.size;

		// Exclude files over size limit
		if (fileStat.size > options.maxFileSize) {
			stats.excluded++;
			return {
				name,
				path: relativePath,
				type: 'file',
				size: fileStat.size,
			};
		}

		return {
			name,
			path: relativePath,
			type: 'file',
			size: fileStat.size,
		};
	}

	// Handle directories
	if (fileStat.isDirectory()) {
		stats.totalDirectories++;

		// Check if directory should be excluded
		if (shouldExclude(name, options)) {
			stats.excluded++;
			return {
				name,
				path: relativePath,
				type: 'directory',
				children: [],
			};
		}

		// Check if hidden and should be excluded
		if (!options.includeHidden && name.startsWith('.')) {
			stats.excluded++;
			return {
				name,
				path: relativePath,
				type: 'directory',
				children: [],
			};
		}

		// Read directory contents
		try {
			const entries = await readdir(nodePath);
			const children: DirectoryNode[] = [];

			for (const entry of entries) {
				const entryPath = join(nodePath, entry);

				// Skip hidden files if not included
				if (!options.includeHidden && entry.startsWith('.')) {
					stats.excluded++;
					continue;
				}

				// Skip excluded patterns
				if (shouldExclude(entry, options)) {
					stats.excluded++;
					continue;
				}

				try {
					const childNode = await scanNode(entryPath, rootPath, depth + 1, options, stats);
					children.push(childNode);
				} catch (error) {
					// Skip files/directories that can't be read (permission errors, etc.)
					stats.excluded++;
				}
			}

			// Sort children: directories first, then files, both alphabetically
			children.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === 'directory' ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			});

			return {
				name,
				path: relativePath,
				type: 'directory',
				children,
			};
		} catch (error) {
			// Can't read directory
			stats.excluded++;
			return {
				name,
				path: relativePath,
				type: 'directory',
				children: [],
			};
		}
	}

	// Handle other file types (symlinks, etc.) - treat as files
	return {
		name,
		path: relativePath,
		type: 'file',
	};
}

/**
 * Check if a file/directory name should be excluded
 */
function shouldExclude(name: string, options: Required<ScanOptions>): boolean {
	for (const pattern of options.excludePatterns) {
		// Handle wildcard patterns
		if (pattern.includes('*')) {
			const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
			if (regex.test(name)) {
				return true;
			}
		} else {
			// Exact match
			if (name === pattern) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Format directory tree as a visual string (tree command style)
 */
export function formatTree(node: DirectoryNode, prefix: string = '', isLast: boolean = true): string {
	const lines: string[] = [];

	// Current node
	const connector = isLast ? '└── ' : '├── ';
	const typeIcon = node.type === 'directory' ? '📁' : '📄';
	const sizeInfo = node.size ? ` (${formatSize(node.size)})` : '';

	lines.push(`${prefix}${connector}${typeIcon} ${node.name}${sizeInfo}`);

	// Children
	if (node.children && node.children.length > 0) {
		const childPrefix = prefix + (isLast ? '    ' : '│   ');

		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			const childIsLast = i === node.children.length - 1;
			lines.push(formatTree(child, childPrefix, childIsLast));
		}
	}

	return lines.join('\n');
}

/**
 * Format file size in human-readable format
 */
function formatSize(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB'];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(1)}${units[unitIndex]}`;
}

/**
 * Get flat list of all files in tree (useful for searching)
 */
export function flattenTree(node: DirectoryNode): DirectoryNode[] {
	const files: DirectoryNode[] = [];

	if (node.type === 'file') {
		files.push(node);
	}

	if (node.children) {
		for (const child of node.children) {
			files.push(...flattenTree(child));
		}
	}

	return files;
}

/**
 * Search for files matching a pattern in the tree
 */
export function searchTree(node: DirectoryNode, pattern: string): DirectoryNode[] {
	const regex = new RegExp(pattern, 'i');
	const matches: DirectoryNode[] = [];

	function search(n: DirectoryNode): void {
		if (regex.test(n.name)) {
			matches.push(n);
		}

		if (n.children) {
			for (const child of n.children) {
				search(child);
			}
		}
	}

	search(node);
	return matches;
}
