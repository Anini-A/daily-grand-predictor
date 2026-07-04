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

    forever_numbers = [n for n, _ in ranked_main[:5]]
    forever_counts = [c for _, c in ranked_main[:5]]
    forever_pick = {
        "numbers": forever_numbers,
        "grand_number": lucky_grand,
        "counts": forever_counts,
        "grand_count": lucky_grand_count,
        "analysis": (
            f"Built from the 5 main numbers with the strongest historical showing "
            f"({', '.join(str(n) for n in forever_numbers)}, each appearing "
            f"{min(forever_counts)}-{max(forever_counts)} times across {n_draws} draws) "
            f"plus the most frequent Grand Number ({lucky_grand}). Daily Grand is a "
            f"fair, independent draw, so this doesn't predict anything - but if you're "
            f"committing to one combination forever, anchoring to historical frequency "
            f"is at least a reasoned starting point rather than a totally arbitrary one."
        ),
    }

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
        "forever_pick": forever_pick,
    }

    print(f"Lucky number: {lucky_number} ({lucky_number_count}/{n_draws} draws)")
    print(f"Lucky Grand Number: {lucky_grand} ({lucky_grand_count}/{n_draws} draws)")
    print(f"Top hot pair: {hot_pairs[0]['numbers']} together {hot_pairs[0]['count']} times")
    print(f"Forever pick: {forever_numbers} + Grand {lucky_grand}")

    DOCS_DATA.mkdir(parents=True, exist_ok=True)
    (DOCS_DATA / "stats.json").write_text(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
