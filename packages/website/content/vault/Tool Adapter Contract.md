---
title: Tool Adapter Contract
permalink: tool-adapter-contract
createdAt: 2026-02-27
updatedAt: 2026-02-27
aliases:
  - tool contract
published: false
---

Every tool adapter should expose:

- typed input schema
- typed output schema
- stable error envelope
- idempotency notes

This contract decouples planner logic from transport details.

A good adapter makes retries safe and postmortems easier.

See [[harness-loop]], [[failure-taxonomy]], and [[trace-and-replay]].
