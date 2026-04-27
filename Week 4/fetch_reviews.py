"""
Fetch app review data from the HCDE 530 Week 4 API, print the category and
helpful vote count for each review, and save the results to a CSV file.

API docs: https://brockcraft.github.io/docs/hcde530_api_documentation.html

Uses only the Python standard library (urllib + csv), so no pip installs
are required.
"""

import csv
import json
import os
import ssl
from urllib.parse import urlencode
from urllib.request import urlopen

BASE_URL = "https://hcde530-week4-api.onrender.com"
REVIEWS_ENDPOINT = f"{BASE_URL}/reviews"
OUTPUT_CSV = "reviews_category_helpful_votes.csv"
PAGE_SIZE = 100


def build_ssl_context():
    """Return an SSL context that trusts a working CA bundle.

    Homebrew's Python on macOS sometimes ships without CA roots wired into
    the default context, which causes CERTIFICATE_VERIFY_FAILED errors. We
    fall back to well-known CA bundle locations if that happens.
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


def fetch_page(offset, limit):
    """Fetch a single page of reviews from the API."""
    query = urlencode({"limit": limit, "offset": offset})
    url = f"{REVIEWS_ENDPOINT}?{query}"
    with urlopen(url, timeout=30, context=SSL_CONTEXT) as response:
        return json.load(response)


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


def main():
    reviews = fetch_all_reviews()
    print(f"Fetched {len(reviews)} reviews.\n")

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["id", "app", "category", "helpful_votes"])

        for review in reviews:
            review_id = review.get("id", "")
            app = review.get("app", "")
            category = review.get("category", "")
            helpful_votes = review.get("helpful_votes", 0)

            print(f"Category: {category} | Helpful votes: {helpful_votes}")

            writer.writerow([review_id, app, category, helpful_votes])

    print(f"\nSaved results to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
