/**
 * Init Wizard Component
 */

import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { config } from '../../config/storage.js';
import chalk from 'chalk';

interface InitWizardProps {
  initialProvider?: string;
  initialApiKey?: string;
}

export const InitWizard: React.FC<InitWizardProps> = ({
  initialProvider,
  initialApiKey,
}) => {
  const { exit } = useApp();
  const [step, setStep] = useState(initialProvider ? 1 : 0);
  const [provider, setProvider] = useState(initialProvider || 'gemini');
  const [apiKey, setApiKey] = useState(initialApiKey || '');

  const handleProviderSubmit = (value: string) => {
    const validProviders = ['gemini', 'claude', 'gpt', 'ollama'];
    if (!validProviders.includes(value.toLowerCase())) {
      console.log(
        chalk.red('\n✗ Invalid provider. Choose: gemini, claude, gpt, ollama\n')
      );
      return;
    }
    setProvider(value.toLowerCase());
    setStep(1);
  };

  const handleApiKeySubmit = (value: string) => {
    if (!value.trim()) {
      console.log(chalk.red('\n✗ API key cannot be empty\n'));
      return;
    }
    setApiKey(value);
    config.set('provider', provider as any);
    config.set('apiKey', value);
    console.log(chalk.green('\n✓ Configuration saved!'));
    console.log(chalk.dim('Run'), chalk.cyan('polymind debate "your query"'), chalk.dim('to start'));
    exit();
  };

  return (
    <Box flexDirection="column" padding={1}>
      {step === 0 && (
        <Box flexDirection="column">
          <Text>Select LLM provider (gemini/claude/gpt/ollama):</Text>
          <Box marginTop={1}>
            <Text color="cyan">&gt; </Text>
            <TextInput value={provider} onChange={setProvider} onSubmit={handleProviderSubmit} />
          </Box>
        </Box>
      )}

      {step === 1 && (
        <Box flexDirection="column">
          <Text>Enter API key for {provider}:</Text>
          <Box marginTop={1}>
            <Text color="cyan">&gt; </Text>
            <TextInput
              value={apiKey}
              onChange={setApiKey}
              onSubmit={handleApiKeySubmit}
              mask="*"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
