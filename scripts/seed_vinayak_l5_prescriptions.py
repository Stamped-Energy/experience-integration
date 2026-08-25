#!/usr/bin/env python3
"""Seed L5 with Vinayak Plant prescriptions adapted from stamped-external catalog.

Source: external/demo-decks/prescriptions-examples.md (#1, #3, #4, #5, #7, #10)
Contract shape: external/contracts/fixtures/intelligence/prescription.valid.json

Ensures practicality-gate verbs, who_label / due_label / bill_line, and force-send
so alarms + evidence bundles exist for the L6 showcase.

Usage (L5 API on :8080 with bootstrap key):

  set L5_BASE_URL=http://127.0.0.1:8080
  set L5_AUTH_TOKEN=stk_dev_bootstrap_key
  python scripts/seed_vinayak_l5_prescriptions.py

Optional:
  set VINAYAK_SEED_FORCE=1   # always force-send after ingest (default: 1)
  set VINAYAK_SEED_VERSION=v2  # bump to rotate dedupe keys for re-seed

Plant-scoped only (org_acme / plant_vinayak_1).
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ORG_ID = "org_acme"
PLANT_ID = "plant_vinayak_1"
BASE = os.environ.get("L5_BASE_URL", "http://127.0.0.1:8080").rstrip("/")
TOKEN = os.environ.get("L5_AUTH_TOKEN", "stk_dev_bootstrap_key")
SEED_VERSION = os.environ.get("VINAYAK_SEED_VERSION", "v2")
FORCE_SEND = os.environ.get("VINAYAK_SEED_FORCE", "1") != "0"

# Plant-scoped wipe before re-seed (keeps other plants + api_keys / plant admin prefs).
_DEFAULT_L5_DB = (
    Path(__file__).resolve().parents[2]
    / "closure-verification"
    / "data"
    / "stamped_l5.db"
)
L5_SQLITE_PATH = Path(os.environ.get("L5_SQLITE_PATH", str(_DEFAULT_L5_DB)))

_PLANT_WIPE_TABLES = (
    # Child / event tables first; snapshot + workflow last.
    "outbox_delivery_attempt",
    "alarms",
    "evidence_bundle",
    "ledger_append_intent",
    "notification_log",
    "sms_notification_log",
    "scheduled_actions",
    "workflow_events",
    "verification_case",
    "opportunity_cost_mark",
    "prescription_revisions",
    "negotiation_threads",
    "improvement_signals",
    "bill_reconciliation",
    "compile_attempts",
    "pipeline_runs",
    "calibration_patches",
    "improve_cycles",
    "dead_events",
    "outbox",
    "inbox_processed",
    "workflow_state",
    "prescription_snapshot",
)

WHO_LABELS = {
    "electrical_supervisor": "Electrical supervisor (shift A)",
    "maintenance_supervisor": "Maintenance supervisor",
    "production_supervisor": "Production supervisor · Line 1",
    "hvac_technician": "HVAC technician",
    "process_engineer": "Process engineer · melt / hold",
}

DUE_LABELS = {
    "next_morning_ramp": "Next morning ramp (before 07:30 IST)",
    "next_low_load_window": "Next low-load window (tonight)",
    "this_week": "This week",
    "next_batch_cycle": "Next batch cycle",
    "next_delay_event": "Next downstream delay ≥45 min",
}


def _request(method: str, path: str, body: dict | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"X-API-Key": TOKEN}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        method=method,
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            raw = res.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} {method} {path}: {detail}") from exc


def _post(path: str, body: dict) -> dict:
    return _request("POST", path, body)


def _get(path: str) -> dict:
    return _request("GET", path)


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
    bill_line: str,
    baseline_id: str = "bl-incomer-vinayak",
    extra_evidence: list[str] | None = None,
) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    who_label = WHO_LABELS.get(who, who.replace("_", " ").title())
    due_label = DUE_LABELS.get(when, when.replace("_", " "))
    window_to = datetime.now(timezone.utc)
    window_from = window_to - timedelta(hours=6)
    win = f"{window_from.strftime('%Y-%m-%dT%H:%M:%SZ')}/{window_to.strftime('%Y-%m-%dT%H:%M:%SZ')}"
    evidence_refs = [
        f"tag:{asset_id}/active_power_kw?window={win}",
        f"baseline:{baseline_id}",
        "tariff:tariff-jvvnl-ht1-vinayak-2026/demand-line",
        f"finding:{finding_id}",
    ]
    if extra_evidence:
        evidence_refs.extend(extra_evidence)
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
        "who_label": who_label,
        "effort": effort,
        "when": when,
        "due_label": due_label,
        "bill_line": bill_line,
        "impact": {
            "inr_monthly": inr,
            "kwh_monthly": round(inr / 6.32, 1),
            "tco2e_monthly": round(inr / 6.32 * 0.00071, 3),
            "confidence": 0.82,
            "confidence_interval": [round(inr * 0.75), round(inr * 1.15)],
        },
        "waste_category": waste_category,
        "finding_refs": [finding_id],
        "evidence_refs": evidence_refs,
        "mv_plan": {
            "method": "option_c",
            "baseline_id": baseline_id,
            "measurement_boundary": asset_id,
            "verification_window": "P30D",
        },
        "first_recommended_at": now,
        "asset_id": asset_id,
        "value_domain": "energy_efficiency",
        # Versioned dedupe so re-runs with VINAYAK_SEED_VERSION can refresh payloads.
        "dedupe_key": _dedupe(f"{PLANT_ID}:{rx_id}:{category}:{SEED_VERSION}"),
        "owner_role": who,
        "rule_id": f"vinayak/{category}@v1",
    }


def _status_of(ingest_result: dict[str, Any], rx_id: str) -> str | None:
    for key in ("status", "to_status", "prescription_status"):
        val = ingest_result.get(key)
        if isinstance(val, str) and val:
            return val
    nested = ingest_result.get("prescription") or ingest_result.get("result")
    if isinstance(nested, dict):
        for key in ("status", "to_status"):
            val = nested.get(key)
            if isinstance(val, str) and val:
                return val
    try:
        detail = _get(
            f"/v1/plants/{PLANT_ID}/prescriptions/{rx_id}?org_id={ORG_ID}"
        )
        st = detail.get("status")
        return st if isinstance(st, str) else None
    except Exception:
        return None


def _force_send(rx_id: str) -> dict:
    return _post(
        f"/v1/internal/prescriptions/{rx_id}/force-send",
        {
            "org_id": ORG_ID,
            "plant_id": PLANT_ID,
            "actor_id": "seed_vinayak",
            "reason": "vinayak_showcase_seed",
            "admin_note": f"Force-send after seed {SEED_VERSION}",
        },
    )


def _cleanup_plant_sqlite() -> None:
    """Remove stale plant_vinayak_1 L5 rows so re-ingest can reuse stable Rx ids."""
    if os.environ.get("VINAYAK_SEED_SKIP_CLEANUP", "0") == "1":
        print("NOTE: skipping plant cleanup (VINAYAK_SEED_SKIP_CLEANUP=1)")
        return
    if not L5_SQLITE_PATH.is_file():
        print(
            f"NOTE: L5 sqlite not found at {L5_SQLITE_PATH}; "
            "skip cleanup (set L5_SQLITE_PATH).",
            file=sys.stderr,
        )
        return

    conn = sqlite3.connect(str(L5_SQLITE_PATH))
    try:
        existing = {
            r[0]
            for r in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        deleted: dict[str, int] = {}
        # outbox_delivery_attempt has no plant_id — prune via plant outbox ids.
        if "outbox_delivery_attempt" in existing and "outbox" in existing:
            cur = conn.execute(
                """
                DELETE FROM outbox_delivery_attempt
                WHERE outbox_id IN (
                  SELECT outbox_id FROM outbox WHERE plant_id = ?
                )
                """,
                (PLANT_ID,),
            )
            deleted["outbox_delivery_attempt"] = cur.rowcount

        for table in _PLANT_WIPE_TABLES:
            if table == "outbox_delivery_attempt":
                continue
            if table not in existing:
                continue
            cols = {
                r[1] for r in conn.execute(f"PRAGMA table_info({table})")
            }
            if "plant_id" not in cols:
                continue
            cur = conn.execute(
                f"DELETE FROM {table} WHERE plant_id = ?", (PLANT_ID,)
            )
            deleted[table] = cur.rowcount
        conn.commit()
        print(
            json.dumps(
                {
                    "cleanup": "plant_scoped",
                    "plant_id": PLANT_ID,
                    "db": str(L5_SQLITE_PATH),
                    "deleted": {k: v for k, v in deleted.items() if v},
                },
                indent=2,
            )
        )
    finally:
        conn.close()


def main() -> int:
    _cleanup_plant_sqlite()

    # Verbs chosen to pass stamped_l5_domain.gate ACTION_VERBS
    # (adjust|reduce|increase|stagger|shift|schedule|stop|start|set|lower|raise|…).
    catalog = [
        {
            "finding_id": "f-vinayak-md-stagger-001",
            "severity": "critical",
            "rx": _rx(
                rx_id="rx_vinayak_md_feeder_stagger",
                finding_id="f-vinayak-md-stagger-001",
                what=(
                    "Stagger Feeder B restart ~10 minutes until Feeder A ramp "
                    "settles under 95% of its step — avoid co-start in the same MD window."
                ),
                why=(
                    "Two heavy feeders co-started inside the same 15-min MD window on the HT "
                    "incomer — peak stacks before the bill shows which machines overlapped."
                ),
                who="electrical_supervisor",
                category="md_overlap",
                inr=95_000,
                asset_id="feeder_b",
                priority=1,
                effort="low_schedule_change",
                when="next_morning_ramp",
                waste_category=1,
                bill_line="Demand charges · HT1 Vinayak",
                extra_evidence=["tag:feeder_a/active_power_kw", "tag:incomer_1/apparent_power_kva"],
            ),
        },
        {
            "finding_id": "f-vinayak-compressor-003",
            "severity": "warning",
            "rx": _rx(
                rx_id="rx_vinayak_compressor_filter",
                finding_id="f-vinayak-compressor-003",
                what=(
                    "Adjust Compressor 1 inlet filter and unload valve in the next "
                    "low-load window — lower specific power (kW per Nm³/min)."
                ),
                why=(
                    "Specific power drifted upward while plant air demand was flat — "
                    "classic filter / unload-valve drift pattern."
                ),
                who="maintenance_supervisor",
                category="compressor_sp_drift",
                inr=38_000,
                asset_id="compressor_1",
                priority=2,
                effort="inspect_and_clean",
                when="next_low_load_window",
                waste_category=2,
                bill_line="Energy · compressor feeder",
            ),
        },
        {
            "finding_id": "f-vinayak-idle-line-004",
            "severity": "warning",
            "rx": _rx(
                rx_id="rx_vinayak_line_idle_aux",
                finding_id="f-vinayak-idle-line-004",
                what=(
                    "Stop Production Line 1 aux packs when the line has not run for "
                    "20 minutes — enable interlock to cut idle aux draw."
                ),
                why=(
                    "Line aux draw stays high during idle gaps — packaging/utilities "
                    "still on while the line is stopped."
                ),
                who="production_supervisor",
                category="idle_load",
                inr=52_000,
                asset_id="line_1",
                priority=2,
                effort="sequence_interlock",
                when="this_week",
                waste_category=1,
                bill_line="Energy · Line 1 aux",
            ),
        },
        {
            "finding_id": "f-vinayak-hvac-tod-005",
            "severity": "error",
            "rx": _rx(
                rx_id="rx_vinayak_hvac_tod_shift",
                finding_id="f-vinayak-hvac-tod-005",
                what=(
                    "Schedule Process HVAC / batch cooling later into the shoulder ToD "
                    "band — start after peak; batch still finishes on time."
                ),
                why=(
                    "HVAC warm-up overlaps peak ToD even when occupancy and cooling "
                    "load are low."
                ),
                who="hvac_technician",
                category="tod_exposure",
                inr=44_000,
                asset_id="hvac_1",
                priority=2,
                effort="schedule_change",
                when="next_batch_cycle",
                waste_category=1,
                bill_line="ToD peak · HVAC",
            ),
        },
        {
            "finding_id": "f-vinayak-furnace-007",
            "severity": "critical",
            "rx": _rx(
                rx_id="rx_vinayak_furnace_holding",
                finding_id="f-vinayak-furnace-007",
                what=(
                    "Reduce Holding Furnace 1 set-point / holding power when the "
                    "downstream roll is delayed 45+ minutes."
                ),
                why=(
                    "Furnace holding kW stays elevated overnight and during line delays — "
                    "thermal idle waste on Feeder A."
                ),
                who="process_engineer",
                category="furnace_holding",
                inr=61_000,
                asset_id="furnace_1",
                priority=1,
                effort="setpoint_and_interlock",
                when="next_delay_event",
                waste_category=1,
                bill_line="Energy · Feeder A furnace",
            ),
        },
        {
            "finding_id": "f-vinayak-pump-010",
            "severity": "warning",
            "rx": _rx(
                rx_id="rx_vinayak_cw_pump_recirc",
                finding_id="f-vinayak-pump-010",
                what=(
                    "Adjust CW Pump P-12 valve position and verify differential — "
                    "reduce recirculation if the valve is stuck."
                ),
                why=(
                    "Pump power stays high while process cooling demand is flat — "
                    "likely recirculation / stuck valve."
                ),
                who="maintenance_supervisor",
                category="abnormal_duty",
                inr=27_000,
                asset_id="pump_cw_12",
                priority=3,
                effort="inspect_and_tune",
                when="this_week",
                waste_category=2,
                bill_line="Energy · CW loop",
            ),
        },
    ]

    print(
        f"Seeding {len(catalog)} Vinayak findings + prescriptions into {BASE} "
        f"(seed={SEED_VERSION}, force_send={FORCE_SEND}) …"
    )
    for item in catalog:
        finding = _finding(
            item["finding_id"],
            severity=item["severity"],
            category=item["rx"]["category"],
        )
        try:
            fr = _post("/v1/fixtures/findings", finding)
            print(json.dumps({"finding": fr}, indent=2))
        except RuntimeError as exc:
            print(f"NOTE: finding upsert {item['finding_id']}: {exc}", file=sys.stderr)

        rx_id = item["rx"]["id"]
        try:
            result = _post("/v1/prescriptions/ingest", item["rx"])
            print(json.dumps({"prescription_id": rx_id, "ingest": result}, indent=2))
        except RuntimeError as exc:
            print(f"NOTE: ingest {rx_id}: {exc}", file=sys.stderr)
            result = {}

        status = _status_of(result, rx_id)
        # Force-send only when gate withheld / pending review (open already has alarm+evidence).
        if FORCE_SEND and status in {"withheld", "pending_stamped_review", None}:
            try:
                fs = _force_send(rx_id)
                print(
                    json.dumps(
                        {"force_send": rx_id, "status": status, "result": fs},
                        indent=2,
                    )
                )
            except RuntimeError as exc:
                print(f"NOTE: force-send {rx_id}: {exc}", file=sys.stderr)
        elif status:
            print(json.dumps({"status": rx_id, "value": status}, indent=2))

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
    except RuntimeError as exc:
        print(
            f"NOTE: verify path skipped for {verify_id} ({exc}). "
            "OPEN Rx + alarms still seed Overview.",
            file=sys.stderr,
        )

    # Smoke: list should now carry what/why after Phase 2 DTO change; print counts.
    try:
        listed = _get(f"/v1/plants/{PLANT_ID}/prescriptions?org_id={ORG_ID}")
        items = listed.get("items") or []
        seeded = [i for i in items if str(i.get("prescription_id", "")).startswith("rx_vinayak_")]
        print(
            json.dumps(
                {
                    "list_count": len(items),
                    "vinayak_seed_count": len(seeded),
                    "sample": seeded[:2],
                },
                indent=2,
            )
        )
        alarms = _get(f"/v1/plants/{PLANT_ID}/alarms?org_id={ORG_ID}")
        print(json.dumps({"alarms": len(alarms.get("items") or [])}, indent=2))
    except RuntimeError as exc:
        print(f"NOTE: post-seed list failed: {exc}", file=sys.stderr)

    print(
        "Done. List via "
        f"GET /v1/plants/{PLANT_ID}/prescriptions?org_id={ORG_ID} "
        f"and /v1/plants/{PLANT_ID}/alarms?org_id={ORG_ID}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
