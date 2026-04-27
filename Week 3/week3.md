# Week 3

## Competency claim: Data Cleaning and Preparation

I used Cursor to walk through `week3_analysis_buggy.py` and flag the suggested problems, then went back and forth with it on how to fix each one. I did not just accept the first answer. The three bugs we landed on were:

1. It crashed on R009 because `experience_years` was the word `"fifteen"` instead of a number (`ValueError: invalid literal for int() with base 10: 'fifteen'`).
2. R005 had a blank `role`, so `""` was being counted as its own role in the tally.
3. The "Top 5 satisfaction scores" section was actually showing the bottom 5, because the sort did not have `reverse=True`.

For the `"fifteen"` issue, Cursor first suggested manually mapping number words to digits (`"one"` = 1, `"two"` = 2, and so on). That works for this tiny dataset, but it is not viable if the column could contain any number word up to the hundreds or thousands, so I pushed back and we went with clearing the invalid value and printing a skip message instead. That scales to any bad input without me pre-listing every word.

For the actual fixes, I prompted Cursor to pull the row-level cleanup into one function instead of sprinkling patches across the file. That became `clean_survey_row()`, which strips whitespace, tidies up the casing, and validates the numeric fields in one place. I added a docstring on it so anyone reading the file can see what it takes in and what it gives back, plus short comments on the parts that aren't obvious. The cleaned rows are written out to a new file, `week3_survey_clean.csv`, so the messy original stays untouched and the analysis below it runs on consistent data. My fix commit (`9e2a01b`) names each of the three bugs and its specific fix.

## On trusting AI-generated code

Cursor got me to a working cleanup pretty fast, but I would not push that straight at a real production database. "It runs and the output looks right" is not the same as "this is the right approach." For real data I would want to read through the logic myself (what happens on empty strings, what the tool quietly drops, whether the casing rules hold up on the next messy row) before merging.
