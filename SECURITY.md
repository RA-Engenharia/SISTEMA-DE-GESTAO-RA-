# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take the security of SISTEMA-DE-GESTAO-RA seriously. If you have discovered a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public issue
2. Open a private security advisory at: https://github.com/RA-Engenharia/SISTEMA-DE-GESTAO-RA-/security/advisories/new
3. Or email security concerns to: security@ra-engenharia.com
4. Include the following information:
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its impact within 7 days
- **Updates**: We will keep you informed of our progress
- **Resolution**: We will work to fix confirmed vulnerabilities promptly
- **Disclosure**: We will coordinate public disclosure of the vulnerability with you

## Security Best Practices for Contributors

### Dependencies

- **Always audit dependencies** before adding them to the project
- Run `npm audit` or equivalent before committing
- Keep dependencies up to date with security patches
- Use exact versions in production (no ^ or ~)
- Review Dependabot alerts promptly

### Code Security

- **Never commit secrets** (API keys, passwords, tokens)
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Follow the principle of least privilege
- Enable HTTPS and secure headers
- Implement rate limiting on APIs
- Log security-relevant events

### Development Environment

- Use the latest stable version of your runtime (Node.js 20.x LTS)
- Keep your development tools updated
- Use a linter to catch common security issues
- Run security tests in your CI/CD pipeline
- Enable pre-commit hooks for security checks

## Automated Security

This project uses the following automated security tools:

- **Dependabot**: Automated dependency updates and security alerts
- **GitHub Advanced Security**: Code scanning and secret scanning
- **CI/CD Security Audits**: Automated vulnerability scanning on every PR
- **ESLint Security Plugin**: Static analysis for security issues

## Security Checklist

Before deploying or releasing:

- [ ] All dependencies are up to date
- [ ] No high or critical severity vulnerabilities
- [ ] Security audit has been run (`npm audit`)
- [ ] No secrets in code or version control
- [ ] Environment variables are properly configured
- [ ] Authentication and authorization are implemented
- [ ] Input validation is in place
- [ ] HTTPS is enforced
- [ ] Security headers are configured (Helmet.js)
- [ ] Rate limiting is implemented
- [ ] Logging and monitoring are configured
- [ ] Backups are configured and tested

## Security Features Implemented

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries via Prisma ORM
- **XSS Protection**: React's built-in escaping + Helmet.js headers
- **CSRF Protection**: SameSite cookies + origin validation
- **Rate Limiting**: Express rate limiter on all API endpoints
- **Security Headers**: Comprehensive headers via Helmet.js

## Contact

For security-related questions or concerns:
- Security Email: security@ra-engenharia.com
- GitHub Security Advisories: https://github.com/RA-Engenharia/SISTEMA-DE-GESTAO-RA-/security

---

Last Updated: 2025-12-31
