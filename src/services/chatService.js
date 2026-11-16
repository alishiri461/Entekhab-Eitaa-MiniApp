import {
  GatewayConfigurationError,
  GatewayRequestError,
  gatewayRequest,
} from "./gatewayClient.js";
import { clearAuthSession, getUserAccessToken } from "./authService.js";

export class ChatContractError extends Error {
  constructor(message = "Gateway returned an invalid chat response.") {
    super(message);
    this.name = "ChatContractError";
  }
}

function createRandomHex() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random number generation is unavailable.");
  }
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

export function createChatConversationId() {
  return `eitaa-${createRandomHex()}`;
}

export async function sendChatMessage({ conversationId, text }) {
  const token = getUserAccessToken();
  if (!token) {
    throw new Error("نشست معتبر کاربر در دسترس نیست؛ دوباره وارد شوید.");
  }

  const normalizedConversationId = String(conversationId ?? "").trim();
  const normalizedText = String(text ?? "").trim();
  if (!normalizedConversationId || normalizedConversationId.length > 64) {
    throw new Error("شناسه گفتگو معتبر نیست.");
  }
  if (!normalizedText || normalizedText.length > 8000) {
    throw new Error("متن پیام باید بین ۱ تا ۸۰۰۰ کاراکتر باشد.");
  }

  let response;
  try {
    response = await gatewayRequest("/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Access-Token": token,
        "Idempotency-Key": createRandomHex(),
      },
      body: JSON.stringify({
        conversation_id: normalizedConversationId,
        text: normalizedText,
      }),
    });
  } catch (error) {
    if (error instanceof GatewayRequestError && error.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event("auth:expired"));
    }
    if (error instanceof GatewayConfigurationError || error instanceof GatewayRequestError) {
      throw error;
    }
    throw error;
  }

  if (
    !response ||
    typeof response !== "object" ||
    typeof response.request_id !== "string" ||
    !response.request_id.trim() ||
    typeof response.correlation_id !== "string" ||
    !response.correlation_id.trim() ||
    response.conversation_id !== normalizedConversationId ||
    typeof response.answer !== "string" ||
    !response.answer.trim()
  ) {
    throw new ChatContractError();
  }

  return {
    requestId: response.request_id,
    correlationId: response.correlation_id,
    conversationId: response.conversation_id,
    answer: response.answer.trim(),
  };
}
