---
title: "The Week Everything Got Cheap, and the Objective Became the Whole Story"
date: 2026-08-03 15:16:49 -04:00
categories: [Writing, Research]
tags: [amortized-inference, 3d-gaussian-splatting, encoders, optimization, goodharts-law, ai-research, weekly-reads, machine-learning]
math: true
---

I keep a scratch file called "things that got cheap." It is mostly a junk drawer, but this week it filled up fast enough that I started to think the entries were the same entry wearing different clothes. A driving simulator that used to take per-scene tuning now runs in a forward pass. A long-context encoder that used to need a GPU now runs on my laptop CPU. Reading an unfamiliar codebase, which used to cost an afternoon, now costs a prompt. Every one of those is a win. Every one of those also quietly hands you a new problem, which is that when the expensive part stops being expensive, the thing you chose to optimize for becomes the whole story.

### From optimizing every scene to learning the solution map

The entry that started this was [Instant NuRec](https://arxiv.org/abs/2607.14203v1). The setup is autonomous driving simulation: you want a 3D world you can replay a policy inside of, and the standard move has been to fit a 3D Gaussian Splatting representation per scene, which is slow and needs babysitting. Instant NuRec turns a short multi-view log into a fully simulatable 3DGS world in a single forward pass, about 1.5 seconds for a 10 to 20 second multi-camera clip, and still lands 2.01 dB of PSNR above the strongest baseline they evaluated.

What I find genuinely lovely here is the shape of the trick, because it is the same shape as amortized inference everywhere else. Per-scene fitting solves a fresh optimization problem every time you show up. A feed-forward model learns the map from inputs to solutions once, pays the optimization bill during training, and then just evaluates. You are not making the optimizer faster. You are refusing to run it.

The part I would want to poke at is the layered output: separate static and dynamic Gaussian layers, a sky cubemap, per-camera ISP corrections, native support for non-pinhole cameras. That is a lot of hand-designed structure, and I think that structure is doing more work than the speed number suggests. It is also where I would expect a feed-forward model to fail, because amortized solvers are great on the distribution they were trained on and get smooth and confident on the rare geometry that a per-scene optimizer would have grudgingly fit. A dataset-average PSNR will not tell you about the one weird construction zone that breaks your closed-loop evaluation. If I got access to this, that is the first experiment I would run, and I suspect the answer is more interesting than the headline.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/when-the-cost-collapses/figure.svg' %}" alt="Notice that the decline is not a gentle slope, it is a step. Per-scene neural reconstruction costs minutes of optimization you have to babysit, and a feed-forward model collapses that to roughly 1.5 seconds of forward pass for a 10 to 20 second multi-camera log. Watch where the curve flattens: once the cost hits the floor, further speedups stop mattering and the choice of what you measured starts mattering." width="720" loading="lazy">
  <figcaption>Notice that the decline is not a gentle slope, it is a step. Per-scene neural reconstruction costs minutes of optimization you have to babysit, and a feed-forward model collapses that to roughly 1.5 seconds of forward pass for a 10 to 20 second multi-camera log. Watch where the curve flattens: once the cost hits the floor, further speedups stop mattering and the choice of what you measured starts mattering. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2607.14203v1">Instant NuRec: Feed-Forward 3D Gaussian Reconstruction for Driving Scene Simulation</a>. Timing and the 2.01 dB PSNR margin over the strongest evaluated baseline come from the Instant NuRec paper on the Waymo Open Dataset.)</figcaption>
</figure>

### Cheap enough to run all day

The second entry is [LFM2.5-Encoders](https://huggingface.co/blog/LiquidAI/lfm2-5-encoders), and I like it for the opposite reason: nothing about it is glamorous. Two encoders at 230M and 350M parameters, 8,192 tokens of context, roughly 3.7 times faster than ModernBERT-base at long context on CPU. Concretely, a full 8k forward pass takes about 28 seconds instead of over a minute and a half. The construction is a nice piece of engineering too, since they start from causal LFM2 decoder backbones and convert them to bidirectional encoders by flipping the attention mask, padding the short convolutions symmetrically, and retraining with masked language modeling.

Encoders are deeply unfashionable right now and I think that is exactly why this matters. Intent routers, PII detectors, safety filters, and policy linters are jobs that run constantly on inputs nobody is excited about. Once each of those calls costs approximately nothing, your engineering attention moves. The question stops being "which model" and becomes "where is the cutoff," because a PII detector that runs all day on every document is defined almost entirely by its threshold, not by two points of GLUE average.

Drag the slider below and watch what a cheap classifier actually gives you. The model quality sets the shape of the curve, but you pick the point on it, and that pick encodes a value judgment about whether a missed Social Security number or a false alarm on somebody's phone number is the worse outcome. No benchmark makes that call for you.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/when-the-cost-collapses/explorer.html"
  title="Where do you put the threshold?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### The vinegar problem

Which brings me to my favorite thing I read this week, Ben Recht's [Dietary Shapes](https://www.argmin.net/p/dietary-shapes). He tells the story of George Stigler solving a minimum-cost subsistence diet by hand and arriving at wheat flour and navy beans, and then the better story: George Dantzig, who invented linear programming, deciding he was skilled enough to patch Stigler's naive constraints and find a diet that would actually work. He burned spare cycles on RAND's IBM 701 for a week and kept getting told to drink gallons of vinegar and eat mass quantities of bouillon. His wife Anne read the printouts, took the good ideas, put him on her diet, and he lost 22 pounds.

That is the whole week in one anecdote. Cheap optimization plus a proxy objective produces confident nonsense, and the nonsense is not a bug in the solver. The solver is doing precisely what you asked. Recht adds a second twist I have not stopped thinking about, which is that Stigler's paper was partly sardonic, a demonstration that optimal diets are absurd, and people took it literally and sent angry letters about how this is no way to feed growing boys. Artifacts escape the frame their authors intended.

### Tier lists are objective functions too

Alex Irpan's [tier list of which tech CEOs are gamers](https://www.alexirpan.com/2026/07/17/tech-ceo-gamers.html) is a joke post that accidentally contains the cleanest Goodhart illustration I have seen all year. Satya Nadella, under oath, says he is not a gamer. Elon Musk tweets that he hit rank 59 worldwide in Path of Exile 2, livestreams play that does not match that rank, and later acknowledges he paid an account booster. Ladder rank was a proxy for skill. The proxy was purchasable. So it got purchased.

I also love that Irpan needed a "Gamer but Cringe" tier at all. He set out with a one-dimensional score, found reality would not sit on the line, and invented a category. That is a more honest response to a broken metric than most benchmark papers manage.

Simon Willison's note on [why devtools must be open source](https://simonwillison.net/2026/Aug/3/devtools-must-be-open-source-exedev/#atom-everything) closes the loop. His argument is that the freedom to read and modify your tools was always theoretical for most of us because the time cost was prohibitive, and LLMs have made "clone this repo and tell me how it works" a zero-investment move. I have done exactly this twice in the last month and it is real. It also has the same asymmetry as everything above: what got cheap is generating a plausible explanation of the code, not verifying that the explanation is true. The bottleneck moved to checking, and checking is the part I am worst at skipping.

### What I am taking away

Costs collapsing is good. I am not being cute about that, and Instant NuRec and small CPU encoders are both things I want to build on. But my honest takeaway is that speed is a solved-shaped problem and objectives are not. When the solve was expensive, the objective was hidden behind the difficulty. When the solve is free, the objective is all that is left, and it is usually a proxy somebody picked in an afternoon. My next project at CMU is a cheap encoder-based router, and I am going to spend more time writing down what I actually want it to do than tuning it. Dantzig had the best model on the best hardware available and still needed Anne to read the output.

### Sources

- [Instant NuRec: Feed-Forward 3D Gaussian Reconstruction for Driving Scene Simulation](https://arxiv.org/abs/2607.14203v1) (Sanja Fidler)
- [Devtools must be open source (exe.dev)](https://simonwillison.net/2026/Aug/3/devtools-must-be-open-source-exedev/#atom-everything) (Simon Willison)
- [LFM2.5-Encoders for Fast Long-Context Inference on CPU](https://huggingface.co/blog/LiquidAI/lfm2-5-encoders) (Hugging Face)
- [Dietary Shapes](https://www.argmin.net/p/dietary-shapes) (Ben Recht)
- [Which Tech CEOs Are Gamers?](https://www.alexirpan.com/2026/07/17/tech-ceo-gamers.html) (Alex Irpan)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
