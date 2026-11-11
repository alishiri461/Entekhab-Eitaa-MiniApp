const REQUEST_TIMEOUT_MS = Number.isInteger(window.APP_CONFIG?.requestTimeoutMs)
  ? Math.min(Math.max(window.APP_CONFIG.requestTimeoutMs, 1000), 60000)
  : 15000;

export class GatewayConfigurationError extends Error {
  constructor(message = "Gateway base URL is not configured or is not secure.") {
    super(message);
    this.name = "GatewayConfigurationError";
  }
}

export class GatewayRequestError extends Error {
  constructor(status, details = {}) {
    super(details.message || (status === 0 ? "Gateway is unreachable." : `Gateway request failed with status ${status}.`));
    this.name = "GatewayRequestError";
    this.status = status;
    this.details = details;
  }
}

function getGatewayBaseUrl() {
  const configuredGatewayUrl = window.APP_CONFIG?.gatewayBaseUrl?.trim();
  if (!configuredGatewayUrl) throw new GatewayConfigurationError();

  let parsed;
  try {
    parsed = new URL(configuredGatewayUrl);
  } catch {
    throw new GatewayConfigurationError("Gateway URL format is invalid.");
  }

  const isLocalDevelopmentHost = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocalDevelopmentHost)) {
    throw new GatewayConfigurationError("Gateway must use HTTPS outside localhost development.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new GatewayConfigurationError("Gateway URL must not contain credentials, query, or fragment.");
  }
  const pathname = parsed.pathname.endsWith("/") ? parsed.pathname.slice(0, -1) : parsed.pathname;
  return `${parsed.origin}${pathname}`;
}

function extractErrorDetails(payload) {
  if (!payload || typeof payload !== "object") return {};
  const candidate = payload.error && typeof payload.error === "object"
    ? payload.error
    : payload.detail && typeof payload.detail === "object"
      ? payload.detail
      : {};
  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message: typeof candidate.message === "string" ? candidate.message : undefined,
    request_id: typeof candidate.request_id === "string" ? candidate.request_id : undefined,
    correlation_id: typeof candidate.correlation_id === "string" ? candidate.correlation_id : undefined,
    retryable: typeof candidate.retryable === "boolean" ? candidate.retryable : undefined,
  };
}

export async function gatewayRequest(path, init = {}) {
  const baseUrl = getGatewayBaseUrl();
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Gateway path must be an absolute path.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Client-ID", window.APP_CONFIG?.clientId || "enterprise-support-eitaa");
  headers.set("X-Client-Version", window.APP_CONFIG?.clientVersion || "1.0.0");
  headers.set("X-Contract-Version", window.APP_CONFIG?.contractVersion || "1");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  let responseText;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: "omit",
    });
    responseText = await response.text();
  } catch (error) {
    const timedOut = controller.signal.aborted;
    throw new GatewayRequestError(0, {
      code: timedOut ? "GATEWAY_TIMEOUT" : "GATEWAY_NETWORK_ERROR",
      message: timedOut
        ? "پاسخی از درگاه در زمان مقرر دریافت نشد. دوباره تلاش کنید."
        : "ارتباط با درگاه برقرار نشد. اتصال اینترنت را بررسی کنید.",
      retryable: true,
    });
  } finally {
    window.clearTimeout(timeout);
  }

  let payload;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new GatewayRequestError(response.status, {
          code: "INVALID_GATEWAY_RESPONSE",
          message: "Gateway returned an invalid response.",
        });
      }
    }
  }

  if (!response.ok) throw new GatewayRequestError(response.status, extractErrorDetails(payload));
  return payload;
}
