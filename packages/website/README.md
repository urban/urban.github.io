## Getting started

Run the development server from this package:

```bash
pnpm dev
```

Or run it from the monorepo root:

```bash
pnpm --filter @apps/personal-website dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site. Edit files in `src/app` to make changes.

## Tech stack

- [Next.js](https://nextjs.org/) 16 and [React](https://react.dev/) 19 for the website.
- [TypeScript](https://www.typescriptlang.org/) for type-safe application code.
- [Tailwind CSS](https://tailwindcss.com/) 4 for styling.
- [MDX](https://mdxjs.com/) for content, compiled with [Shiki](https://shiki.style/) for code highlighting and rehype plugins for HTML transforms.
- [Effect](https://effect.website/) for content processing and application services.
