/**
 * Main Debate App Component
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { AnimatedDebate } from '../components/AnimatedDebate.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { printMiniBanner } from '../banner.js';

interface DebateAppProps {
  query: string;
  rounds: number;
  personas?: string[];
  streaming: boolean;
  quirks: boolean;
}

export const DebateApp: React.FC<DebateAppProps> = ({
  query,
  rounds,
  personas,
  streaming,
  quirks,
}) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [phase, setPhase] = useState<'proposal' | 'rebuttal' | 'consensus' | 'idle'>(
    'idle'
  );
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>();

  useEffect(() => {
    // TODO: Integrate with actual debate engine
    // This is a placeholder for the real implementation
    const runDebate = async () => {
      setPhase('proposal');
      setCurrentRound(1);

      // Simulate debate phases
      setTimeout(() => {
        setMessages([
          {
            speaker: 'Explorer',
            content: 'I believe the answer lies in exploring new possibilities...',
            confidence: 0.85,
            type: 'proposal',
            color: 'cyan',
          },
        ]);
      }, 1000);

      setTimeout(() => {
        setPhase('rebuttal');
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'Ethicist',
            content: 'But we must consider the moral implications first...',
            confidence: 0.78,
            type: 'rebuttal',
            color: 'magenta',
          },
        ]);
      }, 3000);

      setTimeout(() => {
        setPhase('consensus');
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'Council',
            content:
              'After deliberation, we recommend a balanced approach that considers both innovation and ethics.',
            type: 'consensus',
            color: 'green',
          },
        ]);
      }, 5000);

      setTimeout(() => {
        exit();
      }, 7000);
    };

    runDebate();
  }, [exit]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text>{printMiniBanner()}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>Query: </Text>
        <Text>{query}</Text>
      </Box>

      <ProgressBar current={currentRound} total={rounds} label="Round" />

      <Box marginTop={1}>
        <AnimatedDebate
          messages={messages}
          phase={phase}
          currentSpeaker={currentSpeaker}
        />
      </Box>
    </Box>
  );
};
