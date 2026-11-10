export function getEitaaRuntime() {
  const webApp = window.Eitaa?.WebApp;
  if (!webApp) return { available: false, initData: "" };

  return {
    available: true,
    initData: webApp.initData ?? "",
    // Presentation hint only. Never use initDataUnsafe for authentication.
    displayName: webApp.initDataUnsafe?.user?.first_name,
    platform: webApp.platform,
    version: webApp.version,
  };
}

export function notifyEitaaReady() {
  window.Eitaa?.WebApp?.ready?.();
}
