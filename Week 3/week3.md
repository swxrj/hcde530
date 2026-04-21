# Week 3

## Competency claim: Data Cleaning and Preparation

I found three bugs in `week3_analysis_buggy.py`:

1. It crashed on R009 because `experience_years` was the word `"fifteen"` instead of a number (`ValueError: invalid literal for int() with base 10: 'fifteen'`).
2. R005 had a blank `role`, so `""` was being counted as its own role in the tally.
3. The "Top 5 satisfaction scores" section was actually showing the bottom 5, because the sort did not have `reverse=True`.

To fix all three in one place, I wrote a function called `clean_survey_row()` that takes one row, strips whitespace, tidies up the casing, and validates the numeric fields (it clears `"fifteen"` and prints a skip message for it). I added a docstring to that function so anyone reading the file can see what it takes in and what it gives back, plus short comments on the parts that aren't obvious. The cleaned rows are written out to a new file, `week3_survey_clean.csv`, so the messy original stays untouched and the analysis below it runs on consistent data. My fix commit (`9e2a01b`) names each of the three bugs and its specific fix.

## On trusting AI-generated code

Cursor got me to a working cleanup pretty fast, but I would not push that straight at a real production database. "It runs and the output looks right" is not the same as "this is the right approach." For real data I would want to read through the logic myself (what happens on empty strings, what the tool quietly drops, whether the casing rules hold up on the next messy row) before merging.
