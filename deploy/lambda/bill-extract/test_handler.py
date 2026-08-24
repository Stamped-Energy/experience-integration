"""Unit tests for bill-extract Lambda stub."""

from __future__ import annotations

import handler


def test_extract_bill_lines_returns_stub():
    lines = handler.extract_bill_lines("bills", "dhbvn/2026-08.pdf")
    assert len(lines) == 1
    assert lines[0]["source_bucket"] == "bills"
    assert lines[0]["status"] == "stub"
    assert lines[0]["rate_ref"] == "illustrative"


def test_handler_parses_s3_event():
    event = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "stamped-pilot-bills-pilot"},
                    "object": {"key": "inbox/bill.pdf"},
                }
            }
        ]
    }
    result = handler.handler(event, None)
    assert result["ok"] is True
    assert result["line_count"] == 1
    assert result["lines"][0]["source_key"] == "inbox/bill.pdf"


def test_handler_skips_malformed_records():
    result = handler.handler({"Records": [{"s3": {}}]}, None)
    assert result["line_count"] == 0
