import csv

input_file = "demo_responses.csv"
output_file = "../Week 3/role_count.csv"

counts = {}

with open(input_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        role = row["role"].strip()
        if role:
            counts[role] = counts.get(role, 0) + 1

with open(output_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["role", "count"])
    writer.writeheader()
    for role, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
        writer.writerow({"role": role, "count": count})

print("Role counts:")
for role, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {role:<25} {count}")
print(f"\nWritten to {output_file}")
