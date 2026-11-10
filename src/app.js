import { getEitaaRuntime, notifyEitaaReady } from "./eitaa/eitaaBridge.js";

const runtime = getEitaaRuntime();
const runtimeNote = document.querySelector("#runtime-note");
const greeting = document.querySelector("#welcome-title");

if (runtime.available) {
  runtimeNote.textContent = `محیط ایتا شناسایی شد · ${runtime.platform || "platform نامشخص"}`;
  if (runtime.displayName) greeting.textContent = `سلام ${runtime.displayName}، خوش آمدید`;
} else {
  runtimeNote.textContent = "پیش‌نمایش مرورگر · هویت ایتا در این محیط در دسترس نیست";
}

notifyEitaaReady();
