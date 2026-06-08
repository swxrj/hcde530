# Context: `demo_word_count.py`

This file is the narrative companion to `demo_word_count.py`. The script holds the runnable logic; this file holds the reasoning a reader needs when inline comments would clutter the code or when the explanation is meant for someone who is not stepping through every line.

---

## What this script does

`demo_word_count.py` reads qualitative survey responses from `demo_responses.csv` and prints a word-count summary for each participant. At the end it prints total responses, shortest response, longest response, and average word count.

The dataset is a small fictional HCD survey: each row has a `participant_id`, a `role` (UX Researcher, Product Manager, etc.), and a free-text `response`. The script does not change the CSV. It reads, counts, and reports.

---

## Why word count first

Before thematic coding or sentiment analysis, length is a quick sanity check. Very short answers might mean the question was unclear. Very long answers might dominate a readout if you quote them heavily. A table with ID, role, word count, and a short preview lets you scan the set without opening every row in a spreadsheet.

---

## Design choices in the script

| Choice | What the code does | Why |
|--------|-------------------|-----|
| `csv.DictReader` | Reads rows as dictionaries keyed by column name | Column names stay explicit (`row["response"]`) so the script still makes sense if column order changes |
| `encoding="utf-8"` | Opens the file with UTF-8 | Avoids decode errors if responses contain curly quotes or other non-ASCII characters |
| `response.split()` with no argument | Splits on any run of whitespace | Handles irregular spacing without a custom regex |
| 60-character preview | Truncates long responses in the table | Keeps terminal output readable; full text stays in the CSV |
| `count_words()` as a function | One place for the counting rule | If the definition of "word" changes later, there is one function to update |
| Aligned f-string columns | `:<6`, `:<22` padding in `print()` | Makes the terminal table scannable without a plotting library |

---

## How the script is organized

1. **Load** — open `demo_responses.csv` and append each row to a `responses` list.
2. **Define** — `count_words()` holds the word-counting rule and its docstring.
3. **Loop and print** — for each row, count words, store the count, print ID / role / count / preview.
4. **Summarize** — print total, min, max, and average from the collected `word_counts` list.

If you are reading the file top to bottom, that is the full pipeline. No functions are hidden in other modules for this exercise.

---

## What belongs in the script vs beside it

**Inside `demo_word_count.py`:** comments and docstrings that help someone follow the logic while reading the code — what a variable holds, why a function exists, what a non-obvious line is doing.

**In this file (`context.md`):** the survey scenario, why word count matters as a first pass, the table of design tradeoffs, and how the script fits into the Week 2 folder. A stakeholder or future you can read this without parsing Python syntax.

**In `README.md`:** how to run the script, which files are in the folder, and shared conventions (encoding, relative paths, f-string alignment) that apply across Week 2 scripts.

That split is intentional. Not every explanation belongs on the same line as the code.

---

## How to run

From this folder:

```bash
python3 demo_word_count.py
```

Expected output: a header row, one line per participant, then a short summary block with total / shortest / longest / average word counts.

---

## Files in this folder

| File | Role |
|------|------|
| `demo_word_count.py` | Main Week 2 script — read CSV, count words, print table and summary |
| `demo_responses.csv` | Input data |
| `context.md` | This file — narrative and design reasoning |
| `README.md` | Run instructions and code conventions |
| `clean_responses.py` | Later extension — filters empty IDs and normalizes role casing for Week 3 |
| `role_count.py` | Later extension — tallies responses per role into a CSV for Week 3 |
