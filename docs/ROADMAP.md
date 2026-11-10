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
- [ ] تطبیق قراردادهای Gateway با کد/OpenAPI جاری و محیط مستقر

## Phase 1 — Shell و تجربه کاربری

- [x] صفحه ورود فارسی RTL با حالت‌های موبایل، OTP و ورود موفق
- [x] وضعیت loading، validation و خطا برای جریان OTP
- [ ] تکمیل navigation و state management سبک با JavaScript بومی
- [ ] تست در Eitaa Android و Desktop
- [ ] تنظیم رنگ‌ها و رفتار safe area با SDK

## Phase 2 — Gateway Authentication

- [x] اتصال UI به OTP موبایل از طریق Gateway
- [x] عدم اجرای verify در صورت نبود request_id
- [ ] پیاده‌سازی server-side initData validation در Gateway، پس از تعریف قرارداد
- [ ] نگاشت identity با سیاست سازمانی مصوب
- [ ] تست replay، expiry، tampering و authorization

## Phase 3 — Services

- [ ] Chat با قرارداد واقعی `/api/v1/chat`
- [ ] ثبت و پیگیری Ticket از Gateway
- [ ] نمایش guideهای موجود از Gateway؛ جستجوی آزاد فقط پس از ارائه route واقعی
- [ ] Profile و مجوزهای سازمانی

## Phase 4 — Release

- [ ] تست پذیرش سازمانی و امنیتی
- [ ] دامنه HTTPS بدون redirect برای URL ثبت‌شده
- [ ] ثبت در EitaaYar و تنظیم مقصد
- [ ] تنظیم CORS و allowlist کلاینت در Gateway
- [ ] پایش خطا، latency و نرخ موفقیت
- [ ] مستندات پشتیبانی و rollback

## معیارهای خروج

- پروژه بدون نصب dependency و بدون مرحله build از یک static HTTP server اجرا شود.
- هیچ React، TypeScript، JSX، Vite یا فایل پیکربندی build در پروژه وجود نداشته باشد.
- هیچ secret یا token در Frontend وجود نداشته باشد.
- تمام درخواست‌های Backend فقط از Gateway عبور کنند.
- هیچ ادعای اتصال واقعی یا احراز هویت معتبر بدون تست محیط Eitaa/Gateway مطرح نشود.
