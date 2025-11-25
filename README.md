# PolyMind CLI

> Multi-model AI council debates in your terminal with interactive TUI

[![npm version](https://img.shields.io/npm/v/polymind-cli.svg)](https://www.npmjs.com/package/polymind-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## 🚀 Quick Start

```bash
# Install globally
npm install -g polymind-cli

# Or use without installing
npx polymind-cli --version

# Initialize configuration
polymind init

# Start LLM Council
polymind council "your query" --gemini-deep

# Or start interactive mode
polymind interactive
```

## ✨ Key Features

- 🏛️ **LLM Council Mode** - Multiple AI models collaborate with peer review
- 🎯 **Gemini Deep Preset** - High-reasoning Gemini models for complex queries
- 🎭 **Interactive Mode** - Gemini/Copilot-style persistent TUI chat
- ⚡ **Slash Commands** - Quick actions with `/debate`, `/persona`, `/help`, etc.
- 🤖 **Multi-Model Support** - Gemini (10 models), GPT, Claude, Grok
- 🎨 **Beautiful TUI** - Tab view for council responses
- 🔒 **Secure** - Input sanitization, rate limiting, API key protection
- 📚 **RAG Support** - Context-aware responses from codebase

## 📚 Documentation

Comprehensive guides:
- [Gemini Models Guide](./GEMINI_MODELS.md) - All 10 Gemini models and council presets
- [Installation Guide](./INSTALL.md) - Detailed setup instructions
- [Security Guide](./SECURITY.md) - Security features and best practices
- [Developer Guide](./DEVELOPER.md) - Contributing and development setup

### Quick Usage

**LLM Council:**
```bash
# Use Gemini Deep preset (recommended)
polymind council "Explain quantum computing" --gemini-deep

# Custom council with multiple providers
polymind council "Your question" \
  --gemini-key $GEMINI_API_KEY \
  --openai-key $OPENAI_API_KEY \
  --anthropic-key $ANTHROPIC_API_KEY
```

**Available Commands:**
- `polymind council <query>` - Start LLM Council deliberation
- `polymind models` - List all available models
- `polymind status` - Check system status
- `polymind init` - Configure API keys
- `polymind interactive` - Start interactive chat
- `polymind debate <topic>` - Multi-agent debate

## 🔗 Links

- **npm**: https://www.npmjs.com/package/polymind-cli
- **GitHub**: https://github.com/reyyanxahmed/polymind-cli
- **Issues**: https://github.com/reyyanxahmed/polymind-cli/issues
- **Documentation**: [Gemini Models](./GEMINI_MODELS.md) | [Install Guide](./INSTALL.md) | [Security](./SECURITY.md)

---

**Made with ❤️ by sinisterchill**
