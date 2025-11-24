# PolyMind CLI - Developer Guide

## Architecture Overview

```
packages/polymind-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/             # Command implementations
│   │   ├── debate.ts         # Multi-agent debates
│   │   ├── chat.ts           # One-on-one chat
│   │   ├── config.ts         # Configuration management
│   │   ├── init.ts           # Setup wizard
│   │   ├── personas.ts       # Persona management
│   │   └── status.ts         # System diagnostics
│   ├── ui/                   # Terminal UI components
│   │   ├── banner.ts         # ASCII art and branding
│   │   ├── quotes.ts         # Personality content
│   │   ├── apps/             # Full-screen apps
│   │   │   ├── DebateApp.tsx
│   │   │   ├── ChatApp.tsx
│   │   │   ├── InitWizard.tsx
│   │   │   └── PersonaList.tsx
│   │   └── components/       # Reusable UI components
│   │       ├── AnimatedDebate.tsx
│   │       ├── PersonaCard.tsx
│   │       └── ProgressBar.tsx
│   ├── config/               # Configuration system
│   │   └── storage.ts        # Conf-based persistence
│   └── utils/                # Utilities
│       └── env-check.ts      # Environment validation
└── dist/                     # Compiled output
```

## Tech Stack

### Core Dependencies

- **Commander.js** - CLI framework and argument parsing
- **Ink** - React for interactive CLIs
- **Chalk** - Terminal string styling
- **Gradient String** - Rainbow gradients for banner
- **Conf** - Configuration management
- **Ora** - Elegant terminal spinners

### UI Components

- **ink-spinner** - Loading animations
- **ink-gradient** - Gradient text effects
- **ink-text-input** - Input fields
- **node-emoji** - Emoji support

### Utilities

- **update-notifier** - Automatic update checks
- **terminal-link** - Clickable links
- **strip-ansi** - Remove ANSI codes
- **zod** - Runtime type validation

## Development Workflow

### Setup

```bash
cd packages/polymind-cli
npm install
```

### Development Mode

```bash
# Run directly with tsx (hot reload)
npm run dev -- debate "test query"

# Or use the dev script
tsx src/index.ts debate "test"
```

### Building

```bash
# Compile TypeScript
npm run build

# Watch mode for development
tsc --watch
```

### Testing

```bash
# Run unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Linting

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Key Concepts

### Command Pattern

Each command is a separate Commander.js Command instance:

```typescript
import { Command } from 'commander';

export const myCommand = new Command('mycommand')
  .description('What it does')
  .argument('<required>', 'Required argument')
  .option('-f, --flag', 'Optional flag')
  .action(async (required, options) => {
    // Implementation
  });
```

### Ink Components

UI components are React components rendered to terminal:

```tsx
import React from 'react';
import { Box, Text } from 'ink';

export const MyComponent: React.FC = () => {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Hello Terminal!</Text>
    </Box>
  );
};
```

### Configuration Storage

Uses `conf` for persistent config:

```typescript
import { config } from './config/storage';

// Get value
const theme = config.get('theme');

// Set value
config.set('animations', true);

// Get all
const allConfig = config.getAll();
```

### Personality System

Random quotes and messages for character:

```typescript
import { randomQuote, randomLoadingMessage } from './ui/quotes';

console.log(randomQuote());
// => "Great minds think alike... but fools seldom differ 🤔"
```

## Adding New Features

### 1. New Command

```bash
# Create command file
touch src/commands/mycommand.ts
```

```typescript
// src/commands/mycommand.ts
import { Command } from 'commander';

export const myCommand = new Command('mycommand')
  .description('My new command')
  .action(async () => {
    console.log('Hello!');
  });
```

```typescript
// src/index.ts
import { myCommand } from './commands/mycommand.js';

program.addCommand(myCommand);
```

### 2. New UI Component

```bash
touch src/ui/components/MyComponent.tsx
```

```tsx
// src/ui/components/MyComponent.tsx
import React from 'react';
import { Box, Text } from 'ink';

interface MyComponentProps {
  message: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ message }) => {
  return (
    <Box borderStyle="round" borderColor="cyan">
      <Text>{message}</Text>
    </Box>
  );
};
```

### 3. New Config Option

```typescript
// src/config/storage.ts
const ConfigSchema = z.object({
  // ... existing fields
  myNewOption: z.boolean().default(false),
});
```

### 4. New Quote Category

```typescript
// src/ui/quotes.ts
export const MY_QUOTES = [
  "Quote 1",
  "Quote 2",
];

export function randomMyQuote(): string {
  return MY_QUOTES[Math.floor(Math.random() * MY_QUOTES.length)];
}
```

## Debugging

### Enable Debug Mode

```bash
# Via environment variable
DEBUG=true polymind debate "test"

# Via config
polymind config set debug true
polymind debate "test"
```

### Common Issues

**TypeScript Errors**

```bash
# Check types
npm run type-check

# Clear cache
rm -rf dist node_modules
npm install
npm run build
```

**Ink Rendering Issues**

```bash
# Check terminal capabilities
echo $TERM
# Should be: xterm-256color or similar

# Test basic Ink
npx ink-box Hello
```

**Module Resolution**

Ensure `.js` extensions in imports:

```typescript
// ✓ Correct
import { foo } from './bar.js';

// ✗ Wrong
import { foo } from './bar';
```

## Performance Optimization

### Bundle Size

```bash
# Analyze bundle
npm run build
ls -lh dist/

# Check dependencies
npx cost-of-modules
```

### Startup Time

```bash
# Measure startup
time polymind --version

# Profile with Node
node --prof dist/index.js debate "test"
node --prof-process isolate-*
```

### Memory Usage

```bash
# Monitor memory
node --max-old-space-size=512 dist/index.js debate "long query"
```

## Best Practices

### Code Style

- Use TypeScript strict mode
- Prefer functional components
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Error Handling

```typescript
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof SpecificError) {
    console.error(chalk.red('Specific error:', error.message));
  } else {
    console.error(chalk.red('Unexpected error:', error));
  }
  process.exit(1);
}
```

### User Experience

- Show progress for long operations
- Provide helpful error messages
- Include examples in help text
- Test on multiple terminals

### Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Build production bundle
5. Tag release: `git tag v1.0.0`
6. Push tag: `git push origin v1.0.0`
7. Publish: `npm publish`
8. Create GitHub release

## Resources

- **Ink Documentation**: https://github.com/vadimdemedes/ink
- **Commander.js**: https://github.com/tj/commander.js
- **Chalk**: https://github.com/chalk/chalk
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

## Support

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Discord**: Join our community server

---

Happy coding! 🎭
