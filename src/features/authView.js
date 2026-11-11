import {
  clearAuthSession,
  getAuthSession,
  requestMobileOtp,
  verifyMobileOtp,
} from "../services/authService.js";

const loginPanel = document.querySelector("#login-panel");
const otpPanel = document.querySelector("#otp-panel");
const signedInPanel = document.querySelector("#signed-in-panel");
const mobileForm = document.querySelector("#mobile-form");
const otpForm = document.querySelector("#otp-form");
const mobileInput = document.querySelector("#mobile");
const otpInput = document.querySelector("#otp-code");
const phoneLabel = document.querySelector("#otp-phone");
const authStatus = document.querySelector("#auth-status");
const requestButton = document.querySelector("#request-otp-button");
const verifyButton = document.querySelector("#verify-otp-button");
const resendButton = document.querySelector("#resend-otp-button");
const backButton = document.querySelector("#back-to-mobile-button");
const logoutButton = document.querySelector("#logout-button");
const signedInName = document.querySelector("#signed-in-name");
const dashboardGreeting = document.querySelector("#dashboard-greeting");

let pendingRequestId = null;
let pendingMobile = null;

function toAsciiDigits(value) {
  return String(value).replace(/[۰-۹٠-٩]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 && code <= 0x06f9 ? code - 0x06f0 : code - 0x0660);
  });
}

function showStatus(message, kind = "info") {
  authStatus.textContent = message;
  authStatus.dataset.kind = kind;
  authStatus.hidden = !message;
}

function setBusy(button, busy, busyText) {
  if (!button.dataset.idleText) button.dataset.idleText = button.querySelector("span")?.textContent ?? button.textContent;
  button.disabled = busy;
  const label = button.querySelector("span");
  if (label) label.textContent = busy ? busyText : button.dataset.idleText;
  else button.textContent = busy ? busyText : button.dataset.idleText;
}

function showPanel(panel) {
  loginPanel.hidden = panel !== "login";
  otpPanel.hidden = panel !== "otp";
  signedInPanel.hidden = panel !== "signed-in";
}

function formatMobile(mobile) {
  return mobile.replace(/^(09)(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5");
}

function friendlyError(error) {
  if (error?.name === "GatewayConfigurationError") return "آدرس Gateway هنوز در تنظیمات برنامک ثبت نشده است.";
  if (error?.name === "GatewayRequestError") {
    const code = error.details?.code;
    const known = {
      RATE_LIMITED: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
      OTP_INVALID: "کد واردشده معتبر نیست.",
      OTP_EXPIRED: "مهلت کد تأیید به پایان رسیده است. کد جدید درخواست کنید.",
      UNAUTHORIZED: "درخواست مجاز نیست. دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.",
    };
    if (known[code]) return known[code];
    if (error.status >= 500) return "سرویس احراز هویت موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.";
    return "درخواست انجام نشد. اطلاعات را بررسی کنید و دوباره تلاش کنید.";
  }
  return error instanceof Error ? error.message : "خطای پیش‌بینی‌نشده‌ای رخ داد.";
}

function getDisplayName(user) {
  return [user?.display_name, user?.name, user?.username, user?.id]
    .find(value => typeof value === "string" && value.trim()) || "کاربر سازمانی";
}

function enterWorkspace(user) {
  const name = getDisplayName(user);
  signedInName.textContent = name;
  dashboardGreeting.textContent = `سلام ${name}، خوش آمدید`;
  showPanel("signed-in");
  showStatus("");
  window.dispatchEvent(new Event("auth:ready"));
}

async function submitMobile(event) {
  event.preventDefault();
  const mobile = toAsciiDigits(mobileInput.value).replace(/[\s-]/g, "");
  if (!/^09\d{9}$/.test(mobile)) {
    showStatus("شماره موبایل را با قالب ۰۹xxxxxxxxx وارد کنید.", "error");
    mobileInput.focus();
    return;
  }

  showStatus("");
  setBusy(requestButton, true, "در حال ارسال…");
  try {
    const result = await requestMobileOtp(mobile);
    const requestId = typeof result?.request_id === "string" ? result.request_id.trim() : "";
    if (!requestId) {
      showStatus("درخواست دریافت شد؛ اما Gateway شناسه لازم برای مرحله تأیید را در پاسخ ارائه نکرد. تا زمان اصلاح قرارداد پاسخ، امکان ادامه ورود وجود ندارد.", "warning");
      return;
    }
    pendingRequestId = requestId;
    pendingMobile = mobile;
    phoneLabel.textContent = formatMobile(mobile);
    otpInput.value = "";
    showPanel("otp");
    showStatus("کد تأیید ارسال شد. کد پیامک‌شده را وارد کنید.", "success");
    otpInput.focus();
  } catch (error) {
    showStatus(friendlyError(error), "error");
  } finally {
    setBusy(requestButton, false);
  }
}

async function submitOtp(event) {
  event.preventDefault();
  if (!pendingRequestId) {
    showStatus("شناسه درخواست تأیید موجود نیست؛ دوباره درخواست کد کنید.", "error");
    return;
  }
  const code = toAsciiDigits(otpInput.value).trim();
  if (!/^\d{6,8}$/.test(code)) {
    showStatus("کد تأیید باید بین ۶ تا ۸ رقم باشد.", "error");
    otpInput.focus();
    return;
  }

  showStatus("");
  setBusy(verifyButton, true, "در حال بررسی…");
  try {
    await verifyMobileOtp(pendingRequestId, code);
    pendingRequestId = null;
    enterWorkspace(getAuthSession()?.user ?? {});
  } catch (error) {
    showStatus(friendlyError(error), "error");
  } finally {
    setBusy(verifyButton, false);
  }
}

function returnToMobile() {
  pendingRequestId = null;
  pendingMobile = null;
  otpInput.value = "";
  showPanel("login");
  showStatus("");
  mobileInput.focus();
}

function logout() {
  clearAuthSession();
  pendingRequestId = null;
  pendingMobile = null;
  otpInput.value = "";
  otpPanel.hidden = true;
  mobileForm.reset();
  showPanel("login");
  showStatus("از حساب کاربری خارج شدید.", "info");
}

mobileForm.addEventListener("submit", submitMobile);
otpForm.addEventListener("submit", submitOtp);
resendButton.addEventListener("click", () => {
  if (pendingMobile) mobileInput.value = pendingMobile;
  returnToMobile();
  mobileForm.requestSubmit();
});
backButton.addEventListener("click", returnToMobile);
logoutButton.addEventListener("click", logout);

window.addEventListener("auth:expired", () => {
  pendingRequestId = null;
  pendingMobile = null;
  showPanel("login");
  showStatus("اعتبار نشست به پایان رسیده است؛ دوباره وارد شوید.", "warning");
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !getAuthSession() && !signedInPanel.hidden) {
    clearAuthSession();
    showPanel("login");
    showStatus("اعتبار نشست به پایان رسیده است؛ دوباره وارد شوید.", "warning");
  }
});

if (getAuthSession()) enterWorkspace(getAuthSession().user ?? {});
else showPanel("login");
