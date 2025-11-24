/**
 * Chat App Component
 */

import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { printMiniBanner } from '../banner.js';

interface ChatAppProps {
  persona: string;
  streaming: boolean;
}

export const ChatApp: React.FC<ChatAppProps> = ({ persona, streaming }) => {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>(
    []
  );

  useInput((input) => {
    if (input === 'q') {
      exit();
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: value }]);
    setInput('');

    // TODO: Integrate with actual LLM API
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: persona, content: `Responding to: ${value}` },
      ]);
    }, 1000);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text>{printMiniBanner()}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold color="cyan">
          Chatting with: {persona}
        </Text>
        <Text dimColor> (Press 'q' to quit)</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {messages.map((msg, idx) => (
          <Box key={idx} marginBottom={1}>
            <Text bold>{msg.role}: </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))}
      </Box>

      <Box>
        <Text color="green">&gt; </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
};
