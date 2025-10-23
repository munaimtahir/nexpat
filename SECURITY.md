# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please do **not** open a public issue. Instead:

1. Email the maintainers directly
2. Include detailed information about the vulnerability
3. Allow reasonable time for a fix before public disclosure

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### Environment Variables

- Never commit `.env` files with real credentials
- Use `.env.example` templates for documentation
- Rotate secrets regularly in production

### Personal Identifiable Information (PII)

- Patient data must be handled with care
- Follow HIPAA guidelines for healthcare data
- Use encryption for data at rest and in transit
- Implement proper access controls

### Dependency Management

- Run `npm audit` regularly for frontend dependencies
- Run `pip check` for backend dependencies
- Keep dependencies up to date
- Review security advisories

### Authentication & Authorization

- Use strong token-based authentication
- Implement role-based access control (RBAC)
- Never expose authentication tokens in logs
- Use HTTPS in production

### Code Review

- All code changes require review
- Run security scans as part of CI/CD
- Use static analysis tools (CodeQL enabled)

### Production Deployment

- Use secure environment variables
- Enable HTTPS and HSTS headers
- Configure CORS appropriately
- Regular security audits and penetration testing

## Vulnerability Disclosure Timeline

1. Report received: Acknowledged within 48 hours
2. Assessment: Within 7 days
3. Fix development: Based on severity
4. Public disclosure: After fix is deployed