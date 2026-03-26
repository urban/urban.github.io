In all interaction and commit messages, be extremely concise and sacrifice grammar for the sake of concision.

## Code Quality Standards

- Make minimal, surgical changes
- **Never compromise type safety**: No `any`, no non-null assertion operator (`!`), no type assertions (`as Type`)
- **Make illegal states unrepresentable**: Model domain with ADTs/discriminated unions; parse inputs at boundaries into typed structures; if state can't exist, code can't mishandle it
- **Abstractions**: Consciously constrained, pragmatically parameterised, doggedly documented

## Entropy Reminder

This codebase will outlive you. Every shortcut you take becomes someone else's burden. Every hack compounds into technical debt that slows the whole team down.

You are not just writing code. You are shaping the future of this project. The patterns you establish will be copied. The corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.

## Testing

Write tests that verify semantically correct behavior
Failing tests are acceptable when they expose genuine bugs and test correct behavior
Before a task is complete, run full monorepo verification from repo root
Required completion gate: `bun run lint`
Required completion gate: `bun run test`
Required completion gate: `bun run typecheck`
Package-local checks fine during iteration, but never sufficient for task completion

## Information

- The base branch for this repository is 'main'.
- The package manager is Bun.

# Learning more about the "effect" & "@effect/\*" packages

`.repos/effect/LLMS.md` is an authoritative source of information about the "effect" and "@effect/\*" packages. Read this before looking elsewhere for
information about these packages. It contains the best practices for using effect.

Use this for learning more about the library, rather than browsing the code in `node_modules/`.
