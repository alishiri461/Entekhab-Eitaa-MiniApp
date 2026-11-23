import { GatewayRequestError, gatewayRequest } from "./gatewayClient.js";
import { clearAuthSession, getUserAccessToken } from "./authService.js";

const OPTIONAL_STRING_FIELDS = [
  "description",
  "category",
  "priority",
  "source",
  "requester_id",
  "created_at",
  "updated_at",
];

export class TicketContractError extends Error {
  constructor(message = "Gateway returned an invalid ticket response.") {
    super(message);
    this.name = "TicketContractError";
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateTicket(ticket) {
  if (
    !isObject(ticket) ||
    typeof ticket.ticket_id !== "string" ||
    !ticket.ticket_id.trim() ||
    typeof ticket.title !== "string" ||
    typeof ticket.status !== "string"
  ) {
    throw new TicketContractError();
  }

  for (const field of OPTIONAL_STRING_FIELDS) {
    const value = ticket[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      throw new TicketContractError("Gateway returned an invalid ticket field: " + field);
    }
  }

  return ticket;
}

function validateListResponse(response) {
  if (
    !isObject(response) ||
    !Array.isArray(response.tickets) ||
    !Number.isInteger(response.total) ||
    response.total < 0 ||
    !Number.isInteger(response.limit) ||
    response.limit < 1 ||
    response.limit > 100 ||
    !Number.isInteger(response.offset) ||
    response.offset < 0
  ) {
    throw new TicketContractError("Gateway returned an invalid ticket list.");
  }

  return {
    tickets: response.tickets.map(validateTicket),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

function handleAuthenticationFailure(error) {
  const authenticationFailure =
    error instanceof GatewayRequestError &&
    error.status === 401 &&
    ["AUTHENTICATION_FAILED", "AUTHENTICATION_REQUIRED"].includes(error.details?.code);

  if (authenticationFailure) {
    clearAuthSession();
    window.dispatchEvent(new Event("auth:expired"));
  }
}

function requireUserToken() {
  const token = getUserAccessToken();
  if (!token) {
    throw new Error("نشست معتبر کاربر در دسترس نیست؛ دوباره وارد شوید.");
  }
  return token;
}

export async function listTickets({ limit = 25, offset = 0 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("Ticket list limit must be an integer between 1 and 100.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError("Ticket list offset must be a non-negative integer.");
  }

  const token = requireUserToken();
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });

  let response;
  try {
    response = await gatewayRequest("/api/v1/tickets?" + query.toString(), {
      method: "GET",
      headers: { "X-User-Access-Token": token },
    });
  } catch (error) {
    handleAuthenticationFailure(error);
    throw error;
  }

  return validateListResponse(response);
}

export async function getTicket(ticketId) {
  const normalizedTicketId = String(ticketId ?? "").trim();
  if (!normalizedTicketId) {
    throw new TypeError("Ticket identifier is required.");
  }

  const token = requireUserToken();
  let response;
  try {
    response = await gatewayRequest("/api/v1/tickets/" + encodeURIComponent(normalizedTicketId), {
      method: "GET",
      headers: { "X-User-Access-Token": token },
    });
  } catch (error) {
    handleAuthenticationFailure(error);
    throw error;
  }

  return validateTicket(response);
}
