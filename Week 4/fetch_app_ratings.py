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
    with urlopen(url, timeout=30, context=SSL_CONTEXT) as response:
        return json.load(response)


def fetch_root():
    """Call the API root so we log what the service advertises."""
    try:
        return fetch_json(ROOT_ENDPOINT)
    except Exception as exc:
        print(f"Warning: could not fetch API root ({exc}).")
        return None


def fetch_page(offset, limit):
    query = urlencode({"limit": limit, "offset": offset})
    return fetch_json(f"{REVIEWS_ENDPOINT}?{query}")


def fetch_all_reviews():
    """Page through /reviews until every record has been collected."""
    all_reviews = []
    offset = 0

    while True:
        data = fetch_page(offset, PAGE_SIZE)
        reviews = data.get("reviews", [])
        all_reviews.extend(reviews)

        total = data.get("total", 0)
        returned = data.get("returned", len(reviews))

        if returned == 0 or offset + returned >= total:
            break
        offset += returned

    return all_reviews


def summarize_by_app(reviews):
    """Group reviews by app and compute rating stats for each one."""
    grouped = {}
    for review in reviews:
        app = review.get("app", "Unknown")
        rating = review.get("rating")
        if rating is None:
            continue
        bucket = grouped.setdefault(
            app, {"ratings": [], "highest": rating, "lowest": rating}
        )
        bucket["ratings"].append(rating)
        if rating > bucket["highest"]:
            bucket["highest"] = rating
        if rating < bucket["lowest"]:
            bucket["lowest"] = rating

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

    summary.sort(key=lambda row: row["app"].lower())
    return summary


def main():
    root_info = fetch_root()
    if root_info:
        print("API root response:")
        print(json.dumps(root_info, indent=2))
        print()

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
