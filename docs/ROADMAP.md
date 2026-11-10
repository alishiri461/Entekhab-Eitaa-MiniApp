# نقشه راه و معیارهای پذیرش

## Phase 0 — Foundation (فعلی)

- [x] مخزن مستقل و Branch مستقل
- [x] پایه React/TypeScript/Vite
- [x] بارگذاری SDK رسمی Eitaa
- [x] مرزبندی اولیه Eitaa bridge و Gateway transport
- [x] مستندات معماری، API و امنیت
- [ ] تطبیق قراردادهای Gateway با کد/OpenAPI واقعی
- [ ] بازبینی امنیتی جریان احراز هویت

## Phase 1 — Shell و تجربه کاربری

- [ ] تکمیل طراحی responsive و دسترس‌پذیر
- [ ] navigation و state management سبک
- [ ] خطا، loading، empty و offline states
- [ ] تست در Eitaa Android و Desktop
- [ ] تنظیم رنگ‌ها و رفتار safe area با SDK

## Phase 2 — Gateway Authentication

- [ ] پیاده‌سازی server-side initData validation
- [ ] نگاشت identity با سیاست سازمانی مصوب
- [ ] صدور نشست امن از Gateway
- [ ] تست replay، expiry، tampering و authorization

## Phase 3 — Services

- [ ] Chat با قرارداد واقعی `/api/v1/chat`
- [ ] ثبت و پیگیری Ticket از Gateway
- [ ] جستجوی Knowledge از Gateway
- [ ] Profile و مجوزهای سازمانی

## Phase 4 — Release

- [ ] تست پذیرش سازمانی و امنیتی
- [ ] دامنه HTTPS بدون redirect برای URL ثبت‌شده
- [ ] ثبت در EitaaYar و تنظیم مقصد
- [ ] پایش خطا، latency و نرخ موفقیت
- [ ] مستندات پشتیبانی و rollback

## معیارهای خروج Phase 0

- پروژه با npm install قابل نصب باشد.
- typecheck و production build موفق باشند.
- هیچ secret یا token در Frontend وجود نداشته باشد.
- تمام درخواست‌های Backend فقط از Gateway عبور کنند.
- هیچ ادعای اتصال واقعی یا احراز هویت معتبر بدون تست محیط Eitaa/Gateway مطرح نشود.
