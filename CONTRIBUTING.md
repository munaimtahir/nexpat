# Contributing to ClinicQ

Thank you for your interest in contributing to ClinicQ! This guide will help you get started.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/munaimtahir/nexpat.git
   cd nexpat
   ```

2. **Set up the environment**
   - See the [README.md](README.md) for detailed setup instructions
   - For backend: Python 3.12+, PostgreSQL
   - For frontend: Node.js 20+
   - For mobile: Expo CLI

## Branching Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks

## Commit Messages

Use semantic commit messages:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Example: `feat: add patient search by phone number`

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Linting passes (flake8, eslint)
- [ ] Documentation updated if needed
- [ ] No sensitive data or secrets in commits
- [ ] PR description clearly explains changes

## Testing

### Backend
```bash
cd apps/backend
pytest --cov
flake8 .
```

### Frontend
```bash
cd apps/web
npm test
npm run lint
```

## Code Review

All submissions require review. Be responsive to feedback and iterate on your changes as needed.

## Questions?

- Review existing issues and PRs
- Check documentation in `docs/`
- Open a discussion or issue for questions