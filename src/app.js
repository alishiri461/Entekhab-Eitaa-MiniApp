import { getEitaaRuntime, notifyEitaaReady } from "./eitaa/eitaaBridge.js";
import "./features/authView.js";
import "./features/workspaceView.js";

const runtime = getEitaaRuntime();
const runtimeNote = document.querySelector("#runtime-note");
const greeting = document.querySelector("#dashboard-greeting");

if (runtime.available) {
  runtimeNote.textContent = `محیط ایتا شناسایی شد · ${runtime.platform || "platform نامشخص"}`;
  if (runtime.displayName) greeting.textContent = `سلام ${runtime.displayName}، خوش آمدید`;
} else {
  runtimeNote.textContent = "پیش‌نمایش مرورگر · هویت ایتا در این محیط در دسترس نیست";
}

window.addEventListener("auth:ready", () => {\n  const note = document.querySelector("#runtime-note");\n  if (note) note.textContent = runtime.available\n    ? `محیط ایتا شناسایی شد · ${runtime.platform || "platform نامشخص"}`\n    : "پیش‌نمایش مرورگر · هویت ایتا در این محیط در دسترس نیست";\n});\n\nnotifyEitaaReady();
