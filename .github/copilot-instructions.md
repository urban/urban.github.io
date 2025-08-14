# Urban.github.io Copilot Instructions

These instructions are for GitHub Copilot and GitHub Copilot Chat. They are designed to help the AI understand my coding style, preferences, and the context of my projects.

# Overview

This is a personal website and blog built with Next.js and TypeScript. It features articles, projects, and other content related to my work and interests.

## Tech Stack

- **Language**: TypeScript
- **Frameworks/Libraries**: Effect
- **Package Manager**: pnpm
- **Environment Management**: Nix
- **Build Tools**: Turbo, tsup
- **Testing**: Vitest
- **Linting & Formatting**: ESLint, Prettier
- **Version Control**: Git, GitHub

## Structure

```
├── apps/
│   └── web/            # Next.js app for main website
├── packages/
│   └── eslint/              # Shared ESLint config
│   └── prettier/            # Shared Prettier config
│   └── typescript/          # Shared TypeScript config
├── turbo.json               # Turbo build configuration
└── package.json             # Root package with scripts
```

# General Instructions

1. **Understand the Project Structure**: Familiarize yourself with the overall structure of the projects, including key directories and files.
2. **Coding Style**: Adhere to the coding style used in the project. This includes naming conventions, indentation, and commenting style.
3. **Context Awareness**: Always consider the context of the code you are generating or modifying. Ensure that your suggestions align with the existing codebase and project goals.
4. **Error Handling**: Implement robust error handling in your code suggestions. Anticipate potential issues and provide solutions.
5. **Performance**: Optimize your code for performance where applicable. Avoid unnecessary computations and strive for efficiency.
6. **Security**: Be mindful of security best practices. Avoid introducing vulnerabilities in your code.
7. **Documentation**: When generating code, include appropriate comments and documentation to explain the purpose and functionality of the code.
8. **Testing**: Suggest or include tests for new functionality to ensure code reliability.

# Specific Instructions

1. **Use TypeScript**: Always write code in TypeScript.
2. **Pure ESM**: All packages use `"type": "module"`.
3. **tsx Development**: Packages run directly from TypeScript source in dev mode.
4. **Turbo Caching**: Command outputs are cached for faster Developer Experience (DX).
5. **Effect Library**: Use the Effect library for managing side effects and asynchronous operations.
6. **Functional Programming**: Prefer functional programming paradigms and immutable data structures where possible.
7. **Project-Specific Guidelines**: Follow any additional guidelines specific to the project you are working on, as outlined in the project documentation or comments within the codebase.

## Resources

Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

- [Effect Documentation](https://effect-ts.github.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
