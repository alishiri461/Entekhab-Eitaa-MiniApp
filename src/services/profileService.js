import { GatewayRequestError, gatewayRequest } from "./gatewayClient.js";
import { clearAuthSession, getUserAccessToken } from "./authService.js";

const STRING_FIELDS = [
  "username",
  "name",
  "surname",
  "email",
  "employee_id",
  "department",
  "display_name",
  "mobile",
  "telephone",
  "cost_center",
  "job_title",
  "office",
  "password_last_set",
];

const ARRAY_FIELDS = ["groups", "roles", "permissions"];

export class ProfileContractError extends Error {
  constructor(message = "Gateway returned an invalid current-user profile.") {
    super(message);
    this.name = "ProfileContractError";
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateUserProfile(user) {
  if (!isObject(user) || typeof user.user_id !== "string" || !user.user_id.trim()) {
    throw new ProfileContractError();
  }

  for (const field of STRING_FIELDS) {
    const value = user[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      throw new ProfileContractError("Gateway returned an invalid profile field: " + field);
    }
  }

  for (const field of ARRAY_FIELDS) {
    const value = user[field];
    if (
      value !== undefined &&
      (!Array.isArray(value) || value.some(item => typeof item !== "string"))
    ) {
      throw new ProfileContractError("Gateway returned an invalid profile collection: " + field);
    }
  }

  return user;
}

export async function getCurrentUserProfile() {
  const token = getUserAccessToken();
  if (!token) {
    throw new Error("نشست معتبر کاربر در دسترس نیست؛ دوباره وارد شوید.");
  }

  let response;
  try {
    response = await gatewayRequest("/api/v1/me", {
      method: "GET",
      headers: {
        "X-User-Access-Token": token,
      },
    });
  } catch (error) {
    const authenticationFailure =
      error instanceof GatewayRequestError &&
      error.status === 401 &&
      ["AUTHENTICATION_FAILED", "AUTHENTICATION_REQUIRED"].includes(error.details?.code);

    if (authenticationFailure) {
      clearAuthSession();
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw error;
  }

  if (!isObject(response) || !isObject(response.user)) {
    throw new ProfileContractError();
  }

  return validateUserProfile(response.user);
}
