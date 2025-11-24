/**
 * Interactive Chat Application - Gemini/Copilot-style TUI
 * Features: Persistent session, slash commands, streaming, quirks
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import {
  executeSlashCommand,
  getCommandSuggestions,
  type ChatContext,
} from '../../utils/slash-commands.js';
import {
  randomQuote,
  randomThinkingPhrase,
  randomLoadingMessage,
  randomEasterEgg,
  EASTER_EGGS,
} from '../quotes.js';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  persona?: string;
}

interface Props {
  initialPersona?: string;
  quirksEnabled?: boolean;
}

export const InteractiveChatApp: React.FC<Props> = ({
  initialPersona = 'explorer',
  quirksEnabled = true,
}) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(initialPersona);
  const [sessionId] = useState(() => nanoid());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [thinkingPhrase, setThinkingPhrase] = useState('');

  // Welcome message on mount
  useEffect(() => {
    if (showWelcome && quirksEnabled) {
      const welcomeMsg: Message = {
        id: nanoid(),
        role: 'system',
        content: `${randomQuote()}\n\nType /help to see available commands, or just start chatting!`,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      setShowWelcome(false);
    }
  }, [showWelcome, quirksEnabled]);

  // Easter egg chance
  useEffect(() => {
    const egg = randomEasterEgg();
    if (quirksEnabled && egg) {
      const easterEgg: Message = {
        id: nanoid(),
        role: 'system',
        content: `🎉 ${egg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, easterEgg]);
    }
  }, [messages.length, quirksEnabled]);

  // Update command suggestions as user types
  useEffect(() => {
    if (input.startsWith('/')) {
      const sugg = getCommandSuggestions(input);
      setSuggestions(sugg);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  // Handle user input submission
  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim()) return;

      // Add user message
      const userMsg: Message = {
        id: nanoid(),
        role: 'user',
        content: value,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsProcessing(true);

      // Check if slash command
      if (value.startsWith('/')) {
        const context: ChatContext = {
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentPersona,
          settings: { quirksEnabled },
          sessionId,
        };

        const result = await executeSlashCommand(value, context);

        if (result.success) {
          // Handle special commands
          if (result.data?.type === 'exit') {
            const byeMsg: Message = {
              id: nanoid(),
              role: 'system',
              content: result.message || '👋 Goodbye!',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, byeMsg]);
            setTimeout(() => exit(), 500);
            return;
          }

          if (result.data?.type === 'clear-history') {
            setMessages([]);
            setIsProcessing(false);
            return;
          }

          if (result.data?.type === 'switch-persona') {
            setCurrentPersona(result.data.persona);
          }

          if (result.data?.type === 'debate') {
            // Start debate simulation
            const debateMsg: Message = {
              id: nanoid(),
              role: 'system',
              content: `🎭 Initiating council debate on: "${result.data.question}"`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, debateMsg]);

            // Simulate debate with quirks
            if (quirksEnabled) {
              setThinkingPhrase(randomThinkingPhrase());
              setTimeout(() => {
                const responseMsg: Message = {
                  id: nanoid(),
                  role: 'assistant',
                  content: `[Debate simulation]\n\n${randomLoadingMessage()}\n\nThe council is deliberating on: "${result.data.question}"\n\nThis would trigger a full multi-persona debate in the production version.`,
                  timestamp: new Date(),
                  persona: currentPersona,
                };
                setMessages((prev) => [...prev, responseMsg]);
                setIsProcessing(false);
                setThinkingPhrase('');
              }, 2000);
              return;
            }
          }

          if (result.data?.type === 'show-help') {
            const helpText = result.data.commands
              .map(
                (cmd: any) =>
                  `${chalk.cyan(`/${cmd.name}`)} ${chalk.dim(cmd.aliases.map((a: string) => `/${a}`).join(', '))}\n  ${cmd.description}\n  Usage: ${cmd.usage}`
              )
              .join('\n\n');

            const helpMsg: Message = {
              id: nanoid(),
              role: 'system',
              content: `📚 Available Commands:\n\n${helpText}`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, helpMsg]);
            setIsProcessing(false);
            return;
          }

          // Generic success response
          const responseMsg: Message = {
            id: nanoid(),
            role: 'system',
            content: result.message || 'Command executed successfully',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, responseMsg]);
        } else {
          const errorMsg: Message = {
            id: nanoid(),
            role: 'system',
            content: result.message || 'Command failed',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }

        setIsProcessing(false);
        return;
      }

      // Regular chat message (simulate AI response)
      if (quirksEnabled) {
        setThinkingPhrase(randomThinkingPhrase());
      }

      setTimeout(() => {
        const assistantMsg: Message = {
          id: nanoid(),
          role: 'assistant',
          content: `[${currentPersona}] I received your message: "${value}"\n\nThis is a mock response. In production, this would connect to the Gemini API for real conversations.\n\nTry using slash commands like /debate or /help!`,
          timestamp: new Date(),
          persona: currentPersona,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsProcessing(false);
        setThinkingPhrase('');
      }, 1500);
    },
    [messages, currentPersona, quirksEnabled, sessionId, exit]
  );

  // Keyboard shortcuts
  useInput((input, key) => {
    if (key.escape) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={2} marginBottom={1}>
        <Text>
          {chalk.cyan('🎭 PolyMind Interactive Chat')} {chalk.dim('|')} Persona:{' '}
          <Text color="magenta">{currentPersona}</Text> {chalk.dim('|')} Session:{' '}
          <Text color="yellow">{sessionId.slice(0, 8)}</Text>
        </Text>
      </Box>

      {/* Messages */}
      <Box
        flexDirection="column"
        marginBottom={1}
        paddingX={1}
        height={Math.min(messages.length * 3 + 5, 30)}
      >
        {messages.slice(-10).map((msg) => (
          <Box key={msg.id} flexDirection="column" marginBottom={1}>
            <Text>
              <Text color={msg.role === 'user' ? 'green' : msg.role === 'system' ? 'yellow' : 'cyan'}>
                {msg.role === 'user' ? '👤 You' : msg.role === 'system' ? '🤖 System' : `🎭 ${msg.persona || 'Assistant'}`}
              </Text>
              <Text color="dim"> {msg.timestamp.toLocaleTimeString()}</Text>
            </Text>
            <Box paddingLeft={3}>
              <Text>{msg.content}</Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Thinking indicator */}
      {isProcessing && thinkingPhrase && quirksEnabled && (
        <Box marginBottom={1}>
          <Text color="dim">
            <Spinner type="dots" /> {thinkingPhrase}
          </Text>
        </Box>
      )}

      {/* Command suggestions */}
      {suggestions.length > 0 && (
        <Box marginBottom={1} paddingX={1}>
          <Text color="dim">
            Suggestions: {suggestions.map((s) => chalk.cyan(s)).join(', ')}
          </Text>
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
          Press ESC to exit | Type /help for commands | / to see suggestions
        </Text>
      </Box>
    </Box>
  );
};
