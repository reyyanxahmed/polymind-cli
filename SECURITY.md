# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in PolyMind CLI, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: [your-security-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: We aim to respond within 48 hours
- **Updates**: We'll keep you informed of our progress
- **Credit**: Security researchers will be credited (if desired)
- **Timeline**: Fixes typically released within 7-14 days for critical issues

## Security Features

### API Key Protection
- API keys stored in `.env` files (git-ignored)
- Automatic redaction in logs and error messages
- Format validation per provider

### Input Sanitization
- Null byte removal
- Control character filtering
- Length limits (10,000 chars)
- Injection attack prevention

### Rate Limiting
- Default: 10 requests/minute
- Configurable via `MAX_REQUESTS_PER_MINUTE`
- Automatic backoff

### Error Handling
- Safe error messages (no stack traces to users)
- Sensitive data redaction
- Debug mode for developers only

### Dependencies
- Regular security audits via `npm audit`
- Automated updates for security patches
- Minimal dependency tree

## Best Practices for Users

1. **API Keys**
   - Never commit `.env` files
   - Use separate keys for dev/prod
   - Rotate keys regularly
   - Limit API key permissions

2. **Configuration**
   - Review `config.json` permissions
   - Don't share configuration files
   - Use environment-specific configs

3. **Updates**
   - Keep CLI updated: `npm update -g @polymind/cli`
   - Monitor security advisories
   - Review changelogs

4. **Environment**
   - Use Node.js LTS versions
   - Keep npm updated
   - Run in isolated environments when possible

## Security Checklist for Contributors

- [ ] No hardcoded credentials
- [ ] Input validation on all user inputs
- [ ] Sensitive data redacted in logs
- [ ] Dependencies regularly updated
- [ ] Security tests included
- [ ] Error messages don't leak info
- [ ] Rate limiting considered
- [ ] HTTPS only for API calls

## Disclosure Policy

We follow responsible disclosure:

1. **Private notification** to maintainers
2. **Fix development** and testing
3. **Security patch release**
4. **Public disclosure** after fix deployed
5. **CVE assignment** for critical issues

## Contact

- Security Email: [security@polymind.ai]
- GitHub Security: https://github.com/reyyanxahmed/polymind-cli/security
- GPG Key: [Optional GPG key for encrypted communications]

---

Thank you for helping keep PolyMind CLI secure! 🔒
