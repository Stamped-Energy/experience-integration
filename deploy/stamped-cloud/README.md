# stamped-cloud

One container, many supervised processes. Mosquitto is **not** in this image.

| Process | Supervisor program | Default port |
|---------|-------------------|--------------|
| L1 cloud ingest | `l1-cloud-ingest` | 8090 |
| L1 relay | `l1-relay` | 8093 |
| L2 ingest | `l2-ingest` | 8092 |
| L2 query API | `l2-query-api` | 8091 |
| L3 scheduler | `l3-scheduler` | — |
| L4 API | `l4-api` | 8000 |
| L4 worker | `l4-worker` | — |
| L5 API | `l5-api` | 8080 |
| L6 BFF | `l6-bff` | 3001 |

Scaffold ships **HTTP stubs** (`STAMPED_CLOUD_STUBS=1`) so `docker build` + health
probes work before multi-repo artifact COPY is wired. Replace `command=` in
`conf.d/*.conf` with real entrypoints in a follow-up commit.

See [ARM64.md](./ARM64.md) and [../README.md](../README.md).
