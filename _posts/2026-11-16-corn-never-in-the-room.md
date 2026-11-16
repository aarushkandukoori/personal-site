---
title: "The Corn Is Never in the Room: Measuring AI Where It Actually Acts"
date: 2026-11-16 05:45:05 -05:00
categories: [Writing, Research]
tags: [evaluation, verification, benchmarks, open-models, forecasting, transformers, ai-research, weekly-reads, machine-learning]
math: true
image:
  path: /assets/img/previews/corn-never-in-the-room.png
  alt: "Two loops side by side."
  hide: true
---

The best vision-language model in a new benchmark finishes only 53.5% of its tasks within the time limit, and part of the reason has nothing to do with being wrong. It is often just too slow. In [Interactive Visual Gym](https://arxiv.org/abs/2611.08286v2), Chenhao Zheng, Ranjay Krishna and colleagues put assistants inside simulated kitchens, households and phone interfaces with a simulated user who makes mistakes. When the user is about to burn something, a correct instruction that shows up late counts for nothing. An offline benchmark would never notice that, because in a replay the user's next move is already fixed.

I keep coming back to that detail because it names something every piece I read this week is circling. We almost never measure the thing we care about. We measure something next to it that is easier to hold, and then we forget we swapped them.

### Replays cannot be wrong in the right ways

The IVG argument is simple once you say it out loud. If an assistant's answer can change what the user does next, then evaluating it on a frozen recording measures a world where its answers don't matter. The authors build three simulators plus a persona-conditioned user harness that injects "controlled execution errors and other out-of-plan behaviors," and turn it into IVG-Bench with 315 scenarios. Their best model, Claude Opus 5.5, still shows "significant weaknesses in factual grounding and actionable guidance."

What I like most is that they check their own proxy. Their interaction-quality metric matches human participant preferences 78.5% of the time. That is decent, and it is also an honest admission that roughly one in five judgments points the other way. They also show the environment works as a training signal: a small GRPO run on Qwen3.5-4B in the cooking simulator improves both task success and interaction quality. My doubt is the obvious one. A simulated user is still a model of a user. If you train against it long enough, I would expect the assistant to get good at helping *that* simulated person, and I would want to see how much of the gain holds up against real people.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/corn-never-in-the-room/figure.svg' %}" alt="Two loops side by side. On the left, an offline replay is a frozen ring where the assistant's answer is scored but the recorded next step never changes. On the right, a live closed loop where the user's action, the assistant's answer and the user's next action keep feeding into each other, so a late or wrong answer changes how the task ends." width="720" loading="lazy">
  <figcaption>Two loops side by side. On the left, an offline replay is a frozen ring where the assistant's answer is scored but the recorded next step never changes. On the right, a live closed loop where the user's action, the assistant's answer and the user's next action keep feeding into each other, so a late or wrong answer changes how the task ends. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2611.08286v2">Interactive Visual Gym: Evaluating Visual Interaction Models with Simulated Users in Interactive Worlds</a>. Illustrative diagram of the offline vs. interactive evaluation contrast argued in Interactive Visual Gym (Zheng, Krishna et al.); no numbers from the paper are plotted.)</figcaption>
</figure>

### Certified by whom?

The proof-verification paper from [Abhinav Gupta and coauthors](https://arxiv.org/abs/2611.14794v1) is the cleanest example of a proxy quietly standing in for the target. Their pipeline rewrites a solver's answer into typed steps and lets LLM judges either certify it or decline. On AIME, certification raises answer-key precision by 46 points, but only 21% of attempts get answered. On GPQA the gain is 31 points at 35% coverage. On near-ceiling MATH-500, the gain is at most 5 points while giving up 13 to 27 points of coverage.

That is a precision versus coverage trade, and it is not free. Drag the slider below to see how fast coverage drains away as you demand more certainty.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/corn-never-in-the-room/explorer.html"
  title="Certify or Decline: The Price of Certainty"
  sandbox="allow-scripts"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

Two results in the paper bother me in a productive way. First, a much cheaper baseline, self-consistency matched on output tokens, gets 82.9% precision at the same 35% coverage, compared with the verifier's pooled 87.6%. The paired difference is +4.8 points with a 95% interval of [-8.2, 18.5]. That interval crosses zero comfortably, so I cannot tell whether the elaborate verifier beats majority voting at all. Second, and this is the part I find genuinely surprising, "certified" does not mean "valid proof." External LLMs accept only 61.0 to 67.6% of the rendered certified chains, even though 87.6% match the answer key. Open-weight auditor pairs show near-zero chance-corrected agreement, which the authors say "measures consistency rather than accuracy against proof truth."

> **Key Point:**
> A right final answer, a judge's stamp, and a true proof are three different things. The paper's recommendation to report execution failures, answer precision and proof validity separately feels like the minimum, not a nice extra.

There is also a failure mode I would never have guessed: 52 of 88 completed problems in their diagnostic sample break during proof construction and never reach a judge. The bottleneck is not judgment, it is plumbing.

### Tokens are not an economy, contracts are not corn

Nathan Lambert's [first open model economy note](https://www.interconnects.ai/p/how-well-can-we-measure-open-model) is about a measurement problem at a much larger scale. He wants to know if open model inference is growing or "a rounding error relative to OpenAI/Anthropic," and he is upfront that "all the measurements we have on open model adoption are incredibly imprecise." His proxies are token volumes disclosed by Baseten, Fireworks and Together AI, plus OpenRouter's open model share. Fireworks says it serves more than 40T tokens per day to customers' customized models, a slice that grew over 2x since summer, and Lambert expects their total to land well above 100T.

I think token volume is a reasonable bellwether, and I appreciate that he calls these notes "more raw" than his usual writing. But a token is not a unit of value. A trillion tokens of agent retries and a trillion tokens of finished work look the same on that chart. It is the economic version of a certified chain that no external judge accepts.

Ben Recht's [post on prediction markets](https://www.argmin.net/p/no-one-buys-corn-in-the-corn-market) gives the whole week its title. Futures started as a way for a corn buyer to hedge a bad harvest. Then people traded the contracts instead of executing them, so "no corn moves anywhere, but money still changes hands." Once you are trading contracts on prices, why not contracts on events? Recht's point is that each layer drifts further from the physical thing, and that the 2008 case for prediction markets as information aggregators rested on market efficiency, published two months after the Fed's emergency rescue of Bear Stearns. He notes Polymarket and Kalshi trading volume grew fivefold this year. I mostly agree with his skepticism, though I want to hold on to the forecasting tournament idea he mentions, since scoring forecasts against real outcomes is exactly the kind of grounding the derivative layers lose.

### Same token, different job

Sebastian Raschka's [walkthrough of positional embeddings](https://magazine.sebastianraschka.com/p/understanding-positional-embeddings) looks like it belongs in a different week, but it rhymes. In "The red fox jumps over the gray fox," both foxes get token ID 2 and therefore the same embedding vector. Without position information, the model cannot tell which fox jumps. GPT-2 fixes that by adding a position vector before the first block, while models like MiniMax-M3 inject it inside attention with RoPE in every block.

That is the same lesson in miniature. The identity of a thing (a token, an answer, a contract) tells you less than you think. What matters is where it sits and what happens next.

### What I am taking away

The habit I want to build is asking, every time I see a number, which side of the gap it lives on. Is this a replay or a loop? An answer key match or a valid proof? Tokens or value? A contract or corn? None of these authors claim to have closed the gap. The ones I trust most are the ones who measure it out loud, like IVG's 78.5% agreement or the proof paper's interval that crosses zero.

If I tried one thing next, it would be a small version of the certify-or-decline experiment: compare a verifier against plain majority voting at matched compute and report all three of their numbers separately. My guess is the gap between them is smaller than the pipeline's complexity suggests, and I would like to be proven wrong.

### Sources

- [Interactive Visual Gym: Evaluating Visual Interaction Models with Simulated Users in Interactive Worlds](https://arxiv.org/abs/2611.08286v2) (Ranjay Krishna)
- [When Is Proof-Step Verification Worth Its Cost? Operating Requirements of Certify-or-Decline Verification for Open-Weight Mathematical Reasoning](https://arxiv.org/abs/2611.14794v1) (Abhinav Gupta)
- [How big is the open model economy today?](https://www.interconnects.ai/p/how-well-can-we-measure-open-model) (Nathan Lambert)
- [No One Buys Corn in the Corn Market](https://www.argmin.net/p/no-one-buys-corn-in-the-corn-market) (Ben Recht)
- [Understanding Positional Embeddings in Modern LLMs](https://magazine.sebastianraschka.com/p/understanding-positional-embeddings) (Sebastian Raschka)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
