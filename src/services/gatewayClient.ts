const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BASE_URL?.replace(/\/$/, "");

export class GatewayConfigurationError extends Error {
  constructor() {
    super("Gateway base URL is not configured.");
    this.name = "GatewayConfigurationError";
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

  if (!response.ok) {
    throw new Error(`Gateway request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}
