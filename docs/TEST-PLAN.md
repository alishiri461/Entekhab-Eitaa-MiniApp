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

- [ ] درخواست OTP موبایل به `POST /api/v1/identity/otp/request` با `Idempotency-Key`، `X-Eitaa-Init-Data`، `mobile` و `channel=sms` ارسال شود.
- [ ] درخواست OTP کد پرسنلی به همان endpoint با `Idempotency-Key`، `X-Eitaa-Init-Data`، `employee_id` و `channel=sms` ارسال شود.
- [ ] هر دو درخواست فقط از WebView معتبر ایتا و با initData خام انجام شوند؛ `initDataUnsafe` برای احراز هویت استفاده نشود.
- [ ] اگر پاسخ `request_id` دارد، فرم ورود کد نمایش داده شود؛ اگر ندارد، مرحله Verify اجرا نشود.
- [ ] کد خارج از بازه ۶ تا ۸ رقم در UI رد شود.
- [ ] درخواست Verify به `POST /api/v1/identity/otp/verify` با `request_id`، `code`، `Idempotency-Key` و `X-Eitaa-Init-Data` ارسال شود.
- [ ] شناسه برگشتی برای کد پرسنلی opaque و متفاوت از شناسه Challenge داخلی AD Manager باشد.
- [ ] تغییر یا انقضای initData در مرحله Verify توسط Gateway رد شود.
- [ ] در پاسخ موفق، User Access Token و اطلاعات نشست فقط در حافظه runtime قرار گیرند.
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

## آزمون خودکار Gateway Client

پیش‌نیاز: Node.js نسخه ۱۸ یا بالاتر. آزمون‌ها به Gateway یا شبکه واقعی متصل نمی‌شوند و رفتار کلاینت HTTP را با پاسخ‌های ساختگی بررسی می‌کنند.

```bash
npm test
```

- [ ] رد کردن Gateway URL خالی
- [ ] رد کردن HTTP برای میزبان غیرمحلی
- [ ] ارسال Headerهای عمومی کلاینت و عدم ارسال Cookie/Credentials
- [ ] استخراج خطا از قالب FastAPI `detail`
- [ ] Abort درخواست پس از Timeout تنظیم‌شده

این آزمون‌ها جایگزین آزمون یکپارچه با Gateway و تست WebView ایتا نیستند.
