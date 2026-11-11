// Public configuration only. Never put credentials or service tokens here.
// TEMPORARY: HTTP is enabled only for private-LAN testing. Disable it before publishing.
window.APP_CONFIG = Object.freeze({
  gatewayBaseUrl: "http://192.168.25.150:6100",
  allowInsecureGatewayForDevelopment: true,
  clientId: "enterprise-support-eitaa",
  requestTimeoutMs: 15000,
});
