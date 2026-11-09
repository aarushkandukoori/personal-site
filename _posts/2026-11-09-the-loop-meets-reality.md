---
title: "The Loop Is Where Your Model Meets Reality"
date: 2026-11-09 05:45:07 -05:00
categories: [Writing, Research]
tags: [reinforcement-learning, simulation, evaluation, feedback-loops, ai-safety, agents, ai-research, weekly-reads, machine-learning]
math: true
image:
  path: /assets/img/previews/the-loop-meets-reality.png
  alt: "A toy cooking task in which each line is one time step, drawn from the offline replay to the closed-loop run."
  hide: true
---

The best vision-language model in a new benchmark finishes only 53.4% of everyday tasks within the time limit, and part of the reason is that it often talks too slowly to stop a person from making a mistake. That number comes from [Interactive Visual Gym](https://arxiv.org/abs/2611.08286v1), and the part that stuck with me is the framing more than the score. The authors argue that an assistant helping someone cook or tidy a room has to be evaluated in closed loop, because what the assistant says changes what the user does next. Replaying a recorded video and grading the assistant's commentary can't capture that.

Once I started reading the rest of this week's pieces with that lens, the same idea kept showing up. A model of behavior, whether it is a reward signal, a simulated user, a world simulator or even a browser heuristic, looks great in isolation. It only gets tested once it is wired into a loop with something that pushes back.

### Open loop versus closed loop

The Interactive Visual Gym team builds three simulators (cooking, household manipulation, mobile interfaces) plus a persona-conditioned simulated user who collaborates with the assistant while sometimes making controlled execution errors and going off plan. They package this as IVG-Bench, with 315 interaction scenarios. To check that their scoring means anything, they ran a human study and found 78.5% agreement between their interaction-quality metric and participant preferences. They also show the environment can train models: a proof-of-concept GRPO run on Qwen3.5-4B in the cooking environment improved both task success and interaction quality.

I think the closed-loop argument is clearly right. If the assistant says "add the salt now" one step too late, a replayed user still does the right thing because the recording already happened. A simulated user actually doesn't, and the error compounds. That is the whole point.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/the-loop-meets-reality/figure.svg' %}" alt="A toy cooking task in which each line is one time step, drawn from the offline replay to the closed-loop run. The two runs match for t1 and t2. After a bad hint at t3, the replayed user still follows the recording, but the simulated user goes off plan and never rejoins it." width="720" loading="lazy">
  <figcaption>A toy cooking task in which each line is one time step, drawn from the offline replay to the closed-loop run. The two runs match for t1 and t2. After a bad hint at t3, the replayed user still follows the recording, but the simulated user goes off plan and never rejoins it. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2611.08286v1">Interactive Visual Gym: Evaluating Visual Interaction Models with Simulated Users in Interactive Worlds</a>. Illustrates Interactive Visual Gym's argument that assistants must be evaluated in closed loop with a simulated user rather than by replaying recorded video. All steps are illustrative, not data from the paper.)</figcaption>
</figure>

But the closed loop here closes around a simulated human, and that is exactly where [Ben Recht's live blog on simulation](https://www.argmin.net/p/limits-to-simulated-growth) made me uneasy in a productive way.

### The allure of the knobs

Recht walks through Jay Forrester's 1971 case for running public policy through computer simulations. Forrester's models claimed that four well-intentioned programs, including low-cost housing and job training, were causing urban blight, and his global models fed into *The Limits to Growth*, which sold 12 million copies. Neither the doom nor the urban predictions played out. Recht's dry line is that "a dispassionate observer might say that his simulation matched his politics."

The sharpest point for me was about interactivity itself. Recht cites historian Kevin Baker, who argues that adding knobs and switches made simulations feel more trustworthy and real. Being able to play with a model builds confidence that has nothing to do with whether the model is correct.

Recht then draws a distinction I found really useful. Using LLM "silicon samples" inside a prediction loop is fine if you then validate the resulting system against real metrics like A/B tests. The trouble starts when good performance on those tasks convinces you the LLM is a realistic simulation of people.

So where does Interactive Visual Gym fall? Honestly, I think it sits closer to the safe side than I first expected. The 78.5% human agreement is an external check, and the GRPO result is framed as a learning signal, not a claim about how humans behave. What I would want to see is whether gains measured against the simulated user transfer to real users doing real cooking. A persona-conditioned simulator that makes "controlled" errors is still making the errors its designers imagined. Real people mess up in ways nobody wrote into a persona.

### Feedback that oscillates

Forrester's central insight, the one Recht credits him with, is that feedback effects are surprising and counterintuitive. Good intentions trigger downward spirals, and managers double down. That same dynamic shows up at a much smaller scale in [Frans, Rush, Levine, Abbeel and Nair's paper on targeted guidance](https://arxiv.org/abs/2611.05266v2).

Their problem: on-policy RL can't learn from a reward if the base model never stumbles onto the good behavior. Their fix is to use rich per-turn textual feedback (think a judge model with a rubric) through an on-policy self-distillation objective. What I liked is that the paper cares about stability, not just the final score. They find success by combining targeted self-distillation with a per-criteria RL reward, and by limiting feedback to turns where the policy specifically fails. They also study the design choices that keep entropy stable and reduce oscillatory behavior during training.

That phrase "limiting feedback to turns where the policy fails" reads to me like a control engineer's instinct. If you correct everything all the time, you overcorrect. Drag the slider below to feel why that matters.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/the-loop-meets-reality/explorer.html"
  title="The Feedback Loop Machine"
  sandbox="allow-scripts"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

The question I keep coming back to is how much of the oscillation comes from the judge itself. A rubric-based judge is also a model of what good behavior looks like. If it is miscalibrated on some criterion, the policy will chase that error, and self-distillation could amplify it. I would want to see the same setup with a deliberately noisy judge to see whether failing-turn-only feedback is also more robust to bad feedback, or only to too much of it.

### When reality runs the experiment

[Nathan Lambert's reflection on open models and cyber risk](https://www.interconnects.ai/p/was-i-wrong-about-open-models-and) is the same story at the scale of society. He frames the fear around open-weight models as a falsifiable prediction: that current open models would cause substantial, unprecedented harm by crippling cyber infrastructure. GLM-5.3, which he says crosses the capability threshold, has had its weights out for over a month, and he sees little public evidence that much has changed. His example from Epoch AI is a Firefox exploit built with GLM-5.3, and he notes that finding the exploit is only one step in a multi-stage attack.

What I respect is that he doesn't declare victory. Lambert writes, "I'm not a cyber expert, I'm working hard to make the most educated predictions I can," and admits he is nervous and that "fine" might be the wrong word. Both sides of that debate were running mental simulations of how attackers and defenders would respond. Now the real loop is running, with strained cyber first responders as part of the feedback, and the honest move is to update on it rather than defend the old model.

The smallest example of the week is my favorite. [Simon Willison noticed](https://simonwillison.net/2026/Nov/7/link-rel-next/) that Datasette's `rel="next"` link header made Firefox prefetch the next page of a table. Only a tiny fraction of visitors click "next," so everyone else downloads data they never see, and the server renders a page that gets thrown away. The Firefox issue has been open for 24 years, and one early comment links to his own 2002 post complaining about it, which he had completely forgotten. Prefetching is a baked-in model of user behavior ("they will probably click next"), and nobody closed the loop on whether it was true.

### What I am taking away

Every model of behavior is a bet, and the bet only gets graded inside a loop with something real. Simulators are great for generating ideas and training signal, as long as I keep asking what external check they answer to. And when the loop does close, feedback has its own dynamics: too much correction oscillates, and correcting only where you fail seems to be a recurring fix. If I were to try something next, it would be to take a simple RL setup and compare dense feedback against failure-only feedback while injecting noise into the feedback source, just to see which one breaks first.

### Sources

- [Stabilizing On-Policy Targeted Guidance in Agentic Reinforcement Learning](https://arxiv.org/abs/2611.05266v2) (Pieter Abbeel)
- [Limits to Simulated Growth](https://www.argmin.net/p/limits-to-simulated-growth) (Ben Recht)
- [Interactive Visual Gym: Evaluating Visual Interaction Models with Simulated Users in Interactive Worlds](https://arxiv.org/abs/2611.08286v1) (Ranjay Krishna)
- [Was I wrong about open models & cyber risks?](https://www.interconnects.ai/p/was-i-wrong-about-open-models-and) (Nathan Lambert)
- [datasette #3046: Don't serve link: rel=next HTTP headers to Firefox for HTML pages](https://simonwillison.net/2026/Nov/7/link-rel-next/) (Simon Willison)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
