import csv

input_file = "demo_responses.csv"
output_file = "../Week 3/responses_clean.csv"

rows = []

with open(input_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames

    for row in reader:
        # Skip rows where participant_id (name field) is empty
        if not row["participant_id"].strip():
            continue

        # Capitalise all values in the role column
        row["role"] = row["role"].upper()

        rows.append(row)

with open(output_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Done. {len(rows)} rows written to {output_file}")
