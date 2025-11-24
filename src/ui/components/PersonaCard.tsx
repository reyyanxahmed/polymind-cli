/**
 * Persona Card Component with Animations
 */

import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

interface PersonaCardProps {
  name: string;
  role: string;
  model: string;
  weight: number;
  wins: number;
  losses: number;
  color: string;
  status: 'active' | 'evolving' | 'graveyard';
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  name,
  role,
  model,
  weight,
  wins,
  losses,
  color,
  status,
}) => {
  const getStatusEmoji = () => {
    switch (status) {
      case 'active':
        return '✨';
      case 'evolving':
        return '🔄';
      case 'graveyard':
        return '💀';
    }
  };

  const winRate =
    wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '0';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={color}
      paddingX={1}
      width={30}
    >
      <Box>
        <Text bold color={color}>
          {getStatusEmoji()} {name}
        </Text>
      </Box>
      <Box>
        <Text dimColor>{role}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Model: </Text>
        <Text>{model}</Text>
      </Box>
      <Box>
        <Text dimColor>Weight: </Text>
        <Text color="cyan">{weight}/100</Text>
      </Box>
      <Box>
        <Text dimColor>Record: </Text>
        <Text color="green">{wins}W</Text>
        <Text> / </Text>
        <Text color="red">{losses}L</Text>
        <Text dimColor> ({winRate}%)</Text>
      </Box>
    </Box>
  );
};
