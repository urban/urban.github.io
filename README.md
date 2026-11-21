# urbanfaubion.com

## Prerequisites

- Node.js 24.12 or later
- pnpm 10.8.1

## Development

Run `pnpm install` to install dependencies. The `postinstall` script patches
TypeScript, Oxlint, and `oxlint-tsgolint` with `@effect/tsgo`. There is no `prepare`
script or Git hook. If install scripts are disabled, run `pnpm run postinstall`
manually before using the compiler, editor, or linter.

Keep `@effect/tsgo`, TypeScript, Oxlint, and `oxlint-tsgolint` on versions supported
by the [Effect TS Go compatibility matrix](https://github.com/Effect-TS/tsgo#supported-package-versions).
The patch command validates compatibility.

`oxlint.config.ts` extends the shared TypeScript config and Effect recommended
preset, with type-aware linting enabled for both CLI and editor use. Run
`pnpm run check` for full validation, or `pnpm run lint` for formatting and linting.
Linting reports issues without applying code fixes; use `pnpm exec oxlint --fix`
explicitly when wanted.

In VS Code, install the recommended TypeScript 7 and Oxc extensions and select the
workspace TypeScript version. The workspace SDK is patched with the Effect LSP,
so do not run a second Effect or TypeScript language server alongside it.
The `@effect/language-service` plugin name in tsconfig is intentional: Effect TS
Go still uses it for configuration. Its diagnostics are disabled there to avoid
duplicating the Effect diagnostics emitted by Oxlint; other LSP features remain
enabled.

## Developing unfinished sections

Now and Garden are enabled by `pnpm --filter @apps/personal-website dev` and are
omitted from production navigation, routes, and copied content assets. Their page
components live in `packages/website/src/sections`, and the `section-routes`
integration registers only enabled sections.

To publish a section, enable its entry in `productionSections` in
`packages/website/src/lib/sections.ts`. Article-level `published` metadata still
controls which entries appear within an enabled section.

The asset-copy command defaults to production visibility. To refresh local draft
images, including after a production build while the dev server is running, use
`pnpm --filter @apps/personal-website copy-assets --development`.

## Publishing

### Vercel

The root `vercel.json` installs the pnpm workspace, builds the Astro package,
verifies production output, and serves `packages/website/dist` as a static site.
It sets the framework to Other (`null`) so a previous Next.js preset does not
apply to this build.

In Vercel's **Settings > Build and Deployment**:

- Leave **Root Directory** empty (the repository root), rather than
  `packages/website`. The install needs the root `pnpm-workspace.yaml`, lockfile,
  dependency catalog, and sibling packages.
- Select **Node.js 24.x** or a newer supported version that meets `engines.node`.
- The install command, build command, and output directory come from
  `vercel.json`; remove any obsolete dashboard overrides for Bun or Next.js.

To use the exact pnpm version in the root `packageManager` field, enable Vercel's
Corepack support by setting the environment variable
`ENABLE_EXPERIMENTAL_COREPACK=1` for the deployment environments.

Bun is still used to execute the asset and verification scripts during the build;
dependency installation uses pnpm. Vercel's build image includes Bun.
The site uses Astro's static output and does not require a Vercel adapter.

After committing these files, deploy the new commit. The dependency-install log
should show `pnpm install --frozen-lockfile`, followed by the Astro build.

### GitHub Pages

GitHub Pages publishes `packages/website/dist` when changes reach `main`. The
`Publish website` workflow installs the pinned tools, builds the static site,
verifies disabled sections have no pages, content assets, or links, and deploys
the resulting artifact. It can also be run manually from GitHub Actions.

Run `pnpm run check` and `pnpm --filter @apps/personal-website build` before
publishing. The build's `verify:production` step checks actual generated output.
