# HCDE 530 — Week 2

University of Washington HCDE 530 coursework. Focused on qualitative and quantitative data analysis using Python.

## Files

| File | Description |
|---|---|
| `demo_word_count.py` | Reads participant responses from CSV and prints a word count table with summary stats |
| `demo_responses.csv` | Survey response data with columns: `participant_id`, `role`, `response` |
| `context.md` | Narrative companion — what the script does, why, and design choices |
| `week2.md` | Week reflection and competency claims (C1, C2) |

## How to Run

```bash
cd "HCDE 530 Week 2"
python3 demo_word_count.py
```

For the reasoning behind design choices (DictReader, UTF-8, preview length, etc.), read `context.md`.

## Code Conventions

- CSV files opened with `encoding="utf-8"` and `csv.DictReader` for column access by name
- Use relative filenames — scripts must be run from the same folder as the data file
- Word counts use `.split()` with no argument to handle irregular whitespace
- Functions have docstrings explaining purpose and return value
- Output uses f-strings with column alignment (`:<N`) for readable terminal tables
- Summary stats printed at the end: total, min, max, average
