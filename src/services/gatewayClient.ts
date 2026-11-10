const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BASE_URL?.replace(/\/$/, "");

export class GatewayConfigurationError extends Error {
  constructor() {
    super("Gateway base URL is not configured.");
    this.name = "GatewayConfigurationError";
  }
}

/**
 * Thin transport boundary. Authentication exchange and endpoint contracts
 * must be implemented only after matching the deployed Gateway contract.
 */
export async function gatewayRequest<T>(
  path: string,
  initData: string,
  init?: RequestInit,
): Promise<T> {
  if (!gatewayBaseUrl) throw new GatewayConfigurationError();
  if (!path.startsWith("/")) throw new Error("Gateway path must be absolute.");

  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  // Raw Eitaa initData is forwarded only to the server-side verification
  // endpoint once that endpoint is explicitly agreed and implemented.
  if (initData) headers.set("X-Eitaa-Init-Data", initData);

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
