---
title: "BUMP: building a wearable for when a heart rate crashes"
date: 2026-06-23 05:25:00 -0400
categories: [Building]
tags: [bump, medical-devices, hardware, machine-learning, startups]
math: true
---

Crashing bradycardia kills people who are nowhere near a hospital. The heart rate drops, cardiac output falls with it, and the patient gets dizzy, faints, or arrests. The definitive treatment lives inside an emergency department: atropine first, then pacing if the patient is unstable. The emergency itself happens on a flight, in a rural county, or alone at home. That gap between when the heart fails and when a clinician can intervene is what I am building BUMP to close.

I want to be precise about what BUMP is and is not, because the honest version is more convincing than the pitch-deck version. The long-term vision is a wearable that detects dangerous bradycardia and delivers a bridge therapy to buy time to reach care. Most of this post is about the engineering reality of getting there, and the order I think it has to happen in.

## What I have built

The current prototype is a closed control loop on the bench. A PulseSensor on the index finger streams photoplethysmography data to an Arduino Uno. The microcontroller estimates beats per minute in real time, and when the rate crosses a threshold it drives a peristaltic pump connected to a reservoir, while firing a multi-modal alert: an LED, a piezo buzzer, a vibration motor, and an LCD that switches to a "bradycardia detected" state.

The dosing is modeled as a simple linear function of heart rate, calibrated to an average adult:

$$f(x) = -0.05x + 3.5$$

where $f(x)$ is the dose in milliliters and $x$ is the measured BPM, valid below 60. To characterize the actuator, I drove the input with a potentiometer to simulate a sweep of heart rates, pumped water as an atropine proxy into a graduated cylinder, and compared dispensed volume against the equation. The pump landed at **92.77% accuracy** (standard deviation of 7.23%), with more than half of the trials inside a 2.5% deviation band. The hypothesis going in was sub-5% deviation, so the prototype missed its own target, and writing that down honestly is the point of doing the experiment.

<div class="bump-poster" markdown="0">
  <a href="https://www.peeref.com/posters/10753/bump-a-novel-atropine-pump-for-patients-with-crashing-bradycardia-via-continuous-bpm-monitoring" target="_blank" rel="noopener noreferrer">
    <img src="/assets/img/bump/bump-poster.png" alt="BUMP research poster: A Novel Atropine Pump for Patients with Crashing Bradycardia via Continuous BPM Monitoring" width="1200" height="1553" loading="lazy">
  </a>
  <figcaption>Click the poster to view it on Peeref.</figcaption>
</div>

The full build, methods, and deviation analysis are written up in the [research poster on Peeref](https://www.peeref.com/posters/10753/bump-a-novel-atropine-pump-for-patients-with-crashing-bradycardia-via-continuous-bpm-monitoring).

So the prototype proves a narrow thing: I can build closed-loop sense-decide-actuate hardware, model the dosing, and measure where it fails. The integrated system, from the finger sensor and threshold logic to the dosing pump and multi-modal alert, is covered by a [filed US provisional patent](/assets/files/bump-provisional-patent.pdf), and the work is advised by Dr. Gopal at Harvard Medical School.

## The hard problems, stated honestly

A working bench loop is the easy 5%. Here is the 95%, and naming it precisely is what separates a real medical-device founder from a science-fair project.

**Sensing is the core ML problem.** A finger PPG is corrupted by motion, and its signal degrades exactly when peripheral perfusion drops, which is the hemodynamic state BUMP is supposed to catch. Triggering anything off a single threshold is unsafe, because a heart rate under 60 is not an emergency. Trained endurance athletes rest in the 40s; everyone slows in sleep. The real target is *symptomatic, hemodynamically unstable* bradycardia, and distinguishing that from benign low rates and from sensor noise is an on-device signal-processing and machine-learning problem, not an `if (bpm < 60)` statement.

**The drug is not a universal fix.** Atropine is the ACLS first-line for vagally mediated and AV-nodal bradycardia, and it is ineffective or harmful in high-degree and infranodal block, where pacing is the definitive intervention. A safe system has to respect the indication, cap cumulative dose against anticholinergic toxicity, and account for drug concentration rather than blindly delivering more as the rate falls.

**Autonomous IV delivery is the regulatory wall.** A device that injects a drug intravenously with no human in the loop is the highest FDA risk class, which means a PMA, clinical trials, and a long capital runway. Chronic at-home IV access carries its own infection risk. Non-IV routes (intramuscular, subcutaneous auto-injection in the spirit of an epinephrine pen, or intranasal) are more realistic for an ambulatory device and change the regulatory calculus.

Each of these is part of the spec, and most are tractable in the right sequence.

## How I am sequencing it

The mistake would be to march straight at autonomous closed-loop dosing. The route that gets a real product to real patients runs in stages.

The beachhead is **monitoring and intelligent early warning**, with no drug delivery at all. Robust heart-rate estimation plus on-device ML that suppresses false positives and flags genuine deterioration early, then loops in a caregiver or clinician. This sits in an established wearable-cardiac-monitor regulatory category, gets a product into users' hands quickly, and generates the longitudinal data and clinical relationships that every later stage depends on.

The next stage is **clinician-supervised intervention** for diagnosed high-risk patients: a guided, non-IV bridge dose delivered under a defined care plan, with a human in the loop.

The north star is **supervised closed-loop delivery** in controlled clinical settings first, such as cardiac step-down units, then ambulatory use, pursued through a PMA and trials with clinical partners. Earn the right to act autonomously by first proving you can reliably see the emergency.

## Why me, why now

I built a working closed-loop prototype and filed a patent on it before starting college, and I can carry the whole stack myself: the embedded hardware, the firmware, the machine learning on the sensor signal, and the statistics to validate it. I work on cardiovascular and ML research at Harvard Medical School and Brigham and Women's, the Stanford Cardiovascular Institute, and the UMD MIND Lab, and I have clinical advising on the medicine.

The timing is the real unlock. Wearable biosensors and on-device models have only recently gotten good enough to make continuous, low-false-positive deterioration detection plausible outside a hospital. The detection layer that was science fiction a few years ago is now the tractable first product.

If you invest in or work on acute cardiac care, or you have lived this problem as a clinician or a patient, I want to talk.

## Links

- Poster: *BUMP: A Novel Atropine Pump for Patients with Crashing Bradycardia via Continuous BPM Monitoring* [(Peeref)](https://www.peeref.com/posters/10753/bump-a-novel-atropine-pump-for-patients-with-crashing-bradycardia-via-continuous-bpm-monitoring)
- Provisional patent: [Download PDF](/assets/files/bump-provisional-patent.pdf)
- Contact: [akanduko@andrew.cmu.edu](mailto:akanduko@andrew.cmu.edu)
