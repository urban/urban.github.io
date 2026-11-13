## Getting started

Run the development server from this package:

```bash
pnpm dev
```

Or run it from the monorepo root:

```bash
pnpm --filter @apps/personal-website dev
```

Open [http://localhost:4321](http://localhost:4321) to view the site. Edit files in `src/pages` to make changes.

## Tech stack

- [Astro](https://astro.build/) for static site generation, with [React](https://react.dev/) islands for interactive components.
- [TypeScript](https://www.typescriptlang.org/) for type-safe application code.
- [Tailwind CSS](https://tailwindcss.com/) 4 for styling.
- [MDX](https://mdxjs.com/) for content, compiled with [Shiki](https://shiki.style/) for code highlighting and rehype plugins for HTML transforms.
- [Effect](https://effect.website/) for content processing and application services.
