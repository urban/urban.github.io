---
title: Trace And Replay
permalink: trace-and-replay
created: 2026-02-27
updated: 2026-02-27
aliases:
  - trace replay
published: true
---

# Trace And Replay

Capture structured events for each loop step:

- inputs
- chosen action
- tool response
- validation result

Replaying traces on new harness versions reveals regressions quickly.
Store traces as append-only records so audits stay trustworthy.

Link traces to [[evaluation-corpus-design]] for repeatable scoring.
Trace quality also depends on [[tool-adapter-contract]].
