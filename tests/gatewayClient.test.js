import test from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
globalThis.window = {
  APP_CONFIG: {
    gatewayBaseUrl: "https://gateway.example.test",
    clientId: "enterprise-support-eitaa",
    clientVersion: "1.0.0",
    contractVersion: "1",
    requestTimeoutMs: 1000,
  },
  setTimeout,
  clearTimeout,
};

const { gatewayRequest, GatewayConfigurationError, GatewayRequestError } =
  await import("../src/services/gatewayClient.js");

test.after(() => { globalThis.fetch = originalFetch; });

test("rejects an unset Gateway URL before making a request", async () => {
  window.APP_CONFIG.gatewayBaseUrl = "";
  globalThis.fetch = async () => { throw new Error("fetch must not run"); };
  await assert.rejects(gatewayRequest("/api/v1/me"), GatewayConfigurationError);
  window.APP_CONFIG.gatewayBaseUrl = "https://gateway.example.test";
});

test("rejects insecure non-local Gateway URLs", async () => {
  window.APP_CONFIG.gatewayBaseUrl = "http://gateway.example.test";
  await assert.rejects(gatewayRequest("/api/v1/me"), GatewayConfigurationError);
  window.APP_CONFIG.gatewayBaseUrl = "https://gateway.example.test";
});

test("sends public client headers and omits browser credentials", async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, init };
    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  };
  assert.deepEqual(await gatewayRequest("/api/v1/me"), { status: "ok" });
  assert.equal(captured.init.credentials, "omit");
  assert.equal(captured.init.headers.get("X-Client-ID"), "enterprise-support-eitaa");
  assert.equal(captured.init.headers.get("X-Contract-Version"), "1");
  assert.ok(captured.init.signal instanceof AbortSignal);
});

test("extracts FastAPI detail errors", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: {
    code: "EITAA_INIT_DATA_INVALID", message: "Eitaa session is invalid.", retryable: false,
  }}), { status: 401 });
  await assert.rejects(gatewayRequest("/api/v1/identity/otp/request"), error => {
    assert.ok(error instanceof GatewayRequestError);
    assert.equal(error.status, 401);
    assert.equal(error.details.code, "EITAA_INIT_DATA_INVALID");
    assert.equal(error.details.retryable, false);
    return true;
  });
});

test("aborts requests that exceed the configured timeout", async () => {
  globalThis.fetch = (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  });
  await assert.rejects(gatewayRequest("/api/v1/me"), error => {
    assert.ok(error instanceof GatewayRequestError);
    assert.equal(error.status, 0);
    assert.equal(error.details.code, "GATEWAY_TIMEOUT");
    assert.equal(error.details.retryable, true);
    return true;
  });
});
