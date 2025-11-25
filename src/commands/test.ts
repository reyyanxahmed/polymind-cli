import { Command } from 'commander';
import { loadPolymindContext, getContextSummary } from '../config/polymind-loader.js';
import { scanDirectory, formatTree } from '../utils/directory-scanner.js';
import { ToolExecutor } from '../tools/index.js';

/**
 * Test command to verify polymind.md loading and directory scanning
 */
export const testCommand = new Command('test')
	.description('Test polymind.md loading and directory scanning')
	.option('-d, --dir <directory>', 'Directory to scan', '.')
	.option('-t, --tree', 'Display directory tree')
	.option('-c, --context', 'Display polymind.md context')
	.option('--tools', 'Test tool execution')
	.action(async (options) => {
		console.log('🧪 Polymind CLI Test Suite\n');

		// Test 1: Load polymind.md context
		if (options.context || !options.tree) {
			console.log('📄 Testing polymind.md loader...');
			try {
				const context = await loadPolymindContext(options.dir);
				if (context) {
					console.log('✅ Context loaded successfully!\n');
					console.log(getContextSummary(context));
				} else {
					console.log('⚠️  No polymind.md found in current directory or parent directories');
				}
			} catch (error) {
				console.error('❌ Failed to load context:', error);
			}
			console.log('');
		}

		// Test 2: Scan directory
		if (options.tree || !options.context) {
			console.log('📁 Testing directory scanner...');
			try {
				const result = await scanDirectory(options.dir, {
					maxDepth: 3,
					maxFiles: 100,
				});

				console.log('✅ Directory scanned successfully!\n');
				console.log('Statistics:');
				console.log(`  Files: ${result.stats.totalFiles}`);
				console.log(`  Directories: ${result.stats.totalDirectories}`);
				console.log(`  Max Depth: ${result.stats.depth}`);
				console.log(`  Excluded: ${result.stats.excluded}`);
				console.log(`  Total Size: ${(result.stats.totalSize / 1024 / 1024).toFixed(2)} MB\n`);

				if (options.tree) {
					console.log('Directory Tree:');
					console.log(formatTree(result.tree));
				}
			} catch (error) {
				console.error('❌ Failed to scan directory:', error);
			}
			console.log('');
		}

		// Test 3: Tool execution
		if (options.tools) {
			console.log('🔧 Testing tool system...');
			try {
				const executor = new ToolExecutor({
					workingDirectory: process.cwd(),
				});

				// Test file read tool
				console.log('\n1. Testing file_read tool...');
				const readResult = await executor.executeTool('file_read', {
					path: 'package.json',
				});

				if (readResult.success) {
					const data = readResult.data as string;
					console.log('✅ Successfully read package.json');
					console.log(`   Size: ${data.length} bytes`);
				} else {
					console.log('❌ Failed:', readResult.error);
				}

				// Test directory tree tool
				console.log('\n2. Testing directory_tree tool...');
				const treeResult = await executor.executeTool('directory_tree', {
					path: '.',
					maxDepth: 2,
					format: 'json',
				});

				if (treeResult.success) {
					console.log('✅ Successfully generated directory tree');
					console.log('   Stats:', JSON.stringify(treeResult.metadata?.stats, null, 2));
				} else {
					console.log('❌ Failed:', treeResult.error);
				}

				// Test file search tool
				console.log('\n3. Testing file_search tool...');
				const searchResult = await executor.executeTool('file_search', {
					pattern: 'import',
					directory: 'src',
					filePattern: '*.ts',
				});

				if (searchResult.success) {
					const matches = searchResult.data as any[];
					console.log(`✅ Found ${matches.length} matches`);
					if (matches.length > 0) {
						console.log(`   First match: ${matches[0].file}:${matches[0].line}`);
					}
				} else {
					console.log('❌ Failed:', searchResult.error);
				}

				// List all available tools
				console.log('\n4. Available tools:');
				const tools = executor.getAllTools();
				for (const tool of tools) {
					console.log(`   • ${tool.name}: ${tool.description}`);
				}
			} catch (error) {
				console.error('❌ Tool system error:', error);
			}
			console.log('');
		}

		console.log('✨ Test complete!\n');
	});
