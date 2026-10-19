---
title: "Show Me the Real Thing: Verbatim Files, Lossless Encoders, and Models That Break When You Act"
date: 2026-10-19 05:45:06 -04:00
categories: [Writing, Research]
tags: [coding-agents, context-windows, robot-learning, forecasting, open-weights, representation-learning, ai-research, weekly-reads, machine-learning]
math: true
---

With the same token budget, a coding agent resolves 6.3 more points' worth of issues when it sees a few whole files exactly as written than when it sees a larger slice of the repository squeezed through the best prompt compressor. That is the headline of [Skip the Compressor](https://arxiv.org/abs/2610.21073v1) by Xiaocong Yang, ChengXiang Zhai and coauthors, and I keep coming back to how unglamorous the winning method is. No trained compression model. Just choose the files, then show every line of them.

The more I read this week, the more that result looked like one piece of a pattern. A lossy summary of something seems fine until a model has to *act* on it. Then the details that got thrown away turn out to matter.

### The edit has to quote the code

The argument in the Yang et al. paper is almost mechanical, which is why I like it. To patch a bug, the model needs two things at once: the right files, and those files' code exactly as written, because a patch has to reproduce the lines it edits. Retrievers rank chunks by how similar they are to the issue text, and that is a different question from whether the code needs to change. Compressors keep the right files but delete tokens, so the model ends up quoting lines that no longer match the repository, and fewer patches apply.

The numbers are clean. On 300 recent SWE-rebench issues, each graded with the benchmark's tests, their selector CQ2-CARE resolves 43.7% with GPT-5.6 and 46.7% with Claude Opus 5. That beats the best of three retrievers by 9.3 and 12.7 points. It also beats two methods trained specifically for issue resolution, SweRank by 0.7 and 1.7 points and SWE-Pruner by 2.0 and 7.3.

I do have a doubt. A 0.7 point gap on 300 issues is about two issues, so I would not read much into the SweRank comparison without confidence intervals. The gap over compressors is the part I actually believe, because the paper gives a mechanism for it (patches that do not apply) and not just a score.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/show-me-the-real-thing/figure.svg' %}" alt="An illustrative precision-recall curve for picking files to show an agent. Notice that lowering the threshold raises recall (more of the files that must change get in) while precision drops (more of the budget goes to files that never get edited). The curve is a sketch of the tradeoff, not data from the paper." width="720" loading="lazy">
  <figcaption>An illustrative precision-recall curve for picking files to show an agent. Notice that lowering the threshold raises recall (more of the files that must change get in) while precision drops (more of the budget goes to files that never get edited). The curve is a sketch of the tradeoff, not data from the paper. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2610.21073v1">Skip the Compressor: Coding Agents Fix More Issues When They Pick Whole Files</a>. Yang et al. find that retrievers often miss the files to edit, which is a recall failure at a fixed token budget.)</figcaption>
</figure>

The way I think about it is as a threshold problem. Every file selector is a ranking plus a cutoff. Set the cutoff high and you show few files, so you might miss the one that has to change. Set it low and you waste budget on files nobody edits. A compressor sidesteps the cutoff by shrinking everything, and that is exactly how it breaks the one property a patch needs.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/show-me-the-real-thing/explorer.html"
  title="Which files make the cut?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

Drag the slider above and notice the asymmetry. Missing a file you needed to edit is fatal, because no patch can be correct then. An extra file only costs budget. I think that asymmetry explains why spending the budget on *which* files beats spending it on *how much* of each file.

### Lossless on purpose

[LILIE](https://arxiv.org/abs/2610.23653v1), from Suchir Agarwal, Li Fei-Fei, Jiajun Wu and coauthors, comes at the same tension from image generation. Pixel loss is lossless but semantically flat: a pixel does not know that it belongs to a dog. Learned tokenizers carry more meaning but throw information away. LILIE tries to get both. It is an invertible image transform (a normalizing flow transformer) trained jointly with a vision-language model so that captions can be recovered from noised features. Since it is invertible, nothing is lost. Since a VLM has to read captions out of it, the feature space is organized around language.

They use it as a loss for text-to-image JiT models, and gFD on the GPIC dataset drops from 66.84 to 53.01 against a pixel-only baseline. What surprised me is the design principle more than the number: keep everything, and change *what distances mean*. That is the same move as the coding paper, seen from the other side. Do not delete information to make the problem easier. Rearrange it so the useful parts are easy to reach.

The question I would want answered is how much the caption model's biases leak into the loss. If the VLM cannot describe something well, does the generator learn to care less about it?

### Fitting the past versus acting on it

[Ben Recht's post on macroeconomic forecasting](https://www.argmin.net/p/too-big-to-fail) is the sharpest version of this week's theme, even though it has nothing to do with LLMs. He frames Keynesian macro as a control problem: forecast the economy, then set policy to steer it. The problem is Robert Lucas's 1976 critique. The structural models have many parameters fit to historical data, those parameters change when policy changes, and you cannot predict what they will become. Recht asks, "So what on earth are we doing?"

A model fit to historical data is a compression of the past, and acting on it changes the system that generated that past. I think this is the deepest reason imitation hits a ceiling, and it ties directly to [RAX](https://arxiv.org/abs/2610.22496v1) from Runhan Huang, Pieter Abbeel, Stefano Ermon, Yilun Du and a large group of coauthors. They argue that robot policies trained on teleoperation corpora "remain bounded by their imitation distributions." RAX skips demonstrations entirely. A general-purpose coding agent writes robot control code, explores online, and compiles the decision sequences that work into modular, verified programs it can reuse later.

They report beating top baselines by +37.4% on average in simulation, and generalization to unseen environments that improves as exploration scales, across single-arm, bimanual, dexterous, mobile and humanoid systems. To me that is the Lucas critique turned into a method. If the distribution moves once you act, then go collect data from the distribution you are actually in.

I am skeptical of one claim: "emergent capabilities including active perception, error recovery, safety guardrails, and human-robot collaboration." "Emergent" carries a lot of weight in that sentence, and from the abstract alone I cannot tell how those behaviors were measured. I would want to see how often they show up and whether they survive a task the agent has never explored.

There is also a quiet link to the coding paper. RAX is a coding agent writing code against real APIs, and its skills are programs that run or fail. That is the same verbatim property Yang et al. care about. The robot's memory is executable code, not a fuzzy summary of past episodes.

### What "open" actually shows you

[Nathan Lambert's piece on Muse Spark Open](https://www.interconnects.ai/p/meta-shakes-up-the-frontiers-open) is a stretch for this theme, but it fits in a useful way. Meta released an 816B total, 42B active parameter model with a 1M token context, and Lambert calls it the strongest American open model by a wide margin. The weights are the verbatim artifact, the real thing you can inspect and build on. Then the license adds a "Built with Muse" display requirement, a separate license above $20M per month in revenue, an acceptable use policy, and terms that extend to outputs and derivatives. Lambert notes that this creates legal ambiguity about using it for synthetic data.

I agree with his argument that complex, non-standard licenses are "an unnecessary strategic risk." You get the whole file, but you are not sure what you are allowed to do with it, and that blurs the thing that made it valuable.

### What I am taking away

The common thread for me: when a system has to act (edit code, move a robot arm, set interest rates), approximations that were harmless for description become liabilities. The good responses this week either preserve the real thing exactly (whole files, invertible encoders, executable skills) or go get fresh experience instead of trusting a fit to the past.

The experiment I want to try next is small. I would take the Yang et al. setup and plot resolve rate against the selector's recall of the files that must change, to check whether recall alone explains most of the gap with retrievers. If it does, the lesson is very simple: get the right files in front of the model, verbatim, and the model does the rest.

### Sources

- [Skip the Compressor: Coding Agents Fix More Issues When They Pick Whole Files](https://arxiv.org/abs/2610.21073v1) (ChengXiang Zhai)
- [Scaling Online Exploration for Robot Agents](https://arxiv.org/abs/2610.22496v1) (Stefano Ermon)
- [A Language-Informed Loss for Visual Generation](https://arxiv.org/abs/2610.23653v1) (Jiajun Wu)
- [Too Big to Fail](https://www.argmin.net/p/too-big-to-fail) (Ben Recht)
- [Meta shakes up the frontiers, open and closed](https://www.interconnects.ai/p/meta-shakes-up-the-frontiers-open) (Nathan Lambert)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
