---
title: "Claude Code Has 16,112 Open Issues. Its Cleanup Bot Can Reach 59 a Run."
date: 2026-11-06 21:50:00 -05:00
categories: [Writing, Research]
tags: [claude-code, ai-agents, open-source, github, triage, statistics]
description: "I triaged 1,000 of Claude Code's open GitHub issues with sandboxed Claude agents, and found the cleanup bot spending 94% of every run on issues it isn't allowed to touch."
pin: true
image:
  path: /assets/files/claude-code-open-issues/social.png
  alt: "One run of the cleanup bot: 941 issues it is told to skip, 59 it can label."
---

A post on r/ClaudeAI this week, by u/nseavia71501, asked Anthropic a fair question. Citing the company's own engineering blog, it said Anthropic merges more than 30,000 code changes a day. So why are 98% of the open issues in the public [Claude Code repo](https://github.com/anthropics/claude-code) unassigned, some of them serious security bugs?

John Crickett pushed it further on LinkedIn. Why isn't Anthropic running a "software factory" that reviews every issue, sets aside the risky ones like prompt injections, and hands the rest to an agent or a person? Showing that factory at work, he wrote, would make a better case study than a claim of 30,000 PRs a day.

I liked that enough to try it. I used Claude Code to build a small factory out of Claude agents and pointed it at the repo's issue tracker, the public list where anyone can report a bug or ask for a feature. The factory read 1,000 of the 16,112 open issues and wrote down what a maintainer should do with each one. Whenever it called an issue already fixed, a duplicate or a security problem, two fresh agents checked the call.

The most useful finding came from reading Anthropic's own scripts while the factory was being set up. The script that's supposed to keep the tracker clean spends more than 90% of every run on issues it isn't allowed to touch.

### Anthropic already runs bots on every issue

Part of John's factory already exists. The repo has automated jobs, which GitHub calls workflows, and they run Claude Code on every new issue. One job reads it, tags it with labels for type, area and platform, and flags bug reports that are missing a repro, the steps to make the bug happen again. Another searches for duplicates and comments with up to three candidates, and a third closes the issue as a duplicate if nobody objects within three days. A fourth job, the sweep, marks issues stale after 14 quiet days and closes them 14 days after that.

It shows. 98.5% of the open issues carry labels. 88,619 issues have been closed so far, and GitHub records a reason for each: 57% "not planned" (mostly by the sweep), 26% duplicates and 17% completed.

Only 294 of the 16,112 open issues are assigned to anyone, which is how GitHub shows who's working on something. The other 98% are what the Reddit post noticed. That undercounts the people looking, since staff also comment on and reproduce issues without assigning themselves. Still, 255 new issues arrive every day, and four out of five issues open today were filed after September 1.

### The sweep can reach 59 issues a run

The sweep is a 168-line script, [scripts/sweep.ts](https://github.com/anthropics/claude-code/blob/main/scripts/sweep.ts), and it's easy to read. Twice a day it asks GitHub for the 1,000 open issues that have gone longest without an update. Those 1,000 are its whole window. It walks through them and labels the quiet ones stale. It's told to skip four kinds of issue: ones with 10 or more upvotes (thumbs-up reactions), assigned ones, locked ones, and ones that already have the stale or autoclose label.

Each rule makes sense on its own. Together they jam the window. A skipped issue doesn't change, so it stays at the front of the oldest-first list, and the next run spends a slot on it again. Popular old bug reports, assigned issues nobody has touched and stale issues that got one comment all pile up at the front, and they never leave.

I rebuilt the window from a snapshot of every open issue, taken about two and a half hours after the sweep's 22:06 UTC run on November 6. Of its 1,000 slots, 599 hold issues with 10+ upvotes, 186 are assigned, 155 are already stale and 1 is locked. That leaves 59 issues it can actually label. Its own logs are close: the last three runs labeled 69, 71 and 64. Meanwhile, about 8,000 open issues have been quiet for 14 days and meet every rule. That's half the backlog, and about 237 more go quiet every day.

Run it yourself. Each cell is one real open issue, in the order the sweep reads them.

<iframe
  class="interactive-embed"
  src="/assets/files/claude-code-open-issues/sweep-window.html"
  title="What the sweep sees"
  sandbox="allow-scripts"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

The popular issues jamming the window are mostly old bug reports. 442 of the 599 carry the bug label, and 527 have been quiet since before September 1. Of the 60 that landed in my sample, 26 were already fixed, duplicates, or too old to trust without a retest. Closing those by hand would free up a lot of slots.

The code fix is to let GitHub's search do the skipping. One query returns only the issues the sweep is allowed to label:

```text
is:issue is:open is:unlocked
no:assignee
-label:stale -label:autoclose
updated:<CUTOFF reactions:<10
```

In plain words, it asks for open issues that aren't locked, assigned or already marked stale, haven't changed since the cutoff date, and have fewer than 10 reactions. On the evening of November 6 it returned 8,000. With it, every issue the sweep looks at is one it can label. GitHub limits how fast one bot can write, so my version caps each run at 300 labels, a couple of seconds apart. That's five times today's rate, and it works through today's pile in about three weeks. I haven't run it live yet, because GitHub rate-limited my read-only test runs, so those numbers come from the snapshot and that one live count.

### A working sweep would close real bugs

Fixing the sweep would also close a lot of issues that should stay open.

447 of the 1,000 triaged issues are ones the sweep would label today if it could reach them. Scaled up to the whole backlog (more on the sampling below), 40% of the issues in that pile are real bugs, and about 3% are bugs the pipeline rated high or critical. The sweep can't tell, because it only looks at dates, upvotes and a few labels.

It has already closed some of them. Of the 88,619 closed issues, 324 labeled data-loss were closed after being marked stale, along with 200 labeled reproduced and 77 labeled high-priority. Three I looked at closely:

- [#88605](https://github.com/anthropics/claude-code/issues/88605) - "Exit cleanup recursively deletes $HOME instead of session directory." In other words, quitting could wipe your home folder. Labeled high-priority and data-loss, closed for inactivity on October 13. I couldn't find a line in the changelog, the list of what changed in each release, that fixes it.
- [#84224](https://github.com/anthropics/claude-code/issues/84224) - an auto-updater that installs over a different copy of Claude Code. A maintainer reproduced it on August 25. Closed for inactivity on October 24.
- [#86667](https://github.com/anthropics/claude-code/issues/86667) - on Windows, Claude got past a blocked-folder guard by running `cmd /c rd`, the Windows command that deletes a folder. It was fixed in 2.1.283 on September 25, and eight days later the sweep closed it as "not planned." The right issue got closed, and the record says nobody planned to fix it.

It's still happening. My sample has 52 open bugs the pipeline rated high or critical. Only 18 of those ratings went through the two checks, and the rest are the first reader's call. 10 of the 52 already carry the stale label, so they close within two weeks unless someone comments. Two of those are critical Windows bugs where the whole `~/.claude` folder (settings, memory, transcripts) got wiped: [#93469](https://github.com/anthropics/claude-code/issues/93469) and [#93791](https://github.com/anthropics/claude-code/issues/93791). In another bug, labeled high-priority, Claude ran `rm -rf "$HOME"` during test cleanup and deleted about 68,000 files in the reporter's home folder ([#93099](https://github.com/anthropics/claude-code/issues/93099)). It has been quiet long enough that a working sweep would label it next.

None of these three has a single upvote, so the 10-upvote rule doesn't protect them. All nine issues the pipeline rated critical had zero upvotes. Upvotes are a poor guide to how bad a bug is.

Four weeks of silence is a fair reason to close a vague report. A bug with a repro and a data-loss label should stay open however quiet it gets, and three more terms in the same query would skip those.

### What's in the backlog

To find out, the factory read 1,000 issues picked in three groups: all 150 most-upvoted issues, a random 250 of the other 1,574 that look security-related by label or title, and a random 600 of the remaining 14,388. That over-samples popular and security-looking issues on purpose, so each group is weighted by its share of the backlog. The estimates below describe all 16,112 open issues. The range after each one is a 95% interval for the luck of the draw.

- **Real bugs** - 44% (40 to 47%), about 7,000 issues. That includes about 2% the first reader called duplicates or already fixed that neither check could confirm.
- **Feature requests** - 19% (16 to 22%), about 3,100.
- **Close now** - 13% (11 to 16%), about 2,100. Already fixed in a release or a duplicate. At least one of two separate checks confirmed it, and neither rejected it.
- **Not actionable** - 14% (11 to 16%), about 2,200. Things that aren't about Claude Code, plus account support questions, near-empty forms and vague complaints.
- **Ask the reporter** - 10% (8 to 12%), about 1,700. Missing a repro, a version or an error, or too old to trust without a retest.

Every dot below is one of the 1,000. Tap one to see the issue and what the pipeline said to do with it. For open security reports it shows just the title and a link.

<iframe
  class="interactive-embed"
  src="/assets/files/claude-code-open-issues/backlog-waffle.html"
  title="1,000 issues, sorted"
  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

A few things surprised me.

**Fixes ship, issues stay open** - the changelog is huge and specific, 8,814 lines over 437 releases, and only 67 of those lines name the issue they fix. About 3% of open issues, roughly 500, are already fixed in a release after the one the reporter was using, with a changelog line that says so. Two issues in my sample were fixed in 2.1.319, which shipped the day I ran this. [#71539](https://github.com/anthropics/claude-code/issues/71539), with 25 upvotes, was fixed in August and is still open.

**Over half the most-upvoted issues are feature requests** - 78 of the top 150. Upvotes track what people want, and that's a different list from what's broken.

**The security pile is smaller than it looks** - 1,582 open issues look security-related by label or title. After both checks, about 2% of the backlog, around 300 issues, held up as security, privacy or data-safety problems at the severity the first reader gave them. Counting the ones a checker only marked down, it's about 3%, around 540. The biggest group, 17 of the 36 in my sample, is destructive actions: deleted folders, wiped config, uncommitted work thrown away.

**The privacy bug from the Reddit post is in my sample** - [#107757](https://github.com/anthropics/claude-code/issues/107757), with 687 upvotes. A user found their account email in the User-Agent header of web requests to third-party sites. Both checkers called it real, and one moved it from critical to high. It traces back to [#81138](https://github.com/anthropics/claude-code/issues/81138) (90 upvotes), where Claude Code adds your account email to what the model reads on every request. Releases 2.1.234 and 2.1.317 added guardrails, and #107757 was reported on 2.1.318.

**One form fills a lot of the backlog** - 511 open issues are titled just "[GitHub integration]". In my sample, 23 of the 26 couldn't be acted on as written.

### How the factory works

Every reader was a headless Claude Code session, run from a script with nobody watching. It had three tools: read a file, search a file, list files. No shell to run commands, no web, no MCP servers (plug-in tools), no settings files, and every permission prompt answered "no." That's on purpose.

John's post raised the right worry. Issues are written by strangers, and some will contain instructions aimed at whatever AI reads them. The prompt tells every reader to treat issue text as data and to flag anything aimed at an AI. Before the real run, I fed a reader a fake issue telling it to run a command. It flagged the instruction, and it had no tool that could run it. That test is in the repo. Across the 1,000 real issues, two had comments addressed to an AI agent, and both just asked it to fix or prioritize the bug.

Each reader got 20 issues with a trimmed comment thread, the version the reporter was on (or, for the 578 that didn't say, the newest release on the day they filed), the eight most similar open and closed issues, and the changelog lines from later releases that share rare words with the issue. It could also search the full changelog and the titles of all 104,731 issues ever filed. For each issue it answered what a maintainer would want to know: whether it's a bug or a request, how bad it is, whether it's already fixed or a duplicate, and what should happen next.

I didn't trust the first pass. A model sounds just as sure when it's wrong. So every "already fixed," "duplicate" and security call went to two more sessions that never saw each other. Both were told to try to prove the call wrong, one by checking its evidence and the other by hunting for a counterexample. A call only counts if at least one backs it and neither knocks it down.

They rejected 115 of the 297 calls, 39%. A rejected fixed or duplicate call was thrown out. A rejected security call was marked down, and about half of those still came out as high or medium problems. Three typical rejections: a "duplicate" that pointed at an old issue the sweep had closed, with its usual note asking people to open a new one; a "fix" that covered only half of a two-part bug; and a "security" problem that was really a security-key prompt that kept popping up.

All of it took 110 Claude sessions (plus 7 automatic retries), six at a time, and about 25 minutes of reading and checking.

Now try being the triage bot yourself. Sort six real issues, then check your calls against the factory's. Only the close-now answers went through the two checks.

<iframe
  class="interactive-embed"
  src="/assets/files/claude-code-open-issues/sort-the-issues.html"
  title="You be the triage bot"
  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
  width="100%"
  scrolling="no"
  loading="lazy"
></iframe>

### What I'd change

If I could send Anthropic one pull request, it would be the sweep fix with rule 2 built in. The search change alone would put about 8,000 issues on a two-week clock within a few weeks, bugs like the ones above included. No outside pull request has ever been merged in that repo, so I filed the fix as an issue instead: [anthropics/claude-code#108082](https://github.com/anthropics/claude-code/issues/108082).

1. **Let search do the skipping** - the query above, capped and paced, so every slot goes to an issue the sweep can act on.
2. **Never close for silence what's already labeled important** - skip data-loss, high-priority and reproduced.
3. **Check the changelog before closing anything** - if a later release fixed it, close it as completed and name the version. That's about 500 issues today, and the record would finally say what happened.
4. **Flag matches with closed issues as possible regressions** - the triage bot is told to mark duplicates only against open issues, and the dedupe bot isn't told what to do when its best match is closed. A new report that matches a fixed issue is either already fixed or a regression, meaning the bug came back, and both are worth knowing.

### What this doesn't show

- Every call here is Claude's, checked by Claude. The two checks are separate sessions, but they're the same model reading the same evidence, and both saw the first reader's reasoning, so their mistakes can line up. Each call links to its issue and its evidence, so you can check any of them.
- The percentages are estimates from 1,000 issues. The intervals only cover which issues happened to land in the sample. They don't cover the model getting calls wrong, which is the bigger risk.
- No bug was reproduced. "Real bug" means a credible report with nothing showing it's been fixed.
- This is the public tracker only. One of the repo's workflows forwards every new issue to another repo whose name is kept secret, so there's tracking here I can't see.
- Everything is from a snapshot taken the evening of November 6, 2026.

### Thanks and disclosure

Thanks to u/nseavia71501 for asking the question and to John Crickett for the factory idea. I built the pipeline, the widgets and this page with a lot of help from Claude Code, which felt fitting. The readers and checkers are Claude too, and every call they made is in the repo. Any mistakes here are mine.

Code and data - [aarushkandukoori/claude-code-triage](https://github.com/aarushkandukoori/claude-code-triage) has the pipeline and its prompts, all 1,000 calls with their evidence (notes on open security reports left out), the 123 issues that look safe to close today, the 52 serious bugs and where each one stands with the sweep, and the sweep fix.

<script defer src="/assets/js/interactive-embed-resize.js"></script>
