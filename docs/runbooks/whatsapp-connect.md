# WhatsApp connect (L6 pilot sender)

L6 can send Meta Cloud API template messages for Rx assign and integration test-send.
Until an L5 relay exists, **L6 is the pilot WhatsApp sender** — credentials live on the BFF, not the browser.

## Env vars

| Variable | Required for live | Notes |
|----------|-------------------|--------|
| `WHATSAPP_MODE` | No | `dry_run` \| `live` \| omit for auto. Auto → live only when token + phone number id are set; otherwise dry_run. |
| `META_WA_TOKEN` | Yes (live) | Meta Graph API access token |
| `META_WA_PHONE_NUMBER_ID` | Yes (live) | Sending phone number ID |
| `META_WA_VERIFY_TOKEN` | Webhook subscribe | Must match Meta webhook verify token |
| `META_WA_APP_SECRET` | Inbound webhooks | Validates `X-Hub-Signature-256` |

Copy from repo-root [`.env.example`](../../.env.example). Never commit real tokens.

## Dry-run vs live

- **dry_run:** `enqueueWhatsAppNotification` writes `whatsapp_notification_log` with `status=dry_run` / `mode=dry_run` and does not call Meta.
- **live:** Calls Graph API; log row gets `accepted` or `failed`.

## Product paths

1. **Admin → Integrations → WhatsApp → Test send** — `POST /api/integrations/whatsapp/test-send`
2. **Prescriptions → Assign** — `POST /api/assignments/notify` (person from `notify_people`, template default `issue`)

UI toasts must mirror the API `status` (`dry_run` / `accepted` / `failed`) — never invent “queued”.

## Meta webhook

- Verify: `GET /api/webhooks/whatsapp`
- Inbound: `POST /api/webhooks/whatsapp` (signature required). Button payloads are allowlisted (`ack` / `done` / `defer` / `escalate`); mapping to Rx ack is still stubbed.

## Checklist

1. Seed a notify person under Assignments with WhatsApp enabled.
2. Leave Meta creds unset → assign a Rx → toast says dry-run logged; confirm a log row in DB.
3. Set `WHATSAPP_MODE=live` + Meta creds → test-send with a real E.164 → expect `accepted` or a real `failed` error in the toast/log.
4. Confirm L5 is **not** required for send in this pilot path.
