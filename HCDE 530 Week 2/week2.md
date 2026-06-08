# Week 2 — Reading Code, Documenting Work

## What this week covers

Week 2 was my first pass working inside Cursor on Python for this course. The main artifact is `demo_word_count.py`, which reads survey responses from `demo_responses.csv` and prints a word-count table plus summary stats (total, shortest, longest, average).

I also set up the Git workflow (init, commit, push) and wrote documentation at two levels: comments and a docstring inside the script, and markdown files beside it for context that would clutter the code.

| File | Role |
|------|------|
| `demo_word_count.py` | Main script — load CSV, count words, print table and summary |
| `demo_responses.csv` | Survey data (`participant_id`, `role`, `response`) |
| `context.md` | Narrative companion — what the script does, why, and design choices |
| `README.md` | How to run the script and shared conventions |
| `clean_responses.py` / `role_count.py` | Extensions that feed into Week 3 |

Only **C1 (vibecoding)** and **C2 (code literacy and documentation)** apply here. C4, C5, C6, and C8 show up in later weeks.

---

## Process and approach

I used Cursor to understand Python I was reading for the first time — `.split()`, `len()`, `for` loops over CSV rows, f-string alignment (`:<6`, `:<22`). The workflow was read → ask → verify: highlight a line, ask what it does, run `python3 demo_word_count.py`, check the output.

For documentation I split explanation on purpose:

- **Inside the script:** short intent comments and a docstring on `count_words()` so the logic is followable line by line.
- **Beside the script:** `context.md` for the survey scenario, why word count is a useful first pass, and design tradeoffs (DictReader, UTF-8, preview length). `README.md` for run instructions.

Not every explanation belongs inline. The "why" lives in `context.md`; the "how" stays in the script.

First-time GitHub push took some troubleshooting. Once `git add` → `commit` → `push` clicked, I could focus on the code itself.

---

## What `demo_word_count.py` does

1. **Load** — `demo_responses.csv` via `csv.DictReader` with UTF-8.
2. **Define** — `count_words()` splits on whitespace and returns the count.
3. **Loop** — print ID, role, word count, and a 60-character preview per row.
4. **Summarize** — print total, min, max, and average.

The CSV holds fictional HCD survey answers. The script reads and reports; it does not modify the file. Word count is a quick sanity check before deeper analysis — short answers may mean a unclear question, long ones may dominate a readout. Full design reasoning is in `context.md`.

---

## Documentation: in the script vs beside it

| Layer | File | What it explains |
|-------|------|------------------|
| Inline comments + docstring | `demo_word_count.py` | Intent at the point of use (UTF-8, `split()`, preview truncation) |
| Narrative context | `context.md` | Survey scenario, design tradeoffs, script organization |
| Run instructions | `README.md` | File list, run command, conventions |

**Principle:** comments explain intent where the code runs; markdown explains intent at the project level. Both layers are needed — bare `# Import csv` comments show syntax, not reasoning.

---

## What this shows about the work

I used Cursor to move faster, not to skip understanding. Running the script and checking the table made the documentation honest — I was not describing code I had never executed.

Code literacy in HCDE is not writing everything from scratch. It is understanding enough to direct what is built, ask grounded questions, and judge whether output supports a decision. The core evidence for Week 2 is `demo_word_count.py`, `context.md`, and `README.md` together.

---

## Competency claims

### C1: Vibecoding and rapid prototyping

I used **Cursor** to work through unfamiliar Python and set up the repo while still shipping a runnable script.

- Asked the tool to explain `.split()`, `len()`, `DictReader`, and f-string formatting.
- Troubleshot first GitHub push.
- Verified by running the script — output had to match spot-checks, not just AI explanations.

**Evidence:** `demo_word_count.py` (runnable, terminal-verified), full Week 2 folder in the course repo, read → run → adjust loop.

**What I learned:** AI is fastest when you know what to verify.

---

### C2: Code literacy and documentation

Documentation is split across three files, each with a distinct job.

- **`demo_word_count.py`** — relative path comment, UTF-8/`split()` intent comments, docstring on `count_words()`.
- **`context.md`** — what the script does, why word count first, design-choice table, in-script vs beside-script section.
- **`README.md`** — file table, run command, conventions.

| Claim | File | Artifact |
|-------|------|----------|
| Function contract | `demo_word_count.py` | Docstring on `count_words()` |
| Intent at point of use | `demo_word_count.py` | Comments on UTF-8, `split()`, preview, summary |
| Project-level reasoning | `context.md` | Design table, script organization |
| Runnable instructions | `README.md` | Run command, conventions |
| Input data | `demo_responses.csv` | `participant_id`, `role`, `response` |

**What I learned:** If `context.md` is missing, a claim about documentation beside the code cannot be checked. All three files need to stay in the folder together.

---

## What I would do next

Group word counts by `role` to see which roles write longer responses — `role_count.py` already moves that direction for Week 3. Keep the two-layer habit: update `context.md` when the why changes, inline comments when the how changes.
