# Repository Structure Improvement Recommendations

This document outlines opportunities to streamline the monorepo layout so teams can discover code, docs, and automation assets faster. The suggestions favor gradual refactors that can be executed in parallel with ongoing feature work.

## Guiding Principles

- **Group by deployable unit** so every runtime (backend API, web SPA, mobile app) sits under a common `apps/` hierarchy with consistent names and README entry points.
- **Separate delivery tooling** (DevOps, deployment manifests, CI scripts) from product code to reduce clutter at the repository root.
- **Curate documentation** in a predictable structure that distinguishes quick-start guides from deep references and historical artifacts.
- **Keep compatibility shims** (e.g., symlinks or README breadcrumbs) during the migration to avoid breaking developer muscle memory.

## Recommended Target Layout

```
/
├── apps/
│   ├── backend/              # Django project (currently `clinicq_backend`)
│   ├── web/                  # React web client (currently `clinicq_frontend`)
│   └── mobile/               # Expo client (currently `clinicq_Mobile`)
│       └── README.md
├── docs/
│   ├── guides/               # Quick starts, onboarding, troubleshooting
│   ├── references/           # API reference, data models, architecture
│   ├── decisions/            # ADRs, decision_log.md, ROADMAP.md
│   └── ops/                  # Deployment validation, CI/CD, infra runbooks
├── infra/
│   ├── deploy/               # docker-compose*, nginx configs, systemd units
│   ├── scripts/              # Helper scripts currently in `/deploy`
│   └── secrets/              # Templates and documentation for secret management
├── tooling/
│   ├── ci/                   # GitHub Actions / automation manifests
│   └── linting/              # Shared config: mypy.ini, pytest.ini, etc.
├── CHANGELOG.md
├── CONTRIBUTING.md
├── README.md
└── ...
```

### Naming Normalization

- Rename existing application directories using lower-case kebab or snake case that matches the future `apps/` subdirectories (`clinicq_backend` → `backend`, `clinicq_frontend` → `web`, `clinicq_Mobile` → `mobile`).
- Introduce root-level aliases (e.g., `apps/backend/README.md`) with short summaries and links to deeper setup instructions so onboarding remains frictionless.

### Documentation Consolidation

- Move operational documents (`DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_VALIDATION.md`, `CI_CD.md`, `DEPLOY.md`) into `docs/ops/` while adding index pages that point developers to the correct guide for each environment.
- Cluster product planning artifacts (`PROJECT_BRIEF.md`, `ROADMAP.md`, `BACKLOG.md`, `development_plan.md`) under `docs/decisions/` and add a `docs/decisions/README.md` that explains how to trace historical context.
- Keep frequently referenced quick-start information (currently in the root `README.md`) concise and relocate deep setup steps into `docs/guides/local-development.md` so the root README stays approachable.

### Automation & Configuration

- Relocate configuration files consumed by linting, typing, or testing (`pytest.ini`, `mypy.ini`) into `tooling/linting/` and update tool invocation paths. Add a short `tooling/README.md` describing shared developer tooling.
- Gather deployment automation currently split across `deploy/` and the repo root (Docker Compose files) into the new `infra/` subtree. Provide a matrix in `infra/README.md` that maps environments (local dev, staging, production) to the compose file or Kubernetes manifests they should use.

## Phased Migration Plan

1. **Introduce new directories** (`apps/`, `infra/`, `tooling/`) and move non-breaking assets (documentation, helper scripts) while updating README links.
2. **Move application code** one directory at a time, updating import paths, Docker contexts, CI jobs, and developer docs in lockstep. Validate each move with automated tests before merging.
3. **Deprecate old paths** by keeping shim READMEs or symlinks for one or two releases, then remove them once teams transition their local tooling.
4. **Automate verification** by adding CI checks that ensure new top-level files conform to the target layout (e.g., lint for stray docs at the repo root).

## Additional Opportunities

- Add a `docs/architecture/` section with high-level diagrams showing component relationships; this pairs naturally with the reorganized `docs/` tree.
- Create a `makefile` or `justfile` at the root that shells out to `apps/` sub-project scripts, helping new contributors perform common tasks without memorizing deep paths.
- Document a "monorepo governance" policy so future services follow the same naming conventions and directory placement, preventing drift.

Adopting these changes incrementally will make the repository easier to navigate, reduce onboarding time, and improve maintainability as additional services are added.
