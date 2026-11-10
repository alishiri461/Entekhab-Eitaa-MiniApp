const configuredGatewayUrl = window.APP_CONFIG?.gatewayBaseUrl?.trim();

export class GatewayConfigurationError extends Error {
  constructor(message = "Gateway base URL is not configured or is not secure.") {
    super(message);
    this.name = "GatewayConfigurationError";
  }
}

export class GatewayRequestError extends Error {
  constructor(status, details = {}) {
    super(details.message || `Gateway request failed with status ${status}.`);
    this.name = "GatewayRequestError";
    this.status = status;
    this.details = details;
  }
}

function getGatewayBaseUrl() {
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

  return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
}

export async function gatewayRequest(path, init = {}) {
  const baseUrl = getGatewayBaseUrl();
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Gateway path must be an absolute path.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: "omit",
  });

  const responseText = await response.text();
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

  if (!response.ok) {
    const root = payload && typeof payload === "object" ? payload : {};
    const nested = root.error && typeof root.error === "object" ? root.error : {};
    throw new GatewayRequestError(response.status, {
      code: typeof nested.code === "string" ? nested.code : undefined,
      message: typeof nested.message === "string" ? nested.message : undefined,
      request_id: typeof nested.request_id === "string" ? nested.request_id : undefined,
      correlation_id: typeof nested.correlation_id === "string" ? nested.correlation_id : undefined,
      retryable: typeof nested.retryable === "boolean" ? nested.retryable : undefined,
    });
  }

  return payload;
}
