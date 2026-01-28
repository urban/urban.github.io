# Agent Instructions for Website

## Build System & Commands

This is a **Turborepo** monorepo using Bun workspaces. Common commands:

```bash
# Install dependencies
bun run install

# Development
bun run dev          # Start all apps in dev mode
bun run build        # Build all packages/apps
bun run serve        # Serve built static files

# Testing & Linting
bun run test         # Run tests across all packages
bun run lint         # Lint all packages
bun run typecheck    # TypeScript type checking
```

## Website Architecture

**Tech Stack:**

- Next.js 15 with static export (`output: "export"`)
- TypeScript with strict configuration
- Effect-TS for functional programming patterns
- Tailwind CSS 4.x for utility styles
- MDX for content with gray-matter frontmatter
- Shiki for syntax highlighting

**Key Patterns:**

- **Effect Services**: Uses Effect-TS service pattern for dependency injection (see `src/services/`)
- **Schema-first**: Effect Schema classes for type-safe data structures (`src/schema.ts`)
- **File-based routing**: Next.js App Router with content loaded from `data/` directory
- **Static generation**: All content pre-rendered at build time

**Service Layer:**

- `Content.ts` - Handles MDX file reading and parsing
- `Metadata.ts` - Processes frontmatter and content
- `Slug.ts` - URL slug generation and encoding
- `Mdx.ts` - MDX compilation and rendering
- `RuntimeClient.ts`/`RuntimeServer.ts` - Effect runtime management

**Content Pipeline:**

1. MDX files in `data/articles/` →
2. Content service reads and parses →
3. Schema validation via Effect →
4. Static generation at build time

## Development Notes

- The site is configured for static export - no server-side features
- Content is sourced from `data/` directory at build time
- Uses workspace protocol (`workspace:*`) for internal package dependencies
- ESLint uses native Node.js TypeScript support (`--flag unstable_native_nodejs_ts_config`)
