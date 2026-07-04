"""Descriptive historical stats for the dashboard: a "lucky number," hot/cold
numbers, and hot pairs. Pure counting over daily_grand_results.csv - no ML,
cheap enough to run on every pipeline invocation.
"""
import json
from collections import Counter
from itertools import combinations
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "daily_grand_results.csv"
DOCS_DATA = ROOT / "docs" / "data"

MAIN_COLS = ["dn_1", "dn_2", "dn_3", "dn_4", "dn_5"]
TOP_N = 8
TOP_PAIRS = 5


def main() -> None:
    df = pd.read_csv(CSV_PATH)
    n_draws = len(df)

    main_numbers = df[MAIN_COLS].values.flatten()
    main_counts = Counter(int(n) for n in main_numbers)
    grand_counts = Counter(int(n) for n in df["grand_number"].values)

    ranked_main = main_counts.most_common()
    lucky_number, lucky_number_count = ranked_main[0]
    lucky_grand, lucky_grand_count = grand_counts.most_common(1)[0]

    hot_numbers = [{"number": n, "count": c} for n, c in ranked_main[:TOP_N]]
    cold_numbers = [{"number": n, "count": c} for n, c in ranked_main[-TOP_N:][::-1]]

    pair_counts = Counter()
    for row in df[MAIN_COLS].values:
        for a, b in combinations(sorted(int(x) for x in row), 2):
            pair_counts[(a, b)] += 1
    hot_pairs = [
        {"numbers": [a, b], "count": c}
        for (a, b), c in pair_counts.most_common(TOP_PAIRS)
    ]

    stats = {
        "draws_analyzed": n_draws,
        "lucky_number": lucky_number,
        "lucky_number_count": lucky_number_count,
        "lucky_number_pct": round(lucky_number_count / n_draws * 100, 1),
        "lucky_grand": lucky_grand,
        "lucky_grand_count": lucky_grand_count,
        "lucky_grand_pct": round(lucky_grand_count / n_draws * 100, 1),
        "hot_numbers": hot_numbers,
        "cold_numbers": cold_numbers,
        "hot_pairs": hot_pairs,
    }

    print(f"Lucky number: {lucky_number} ({lucky_number_count}/{n_draws} draws)")
    print(f"Lucky Grand Number: {lucky_grand} ({lucky_grand_count}/{n_draws} draws)")
    print(f"Top hot pair: {hot_pairs[0]['numbers']} together {hot_pairs[0]['count']} times")

    DOCS_DATA.mkdir(parents=True, exist_ok=True)
    (DOCS_DATA / "stats.json").write_text(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
