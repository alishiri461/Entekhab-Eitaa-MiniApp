import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto });
}

const dispatchedEvents = [];
const originalFetch = globalThis.fetch;
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

const { verifyMobileOtp, clearAuthSession, getUserAccessToken } =
  await import("../src/services/authService.js");
const { listTickets, getTicket, TicketContractError } =
  await import("../src/services/ticketService.js");

function authResponse() {
  return new Response(JSON.stringify({
    access_token: "user-access-token",
    token_type: "Bearer",
    expires_in: 3600,
    user: { id: "14033874", username: "14033874" },
  }), { status: 200 });
}

function ticketResponse(overrides = {}) {
  return {
    ticket_id: "HELP-123",
    title: "عدم اتصال به شبکه",
    description: "اتصال شبکه برقرار نمی‌شود.",
    category: "IT",
    priority: "medium",
    status: "open",
    source: "eitaa",
    requester_id: "14033874",
    created_at: "2026-11-23T08:00:00Z",
    updated_at: "2026-11-23T08:00:00Z",
    ...overrides,
  };
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

test("lists tickets through the canonical Gateway route with the in-memory user token", async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    captured = { url, init };
    return new Response(JSON.stringify({
      tickets: [ticketResponse()],
      total: 1,
      limit: 25,
      offset: 0,
    }), { status: 200 });
  };

  await establishSession();
  const result = await listTickets();

  assert.equal(captured.url, "https://gateway.example.test/api/v1/tickets?limit=25&offset=0");
  assert.equal(captured.init.method, "GET");
  assert.equal(captured.init.credentials, "omit");
  assert.equal(captured.init.headers.get("X-Client-ID"), "enterprise-support-eitaa");
  assert.equal(captured.init.headers.get("X-User-Access-Token"), "user-access-token");
  assert.equal(captured.init.headers.get("Authorization"), null);
  assert.equal(captured.init.body, undefined);
  assert.equal(result.total, 1);
  assert.equal(result.tickets[0].ticket_id, "HELP-123");
});

test("uses explicit pagination values and validates their range before fetch", async () => {
  let capturedUrl;
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    capturedUrl = url;
    return new Response(JSON.stringify({ tickets: [], total: 0, limit: 10, offset: 20 }), { status: 200 });
  };

  await establishSession();
  const result = await listTickets({ limit: 10, offset: 20 });
  assert.equal(capturedUrl, "https://gateway.example.test/api/v1/tickets?limit=10&offset=20");
  assert.deepEqual(result, { tickets: [], total: 0, limit: 10, offset: 20 });

  let called = false;
  globalThis.fetch = async () => { called = true; };
  await assert.rejects(listTickets({ limit: 101 }), RangeError);
  await assert.rejects(listTickets({ offset: -1 }), RangeError);
  assert.equal(called, false);
});

test("loads a ticket detail using the opaque ticket_id path segment", async () => {
  let capturedUrl;
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    capturedUrl = url;
    return new Response(JSON.stringify(ticketResponse()), { status: 200 });
  };

  await establishSession();
  const ticket = await getTicket("HELP/123");
  assert.equal(capturedUrl, "https://gateway.example.test/api/v1/tickets/HELP%2F123");
  assert.equal(ticket.ticket_id, "HELP-123");
});

test("does not call Gateway without an active in-memory user token", async () => {
  clearAuthSession();
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error("fetch must not run");
  };

  await assert.rejects(listTickets(), /نشست معتبر کاربر/);
  assert.equal(called, false);
});

test("rejects a ticket list that does not match the canonical response envelope", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    return new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 });
  };

  await establishSession();
  await assert.rejects(listTickets(), TicketContractError);
});

test("rejects ticket objects without the canonical ticket_id, title, and status fields", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    return new Response(JSON.stringify({
      tickets: [{ id: "HELP-123", title: "Issue", status: "open" }],
      total: 1,
      limit: 25,
      offset: 0,
    }), { status: 200 });
  };

  await establishSession();
  await assert.rejects(listTickets(), TicketContractError);
});

test("clears the in-memory session only for explicit user-token authentication failures", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/api/v1/identity/otp/verify")) return authResponse();
    return new Response(JSON.stringify({
      error: { code: "AUTHENTICATION_FAILED", message: "Authentication failed.", retryable: false },
    }), { status: 401 });
  };

  await establishSession();
  assert.equal(getUserAccessToken(), "user-access-token");
  await assert.rejects(listTickets(), error => error.status === 401);
  assert.equal(getUserAccessToken(), null);
  assert.ok(dispatchedEvents.includes("auth:expired"));
});
