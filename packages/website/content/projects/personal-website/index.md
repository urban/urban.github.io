---
title: "Personal Website"
description:
  "This is my personal website monorepo that combines a traditional portfolio/resume site with a markdown-powered note vault and
  interactive knowledge graph, built with Next.js, Effect, MDX, and Pixi."
createdAt: 2026-03-31
updatedAt: 2026-03-31
demoURL: "https://urbanfaubion.com"
repoURL: "https://github.com/urban/urban.github.io"
---

This repo is a monorepo my personal website at [urbanfaubion.com](https://urbanfaubion.com).

## What it is

At the top level, it contains a Next.js 16 static site plus a couple of reusable internal packages:

- packages/website — the actual site
- packages/build-graph — a markdown/wiki-link graph builder
- packages/graph-view — an interactive graph renderer using Pixi.js + d3-force
- packages/oxc-config — shared lint config

## What the website does

The site is a content-driven personal portfolio / knowledge garden. It has routes for:

- / — homepage / personal intro
- /work — work history
- /projects — project collection
- /essays — essay collection
- /vault — a “vault” of linked notes, with backlinks and a graph view

## Content model

Content lives under packages/website/content:

- work/\*.md — resume-style work entries
- projects/\*/index.md — projects
- essays/\*/index.{md,mdx} — essays
- vault/\*.md — note-taking / wiki-style pages

The site loads markdown/MDX through an Effect-based content service in:

- packages/website/src/lib/services/Content.ts

That service:

- globs files from the content folders
- parses frontmatter with gray-matter
- validates metadata with effect/Schema
- compiles MDX
- exposes typed APIs like getWork(), getProjects(), getEssays(), getVault()

## Distinctive feature: the Vault

The most interesting part of the repo is the vault system.

Vault notes support Obsidian-style wiki links like:

- [[AI Harness Learning]]
- [[some-note|Custom Label]]

Those links are:

- parsed and rewritten
- resolved against published notes and aliases
- used to build a graph snapshot
- rendered on vault pages with an interactive graph
- used to compute backlinks

Relevant files:

- packages/website/src/lib/vault.ts
- packages/website/src/lib/vaultGraph.ts
- packages/website/src/app/vault/\*
- packages/build-graph/\*
- packages/graph-view/\*

So this is not just a brochure site — it has a small internal knowledge graph system.

## Tech stack

Main stack:

- Bun for package management / scripts
- Turbo for monorepo orchestration
- Next.js app router
- React 19
- Effect for typed services/effects/schemas
- MDX for content rendering
- Tailwind CSS 4
- Pixi.js + d3-force for graph visualization
- Playwright for visual/browser tests in graph-view
- oxlint / oxfmt for linting/formatting

## Architecture style

The repo is fairly modular:

- Website package focuses on routes, UI, and content consumption
- Graph parsing/building is extracted into @urban/build-graph
- Graph rendering/bootstrap is extracted into @urban/graph-view

That suggests the author is treating the vault graph as a reusable subsystem, not just page-specific code.

Current state / content notes

A few things stand out from the current content:

- work content is populated and appears to be the primary portfolio material
- vault content is populated with notes around AI harnesses, Effect runtime boundaries, latency, sandbox policy, etc.
- essays currently looks empty except for a placeholder
- projects exists, though one project entry appears to still contain template/demo content (Astro Nano), so that area may still be in
  progress

## Build/output behavior

The website is configured as a static export:

- packages/website/next.config.ts sets output: "export"
- output goes to packages/website/out

So this repo is optimized for generating a static deployable site.
