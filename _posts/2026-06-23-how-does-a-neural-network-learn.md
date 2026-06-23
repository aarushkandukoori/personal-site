---
title: "So how does a neural network actually learn?"
date: 2026-06-23 05:15:00 -0400
categories: [Learning Interactively]
tags: [machine-learning, gradient-descent, neural-network, pytorch]
math: true
---

Recently I have been working through a massive PyTorch course (Daniel Bourke's "Learn PyTorch for Deep Learning in a Day"), and somewhere around hour six it hit me. I had written a training loop, watched the loss number tick down, and ended up with a model that made good predictions, all without ever stopping to ask the obvious question: what is the model *doing* when it "learns"?

We throw around phrases like "the network learns from the data" so casually that it starts to sound like magic. It is not magic. Almost all of modern machine learning, from a one-line regression to a giant language model, comes down to one beautifully simple idea called **gradient descent**. In this post I want to build it up from scratch, starting with intuition and ending with the exact PyTorch training loop from the video.

> Here are the key prerequisites:
>
> - Basic calculus: derivatives, partial derivatives, and the chain rule.
> - A rough idea of what a function is and what it means to minimize one.
> - Ideally you have seen linear regression (fitting a line to points), but it is not strictly required.

### A model is just a function with knobs

Let's start with the simplest "model" there is: a straight line.

$$\hat{y} = wx + b$$

Here $x$ is our input, $\hat{y}$ (read "y-hat") is the model's prediction, and $w$ and $b$ are two numbers we get to choose. We call $w$ and $b$ the **parameters** of the model. You can think of them as two knobs: $w$ controls the slope and $b$ slides the line up and down.

A neural network is the same idea, just with millions of knobs instead of two. So when we say a model "learns," what we really mean is this: it is searching for the knob settings that make its predictions as close to the truth as possible.

That raises a question we have to answer first. How do we even measure how close we are?

### Measuring wrongness: the loss function

Say we have a dataset of $n$ points $(x_i, y_i)$, where $y_i$ is the true answer. For each point the model predicts $\hat{y}_i = wx_i + b$, and it is off by some amount $\hat{y}_i - y_i$. We want a single number that captures how wrong the model is across the whole dataset.

The most common choice is the **mean squared error (MSE)**. We square each error (so positives and negatives do not cancel, and big misses are punished harder), then average:

> **Key Point:**
> $L(w, b) = \dfrac{1}{n} \sum_{i=1}^{n} \left(\hat{y}_i - y_i\right)^2 = \dfrac{1}{n} \sum_{i=1}^{n} \left(wx_i + b - y_i\right)^2.$

We call $L$ the **loss function**. Notice something important about it: the data $(x_i, y_i)$ is fixed, so $L$ is really a function of the knobs $w$ and $b$. Different knob settings give different amounts of total wrongness.

That means we can picture $L$ as a landscape. Imagine a 3D surface where the floor is every possible $(w, b)$ pair and the height above each point is the loss there. For MSE this surface is a smooth bowl, and the bottom of the bowl is the single best setting of our knobs.

> Try the interactive below. Drag the two sliders to change $w$ and $b$ and watch the loss value change. See if you can find the bottom of the bowl by hand.

<iframe
  class="interactive-embed interactive-embed--landscape"
  src="/assets/files/gradient-descent/loss_landscape.html"
  title="Loss landscape interactive"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

*The loss landscape: every point on the floor is a choice of knobs, height is how wrong that choice is.*

Doing this by hand works for two knobs. But a real network has millions, and you cannot eyeball a million-dimensional bowl. We need an automatic way to walk downhill.

### Rolling downhill: the gradient

Here is the key intuition. Imagine you are standing somewhere on that bowl, blindfolded, in heavy fog. You cannot see the bottom. But you *can* feel the slope under your feet. So what do you do? You feel which direction is steepest downhill, take a small step that way, and repeat. Eventually you reach the bottom.

The mathematical tool that "feels the slope" is the **gradient**. The gradient of $L$ is just the vector of its partial derivatives with respect to each knob:

$$\nabla L = \left( \frac{\partial L}{\partial w}, \; \frac{\partial L}{\partial b} \right).$$

The gradient has a crucial property: it points in the direction of steepest *increase* of $L$. We want to decrease the loss, so we step in the exact opposite direction, the negative gradient. That single observation is the whole engine.

> First time seeing the gradient like this? 3Blue1Brown's video "Gradient descent, how neural networks learn" gives a gorgeous visual for why it points uphill. Highly recommend watching it alongside this.

### Deriving the update rule

Let's actually compute those partial derivatives for our line. We need the slope of the loss with respect to each knob. This is a clean chain-rule exercise.

Start with $w$. The only place $w$ shows up is inside the squared term, so we use the chain rule (bring down the 2, then differentiate the inside with respect to $w$, which gives $x_i$):

$$
\begin{align*}
\frac{\partial L}{\partial w}
&= \frac{\partial}{\partial w} \left[ \frac{1}{n} \sum_{i=1}^{n} \left(wx_i + b - y_i\right)^2 \right] \\
&= \frac{1}{n} \sum_{i=1}^{n} 2\left(wx_i + b - y_i\right) \cdot x_i \\
&= \frac{2}{n} \sum_{i=1}^{n} \left(\hat{y}_i - y_i\right) x_i.
\end{align*}
$$

Now $b$. Same idea, except differentiating the inside with respect to $b$ just gives 1:

$$
\begin{align*}
\frac{\partial L}{\partial b}
&= \frac{1}{n} \sum_{i=1}^{n} 2\left(wx_i + b - y_i\right) \cdot 1 \\
&= \frac{2}{n} \sum_{i=1}^{n} \left(\hat{y}_i - y_i\right).
\end{align*}
$$

Take a second to read what these are saying. Each gradient is an average of the errors $(\hat{y}_i - y_i)$, and for $w$ each error is weighted by its input $x_i$. If the model is overshooting on average, the errors are positive, the gradient is positive, and we will nudge the knob down. That is exactly the behavior we wanted.

Now we just step downhill. We move each knob a little bit in the negative gradient direction, scaled by a small number $\eta$ (the Greek letter "eta") that controls step size:

> **Key Point:**
> $w \leftarrow w - \eta \, \dfrac{\partial L}{\partial w}, \qquad b \leftarrow b - \eta \, \dfrac{\partial L}{\partial b}.$

That arrow means "update the knob to this new value." We call $\eta$ the **learning rate**, and repeating this step over and over is **gradient descent**. That is the entire algorithm.

<details>
<summary><strong>Click here for a worked step by hand</strong></summary>

<br>

Let's do one real step with one data point so you can see the gears turn. Suppose our single point is $(x, y) = (2, 6)$, our knobs start at $w = 0$ and $b = 0$, and our learning rate is $\eta = 0.05$.

<strong>Step 1: predict.</strong> $\hat{y} = wx + b = 0 \cdot 2 + 0 = 0$. The error is $\hat{y} - y = 0 - 6 = -6$.

<strong>Step 2: compute the gradients.</strong> With a single point the sum has one term:

$$\frac{\partial L}{\partial w} = 2(\hat{y} - y)x = 2(-6)(2) = -24,$$
$$\frac{\partial L}{\partial b} = 2(\hat{y} - y) = 2(-6) = -12.$$

<strong>Step 3: update the knobs.</strong>

$$w \leftarrow 0 - 0.05(-24) = 1.2,$$
$$b \leftarrow 0 - 0.05(-12) = 0.6.$$

<strong>Step 4: check our work.</strong> The new prediction is $\hat{y} = 1.2 \cdot 2 + 0.6 = 3.0$. Our error went from $-6$ to $-3$, exactly halfway to the target in a single step. Run this a few more times and the prediction creeps right up to $6$.

That is gradient descent in miniature: predict, measure how wrong you are, nudge the knobs, repeat.

</details>

### The learning rate is the one knob you tune by hand

Everything above hinges on $\eta$, and it is worth pausing on because it trips up almost everyone at first.

If $\eta$ is too small, each step is tiny and training crawls. You will reach the bottom eventually, but you might wait forever. If $\eta$ is too large, you take huge steps and overshoot the bottom of the bowl, sometimes bouncing back and forth across the valley and getting *worse* instead of better. The sweet spot is a step big enough to make real progress but small enough to stay stable.

> Try the interactive below. Watch the same starting point descend the bowl under different learning rates, and see how a rate that is too high causes the loss to explode.

<iframe
  class="interactive-embed interactive-embed--rate"
  src="/assets/files/gradient-descent/learning_rate.html"
  title="Learning rate interactive"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

*Too small and you crawl, too big and you overshoot.*

One more piece of vocabulary. Each full pass of gradient descent over the training data is called an **epoch**. When you train a model for "100 epochs," you are just running this update loop 100 times.

### In Practice

That is all the theory. Here is the part that made everything click for me back in the PyTorch course, because it connects every equation above to about five lines of real code:

```python
for epoch in range(epochs):
    model.train()

    y_pred = model(X_train)            # 1. forward pass: make predictions
    loss = loss_fn(y_pred, y_train)    # 2. measure how wrong we are
    optimizer.zero_grad()              # 3. reset gradients from last step
    loss.backward()                    # 4. backpropagation: compute the gradients
    optimizer.step()                   # 5. gradient descent: nudge every knob
```

Look closely at what each line is doing, because we derived all of it:

- `loss_fn` is our loss function $L$. If you pick `nn.MSELoss()`, that is literally the mean squared error from above.
- `loss.backward()` is PyTorch computing $\frac{\partial L}{\partial w}$ and $\frac{\partial L}{\partial b}$ for you, for every single parameter in the model, automatically. The chain rule we did by hand for one line is the same chain rule it runs across the whole network. This is the famous **backpropagation** algorithm, and PyTorch's autograd handles the bookkeeping so you never have to differentiate by hand.
- `optimizer.step()` applies the update rule $w \leftarrow w - \eta \frac{\partial L}{\partial w}$ to every knob at once. The learning rate $\eta$ is the `lr` you passed in when you created the optimizer.
- `optimizer.zero_grad()` is there because PyTorch *adds up* gradients by default, so you have to wipe them clean before each step or they would pile up across epochs.

So the next time you watch a loss curve slide downward in your terminal, you know exactly what is happening behind it. The model is standing on a giant foggy hillside, feeling for the steepest way down, and taking one careful step at a time.

And that's really it! A model "learning" is just gradient descent walking downhill on a loss landscape. Everything fancier (momentum, Adam, learning rate schedules) is a smarter way of taking that same step.

Hope you got a deeper understanding of how neural networks learn. Thanks for reading! :D

### Sources

- *Learn PyTorch for Deep Learning in a Day* by Daniel Bourke [(link)](https://www.youtube.com/watch?v=Z_ikDlimN6A)
- 3Blue1Brown, "Gradient descent, how neural networks learn" (Chapter 2 of his neural networks series)
- StatQuest with Josh Starmer, "Gradient Descent, Step-by-Step"
- *Why Machines Learn* by Anil Ananthaswamy

<script defer src="/assets/js/interactive-embed-resize.js"></script>
