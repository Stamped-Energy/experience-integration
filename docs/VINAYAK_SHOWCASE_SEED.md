# Vinayak Plant — DB-backed L6 showcase seed

Fill **Vinayak Plant** (`plant_vinayak_1` / `org_acme`) from **L2 + L5 databases** so Overview / Live / Energy / Alarms / Prescriptions / Plant-map populate without UI fixtures.

## Identity

| Field | Value |
|-------|--------|
| `plant_id` | `plant_vinayak_1` |
| `org_id` | `org_acme` |
| L2 persona | `vinayak-integration` |
| Tariff | `tariff-jvvnl-ht1-vinayak-2026` (CMD **5000** kVA) |

## Prerequisites

- L2 Timescale + query/ingest up (`universal-repositary` compose)
- L5 API on `:8080` with bootstrap key
- L6 BFF + web with `L6_STRICT_LIVE=true` and live L2/L5 URLs

## 1. Migrate + seed L2

```bash
cd universal-repositary
bash packages/migrate/apply.sh
# includes 013_seed_jvvnl_vinayak_tariff.sql

PYTHONPATH=packages python -m seed --apply --mode sql --reset \
  --persona vinayak-integration --days 30
```

Or: `SEED_PERSONA=vinayak-integration ./scripts/seed-public-plant.sh`

**What lands:** assets (incl. `pump_cw_12`), 30d telemetry anchored to *now*, JVVNL bills (~1.08–1.14M kWh), SEC + AI score **82**, department graph, PO, baselines.

## 2. Seed L6 tenancy (if needed)

```bash
cd experience-integration
pnpm --filter @stamped/l6-api seed:vinayak
```

## 3. Seed L5 prescriptions + alarms

Adapted from `external/demo-decks/prescriptions-examples.md` (#1, #3, #4, #5, #7, #10):

```bash
cd experience-integration
set L5_BASE_URL=http://127.0.0.1:8080
set L5_AUTH_TOKEN=stk_dev_bootstrap_key
python scripts/seed_vinayak_l5_prescriptions.py
```

Expect **6** OPEN (or verified) prescriptions and related EMS alarms. Best-effort verify on `rx_vinayak_cw_pump_recirc` for confirmed savings.

## 4. Smoke checklist

| Check | Expect |
|-------|--------|
| `GET http://127.0.0.1:8091/v1/plants/plant_vinayak_1/assets` | incomer + feeders + equipment |
| `GET …/measurements?asset_id=incomer_1&metric=apparent_power_kva&…` | recent points |
| `GET http://127.0.0.1:8080/v1/plants/plant_vinayak_1/prescriptions?org_id=org_acme` | ≥6 items |
| `GET …/alarms?org_id=org_acme` | raised alarms |
| L6 `GET /api/meta/upstreams?plantId=plant_vinayak_1` | L2/L5 live |
| L6 `GET /api/overview?plantId=plant_vinayak_1` | non-null KPIs, `energyTrend30d`, `topConsumers`, `sectionShare`, `co2Tco2e` |
| UI | Switch plant to **Vinayak Plant**; demo banner clears when probe is live; cards fill |

## Notes

- Runtime path is **L2/L5 → BFF → UI** only. Do not reintroduce `@/fixtures` into app routes.
- Magnitudes are **tweaked** vs legacy L6 overview-demo (not identical copies).
- Class D surfaces without upstreams (source-mix renewables, vibration FFT, plant-map x/y) stay empty by design.
