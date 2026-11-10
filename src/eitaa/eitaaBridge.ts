export interface EitaaRuntime {
  available: boolean;
  initData: string;
  displayName?: string;
  platform?: string;
  version?: string;
}

export function getEitaaRuntime(): EitaaRuntime {
  const webApp = window.Eitaa?.WebApp;

  if (!webApp) {
    return { available: false, initData: "" };
  }

  return {
    available: true,
    initData: webApp.initData ?? "",
    // UI-only hint. Never use this value as authenticated identity.
    displayName: webApp.initDataUnsafe?.user?.first_name,
    platform: webApp.platform,
    version: webApp.version,
  };
}

export function notifyEitaaReady(): void {
  window.Eitaa?.WebApp?.ready?.();
}
