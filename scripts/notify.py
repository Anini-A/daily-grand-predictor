"""Email the latest prediction. Reads docs/data/prediction.json (written by
predict.py) and sends via Gmail SMTP using an App Password.

Required environment variables: GMAIL_ADDRESS, GMAIL_APP_PASSWORD, NOTIFY_EMAIL.
Optional: DASHBOARD_URL (linked in the email body; defaults to the live site).
"""
import json
import os
import smtplib
import sys
from email.mime.text import MIMEText
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DATA = ROOT / "docs" / "data"

DEFAULT_DASHBOARD_URL = "https://daily-grand-predictor.vercel.app"


def build_body(prediction: dict, dashboard_url: str) -> str:
    numbers = " - ".join(str(n) for n in prediction["numbers"])
    lines = [
        f"Next Daily Grand draw: {prediction['target_date']}",
        f"Predicted numbers: {numbers}",
        f"Predicted Grand Number: {prediction['grand_number']}",
        "",
        "This is a fair, independent lottery draw - treat this as a fun pick, not a real edge.",
        "",
        f"Dashboard: {dashboard_url}",
    ]
    return "\n".join(lines)


def main() -> None:
    pred_path = DOCS_DATA / "prediction.json"
    if not pred_path.exists():
        print("No prediction.json found - nothing to notify.", file=sys.stderr)
        sys.exit(1)

    prediction = json.loads(pred_path.read_text())

    sender = os.environ["GMAIL_ADDRESS"]
    app_password = os.environ["GMAIL_APP_PASSWORD"]
    recipient = os.environ["NOTIFY_EMAIL"]
    dashboard_url = os.environ.get("DASHBOARD_URL") or DEFAULT_DASHBOARD_URL
    dashboard_url = dashboard_url.rstrip("/")

    msg = MIMEText(build_body(prediction, dashboard_url))
    msg["Subject"] = f"Daily Grand pick for {prediction['target_date']}: {' '.join(map(str, prediction['numbers']))} + {prediction['grand_number']}"
    msg["From"] = sender
    msg["To"] = recipient

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender, app_password)
        server.send_message(msg)

    print(f"Notification sent to {recipient}.")


if __name__ == "__main__":
    main()
