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

# Matches one draw block: an ISO date in parens, followed by the six numbers inside
# the <ul class='displayball'> list (5 main numbers + grand number, in draw order).
DRAW_BLOCK_RE = re.compile(
    r"Daily Grand.*?\((\d{4}-\d{2}-\d{2})[^)]*\).*?<ul class='displayball'[^>]*>(.*?)</ul>",
    re.DOTALL,
)
NUMBER_RE = re.compile(r"<li[^>]*>\s*(\d+)")


def fetch_html() -> str:
    resp = requests.get(
        URL,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.text


def parse_draws(html: str) -> pd.DataFrame:
    records = []
    for date_str, ul_content in DRAW_BLOCK_RE.findall(html):
        nums = [int(n) for n in NUMBER_RE.findall(ul_content)]
        if len(nums) != 6:
            continue
        draw_date = datetime.strptime(date_str, "%Y-%m-%d")
        records.append({
            "day": draw_date.day,
            "month": draw_date.month,
            "year": draw_date.year,
            "dn_1": nums[0], "dn_2": nums[1], "dn_3": nums[2],
            "dn_4": nums[3], "dn_5": nums[4], "grand_number": nums[5],
        })
    return pd.DataFrame(records, columns=COLUMN_ORDER)


def main() -> None:
    scraped = parse_draws(fetch_html())
    if scraped.empty:
        print("No draw blocks found on the page - site layout may have changed.", file=sys.stderr)
        set_output(False, 0)
        sys.exit(1)

    existing = pd.read_csv(CSV_PATH) if CSV_PATH.exists() else pd.DataFrame(columns=COLUMN_ORDER)

    combined = pd.concat([scraped, existing], ignore_index=True)
    combined.drop_duplicates(subset=COLUMN_ORDER, inplace=True)
    combined.sort_values(by=["year", "month", "day"], ascending=False, inplace=True)
    combined = combined[COLUMN_ORDER]

    added = len(combined) - len(existing)
    combined.to_csv(CSV_PATH, index=False)

    print(f"Scraped {len(scraped)} draw(s) from the page.")
    print(f"{added} new row(s) added. Dataset now has {len(combined)} row(s).")
    set_output(added > 0, added)


def set_output(new_draws: bool, added: int) -> None:
    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a") as f:
            f.write(f"new_draws={'true' if new_draws else 'false'}\n")
            f.write(f"added={added}\n")


if __name__ == "__main__":
    main()
