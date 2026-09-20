#!/usr/bin/env python3
"""Fail if this repo's core sources hard-code LNM identity.

Allowlist: site packs, site fixtures, files named *lnm*, external/.
Canon: docs/PRODUCT_LAYERS.md (workspace) / knowledge-reasoning/docs/PRODUCT_LAYERS.md

Run from repo root:
  python scripts/check-core-site-identity.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEEDLES = ("plant_lnm_faridabad_1", "CNC_14")
SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    "external",
    "dist",
    ".next",
    "__pycache__",
    "site-lnm-mtlinki",
    "site-lnm-faridabad",
    "sites",
    ".venv",
    "venv",
    "coverage",
}
CORE_REL_HINTS = (
    "/src/",
    "\\src\\",
    "/packages/tag-mapping-api/",
    "/packages/edge-agent/",
    "/packages/seed/",
    "/packages/api/src/",
    "/packages/web/src/lib/",
    "/packages/web/src/components/",
)
SKIP_PATH_SUBSTR = (
    "/fixtures/sites/",
    "\\fixtures\\sites\\",
    "/sites/",
    "\\sites\\",
    "test_lnm",
    "seed_lnm",
    "lnm_five",
    "sql_loader",
    "check-core-site-identity",
)
SKIP_SUFFIXES = {".png", ".jpg", ".webp", ".pdf", ".lock", ".csv", ".sqlite", ".map"}


def _is_core(path: Path) -> bool:
    s = str(path)
    return any(h in s for h in CORE_REL_HINTS)


def main() -> int:
    hits: list[str] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
        for name in filenames:
            path = Path(dirpath) / name
            if "lnm" in name.lower():
                continue
            if path.suffix.lower() in SKIP_SUFFIXES:
                continue
            s = str(path)
            if any(x in s for x in SKIP_PATH_SUBSTR):
                continue
            if not _is_core(path):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            for needle in NEEDLES:
                if needle not in text:
                    continue
                hits.append(f"{path.relative_to(ROOT)}: {needle}")
                break
    if hits:
        print("LNM identity leaked into core sources (see docs/PRODUCT_LAYERS.md):")
        for h in hits[:80]:
            print(f"  {h}")
        if len(hits) > 80:
            print(f"  ... {len(hits) - 80} more")
        return 1
    print("ok — no LNM identity in scanned core sources")
    return 0


if __name__ == "__main__":
    sys.exit(main())
