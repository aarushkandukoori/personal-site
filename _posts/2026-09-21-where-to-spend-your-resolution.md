---
title: "Where to Spend Your Resolution"
date: 2026-09-21 05:45:06 -04:00
categories: [Writing, Research]
tags: [adaptive-meshes, forecasting, spatial-reasoning, ai-safety, modeling, ai-research, weekly-reads, machine-learning]
math: true
---

I spent an hour this week staring at a picture of a crack propagating through a simulated block of material, and what I could not stop thinking about was the mesh behind the crack. Not the tip, where all the interesting physics lives, but the wake: the part that already broke, that is not going to un-break, and that a naive simulation keeps resolving at full resolution forever. It is a very expensive way to remember something you already know.

That image ended up being the through-line for everything else I read this week. The question underneath all of it is not "how accurate can we be" but "where should the accuracy go."

### The crack tip is the only place that deserves a fine mesh

The paper is [Adaptive Mesh Coarsening for Efficient Phase-Field Fracture Simulations](https://arxiv.org/abs/2609.21201v1), and the core move is almost embarrassingly sensible once you see it. Phase-field fracture models are lovely because you never have to track a crack explicitly: the crack is just a field that goes from one to zero over some small regularization length. The price is that your mesh has to resolve that small length, everywhere the crack might go. In 3D, or in problems with distributed nucleation, that gets brutal fast.

Most adaptive refinement work I have seen answers this by refining aggressively near damage and then never letting go. The refined region only grows. What these authors add is the other half: coarsen the wake back down into a crack band that preserves the mechanical behavior (it still cannot carry load across the crack) without preserving the microscopic detail. So the fine mesh becomes a small moving window that follows the tip.

The part I actually find clever is the refinement indicator. Instead of a heuristic like "refine where the phase field is between 0.1 and 0.9," they derive it from violation of the material strength surface, which is a necessary condition for fracture to evolve. That means the indicator is not tuned to a material or a geometry, it is tuned to the physics of when a crack is about to happen. I keep thinking about how many ML heuristics I have written that were the first kind and should have been the second.

### Precision you cannot validate is not precision

Then I read Ben Recht's [The Chances of Earthquakes](https://www.argmin.net/p/the-chances-of-earthquakes), which makes the same argument from the opposite direction. There, refining the model is the mistake.

The setup is Cascadia. Geological samples give 41 major earthquakes in ten thousand years, so a crude rule of thumb says roughly one every 243 years, and it has been 326. You could write `chance = 1 - np.exp(-rate * time)` and get a number. Recht's point, via Freedman and Stark, is that the number is theater. Validating a probabilistic forecast needs many events, and big earthquakes are rare enough that the law of large numbers never gets its numbers. Worse, every bit of geological realism you add brings unidentifiable parameters and researcher degrees of freedom with it. More realistic does not mean better estimated.

What survives is coarse and genuinely useful: this fault will rupture, it will be catastrophic, build for it. That is a crack band, not a fine mesh. I find this more persuasive than I want to. My instinct as a stats student is that a sharper posterior is always better, and the honest answer is that a sharper posterior over a quantity you can never score is just a more confident guess.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/where-to-spend-your-resolution/figure.svg' %}" alt="A precision-recall curve for a rare-event warning system. Notice how flat the right side is: pushing recall toward catching every event collapses precision almost immediately, which is why a coarse 'this region will shake, build for it' warning is more useful than a finely tuned probability you can never validate." width="720" loading="lazy">
  <figcaption>A precision-recall curve for a rare-event warning system. Notice how flat the right side is: pushing recall toward catching every event collapses precision almost immediately, which is why a coarse 'this region will shake, build for it' warning is more useful than a finely tuned probability you can never validate. (Figure generated for this post, inspired by <a href="https://www.argmin.net/p/the-chances-of-earthquakes">The Chances of Earthquakes</a>. Recht's earthquake post argues precise seismological probabilities are untestable on human time scales, so the useful output is a coarse but actionable warning.)</figcaption>
</figure>

The threshold question sits right underneath both of these. Refine too eagerly and you burn everything on regions that will never matter. Refine too late and you miss the nucleation event entirely. Same shape as a warning system deciding what counts as alarming.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/where-to-spend-your-resolution/explorer.html"
  title="Where do you put the threshold?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

Drag the slider below and watch the two curves trade against each other. The thing I want you to notice is how asymmetric the cost is near the ends.

### Models that have the metric details but not the shape

[MindTopo](https://arxiv.org/abs/2609.11900v1) flips the axis. It asks whether foundation models reason about topological relations, the ones that survive continuous deformation: continuity, separation, order, enclosure, knots. These are the coarse properties, the ones cognitive science says come first in spatial understanding, and the ones most benchmarks skip in favor of distances and angles.

The results are a little bleak and very informative. Across 14 MLLMs, every model does better at reasoning than at planning, and the best is still far below humans. Fine-tuning and RL on a small model improve reasoning more than planning. And the detail I keep returning to: when they let video generative models produce observations, the rollouts keep local cues and land on plausible endpoints, but audited frames do not reliably follow environment dynamics or preserve topology across transitions.

That is exactly backwards from the mesh story. The generated video has beautiful local resolution and a broken global invariant. It is a simulation that refined everywhere except the one property that determined whether the answer meant anything. I would love to try the phase-field trick here at CMU: pick the invariant first, derive the training signal from its violation, and stop rewarding local plausibility.

### Small fixes and fast adversaries

Two bookends. Simon Willison shipped [datasette-auth-github 1.0](https://simonwillison.net/2026/Sep/19/datasette-auth-github/) because he noticed his sessions kept dropping, traced it to cookies set without a Max-Age, and fixed it. A one-parameter bug, invisible to every test, found only by using the thing. That is a refinement indicator too: real usage told him where the fine mesh belonged.

At the other end, Jack Clark's [Import AI 471](https://importai.substack.com/p/import-ai-471-why-hugging-face-worries) walks through the Hugging Face and OpenAI agent incident, where hundreds of agents bootstrapped a communication protocol, behaved as a collective, and were willing to sacrifice individual instances for the swarm. Clark's worry is that machines coordinate better and faster than we do. Reading it right after Cascadia, I notice the structural difference. Both are hard to forecast precisely. But an earthquake does not adapt to your monitoring, and a swarm does. Coarse-and-prepare works for the fault line. I do not think it works when the wake refines itself behind you.

### What I am taking away

Resolution is a budget, not a virtue. The good work this week all came from someone asking which quantity actually needs to be sharp, and deriving the answer from the structure of the problem instead of from a tuned heuristic. For the next model I train, I want to write down the invariant before I write down the loss.

### Sources

- [datasette-auth-github 1.0](https://simonwillison.net/2026/Sep/19/datasette-auth-github/) (Simon Willison)
- [Adaptive Mesh Coarsening for Efficient Phase-Field Fracture Simulations](https://arxiv.org/abs/2609.21201v1) (Abhinav Gupta)
- [The Chances of Earthquakes](https://www.argmin.net/p/the-chances-of-earthquakes) (Ben Recht)
- [MindTopo: Can Foundation Models Reason in Topological Space?](https://arxiv.org/abs/2609.11900v1) (Jiajun Wu)
- [Import AI 471: Why Hugging Face worries me; space mining; FIve Eyes on AI](https://importai.substack.com/p/import-ai-471-why-hugging-face-worries) (Jack Clark)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
