# Week 5 — Star dataset

---

The file I kept coming back to is a small Kaggle star table: each row is a star with temperature, luminosity, radius, absolute magnitude, a numeric type code, a color word, and a spectral class letter. It is not glamorous to look at in the raw CSV, but it is the kind of thing astronomers actually argue from—numbers on one side and human-readable labels on the other—and I wanted to see how far I could get with honest questions before I turn any of it into charts or a Week 6 notebook.

I picked this because Week 4 was about pulling live-ish space data into an experience. Week 5 for me was the opposite impulse: sit still with one static table and refuse to hand-wave. I care whether “hot,” “blue,” and “main sequence” still line up the way textbooks draw them when the data is messy real labels, not textbook cartoons.

So I spent time in pandas doing the boring-in-a-good-way steps first—skim the first rows, look at column types and missing counts, tally how often each color and type shows up, cut the table down once to only the very hot and very bright rows to see who is left, then average the big four numbers by star type so I could talk about gaps instead of vibes. The printout is not the final artifact; it is the proof that I read the table before I narrate it. What stuck with me is that luminosity really does separate the giants from everything else in this slice, while radius and brightness only move together in a loose, “sometimes true” way if you squint at the whole file at once. Color was the humbling part: the strings in the file are spelled a dozen different ways, so “color tells temperature” is directionally right but not something I would bet a grade on without cleaning the labels first.

## How I worked through it

I treated the week as a ladder. If the ladder is crooked at the bottom—wrong types, silent gaps in the columns, a bogus row—nothing on the top rung matters. Once the bottom felt solid, the middle rung was comparing groups, and the top rung was admitting where a story I wanted (bigger always means brighter, color always means temperature) simply is not supported line by line. That is a mood shift from how I usually work on front-end or creative pieces: less “does it feel cool,” more “would I be embarrassed if someone asked me to defend this sentence.”

## Cursor

I used Cursor the same way I used it on Cosmic Synth: faster scaffolding and fewer typos on the plumbing, but I still had to read the terminal output, decide the filter and the groupings, and rewrite the comments so they say what question I am asking the data and what the answer would mean for someone who does not live inside pandas. The small Python file is a shared draft in that sense; the judgments about what counts as evidence are mine.
