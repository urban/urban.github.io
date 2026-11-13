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
