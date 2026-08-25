#!/usr/bin/env python3
"""Seed L5 with sample LNM Factory 1 prescriptions + alarms for L6 live demos.

Usage (L5 API running on :8080 with bootstrap key):

  set L5_BASE_URL=http://127.0.0.1:8080
  set L5_AUTH_TOKEN=stk_dev_bootstrap_key
  python scripts/seed_lnm_l5_prescriptions.py

Idempotent on prescription id — re-ingest may bounce; safe to re-run after wipe.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

ORG_ID = "org_acme"
PLANT_ID = "plant_lnm_faridabad_1"
BASE = os.environ.get("L5_BASE_URL", "http://127.0.0.1:8080").rstrip("/")
TOKEN = os.environ.get("L5_AUTH_TOKEN", "stk_dev_bootstrap_key")


def _post(path: str, body: dict) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": TOKEN,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code} {path}: {detail}") from exc


def _rx(
    *,
    rx_id: str,
    title: str,
    category: str,
    inr: float,
    asset_id: str,
    priority: int = 2,
) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "id": rx_id,
        "org_id": ORG_ID,
        "plant_id": PLANT_ID,
        "status": "OPEN",
        "priority": priority,
        "category": category,
        "owner_role": "supervisor",
        "what": title,
        "why": f"CNC idle/aux waste detected on {asset_id} during seeded LNM window",
        "who": "Plant supervisor",
        "when": "This week",
        "effort": "Sequence / setpoint change · no new equipment",
        "impact": {
            "inr_monthly": inr,
            "kwh_monthly": round(inr / 8.0, 1),
            "tco2e_monthly": round(inr / 8.0 * 0.0007, 3),
            "confidence_interval": [0.7, 0.9],
        },
        "first_recommended_at": now,
        "asset_id": asset_id,
        "value_domain": "energy_efficiency",
        "evidence_refs": [f"l2://{PLANT_ID}/{asset_id}/active_power_kw"],
        "rule_id": f"cnc/{category}@v1",
    }


def main() -> int:
    prescriptions = [
        _rx(
            rx_id="rx_lnm_idle_vtl01",
            title="Cut CNC VTL-01 idle-aux coolant draw outside OPERATE",
            category="idle_load",
            inr=42_000,
            asset_id="cnc_vtl_01",
            priority=1,
        ),
        _rx(
            rx_id="rx_lnm_alarm_hmc01",
            title="Clear HMC-01 alarm hold and restore productive spindle duty",
            category="abnormal_duty",
            inr=28_500,
            asset_id="cnc_hmc_01",
            priority=2,
        ),
        _rx(
            rx_id="rx_lnm_sec_lathe01",
            title="Investigate lathe-01 SEC drift vs cell baseline",
            category="sec_drift",
            inr=19_200,
            asset_id="cnc_lathe_01",
            priority=3,
        ),
    ]

    print(f"Seeding {len(prescriptions)} LNM prescriptions into {BASE} …")
    for rx in prescriptions:
        result = _post("/v1/prescriptions/ingest", rx)
        print(json.dumps({"prescription_id": rx["id"], "result": result}, indent=2))

    print("Done. List via GET /v1/plants/plant_lnm_faridabad_1/prescriptions?org_id=org_acme")
    return 0


if __name__ == "__main__":
    sys.exit(main())
