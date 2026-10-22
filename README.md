## Prerequisites and Setup

### Using Nix

Using Nix ensures that all developers have the exact same development environment, eliminating "it works on my machine" problems.

#### Setup Steps

1. Install Nix:

```bash
# For macOS and Linux
sh <(curl -L https://nixos.org/nix/install) --daemon

# For more installation options, visit:
# https://nixos.org/download.html
```

2. Enable Flakes (if not already enabled):

```bash
# Add this to ~/.config/nix/nix.conf or /etc/nix/nix.conf
experimental-features = nix-command flakes
```

To enter a Nix shell session with dependencies defined in a flake, you primarily use the `nix develop` command.

- **Navigate to the flake's directory:** Open your terminal and change your current directory to the root of the Nix flake project where the `flake.nix` file resides.
- **Enter the development shell:** Execute the following command:

```bash
# From the project root
nix develop --command "$SHELL"
```

## Development

Run `bun install` to install dependencies. The `postinstall` script patches
TypeScript, Oxlint, and `oxlint-tsgolint` with `@effect/tsgo`. There is no `prepare`
script or Git hook. If install scripts are disabled, run `bun run postinstall`
manually before using the compiler, editor, or linter.

Keep `@effect/tsgo`, TypeScript, Oxlint, and `oxlint-tsgolint` on versions supported
by the [Effect TS Go compatibility matrix](https://github.com/Effect-TS/tsgo#supported-package-versions).
The patch command validates compatibility.

`oxlint.config.ts` extends the shared TypeScript config and Effect recommended
preset, with type-aware linting enabled for both CLI and editor use. Run
`bun run check` for full validation, or `bun run lint` for formatting and linting.
Linting reports issues without applying code fixes; use `bunx oxlint --fix`
explicitly when wanted.

In VS Code, install the recommended TypeScript 7 and Oxc extensions and select the
workspace TypeScript version. The workspace SDK is patched with the Effect LSP,
so do not run a second Effect or TypeScript language server alongside it.
The `@effect/language-service` plugin name in tsconfig is intentional: Effect TS
Go still uses it for configuration. Its diagnostics are disabled there to avoid
duplicating the Effect diagnostics emitted by Oxlint; other LSP features remain
enabled.
