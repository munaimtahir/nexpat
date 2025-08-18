# Contributing to ClinicQ

Thanks for considering contributing to ClinicQ. This document outlines how to set up your environment, coding standards, and the workflow for submitting changes.

## Development Workflow

1. Fork the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Set up the development environment. The recommended way is using Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Make your changes in the appropriate backend or frontend directories.
4. Run tests and linters before committing:
   - **Backend**: `pytest`
   - **Frontend**: `npm test -- --watchAll=false`
5. Ensure code is formatted and linted:
   - **Python**: use `black` and `flake8`
   - **JavaScript/TypeScript**: use `eslint` and `prettier`
6. Commit with clear messages and push the branch to your fork.
7. Open a pull request describing your changes and the tests you ran.

## Code Standards

- Follow [PEP 8](https://pep8.org/) for Python code and format using `black` (default line length).
- Use `eslint` with the project's configuration for JavaScript/TypeScript.
- Write or update tests for new features or bug fixes.
- Update documentation and the changelog when appropriate.

## Pull Requests

- Each pull request should focus on a single change or fix.
- The pull request description should summarize the change and reference related issues.
- All tests and lint checks must pass before the pull request is reviewed.

Thank you for contributing!

