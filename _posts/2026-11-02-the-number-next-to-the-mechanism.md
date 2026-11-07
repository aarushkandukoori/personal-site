---
title: "The Number Next to the Mechanism"
date: 2026-11-02 12:00:15 -05:00
categories: [Writing, Research]
tags: [diffusion-models, ai-security, open-weights, evaluation, ai-progress, ai-research, weekly-reads, machine-learning]
math: true
---

A 42.3% gain in tokens per forward pass turns into a 16.3% gain in throughput. That gap comes from [One Block Ahead](https://arxiv.org/abs/2610.19510v1), a decoding method for diffusion language models, and I keep coming back to it because it is the cleanest example of a pattern running through all five pieces here. The number closest to the mechanism is the easiest one to move, and it can drift a long way from the outcome you wanted.

### The bill for the second block

Block-diffusion models denoise a whole block of token positions in parallel, but the blocks themselves still go in strict sequence. One Block Ahead denoises the next block alongside the current one, with no extra training. The subtle part is that in uniform-state models, a block's intermediate tokens do not show how far along it is, so the next block's tokens have to be promoted together with their sampler state, including the self-conditioning signal and the denoising time. On DiffusionGemma, tokens per pass go from 15.64 to 22.25, averaged over ten benchmarks, with a small accuracy regression.

Here is my back-of-envelope version. If throughput is roughly tokens per pass divided by cost per pass, then 1.423 / 1.163 implies a paired pass costs about 22% more than a single one. That is my arithmetic on averaged numbers, and the abstract does not report it. The authors derive their own break-even criterion, which is the part I respect most: they tell you when the trick stops paying. Drag the slider below to raise the cost of a paired pass and find the point where that 42.3% stops being worth anything.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/the-number-next-to-the-mechanism/explorer.html"
  title="What the Second Block Costs"
  sandbox="allow-scripts"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Teaching a model to copy

[Copying As Defense](https://arxiv.org/abs/2610.35566v1) has my favorite idea of the group, because it starts from a metric that was going in the right direction while the outcome stayed bad. Image editors built on diffusion transformers can turn one photo into a convincing manipulation, including non-consensual edits. Existing defenses add an imperceptible perturbation that makes the output attend less to the protected image. The authors point out what that leaves open: the model can still follow the instruction using the text and its own generated tokens, often producing a new, weakly grounded image.

So they flip it. Copying-as-Defense maximizes attention from target tokens to the reference image in a few early blocks. Attention rows are normalized, so more mass on the reference means less for the text and the generated canvas. What surprised me is how little it takes: concentrating attention in only a few early blocks is enough to collapse the editing behavior, and the model reproduces its input, often as a lossy copy. Average edit success drops from 81.4% to 24.0%, against 43.0% for DeContext, the strongest baseline.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/the-number-next-to-the-mechanism/figure.svg' %}" alt="Each row of 20 chips is one attention row with a fixed budget, in illustrative proportions. Older defenses push mass off the reference, so text and canvas can still drive an edit, while Copying-as-Defense pulls mass onto the reference and squeezes the other two, so the model tends to reproduce its input." width="720" loading="lazy">
  <figcaption>Each row of 20 chips is one attention row with a fixed budget, in illustrative proportions. Older defenses push mass off the reference, so text and canvas can still drive an edit, while Copying-as-Defense pulls mass onto the reference and squeezes the other two, so the model tends to reproduce its input. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2610.35566v1">Copying As Defense: Protecting Images from Editing By Eliciting Model Copying</a>. Schematic of the attention-row argument in Copying As Defense; chip counts are illustrative, not results from the paper.)</figcaption>
</figure>

I like that the objective is aimed at what the attacker wants, which is a working edit. My doubts start with that 24.0%. It is an average, so I would want to see the worst editor and the worst kind of edit, since one convincing fake is all an attacker needs. I would also want to know how the perturbation holds up when an image gets compressed or resized on its way across the internet, and when the attacker knows the defense exists. The abstract does not settle those questions, and they decide whether this protects anyone in practice. I want to try that test as a plan: take a protected image, re-encode it a few times, and see at what point the edit comes back.

### A sandbox made of reasonable parts

Simon Willison's [write-up of the ChatGPT account takeover](https://simonwillison.net/2026/Oct/31/how-we-took-over-chatgpt-accounts/) found by Parameter Labs is the same lesson with higher stakes. HTML previews ran in a sandboxed iframe. Inline scripts were blocked by a content security policy. On a checklist, both boxes get ticked.

Then the chain: MathLive, a library used for graph support, has a virtual keyboard that accepts postMessage calls and uses innerHTML. That let untrusted code insert an iframe without sandbox restrictions. YouTube was on the allowlist for script loading, and its oEmbed endpoint could reflect JavaScript back in a way that executed. From there, private data could leave through an image reference, all triggered by a signed-in user visiting a share URL. Willison thinks the $5,000 bounty "was a bit cheap for a vulnerability this serious," and I agree. What sticks with me is that the dangerous piece was a math keyboard. Nobody would describe a math keyboard as a security boundary, and it acted as one anyway.

### Two numbers that flatter

[Mistral Large 4](https://huggingface.co/blog/mistral-large4) scores 82% on a test that asks a model to reproduce a real vulnerability in open-source software and then patch it. According to the Hugging Face post, Mistral reports that several closed frontier models score near zero because they refuse. So that gap measures willingness at least as much as skill, and I would not read it as a pure capability ranking. The post makes a good case that defenders have to reproduce a bug to fix it, and that an API can cut you off mid-incident.

The same post says the model has a higher average refusal rate on cyber prompts than any other open-weight model. I doubt that number means as much here as it does for a closed API, because the post also celebrates that open weights put the usage policy and deployment under the user's control, and it walks through fine-tuning. A refusal rate describes the default configuration. It says little about what the weights can do after someone changes them.

Then there is [Jack Clark's IMF speech](https://importai.substack.com/p/import-ai-477-in-which-i-tell-the), which argues we have entered the singularity. Clark's most concrete evidence in the opening is about Anthropic, where, he says, "our researchers now produce almost 10 times the amount of code than they did for the first four years of the company's life." He also flags that new capabilities bring new challenges, and he is open about being a participant as well as a narrator, which I appreciate.

I take the speech seriously, and I also think code volume is tokens per forward pass at the scale of a company. His own framing is falling research productivity: ideas getting harder to find. Code is an input to that. So the question I want answered is how much of a tenfold code increase survives as discoveries, reliable products, and fewer holes like the MathLive one. Maybe a lot. But I would want to see that conversion rate measured before I accepted the word singularity from an output count.

### What I am taking away

The best idea I found this week is buried in the Mistral post: reproduce-then-patch tasks have a verifiable reward. The exploit reproduces or it does not, and the patch holds or it does not. That is about as close as a metric can get to the outcome. When I read the next headline number, I want to ask what sits between it and the thing I care about, and what the conversion rate is. Sometimes that rate is 42 to 16. For the biggest claims in AI right now, I do not think anyone has shown me the second number yet.

### Sources

- [Copying As Defense: Protecting Images from Editing By Eliciting Model Copying](https://arxiv.org/abs/2610.35566v1) (Olga Russakovsky)
- [How We Took Over ChatGPT Accounts](https://simonwillison.net/2026/Oct/31/how-we-took-over-chatgpt-accounts/) (Simon Willison)
- [Welcome Le Chonk: Mistral Large 4 on Hugging Face](https://huggingface.co/blog/mistral-large4) (Hugging Face)
- [Import AI 477: In which I tell the IMF the Singularity has begun](https://importai.substack.com/p/import-ai-477-in-which-i-tell-the) (Jack Clark)
- [One Block Ahead: Promoting Sampler State in Diffusion Language Models](https://arxiv.org/abs/2610.19510v1) (Stefano Ermon)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
