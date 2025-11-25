/**
 * Live Chat Application - Real-time streaming TUI
 * Inspired by Gemini CLI with advanced features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { StreamingClient } from '../../core/streaming-client.js';
import { RAGEngine } from '../../core/rag-engine.js';
import {
	executeSlashCommand,
	getCommandSuggestions,
} from '../../utils/slash-commands.js';
import { randomQuote, randomThinkingPhrase } from '../quotes.js';

interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
	model?: string;
	metadata?: any;
}

interface LiveChatAppProps {
	apiKey: string;
	provider: string;
	model?: string;
	workingDirectory?: string;
	enableRAG?: boolean;
}

export const LiveChatApp = ({
	apiKey,
	provider,
	model,
	workingDirectory = process.cwd(),
	enableRAG = false,
}: LiveChatAppProps) => {
	const { exit } = useApp();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [isStreaming, setIsStreaming] = useState(false);
	const [currentStreamText, setCurrentStreamText] = useState('');
	const [sessionId] = useState(() => nanoid());
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [thinkingPhrase, setThinkingPhrase] = useState('');
	const [ragEnabled, setRagEnabled] = useState(enableRAG);
	const [ragStats, setRagStats] = useState('');

	const clientRef = useRef<StreamingClient | null>(null);
	const ragEngineRef = useRef<RAGEngine | null>(null);
	const currentStreamIdRef = useRef<string | null>(null);

	// Initialize clients
	useEffect(() => {
		clientRef.current = new StreamingClient(provider, apiKey, model);

		if (enableRAG) {
			ragEngineRef.current = new RAGEngine(apiKey);
			// Index current directory
			ragEngineRef.current.indexDirectory(workingDirectory).then(count => {
				const stats = ragEngineRef.current!.getStats();
				setRagStats(`📚 Indexed ${count} files (${Math.round(stats.totalSize / 1024)}KB)`);
			});
		}

		// Welcome message
		const welcomeMsg: Message = {
			id: nanoid(),
			role: 'system',
			content: `${randomQuote()}\n\n🎭 Welcome to PolyMind Live Chat!\n\nType your message or use slash commands:\n/help - Show commands\n/rag - Toggle RAG mode\n/model - Switch model\n/clear - Clear history\n/exit - Quit`,
			timestamp: new Date(),
		};
		setMessages([welcomeMsg]);
	}, [apiKey, provider, model, workingDirectory, enableRAG]);

	// Update command suggestions
	useEffect(() => {
		if (input.startsWith('/')) {
			const sugg = getCommandSuggestions(input);
			setSuggestions(sugg);
		} else {
			setSuggestions([]);
		}
	}, [input]);

	// Handle streaming response
	const handleStreamingResponse = useCallback(
		async (userMessage: string) => {
			const client = clientRef.current;
			if (!client) return;

			setIsStreaming(true);
			setCurrentStreamText('');
			setThinkingPhrase(randomThinkingPhrase());

			const streamId = nanoid();
			currentStreamIdRef.current = streamId;

			// Add RAG context if enabled
			let augmentedMessage = userMessage;
			if (ragEnabled && ragEngineRef.current) {
				try {
					const context = await ragEngineRef.current.getContext(userMessage);
					if (context) {
						augmentedMessage = `Context from indexed documents:\n${context}\n\nUser question: ${userMessage}`;
					}
				} catch (error) {
					console.error('RAG context error:', error);
				}
			}

			try {
				let fullResponse = '';
				for await (const chunk of client.streamChat(augmentedMessage)) {
					// Check if this stream was cancelled
					if (currentStreamIdRef.current !== streamId) {
						break;
					}

					fullResponse += chunk.text;
					setCurrentStreamText(fullResponse);

					if (chunk.done) {
						// Finalize the message
					const assistantMsg: Message = {
						id: nanoid(),
						role: 'assistant',
						content: fullResponse,
						timestamp: new Date(),
						model: clientRef.current?.getCurrentModel()?.name || 'Unknown',
						metadata: chunk.usage,
					};
						setMessages(prev => [...prev, assistantMsg]);
						setCurrentStreamText('');
						setIsStreaming(false);
						setThinkingPhrase('');
					}
				}
			} catch (error) {
				const errorMsg: Message = {
					id: nanoid(),
					role: 'system',
					content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
					timestamp: new Date(),
				};
				setMessages(prev => [...prev, errorMsg]);
				setIsStreaming(false);
				setCurrentStreamText('');
				setThinkingPhrase('');
			}

			setIsProcessing(false);
		},
		[ragEnabled]
	);

	// Handle user input
	const handleSubmit = useCallback(
		async (value: string) => {
			if (!value.trim() || isProcessing) return;

			const userMsg: Message = {
				id: nanoid(),
				role: 'user',
				content: value,
				timestamp: new Date(),
			};

			setMessages(prev => [...prev, userMsg]);
			setInput('');
			setIsProcessing(true);

			// Handle slash commands
			if (value.startsWith('/')) {
				const context = {
					messages: messages.map(m => ({ role: m.role, content: m.content })),
					currentPersona: 'assistant',
					settings: { quirksEnabled: true },
					sessionId,
				};

				const result = await executeSlashCommand(value, context);

				if (result.success) {
					// Handle special commands
					if (result.data?.type === 'exit') {
						const byeMsg: Message = {
							id: nanoid(),
							role: 'system',
							content: '👋 Goodbye!',
							timestamp: new Date(),
						};
						setMessages(prev => [...prev, byeMsg]);
						setTimeout(() => exit(), 500);
						return;
					}

					if (result.data?.type === 'clear-history') {
						setMessages([]);
						clientRef.current?.clearHistory();
						setIsProcessing(false);
						return;
					}

					if (result.data?.type === 'toggle-rag') {
						setRagEnabled(!ragEnabled);
						const statusMsg: Message = {
							id: nanoid(),
							role: 'system',
							content: `📚 RAG mode ${!ragEnabled ? 'enabled' : 'disabled'}`,
							timestamp: new Date(),
						};
						setMessages(prev => [...prev, statusMsg]);
						setIsProcessing(false);
						return;
					}

					// Generic response
					const responseMsg: Message = {
						id: nanoid(),
						role: 'system',
						content: result.message || 'Command executed',
						timestamp: new Date(),
					};
					setMessages(prev => [...prev, responseMsg]);
				} else {
					const errorMsg: Message = {
						id: nanoid(),
						role: 'system',
						content: `❌ ${result.message || 'Command failed'}`,
						timestamp: new Date(),
					};
					setMessages(prev => [...prev, errorMsg]);
				}

				setIsProcessing(false);
				return;
			}

			// Regular chat message - stream response
			await handleStreamingResponse(value);
		},
		[messages, sessionId, isProcessing, exit, handleStreamingResponse, ragEnabled]
	);

	// Keyboard shortcuts
	useInput((input, key) => {
		if (key.escape && !isStreaming) {
			exit();
		}

		if (key.ctrl && input === 'c' && isStreaming) {
			// Cancel current stream
			currentStreamIdRef.current = null;
			setIsStreaming(false);
			setCurrentStreamText('');
			setThinkingPhrase('');
			setIsProcessing(false);
		}
	});

		const modelInfo = clientRef.current?.getCurrentModel();	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box borderStyle="round" borderColor="cyan" paddingX={2} marginBottom={1}>
				<Text>
					{chalk.cyan('🎭 PolyMind Live Chat')} {chalk.dim('|')}
					{modelInfo && (
						<>
							{' '}
				<Text color="magenta">{modelInfo.provider}</Text> {chalk.dim('→')}{' '}
				<Text color="yellow">{modelInfo.name}</Text>
						</>
					)}
					{ragEnabled && (
						<>
							{' '}
							{chalk.dim('|')} <Text color="green">📚 RAG</Text>
						</>
					)}
				</Text>
			</Box>

			{/* RAG Stats */}
			{ragStats && (
				<Box marginBottom={1} paddingX={1}>
					<Text color="dim">{ragStats}</Text>
				</Box>
			)}

			{/* Messages */}
			<Box flexDirection="column" marginBottom={1} paddingX={1} minHeight={15}>
				{messages.slice(-10).map((msg) => (
					<Box key={msg.id} flexDirection="column" marginBottom={1}>
						<Text>
							<Text
								color={
									msg.role === 'user' ? 'green' : msg.role === 'system' ? 'yellow' : 'cyan'
								}
							>
								{msg.role === 'user' ? '👤 You' : msg.role === 'system' ? '🤖 System' : '✨ Assistant'}
							</Text>
							<Text color="dim"> {msg.timestamp.toLocaleTimeString()}</Text>
							{msg.model && <Text color="dim"> [{msg.model}]</Text>}
						</Text>
						<Box paddingLeft={3}>
							<Text>{msg.content}</Text>
						</Box>
					</Box>
				))}

				{/* Streaming message */}
				{isStreaming && currentStreamText && (
					<Box flexDirection="column" marginBottom={1}>
						<Text>
							<Text color="cyan">✨ Assistant</Text>
							<Text color="dim"> (streaming...)</Text>
						</Text>
						<Box paddingLeft={3}>
							<Text>{currentStreamText}</Text>
						</Box>
					</Box>
				)}
			</Box>

			{/* Thinking indicator */}
			{isProcessing && thinkingPhrase && (
				<Box marginBottom={1}>
					<Text color="dim">
						<Spinner type="dots" /> {thinkingPhrase}
					</Text>
				</Box>
			)}

			{/* Suggestions */}
			{suggestions.length > 0 && (
				<Box marginBottom={1} paddingX={1}>
					<Text color="dim">Suggestions: {suggestions.map((s) => chalk.cyan(s)).join(', ')}</Text>
				</Box>
			)}

			{/* Input */}
			<Box borderStyle="round" borderColor="green" paddingX={2}>
				<Text color="green">▶ </Text>
				<TextInput
					value={input}
					onChange={setInput}
					onSubmit={handleSubmit}
					placeholder="Type a message or /command..."
					showCursor={!isProcessing}
				/>
			</Box>

			{/* Footer */}
			<Box marginTop={1} paddingX={1}>
				<Text color="dim">
					{isStreaming ? 'Ctrl+C to cancel stream' : 'ESC to exit'} | /help for commands
				</Text>
			</Box>
		</Box>
	);
};
