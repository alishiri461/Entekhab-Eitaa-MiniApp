# Repository instructions

## Project intent
Build the independent Entekhab Eitaa Mini App branded "همیار انتخاب". Preserve isolation from existing Entekhab AI repositories and integrations.

## Non-negotiable architecture
- Eitaa WebView -> this frontend -> Entekhab API Gateway only.
- Never call Assistant, PersianRag, ActiveDirctoryManager, Ticket Manager, databases, or model servers directly from the browser.
- Do not invent Gateway routes, payloads, claims, roles, or authentication behavior. Inspect the actual Gateway contract first.
- Keep all service credentials and signing secrets server-side. Never put them in VITE_ variables.
- Treat initDataUnsafe as untrusted presentation data only. Authentication must validate raw initData on the server.

## Git workflow
- Work only on the explicitly designated feature branch.
- Never commit directly to main.
- Prefer small, reviewable commits and evidence-backed changes.
- Do not claim tests/builds passed unless they were actually run and outputs inspected.

## Engineering standards
- TypeScript strict mode.
- Keep dependencies minimal.
- Maintain RTL and Persian-first UX.
- Keep Eitaa SDK loaded from the official URL; do not vendor eitaa-web-app.js.
- Isolate Eitaa-specific code behind src/eitaa.
- Isolate network transport behind src/services.
- Handle loading, empty, error, timeout, and unauthorized states for real features.
- Add tests for security-sensitive parsing, authorization boundaries, and domain behavior when implemented.
- Do not log initData, tokens, employee identifiers, or ticket contents.

## Before implementing an integration
1. Inspect current Gateway source/OpenAPI and record exact contract evidence.
2. Confirm auth exchange and identity mapping design.
3. Add typed request/response contracts.
4. Implement only the Gateway adapter.
5. Add tests for success, failure, expiry, invalid input, and authorization.
6. Document any unresolved assumptions as blockers rather than silently guessing.
