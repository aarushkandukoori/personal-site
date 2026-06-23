---
title: "My Research Wrapped"
date: 2026-06-23 05:05:00 -0400
categories: [Writing, Research]
tags: [research, data-analysis, imagej, wrapped]
pin: true
---

I keep a journal for every research internship I do. Most of it is dated logistics, the kind of thing only my past self cares about. But reading back through three summers of entries, I realized there was a fun retrospective buried in the boring parts. So here is my Spotify Wrapped, except instead of top songs it is the data I stared at, the software I basically lived inside, and the experiments that worked (plus the ones that absolutely did not).

Two "albums" carried the year:

- Summers 2022 and 2023 at the University of Maryland MIND Lab, on a project about breathing.
- Summer 2024 at Stanford's Alexander Lab, on a heart disease called cardiac amyloidosis.

## The numbers

- 750+ breathing graphs and microscope images stared at
- 2 labs, 3 summers
- Top tool: ImageJ. Runner-up: pandas inside a Jupyter notebook
- Genre of the year: biomedical signal and image analysis
- 8 speech experiments run with a real test subject
- Certifications cleared to handle patient data and work in a wet lab
- 2 articles published, 1 analysis method built from scratch, and 1 hardware project that turned into a paper

Let me unpack the highlights.

## Top artist: ImageJ

If my research year had a "most played," it would be ImageJ. It is a free image-analysis program that scientists use to measure things in microscope images, and at Stanford I opened it almost every single day.

The core trick I leaned on is called color thresholding. A stained slice of heart tissue is just a picture with different colors in it, where one color marks the thing you care about. If you tell the computer "only count the pixels in this exact range of blue," it will measure how much of the image is that blue and ignore everything else. Do that consistently across hundreds of images and suddenly you can put a number on something that used to be a pathologist squinting and saying "looks like a lot."

That sounds simple, and the idea is. Getting it to behave the same way on 300 different images, each with slightly different lighting and staining, is where the real work hides.

## On repeat: the same boring judgment call, hundreds of times

My very first research task, back at MIND Lab in 2022, was the least glamorous thing imaginable, and I think about it constantly.

The lab studies breathing using a little sensor called a Spire tag that records the rise and fall of your torso as you breathe. That signal comes out as a wavy graph. Before anyone can do anything clever with it, a human has to look at each little segment and answer two yes-or-no questions: is this graph noisy (too messy to read), and is it inverted (flipped upside down because of how the sensor was sitting)?

I answered those two questions for more than 450 segments. It is tedious. But it taught me the single most important thing about working with data, which is that a model is only ever as good as the labels you feed it. Every fancy result downstream was sitting on top of someone making a careful, boring call hundreds of times. That someone was me, and I have a lot more respect for clean datasets now.

## Top track: a method I named FibroQuant

The project I am proudest of came out of the Stanford summer. Cardiac amyloidosis is a disease where misfolded proteins build up in the heart and stiffen it, and one of its fingerprints is fibrosis, which is essentially scarring of the tissue. Pathologists can see it on a stained slide, but "seeing it" and "measuring it the same way every time" are different problems.

So I built a color-thresholding pipeline in ImageJ to measure how much fibrosis was lighting up in each sample, and used it to separate diseased tissue from healthy tissue purely by the numbers. I called it FibroQuant. When we tested it across hundreds of mouse samples, the difference between the diseased and healthy groups held up statistically, which was the whole point: a measurement you can trust is one that gives you the same answer no matter who is running it.

(I am keeping the specific results vague on purpose, since that is the lab's data to publish, not mine.)

## Deep cut: the experiment I had to throw in the trash

Here is the one I think every student should hear, because nobody puts failed experiments on their resume.

My first attempt at image analysis used a different stain, and when I crunched the numbers, the healthy control samples looked like they had more of the disease signal than the actual disease samples. That is backwards. It is the scientific equivalent of your thermometer reading colder when you put it in hot water.

The reason turned out to be that the antibody in that stain was binding more or less randomly, so the signal was noise wearing a costume. We discarded the whole thing. It stung a little, but learning to recognize when your beautiful data is secretly garbage is a skill, and you only build it by getting fooled a few times.

## Bonus track: BUMP became a paper

A thread that ran through all three summers is a device I have been working on called BUMP, a wearable pump meant to buy time for patients whose heart rate suddenly crashes. I first pitched it to my MIND Lab professor in 2022, mostly to see if the idea was crazy. He thought it had legs and offered to put me up for a scholarship, which was the first time a real researcher took the project seriously.

By 2024 I sat down with a teammate and turned the old poster into a full research paper. My favorite part to write up was a small engineering-honesty problem. You cannot ethically test a heart-rate device by dropping a real person's heart rate into dangerous territory, so instead we simulated the heart rate with a dial and measured how accurately the pump responded. Sometimes the clever move in hardware is admitting what you are not allowed to do to a human and faking it safely.

## The bloopers reel

A few things that made me laugh reading back:

- We had a test paragraph for a speech experiment that turned out to be way too long, so we swapped it for "One Fish, Two Fish, Red Fish, Blue Fish." Dr. Seuss makes for surprisingly clean data.
- One week of my journal is almost entirely a wall of "File not found" errors. The files were missing, full stop, and I had to redo a chunk of data collection.
- We ran breathing trials with a metronome until my professor pointed out that nobody talks like a metronome, so we ditched it.
- Yes, I spent an afternoon doing alternate-nostril "balanced breathing" into a sensor in the name of science.

## What three summers of journaling taught me

If I compress all of it into one takeaway: research is mostly careful, repetitive, unglamorous work, and the exciting result is the thin slice on top. The labeling, the cleaning, the redoing, the throwing-away: that is the real job, and being patient with it is what separates a clean result from a misleading one.

The other thing is that I would have forgotten ninety percent of this if I had not written it down each week. I recommend keeping a journal, even a boring one. Your future self gets to make a Wrapped out of it.
