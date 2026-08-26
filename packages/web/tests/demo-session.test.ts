import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  clearDemoSession,
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
  DEMO_PLANT_ID,
  DEMO_SESSION_KEY,
  enableDemoSession,
  isDemoCredentials,
  isDemoSessionActive,
  readDemoSession,
} from "../src/lib/demo-session.js";
import {
  getDemoAlarms,
  getDemoOverview,
  getDemoPrescriptions,
} from "../src/lib/demo-data.js";
import { BFF_UNREACHABLE_MESSAGE } from "../src/lib/auth-client.js";

function installSessionStorageMock() {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: { sessionStorage: mock, localStorage: mock },
    configurable: true,
    writable: true,
  });
}

describe("demo-session", () => {
  beforeEach(() => {
    installSessionStorageMock();
    clearDemoSession();
  });

  it("matches hardcoded demo credentials", () => {
    assert.equal(isDemoCredentials(DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD), true);
    assert.equal(isDemoCredentials("other@stamped.local", DEMO_LOGIN_PASSWORD), false);
    assert.equal(isDemoCredentials(DEMO_LOGIN_EMAIL, "wrong-password"), false);
  });

  it("persists and clears sessionStorage flag", () => {
    assert.equal(isDemoSessionActive(), false);
    enableDemoSession();
    assert.equal(isDemoSessionActive(), true);
    const session = readDemoSession();
    assert.ok(session);
    assert.equal(session?.plantId, DEMO_PLANT_ID);
    assert.equal(session?.email, DEMO_LOGIN_EMAIL);
    clearDemoSession();
    assert.equal(isDemoSessionActive(), false);
    assert.equal(readDemoSession(), null);
  });
});

describe("demo-data", () => {
  it("returns Jaipur fixture payloads", () => {
    const overview = getDemoOverview();
    assert.equal(overview.plantId, DEMO_PLANT_ID);
    assert.ok(getDemoAlarms().length > 0);
    assert.ok(getDemoPrescriptions().length > 0);
    assert.ok(overview.energyTrend30d.length >= 30);
  });
});

describe("auth-client", () => {
  it("exposes BFF unreachable message for login UI", () => {
    assert.match(BFF_UNREACHABLE_MESSAGE, /Unable to reach the sign-in service/i);
  });
});
