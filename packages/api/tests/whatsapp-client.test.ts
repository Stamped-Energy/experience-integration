import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createWhatsAppClient,
  resolveWhatsAppMode,
  verifyMetaSignature,
} from "../src/whatsapp/client.js";
import { isAllowedWhatsAppButton } from "../src/whatsapp/templates.js";
import { createHmac } from "node:crypto";

describe("whatsapp client", () => {
  it("defaults to dry_run without credentials", () => {
    assert.equal(resolveWhatsAppMode({}), "dry_run");
    assert.equal(
      resolveWhatsAppMode({
        WHATSAPP_MODE: "live",
        META_WA_TOKEN: "t",
        META_WA_PHONE_NUMBER_ID: "p",
      }),
      "live",
    );
  });

  it("dry_run never calls fetch", async () => {
    let called = false;
    const client = createWhatsAppClient({
      mode: "dry_run",
      fetchImpl: (async () => {
        called = true;
        return new Response("{}");
      }) as typeof fetch,
    });
    const result = await client.sendTemplate({
      to: "+919876543210",
      template: "issue",
    });
    assert.equal(called, false);
    assert.equal(result.status, "dry_run");
    assert.equal(result.mode, "dry_run");
  });

  it("live posts to Meta graph and returns message id", async () => {
    const client = createWhatsAppClient({
      mode: "live",
      token: "tok",
      phoneNumberId: "pnid",
      fetchImpl: (async (url, init) => {
        assert.match(String(url), /graph\.facebook\.com/);
        const headers = new Headers((init as RequestInit).headers);
        assert.equal(headers.get("Authorization"), "Bearer tok");
        return new Response(
          JSON.stringify({ messages: [{ id: "wamid.TEST" }] }),
          { status: 200 },
        );
      }) as typeof fetch,
    });
    const result = await client.sendTemplate({
      to: "+919876543210",
      template: "reminder",
    });
    assert.equal(result.status, "accepted");
    assert.equal(result.providerMessageId, "wamid.TEST");
  });

  it("verifies Meta signatures and button allowlist", () => {
    const body = '{"object":"whatsapp_business_account"}';
    const secret = "app_secret";
    const sig =
      "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    assert.equal(verifyMetaSignature(body, sig, secret), true);
    assert.equal(verifyMetaSignature(body, "sha256=dead", secret), false);
    assert.equal(isAllowedWhatsAppButton("ack"), true);
    assert.equal(isAllowedWhatsAppButton("hack"), false);
  });
});
