---
title: "Compared to What? Fewer Denoising Steps, Faster Robots and Forecasts That Are Really Plans"
date: 2026-11-23 05:45:06 -05:00
categories: [Writing, Research]
tags: [robotics, flow-matching, world-models, forecasting, open-models, ai-research, weekly-reads, machine-learning]
math: true
image:
  path: /assets/img/previews/compared-to-what.png
  alt: "The same four logits become a sharper or flatter softmax distribution as the temperature changes (toy example)."
  hide: true
---

Two denoising steps did the work of ten. That is the result at the center of [Cache or Denoise Less? Residual Reuse in a Flow-Matching World Action Model](https://arxiv.org/abs/2611.19709v1) by Abhinav Gupta and Nissan Pow, and I love how unglamorous it is. Flow-matching robot policies run the network once per denoising step to build each chunk of actions, so caches like C³ache try to reuse work from earlier replanning calls. Gupta and Pow asked the question that should come before any clever trick: compared to what? That question turned out to be the thread through everything I read this week.

### The baseline that ate the cache

In Fast-WAM, a 6B-parameter world action model, two uncached steps were non-inferior to ten within two percentage points on all 500 initial states of LIBERO-Goal. On an RTX A6000 under PyTorch's default compile mode, that cut a replanning call from 202 to 92 ms. The argument for why a cache cannot catch up is what I keep coming back to: a cache that keeps two fresh steps can never beat two uncached steps, because every call still encodes the images, runs the video expert and computes those two steps. By their cost model, caching the first of two steps, refreshed every fourth call, saves at most 11 to 14% of a call.

Once the step count is low, most of a call is fixed overhead that reuse never touches. Drag the slider below to change the number of steps and watch how little is left for a cache to save.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/compared-to-what/explorer.html"
  title="Temperature explorer"
  sandbox="allow-scripts"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

My hesitation is the sample: the result holds for one checkpoint and one noise seed, which the abstract says plainly. I would want more seeds and harder tasks before calling two steps a rule. Still, any speedup paper should include a "just take fewer steps" row.

### The sampler is part of the method

The second finding surprised me more. Cached policies were fragile, and their losses tracked the share of the flow path the cached steps covered. Under Fast-WAM's current time shift, C³ache's eight cached steps cover 80% of the path instead of 44%, and the cached policy succeeds on 63% of initial states against 95% uncached. Resampling the noise on every call cost caches covering 60% or more of the path 14 to 40 points.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/compared-to-what/figure.svg' %}" alt="Toy example: the same four logits become a sharper or flatter softmax distribution as the temperature changes." width="720" loading="lazy">
  <figcaption>Toy example: the same four logits become a sharper or flatter softmax distribution as the temperature changes. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2611.19709v1">Cache or Denoise Less? Residual Reuse in a Flow-Matching World Action Model</a>. A generic toy figure, not drawn from the source's data.)</figcaption>
</figure>

So the failure came from a sampler setting most people would file under details. I think that lesson travels well beyond robotics: a speedup measured under one sampler and noise setting is only a claim about that setting. The authors release their harness, logs and a checklist, and their advice to test reuse under the deployed sampler and noise settings is the kind of boring rule I wish more papers followed.

### Speed from better inputs

The other two robotics papers found their speed by rethinking the inputs instead of growing the model. [ALOHA Lightning: Learning Fast and Precise Manipulation](https://arxiv.org/abs/2611.21919v1), from a team that includes Chelsea Finn and Zipeng Fu, argues that learned policies run far slower than ordinary humans mainly because there was no interface for collecting fast demonstrations, and because fast motions are hard to execute robustly. Kinesthetic teaching on a backdrivable bimanual platform gives them near-human-speed demonstrations, and test-time action smoothing plus masking (to align the visual data between collection and deployment) handles execution. With 50 demonstrations per task, the robot tosses and catches a ball, folds shorts, inserts a battery and busses tables with over 80% success at close to human speed. I am curious what exactly gets masked.

[DreamFAR: Real-Time and Long-Horizon Interaction with Diverse Objects](https://arxiv.org/abs/2611.22001v1), with Jitendra Malik among its authors, makes the same kind of bet on data. Its dynamics model is trained from scratch on a large robot-native teleoperation dataset, with no internet-video pretraining. It is significantly smaller than high-performance video generation models, yet the authors report better understanding of contact and causality, stronger long-horizon prediction, and 10 FPS on a commercial GPU. A phrase like "better understanding of causality" lives or dies by how it is measured, and the abstract does not say. DreamFAR is also pitched for policy evaluation, which connects back to Gupta and Pow: a good enough world model could be where you sweep step counts, samplers and noise settings before anything touches a real robot.

### Forecasts have baselines too

[Ben Recht's post on doom forecasts](https://www.argmin.net/p/the-doom-franchise) asks the same question about a very different curve. He traces a line from The Population Bomb and The Limits to Growth to today's AI doom scenarios: an exponential, a simulation and borrowed authority. His sharpest move is the turn to engineering, where Recht writes, "Exponential resource allocation yields exponential progress, but you need the first to get the second." About scenarios like AI 2027, he says, "They are design documents, not forecasts."

I agree with more of this than I expected. A forecast assembled from executives' plans is closer to a roadmap than a prediction. Where I push back is the hint that a design document is therefore harmless: if it describes what well-funded people are trying to build, that is a reason to scrutinize it harder. Calling doomsayers a "millenarian death cult," as Recht does, also ends more conversations than it wins.

[Nathan Lambert's essay on open models after Jensen Huang](https://www.interconnects.ai/p/open-source-ai-without-jensen) reads like a case study of Recht's point. Lambert argues that Huang's resignation as Nvidia CEO is a major setback for the US open model ecosystem, since Huang was "flooding the zone with funding" and protecting open models while their economy is young. With compute this scarce, there is little margin competition on open-weight models, so they are far from a commodity. His fix is a truly frontier open model player in the US. Dylan Patel, quoted in the piece, says the blocker is "not money, it's talent, man."

So part of the open model curve was one person's resource allocation, which is exactly Recht's point about progress. Lambert's warnings are forecasts too. He writes that a major hack driven by a popular Chinese open-weight model is "a matter of when, not if," and he admits the open model economy is horribly hard to measure because its most valuable parts run on private infrastructure. That does not make him wrong. It means both arguments get more honest when they say who is paying for the curve.

### What I am taking away

"Compared to what?" did a lot of work this week. Against two plain denoising steps, a clever cache had little left to win and broke under the deployed sampler. Recht and Lambert both pointed past the exponential chart to the resources behind it. Next time I read a speedup claim, I want to find the fewer-steps row first, and next time I read a forecast, I want to ask who is paying for it to come true. I also want to read the Fast-WAM checklist closely, because I suspect most of it applies to any diffusion or flow model sold as faster.

### Sources

- [Cache or Denoise Less? Residual Reuse in a Flow-Matching World Action Model](https://arxiv.org/abs/2611.19709v1) (Abhinav Gupta)
- [ALOHA Lightning: Learning Fast and Precise Manipulation](https://arxiv.org/abs/2611.21919v1) (Chelsea Finn)
- [The Doom Franchise](https://www.argmin.net/p/the-doom-franchise) (Ben Recht)
- [DreamFAR: Real-Time and Long-Horizon Interaction with Diverse Objects](https://arxiv.org/abs/2611.22001v1) (Jitendra Malik)
- [Open-source AI without Jensen](https://www.interconnects.ai/p/open-source-ai-without-jensen) (Nathan Lambert)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
