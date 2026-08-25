#!/usr/bin/env python3
"""Seed L5 with Vinayak Plant prescriptions adapted from stamped-external catalog.

Source: external/demo-decks/prescriptions-examples.md (#1, #3, #4, #5, #7, #10)
Contract shape: external/contracts/fixtures/intelligence/prescription.valid.json

Usage (L5 API on :8080 with bootstrap key):

  set L5_BASE_URL=http://127.0.0.1:8080
  set L5_AUTH_TOKEN=stk_dev_bootstrap_key
  python scripts/seed_vinayak_l5_prescriptions.py

Idempotent on prescription id — re-ingest may bounce; wipe L5 DB to re-seed cleanly.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

ORG_ID = "org_acme"
PLANT_ID = "plant_vinayak_1"
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


def _dedupe(key: str) -> str:
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def _finding(
    finding_id: str,
    *,
    severity: str,
    category: str,
) -> dict:
    return {
        "finding_id": finding_id,
        "org_id": ORG_ID,
        "plant_id": PLANT_ID,
        "ops_clearance": {"status": "cleared", "source": "vinayak_seed"},
        "alarm_hint": {"severity": severity, "category_code": category},
    }


def _rx(
    *,
    rx_id: str,
    finding_id: str,
    what: str,
    why: str,
    who: str,
    category: str,
    inr: float,
    asset_id: str,
    priority: int,
    effort: str,
    when: str,
    waste_category: int,
    baseline_id: str = "bl-incomer-vinayak",
) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "schema_version": "1.0.0",
        "id": rx_id,
        "org_id": ORG_ID,
        "plant_id": PLANT_ID,
        "status": "open",
        "priority": priority,
        "category": category,
        "what": what,
        "why": why,
        "who": who,
        "effort": effort,
        "when": when,
        "impact": {
            "inr_monthly": inr,
            "kwh_monthly": round(inr / 6.32, 1),
            "tco2e_monthly": round(inr / 6.32 * 0.00071, 3),
            "confidence_interval": [round(inr * 0.75), round(inr * 1.15)],
        },
        "waste_category": waste_category,
        "finding_refs": [finding_id],
        "evidence_refs": [
            f"tag:{asset_id}/active_power_kw",
            f"baseline:{baseline_id}",
            "tariff:tariff-jvvnl-ht1-vinayak-2026/demand-line",
        ],
        "mv_plan": {
            "method": "option_c",
            "baseline_id": baseline_id,
            "measurement_boundary": asset_id,
            "verification_window": "P30D",
        },
        "first_recommended_at": now,
        "asset_id": asset_id,
        "value_domain": "energy_efficiency",
        "dedupe_key": _dedupe(f"{PLANT_ID}:{rx_id}:{category}"),
        "owner_role": who,
        "rule_id": f"vinayak/{category}@v1",
    }


def main() -> int:
    # Catalog mapping (external prescriptions-examples.md) → Vinayak assets
    catalog = [
        {
            "finding_id": "f-vinayak-md-stagger-001",
            "severity": "critical",
            "rx": _rx(
                rx_id="rx_vinayak_md_feeder_stagger",
                finding_id="f-vinayak-md-stagger-001",
                what="Hold Feeder B restart ~10 minutes until Feeder A ramp settles under 95% of its step.",
                why="Two heavy feeders co-started inside the same 15-min MD window on the HT incomer — peak stacks before the bill shows which machines overlapped.",
                who="electrical_supervisor",
                category="md_overlap",
                inr=95_000,
                asset_id="feeder_b",
                priority=1,
                effort="low_schedule_change",
                when="next_morning_ramp",
                waste_category=1,
            ),
        },
        {
            "finding_id": "f-vinayak-compressor-003",
            "severity": "warning",
            "rx": _rx(
                rx_id="rx_vinayak_compressor_filter",
                finding_id="f-vinayak-compressor-003",
                what="Inspect Compressor 1 inlet filter and unload valve in the next low-load window.",
                why="Specific power (kW per Nm³/min) drifted upward while plant air demand was flat — classic filter / unload-valve drift pattern.",
                who="maintenance_supervisor",
                category="compressor_sp_drift",
                inr=38_000,
                asset_id="compressor_1",
                priority=2,
                effort="inspect_and_clean",
                when="next_low_load_window",
                waste_category=2,
            ),
        },
        {
            "finding_id": "f-vinayak-idle-line-004",
            "severity": "warning",
            "rx": _rx(
                rx_id="rx_vinayak_line_idle_aux",
                finding_id="f-vinayak-idle-line-004",
                what="Switch off Production Line 1 aux packs when the line has not run for 20 minutes.",
                why="Line aux draw stays high during idle gaps — packaging/utilities still on while the line is stopped.",
                who="production_supervisor",
                category="idle_load",
                inr=52_000,
                asset_id="line_1",
                priority=2,
                effort="sequence_interlock",
                when="this_week",
                waste_category=1,
            ),
        },
        {
            "finding_id": "f-vinayak-hvac-tod-005",
            "severity": "error",
            "rx": _rx(
                rx_id="rx_vinayak_hvac_tod_shift",
                finding_id="f-vinayak-hvac-tod-005",
                what="Start Process HVAC / batch cooling later into the shoulder ToD band — batch still finishes on time.",
                why="HVAC warm-up overlaps peak ToD even when occupancy and cooling load are low.",
                who="hvac_technician",
                category="tod_exposure",
                inr=44_000,
                asset_id="hvac_1",
                priority=2,
                effort="schedule_change",
                when="next_batch_cycle",
                waste_category=1,
            ),
        },
        {
            "finding_id": "f-vinayak-furnace-007",
            "severity": "critical",
            "rx": _rx(
                rx_id="rx_vinayak_furnace_holding",
                finding_id="f-vinayak-furnace-007",
                what="Reduce Holding Furnace 1 set-point / holding power when the downstream roll is delayed 45+ minutes.",
                why="Furnace holding kW stays elevated overnight and during line delays — thermal idle waste on Feeder A.",
                who="process_engineer",
                category="furnace_holding",
                inr=61_000,
                asset_id="furnace_1",
                priority=1,
                effort="setpoint_and_interlock",
                when="next_delay_event",
                waste_category=1,
            ),
        },
        {
            "finding_id": "f-vinayak-pump-010",
            "severity": "warning",
            "rx": _rx(
                rx_id="rx_vinayak_cw_pump_recirc",
                finding_id="f-vinayak-pump-010",
                what="Check CW Pump P-12 — valve may be stuck recirculating; verify differential and valve position.",
                why="Pump power stays high while process cooling demand is flat — likely recirculation / stuck valve.",
                who="maintenance_supervisor",
                category="abnormal_duty",
                inr=27_000,
                asset_id="pump_cw_12",
                priority=3,
                effort="inspect_and_tune",
                when="this_week",
                waste_category=2,
            ),
        },
    ]

    print(f"Seeding {len(catalog)} Vinayak findings + prescriptions into {BASE} …")
    for item in catalog:
        finding = _finding(
            item["finding_id"],
            severity=item["severity"],
            category=item["rx"]["category"],
        )
        fr = _post("/v1/fixtures/findings", finding)
        print(json.dumps({"finding": fr}, indent=2))
        result = _post("/v1/prescriptions/ingest", item["rx"])
        print(
            json.dumps(
                {"prescription_id": item["rx"]["id"], "result": result},
                indent=2,
            )
        )

    # Drive one Rx toward verified savings so Overview "Confirmed savings" can fill.
    verify_id = "rx_vinayak_cw_pump_recirc"
    try:
        _post(
            f"/v1/prescriptions/{verify_id}/transition",
            {
                "org_id": ORG_ID,
                "plant_id": PLANT_ID,
                "to_status": "in_progress",
                "actor_type": "human",
                "actor_id": "seed_vinayak",
            },
        )
        _post(
            f"/v1/prescriptions/{verify_id}/transition",
            {
                "org_id": ORG_ID,
                "plant_id": PLANT_ID,
                "to_status": "done",
                "actor_type": "human",
                "actor_id": "seed_vinayak",
            },
        )
        vr = _post(
            f"/v1/prescriptions/{verify_id}/verify",
            {
                "org_id": ORG_ID,
                "plant_id": PLANT_ID,
                "finding_ids": ["f-vinayak-pump-010"],
            },
        )
        print(json.dumps({"verify": verify_id, "result": vr}, indent=2))
    except SystemExit as exc:
        print(
            f"NOTE: verify path skipped for {verify_id} ({exc}). "
            "OPEN Rx + alarms still seed Overview; run verify manually if needed.",
            file=sys.stderr,
        )

    print(
        "Done. List via "
        f"GET /v1/plants/{PLANT_ID}/prescriptions?org_id={ORG_ID} "
        f"and /v1/plants/{PLANT_ID}/alarms?org_id={ORG_ID}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
