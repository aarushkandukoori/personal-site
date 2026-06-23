---
title: "[DRAFT - replace with real content] TPC-DS Parquet vertical partitioning harness"
date: 2025-02-10 09:00:00 -0500
categories: [systems, databases]
tags: [Rust, DataFusion, Parquet, TPC-DS]
---

> **Draft scaffold.** Replace this post with measured benchmark results and methodology.

## Context

Rust and DataFusion benchmark harness for TPC-DS, evaluating vertical partitioning in Apache Parquet. Work with Drew Ripberger at CMU.

## Planned sections

1. Motivation: when vertical partitioning helps Parquet scans
2. Harness design (query set, dataset layout, reproducibility)
3. Partitioning schemes under test
4. Results tables and plots (to be added)
5. Limitations and future work

## Placeholder code

```rust
// Scaffold only: no fabricated benchmark numbers.
fn run_query_suite(config: &BenchConfig) -> Vec<QueryResult> {
    todo!("wire DataFusion session and TPC-DS query set")
}
```

## Status

Implementation in progress. Benchmark numbers will be added when runs are complete.
