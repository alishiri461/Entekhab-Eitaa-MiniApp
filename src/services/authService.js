import { gatewayRequest } from "./gatewayClient.js";

let currentSession = null;
let expiryTimer = null;

function createIdempotencyKey() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random number generation is unavailable.");
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

export async function requestMobileOtp(mobile) {
  const normalizedMobile = String(mobile ?? "").trim();
  if (normalizedMobile.length < 8 || normalizedMobile.length > 32) {
    throw new Error("شماره موبایل معتبر نیست.");
  }

  return gatewayRequest("/api/v1/identity/otp/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": createIdempotencyKey(),
    },
    body: JSON.stringify({ mobile: normalizedMobile, channel: "sms" }),
  });
}

export async function verifyMobileOtp(requestId, code) {
  const normalizedRequestId = String(requestId ?? "").trim();
  const normalizedCode = String(code ?? "").trim();

  if (!normalizedRequestId) {
    throw new Error("شناسه درخواست کد تأیید موجود نیست؛ ابتدا درخواست کد را ثبت کنید.");
  }
  if (!/^[0-9]{6,8}$/.test(normalizedCode)) {
    throw new Error("کد تأیید باید ۶ تا ۸ رقم باشد.");
  }

  const result = await gatewayRequest("/api/v1/identity/otp/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": createIdempotencyKey(),
    },
    body: JSON.stringify({ request_id: normalizedRequestId, code: normalizedCode }),
  });

  // Gateway's user model has optional identity fields. Validate only the
  // fields guaranteed by the token response contract.
  if (
    typeof result?.access_token !== "string" ||
    !result.access_token ||
    result.token_type !== "Bearer" ||
    !Number.isInteger(result.expires_in) ||
    result.expires_in < 1 ||
    !result.user ||
    typeof result.user !== "object" ||
    Array.isArray(result.user)
  ) {
    throw new Error("پاسخ احراز هویت Gateway معتبر نیست.");
  }

  if (expiryTimer !== null) window.clearTimeout(expiryTimer);
  currentSession = {
    accessToken: result.access_token,
    user: result.user,
    expiresAt: Date.now() + result.expires_in * 1000,
  };
  expiryTimer = window.setTimeout(() => {
    currentSession = null;
    expiryTimer = null;
    window.dispatchEvent(new Event("auth:expired"));
  }, result.expires_in * 1000);
  return getAuthSession();
}

export function getAuthSession() {
  if (!currentSession || currentSession.expiresAt <= Date.now()) {
    currentSession = null;
    return null;
  }
  return { user: currentSession.user, expiresAt: currentSession.expiresAt };
}

export function getUserAccessToken() {
  return getAuthSession() && currentSession ? currentSession.accessToken : null;
}

export function clearAuthSession() {
  if (expiryTimer !== null) window.clearTimeout(expiryTimer);
  expiryTimer = null;
  currentSession = null;
}
