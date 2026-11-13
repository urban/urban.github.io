# Agent Instructions for Website

## Build System & Commands

```bash
pnpm install
pnpm --filter @apps/personal-website dev
pnpm --filter @apps/personal-website build
pnpm --filter @apps/personal-website serve
pnpm run check
```

## Website Architecture

- Astro static site generation with React islands for interactive components.
- TypeScript, Tailwind CSS 4, Effect, and MDX content with Shiki highlighting.
- Astro file-based routes live in `src/pages`.
- Site content lives in `content/` and is loaded at build time.
- Content is parsed and validated through Effect services in `src/lib/services/`.
