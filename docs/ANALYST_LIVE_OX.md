# Ask Analyst live (L4 plant pack + OpenRouter Ox Alpha)

Wire **L6 Ask Analyst** (Mode A side panel + Mode B `/analyst`) through the BFF to **L4** chat with:

- Frozen **plant context pack** (neighborhood / delta facts / live index / playbook hits)
- Graph tools on the plant knowledge graph
- **SSE** token streaming (`/messages/stream`)

Local/dev only. Never commit API keys.

## Ports

| Service | Port | Notes |
|---------|------|--------|
| L4 API | 8000 | `python -m stamped_l4.api` |
| L6 BFF | 3001 | `L4_LIVE=true`, `L4_BASE_URL` → L4 |
| L6 Web | 3000 | Cookie session against BFF |

Plant demo identity: `plant_vinayak_1` / `org_acme` (fixture KG still uses golden COMP2 neighborhood).

## 1) Start L4 with Ox Alpha

```powershell
cd knowledge-reasoning
# Load secrets from gitignored deploy/.env (see OPENROUTER_OX_ALPHA_L3_L5_SIM.md)
Get-Content deploy/.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k,$v = $_.Split('=',2); Set-Item -Path "Env:$k" -Value $v.Trim()
}
$env:L4_MODEL_NAME = "stealth/ox-alpha"
$env:L4_MODEL_JSON_MODE = "json_object"
$env:L4_ANALYST_WALL_CLOCK_S = "120"
New-Item -ItemType Directory -Force -Path data | Out-Null
python -m stamped_l4.api
```

Smoke:

```powershell
curl http://127.0.0.1:8000/health
# Create session + stream (headers required):
# POST /v1/chat/sessions  { org_id, plant_id, user_id }
# POST /v1/chat/sessions/{id}/messages/stream  { content, context? }
```

## 2) Start L6 with live analyst

In `experience-integration/.env` (or compose env):

```
L4_BASE_URL=http://127.0.0.1:8000
L4_LIVE=true
L4_TIMEOUT_MS=120000
```

Docker API service uses `http://host.docker.internal:8000` when L4 runs on the host — see `infra/docker-compose.yml`.

```powershell
cd experience-integration
# pnpm web+api, or:
docker compose -f infra/docker-compose.yml up
```

Confirm: `GET http://127.0.0.1:3001/api/analyst/meta` → `{ "live": true }` (requires API process with `L4_LIVE=true`).

## 3) Try in the UI

1. Sign in to http://localhost:3000 (session cookie required for `/api/analyst/*`).
2. Open **Ask Analyst** (Mode A) or `/analyst` (Mode B).
3. Sample prompts:
   - “Who owns COMP2 and what standby options exist?”
   - “What delta facts apply to the compressor neighborhood?”
   - “Summarize live index freshness for this plant.”

Expect: streamed tokens; citations with path tags **G** (graph), **D** (delta), **B** (live), **H** (playbook). No OT write / SQL tools.

## Fallback

- `L4_LIVE=false` → BFF meta reports `live: false`; UI uses fixture replies + client typewriter.
- Force UI: `NEXT_PUBLIC_ANALYST_LIVE=true|false`.

## Related

- L4 OX Rx sim: [`knowledge-reasoning/docs/OPENROUTER_OX_ALPHA_L3_L5_SIM.md`](../../knowledge-reasoning/docs/OPENROUTER_OX_ALPHA_L3_L5_SIM.md)
- ADR-023 boundary: L4 owns RAG/agent; L6 owns UX + envelope; BFF is HTTP-only.
