import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto;
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
  dispatchEvent() {},
};

const originalFetch = globalThis.fetch;
const { verifyMobileOtp, clearAuthSession } = await import("../src/services/authService.js");
const { sendChatMessage, ChatContractError } = await import("../src/services/chatService.js");

function authResponse() {
  return new Response(JSON.stringify({
    access_token: "user-access-token",
    token_type: "Bearer",
    expires_in: 3600,
    user: { id: "14033874", username: "14033874" },
  }), { status: 200 });
}

async function establishSession() {
  globalThis.fetch = async () => authResponse();
  await verifyMobileOtp("opaque-request-id", "123456");
}

test.afterEach(() => clearAuthSession());
test.after(() => { globalThis.fetch = originalFetch; });

test("sends chat through the Gateway with the in-memory user token and canonical payload", async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    captured = { url, init };
    return new Response(JSON.stringify({
      request_id: "gateway-request",
      correlation_id: "gateway-correlation",
      conversation_id: "eitaa-conversation-1",
      answer: "پاسخ واقعی از Gateway",
    }), { status: 200 });
  };

  await verifyMobileOtp("opaque-request-id", "123456");
  const result = await sendChatMessage({
    conversationId: "eitaa-conversation-1",
    text: "سلام",
  });

  assert.equal(captured.url, "https://gateway.example.test/api/v1/chat");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.credentials, "omit");
  assert.equal(captured.init.headers.get("X-Client-ID"), "enterprise-support-eitaa");
  assert.equal(captured.init.headers.get("X-User-Access-Token"), "user-access-token");
  assert.equal(captured.init.headers.get("Authorization"), null);
  assert.match(captured.init.headers.get("Idempotency-Key"), /^[a-f0-9]{32}$/);
  assert.deepEqual(JSON.parse(captured.init.body), {
    conversation_id: "eitaa-conversation-1",
    text: "سلام",
  });
  assert.deepEqual(result, {
    requestId: "gateway-request",
    correlationId: "gateway-correlation",
    conversationId: "eitaa-conversation-1",
    answer: "پاسخ واقعی از Gateway",
  });
});

test("does not send chat without an active in-memory user session", async () => {
  clearAuthSession();
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error("fetch must not run");
  };

  await assert.rejects(
    sendChatMessage({ conversationId: "conversation-1", text: "سلام" }),
    /نشست معتبر کاربر/
  );
  assert.equal(called, false);
});

test("rejects a response that does not satisfy the Gateway ChatResponse contract", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    return new Response(JSON.stringify({
      request_id: "gateway-request",
      correlation_id: "gateway-correlation",
      conversation_id: "conversation-1",
      answer: " ",
    }), { status: 200 });
  };

  await establishSession();
  await assert.rejects(
    sendChatMessage({ conversationId: "conversation-1", text: "سلام" }),
    ChatContractError
  );
});
