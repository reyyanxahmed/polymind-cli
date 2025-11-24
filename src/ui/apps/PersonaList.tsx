/**
 * Persona List Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { PersonaCard } from '../components/PersonaCard.js';

const MOCK_PERSONAS = [
  {
    name: 'Lex',
    role: 'Explorer',
    model: 'gemini-2.0-flash',
    weight: 80,
    wins: 5,
    losses: 2,
    color: 'cyan',
    status: 'active' as const,
  },
  {
    name: 'Guardian',
    role: 'Ethicist',
    model: 'gemini-1.5-pro',
    weight: 75,
    wins: 4,
    losses: 3,
    color: 'magenta',
    status: 'active' as const,
  },
  {
    name: 'Pragma',
    role: 'Realist',
    model: 'gemini-2.0-flash',
    weight: 70,
    wins: 3,
    losses: 4,
    color: 'yellow',
    status: 'evolving' as const,
  },
];

export const PersonaList: React.FC = () => {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        🎭 Available Personas
      </Text>

      <Box marginTop={1} flexDirection="row" flexWrap="wrap">
        {MOCK_PERSONAS.map((persona, idx) => (
          <Box key={idx} marginRight={2} marginBottom={1}>
            <PersonaCard {...persona} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
