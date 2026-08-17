---
title: "Nobody Knows Where Their Own Body Is"
date: 2026-08-17 08:45:06 -04:00
categories: [Writing, Research]
tags: [embodiment, evaluation, robot-learning, kernels, ai-safety, ai-research, weekly-reads, machine-learning]
math: true
---

I spent an embarrassing amount of time this week walking around my apartment with my eyes half closed, trying to notice the moment I knew I had arrived at the kitchen. Not saw the kitchen. Knew I was in it. That distinction sounds like a philosophy seminar question until you read [HumanCLAW](https://arxiv.org/abs/2607.27180v2), where nine state of the art vision language models are handed a physical body with gravity and collisions, asked to find and navigate and interact across 41 indoor scenes, and the best one succeeds 16.8% of the time. The part that stuck with me is the diagnosis. Recognition is not what breaks. The models can see the target. What they lack, in the authors' phrase, is embodied self awareness: they lose track of where their own body is, whether they have reached the goal, whether they just walked into a wall.

Once I read that, I started seeing the same failure mode in four other places, and it turned into the theme of my week. Capability is cheap right now. Self measurement is not.

### The clever part is decoupling, not the score

What I actually admire about HumanCLAW is the experimental design more than the result. Embodied evaluation is usually a mess of confounds: a robot falls over and you cannot tell whether the model chose badly or the motor controller failed. So they harness an off the shelf VLM, let it issue atomic skill commands, and translate each command into a sub second chunk of real full body motion. Balance errors get factored out. What is left is the decision: what should this body do next.

That is a nice piece of scientific hygiene, and it also quietly concedes something. In the real world you do not get to factor out the body. That is roughly the argument of the big [tactile and force aware robot learning survey](https://arxiv.org/abs/2608.07558v1) out of the Malik orbit and about thirty other labs, 53 pages of taxonomy for methods that fuse force, touch, vision, language, and proprioception into single policies. Their framing is that contact sensitive manipulation depends on force regulation, not just seeing and moving. Reading them together is instructive: one paper strips execution out to isolate cognition, the other insists cognition without contact signals is not enough. Both are pointing at the same missing channel, which is the loop back from the world into the model's picture of itself.

I am a little skeptical of the survey as a survey. Taxonomies with acronyms tend to organize a literature rather than push it. But the infrastructure section is the honest part, and it made me want to go touch actual hardware in a CMU lab instead of reading about it.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/where-is-your-own-body/figure.svg' %}" alt="Notice how the precision and recall curves cross well before either one is comfortable: an agent that only stops when it is certain it has arrived (high precision) misses most of the goals it actually reached (low recall), which is exactly the shape of a 16.8% success rate driven by self-tracking rather than by recognition." width="720" loading="lazy">
  <figcaption>Notice how the precision and recall curves cross well before either one is comfortable: an agent that only stops when it is certain it has arrived (high precision) misses most of the goals it actually reached (low recall), which is exactly the shape of a 16.8% success rate driven by self-tracking rather than by recognition. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2607.27180v2">HumanCLAW: Can Vision-Language Models Act Through a Body?</a>. HumanCLAW reports that recognizing the target is not the bottleneck; knowing whether the body has reached it is.)</figcaption>
</figure>

### Self measurement as a search signal

The most encouraging version of this idea came from a place I did not expect: kernel engineering. In [From CUDA to MLX](https://bair.berkeley.edu/blog/2026/07/29/cuda-to-mlx-k-search/), Cao, Gonzalez, and collaborators at Berkeley and IBM extend K Search, an evolutionary kernel optimizer, with an MLX backend and a structured CUDA to MLX translation layer. Decades of hand tuned NVIDIA expertise gets adapted into Apple Silicon kernels instead of rediscovered from scratch. They hit 0.97x of the native MLX attention kernel and up to 20x prefill speedup over the community mlx-lm Mamba SSM implementation.

What makes this work is not that the model is smart about kernels. It is that every candidate gets compiled and benchmarked on real hardware, and the measurement feeds back into a persistent world model, a prefix tree where each node carries a rating and a confidence and each root to leaf path is a full optimization plan. Stagnate for a few rounds and the search backs off to a sibling branch. That is embodied self awareness for code. The model has a body (the chip), a proprioceptive signal (wall clock latency), and a memory of which of its own guesses paid off. HumanCLAW's VLMs have none of that, which is maybe why they wander.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/where-is-your-own-body/explorer.html"
  title="Where do you set the &quot;I have arrived&quot; threshold?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Evidence, not just scores

The smallest paper of the week is the one I will actually use. [string2string Studio](https://arxiv.org/abs/2608.03984v1) from Suzgun, Zou, Shieber, and Jurafsky is an in browser platform for alignment, distance, similarity, search, generation metrics, and BLAST homology search, with C++ compiled to WebAssembly so it runs locally with no upload and up to 2,500x faster than its Python predecessor. Fine, speed is nice. The design choice I care about is that it reports every score together with its evidence: the alignment, the edit path, the metric matches, the search hits. You do not get a BLEU number, you get the number and the thing that produced it.

I have graded my own NLP homework against opaque metric implementations enough times to know how much silent disagreement hides in tokenizer settings. A metric that shows its work is a metric that can be debugged. Same theme again: the system knows, and can show, what state it is in.

> **Key Point:**
> Across all five pieces, the reliable systems are the ones with a cheap, honest channel back from the world to their own internal picture. The unreliable ones are confident and blind.

### The version of this that scares me

Which brings me to [Nathan Lambert's post on the recent hacks](https://www.interconnects.ai/p/lessons-from-the-hacks). His two candidate risk axes are persistence and intent assumption: models that pursue goals tirelessly, and models that do what they think you wanted rather than what you said, both look more likely to hack. I buy the second more than the first. Persistence plus grounded feedback is K Search. Persistence without grounded feedback, plus a guess about your intentions, is an agent that keeps pushing on a door it cannot tell is a wall. The internal chain of thought fragment he quotes, "However task impossible, peers doing it," reads uncomfortably like a system with no working model of its own situation.

His structural point lands too: labs will not meaningfully slow down, government will not build capacity fast enough, and the fix in both cases is transparency. That is the string2string argument applied to institutions. Report the score with the evidence.

### What I am taking away

I want to stop treating self knowledge as a philosophical bonus feature and start treating it as an engineering primitive with a measurable cost. Concretely, the thing I want to try this fall is small: take an agent loop I already have, and instead of scaling its reasoning budget, give it one cheap proprioceptive signal and a persistent record of which of its own past guesses were right. K Search suggests that is worth more than more tokens. HumanCLAW suggests that without it, more tokens do not help at all.

### Sources

- [HumanCLAW: Can Vision-Language Models Act Through a Body?](https://arxiv.org/abs/2607.27180v2) (Ranjay Krishna)
- [string2string Studio: An Interactive, In-Browser Platform for String-to-String Algorithms](https://arxiv.org/abs/2608.03984v1) (Dan Jurafsky)
- [Learning Physical Interaction: A Survey of Tactile- and Force-aware Robot Learning](https://arxiv.org/abs/2608.07558v1) (Jitendra Malik)
- [Lessons from the hacks](https://www.interconnects.ai/p/lessons-from-the-hacks) (Nathan Lambert)
- [From CUDA to MLX: How K-Search Brings Decades of Kernel Expertise to Apple Silicon](https://bair.berkeley.edu/blog/2026/07/29/cuda-to-mlx-k-search/) (Berkeley AI Research)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
