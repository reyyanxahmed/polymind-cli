/**
 * RAG (Retrieval-Augmented Generation) Engine
 * Document indexing and semantic search for context injection
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Document {
	id: string;
	content: string;
	metadata: {
		path: string;
		type: string;
		size: number;
		lastModified: Date;
	};
	embedding?: number[];
}

export interface SearchResult {
	document: Document;
	score: number;
	relevance: 'high' | 'medium' | 'low';
}

export interface RAGStats {
	documentCount: number;
	totalSize: number;
	fileTypes: Record<string, number>;
}

export class RAGEngine {
	private documents: Document[] = [];
	private embeddingModel: any;
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
		const genAI = new GoogleGenerativeAI(apiKey);
		this.embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
	}

	/**
	 * Index a directory recursively
	 */
	async indexDirectory(
		dirPath: string,
		extensions: string[] = ['.txt', '.md', '.json', '.ts', '.tsx', '.js', '.jsx']
	): Promise<number> {
		let indexed = 0;

		const processDirectory = (path: string): void => {
			try {
				const entries = readdirSync(path);

				for (const entry of entries) {
					const fullPath = join(path, entry);
					const stats = statSync(fullPath);

					// Skip node_modules and hidden directories
					if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist') {
						continue;
					}

					if (stats.isDirectory()) {
						processDirectory(fullPath);
					} else if (stats.isFile()) {
						const ext = extname(entry);
						if (extensions.includes(ext)) {
							try {
								const content = readFileSync(fullPath, 'utf-8');
								this.indexDocument(fullPath, content);
								indexed++;
							} catch (error) {
								// Skip files we can't read
								console.warn(`Could not read ${fullPath}`);
							}
						}
					}
				}
			} catch (error) {
				console.warn(`Could not process directory ${path}`);
			}
		};

		processDirectory(dirPath);
		return indexed;
	}

	/**
	 * Index a single document
	 */
	indexDocument(path: string, content: string): void {
		const stats = statSync(path);

		const doc: Document = {
			id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
			content,
			metadata: {
				path,
				type: extname(path),
				size: stats.size,
				lastModified: stats.mtime,
			},
		};

		this.documents.push(doc);
	}

	/**
	 * Generate embeddings for all documents (batch processing)
	 */
	async generateEmbeddings(): Promise<void> {
		for (const doc of this.documents) {
			if (!doc.embedding) {
				// For now, use simple keyword-based indexing
				// In production, you'd use actual embeddings API
				doc.embedding = this.simpleEmbedding(doc.content);
			}
		}
	}

	/**
	 * Simple embedding fallback (keyword-based)
	 */
	private simpleEmbedding(text: string): number[] {
		// Very basic: convert text to frequency vector
		const words = text.toLowerCase().match(/\b\w+\b/g) || [];
		const freq: Record<string, number> = {};

		words.forEach(word => {
			freq[word] = (freq[word] || 0) + 1;
		});

		// Create a simple 128-dimensional vector
		const vector = new Array(128).fill(0);
		Object.entries(freq).forEach(([word, count], idx) => {
			vector[idx % 128] += count;
		});

		return vector;
	}

	/**
	 * Search for relevant documents
	 */
	async search(query: string, topK: number = 5): Promise<SearchResult[]> {
		if (this.documents.length === 0) {
			return [];
		}

		// Generate query embedding
		const queryEmbedding = this.simpleEmbedding(query);

		// Calculate similarities
		const results = this.documents
			.map(doc => {
				const embedding = doc.embedding || this.simpleEmbedding(doc.content);
				const similarity = this.cosineSimilarity(queryEmbedding, embedding);

				return {
					document: doc,
					score: similarity,
					relevance: (similarity > 0.7 ? 'high' : similarity > 0.4 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
				};
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, topK);

		return results;
	}

	/**
	 * Calculate cosine similarity between two vectors
	 */
	private cosineSimilarity(a: number[], b: number[]): number {
		if (a.length !== b.length) return 0;

		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < a.length; i++) {
			dotProduct += a[i] * b[i];
			normA += a[i] * a[i];
			normB += b[i] * b[i];
		}

		if (normA === 0 || normB === 0) return 0;

		return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
	}

	/**
	 * Get context for a query
	 */
	async getContext(query: string, maxChars: number = 4000): Promise<string> {
		const results = await this.search(query);

		let context = '';
		let charCount = 0;

		for (const result of results) {
			const docInfo = `\n\n--- Document: ${result.document.metadata.path} (Relevance: ${result.relevance}) ---\n${result.document.content}\n`;

			if (charCount + docInfo.length > maxChars) {
				break;
			}

			context += docInfo;
			charCount += docInfo.length;
		}

		return context;
	}

	/**
	 * Clear all indexed documents
	 */
	clearIndex(): void {
		this.documents = [];
	}

	/**
	 * Get statistics
	 */
	getStats(): RAGStats {
		const stats: RAGStats = {
			documentCount: this.documents.length,
			totalSize: 0,
			fileTypes: {},
		};

		this.documents.forEach(doc => {
			stats.totalSize += doc.metadata.size;
			const type = doc.metadata.type;
			stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
		});

		return stats;
	}
}
