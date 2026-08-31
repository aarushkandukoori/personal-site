---
title: "What Did the Decider Know, and When Did It Know It?"
date: 2026-08-31 05:45:03 -04:00
categories: [Writing, Research]
tags: [agent-security, evaluation, routing, video-generation, forecasting, ai-research, weekly-reads, machine-learning]
math: true
---

I spent an embarrassing amount of time this week staring at one sentence from a security writeup, and I think it accidentally explains four other things I read.

The sentence is Simon Willison's, describing [an attack Johann Rehberger found against Claude Code's Auto Mode](https://simonwillison.net/2026/Aug/27/breaking-claude-code-opus-5-auto-mode/). The agent is tricked into unzipping an archive and running code that imports `base64`, which quietly pulls in a malicious `struct.py` sitting in the extracted directory. What got me is not the cleverness of the payload. It is what happened next: in some runs, Claude noticed it had been compromised and tried to kill the malware process, and the safety classifier blocked the cleanup command. The guardrail permitted the thing that created the danger and then forbade the thing that would have ended it.

That is not a story about a bad classifier. It is a story about a classifier being asked to judge `python -c "import base64"` without knowing what is on the filesystem. Willison notes the update that this is not really prompt injection at all, since no attacker text is ever followed as an instruction. It is what a commenter called a confused environment attack. The decision was made with the wrong information set.

### The same phrase, in a video paper

"Information set" is not my phrase. I lifted it from [Context-Matched Distillation](https://arxiv.org/abs/2608.13391v1), which is ostensibly about making autoregressive video generation fast enough to be interactive. The setup is that few-step students get distilled from bidirectional teachers, and a bidirectional teacher scores a complete clip. So the teacher's gradient signal for frame twelve can depend on frames thirteen through twenty, plus camera controls, that the causal student did not have when it generated frame twelve. The student is being graded on an exam it could not have studied for.

CMD's fix is to make the teacher causal too, and then go further: Prefix Scoring evaluates each target under the actual student-generated prefix that produced it, not under some clean ground-truth history. I find this genuinely satisfying in a way that most distillation tricks are not. It is the same failure as the Auto Mode classifier, just with the sign flipped. There the judge had too little context. Here the judge had too much, context from the future, and that leaked into supervision that the student could never act on. Both are misalignments of who-knew-what-when.

> **Key Point:**
> A supervisor's information set has to match the actor's. Extra information is not free; it produces a signal the actor cannot follow. Missing information is not free either; it produces a verdict nobody should trust.

### When more information is worth buying

The piece that makes this into a real research question rather than a slogan is [Pandora's AI Model Routing Box](https://arxiv.org/abs/2608.20316v2). Routing a query to the right specialist model requires estimating each specialist's expected return, and that estimate is itself a purchase. A cheap embedding predictor is noisy. A fine-tuned estimator with access to retrieval results or a partial reasoning trace is accurate and expensive. So the authors formalize routing as Pandora's Box, the classic optimal-search-with-costly-inspection problem, and under a Gaussian signal model they get closed-form value-of-information expressions. For this specialist, on this input, is refining the estimate worth what it costs?

The headline result is the one you would hope for: Pandora's Router matches exhaustive estimation while calling the expensive estimator far less. The result I keep chewing on is the decentralized one. When specialists bid on queries and decide for themselves whether to invest in self-assessment, value-of-information reasoning helps allocative efficiency only when the competing estimates are accurate. When rivals are noisy, the strategic specialist uses its better information to extract utility from everyone else. Knowing more than the mechanism assumes you know is an exploit, not a feature. I would like to poke at this in a mechanism design or market design seminar, because it smells like a general result about information asymmetry that the ML routing framing is rediscovering.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/information-sets-and-costly-judgment/explorer.html"
  title="Where do you put the block threshold?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/information-sets-and-costly-judgment/figure.svg' %}" alt="Notice that no single point on this curve is safe: pushing recall up to catch the malicious command also blocks benign ones, and the Auto Mode failure Rehberger found lives on both ends of the same curve at once (it permitted the process that launched the malware, then denied the command meant to kill it)." width="720" loading="lazy">
  <figcaption>Notice that no single point on this curve is safe: pushing recall up to catch the malicious command also blocks benign ones, and the Auto Mode failure Rehberger found lives on both ends of the same curve at once (it permitted the process that launched the malware, then denied the command meant to kill it). (Figure generated for this post, inspired by <a href="https://simonwillison.net/2026/Aug/27/breaking-claude-code-opus-5-auto-mode/">Breaking Claude Code Opus 5 Auto Mode</a>. Simon Willison's writeup of Johann Rehberger's Claude Code Auto Mode attack, where the classifier both allowed the compromise and blocked the cleanup.)</figcaption>
</figure>

### The benchmark only sees what it recorded

Which brings me to the piece I liked best this week, the Hugging Face and Voice Arena writeup on [adding Hindi and Indian English to the Open ASR Leaderboard](https://huggingface.co/blog/open-asr-leaderboard-global-south). It opens with a line I want to tape to a wall: benchmarks decide what gets built. A lot of careful work has gone into making WER harder to game, with private held-out splits and benchmark-fitting analysis and better normalisers. And it is still one number, and prior work has shown ASR error is not distributed evenly across speakers.

The authors are blunt that the leaderboard is not hiding this. The test sets simply record what was said and almost nothing about who said it. So Monsoon was built to vary along nine axes (geography, age, gender, vocabulary, devices, acoustic environment, speech type, speech rate, and whether multiple transcripts are valid) with 4,888 speakers across hundreds of districts using their own handsets. It is small in hours and large in speakers, which is exactly backwards from how datasets usually get built, and exactly right for exposing failure modes. The Hindi lattice references are my favorite detail: no normaliser can collapse Hindi orthographic variation because it is not a fixed mapping, so the reference itself ships a set of accepted spellings. That is a case where the honest answer was to change the shape of the label rather than the shape of the metric.

### Why we want the number anyway

Ben Recht's [fall semester announcement](https://www.argmin.net/p/fall-semester-announcements) is the odd one out and also the frame. He is teaching a grad seminar on forecasting, and the pitch is that he cares more about why people forecast than how. Weather reports and apocalypse predictions are both forecasts, with wildly different evidence and wildly different costs of being wrong. His jab lands: uncertainty becomes certain once we turn it into an interval, right?

That is the thread. A WER, a router's value estimate, a distillation loss, a classifier's allow-or-block are all devices for converting an uncomfortable amount of not-knowing into a single actionable number. The conversion is what makes the system work, and the conversion is where the information gets destroyed. Rehberger's answer is the unglamorous one and probably the correct one: run agents in a container, restrict egress, do not hand them your SSH keys. Do not ask a scalar to know what it cannot see.

### What I am taking away

I want to build the habit of asking, of any evaluation I write this semester, what it records about the situation and not just about the outcome. My concrete next step is small: on a project where I have been reporting a single aggregate accuracy, I am going to log per-example metadata I currently throw away and check whether the average is hiding a population. I suspect it is. The Monsoon post makes me think that is usually the safe bet.

### Sources

- [Breaking Claude Code Opus 5 Auto Mode](https://simonwillison.net/2026/Aug/27/breaking-claude-code-opus-5-auto-mode/) (Simon Willison)
- [The Open ASR Leaderboard Adds Its First Global South Language](https://huggingface.co/blog/open-asr-leaderboard-global-south) (Hugging Face)
- [Pandora's AI Model Routing Box: Efficient Allocation with Costly Value Estimation](https://arxiv.org/abs/2608.20316v2) (Mirella Lapata)
- [Fall Semester Announcements](https://www.argmin.net/p/fall-semester-announcements) (Ben Recht)
- [Context-Matched Distillation: Teacher Causality for Autoregressive Video Distillation](https://arxiv.org/abs/2608.13391v1) (Sanja Fidler)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
