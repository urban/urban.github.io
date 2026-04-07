---
title: "agent-skills"
description: "A collection of atomic AI agent skills."
createdAt: 2026-04-07
updatedAt: 2026-04-07
demoURL: ""
repoURL: "https://github.com/urban/agent-skills"
published: true
---

This repo is a personal macOS development environment bootstrapper—but it’s more than a typical “here are my shell configs” dotfiles repo.

## What this project is

At its core, this repo does 3 jobs:

1. Sets up a new Mac
   - installs Xcode Command Line Tools
   - installs Homebrew
   - installs packages from a Brewfile
   - installs Nix
2. Manages personal config files
   - symlinks shell dotfiles from home/ into $HOME
   - symlinks VS Code settings from vscode/ into the right macOS path
   - optionally backs up conflicting existing files before replacing them
3. Creates a reproducible dev sandbox
   - provides sandbox.sh to run any project command inside a Docker container
   - persists tool state across runs
   - bootstraps Nix, Node tooling, GitHub auth, and Codex auth inside the container

So the repo is really a full developer workstation opinion, not just dotfiles.

────────────────────────────────────────────────────────────────────────────────

## What makes it unique

### 1. It combines “dotfiles” with “machine bootstrap”

A lot of dotfiles repos stop at shell aliases and editor settings. This one goes further: it’s designed to take a fresh macOS machine and make it usable
quickly.

The main script, dotfiles.sh, handles both:

- config symlinking
- package installation
- first-machine setup tasks

That makes it closer to a personal provisioning system than a plain config backup.

### 2. It has a strong opinion about filesystem layout

The repo expects a specific home for code:

- code lives under /Volumes/Code
- the repo itself lives at /Volumes/Code/personal/dotfiles

That’s unusual, and it matters. The scripts actively optimize for that layout, even excluding /Volumes/Code from Spotlight indexing. This gives the setup a very
deliberate “this is how my machine should be organized” feel.

### 3. It treats symlinking as a first-class workflow

Instead of copying files around, it uses GNU Stow to manage dotfiles and VS Code config cleanly. It also adds a nice touch many dotfiles repos skip: interactive
backup of conflicting files before replacement.

That makes the setup safer on an existing machine, not just on a brand-new one.

### 4. It includes a dev sandbox, not just host-machine config

sandbox.sh is the most distinctive part of the repo.

It spins up a Docker-based environment that:

- mounts the current project into /app
- persists tool state in a per-project .sandbox/ directory
- shares a persistent Docker volume for the Nix store
- forwards Git author identity
- installs and configures tools on first run
- supports authenticated tooling like GitHub CLI and OpenAI Codex

That means this repo isn’t only about customizing the host Mac. It also defines a portable, isolated development environment for working inside projects.

### 5. It mixes multiple package ecosystems pragmatically

Instead of choosing one toolchain ideology, the repo uses:

- Homebrew for macOS packages and apps
- Nix for sandbox/container tooling
- npm for global CLI installs in the sandbox
- Stow for config management

That hybrid approach is practical and personal. It’s not trying to be “pure”; it’s trying to be effective.

### 6. It encodes a specific AI-heavy developer workflow

The Brewfile and sandbox setup make this especially distinctive. This setup includes tools like:

- ChatGPT
- Claude
- Claude Code
- Codex
- Gemini CLI
- OpenCode
- Ollama
- GitHub CLI

Plus VS Code is configured to work with agent files and MCP discovery. So this repo captures a modern AI-assisted development environment, not just a
traditional terminal/editor setup.

### 7. It extends beyond shell config into OS preferences

The macos/settings.sh script applies system defaults for:

- Dock behavior
- Finder behavior
- text editing/autocorrect
- Activity Monitor
- battery/menu bar settings

That pushes the repo into machine ergonomics territory: it doesn’t just configure tools, it configures how the operating system feels.
