/**
 * Animated Debate View Component
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import chalk from 'chalk';
import {
  randomThinkingPhrase,
  randomConsensusMessage,
  randomConflictMessage,
  randomEasterEgg,
} from '../quotes.js';

interface Message {
  speaker: string;
  content: string;
  confidence?: number;
  type: 'proposal' | 'rebuttal' | 'consensus';
  color: string;
}

interface AnimatedDebateProps {
  messages: Message[];
  phase: 'proposal' | 'rebuttal' | 'consensus' | 'idle';
  currentSpeaker?: string;
}

export const AnimatedDebate: React.FC<AnimatedDebateProps> = ({
  messages,
  phase,
  currentSpeaker,
}) => {
  const [thinkingPhrase, setThinkingPhrase] = useState(randomThinkingPhrase());
  const [showEasterEgg] = useState(randomEasterEgg());

  useEffect(() => {
    const interval = setInterval(() => {
      setThinkingPhrase(randomThinkingPhrase());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getPhaseEmoji = () => {
    switch (phase) {
      case 'proposal':
        return '💭';
      case 'rebuttal':
        return '⚔️';
      case 'consensus':
        return '🎯';
      default:
        return '🎭';
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'proposal':
        return 'Initial Proposals';
      case 'rebuttal':
        return 'Cross-Examination';
      case 'consensus':
        return 'Consensus Building';
      default:
        return 'Idle';
    }
  };

  return (
    <Box flexDirection="column" paddingX={2}>
      {/* Phase Header */}
      <Box marginBottom={1}>
        <Gradient name="rainbow">
          <Text bold>
            {getPhaseEmoji()} {getPhaseLabel()}
          </Text>
        </Gradient>
      </Box>

      {/* Easter Egg */}
      {showEasterEgg && (
        <Box marginBottom={1}>
          <Text dimColor italic>
            {showEasterEgg}
          </Text>
        </Box>
      )}

      {/* Messages */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.map((msg, idx) => (
          <Box key={idx} flexDirection="column" marginBottom={1}>
            <Box>
              <Text bold color={msg.color}>
                {msg.speaker}
              </Text>
              {msg.confidence !== undefined && (
                <Text dimColor> ({(msg.confidence * 100).toFixed(0)}%)</Text>
              )}
            </Box>
            <Box paddingLeft={2}>
              <Text>{msg.content}</Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Current Speaker Indicator */}
      {currentSpeaker && phase !== 'idle' && (
        <Box marginTop={1}>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text dimColor> {thinkingPhrase}</Text>
        </Box>
      )}

      {/* Phase Completion Messages */}
      {phase === 'consensus' && messages.length > 0 && (
        <Box marginTop={1}>
          <Text color="green" bold>
            {randomConsensusMessage()}
          </Text>
        </Box>
      )}

      {phase === 'rebuttal' && messages.length > 2 && (
        <Box marginTop={1}>
          <Text color="yellow" dimColor>
            {randomConflictMessage()}
          </Text>
        </Box>
      )}
    </Box>
  );
};
