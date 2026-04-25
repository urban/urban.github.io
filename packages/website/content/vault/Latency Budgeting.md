---
title: Latency Budgeting
permalink: latency-budgeting
createdAt: 2026-02-27
updatedAt: 2026-02-27
aliases:
  - latency budget
published: false
---

Set a per-task latency budget before optimization work.
Split budget across:

- model thinking time
- tool execution time
- validation and formatting

When budgets are exceeded, record the dominant contributor.
Then optimize the highest-cost stage first.

Latency decisions should not reduce correctness from [[evaluation-corpus-design]].
Operational limits must still respect [[sandbox-policy-gates]].
