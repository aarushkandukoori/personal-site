---
title: "The Student Beats the Teacher: Where Supervision Actually Hides"
date: 2026-10-26 05:45:01 -04:00
categories: [Writing, Research]
tags: [self-supervised learning, reinforcement learning, world models, forecasting, robotics, ai-research, weekly-reads, machine-learning]
math: true
---

A model trained only on short-window velocity changes ends up predicting velocity more accurately than the teacher that supervised it. That is the claim in [SSIO: Self-Supervised Inertial Odometry](https://arxiv.org/abs/2610.25988v2), and I have not stopped thinking about it. The teacher is deliberately dumb. It just integrates the IMU over each short window independently, with no memory of what came before. The student learns from those myopic targets and somehow comes out ahead.

This week, several papers seemed to be asking the same question from different directions: where is the supervision actually hiding? We usually assume the label is the expensive thing you go out and collect. These papers keep finding signal in places we normally throw away.

### A dumb teacher, a smart student

The SSIO recipe has two stages. First comes what the authors call integration self-supervision, where the myopic teacher provides short-window targets. Then pose graph distillation refines the model with sequence-consistent targets from a pose graph built over many windows. The practical payoff is big: training on a new platform no longer needs ground-truth trajectories, just a calibrated IMU and data recorded during normal operation. Across six datasets covering pedestrians, drones, quadrupeds, and a humanoid, the label-free models come within 0.07 m/s average velocity error of a supervised baseline with the same architecture.

Why would a student beat its teacher? My guess (and it is only a guess, the abstract does not explain the mechanism) is that the teacher's errors are noisy and window-specific, while the student shares parameters across every window it sees. A network that has to explain thousands of noisy short integrations at once is pushed toward the structure they have in common, and that common structure is closer to the true velocity than any single integration. It is the same intuition behind averaging many noisy measurements to get a better estimate.

Drag the slider below to see how the teacher's error behaves as its window gets longer, and why many short windows might be easier to learn from than one long one.

<iframe
  class="interactive-embed"
  src="/assets/files/weekly/where-supervision-hides/explorer.html"
  title="Many Myopic Teachers, One Steady Student"
  sandbox="allow-scripts"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### Every action is a label

[Generative Value Classifier](https://arxiv.org/abs/2610.22497v1), from Alexander Swerdlow, Perry Dong, and Chelsea Finn, finds a different kind of hidden supervision. Q-learning normally learns a value function by regressing on scalar or distributional return targets. The authors point out that this discriminative setup ignores a source of signal sitting right there in the data: the actions.

So they flip the question. Instead of asking what the return of a state-action pair is, they ask how likely the action is under each possible return. The generative piece of this critic is a return-conditioned policy, which can share the actor's architecture, and a squared-error loss keeps the Q-value anchored to the bootstrapped target. The result is a critic supervised by every action, not just by returns. They report gains over leading discriminative methods, including distributional RL, in both offline and online settings.

<figure class="ml-figure" markdown="0">
  <img src="{% include asset-url.html path='/assets/img/weekly/where-supervision-hides/figure.svg' %}" alt="The top row is the usual discriminative critic: the state-action pair goes in, one return number comes out, and only the return supervises it. The bottom row is the generative critic, which asks how likely the logged action is under each possible return (toy bars), so the action itself becomes a label." width="720" loading="lazy">
  <figcaption>The top row is the usual discriminative critic: the state-action pair goes in, one return number comes out, and only the return supervises it. The bottom row is the generative critic, which asks how likely the logged action is under each possible return (toy bars), so the action itself becomes a label. (Figure generated for this post, inspired by <a href="https://arxiv.org/abs/2610.22497v1">Generative Value Classifier</a>. Illustrative schematic of the discriminative vs generative critic contrast described in Swerdlow, Dong and Finn's Generative Value Classifier; the bars are a toy, not results.)</figcaption>
</figure>

This reminds me of the generative versus discriminative classifier story from intro ML, where you model p(x | y) instead of p(y | x). The usual lesson there is that generative models can be more data-efficient but pay for it when their assumptions are wrong. I would want to know whether the same tradeoff shows up here. If the logged actions come from a messy mix of behavior policies, does conditioning on them help the critic or confuse it? The abstract does not say, and that is the first thing I would look for in the full paper.

### One model, different amounts of evidence

[LidarVerse](https://arxiv.org/abs/2610.19201v1) makes a related move in sensor simulation. LiDAR simulators have mostly split into two camps. Reconstruction methods keep a captured scene's geometry but need long per-scene optimization. Generative methods share learning across data but fall apart over long rollouts. LidarVerse puts both into one conditional generative model. Depending on what evidence you give it (a LiDAR prefix, an HD map, a persistent spatial cache, optionally text), the same model acts as a world generator, a point-cloud forecaster, or a resimulator of scenes it has observed. A four-step causal student distilled from a bidirectional teacher runs at 11 FPS on a single H100, and the tokenizer handles 32-, 64-, and 128-beam sensors.

What I like is the framing: the task is defined by how much evidence you condition on, not by the architecture. Reconstruction is just generation with lots of evidence.

That connects to a benchmark in [Jack Clark's Import AI 476](https://importai.substack.com/p/import-ai-476-creativity-and-rsi). Humanity's Sixth Sense tests whether models can reason about what a scene implies but does not show, like whether a bookcase can fit more books. Humans score 93.1 pass@1. The best model, GPT 6 Astra, scores 53.6. Clark reads this partly as evidence against the claim that visual reasoning needs explicit 2D and 3D world models, since LLMs do as well as they do without one. I am not sure I buy that yet. A 40-point gap to humans looks to me like it could support either side of the argument, and the most common failure the authors report (missing a detail that decides the answer, 21% of failures) sounds exactly like what a persistent spatial model would help with.

### Recht's objection

This is where [Ben Recht's post on Breiman's Two Cultures](https://www.argmin.net/p/predictive-models-are-never-clean) bites. Recht agrees with Breiman that algorithmic models won on prediction. But he pushes on the inversion we now accept: if a model predicts well, we assume it understands. He writes that reading a model's weights is "like trying to understand a book by looking at the bits in its zip file," and that "in a wholly data-driven world, better understanding can only come from getting new data." His point is that forecasting is passive. To actually rule out explanations, you have to act. You have to experiment.

I think that is the honest limit on everything above. SSIO, the generative critic, and LidarVerse are all clever ways to squeeze more supervision out of data we already have. That is valuable, and I am genuinely excited about it. But squeezing harder is not intervening. The RL paper is the interesting exception, since RL agents do act, and the actions are literally what the critic learns from. Maybe that is part of why the reverse question works: the data already records someone's interventions.

### What I am taking away

The pattern I keep coming back to is that the label is rarely the only signal. Actions, physics, and partial observations all carry structure, and a well-designed objective can pull it out. A weak teacher can produce a strong student if the student has to explain many of the teacher's mistakes at once.

Recht keeps me honest about what that buys you, though. Better prediction from cheaper data is a real win. It is not the same as understanding why. Next, I want to work through the SSIO setup on a toy 1D problem, simulating a noisy accelerometer, to see whether a student really can beat its integration teacher and under what noise levels it stops working.

### Sources

- [Import AI 476: Creativity and RSI; worse-than-China open weight models; AI goes to space](https://importai.substack.com/p/import-ai-476-creativity-and-rsi) (Jack Clark)
- [Generative Value Classifier](https://arxiv.org/abs/2610.22497v1) (Chelsea Finn)
- [Predictive Models Are Never Clean](https://www.argmin.net/p/predictive-models-are-never-clean) (Ben Recht)
- [Into the LidarVerse: A Real-Time Unified LiDAR World Model Across Tasks and Sensors](https://arxiv.org/abs/2610.19201v1) (Sanja Fidler)
- [SSIO: Self-Supervised Inertial Odometry](https://arxiv.org/abs/2610.25988v2) (Pieter Abbeel)

<script defer src="/assets/js/interactive-embed-resize.js"></script>
