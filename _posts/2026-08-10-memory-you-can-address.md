---
title: "Memory You Can Actually Address"
date: 2026-08-10 08:45:01 -04:00
categories: [Writing, Research]
tags: [world-models, kv-cache, distillation, kernels, open-source, ai-research, weekly-reads, machine-learning]
math: true
image:
  path: /assets/img/previews/memory-you-can-address.jpg
  alt: "Wooden card catalog drawers, each with a brass holder labeled with a drawer number and a range of headings."
  credit: "Photo by bookfinch, CC BY 2.0 via Wikimedia Commons (cropped)"
  credit_url: "https://commons.wikimedia.org/wiki/File:Card_Catalog_2.jpg"
---

This week's reading looked unrelated on the surface: a video world model paper, a systems post about KL losses, a kernel search project, a policy argument about open weights, and a two-paragraph note that a free API is dead. By Sunday I could not stop noticing that all five are about the same problem. Everyone already knows how to make things smaller. The problem is whether the smaller thing is still *reachable*.

### The cache that forgot how to point at itself

The cleanest version of this comes from [Addressable Memory for Video World Models](https://arxiv.org/abs/2608.07408v1). Interactive video world models carry their past around in a KV cache, which is a perfectly reasonable idea until the rollout runs longer than anything the model saw in training. Then the temporal RoPE offsets land outside the range the model was trained on, and attention can no longer find the frames it is looking for. The information is sitting right there in memory. The model just does not have a working address for it.

The part I keep chewing on is the second failure. If you naively compress that cache, you average together vectors that have already been rotated to different positional phases. You are summing things that live in incompatible coordinate frames, and the result is a corrupted memory. WorldTrace's fix is almost embarrassingly clean: give every summary slot its own distinct, in-distribution virtual position. Hand the model addresses it already knows how to read, so it never has to learn a new addressing scheme. No retraining, and they report +15.5% temporal consistency and +19.5% episodic recall on their LoopBench, which tests whether you can walk away from a scene and come back to find it unchanged.

I want to try the loop test on something much smaller. Take a tiny autoregressive model on a gridworld, run it past its training horizon, and just plot the attention mass on early tokens. My guess is the collapse is visible long before the outputs look wrong.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/memory-you-can-address/figure.svg' %}" alt="Toy 8 by 8 causal attention heatmap with query position down the side and key position along the bottom; darker cells mean more weight. The upper triangle is empty. Rows 0 and 1 put all their weight on the diagonal, and rows 4 to 6 put the most weight on key 0 or key 1." width="720" loading="lazy">
  <figcaption>A toy causal attention map for eight positions. Darker cells carry more weight, each row sums to 1, and the upper triangle is empty because a query can only look back. Inside a window this short, early keys are still easy to reach: rows 4 to 6 put their largest weight on key 0 or key 1. The plot I want from the gridworld test is this one drawn past the training horizon, where my guess is that the weight on early keys collapses. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2608.07408v1">Addressable Memory for Video World Models</a>. The weights are a toy and do not come from the paper.)</figcaption>
</figure>

### Cheap enough to be worth keeping

The same tension shows up one level down in [Multiverse Computing's post on efficient knowledge distillation](https://huggingface.co/blog/MultiverseComputingCAI/efficient-knowledge-distillation). Distillation is memory transfer: a big teacher's behavior gets pressed into a small student. The bottleneck is the KL loss, which builds a grid of vocabulary times sequence length. For a 201,088-token vocabulary at 32K context and a batch of four sequences, the teacher's probability tensor alone is about 50GB in bf16. A training step peaks near 250GB, which is more than an H200 has.

Their two moves are both about not holding what you do not need. Cache the teacher's top-100 logits once offline, since the teacher's behavior does not change during a training run anyway, so why re-derive it every step. Then fuse the output projection into the loss and process the sequence in chunks, so the student's full logit grid never exists at all, and the backward pass recomputes each chunk instead of storing it. Same math, no spike.

What I find genuinely interesting is the *research* consequence rather than the VRAM number. Once the teacher cache is a static artifact, you can reuse it across dozens of ablations. The expensive part stops being a per-experiment cost and becomes a fixed asset. That is the same shape as WorldTrace: the win comes from turning something recomputed into something addressed.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/memory-you-can-address/explorer.html"
  title="How much does the student disagree with the teacher?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Expertise is a corpus too

Then there is [K-Search's CUDA-to-MLX work from Berkeley and IBM](https://bair.berkeley.edu/blog/2026/07/29/cuda-to-mlx-k-search/), which treats a decade of hand-tuned CUDA kernels as a knowledge base to distill from. The kernels get translated through a structured layer into MLX-native strategies, since copying them instruction for instruction would be nonsense across architectures. They hit 0.97x of the native MLX attention kernel and up to 20x prefill speedup over the community mlx-lm Mamba SSM implementation.

The design choice I like most is the world model: a persistent decision tree where each root-to-leaf path is a full optimization plan and siblings are competing alternatives, with per-node scores for confidence and impact on bandwidth and register pressure. Refining an idea adds a child instead of overwriting the parent. That is an addressable memory for the search itself. Compare that to the usual LLM optimization loop, which throws away everything it learned between rounds and then rediscovers the same dead end four times.

I am a little skeptical of the 0.97x framing, since matching a native kernel is not beating it, and the honest headline is "reaches expert level on the ones people already tuned, wins big on the ones nobody bothered with." That is still a real result. The gap it fills is real too, since MLX runs correctly on hundreds of millions of Macs while leaving a lot of performance on the floor.

### Who is allowed to hold the corpus

Which brings me to [Ben Recht's "Public Intelligence"](https://www.argmin.net/p/public-intelligence). His argument is that open weights are not enough, and that the actual bottleneck is the open corpus, because the labs trained on Wikipedia, forums, public code, and pirated books and then locked the result behind an API. His sharpest line, and the one I think is hardest to argue with, is that if training on that material was transformative fair use, then distilling those models' outputs is fair use by the same logic.

> **Key Point** - Compression without addressability is just deletion with extra steps. That is true of a KV cache, a teacher distribution, a search tree, and a shared corpus.

And then the small item that made me actually feel this: [Simon Willison noting that GitHub Models is retired](https://simonwillison.net/2026/Aug/9/github-models-is-now-retired/#atom-everything). His research repo's Actions run just started failing. He swapped in an OpenAI key with a spending cap and moved on, which took him minutes, but the pattern is the point. Free or subsidized tokens got too expensive once agent workloads showed up, so a piece of shared infrastructure people had built habits around simply stopped resolving. An address that used to work does not anymore.

### What I am taking away

The thing I want to hold onto is that "we stored it" and "we can get it back" are different claims, and the second one is where almost all the engineering lives. A cache with unreachable positions, a teacher you have to re-run every step, a search that forgets its own dead ends, a corpus you cannot legally touch, an endpoint that got retired. Same failure, five altitudes.

Next thing I want to build at CMU is small and concrete: reimplement the fused chunked KL on a toy vocabulary and actually measure the memory curve against the dense version, then see whether the recompute cost is as cheap as claimed at short sequence lengths. I suspect the crossover point is more interesting than the headline.

### Sources

- [Addressable Memory for Video World Models](https://arxiv.org/abs/2608.07408v1) (Xindi Wu et al.)
- [GitHub Models is now retired](https://simonwillison.net/2026/Aug/9/github-models-is-now-retired/#atom-everything) (Simon Willison)
- [Public Intelligence](https://www.argmin.net/p/public-intelligence) (Ben Recht)
- [Making Knowledge Distillation Cheap Enough to Run at Scale](https://huggingface.co/blog/MultiverseComputingCAI/efficient-knowledge-distillation) (Multiverse Computing)
- [From CUDA to MLX: How K-Search Brings Decades of Kernel Expertise to Apple Silicon](https://bair.berkeley.edu/blog/2026/07/29/cuda-to-mlx-k-search/) (Berkeley AI Research)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
