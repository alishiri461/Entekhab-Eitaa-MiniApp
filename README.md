# همیار انتخاب | Entekhab Eitaa MiniApp

برنامک خدمات هوشمند فناوری اطلاعات گروه انتخاب در پیام‌رسان ایتا.

## فناوری‌ها

این پروژه عمداً بدون فریم‌ورک و ابزار Build پیاده‌سازی می‌شود:

- HTML5
- CSS3
- JavaScript خالص با ES Modules
- SDK رسمی ایتا از CDN
- فونت فارسی Vazirmatn (نسخه متغیر، وزن‌های 100 تا 900) از CDN رسمی پروژه فونت

React، Vue، Angular، TypeScript، JSX، Vite، bundler و کتابخانه UI در پروژه استفاده نمی‌شوند.

## معماری

`Eitaa WebView → HTML/CSS/Vanilla JavaScript → Entekhab API Gateway → Backend Services`

مرورگر فقط Gateway را فراخوانی می‌کند و هیچ اتصال مستقیمی به Assistant، RAG، Active Directory، Ticket Manager، دیتابیس یا مدل زبانی ندارد.

## ساختار

- `index.html`: ساختار صفحه و بارگذاری SDK رسمی ایتا
- `src/styles/global.css`: طراحی RTL و واکنش‌گرا
- `src/app.js`: راه‌اندازی UI و اتصال به runtime ایتا
- `src/config.js`: تنظیمات عمومی قابل مشاهده در مرورگر
- `src/eitaa/`: bridge مربوط به SDK ایتا
- `src/features/authView.js`: رابط ورود OTP
- `src/services/`: ارتباط HTTP و سرویس‌های Gateway

## اجرا

برای اجرای محلی، از یک static HTTP server استفاده کنید؛ برای مثال:

```bash
python -m http.server 4173
```

سپس `http://localhost:4173` را باز کنید. برای استفاده عملیاتی، فایل‌ها باید روی دامنه HTTPS میزبانی شوند و URL نهایی در تنظیمات ایتایار ثبت شود.

## تنظیم Gateway

در `src/config.js` فقط آدرس عمومی HTTPS مربوط به Gateway را در `gatewayBaseUrl` قرار دهید. این فایل عمومی است؛ هیچ Bot Token، Service JWT، کلید خصوصی یا Secret نباید در آن قرار بگیرد.

پیش از اتصال عملیاتی، Gateway باید origin واقعی برنامک را در CORS و شناسه `enterprise-support-eitaa` را در `PUBLIC_USER_CLIENT_IDS` مجاز کند. این مخزن به‌تنهایی تنظیمات Gateway را تغییر نمی‌دهد.

## احراز هویت

- ورود با شماره موبایل یا کد پرسنلی از مسیرهای canonical Gateway انجام می‌شود.
- هر درخواست OTP و هر درخواست Verify در کلاینت ایتا، `X-Eitaa-Init-Data` خام را ارسال می‌کند؛ Gateway امضای آن را سمت سرور اعتبارسنجی می‌کند.
- در ورود با کد پرسنلی، Gateway شناسه opaque اختصاصی خود را به Mini App می‌دهد و شناسه Challenge سرویس هویت را در سمت سرور نگه می‌دارد.
- بات بله همچنان از قرارداد backend-to-backend و Service JWT خودش استفاده می‌کند؛ این قرارداد در Mini App کپی نشده است.
- User Access Token فقط در حافظه JavaScript نگهداری می‌شود و در localStorage/sessionStorage قرار نمی‌گیرد.
- توکن هنوز به endpointهای محافظت‌شده چت، پروفایل یا تیکت متصل نشده است؛ این اتصال در مرحله بعدی انجام می‌شود.

## وضعیت

صفحه ورود OTP به سرویس‌های Gateway متصل شده است. اجرای واقعی نیازمند تنظیم Gateway URL، CORS و allowlist کلاینت در محیط استقرار است. هنوز تست در مرورگر و محیط واقعی ایتا انجام نشده است.

## مستندات

- [معماری](docs/ARCHITECTURE.md)
- [قراردادهای API](docs/API-CONTRACTS.md)
- [امنیت](docs/SECURITY.md)
- [برنامه آزمون دستی](docs/TEST-PLAN.md)
- [نقشه راه](docs/ROADMAP.md)
