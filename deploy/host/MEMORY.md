# Single-host hardening — memory limits & recovery

The pilot runs **one** `stamped-cloud` container plus **host** Mosquitto. L4's LLM
client can exhaust RAM and starve ingest — mitigate with layered limits.

## Layers

| Layer | Mechanism | Suggested budget (t4g.small ≈ 2 GiB) |
|-------|-----------|--------------------------------------|
| Host OS | leave ~400–500 MiB free | — |
| systemd | `MemoryMax=1400M` on unit | see `stamped-cloud.service` |
| Docker | `--memory=1200m` | hard cap for the container |
| Per-process | supervisord + future cgroup slices | L4 worker ≤ 400 MiB; ingest ≥ 256 MiB reserved |

### Recommended per-process targets (document for operators)

| Process | Soft target | Notes |
|---------|-------------|--------|
| l1-cloud-ingest + relay | 200 MiB | must not be OOM-killed first |
| l2-ingest + query-api | 300 MiB | Timescale client pools |
| l3-scheduler | 250 MiB | |
| l4-api + l4-worker | **≤ 400 MiB combined** | most volatile — kill L4 first |
| l5-api | 150 MiB | |
| l6-bff | 200 MiB | |

Wire per-process cgroups in a follow-up (systemd transient scopes or
`docker update` is insufficient inside one container). Supervisord
`autorestart=true` recovers a killed child without taking siblings down.

## Watchdog

- systemd `Restart=always` restarts a dead container.
- supervisord restarts individual programs.
- Kill-a-process test (Phase H gate): `docker exec stamped-cloud supervisorctl stop l4-worker` then confirm ingest health probes still pass; start worker again.

## Log rotation

Install host `logrotate` for `/var/lib/docker/containers/*/*-json.log` and
Mosquitto logs under `/var/log/mosquitto/`. Keep ≥7 days for pilot forensics.

## Escape hatch

If L4 repeatedly OOMs the host: split L4 to a second task first (documented
scale-up path in the program brief). Keep ingest on the original host.
