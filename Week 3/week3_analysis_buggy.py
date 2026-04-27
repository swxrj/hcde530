import csv
from collections import Counter

INPUT_CSV = "week3_survey_messy.csv"
OUTPUT_CLEAN_CSV = "week3_survey_clean.csv"

FIELDNAMES = [
    "response_id",
    "participant_name",
    "role",
    "department",
    "age_range",
    "experience_years",
    "satisfaction_score",
    "primary_tool",
    "response_text",
]


def clean_survey_row(row):
    """Normalize one survey row for readable CSV output and downstream analysis.

    Strips string fields, applies title casing to role and department, and
    title-cases ``primary_tool`` except for the ``VS Code`` label. Numeric
    fields ``experience_years`` and ``satisfaction_score`` are written as
    integer strings when valid; invalid experience values are cleared to an
    empty string and a skip message is printed (including ``response_id``).

    Args:
        row: A mapping of column names to raw string values (e.g. from
            ``csv.DictReader``).

    Returns:
        A new dict with the same keys as ``FIELDNAMES`` and cleaned values.
    """
    def s(key):
        return row.get(key, "").strip()

    role = s("role").title()
    department = s("department").title()

    exp_raw = s("experience_years")
    try:
        experience_years = str(int(exp_raw)) if exp_raw else ""
    except ValueError:
        if exp_raw:
            print(
                f"  Skipping invalid experience value: '{exp_raw}' "
                f"for {s('response_id')}"
            )
        experience_years = ""

    sat_raw = s("satisfaction_score")
    try:
        satisfaction_score = str(int(sat_raw)) if sat_raw else ""
    except ValueError:
        satisfaction_score = ""

    tool = s("primary_tool")
    if tool.lower() == "vs code":
        primary_tool = "VS Code"
    else:
        primary_tool = tool.title()

    return {
        "response_id": s("response_id"),
        "participant_name": s("participant_name"),
        "role": role,
        "department": department,
        "age_range": s("age_range"),
        "experience_years": experience_years,
        "satisfaction_score": satisfaction_score,
        "primary_tool": primary_tool,
        "response_text": s("response_text"),
    }


# Load the survey data from a CSV file
with open(INPUT_CSV, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

clean_rows = [clean_survey_row(row) for row in rows]

with open(OUTPUT_CLEAN_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(clean_rows)

# Count responses by role (normalize via clean_survey_row)
role_counts = Counter(r["role"] for r in clean_rows if r["role"])

print("Responses by role:")
for role, count in sorted(role_counts.items()):
    print(f"  {role}: {count}")

# Calculate the average years of experience
total_experience = 0
valid_count = 0
for row in clean_rows:
    if not row["experience_years"]:
        continue
    total_experience += int(row["experience_years"])
    valid_count += 1

avg_experience = total_experience / valid_count
print(f"\nAverage years of experience: {avg_experience:.1f}")

# Find the top 5 highest satisfaction scores
scored_rows = []
for row in clean_rows:
    if row["satisfaction_score"].strip():
        scored_rows.append((row["participant_name"], int(row["satisfaction_score"])))

scored_rows.sort(key=lambda x: x[1], reverse=True)
top5 = scored_rows[:5]

print("\nTop 5 satisfaction scores:")
for name, score in top5:
    print(f"  {name}: {score}")
