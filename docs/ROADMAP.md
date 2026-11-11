# نقشه راه و معیارهای پذیرش

## Phase 0 — Foundation

- [x] مخزن مستقل و Branch مستقل
- [x] پایه HTML5 / CSS3 / Vanilla JavaScript
- [x] حذف React، TypeScript، JSX، Vite و وابستگی‌های Build
- [x] بارگذاری SDK رسمی Eitaa
- [x] مرزبندی Eitaa bridge و Gateway transport
- [x] مستندات معماری، API و امنیت
- [x] رابط ورود OTP متصل به سرویس‌های canonical Gateway
- [x] نگهداری request_id و User Access Token فقط در حافظه
- [ ] اجرای smoke test در static HTTP server و مرورگر
- [x] تطبیق source-level قراردادهای OTP با شاخه موجود Gateway
- [ ] تأیید قراردادها در محیط مستقر و اجرای تست end-to-end

## Phase 1 — Shell و تجربه کاربری

- [x] صفحه ورود فارسی RTL با حالت‌های موبایل، OTP و ورود موفق
- [x] وضعیت loading، validation و خطا برای جریان OTP
- [ ] تکمیل navigation و state management سبک با JavaScript بومی
- [ ] تست در Eitaa Android و Desktop
- [ ] تنظیم رنگ‌ها و رفتار safe area با SDK

## Phase 2 — Gateway Authentication

- [x] اتصال UI به OTP موبایل و کد پرسنلی از طریق Gateway
- [x] عدم اجرای verify در صورت نبود request_id
- [x] ارسال initData خام در Header هر دو مرحله Request و Verify
- [x] نگهداری User Access Token فقط در حافظه runtime
- [ ] تست واقعی امضا، انقضا، replay، tampering و مالکیت Challenge در محیط Gateway
- [ ] تأیید تنظیم CORS و allowlist کلاینت در محیط مستقر
- [ ] تأیید سیاست انقضای نشست و رفتار ورود مجدد

**محدودیت شناخته‌شده فاز بدون Redis:** Challenge و Rate Limiting در Gateway حافظه‌ای و process-local هستند. `Idempotency-Key` فعلاً فقط از نظر وجود و طول اعتبارسنجی می‌شود و replay-safe نیست. Mini App این محدودیت را رفع نمی‌کند؛ تا زمان تغییر زیرساخت Gateway باید در تست و استقرار لحاظ شود.

## Phase 3 — Services

- [ ] Chat با قرارداد واقعی `POST /api/v1/chat` و User Access Token
- [ ] Profile با قرارداد واقعی `GET /api/v1/me`
- [ ] ثبت و پیگیری Ticket فقط از مسیرهای مستند Gateway
- [ ] نمایش guideهای موجود از Gateway؛ جستجوی آزاد فقط پس از ارائه route واقعی
- [ ] مدیریت خطای شبکه، نشست منقضی، مجوز ناکافی و پاسخ نامعتبر
- [ ] جلوگیری از نمایش داده نمونه به‌عنوان داده واقعی سازمانی

## Phase 4 — Release

- [ ] تست پذیرش سازمانی و امنیتی
- [ ] دامنه HTTPS بدون redirect برای URL ثبت‌شده
- [ ] ثبت در EitaaYar و تنظیم مقصد
- [ ] تأیید CORS و allowlist کلاینت توسط مالک Gateway؛ بدون تغییر در مخزن Gateway در این فاز
- [ ] پایش خطا، latency و نرخ موفقیت
- [ ] مستندات پشتیبانی و rollback

## معیارهای خروج

- پروژه بدون نصب dependency و بدون مرحله build از یک static HTTP server اجرا شود.
- هیچ React، TypeScript، JSX، Vite یا فایل پیکربندی build در پروژه وجود نداشته باشد.
- هیچ secret یا token در Frontend وجود نداشته باشد.
- تمام درخواست‌های Backend فقط از Gateway عبور کنند.
- هیچ ادعای اتصال واقعی یا احراز هویت معتبر بدون تست محیط Eitaa/Gateway مطرح نشود.
- بات بله و مخزن ApiGateWay در این دامنه توسعه تغییر نکنند.
