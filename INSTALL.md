# PolyMind CLI Installation Guide

## Method 1: Global Installation via npm

The recommended way to install PolyMind CLI:

```bash
npm install -g @polymind/cli
```

After installation, verify:

```bash
polymind --version
polymind --help
```

## Method 2: npx (No Installation)

Run without installing:

```bash
npx @polymind/cli debate "Your question here"
```

## Method 3: Build from Source

For contributors and advanced users:

```bash
# Clone the repository
git clone https://github.com/reyyanxahmed/polymind.git
cd polymind/packages/polymind-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link

# Verify
polymind --version
```

## Post-Installation Setup

### 1. Run the setup wizard

```bash
polymind init
```

This will:
- Prompt for LLM provider selection (gemini/claude/gpt/ollama)
- Request API key
- Create config file at `~/.config/polymind/config.json`

### 2. Manual Configuration

Alternatively, set environment variables:

```bash
# For Gemini (recommended)
export GEMINI_API_KEY="your-api-key-here"

# For other providers
export ANTHROPIC_API_KEY="your-key"  # Claude
export OPENAI_API_KEY="your-key"     # GPT
```

### 3. Verify Installation

```bash
polymind status
```

Should show:
- Node version ✓
- API key configured ✓
- All system checks passing

## Getting API Keys

### Google Gemini (Free Tier Available)
1. Visit https://ai.google.dev/
2. Click "Get API Key"
3. Sign in with Google account
4. Create new API key
5. Copy and save securely

### Anthropic Claude
1. Visit https://console.anthropic.com/
2. Sign up for account
3. Navigate to API Keys
4. Generate new key

### OpenAI GPT
1. Visit https://platform.openai.com/
2. Create account
3. Go to API Keys section
4. Create new secret key

## Troubleshooting

### "command not found: polymind"

After `npm install -g`, if command not found:

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH (bash)
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.bashrc
source ~/.bashrc

# Add to PATH (zsh)
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.zshrc
source ~/.zshrc
```

### "Cannot find module"

Rebuild the package:

```bash
npm uninstall -g @polymind/cli
npm install -g @polymind/cli
```

### Permission Errors

Use npm's built-in fix:

```bash
# Fix permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use npx instead
npx @polymind/cli
```

### API Key Issues

Verify your key is set:

```bash
# Check environment
echo $GEMINI_API_KEY

# Or check config
polymind config get apiKey
```

## Updating

```bash
# Check for updates
npm outdated -g @polymind/cli

# Update to latest
npm update -g @polymind/cli

# Or reinstall
npm uninstall -g @polymind/cli
npm install -g @polymind/cli@latest
```

## Uninstallation

```bash
# Remove global package
npm uninstall -g @polymind/cli

# Remove config files
rm -rf ~/.config/polymind
```

## System Requirements

- **Node.js**: 18.17.0 or higher
- **npm**: 8.0.0 or higher
- **OS**: macOS, Linux, Windows (WSL recommended)
- **Terminal**: Modern terminal with Unicode support

## Next Steps

Once installed:

1. **Run setup**: `polymind init`
2. **Start a debate**: `polymind debate "Should AI have rights?"`
3. **Chat with persona**: `polymind chat`
4. **View status**: `polymind status`
5. **Customize**: `polymind config set theme dark`

## Support

- 📖 Docs: https://polymind.ai/docs
- 🐛 Issues: https://github.com/reyyanxahmed/polymind/issues
- 💬 Discord: https://discord.gg/4vCws5dfNh
