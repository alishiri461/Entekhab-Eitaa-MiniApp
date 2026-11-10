import { gatewayRequest } from "./gatewayClient";

export interface OtpRequestResult {
  accepted: boolean;
  message?: string;
  request_id?: string;
  expires_in?: number;
  delivery_channel?: "sms";
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  display_name?: string | null;
  email?: string | null;
  department?: string | null;
  roles: string[];
  permissions: string[];
}

export interface OtpVerifyResult {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: AuthenticatedUser;
}

export interface AuthSession {
  user: AuthenticatedUser;
  expiresAt: number;
}

let currentSession: (AuthSession & { accessToken: string }) | null = null;

function createIdempotencyKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

/**
 * Requests an SMS OTP through the Gateway's canonical public mobile flow.
 * A generic accepted response without request_id is not a usable challenge.
 */
export async function requestMobileOtp(mobile: string): Promise<OtpRequestResult> {
  const normalizedMobile = mobile.trim();
  if (normalizedMobile.length < 8 || normalizedMobile.length > 32) {
    throw new Error("شماره موبایل معتبر نیست.");
  }

  return gatewayRequest<OtpRequestResult>("/api/v1/identity/otp/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": createIdempotencyKey(),
    },
    body: JSON.stringify({ mobile: normalizedMobile, channel: "sms" }),
  });
}

/**
 * Verifies the exact request_id returned by requestMobileOtp.
 * The AD-issued User Access Token is retained in module memory only.
 */
export async function verifyMobileOtp(
  requestId: string,
  code: string,
): Promise<AuthSession> {
  const normalizedRequestId = requestId.trim();
  const normalizedCode = code.trim();

  if (!normalizedRequestId) {
    throw new Error("شناسه درخواست کد تأیید موجود نیست؛ ابتدا درخواست کد را ثبت کنید.");
  }
  if (!/^[0-9]{6,8}$/.test(normalizedCode)) {
    throw new Error("کد تأیید باید ۶ تا ۸ رقم باشد.");
  }

  const result = await gatewayRequest<OtpVerifyResult>("/api/v1/identity/otp/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": createIdempotencyKey(),
    },
    body: JSON.stringify({ request_id: normalizedRequestId, code: normalizedCode }),
  });

  if (
    !result.access_token ||
    result.token_type !== "Bearer" ||
    !Number.isInteger(result.expires_in) ||
    result.expires_in < 1 ||
    !result.user?.id ||
    !result.user?.username
  ) {
    throw new Error("پاسخ احراز هویت Gateway معتبر نیست.");
  }

  const session: AuthSession & { accessToken: string } = {
    accessToken: result.access_token,
    user: result.user,
    expiresAt: Date.now() + result.expires_in * 1000,
  };
  currentSession = session;
  return { user: session.user, expiresAt: session.expiresAt };
}

export function getAuthSession(): AuthSession | null {
  if (!currentSession || currentSession.expiresAt <= Date.now()) {
    currentSession = null;
    return null;
  }
  return { user: currentSession.user, expiresAt: currentSession.expiresAt };
}

/** Returns a live token only while the in-memory session remains valid. */
export function getUserAccessToken(): string | null {
  if (!getAuthSession() || !currentSession) return null;
  return currentSession.accessToken;
}

export function clearAuthSession(): void {
  currentSession = null;
}
