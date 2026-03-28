---
title: Effect Runtime Boundary
permalink: effect-runtime-boundary
created: 2026-02-27
updated: 2026-02-27
aliases:
  - runtime boundary
published: true
---

Define where pure planning ends and side effects begin.

Use `Effect` values for planning, validation, and transformations.
Cross the boundary only when invoking tool adapters or file I/O.

Benefits:

- deterministic tests for pure logic
- centralized error tagging for side effects
- easier retries with policy controls

Related notes: [[harness-loop]], [[sandbox-policy-gates]], [[trace-and-replay]].
