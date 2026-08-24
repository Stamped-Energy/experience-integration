"""S3 → BillLine extract Lambda (Phase H scaffold).

Triggered by S3 ObjectCreated on the bills bucket. Parses a DHBVN (or
compatible) bill PDF/CSV and emits BillLine records for L2/L5 consumption.

This stub validates the event shape and returns a placeholder payload.
Replace `extract_bill_lines` with real PDF parsing before pilot cutover.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Downstream post URL (L2 ingest or internal API) — from env / SSM in real deploy.
BILL_LINES_POST_URL = os.environ.get("BILL_LINES_POST_URL", "")


def extract_bill_lines(bucket: str, key: str, *, content_type: str | None = None) -> list[dict[str, Any]]:
    """Return BillLine-shaped dicts. Stub: one illustrative line."""
    _ = content_type
    return [
        {
            "source_bucket": bucket,
            "source_key": key,
            "line_id": "stub-1",
            "description": "placeholder — replace with DHBVN extract",
            "amount_inr": None,
            "rate_ref": "illustrative",
            "status": "stub",
        }
    ]


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """AWS Lambda entrypoint for S3 notifications."""
    _ = context
    records = event.get("Records") or []
    lines: list[dict[str, Any]] = []

    for rec in records:
        s3 = rec.get("s3") or {}
        bucket = (s3.get("bucket") or {}).get("name")
        key = (s3.get("object") or {}).get("key")
        if not bucket or not key:
            logger.warning("skipping record without bucket/key: %s", json.dumps(rec)[:200])
            continue
        extracted = extract_bill_lines(bucket, key)
        lines.extend(extracted)
        logger.info("extracted %d line(s) from s3://%s/%s", len(extracted), bucket, key)

    # Real deploy: POST lines to BILL_LINES_POST_URL with IAM auth / service key.
    if BILL_LINES_POST_URL and lines:
        logger.info("would POST %d lines to %s", len(lines), BILL_LINES_POST_URL)

    return {
        "ok": True,
        "line_count": len(lines),
        "lines": lines,
    }
