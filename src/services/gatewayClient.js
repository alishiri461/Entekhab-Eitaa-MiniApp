const gatewayBaseUrl = window.APP_CONFIG?.gatewayBaseUrl?.replace(/\/$/, "");

export class GatewayConfigurationError extends Error {
  constructor() {
    super("Gateway base URL is not configured.");
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

export async function gatewayRequest(path, init = {}) {
  if (!gatewayBaseUrl) throw new GatewayConfigurationError();
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Gateway path must be an absolute path.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(`${gatewayBaseUrl}${path}`, {
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
