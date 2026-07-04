"""Non-interactive port of dg_runner.ipynb: train the ensemble, predict the next Daily
Grand draw, run the honest audit vs. a random baseline, and write JSON for the
dashboard. Model math is unchanged from the notebook - this just drops ipywidgets/
display calls and writes machine-readable output instead.
"""
import json
from collections import Counter
from datetime import datetime, timedelta
from math import comb
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, StackingRegressor
from sklearn.linear_model import RidgeCV
from sklearn.multioutput import MultiOutputRegressor

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "daily_grand_results.csv"
FUTURE_PATH = ROOT / "future_draws.csv"
DOCS_DATA = ROOT / "docs" / "data"

NUMBER_COLS = ["dn_1", "dn_2", "dn_3", "dn_4", "dn_5", "grand_number"]
MAIN_COLS = ["dn_1", "dn_2", "dn_3", "dn_4", "dn_5"]

RNG = np.random.default_rng(2026)
N_BASELINE_TICKETS = 1000
CHANCE_EXPECTATION = sum(k * comb(5, k) * comb(44, 5 - k) / comb(49, 5) for k in range(6))  # 0.5102
PER_DRAW_STD = 0.6577  # hypergeometric std of matches for one draw


def get_gap_stats(df, current_idx):
    history = df.iloc[:current_idx][MAIN_COLS].values
    gaps = {}
    for n in range(1, 50):
        found = False
        for i, draw in enumerate(reversed(history)):
            if n in draw:
                gaps[n] = i
                found = True
                break
        if not found:
            gaps[n] = len(history)
    return gaps


def add_multi_scale_features(df, current_idx, window_small=3, window_med=22):
    features = []
    past_small = df.iloc[current_idx - window_small: current_idx][NUMBER_COLS].values.flatten()
    features.extend(past_small)
    past_med = df.iloc[current_idx - window_med: current_idx][MAIN_COLS]
    features.append(past_med.values.mean())
    features.append(past_med.values.std())
    recent_gaps = get_gap_stats(df, current_idx)
    old_gaps = get_gap_stats(df, max(0, current_idx - 10))
    features.append(np.mean(list(recent_gaps.values())) - np.mean(list(old_gaps.values())))
    history_recent = df.iloc[max(0, current_idx - 50):current_idx][MAIN_COLS].values.flatten()
    freq_map = Counter(history_recent)
    for num in df.iloc[current_idx - 1][MAIN_COLS]:
        features.append(freq_map.get(num, 0))
    return np.array(features)


def refine_prediction(pred):
    main = []
    for val in np.sort(pred[:5]):
        val = int(round(val))
        while val in main or val < 1 or val > 49:
            val = val + 1 if val < 49 else val - 1
        main.append(val)
    grand = int(max(1, min(7, round(pred[5]))))
    return sorted(main) + [grand]


def build_model():
    estimators = [
        ("gb", GradientBoostingRegressor(n_estimators=100, max_depth=3, learning_rate=0.07, random_state=42)),
        ("rf", RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)),
    ]
    if HAS_XGB:
        estimators.append(("xgb", XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.07, verbosity=0)))
    return MultiOutputRegressor(StackingRegressor(estimators=estimators, final_estimator=RidgeCV(), n_jobs=-1))


def train_and_predict(df):
    X, y = [], []
    for i in range(22, len(df)):
        X.append(add_multi_scale_features(df, i))
        y.append(df.iloc[i][NUMBER_COLS].values)
    X, y = np.array(X), np.array(y)

    model = build_model()
    model.fit(X, y)

    next_feat = add_multi_scale_features(df, len(df)).reshape(1, -1)
    return refine_prediction(model.predict(next_feat)[0])


def next_target_date(df):
    last_row = df.iloc[-1]
    last_date = datetime(int(last_row["year"]), int(last_row["month"]), int(last_row["day"]))
    return last_date + timedelta(days=(3 if last_date.weekday() < 3 else 4))


def save_prediction(target_date, res):
    new_row = pd.DataFrame([{
        "Next Draw Date": target_date.strftime("%Y-%m-%d"),
        "dn_1": res[0], "dn_2": res[1], "dn_3": res[2], "dn_4": res[3], "dn_5": res[4],
        "grand_number": res[5],
    }])
    if FUTURE_PATH.exists():
        existing = pd.read_csv(FUTURE_PATH)
        existing["Next Draw Date"] = existing["Next Draw Date"].astype(str)
        if target_date.strftime("%Y-%m-%d") not in existing["Next Draw Date"].values:
            pd.concat([new_row, existing]).to_csv(FUTURE_PATH, index=False)
            return True
        return False
    new_row.to_csv(FUTURE_PATH, index=False)
    return True


def build_recent_draws(df, n=25):
    """All actual draws (most recent n), with a predicted overlay only where
    the AI made a prediction for that date in advance. Independent of the
    audit's matched-only scoring, so the site's history table always shows
    the latest real draws even if most of them predate automated predictions.
    """
    actuals = df.copy()
    actuals["Date"] = pd.to_datetime(actuals[["year", "month", "day"]]).dt.strftime("%Y-%m-%d")
    actuals = actuals.sort_values("Date", ascending=False).head(n)

    preds_by_date = {}
    if FUTURE_PATH.exists():
        preds = pd.read_csv(FUTURE_PATH)
        preds["Date"] = pd.to_datetime(preds["Next Draw Date"]).dt.strftime("%Y-%m-%d")
        preds_by_date = {row["Date"]: row for _, row in preds.iterrows()}

    rows = []
    for _, row in actuals.iterrows():
        date = row["Date"]
        act_main = [int(row[c]) for c in MAIN_COLS]
        act_g = int(row["grand_number"])
        pred = preds_by_date.get(date)
        if pred is not None:
            pre_main = [int(pred[f"dn_{i}"]) for i in range(1, 6)]
            pre_g = int(pred["grand_number"])
            rows.append({
                "date": date, "drawn": act_main, "predicted": pre_main,
                "model_hits": len(set(act_main) & set(pre_main)),
                "grand_predicted": pre_g, "grand_actual": act_g,
                "grand_hit": bool(act_g == pre_g),
            })
        else:
            rows.append({
                "date": date, "drawn": act_main, "predicted": None,
                "model_hits": None, "grand_predicted": None, "grand_actual": act_g,
                "grand_hit": None,
            })
    return rows


def run_audit(df):
    """Score saved past predictions against actual draws vs. a random baseline."""
    if not FUTURE_PATH.exists():
        return None

    actuals = df.copy()
    preds = pd.read_csv(FUTURE_PATH)
    actuals["Date"] = pd.to_datetime(actuals[["year", "month", "day"]]).dt.strftime("%Y-%m-%d")
    preds["Date"] = pd.to_datetime(preds["Next Draw Date"]).dt.strftime("%Y-%m-%d")
    merged = pd.merge(actuals, preds, on="Date", suffixes=("_act", "_pre"))
    if merged.empty:
        return None

    rows, model_scores, grand_hits = [], [], 0
    for _, row in merged.iterrows():
        act_main = [int(row[f"dn_{i}_act"]) for i in range(1, 6)]
        pre_main = [int(row[f"dn_{i}_pre"]) for i in range(1, 6)]
        act_g, pre_g = int(row["grand_number_act"]), int(row["grand_number_pre"])
        matches = len(set(act_main) & set(pre_main))
        model_scores.append(matches)
        grand_hits += act_g == pre_g

        sims = np.array([
            len(set(RNG.choice(np.arange(1, 50), 5, replace=False)) & set(act_main))
            for _ in range(N_BASELINE_TICKETS)
        ])
        rows.append({
            "date": row["Date"],
            "drawn": act_main,
            "predicted": pre_main,
            "model_hits": matches,
            "random_baseline": round(float(sims.mean()), 3),
            "beats_pct_random": round(float((sims < matches).mean() * 100), 1),
            "grand_predicted": pre_g,
            "grand_actual": act_g,
            "grand_hit": bool(act_g == pre_g),
        })

    n = len(model_scores)
    model_avg = float(np.mean(model_scores))
    edge = model_avg - CHANCE_EXPECTATION
    se = PER_DRAW_STD / np.sqrt(n)
    z = edge / se if se else 0.0

    if abs(z) < 2:
        verdict = "Indistinguishable from random - no statistical edge (|z| < 2), as expected for a fair lottery."
    elif z >= 2:
        verdict = f"Above chance at z={z:.2f}, but with small samples this happens by luck ~2.5% of the time and will regress toward 0.51."
    else:
        verdict = f"Below chance at z={z:.2f} - also just luck; underperformance is as common as overperformance for random picks."

    return {
        "draws_audited": n,
        "model_avg_match": round(model_avg, 3),
        "theoretical_chance": round(CHANCE_EXPECTATION, 3),
        "edge_over_chance": round(edge, 3),
        "z_score": round(float(z), 2),
        "grand_hits": grand_hits,
        "grand_hits_chance": round(n / 7, 1),
        "verdict": verdict,
        "history": sorted(rows, key=lambda r: r["date"], reverse=True),
    }


def main():
    df = pd.read_csv(CSV_PATH).sort_values(by=["year", "month", "day"]).reset_index(drop=True)

    res = train_and_predict(df)
    target_date = next_target_date(df)
    saved = save_prediction(target_date, res)

    prediction = {
        "target_date": target_date.strftime("%Y-%m-%d"),
        "numbers": res[:5],
        "grand_number": res[5],
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "newly_saved": saved,
    }
    print(f"Prediction for {prediction['target_date']}: {prediction['numbers']} + Grand {prediction['grand_number']}")
    print("Saved to future_draws.csv" if saved else "Already existed in future_draws.csv - not duplicated")

    audit = run_audit(df)
    if audit:
        print(f"Audit: {audit['draws_audited']} draws, model avg {audit['model_avg_match']}/5, z={audit['z_score']}")
        print(audit["verdict"])
    else:
        print("No overlapping past predictions to audit yet.")

    payload = audit or {}
    payload["recent_draws"] = build_recent_draws(df)
    print(f"Recent draws for history table: {len(payload['recent_draws'])} (latest {payload['recent_draws'][0]['date']})")

    DOCS_DATA.mkdir(parents=True, exist_ok=True)
    (DOCS_DATA / "prediction.json").write_text(json.dumps(prediction, indent=2))
    (DOCS_DATA / "audit.json").write_text(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
