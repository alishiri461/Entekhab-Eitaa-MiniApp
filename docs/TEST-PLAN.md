# برنامه آزمون دستی Mini App

## وضعیت اجرا

این سند سناریوهای پذیرش را تعریف می‌کند. تا زمان اجرای سناریوها در مرورگر و محیط واقعی ایتا، هیچ‌کدام را نباید Passed تلقی کرد.

## پیش‌نیاز محیط

- [ ] مقدار `gatewayBaseUrl` در `src/config.js` به URL واقعی HTTPS تنظیم شده باشد.
- [ ] Origin دقیق میزبانی Mini App در CORS محیط Gateway مجاز شده باشد.
- [ ] شناسه `enterprise-support-eitaa` در `PUBLIC_USER_CLIENT_IDS` محیط Gateway مجاز شده باشد.
- [ ] مسیرهای OTP در Gateway در دسترس باشند.
- [ ] برای اجرای محلی، پروژه از static HTTP server مانند `python -m http.server 4173` سرو شود؛ از بازکردن مستقیم `file://` استفاده نشود.

## آزمون رابط کاربری

- [ ] صفحه بدون خطای JavaScript بارگذاری شود.
- [ ] جهت RTL، فونت fallback و layout در عرض موبایل درست باشند.
- [ ] SDK ایتا در WebView بارگذاری شود و در مرورگر عادی نبود SDK باعث crash نشود.
- [ ] شماره موبایل با ارقام فارسی و انگلیسی پذیرفته و به ارقام ASCII تبدیل شود.
- [ ] شماره با قالب نامعتبر پیش از ارسال رد شود.
- [ ] هنگام ارسال OTP دکمه غیرفعال و وضعیت انتظار نمایش داده شود.

## آزمون قرارداد OTP

- [ ] درخواست به `POST /api/v1/identity/otp/request` با `Idempotency-Key`، `mobile` و `channel=sms` ارسال شود.
- [ ] اگر پاسخ `request_id` دارد، فرم ورود کد نمایش داده شود.
- [ ] اگر پاسخ `request_id` ندارد، مرحله verify اجرا نشود و پیام مناسب نمایش داده شود.
- [ ] کد خارج از بازه ۶ تا ۸ رقم در UI رد شود.
- [ ] درخواست verify فقط به `POST /api/v1/identity/otp/verify` و با `request_id` و `code` ارسال شود.
- [ ] در پاسخ موفق، توکن و اطلاعات نشست فقط در حافظه runtime قرار گیرند.
- [ ] هیچ توکن یا OTP در localStorage، sessionStorage یا log نوشته نشود.
- [ ] با خروج کاربر، نشست حافظه پاک شود.
- [ ] پس از `expires_in`، نشست پاک و کاربر به صفحه ورود برگردانده شود.

## آزمون خطا و امنیت

- [ ] خطای شبکه و CORS به پیام قابل فهم تبدیل شود.
- [ ] خطای 4xx و 5xx Gateway بدون نمایش stack trace مدیریت شود.
- [ ] Gateway با HTTP روی host غیرمحلی توسط کلاینت رد شود.
- [ ] هیچ درخواست مستقیمی به Assistant، RAG، AD Manager یا Ticket Manager مشاهده نشود.
- [ ] در DevTools هیچ Service JWT، Bot Token یا کلید خصوصی وجود نداشته باشد.
- [ ] آزمون‌های OTP نامعتبر، منقضی، rate-limit و پاسخ بدون request_id انجام شوند.

## آزمون محیط ایتا

- [ ] Mini App در Eitaa Android باز شود.
- [ ] Mini App در Eitaa Desktop باز شود.
- [ ] safe area، اندازه viewport، برگشت و بستن WebView بررسی شوند.
- [ ] عملکرد روی اتصال ضعیف و قطع/وصل شبکه بررسی شود.
