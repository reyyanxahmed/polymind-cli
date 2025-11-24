# PolyMind CLI - Deployment Guide

## Building for Production

### 1. Prepare the Package

```bash
cd packages/polymind-cli

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Verify build
ls -la dist/
```

### 2. Test Locally

Before publishing, test the package locally:

```bash
# Link globally
npm link

# Test commands
polymind --version
polymind --help
polymind init

# Unlink after testing
npm unlink -g @polymind/cli
```

### 3. Publish to npm

```bash
# Login to npm (first time only)
npm login

# Publish
npm publish --access public

# For pre-release versions
npm publish --access public --tag beta
```

### 4. GitHub Release

Create a release on GitHub:

```bash
# Tag the version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Create release on GitHub with:
# - Release notes
# - Binary attachments (optional)
# - Installation instructions
```

## Distribution Channels

### npm Registry

Primary distribution method:

```bash
npm install -g @polymind/cli
```

**Requirements:**
- npm account
- Organization access (@polymind scope)
- 2FA enabled

### GitHub Releases

Alternative installation:

```bash
npm install -g https://github.com/reyyanxahmed/polymind/releases/download/v1.0.0/polymind-cli-1.0.0.tgz
```

### Homebrew (Future)

For macOS users:

```bash
brew tap polymind/tap
brew install polymind-cli
```

**Setup required:**
1. Create homebrew-tap repository
2. Generate formula
3. Submit to homebrew-core

## CI/CD Pipeline

### GitHub Actions Workflow

`.github/workflows/publish-cli.yml`:

```yaml
name: Publish CLI

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: |
          cd packages/polymind-cli
          npm ci
      
      - name: Build
        run: |
          cd packages/polymind-cli
          npm run build
      
      - name: Test
        run: |
          cd packages/polymind-cli
          npm test
      
      - name: Publish to npm
        run: |
          cd packages/polymind-cli
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: packages/polymind-cli/dist/**
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Version Management

Follow semantic versioning (semver):

```bash
# Patch release (bug fixes)
npm version patch  # 1.0.0 -> 1.0.1

# Minor release (new features)
npm version minor  # 1.0.0 -> 1.1.0

# Major release (breaking changes)
npm version major  # 1.0.0 -> 2.0.0
```

## Pre-Release Checklist

- [ ] Update CHANGELOG.md
- [ ] Update version in package.json
- [ ] Run full test suite
- [ ] Build successfully
- [ ] Test installation locally
- [ ] Update documentation
- [ ] Tag release in git
- [ ] Publish to npm
- [ ] Create GitHub release
- [ ] Update website

## Post-Release Tasks

1. **Announce release**
   - Twitter/X post
   - Discord announcement
   - Reddit r/opensource
   - Dev.to article

2. **Update documentation**
   - Website docs
   - API reference
   - Migration guides

3. **Monitor**
   - npm download stats
   - GitHub issues
   - User feedback

## Rollback Procedure

If critical issues discovered:

```bash
# Deprecate faulty version
npm deprecate @polymind/cli@1.0.1 "Critical bug, use 1.0.0"

# Publish hotfix
npm version patch
npm publish

# Update GitHub release
# Add warning to release notes
```

## Distribution Stats

Monitor adoption:

```bash
# npm downloads
npx download-stats @polymind/cli

# GitHub stars/forks
# Check repository insights

# User feedback
# Monitor issues and discussions
```

## Security

### Dependency Audits

```bash
# Check vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Manual review
npm audit --json > audit.json
```

### Code Signing

For enhanced security:

```bash
# Sign package
npm pack
gpg --detach-sign --armor polymind-cli-1.0.0.tgz
```

## Support Channels

Post-release support:

- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Discord**: Real-time community support
- **Email**: support@polymind.ai for private issues

## Metrics to Track

- Daily downloads
- Active installations
- Issue resolution time
- Feature requests
- User satisfaction
- Performance metrics

## Future Enhancements

- [ ] Docker image
- [ ] Snap package (Linux)
- [ ] Chocolatey package (Windows)
- [ ] Homebrew formula (macOS)
- [ ] GitHub Codespaces integration
- [ ] VS Code extension integration
