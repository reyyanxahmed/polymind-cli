/**
 * Animated Progress Bar Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label = 'Progress',
  color = 'cyan',
}) => {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const filledLength = Math.round((percentage / 100) * 30);
  const emptyLength = 30 - filledLength;

  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);

  return (
    <Box flexDirection="column">
      <Box>
        <Text dimColor>{label}: </Text>
        <Text color={color}>
          {filled}
          {empty}
        </Text>
        <Text> {percentage}%</Text>
      </Box>
      <Box>
        <Text dimColor>
          ({current}/{total})
        </Text>
      </Box>
    </Box>
  );
};
