import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto });
}
globalThis.window = {
  APP_CONFIG: {
    gatewayBaseUrl: "https://gateway.example.test",
    allowInsecureGatewayForDevelopment: false,
    clientId: "enterprise-support-eitaa",
    clientVersion: "1.0.0",
    contractVersion: "1",
    requestTimeoutMs: 1000,
  },
  Eitaa: { WebApp: { initData: "signed-eitaa-init-data" } },
  setTimeout,
  clearTimeout,
  dispatchEvent(event) { dispatchedEvents.push(event.type); },
};

const originalFetch = globalThis.fetch;
const dispatchedEvents = [];
const { verifyMobileOtp, clearAuthSession, getUserAccessToken } = await import("../src/services/authService.js");
const { getCurrentUserProfile, ProfileContractError } = await import("../src/services/profileService.js");

function authResponse() {
  return new Response(JSON.stringify({
    access_token: "user-access-token",
    token_type: "Bearer",
    expires_in: 3600,
    user: { id: "14033874", username: "14033874" },
  }), { status: 200 });
}

async function establishSession() {
  await verifyMobileOtp("opaque-request-id", "123456");
}

test.afterEach(() => {
  clearAuthSession();
  dispatchedEvents.length = 0;
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("loads the canonical user profile through GET /api/v1/me", async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    captured = { url, init };
    return new Response(JSON.stringify({
      user: {
        user_id: "14033874",
        username: "14033874",
        display_name: "کاربر نمونه",
        employee_id: "14033874",
        department: "فناوری اطلاعات",
        email: "user@example.invalid",
        groups: ["IT-Users"],
        roles: ["AI_CHAT_USER"],
        permissions: [],
      },
    }), { status: 200 });
  };

  await establishSession();
  const user = await getCurrentUserProfile();

  assert.equal(captured.url, "https://gateway.example.test/api/v1/me");
  assert.equal(captured.init.method, "GET");
  assert.equal(captured.init.credentials, "omit");
  assert.equal(captured.init.headers.get("X-Client-ID"), "enterprise-support-eitaa");
  assert.equal(captured.init.headers.get("X-User-Access-Token"), "user-access-token");
  assert.equal(captured.init.headers.get("Authorization"), null);
  assert.equal(captured.init.body, undefined);
  assert.equal(user.user_id, "14033874");
  assert.equal(user.department, "فناوری اطلاعات");
  assert.deepEqual(user.groups, ["IT-Users"]);
});

test("does not call Gateway when there is no in-memory user token", async () => {
  clearAuthSession();
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error("fetch must not run");
  };

  await assert.rejects(getCurrentUserProfile(), /نشست معتبر کاربر/);
  assert.equal(called, false);
});

test("rejects a profile response without the required user_id", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    return new Response(JSON.stringify({ user: { username: "14033874" } }), { status: 200 });
  };

  await establishSession();
  await assert.rejects(getCurrentUserProfile(), ProfileContractError);
});

test("clears the in-memory session when Gateway reports an invalid user token", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    return new Response(JSON.stringify({
      error: { code: "AUTHENTICATION_FAILED", message: "Authentication failed.", retryable: false },
    }), { status: 401 });
  };

  await establishSession();
  assert.equal(getUserAccessToken(), "user-access-token");
  await assert.rejects(getCurrentUserProfile(), error => error.status === 401);
  assert.equal(getUserAccessToken(), null);
  assert.ok(dispatchedEvents.includes("auth:expired"));
});

test("does not discard a valid session when Gateway rejects the public client allowlist", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    return new Response(JSON.stringify({
      error: { code: "SERVICE_AUTHENTICATION_REQUIRED", message: "A valid service JWT is required.", retryable: false },
    }), { status: 401 });
  };

  await establishSession();
  await assert.rejects(getCurrentUserProfile(), error => error.status === 401);
  assert.equal(getUserAccessToken(), "user-access-token");
  assert.equal(dispatchedEvents.includes("auth:expired"), false);
});
