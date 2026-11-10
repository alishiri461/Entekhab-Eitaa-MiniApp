# Repository instructions

## Project intent
Build the independent Entekhab Eitaa Mini App branded "همیار انتخاب". Preserve isolation from existing Entekhab AI repositories and integrations.

## Non-negotiable architecture
- Eitaa WebView -> this frontend -> Entekhab API Gateway only.
- Frontend technology is plain HTML5, CSS3, and Vanilla JavaScript ES Modules.
- Do not introduce React, Vue, Angular, TypeScript, JSX, Vite, bundlers, transpilers, or UI frameworks.
- Never call Assistant, PersianRag, ActiveDirctoryManager, Ticket Manager, databases, or model servers directly from the browser.
- Do not invent Gateway routes, payloads, claims, roles, or authentication behavior. Inspect the actual Gateway contract first.
- Keep all service credentials and signing secrets server-side. Never place secrets in browser configuration.
- Treat initDataUnsafe as untrusted presentation data only. Authentication must validate raw initData on the server.

## Git workflow
- Work only on the explicitly designated feature branch.
- Never commit directly to main.
- Prefer small, reviewable commits and evidence-backed changes.
- Do not claim tests/builds passed unless they were actually run and outputs inspected.

## Engineering standards
- Keep dependencies at zero unless a documented requirement justifies one.
- Maintain RTL and Persian-first UX.
- Keep Eitaa SDK loaded from the official URL; do not vendor eitaa-web-app.js.
- Isolate Eitaa-specific code behind src/eitaa.
- Isolate network transport behind src/services.
- Handle loading, empty, error, timeout, and unauthorized states for real features.
- Do not log initData, tokens, employee identifiers, or ticket contents.

## Before implementing an integration
1. Inspect current Gateway source/OpenAPI and record exact contract evidence.
2. Confirm auth exchange and identity mapping design.
3. Implement only the documented Gateway adapter.
4. Add security-focused validation and error handling.
5. Verify browser behavior and deployment requirements without claiming unrun tests.

## Security
- User Access Token stays in runtime memory only; never localStorage/sessionStorage.
- No Service JWT, Bot Token, private key, or secret in frontend.
- No Eitaa initData authentication until a server-side Gateway contract exists.
- CORS and PUBLIC_USER_CLIENT_IDS changes belong to Gateway operations, not this repository.
