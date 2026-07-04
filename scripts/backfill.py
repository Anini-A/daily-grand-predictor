"""One-off utility: backfill future_draws.csv with walk-forward predictions
for recent historical draws that predate automated predictions, so the
dashboard's history table has a "Predicted" value for every visible row.

Each backfilled prediction trains only on draws strictly before it (via
predict.train_and_predict's target_idx) - a genuine walk-forward prediction,
not hindsight, since it can't see the draw it's predicting.

Usage: python scripts/backfill.py [n]   (n = how many recent draws to fill, default 25)
"""
import sys
from datetime import datetime

import pandas as pd

import predict

N_DEFAULT = 25


def main(n=N_DEFAULT):
    df = pd.read_csv(predict.CSV_PATH).sort_values(by=["year", "month", "day"]).reset_index(drop=True)

    existing_dates = set()
    if predict.FUTURE_PATH.exists():
        preds = pd.read_csv(predict.FUTURE_PATH)
        existing_dates = set(pd.to_datetime(preds["Next Draw Date"]).dt.strftime("%Y-%m-%d"))

    start = max(22, len(df) - n)
    targets = []
    for idx in range(start, len(df)):
        row = df.iloc[idx]
        date = datetime(int(row["year"]), int(row["month"]), int(row["day"]))
        if date.strftime("%Y-%m-%d") not in existing_dates:
            targets.append(idx)

    if not targets:
        print("Nothing to backfill - all recent draws already have predictions.")
        return

    print(f"Backfilling {len(targets)} draw(s)...")
    for i, idx in enumerate(targets, 1):
        row = df.iloc[idx]
        date = datetime(int(row["year"]), int(row["month"]), int(row["day"]))
        res = predict.train_and_predict(df, target_idx=idx)
        predict.save_prediction(date, res)
        print(f"  [{i}/{len(targets)}] {date.strftime('%Y-%m-%d')}: {res[:5]} + Grand {res[5]}")

    print("Done.")


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else N_DEFAULT
    main(n)
