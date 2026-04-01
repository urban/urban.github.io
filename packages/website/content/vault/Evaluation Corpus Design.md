---
title: Evaluation Corpus Design
permalink: evaluation-corpus-design
createdAt: 2026-02-27
updatedAt: 2026-02-27
aliases:
  - eval corpus
published: true
---

Build a corpus of realistic tasks with expected outcomes.
Each case should include:

- task statement
- fixture files
- pass and fail criteria

Partition by capability: parsing, editing, testing, and recovery.
Track drift as harness prompts and tools evolve.

Scoring becomes reliable when paired with [[trace-and-replay]].
Coverage planning is guided by [[failure-taxonomy]].
