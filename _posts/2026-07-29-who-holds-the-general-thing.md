---
title: "The Specialty Keeps Losing, So Who Gets To Hold the General Thing?"
date: 2026-07-29 19:57:03 -04:00
categories: [Writing, Research]
tags: [open-weights, scaling, robotics, world-models, ai-policy, ai-research, weekly-reads, machine-learning]
math: true
---

I spent most of Tuesday trying to convince a small manipulation policy to pick up a mug it had not seen before. By evening I had a longer dataloader, three augmentation tricks, and basically nothing to show for it. Then I read that Claude Opus 4.7, with no robotics-specific training, autonomously finished all but one task in a quadruped suite in nine minutes and thirty five seconds, work that last August took humans assisted by a weaker model 181 minutes ([Import AI 466](https://importai.substack.com/p/import-ai-466-the-bitter-lesson-for)). Anthropic's own framing is the part that stung: this was not the result of a concerted robotics effort, it fell out of general scaling. That is the week's real story. The specialty keeps getting absorbed by the general thing, and the question that is actually still open is who gets to hold the general thing.

### The bitter lesson keeps sending postcards

The MirrorCode results in that same issue are the cleanest version of this. Epoch and METR built a benchmark where a model gets only command line access to a target program, no source and no web, and has to reimplement it from scratch. Opus 4.7 rebuilt pkl. Both Opus 4.7 and GPT-5.5 rebuilt gotree in several different languages. Models from a year ago would have scored around 30 percent and topped out at calendar utilities.

What I keep coming back to is Clark's reading rather than the score. He argues the interesting capability is self-orientation: the model is dropped next to an alien artifact, pokes it through a keyhole, and induces a structure for the whole thing. That is not translation, it is specification recovery. And the failures are specific in a way I find genuinely informative. Eight of twenty five targets were never solved to 100 percent, and the worst were ruff, a math package, and an email authentication library. Those are exactly the domains where the spec is dense, adversarial, and full of conventions nobody wrote down. Long horizon is apparently easier than deeply conventional. I did not expect that ordering.

My doubt is narrow but real: MirrorCode has a checkable oracle, and "reproduce observable behavior" is a task shape that rewards exactly this kind of black box probing. I would not generalize the slope to work where success is contested.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/who-holds-the-general-thing/figure.svg' %}" alt="Notice how fast the cost of finishing a long-horizon programming task is falling, and notice that the curve is steepest exactly where the tasks stop being toys. A year ago these systems were writing calendar utilities; the recent point on this curve is a 14 hour run costing about $251 on work Epoch and METR estimate would take a human between two and seventeen weeks. The absolute dollar figure matters less than the slope." width="720" loading="lazy">
  <figcaption>Notice how fast the cost of finishing a long-horizon programming task is falling, and notice that the curve is steepest exactly where the tasks stop being toys. A year ago these systems were writing calendar utilities; the recent point on this curve is a 14 hour run costing about $251 on work Epoch and METR estimate would take a human between two and seventeen weeks. The absolute dollar figure matters less than the slope. (Figure generated for this post, inspired by <a href="https://importai.substack.com/p/import-ai-466-the-bitter-lesson-for">Import AI 466: The bitter lesson for robotics, AIs complete week-long programming tasks; and OpenAI's accidental AI hacker</a>. Cost and time figures come from Jack Clark's writeup of the Epoch and METR MirrorCode benchmark in Import AI 466.)</figcaption>
</figure>

### Actions as pixels

The paper I enjoyed most this week is [Masked Visual Actions](https://arxiv.org/abs/2607.19343v1), and it is the same lesson pointed at world models. Video models already carry priors about contact, momentum, and how objects respond to being shoved. The usual move is to bolt an action encoder onto the side, which means talking to the model in a language it never learned. Instead the authors express action as a partially revealed trajectory drawn in pixel space. Reveal the robot's motion and the model behaves as a forward dynamics model. Reveal the object's desired motion and the same checkpoint runs backward and synthesizes robot behavior that would produce it.

One interface, two directions, and only fifteen hours of masked finetuning examples. The elegance here is that masking is not a trick, it is a way of asking a question. Which parts you hide determines which conditional you get. I would love to know how far that goes: can you mask a third entity and get something like intention inference for free?

My hesitation is the evaluation claim. Imagined rollouts whose outcomes "correlate with real-world execution" is enough to rank candidate futures, and ranking is a genuinely useful thing to be able to do. It is not the same as calibration, and I would want to see where the ranking inverts before I trusted it as a policy evaluator.

### The part that is not a technical problem

So capability is diffusing and generalizing. Then Moonshot released Kimi K3, a 2.8 trillion parameter mixture of experts model sitting at number two on the Vals AI index, number three on Artificial Analysis, and number one on Frontend Code Arena, with weights promised. Nathan Lambert's read in [Kimi K3: The open-weights escalation](https://www.interconnects.ai/p/kimi-k3-the-open-weights-escalation) is that the gap between open and frontier has compressed from something like six to nine months down to maybe three to five, and that the distillation panic was mostly a story people told themselves. Chinese labs are solving the same problems in the same way, with much less compute and, he suggests, a culture you can feel in the room. The same week, Xi committed China's ecosystem to open weights at WAIC.

Ben Recht's [Open and Shut](https://www.argmin.net/p/open-and-shut) is the useful counterweight, because it refuses to let "open" stay a slogan. Olmo publishes its corpus, which is admirable, and yet FineMath 3 was annotated with Llama, some math data was generated with Qwen, and some reasoning traces came from GPT-4. Openness turns out to be a gradient with closed models smeared through the supply chain. His sharpest point is the legal one: scan a book you bought and it is fair use, buy the same text as an ebook and you have violated a license. That distinction is incoherent and it is currently load-bearing.

I agree with Recht that the burden of proof has flipped, and that Dario Amodei's position (ban industrial scale distillation, but not open weights) is hard to hold together, since distillation is not a cleanly defined action you can legislate around. Where I part ways is the Aaron Swartz comparison. I understand why he reaches for it, and the asymmetry between hunted librarians and settlement-paying labs is real, but casting this as a question of who belongs in jail flattens a disagreement about risk into a morality play, and I do not think that helps anyone actually set the dial.

Because the dial is the thing. Any release policy is a classifier with a threshold, and every threshold buys one kind of mistake to avoid the other.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/who-holds-the-general-thing/explorer.html"
  title="Where would you set the release gate?"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

Drag the slider below and watch the two error types trade off. Push the gate strict and you block benign open releases along with the dangerous ones, which is the world Recht is angry about. Push it loose and you ship things you cannot recall. Nobody in this debate is choosing between safety and openness. They are choosing which mistake they can live with, and mostly declining to say so.

### What I am taking away

Simon Willison quoted [D. Richard Hipp](https://simonwillison.net/2026/Jul/29/d-richard-hipp/#atom-everything) this week on how SQL did not eliminate programmers, it eliminated a job title. I mostly buy the analogy, with one asymmetry that bothers me: SQL was a specification a human could read and audit. "Reimplement ruff from CLI access" is not. The abstraction layer got higher and also got opaque, and I do not think we have the review practices for that yet.

What I want to try next: rebuild my mug-picking setup as a masked-prediction eval instead of a policy, and see whether ranking imagined futures beats my hand-tuned tricks. And if K3's weights really land, I want to know what a student with a modest GPU budget can now do that was impossible in June. That is the concrete version of the openness argument, and it is the one I can actually run.

### Sources

- [Kimi K3: The open-weights escalation](https://www.interconnects.ai/p/kimi-k3-the-open-weights-escalation) (Nathan Lambert)
- [Quoting D. Richard Hipp](https://simonwillison.net/2026/Jul/29/d-richard-hipp/#atom-everything) (Simon Willison)
- [Import AI 466: The bitter lesson for robotics, AIs complete week-long programming tasks; and OpenAI's accidental AI hacker](https://importai.substack.com/p/import-ai-466-the-bitter-lesson-for) (Jack Clark)
- [Masked Visual Actions for Unified World Modeling](https://arxiv.org/abs/2607.19343v1) (Jiajun Wu)
- [Open and Shut](https://www.argmin.net/p/open-and-shut) (Ben Recht)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
