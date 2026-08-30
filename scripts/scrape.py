"""Fetch the latest Daily Grand draws from LotteryExtreme and append new ones to the CSV.

Ports the parsing logic from data_manager.ipynb to run unattended against the live
page instead of pasted text. Safe to run repeatedly - duplicates are skipped.
"""
import os
import re
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests

URL = "https://www.lotteryextreme.com/canada/dailygrand-winningnumbers"
CSV_PATH = Path(__file__).resolve().parent.parent / "daily_grand_results.csv"
COLUMN_ORDER = ["day", "month", "year", "dn_1", "dn_2", "dn_3", "dn_4", "dn_5", "grand_number"]

# Each draw renders as a <ul class='displayball'> holding six <li> numbers
# (5 main + grand, in draw order), preceded somewhere above it by the draw's
# ISO date in parens. Rather than one regex spanning from a date to a list --
# which silently shears date onto the *next* block's numbers if a block ever
# renders without its list -- we locate the lists and the dates separately and
# bind each list to the nearest date *above* it. A missing piece then drops
# that one draw instead of corrupting every draw after it.
BALL_LIST_RE = re.compile(r"<ul class='displayball'[^>]*>(.*?)</ul>", re.DOTALL)
DATE_RE = re.compile(r"\((\d{4}-\d{2}-\d{2})[^)]*\)")
NUMBER_RE = re.compile(r"<li[^>]*>\s*(\d+)")

# If the newest draw in the CSV is older than this, the scraper is silently
# failing (or the source page has gone stale) and the run should shout.
# Daily Grand draws Mon/Thu, so a healthy gap is never more than ~4 days.
MAX_STALE_DAYS = 8


def fetch_html() -> str:
    resp = requests.get(
        URL,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.text


def parse_draws(html: str) -> pd.DataFrame:
    # Every date position on the page, so each ball list can be bound to the
    # closest one that precedes it.
    date_positions = [(m.start(), m.group(1)) for m in DATE_RE.finditer(html)]

    records = []
    seen_dates = set()
    for ul in BALL_LIST_RE.finditer(html):
        nums = [int(n) for n in NUMBER_RE.findall(ul.group(1))]
        if len(nums) != 6:
            continue
        preceding = [d for pos, d in date_positions if pos < ul.start()]
        if not preceding:
            continue
        date_str = preceding[-1]
        # A date owns exactly one draw. A repeat means the page rendered
        # something unexpected; skip it rather than inventing a draw.
        if date_str in seen_dates:
            print(f"Skipping second ball list under {date_str} - unexpected page layout.", file=sys.stderr)
            continue
        seen_dates.add(date_str)
        draw_date = datetime.strptime(date_str, "%Y-%m-%d")
        records.append({
            "day": draw_date.day,
            "month": draw_date.month,
            "year": draw_date.year,
            "dn_1": nums[0], "dn_2": nums[1], "dn_3": nums[2],
            "dn_4": nums[3], "dn_5": nums[4], "grand_number": nums[5],
        })
    return pd.DataFrame(records, columns=COLUMN_ORDER)


def check_freshness(combined: pd.DataFrame) -> None:
    """Fail loudly if the dataset has stopped moving. A scraper that finds
    blocks but never adds rows looks identical to a quiet non-draw day, which
    is how a 10-day stall once went unnoticed with every run green."""
    latest = combined.sort_values(by=["year", "month", "day"], ascending=False).iloc[0]
    latest_date = datetime(int(latest["year"]), int(latest["month"]), int(latest["day"]))
    stale_days = (datetime.now() - latest_date).days
    if stale_days > MAX_STALE_DAYS:
        print(
            f"::error::Newest draw on record is {latest_date:%Y-%m-%d}, {stale_days} days old "
            f"(max {MAX_STALE_DAYS}). The scraper is not picking up new draws.",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"Freshness OK - newest draw {latest_date:%Y-%m-%d} ({stale_days} day(s) old).")


def main() -> None:
    scraped = parse_draws(fetch_html())
    if scraped.empty:
        print("No draw blocks found on the page - site layout may have changed.", file=sys.stderr)
        set_output(False, 0)
        sys.exit(1)

    existing = pd.read_csv(CSV_PATH) if CSV_PATH.exists() else pd.DataFrame(columns=COLUMN_ORDER)

    # Dedupe on the date alone: one draw per date, existing rows win. Deduping
    # on the full row instead let a correctly-numbered row carrying the WRONG
    # date slip in as new, which is how a phantom draw once entered the CSV.
    combined = pd.concat([existing, scraped], ignore_index=True)
    combined.drop_duplicates(subset=["year", "month", "day"], keep="first", inplace=True)
    combined.sort_values(by=["year", "month", "day"], ascending=False, inplace=True)
    combined = combined[COLUMN_ORDER]

    added = len(combined) - len(existing)
    combined.to_csv(CSV_PATH, index=False)

    print(f"Scraped {len(scraped)} draw(s) from the page.")
    print(f"{added} new row(s) added. Dataset now has {len(combined)} row(s).")
    check_freshness(combined)
    set_output(added > 0, added)


def set_output(new_draws: bool, added: int) -> None:
    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a") as f:
            f.write(f"new_draws={'true' if new_draws else 'false'}\n")
            f.write(f"added={added}\n")


if __name__ == "__main__":
    main()
