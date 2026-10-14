---
title: "Where Human Attention Goes When the Machine Does the Generating"
date: 2026-10-14 15:08:44 -04:00
categories: [Writing, Research]
tags: [verification, imitation-learning, robotics, algorithms, on-device-models, evaluation, ai-research, weekly-reads, machine-learning]
math: true
---

Here is the number I keep coming back to this week: 10^100. In [Ben Recht's post on OpenAI's claimed faster Fourier transform](https://www.argmin.net/p/faster-fourier-transforms), that is the estimated hidden constant C when N is 10^12. The new algorithm is asymptotically faster than Cooley-Tukey, technically. In practice, Recht points out, even at n = 10^100 the classic FFT would still be 10^99 times faster. The claim is true on paper. It is also useless.

What strikes me is how ordinary the failure is. Nobody lied. Big-O notation did exactly what it was built to do: throw away constants. The problem is that a human has to look at the constant to know if the result matters, and as the volume of generated mathematics grows, fewer humans are looking. That framing tied together everything I read this week. When machines produce more candidates, policies, and claims than people can check, **human attention becomes the budget**, and the interesting question is how to spend it.

### Verification is cheaper than discovery, if you split the job

The paper that makes this explicit is [One-Sided Verification Under Limited Expert Review](https://arxiv.org/abs/2610.18089v1) from Fan Nie, Stefano Ermon, James Zou and coauthors. Their setup is the honest version of the problem Recht is complaining about. AI generates many candidate solutions to hard problems, most are wrong, and an expert can only review so many. So they optimize a one-sided objective: reject as many invalid solutions as possible (true negative rate) while keeping the rate of falsely rejecting valid ones (false negative rate) under a cap.

I like this objective a lot. Accuracy treats both mistakes as equal, but they are not. Throwing away the one correct proof of an open conjecture is a disaster. Sending a reviewer one extra wrong proof is an annoyance. Writing the asymmetry into the loss is the kind of thing that sounds obvious once someone says it.

Their method, OSVerify, rests on an intuition I find convincing: verifying a specific error is easier than discovering one. So they split the work. An error proposer searches for problems at different granularities through hierarchical decomposition, and a separate validator decides if each flagged error is substantial, minor, or hallucinated. Compared to voting baselines at the same low FNR, this cuts human reviews of invalid solutions by 46% on average, and 57% after post-training the validator. They also report finding errors in published papers that the original authors confirmed, and helping resolve three Langlands open conjectures confirmed by experts.

> **Key Point:**
> The scarce thing is no longer the generator. It is the person who has to say "yes, this is right." A good verifier is a device for protecting that person's time.

Play with the tradeoff yourself. Drag the slider below to tighten or loosen the filter and watch what happens to the two kinds of error.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/where-human-attention-goes/explorer.html"
  title="How strict should the filter be?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

The thing to notice is that the curve is not symmetric in cost. Near a very strict FNR cap, every bit of extra filtering gets expensive.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/where-human-attention-goes/figure.svg' %}" alt="A precision-recall curve for a verifier that filters candidate solutions before a human sees them. Notice how the curve stays high on the left and then drops off: a little extra recall comes cheap, but pushing toward catching every valid solution costs a lot of precision, which means more invalid candidates land on a reviewer's desk." width="720" loading="lazy">
  <figcaption>A precision-recall curve for a verifier that filters candidate solutions before a human sees them. Notice how the curve stays high on the left and then drops off: a little extra recall comes cheap, but pushing toward catching every valid solution costs a lot of precision, which means more invalid candidates land on a reviewer's desk. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2610.18089v1">One-Sided Verification Under Limited Expert Review</a>. Illustrates the TNR versus FNR tradeoff that OSVerify optimizes under a limited human review budget.)</figcaption>
</figure>

### Robots have the same problem, with a joystick

[I3L](https://arxiv.org/abs/2610.17748v1), from Wensi Ai, Jiajun Wu, Li Fei-Fei, Ruohan Zhang and coauthors, is about robots, but I read it as the same story. Policies trained offline from teleoperated demonstrations break outside their training distribution, and long-horizon whole-body mobile manipulation makes it worse, because errors compound and you cannot demonstrate every coordinated combination of arm, torso, and base motion.

Their answer is to spend human effort only where the policy fails. The JoyLo+ interface uses leader arms that track the policy, with touch-triggered takeover, so an operator can jump in and correct the whole body mid-episode. Then they retrain and redeploy, and the operator targets the failures of the updated policy. Four rounds of HG-DAgger gave the best final success in their controlled simulation experiments. Across three embodiments and eight tasks, I3L improves autonomous success over base policies by 68.3 percentage points on average, hits at least 90% on every task, and beats demonstration-only training by 35.6 points with the same number of trajectories.

The stat I find most telling is that takeover duration per episode drops 72% over four rounds. That is literally a measurement of human attention shrinking as the system improves. Same trajectory count, much better policy, because the human data went where the policy was weak instead of where it was already fine. It is OSVerify's logic applied to motion: do not ask the expert to review everything, ask them to fix the specific failure.

My doubt: corrections come from an operator who can see the failure coming. I would want to know how much of the gain depends on operator skill, and whether a less experienced operator's corrections help as much.

### Reusable pieces mean less to check

[GOTT](https://arxiv.org/abs/2610.03861v2), from Yulin Liu, Pieter Abbeel, Haozhi Qi and coauthors, fits in from a different angle. Dexterous hands lack a reliable, reusable low-level primitive for establishing contact. GOTT proposes a reach-acquire-move framework: something brings the hand near a task-relevant contact region, a single shared closed-loop primitive establishes stable contact, and a pose-conditioned controller tracks the object motion. The reach can come from planning, external models, or human demonstrations, while the primitive and tracking backend stay the same. They report robust contact across diverse objects, arm-hand platforms, and even unseen hand morphologies, plus better end-to-end success than open-loop grasping.

What connects this to the week is the decomposition. Like OSVerify separating proposal from validation, GOTT separates intent from contact. If one primitive works across embodiments, you validate it once instead of re-checking a new grasp pipeline for every hand. I want to see where it breaks, though. "Approximate initialization" is doing a lot of work, and I would like to know how far off the reach can be before the primitive fails.

### Reading the benchmark table like Recht reads big-O

The [LFM2.5-24B-A2B release from Liquid AI](https://huggingface.co/blog/LiquidAI/lfm25-24b-a2b) is a different kind of source, but it is a good test of the habit Recht is asking for. The headline: a 24B-parameter MoE with only 2B active parameters per token, 184 tokens per second on an M5 Max, and a LiveClaw score of 48.09 versus 38.19 for Qwen3.6-35B-A3B. On AutomationBench it scores 27.69, more than three times the next-best model.

Read the whole table, though, and the story gets more honest. On SWE-Bench Verified it gets 51.00 against Qwen's 66.20. On GPQA Diamond it is 74.42 versus 83.69. To their credit, the post says this directly and recommends pairing the model with retrieval for knowledge-heavy work. I respect that. It is the opposite of hiding the constant. The claim is scoped: strong at tool use and instruction following, weaker at coding and knowledge.

What I wonder is whether "cheap reasoning tokens on your own device" changes the verification math. If an agent can run continuously and privately, it can also generate candidates continuously, which pushes even harder on the human review bottleneck OSVerify is about.

### What I am taking away

The common thread is that generating got cheap and checking did not. Recht's FFT example shows what happens when nobody checks the constant. OSVerify and I3L show what it looks like to treat expert time as the thing you optimize, and GOTT shows how good decomposition shrinks what needs checking at all.

The experiment I want to try is small: take a set of generated proofs or solutions, build a crude two-stage filter (one model proposes a specific error, another judges it), and plot the TNR I get at a fixed FNR against simple majority voting. I suspect the asymmetric objective matters more than the specific models. That is a hypothesis, and I would like to find out if it is wrong.

### Sources

- [I3L: Iterative Interactive Imitation Learning for Whole-Body Mobile Manipulation](https://arxiv.org/abs/2610.17748v1) (Jiajun Wu)
- [GOTT: Object-centric Dexterous Manipulation with a Reusable Cross-Embodiment Primitive](https://arxiv.org/abs/2610.03861v2) (Pieter Abbeel)
- [Run fast, private agents on-device with LFM2.5-24B-A2B](https://huggingface.co/blog/LiquidAI/lfm25-24b-a2b) (Hugging Face)
- [Faster Fourier Transforms](https://www.argmin.net/p/faster-fourier-transforms) (Ben Recht)
- [One-Sided Verification Under Limited Expert Review](https://arxiv.org/abs/2610.18089v1) (Stefano Ermon)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
