---
title: "Spend the Model Where It Earns Its Keep"
date: 2026-10-05 05:45:06 -04:00
categories: [Writing, Research]
tags: [multimodal, robotics, llm-systems, optimization, benchmarks, ai-research, weekly-reads, machine-learning]
math: true
---

I spent most of Thursday night trying to make a tool-calling agent stop hallucinating column names, and my first three fixes were all the same fix wearing different hats: give the model more context, give it more examples, give it a bigger model. None of it worked particularly well. Then I read five papers this week that, without talking to each other, all said roughly the same thing back to me. The interesting design decision is not how much model you use. It is where you stop using it.

That sounds like a platitude until you look at how differently these groups drew that line.

### Calling the model exactly once

The cleanest version of the argument is [ANVIL](https://arxiv.org/abs/2609.19545v1), from Priyadarshan Patil, Abhishek Basu, Vikas Reddy, and Abhinav Gupta. The standard pipeline for natural-language-to-optimization uses an LLM at every stage, including the last one where a mathematical formulation becomes solver-ready code. ANVIL calls the language model a single time, to produce a LaTeX formulation, and then hands that off to an actual compiler: a normalizer, a recursive-descent parser, a typed intermediate representation, analysis passes that bind symbols to a dataset schema, and a code emitter. No model in the back half at all.

The numbers are good (92.9% of formulations compiled, 98.9% accuracy on easy NLP4LP problems, 91.1% on hard ones), but the number I keep thinking about is the median compile time, which was below the 10ms resolution of their timer. A deterministic translation step is not just more reliable, it is free. And the error analysis is the part I would put on a poster: almost every failure traced back to the formulation, not the translation. They moved all the uncertainty into one place where they could see it.

I am slightly suspicious of how much the "constraint guidance based on problem type" is doing here. That smells like a prior over the benchmark's problem distribution, and I would want to know how it holds up on a messy industrial problem that does not look like a textbook. But the architectural claim survives even if the benchmark is generous.

### The same move, with a solver on the other side

[Igor Sterner, Mirella Lapata, Alex Lascarides, and Frank Keller](https://arxiv.org/abs/2609.30121v1) make a structurally identical move for audio description, which is the narration that makes movies accessible to blind and visually impaired audiences. Most automatic AD systems treat this as local video-to-text: you are told what to describe and when, and you just write the sentence. That assumption is doing enormous work, and it is false. Real AD requires deciding what is narratively important, when it can be spoken without colliding with dialogue, and how to compress it to fit the gap.

So they let the LLM propose and ground visual elements, estimate salience, and generate compressed realizations, and then a mixed-integer linear program selects and schedules descriptions across the whole scene under temporal constraints. The LLM generates candidates. The MILP makes the globally coupled decision. Their ablations show the explicit temporal constraints drive the placement gains while salience estimation controls content retention, which is exactly the clean factorization you would hope for.

What I find honest about this paper is that the improvements show up on temporal and narrative measures and not on n-gram overlap, and the authors say so plainly. A system that gets better at the thing that matters while looking flat on BLEU is a system whose metric was lying to you before. They also note a significant gap to professional describers remains, which I believe.

### Moving the sensor instead of the compute

[EyeRobot 2.0](https://arxiv.org/abs/2610.03710v1), from Kush Hari, Justin Kerr, and collaborators including Jitendra Malik, Ken Goldberg, and Angjoo Kanazawa, draws the line somewhere else entirely, and it is my favorite paper of the week. The problem: drop the wrist cameras from a bimanual manipulation policy and real-world success falls from 52% to 27%. The obvious fix is more cameras or more tokens. Their fix is to swivel two stereo eyes so they physically fixate on a 3D point, then process the resulting images foveally by allocating more visual tokens to the center.

They recover almost all of the gap with stereo alone, beating passive stereo by 40% in real trials, matching ego-plus-wrist policies when the wrist view is clear (69% versus 64%), and more than doubling them when the grasped object occludes the wrist camera (48% versus 22%). The detail I keep coming back to is canonicalizing gripper information into a fixation-relative SE(3) frame. Once you know where you are looking, the action distribution you have to learn gets dramatically smaller. That is not a bigger model. That is a better coordinate system.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/spend-the-model-where-it-earns-its-keep/figure.svg' %}" alt="An attention heatmap over a 10x10 image grid under foveal token allocation. Notice that the bright band is narrow and centered: almost all of the attention mass sits in a few central patches, and the periphery is nearly dark. That is the whole bet of active gaze, which is that you would rather aim a small budget than spread a large one." width="720" loading="lazy">
  <figcaption>An attention heatmap over a 10x10 image grid under foveal token allocation. Notice that the bright band is narrow and centered: almost all of the attention mass sits in a few central patches, and the periphery is nearly dark. That is the whole bet of active gaze, which is that you would rather aim a small budget than spread a large one. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2610.03710v1">EyeRobot 2.0: Active Gaze for Precise Manipulation without Wrist Cameras</a>. EyeRobot 2.0 allocates more visual tokens to the image center and swivels the cameras so the fixation point lands there.)</figcaption>
</figure>

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/spend-the-model-where-it-earns-its-keep/explorer.html"
  title="Where the gaze spends its tokens"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Where the line is still blurry

[PixelUMM](https://arxiv.org/abs/2609.38597v1), from Cong Wei, Xuanchi Ren, Sanja Fidler, Wenhu Chen, and coauthors, pushes in the opposite direction, and I think that is the week's real tension. They remove the visual encoder entirely and run unified understanding and generation directly in pixel space, with images as spatial patches, videos as spatiotemporal tubelets, and single-layer linear projections connecting raw pixels to a shared Mixture-of-Transformers backbone. Fewer hand-built parts, more learned.

So is the lesson "add structure" or "remove structure"? Neither. The lesson is that the hand-built parts should be the ones you can specify exactly. A compiler and a MILP and a camera gimbal are all things we can write down. A visual encoder's inductive bias is a guess we inherited. PixelUMM throws out a guess; ANVIL keeps a certainty.

And then there is the benchmark from [Noah Schroeder, Yessy Eka Ambarwati, Yuji Zhang, and ChengXiang Zhai](https://arxiv.org/abs/2609.32020v1), which evaluated nine open-weight models on NGSS-aligned middle and high school science and found that model size did not consistently predict performance, with several small locally deployable models doing well. Their human reviewers also found the synthetically generated items were not perfectly aligned to the standards, which is a quietly devastating caveat to report about your own work and the reason I trust the rest of it.

### What I am taking away

My agent problem was never a model problem. I was asking a sampler to be a type checker. The fix I am going to try this week is embarrassingly close to ANVIL: have the model emit a declarative spec once, validate it against the schema deterministically, and refuse to let a token anywhere near the final query. If that works, the next thing I want to try is the EyeRobot trick on a project where I have been throwing resolution at a problem that was really a framing problem.

> **Key Point:**
> Learn the parts you cannot specify. Compile the parts you can.

### Sources

- [PixelUMM: Encoder-Free Unified Image and Video Understanding and Generation](https://arxiv.org/abs/2609.38597v1) (Sanja Fidler)
- [EyeRobot 2.0: Active Gaze for Precise Manipulation without Wrist Cameras](https://arxiv.org/abs/2610.03710v1) (Jitendra Malik)
- [Where the LLM Ends and Reliable Decisions Begin](https://arxiv.org/abs/2609.19545v1) (Abhinav Gupta)
- [What, When, and How: Audio Description as Constrained Global Optimization](https://arxiv.org/abs/2609.30121v1) (Mirella Lapata)
- [A Benchmark for LLM's Understanding of Middle School and High School Science Topics](https://arxiv.org/abs/2609.32020v1) (ChengXiang Zhai)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
