# Contributing to PolyMind CLI

Thank you for your interest in contributing! 🎉

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something awesome together.

## How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Use the bug report template
3. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - System info (`polymind status`)
   - Error messages (redacted)

### Suggesting Features

1. Open a discussion first
2. Describe the use case
3. Explain why it benefits users
4. Consider implementation complexity

### Pull Requests

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Run linting: `npm run lint`
6. Build successfully: `npm run build`
7. Commit with conventional commits
8. Push and open a PR

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/polymind-cli.git
cd polymind-cli

# Install dependencies
npm install

# Build
npm run build

# Link globally for testing
npm link

# Test your changes
polymind interactive
```

## Commit Convention

We use Conventional Commits:

```
feat: add /export command
fix: resolve slash command autocomplete bug
docs: update README with security features
style: format code with prettier
refactor: simplify slash command parser
test: add tests for security utilities
chore: update dependencies
```

## Code Style

- TypeScript strict mode
- ESLint rules enforced
- Prettier for formatting
- Meaningful variable names
- Comments for complex logic

## Testing

```bash
# Run type check
npm run type-check

# Run tests (when available)
npm test

# Manual testing
npm run dev
```

## Project Structure

```
src/
├── commands/       # CLI commands
├── ui/            # Terminal UI components
│   ├── apps/      # Full-page applications
│   └── components/ # Reusable UI pieces
├── utils/         # Utilities
└── config/        # Configuration management
```

## Adding a New Command

1. Create `src/commands/your-command.ts`
2. Export command from file
3. Register in `src/index.ts`
4. Add tests
5. Update README.md

Example:

```typescript
// src/commands/analyze.ts
import { Command } from 'commander';

export const analyzeCommand = new Command('analyze')
  .description('Analyze debate results')
  .argument('<debateId>', 'Debate ID to analyze')
  .action(async (debateId) => {
    // Implementation
  });
```

```typescript
// src/index.ts
import { analyzeCommand } from './commands/analyze.js';
program.addCommand(analyzeCommand);
```

## Adding a Slash Command

Edit `src/utils/slash-commands.ts`:

```typescript
export const SLASH_COMMANDS: Record<string, SlashCommand> = {
  // ... existing commands
  
  analyze: {
    name: 'analyze',
    aliases: ['a'],
    description: 'Analyze conversation',
    usage: '/analyze',
    examples: ['/analyze', '/a'],
    execute: async (args, context) => {
      // Implementation
      return {
        success: true,
        message: 'Analysis complete!',
      };
    },
  },
};
```

## Security Guidelines

- Never commit API keys or secrets
- Sanitize all user inputs
- Redact sensitive data in logs
- Validate environment variables
- Use rate limiting for API calls
- Follow principle of least privilege

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for functions
- Update examples if behavior changes
- Keep CHANGELOG.md updated

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit: `git commit -m "chore: release v1.x.x"`
4. Tag: `git tag v1.x.x`
5. Push: `git push origin main --tags`
6. Create GitHub release
7. npm publish (automated via GitHub Actions)

## Questions?

- Open a discussion on GitHub
- Join our Discord (if available)
- Email: support@polymind.ai

Thank you for contributing! 🚀
