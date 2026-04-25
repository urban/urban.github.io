---
title: Harness Loop
permalink: harness-loop
createdAt: 2026-02-27
updatedAt: 2026-02-27
aliases:
  - harness loop
published: false
---

An AI harness loop is a repeatable cycle:

1. ingest task context
2. plan one concrete move
3. execute with tools
4. validate against expectations
5. report state and next action

The loop should be explicit and observable so failures are debuggable.

Design links:

- Runtime behavior lives in [[effect-runtime-boundary]].
- Tool calls follow [[tool-adapter-contract]].
- Verification quality depends on [[evaluation-corpus-design]].
