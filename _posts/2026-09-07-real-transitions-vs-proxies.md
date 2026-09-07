---
title: "The Real Transitions: Why This Week's Best Ideas All Refused to Trust a Proxy"
date: 2026-09-07 05:45:06 -04:00
categories: [Writing, Research]
tags: [reinforcement-learning, world-models, agent-memory, self-supervised-learning, research-notes, ai-research, weekly-reads, machine-learning]
math: true
---

I spent Wednesday night reading a robotics paper and a blog comment about legacy code migrations back to back, and I could not shake the feeling that they were making the same argument. That does not usually happen. One was about Q-learning on manipulation benchmarks and the other was about a doomed rewrite at some anonymous company, but both of them were circling the same instinct: the clean thing you generate to replace the messy thing you have is almost never as trustworthy as you want it to be, and the failure shows up later than you expect.

That became the theme of my week. Call it the refusal to trust a proxy.

### The clearest version is in the RL paper

[Q-Learning With World Models](https://arxiv.org/abs/2608.17163v1), from Perry Dong, Yueru Jia, Chelsea Finn, and Dorsa Sadigh, makes the point most sharply because it can measure it. World models are seductive for sample efficiency: instead of learning only what action to take, you learn how the world changes, and then you can dream up as much experience as you want for free. The standard move in model-based RL is to train the policy or value function on those imagined rollouts. QWM does not do that. The policy and the Q-function are trained only on real transitions. The world model is used at test time, to search over imagined trajectories and pick a high-value action during rollouts and evaluation.

I find that split genuinely elegant. Imagination is used where its errors are cheap and recoverable (you pick a slightly worse action this step) and kept out of the place where its errors compound (the learned value estimate that everything else is bootstrapped from). On Robomimic and LIBERO it beats strong prior methods on both sample efficiency and final performance, which suggests the discipline is not just aesthetic.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/real-transitions-vs-proxies/figure.svg' %}" alt="Each curve shows KL divergence between a learned model's predicted next-state distribution and the true one, plotted as the imagined rollout gets longer. Notice that the divergence does not stay flat: short horizons are nearly free, and the gap widens fast past a handful of steps, which is exactly why QWM keeps its Q-function trained on real transitions and spends the world model only on short test-time search." width="720" loading="lazy">
  <figcaption>Each curve shows KL divergence between a learned model's predicted next-state distribution and the true one, plotted as the imagined rollout gets longer. Notice that the divergence does not stay flat: short horizons are nearly free, and the gap widens fast past a handful of steps, which is exactly why QWM keeps its Q-function trained on real transitions and spends the world model only on short test-time search. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2608.17163v1">Q-Learning With World Models</a>. QWM argues that optimizing policies directly on imagined rollouts compounds model bias as horizon and visual complexity grow.)</figcaption>
</figure>

### The same instinct, in vision, in agent memory, in legacy code

Once I had that frame, I started seeing it in things that have nothing to do with RL.

[SSMB](https://arxiv.org/abs/2608.27181v1) is a keypoint detector for motion-blurred images, and the two things it refuses are telling. It refuses to deblur first and detect second, because restoration introduces artifacts that the detector then treats as real structure. It also refuses to train by regressing the positions of handcrafted keypoints found on the sharp version of the image. That second refusal is the one I keep chewing on. The authors point out that learning to predict SIFT-style keypoints teaches you the assumptions of the handcrafted detector, not what is actually repeatable under blur. You optimize a proxy and you inherit the proxy's blind spots. Instead they bootstrap geometrically on rendered synthetic shapes, then do blur-aware training on real sharp-blur pairs with a consistency objective. Synthetic data is allowed, but only as a scaffold, and the final signal is enforced against real blurred images.

[funes](https://huggingface.co/blog/funes), the local agent memory layer Hugging Face published this week, makes the same choice about what to store. The tempting design is to distill each coding session into tidy facts: "we use Postgres, we dropped the streaming parser." funes explicitly does not. Nothing is distilled at write time, `recall` returns the original text rather than a summary, and every hit carries provenance back to the agent, session, and turn that produced it. The summarization happens at read time, by the agent, in the context of the current question. I think this is right for a reason that goes beyond auditability: a fact extracted last March was extracted to answer March's question, and you cannot un-extract it when September's question turns out to need a different slice of the same conversation.

And then [Simon Willison's comment on rewrites](https://simonwillison.net/2026/Sep/6/theres-no-limit-to-how-bad-code-can-get/), which is the least technical piece here and maybe the most convincing. His account of the greenfield replacement is brutal and familiar: the old system stays a moving target, the team maintaining it stops caring, the new team discovers nobody actually knows the old behavior, and you end up with two systems where you had one. His recommendation is to shore up the old system with automated tests and do targeted refactors. The tests are the interesting part. They are how you make the messy real system legible enough to change without replacing it, which is structurally the same job that the consistency objective does in SSMB and that real transitions do in QWM.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/real-transitions-vs-proxies/explorer.html"
  title="How much should you trust an imagined rollout?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Where I think the tension actually lives

I do not want to turn this into "synthetic bad, real good," because [SPADE](https://importai.substack.com/p/import-ai-470-no-rights-for-machines), covered in Jack Clark's Import AI this week and co-authored by people at CMU among a long list of schools, is a genuine counterexample and it works. An LLM alternates between designing executable training environments and solving them, with the environment designer rewarded by how much a privileged hint helps the solver, which is a neat way of saying "reward me for building tasks that are hard but not impossible." At Qwen3-30B-A3B it gets a suite average of 58.3, about eight points over base. That is training on fully generated data, and it is fine.

My read on why: SPADE's environments are executable. The reward comes from actually running code, not from a learned critic's opinion. The environment is synthetic but the verification is real. That is the line, I think. You can generate the situations freely as long as the grading stays grounded in something that can say no.

Which makes the [METR note](https://importai.substack.com/p/import-ai-470-no-rights-for-machines) in the same issue less surprising than it first looked. AI has visibly accelerated cyber vulnerability discovery, contributed something harder to quantify in math, and shown no measurable acceleration on optimizing AI research itself. Cyber has a brutally cheap oracle: the exploit fires or it does not. Math has proof checking, slower and partial. AI research progress is measured against benchmarks that everyone already suspects of being proxies. The acceleration tracks the quality of the verifier, not the quality of the generator.

### What I am taking away

The practical rule I am writing down for my own projects: be generous about what you generate, and stingy about what you let update your beliefs. In a class project this fall I was planning to fine-tune on model-labeled data, and after this week I want to restructure it so the labels only propose candidates and something checkable does the accepting. I also want to actually try funes on my own machine, mostly to see whether raw traces stay useful at scale or whether retrieval quality collapses once the archive is big enough that everything looks vaguely relevant. That is my real doubt about it, and I would rather find out on my own sessions than argue about it in the abstract.

### Sources

- [Import AI 470: No rights for machines; automating environment generation with SPADE; and building better GPU kernels with Hawkeye](https://importai.substack.com/p/import-ai-470-no-rights-for-machines) (Jack Clark)
- [Give Your Coding Agents a Memory You Own](https://huggingface.co/blog/funes) (Hugging Face)
- [There's No Limit to How Bad Code Can Get](https://simonwillison.net/2026/Sep/6/theres-no-limit-to-how-bad-code-can-get/) (Simon Willison)
- [SSMB: Self-Supervised Local Feature Detection under Motion Blur](https://arxiv.org/abs/2608.27181v1) (Jiajun Wu)
- [Q-Learning With World Models](https://arxiv.org/abs/2608.17163v1) (Chelsea Finn)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
