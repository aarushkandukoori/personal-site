---
title: "The Number Is Not the Thing: A Week of Metrics Standing In for What We Want"
date: 2026-08-24 09:10:15 -04:00
categories: [Writing, Research]
tags: [metrics, benchmarks, robotics, evaluation, ai-policy, forecasting, ai-research, weekly-reads, machine-learning]
math: true
image:
  path: /assets/img/previews/number-is-not-the-thing.jpg
  alt: "Close-up of a round analog motorcycle speedometer in kilometers per hour, with its needle resting at zero."
  credit: "Photo by Shixart1985, CC BY 2.0 via Wikimedia Commons (cropped)"
  credit_url: "https://commons.wikimedia.org/wiki/File:Motorcycle_speedometer_closeup.jpg"
---

The things I read this week had nothing to do with each other, and then I could not stop noticing the same shape in all of them. A robot arm gets a speed number. A language model gets a benchmark score. A public gets a chart summarizing its concerns. A forecast gets an error metric. In every case, someone built a number that stands in for a thing, and then the number started doing the deciding.

Ben Recht put words on the thing I had been circling in [From legibility to participation](https://www.argmin.net/p/from-legibility-to-participation). His argument is about policy, but the mechanism is familiar to anyone who has ever tuned a loss function. To make a messy situation legible to a decision maker, you quantify it. Because the quantification followed a transparent procedure, it feels objective. Objectivity buys authority, and authority becomes power. He calls this the quantification trap, and what I appreciate is that he does not pretend the alternative is to stop measuring. He is explicit that quantification buys intersubjectivity: anyone can trace the path from evidence to summary statistic, which is exactly why it works as a shared language. His worry is hegemony, not existence.

### The benchmark is the legibility architecture

Read Nathan Lambert's post on [GLM-5.3](https://www.interconnects.ai/p/glm-53-how-chinese-labs-keep-stride) right after Recht and it reads like a case study. A roughly 750B parameter model posts numbers competitive with much larger frontier systems, and the immediate reaction, including Lambert's own admitted denial, is to look for the trick. Distillation? Benchmaxxing? He lands somewhere more interesting: the release cycle itself is the variable. American labs spend months in pre-release testing while Z.ai ships in days, which means the public leaderboard is comparing one lab's finished product against another lab's months-old snapshot. The number is real. What the number represents is not what most readers assume it represents.

The line that stuck with me is that you cannot simply distill RL environments, or the infrastructure to run them at scale, or the algorithms to mix them together. That is a claim about where the actual difficulty lives, and it is nowhere near the benchmark. Post-training infrastructure is illegible in exactly Recht's sense. It does not compress into a chart, so the discourse routes around it and argues about scores instead.

### What people actually pay for

Simon Willison's note on the [FT story about Anthropic's model adoption](https://simonwillison.net/2026/Aug/23/anthropics-best-ai-model-struggles-to-attract-users-as-cheaper-t/) is the empirical counterweight, and it is a little funny. The Ramp index, built from billing data across 70,000 companies, shows Opus 4.8 at 28 percent of Anthropic model spend while the newest and most capable releases sit in the low single digits. Fable 5, the expensive one, is at 8 percent. Whatever the benchmark says is best, the money says people want good enough and cheap.

I do not think this makes benchmarks worthless. I think it makes them one metric among several that are all measuring different things and being reported as if they measured one thing. Capability, cost, latency, and availability are separate axes, and the leaderboard collapses them to one.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/number-is-not-the-thing/figure.svg' %}" alt="Log-scale line chart titled 'How fast nearly free inference arrives under different annual declines'. Relative price per million tokens from 2023 to 2028 for three steady rates of decline: 9x, 50x (labeled median) and 200x a year. All three lines start near 30 in 2023 and fall in straight lines, ending about 5, 8.5 and 11.5 orders of magnitude lower in 2028." width="720" loading="lazy">
  <figcaption>A toy projection of relative price per million tokens from 2023 to 2028, if prices fall at a steady 9x, 50x or 200x a year. On the log scale each rate is a straight line, and even the slowest one ends almost five orders of magnitude lower. Cost is its own axis, and it moves fast. (Figure generated for this post, inspired by <a href="https://simonwillison.net/2026/Aug/23/anthropics-best-ai-model-struggles-to-attract-users-as-cheaper-t/">Anthropic’s best AI model struggles to attract users as cheaper tools thrive</a>. The Ramp spending numbers are in the text above; this chart only shows prices.)</figcaption>
</figure>

### The robotics version is refreshingly honest

Which brings me to my favorite paper of the week, because it does the thing I wish the rest of the field did. [SpeedTuning](https://arxiv.org/abs/2608.09138v2) from David Yuan, Tony Zhao, Kaylee Burns, and Chelsea Finn starts from an observation that is obvious once stated and that I had never thought about: imitation learning policies inherit the speed of whoever collected the demonstrations. A human teleoperated the arm at human pace, so the policy moves at human pace forever, and nothing in the training objective ever mentions time.

So they train a lightweight RL layer that predicts the optimal execution speed per action, on top of a frozen base policy, with no new data collection. They report more than 2.4x speedup on pouring, throwing, and picking, while preserving an adequate success rate. That word, adequate, is doing real work, and I respect that they wrote it plainly. They also note that the empirical relationship between execution speed and task success was underexplored, which is a quiet admission that the field had two metrics and mostly reported one.

This is the honest version of the quantification problem: "here are two numbers in tension, and here is the frontier between them." You cannot read that as a single ranking. You have to pick a point on it, and picking is a judgment call that no chart makes for you.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/number-is-not-the-thing/explorer.html"
  title="One threshold, two numbers"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Averaging is also a choice

The CMU MLD post on [forking sequences and multi-horizon forecast ensembling](https://blog.ml.cmu.edu/2026/08/10/forking-sequences-part-ii-multi-horizon-forecast-ensembling-with-reduced-volatility/) fits here in a way I did not expect. Ensembling across horizons reduces volatility, which sounds like pure win, until you ask what volatility was telling you. Some of that variance is noise you want gone. Some of it is genuine disagreement about the future, and smoothing it away produces a forecast that looks more confident than the evidence supports.

> **Key Point** - Reducing the variance of a reported number and reducing the uncertainty of the underlying situation are completely different operations. The chart cannot tell you which one happened.

### What I am taking away

Recht's alternative is architectures of participation: systems designed for contribution rather than summarization, which accept that there is no single metric to maximize. I am not sure how to build that for ML evaluation, and I am skeptical of anyone who says they already have. But SpeedTuning gives me a smaller and more tractable version of the idea. Report the frontier, not the point. Name the axis you traded away.

The thing I want to try this fall is embarrassingly simple. For the next project I evaluate at CMU, I am going to refuse to report a single scalar. Two axes minimum, plotted against each other, with the operating point I chose marked and defended in a sentence. If Recht is right that legibility architectures remove discretion, then the smallest act of resistance available to me is to keep the discretion visible and make myself say out loud which tradeoff I picked.

### Sources

- [From legibility to participation](https://www.argmin.net/p/from-legibility-to-participation) (Ben Recht)
- [SpeedTuning: Speeding Up Policy Execution with Lightweight Reinforcement Learning](https://arxiv.org/abs/2608.09138v2) (David D. Yuan et al.)
- [GLM-5.3: How Chinese labs keep stride with the frontier](https://www.interconnects.ai/p/glm-53-how-chinese-labs-keep-stride) (Nathan Lambert)
- [Anthropic’s best AI model struggles to attract users as cheaper tools thrive](https://simonwillison.net/2026/Aug/23/anthropics-best-ai-model-struggles-to-attract-users-as-cheaper-t/) (Simon Willison)
- [Forking-Sequences, Part II: Multi-Horizon Forecast Ensembling with Reduced Volatility](https://blog.ml.cmu.edu/2026/08/10/forking-sequences-part-ii-multi-horizon-forecast-ensembling-with-reduced-volatility/) (CMU MLD)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
