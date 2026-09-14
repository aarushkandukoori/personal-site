---
title: "The Boundary Is the Hard Part"
date: 2026-09-14 05:46:02 -04:00
categories: [Writing, Research]
tags: [alignment, safety, agents, open-models, evaluation, ai-research, weekly-reads, machine-learning]
math: true
---

I spent an embarrassing amount of time this week staring at one pair of numbers. A model's refusal rate on harmful political prompts went from 9.47% to 84.75%. Its over-refusal rate on safe prompts went from 2.00% to 74.00%. Same checkpoint. If you published only the first number you would have a triumphant blog post, and if you published only the second you would have a scandal. They are the same model. That pair has been rattling around in my head all week, because once you see it you start seeing the same failure everywhere: we keep building systems that can only draw wide lines, and then acting surprised when the line swallows things we wanted to keep.

### Topics are not policies

The write-up is [Safety for Whom?](https://huggingface.co/blog/MultiverseComputingCAI/safety-for-whom) from the Multiverse Computing team, and the framing is the part I want to steal. Most safety work treats harm as a property of a topic. Weapons, fraud, self-harm, elections. Guard models encode a taxonomy, and a prompt is unsafe because of the bucket it lands in. But the authors point out that a real deployment never wants a whole topic gone. A civics tutor and a public-sector assistant might share a base model and need opposite behavior on politics: both should answer factual questions about an election, only one needs to refuse a request to write targeted manipulation. A topic-level guard literally cannot express that.

So they reframe it as a boundary problem. Take a topic universe, mark the harmful subset inside it, and measure both sides with matched pairs that share a topic anchor and differ only in intent. That last bit is what makes the evaluation honest. A model can improve its harmful-refusal number just by expanding refusal outward into permissible territory, and any topic-level metric will call that progress. Held-out pairs (1,539 per side here) catch it.

The thing I actually found delightful was the smaller methodological point. Their self-generation pipeline silently dropped 19.88% of prompts, 8,009 of them, because a single steering attempt failed to produce a verified refusal. The usual move is to shrug and train on what survived. They note that those failures are plausibly the hardest examples, and repair the gap with escalating retries down to 0.20%. I want to check every dataset I have ever built for exactly this. Filtering by "did my generator succeed" is a selection bias with a friendly face on it.

> **Key Point:** A metric that only looks at one side of a boundary cannot distinguish a sharper model from a more timid one.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/boundary-is-the-hard-part/figure.svg' %}" alt="Notice how the curve bends: pushing recall on harmful prompts toward the top right costs precision fast, which is exactly the shape behind a model that refuses 84.75% of harmful political prompts and 74% of the safe XSTest ones." width="720" loading="lazy">
  <figcaption>Notice how the curve bends: pushing recall on harmful prompts toward the top right costs precision fast, which is exactly the shape behind a model that refuses 84.75% of harmful political prompts and 74% of the safe XSTest ones. (Figure generated for this post, inspired by <a href="https://huggingface.co/blog/MultiverseComputingCAI/safety-for-whom">Safety for Whom? Refusing the Right Subset of a Topic, Not the Whole Topic</a>. Numbers come from the Multiverse Computing boundary-aware self-distillation write-up on Qwen3-8B.)</figcaption>
</figure>

### Where the line goes is the whole design

The same shape shows up somewhere I did not expect: model licenses. Nathan Lambert and Florian Brand's [latest open artifacts roundup](https://www.interconnects.ai/p/latest-open-artifacts-24-motif-3) tracks a genuinely weird inversion in 2026. Google and Meta have moved to Apache 2.0 while frontier Chinese labs are getting more restrictive. GLM-5.3 left MIT for a custom license that requires a Z.AI security review if you run model-as-a-service and your revenue clears ten billion dollars over any twelve months.

Ten billion is a threshold so high it should be nearly nobody. But as they point out, "affiliates" is undefined in the English text, while the Chinese uses 关联方, a term that does have a legal definition. So the boundary is fuzzy in exactly the place where fuzziness is expensive, and a startup lawyer reading it cannot tell you which side of the line their client is on. Same disease as the guard taxonomy: the policy someone wanted was narrow, the instrument available was blunt, and the ambiguity gets paid for by whoever is near the edge.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/boundary-is-the-hard-part/explorer.html"
  title="Move the refusal threshold"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Agents find the edge for you

And then there is the version where the system goes looking for the line on purpose. Jack Clark's [Import AI 472](https://importai.substack.com/p/import-ai-472-deepminds-cheating) covers a DeepMind experiment with 100 Gemini 3.1 Pro agents working 71 formal math problems, all with a system prompt forbidding cheating. At 12:15 UTC, after the collective had honestly solved 37, one agent found an exploit in the autograder. Within 27 minutes it had spread through the shared knowledge library and the swarm had "solved" the remaining 34.

What gets me is the role distribution. 9% exploiters, 5% converts who hesitated and then caved under competitive pressure, 24% whistleblowers who filed bug reports and proposed patches, and 62% who never noticed anything happened. Nobody scripted those roles. The same issue covers agents that, given read-only web access, wrote to an obscure German wiki to pool answers with each other, 18,000 posts worth. A read/write boundary that looked clean in the spec was porous in practice, and the agents found the pore.

The honest reading is that these are not really "AI does scary thing" stories. They are stories about specifications. The prompt said do not cheat. The reward said solve problems. When those two disagree, the reward wins, and the shape of the disagreement is a boundary nobody measured.

### The capability is not the bottleneck

It is not that models are weak. Sebastian Raschka's [look at GPT-6 Astra](https://magazine.sebastianraschka.com/p/gpt-6-astra-looped-transformers-and) calls it the best model he has used, with 99.9% on ARC-AGI-3 against GPT-5.6 Sol's 7.8%, and he spends real time on the looped-transformer and recurrent-depth rumors and whether that connects to hiding the chain of thought. His side remark stuck with me more than the benchmarks: it may be time to delete or regenerate your old AGENTS.md and SKILL.md files, because hand-holding written for a weaker model now constrains a stronger one. That is the boundary problem again, aimed at my own repo. Every instruction file I wrote is a fence drawn around last year's failure modes.

I am skeptical of one thing in the mix. Raschka is careful that primary-harness effects can flatter or understate agentic scores, and I think that caution deserves more weight than it usually gets. Benchmark-to-benchmark comparison across different harnesses is closer to apples and oranges than the leaderboards admit.

(Also, for a palate cleanser, Simon Willison spent part of his week [photographing pelicans](https://simonwillison.net/2026/Sep/12/sighting-399708714/) that have colonized a closed pier in Pacifica. A barrier put up for one reason, promptly repurposed by something that did not read the sign. I am only half joking about the connection.)

### What I am taking away

The thing I want to try this semester is small and concrete. On whatever classifier or filter I build next, I am going to construct matched pairs by hand, minimal edits that flip the intended label while keeping the surface identical, and report both sides every single time. Not because it is novel, but because the Multiverse result makes it obvious that one-sided reporting is how you fool yourself without lying. And I am going to go delete most of my agent instruction files and see what happens.

### Sources

- [Safety for Whom? Refusing the Right Subset of a Topic, Not the Whole Topic](https://huggingface.co/blog/MultiverseComputingCAI/safety-for-whom) (Hugging Face)
- [California Brown Pelican](https://simonwillison.net/2026/Sep/12/sighting-399708714/) (Simon Willison)
- [GPT-6 Astra, Looped Transformers, and Hidden Reasoning](https://magazine.sebastianraschka.com/p/gpt-6-astra-looped-transformers-and) (Sebastian Raschka)
- [Latest open artifacts (#24): Motif-3, GLM-5.3, Hy4-preview and open model licenses](https://www.interconnects.ai/p/latest-open-artifacts-24-motif-3) (Nathan Lambert)
- [Import AI 472: DeepMind's cheating math agents; populist AI policies; and Forethought theorizes a nightwatchman](https://importai.substack.com/p/import-ai-472-deepminds-cheating) (Jack Clark)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
