"""
SMA Scheduler – déclenche périodiquement les tâches de calcul, génération et envoi.

Tâches :
  06h00  → POST /v1/due-items/compute       (recalcul des échéances)
  06h30  → POST /v1/reminder-jobs/generate   (génération des jobs de relance)
  */15m  → POST /v1/reminder-jobs/send-pending (envoi des relances prêtes)
"""

import os
import time
import logging
import threading
from datetime import datetime, timedelta

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sma-scheduler")

BACKEND_URL = os.environ.get("BACKEND_URL", "http://sma-backend:8000")
SCHEDULER_KEY = os.environ.get("SCHEDULER_KEY", "")

HEADERS = {
    "Content-Type": "application/json",
}
if SCHEDULER_KEY:
    HEADERS["X-Scheduler-Key"] = SCHEDULER_KEY


def call_endpoint(path: str, description: str) -> None:
    url = f"{BACKEND_URL}{path}"
    logger.info("→ %s  %s", description, url)
    try:
        resp = requests.post(url, headers=HEADERS, timeout=120)
        resp.raise_for_status()
        logger.info("  ✓ %s – %s", resp.status_code, resp.json())
    except Exception as exc:
        logger.error("  ✗ %s – %s", description, exc)


def run_daily(hour: int, minute: int, task_fn, description: str) -> None:
    """Execute task_fn every day at HH:MM UTC."""
    while True:
        now = datetime.utcnow()
        target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        wait = (target - now).total_seconds()
        logger.info("⏳ %s scheduled at %s (in %.0fs)", description, target.isoformat(), wait)
        time.sleep(wait)
        task_fn()


def run_interval(seconds: int, task_fn, description: str) -> None:
    """Execute task_fn every N seconds."""
    while True:
        task_fn()
        logger.info("⏳ %s next in %ds", description, seconds)
        time.sleep(seconds)


def main() -> None:
    logger.info("SMA Scheduler starting – backend=%s", BACKEND_URL)

    threads = [
        threading.Thread(
            target=run_daily,
            args=(6, 0, lambda: call_endpoint("/v1/due-items/compute", "Compute due items"), "compute"),
            daemon=True,
        ),
        threading.Thread(
            target=run_daily,
            args=(6, 30, lambda: call_endpoint("/v1/reminder-jobs/generate", "Generate reminder jobs"), "generate"),
            daemon=True,
        ),
        threading.Thread(
            target=run_interval,
            args=(900, lambda: call_endpoint("/v1/reminder-jobs/send-pending", "Send pending reminders"), "send-pending"),
            daemon=True,
        ),
    ]

    for t in threads:
        t.start()

    # Keep main thread alive
    while True:
        time.sleep(3600)


if __name__ == "__main__":
    main()
