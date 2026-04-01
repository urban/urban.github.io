---
title: Sandbox Policy Gates
permalink: sandbox-policy-gates
createdAt: 2026-02-27
updatedAt: 2026-02-27
aliases:
  - policy gates
published: true
---

A harness should model permissions as explicit gates:

- read-only
- workspace-write
- escalated execution

Each planned action is checked against the current gate.
If blocked, the harness asks for approval with a precise justification.

Policy gates prevent accidental destructive commands while preserving momentum.

See [[effect-runtime-boundary]] and [[failure-taxonomy]].
