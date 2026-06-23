---
title: "[DRAFT - replace with real content] BUMP prototype notes"
date: 2025-01-15 09:00:00 -0500
categories: [hardware, medical-devices]
tags: [BUMP, bradycardia, wearable]
---

> **Draft scaffold.** Replace this post with real technical content before publishing.

## Context

BUMP is a closed-loop wearable atropine pump for bradycardia. This post will document prototype architecture, sensing, and dosing control once finalized.

## Planned sections

1. Problem framing and design goals
2. Hardware stack (sensors, pump, microcontroller)
3. Control loop overview
4. Bench testing methodology
5. Open questions and next steps

## Placeholder diagram

```text
[ heart rate sensor ] --> [ controller ] --> [ peristaltic pump ] --> [ atropine delivery ]
                              ^
                              |
                        [ safety limits ]
```

## Status

Prototype built with Ben Gracias. USPTO provisional [VERIFY: #63/686,176]. Advised by Dr. Gopal at Harvard Medical School.
