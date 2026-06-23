---
title: "Presenting STEM-equity research to my school board, and the NLP behind it"
date: 2026-06-23 05:20:00 -0400
categories: [Research]
tags: [machine-learning, nlp, tf-idf, education]
math: true
---

A couple of years ago, in high school, I presented my own research to the Montgomery County Public Schools budget committee, the group that helps steer a multi-billion-dollar budget. The pitch: STEM access in our county is unequal, and the budget can fix it. The part worth writing about is the machine learning behind one survey question.

## The problem

With my research partner, I surveyed 206 MCPS students, weighted toward underrepresented backgrounds. The Likert questions were easy: access rated low (around 2.4 to 2.8), interest rated higher and bimodal. The demand was there; the access was missing. The hard part was the open-ended question, *what inhibits your access and achievement in STEM?*, which produced 206 free-text answers. You cannot eyeball 206 paragraphs and claim you found the top barriers. You have to turn text into numbers.

## The NLP

After cleanup (tokenize, lowercase, drop stopwords, lemmatize), each response becomes a vector in a document-term matrix, one column per word in the vocabulary. Raw counts are useless because common words like "school" dominate, so I weighted terms with **TF-IDF**:

> **Key Point:**
> $\text{tf-idf}(t,d) = \text{tf}(t,d)\cdot\log\dfrac{N}{n_t}$, where $N$ is the number of responses and $n_t$ how many contain term $t$.

The $\log(N/n_t)$ factor crushes ubiquitous words: a term in 30 of 206 responses scales by $\log(206/30)\approx 1.9$, while "school" in 190 of them scales by $\approx 0.08$. Each vector now points toward whatever made that response specific.

To group responses, "are these about the same thing?" becomes geometry. I used **cosine similarity**, the angle between vectors rather than their length, so a long answer and a short one about the same barrier still score close:

$$\cos(\theta)=\frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert}.$$

Cluster those vectors (k-means or agglomerative) and count each cluster, and the frequency of each theme falls out. The catch: TF-IDF only sees shared words, so "no AP physics" and "we don't have advanced science" look unrelated to it despite being the same complaint. Swapping in sentence embeddings, which map by meaning, fixes that, and it is the version I would build now.

The themes, by frequency: educational infrastructure (71), guidance and mentorship (47), financial barriers (36), access to opportunities (31), curriculum and teaching (28). The question everyone skips for being "too messy" was the most actionable, and NLP is what made it evidence instead of anecdote.

## What came next

The curriculum theme was testable: does interactive learning really beat worksheets? I ran a small randomized study, now a paper on arXiv: [Comparative Analysis of Digital Tools and Traditional Teaching Methods](https://arxiv.org/abs/2408.06689). Thirty students, same probability unit, Khan Academy versus worksheets. The digital group went 70 to 87 (+24.2%); the worksheet group 72 to 78 (+8.3%), significant on paired and two-sample t-tests at $p<0.01$. The driver was instant feedback.

So through MoCo Innovation, the nonprofit I run, we built [MentorAI](https://www.mocoinnovation.org/mentorai): a free adaptive K-12 STEM tutor with interactive quizzes, instant feedback, and points. Each feature traces back to a finding. NLP made a messy survey rigorous, an RCT turned a hunch into evidence, and a tutor turned that evidence into something a kid can use.

Thanks for reading!

## Sources

- *Comparative Analysis of Digital Tools and Traditional Teaching Methods* [(arXiv)](https://arxiv.org/abs/2408.06689)
- MoCo Innovation MentorAI [(about)](https://www.mocoinnovation.org/mentorai) · [(try)](https://chatgpt.com/g/g-f74qUsBJy-moco-innovation-mentorai)
