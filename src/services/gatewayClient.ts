const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BASE_URL?.replace(/\/$/, "");

export interface GatewayErrorDetails {
  code?: string;
  message?: string;
  request_id?: string;
  correlation_id?: string;
  retryable?: boolean;
}

export class GatewayConfigurationError extends Error {
  constructor() {
    super("Gateway base URL is not configured.");
    this.name = "GatewayConfigurationError";
  }
}

export class GatewayRequestError extends Error {
  readonly status: number;
  readonly details?: GatewayErrorDetails;

  constructor(status: number, details?: GatewayErrorDetails) {
    super(details?.message || `Gateway request failed with status ${status}.`);
    this.name = "GatewayRequestError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Generic Gateway transport boundary.
 * Eitaa initData exchange is intentionally NOT implemented here: it must use
 * a dedicated, verified Gateway endpoint and server-side validation contract.
 */
export async function gatewayRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!gatewayBaseUrl) throw new GatewayConfigurationError();
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Gateway path must be an absolute same-origin path.");
  }

  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(`${gatewayBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "omit",
  });

  const responseText = await response.text();
  let payload: unknown;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
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
    const root = payload && typeof payload === "object"
      ? payload as Record<string, unknown>
      : undefined;
    const nested = root?.error && typeof root.error === "object"
      ? root.error as Record<string, unknown>
      : undefined;
    throw new GatewayRequestError(response.status, {
      code: typeof nested?.code === "string" ? nested.code : undefined,
      message: typeof nested?.message === "string" ? nested.message : undefined,
      request_id: typeof nested?.request_id === "string" ? nested.request_id : undefined,
      correlation_id: typeof nested?.correlation_id === "string" ? nested.correlation_id : undefined,
      retryable: typeof nested?.retryable === "boolean" ? nested.retryable : undefined,
    });
  }

  return payload as T;
}
