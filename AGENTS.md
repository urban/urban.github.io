# Agent Instructions for Development

## Development Environment

This repository uses **Nix** for reproducible development environments. To get started:

```bash
nix develop --command "$SHELL"
```

The project requires Node.js >= 24.12.0 and uses Bun as the package manager.

## Build System & Commands

This is a **Turborepo** monorepo using Bun workspaces. Common commands:

```bash
# Install dependencies
bun install

# Development
bun run dev          # Start all apps in dev mode

# Building
bun run build        # Build all packages/apps

# Testing & Linting
bun run test         # Run tests across all packages
bun run lint         # Lint all packages
bun run typecheck  # TypeScript type checking
```

## Architecture Overview

### Monorepo Structure

- `packages/website/` - Next.js 15 static site with MDX content
- `packages/eslint-config/` - Shared ESLint configurations
- `packages/prettier-config/` - Shared Prettier configuration
- `packages/config-typescript/` - Shared TypeScript configuration

## TypeScript Configuration

Uses a strict base configuration (`tsconfig.base.json`) with:

- `exactOptionalPropertyTypes: true`
- `noUncheckedIndexedAccess: true`
- Effect language service plugin
- Module path aliases for clean imports

Each package extends the base config with workspace-specific settings.
