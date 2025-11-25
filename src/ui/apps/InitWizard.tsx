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
    
    // Save to config store
    config.set('provider', provider as any);
    config.set('apiKey', value);
    
    // Also suggest setting environment variable for convenience
    const envVarName = provider === 'gemini' ? 'GEMINI_API_KEY' : 
                       provider === 'openai' ? 'OPENAI_API_KEY' :
                       provider === 'anthropic' ? 'ANTHROPIC_API_KEY' :
                       provider === 'xai' ? 'XAI_API_KEY' : 'API_KEY';
    
    console.log(chalk.green('\n✓ Configuration saved to config file!'));
    console.log(chalk.dim('\n💡 Tip: You can also set ') + chalk.cyan(envVarName) + chalk.dim(' in your environment'));
    console.log(chalk.dim('   export ') + chalk.cyan(envVarName) + chalk.dim('="your-key-here"'));
    console.log(chalk.dim('\nRun'), chalk.cyan('polymind live'), chalk.dim('or'), chalk.cyan('polymind council "query" --gemini-deep'), chalk.dim('to start\n'));
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
