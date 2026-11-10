# قراردادهای API

## وضعیت قراردادها

این سند قرارداد قطعی سرویس‌های موجود را جعل نمی‌کند. فقط مواردی را ثبت می‌کند که از تصمیمات معماری فعلی اکوسیستم مشخص هستند. پیش از اتصال عملیاتی، OpenAPI یا کد Gateway باید بررسی و قراردادها با نسخه واقعی تطبیق داده شوند.

## قرارداد پایه شناخته‌شده

| مورد | مقدار | وضعیت |
|---|---|---|
| ورودی کلاینت | Entekhab API Gateway | اصل معماری تأییدشده |
| Chat | `POST /api/v1/chat` | مسیر شناخته‌شده؛ payload نیازمند تطبیق |
| Authentication | نشست/توکن صادرشده توسط Gateway | جزئیات جریان Eitaa هنوز نیازمند طراحی |
| Tickets | از طریق Gateway | مسیرها و schema نیازمند بررسی |
| Knowledge/RAG | از طریق Gateway | مسیرها و schema نیازمند بررسی |

## جریان پیشنهادی احراز هویت Eitaa

1. کلاینت `window.Eitaa.WebApp.initData` خام را دریافت می‌کند.
2. کلاینت آن را فقط به endpoint اختصاصی اعتبارسنجی در Gateway ارسال می‌کند.
3. Gateway با توکن/secret سمت سرور و الگوریتم مستند Eitaa، hash را اعتبارسنجی می‌کند.
4. Gateway تازگی `auth_date` را با حداکثر عمر قابل تنظیم کنترل می‌کند.
5. Gateway شناسه Eitaa را به هویت سازمانی نگاشت می‌کند؛ سیاست این نگاشت باید توسط سازمان تعیین شود.
6. Gateway نشست کوتاه‌عمر و محدود به کاربر/دستگاه صادر می‌کند.
7. کلاینت از نشست صادرشده فقط برای APIهای مجاز Gateway استفاده می‌کند.

این جریان تا زمانی که endpoint و سیاست نگاشت در Gateway پیاده‌سازی و بازبینی نشده، صرفاً طرح معماری است.

## قواعد درخواست

- فقط HTTPS در محیط عملیاتی.
- عدم ارسال Service JWT از Frontend.
- عدم استفاده از داده `initDataUnsafe` برای authorization.
- عدم ذخیره initData خام یا توکن در localStorage/sessionStorage.
- خطاهای API باید بدون افشای stack trace، token یا داده حساس به UI نگاشت شوند.

## اطلاعات لازم برای بستن قرارداد

- OpenAPI یا route/schema واقعی Gateway.
- endpoint و پاسخ نهایی Eitaa authentication exchange.
- قرارداد دقیق Chat و مدل پیام/تاریخچه.
- ticket create/list/detail/comment schema و مجوزها.
- knowledge search schema، pagination و محدودیت نتایج.
- CORS، rate limits، timeout، retry و correlation-id policy.
