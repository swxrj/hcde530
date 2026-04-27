"""
Fetch app review data from the HCDE 530 Week 4 API, group reviews by app,
and compute the highest rating, lowest rating, average rating, and total
number of reviews for each app. Save the results to response_2.csv.

API root: https://hcde530-week4-api.onrender.com/
Reviews endpoint: https://hcde530-week4-api.onrender.com/reviews

Uses only the Python standard library (urllib + csv).
"""

import csv
import json
import os
import ssl
from urllib.parse import urlencode
from urllib.request import urlopen

# Where the data comes from and where the summary goes.
# PAGE_SIZE is how many reviews we ask for in one request; the API limits it,
# so we fetch in chunks and stitch them together.
BASE_URL = "https://hcde530-week4-api.onrender.com"
ROOT_ENDPOINT = f"{BASE_URL}/"
REVIEWS_ENDPOINT = f"{BASE_URL}/reviews"
OUTPUT_CSV = "response_2.csv"
PAGE_SIZE = 100


def build_ssl_context():
    """Return an SSL context that trusts a working CA bundle.

    Homebrew's Python on macOS sometimes ships without CA roots wired into
    the default context. Fall back to common CA bundle locations if needed.
    """
    context = ssl.create_default_context()
    if context.get_ca_certs():
        return context

    for ca_path in (
        "/etc/ssl/cert.pem",
        "/usr/local/etc/ca-certificates/cert.pem",
        "/opt/homebrew/etc/ca-certificates/cert.pem",
    ):
        if os.path.exists(ca_path):
            return ssl.create_default_context(cafile=ca_path)

    return context


SSL_CONTEXT = build_ssl_context()


def fetch_json(url):
    """Open a URL and parse the JSON response into a Python dict/list."""
    with urlopen(url, timeout=30, context=SSL_CONTEXT) as response:
        return json.load(response)


def fetch_root():
    """Call the API root so we log what the service advertises.

    This is just a friendly hello to the API. If it fails we keep going,
    because the actual data we need is on /reviews, not the root.
    """
    try:
        return fetch_json(ROOT_ENDPOINT)
    except Exception as exc:
        print(f"Warning: could not fetch API root ({exc}).")
        return None


def fetch_page(offset, limit):
    """Get one page of reviews. ``offset`` is where to start, ``limit`` is how many to ask for."""
    query = urlencode({"limit": limit, "offset": offset})
    return fetch_json(f"{REVIEWS_ENDPOINT}?{query}")


def fetch_all_reviews():
    """Page through /reviews until every record has been collected.

    The API returns reviews in chunks. We keep asking for the next chunk
    using ``offset`` and stop when the API says there are no more rows
    (either it returned 0, or we have reached the reported ``total``).
    """
    all_reviews = []
    offset = 0

    while True:
        data = fetch_page(offset, PAGE_SIZE)
        reviews = data.get("reviews", [])
        all_reviews.extend(reviews)

        total = data.get("total", 0)
        returned = data.get("returned", len(reviews))

        # Stop if this page was empty or we've already covered the whole dataset.
        if returned == 0 or offset + returned >= total:
            break
        offset += returned

    return all_reviews


def summarize_by_app(reviews):
    """Group reviews by app and compute rating stats for each one.

    For every app we track all its ratings, the highest one we have seen,
    and the lowest one we have seen. After the loop we turn each group
    into one summary row (high, low, average, total).
    """
    # First pass: bucket every rating under its app and update high/low as we go.
    # Skip reviews that don't have a rating, since we can't include them in stats.
    grouped = {}
    for review in reviews:
        app = review.get("app", "Unknown")
        rating = review.get("rating")
        if rating is None:
            continue
        # setdefault creates the bucket the first time we see this app,
        # then reuses the same bucket for every later review of that app.
        bucket = grouped.setdefault(
            app, {"ratings": [], "highest": rating, "lowest": rating}
        )
        bucket["ratings"].append(rating)
        if rating > bucket["highest"]:
            bucket["highest"] = rating
        if rating < bucket["lowest"]:
            bucket["lowest"] = rating

    # Second pass: turn each bucket into one row of the summary table.
    summary = []
    for app, bucket in grouped.items():
        ratings = bucket["ratings"]
        total_reviews = len(ratings)
        average = sum(ratings) / total_reviews if total_reviews else 0
        summary.append(
            {
                "app": app,
                "highest_rating": bucket["highest"],
                "lowest_rating": bucket["lowest"],
                "average_rating": round(average, 2),
                "total_reviews": total_reviews,
            }
        )

    # Sort alphabetically (case-insensitive) so the CSV is easy to scan.
    summary.sort(key=lambda row: row["app"].lower())
    return summary


def main():
    """Run end to end: hit the API, summarize per app, and write the CSV."""
    # Optional: log what the API tells us about itself, just for context.
    root_info = fetch_root()
    if root_info:
        print("API root response:")
        print(json.dumps(root_info, indent=2))
        print()

    # Pull every review (paginated under the hood) and summarize per app.
    reviews = fetch_all_reviews()
    print(f"Fetched {len(reviews)} reviews.\n")

    summary = summarize_by_app(reviews)

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(
            [
                "app",
                "highest_rating",
                "lowest_rating",
                "average_rating",
                "total_reviews",
            ]
        )

        for row in summary:
            print(
                f"{row['app']}: high={row['highest_rating']}, "
                f"low={row['lowest_rating']}, avg={row['average_rating']}, "
                f"total={row['total_reviews']}"
            )
            writer.writerow(
                [
                    row["app"],
                    row["highest_rating"],
                    row["lowest_rating"],
                    row["average_rating"],
                    row["total_reviews"],
                ]
            )

    print(f"\nSaved results to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
