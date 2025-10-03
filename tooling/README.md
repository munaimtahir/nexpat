# Tooling

This directory contains shared developer tooling, CI/CD configurations, and linting/testing configurations.

## Structure

### `linting/`
Shared configuration files for code quality tools:
- `.flake8` - Python linting configuration
- `mypy.ini` - Python type checking configuration
- `pytest.ini` - Python test runner configuration

These files are referenced by their respective tools when run from application directories.

### CI/CD

GitHub Actions workflows are in `.github/workflows/` at the repository root (GitHub requirement).

The main CI workflow:
- Runs linting and formatting checks
- Executes backend tests with coverage (80% minimum)
- Executes frontend tests with coverage
- Builds frontend for production
- Archives build artifacts

## Usage

### Running Linters Locally

**Backend (Python):**
```bash
cd apps/backend
flake8 .
black --check .
mypy .
```

**Frontend (JavaScript):**
```bash
cd apps/web
npm run lint
```

### Running Tests

**Backend:**
```bash
cd apps/backend
pytest --cov=api --cov-report=term-missing
```

**Frontend:**
```bash
cd apps/web
npm test
```

### Configuration Management

When updating linting rules:
1. Edit the appropriate config file in `tooling/linting/`
2. Test changes locally in each application
3. Commit and push - CI will use updated configs

## Adding New Tools

When adding new development tools:
1. Place shared configuration in `tooling/linting/`
2. Update this README with usage instructions
3. Add to CI workflow if applicable
4. Document in application-specific READMEs
