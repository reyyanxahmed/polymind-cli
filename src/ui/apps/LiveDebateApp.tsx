/**
 * Multi-Agent Debate System with Live Streaming
 * Real-time council deliberation with multiple AI perspectives
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useApp } from 'ink';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { StreamingClient } from '../../core/streaming-client.js';
import gradient from 'gradient-string';

interface Persona {
	name: string;
	role: string;
	emoji: string;
	color: string;
	perspective: string;
}

interface DebateMessage {
	id: string;
	persona: Persona;
	content: string;
	round: number;
	timestamp: Date;
}

interface ContextMessage {
	role: string;
	content: string;
	timestamp: Date;
}

const DEFAULT_PERSONAS: Persona[] = [
	{
		name: 'Pragmatist',
		role: 'Practical Problem Solver',
		emoji: '🎯',
		color: 'cyan',
		perspective: 'Focus on practical, actionable solutions and real-world implications.',
	},
	{
		name: 'Visionary',
		role: 'Future-Focused Innovator',
		emoji: '🚀',
		color: 'magenta',
		perspective: 'Consider long-term possibilities, innovations, and transformative potential.',
	},
	{
		name: 'Skeptic',
		role: 'Critical Analyst',
		emoji: '🤔',
		color: 'yellow',
		perspective: 'Challenge assumptions, identify risks, and provide critical analysis.',
	},
	{
		name: 'Ethicist',
		role: 'Moral Compass',
		emoji: '⚖️',
		color: 'green',
		perspective: 'Examine ethical implications, fairness, and societal impact.',
	},
];

interface LiveDebateAppProps {
	query: string;
	apiKey: string;
	provider: string;
	model?: string;
	rounds?: number;
	personas?: Persona[];
}

export const LiveDebateApp = ({
	query,
	apiKey,
	provider,
	model,
	rounds = 3,
	personas = DEFAULT_PERSONAS,
}: LiveDebateAppProps) => {
	const { exit } = useApp();
	const [messages, setMessages] = useState<DebateMessage[]>([]);
	const [currentRound, setCurrentRound] = useState(1);
	const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
	const [isDebating, setIsDebating] = useState(false);
	const [currentStreamText, setCurrentStreamText] = useState('');
	const [conclusion, setConclusion] = useState('');
	const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

	const clientRef = useRef<StreamingClient | null>(null);
	const debateHistoryRef = useRef<ContextMessage[]>([]);

	// Initialize client
	useEffect(() => {
		clientRef.current = new StreamingClient(provider, apiKey, model);
		startDebate();
	}, []);

	// Start the debate
	const startDebate = useCallback(async () => {
		setIsDebating(true);

		// Introduction message
		const intro: DebateMessage = {
			id: nanoid(),
			persona: {
				name: 'Moderator',
				role: 'Debate Facilitator',
				emoji: '🎭',
				color: 'white',
				perspective: '',
			},
			content: `📋 Council Debate Topic:\n"${query}"\n\n🎯 ${rounds} rounds of deliberation with ${personas.length} perspectives.\nLet the debate begin!`,
			round: 0,
			timestamp: new Date(),
		};

		setMessages([intro]);

		// Run debate rounds
		for (let round = 1; round <= rounds; round++) {
			setCurrentRound(round);

			for (let i = 0; i < personas.length; i++) {
				setCurrentPersonaIndex(i);
				await streamPersonaResponse(personas[i], round);

				// Small delay between speakers
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}

		// Generate conclusion
		await generateConclusion();

		setIsDebating(false);

		// Auto-exit after showing conclusion
		setTimeout(() => exit(), 5000);
	}, [query, rounds, personas, exit]);

	// Stream a persona's response
	const streamPersonaResponse = async (persona: Persona, round: number) => {
		const client = clientRef.current;
		if (!client) return;

		// Build context from previous debate messages
		const context = debateHistoryRef.current;

		// Create persona-specific prompt
		const prompt = `You are ${persona.name}, the ${persona.role}.

Your perspective: ${persona.perspective}

Debate topic: "${query}"

This is round ${round} of ${rounds}. 

${context.length > 0 ? `Previous arguments:\n${context.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\n` : ''}

Provide a concise, focused argument (2-3 sentences) from your unique perspective. Be direct and insightful.`;

		try {
			setCurrentStreamText('');
			let fullResponse = '';

			// streamChat takes message and optional systemPrompt
			for await (const chunk of client.streamChat(prompt)) {
				fullResponse += chunk.text;
				setCurrentStreamText(fullResponse);

				if (chunk.done) {
					const msg: DebateMessage = {
						id: nanoid(),
						persona,
						content: fullResponse,
						round,
						timestamp: new Date(),
					};

					setMessages(prev => [...prev, msg]);
					setCurrentStreamText('');

					// Add to debate history
					debateHistoryRef.current.push({
						role: 'assistant',
						content: `${persona.name}: ${fullResponse}`,
						timestamp: new Date(),
					});
				}
			}
		} catch (error) {
			console.error('Error streaming persona response:', error);
		}
	};

	// Generate final conclusion
	const generateConclusion = async () => {
		const client = clientRef.current;
		if (!client) return;

		setIsGeneratingConclusion(true);

		const prompt = `Based on this multi-perspective council debate on "${query}", synthesize a balanced conclusion that:

1. Acknowledges the key insights from each perspective
2. Identifies areas of consensus and disagreement
3. Provides a nuanced recommendation or synthesis

Keep it concise (3-4 sentences).

Debate summary:
${debateHistoryRef.current.map(m => m.content).join('\n\n')}`;

		try {
			let fullConclusion = '';

			for await (const chunk of client.streamChat(prompt)) {
				fullConclusion += chunk.text;
				setConclusion(fullConclusion);

				if (chunk.done) {
					setIsGeneratingConclusion(false);
				}
			}
		} catch (error) {
			console.error('Error generating conclusion:', error);
			setIsGeneratingConclusion(false);
		}
	};

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box borderStyle="double" borderColor="magenta" paddingX={2} marginBottom={1}>
				<Text>
					{gradient.pastel('🎭 PolyMind Council Debate')} {chalk.dim('|')}
					<Text color="cyan">
						{' '}
						Round {currentRound}/{rounds}
					</Text>
				</Text>
			</Box>

			{/* Messages */}
			<Box flexDirection="column" paddingX={1} marginBottom={1}>
				{messages.map((msg) => (
					<Box key={msg.id} flexDirection="column" marginBottom={1}>
						<Text>
							<Text color={msg.persona.color as any}>
								{msg.persona.emoji} {msg.persona.name}
							</Text>
							{msg.round > 0 && <Text color="dim"> [Round {msg.round}]</Text>}
						</Text>
						<Box paddingLeft={3} marginTop={0}>
							<Text>{msg.content}</Text>
						</Box>
					</Box>
				))}

				{/* Current streaming */}
				{isDebating && currentStreamText && (
					<Box flexDirection="column" marginBottom={1}>
						<Text>
							<Text color={personas[currentPersonaIndex].color as any}>
								{personas[currentPersonaIndex].emoji} {personas[currentPersonaIndex].name}
							</Text>
							<Text color="dim"> (speaking...)</Text>
						</Text>
						<Box paddingLeft={3}>
							<Text>{currentStreamText}</Text>
						</Box>
					</Box>
				)}
			</Box>

			{/* Waiting indicator */}
			{isDebating && !currentStreamText && (
				<Box marginBottom={1}>
					<Text color="dim">
						<Spinner type="dots" /> Waiting for next speaker...
					</Text>
				</Box>
			)}

			{/* Conclusion */}
			{(conclusion || isGeneratingConclusion) && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="green"
					paddingX={2}
					paddingY={1}
					marginTop={1}
				>
					<Text color="green" bold>
						🎯 Council Conclusion
					</Text>
					<Box marginTop={1}>
						<Text>
							{conclusion}
							{isGeneratingConclusion && <Spinner type="dots" />}
						</Text>
					</Box>
				</Box>
			)}

			{/* Footer */}
			{!isDebating && conclusion && (
				<Box marginTop={1}>
					<Text color="dim">Exiting in a few seconds...</Text>
				</Box>
			)}
		</Box>
	);
};
