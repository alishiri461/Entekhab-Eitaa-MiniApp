# قراردادهای API برنامک همیار انتخاب

## مبنای بررسی

این قرارداد بر اساس کد و مستندات شاخه `main` مخزن `alishiri461/ApiGateWay` استخراج شده است.

- Gateway commit بررسی‌شده: `87b6ad71b3bd1de12c12f24483b3a39ef1430516`
- فایل‌های اصلی: `app/api/v1/channel.py`، `app/api/v1/identity_auth.py`، `app/api/v1/auth.py`، `app/api/v1/me.py`، `app/core/dependencies.py`، `app/models/contracts.py` و `app/main.py`
- این بررسی Source-level است؛ تست، Build، استقرار یا درخواست زنده به Gateway اجرا نشده است.
- قراردادهای زیر آنچه را کد فعلی پیاده‌سازی می‌کند از موارد نیازمند تنظیم استقرار جدا می‌کنند.

## 1. احراز هویت کاربر

### 1.1 مسیر پیشنهادی: OTP موبایل سازمانی

Gateway در حال حاضر دو خانواده مسیر OTP دارد. برای کلاینت جدید، مسیر canonical زیر مناسب‌تر است؛ چون شناسه درخواست و پاسخ کاربر ساخت‌یافته دارد.

**درخواست OTP**

`POST /api/v1/identity/otp/request`

Header اجباری:
`Idempotency-Key: <unique-operation-key>`

بدنه؛ دقیقاً یکی از `mobile` یا `employee_id` باید ارسال شود:

```json
{
  "mobile": "09xxxxxxxxx",
  "channel": "sms"
}
```

یا:

```json
{
  "employee_id": "14033874",
  "channel": "sms"
}
```

نکات اجرایی:
- `channel` در مدل فعلی فقط مقدار `sms` را می‌پذیرد.
- درخواست با `mobile` در مسیر canonical عمومی است.
- درخواست با `employee_id` نیازمند Service JWT معتبر است؛ بنابراین Mini App مرورگر نباید این مسیر را مستقیماً با credential سرویس فراخوانی کند.
- پاسخ عمومی ممکن است فقط `accepted` و `message` داشته باشد؛ نبودن `request_id` یعنی کلاینت نباید مرحله verify را اجرا کند. این رفتار برای جلوگیری از افشای وجود یا عدم وجود حساب است.
- در صورت صدور challenge، پاسخ شامل `request_id`، `delivery_channel` و در صورت وجود `expires_in` خواهد بود.

نمونه پاسخ دارای challenge:

```json
{
  "accepted": true,
  "message": "If the identity is eligible, an OTP will be sent.",
  "request_id": "opaque-challenge-id",
  "delivery_channel": "sms",
  "expires_in": 180
}
```

**تأیید OTP**

`POST /api/v1/identity/otp/verify`

Header اجباری:
`Idempotency-Key: <unique-operation-key>`

بدنه:

```json
{
  "request_id": "opaque-challenge-id",
  "code": "123456"
}
```

قواعد:
- `request_id` همان مقدار opaque دریافتی از مرحله request است.
- `code` در مدل Gateway بین ۶ تا ۸ رقم است.
- Gateway توکن دریافتی از AD Manager را اعتبارسنجی می‌کند و سازگاری `user.username`، `user.id` و claim `sub` را کنترل می‌کند.
- پاسخ موفق شامل `access_token`، `token_type`، `expires_in` و `user` است.
- این توکن، User Access Token صادرشده توسط AD Manager است؛ Service JWT نیست.

نمونه پاسخ موفق:

```json
{
  "access_token": "<user-access-token>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "14033874",
    "username": "14033874",
    "display_name": "نام کاربر",
    "roles": [],
    "permissions": []
  }
}
```

مقادیر نمونه صرفاً نمایشی‌اند؛ عمر واقعی توکن باید از پاسخ Gateway خوانده شود.

### 1.2 مسیرهای Legacy

Gateway همچنان مسیرهای زیر را نیز پیاده‌سازی می‌کند:
- `POST /api/v1/auth/mobile/request-otp` با بدنه `{ "mobile": "..." }`
- `POST /api/v1/auth/mobile/verify-otp` با بدنه `{ "challenge_id": "...", "code": "..." }`

این مسیرها `challenge_id` را به‌کار می‌برند و نباید با قرارداد canonical که از `request_id` استفاده می‌کند مخلوط شوند. برای Mini App جدید، مسیر canonical ترجیح داده می‌شود.

### 1.3 اعتبارسنجی Eitaa

در Gateway فعلی endpointی برای اعتبارسنجی `Eitaa initData` و تبدیل آن به User Access Token مشاهده نشد. همچنین کد فعلی، شناسه Eitaa را به حساب سازمانی متصل نمی‌کند.

بنابراین در نسخه اول:
- احراز هویت سازمانی با OTP موبایل ثبت‌شده در AD انجام می‌شود.
- `initDataUnsafe` و شناسه/نام نمایشی Eitaa منبع مجوز یا هویت سازمانی نیستند.
- اعتبارسنجی `initData` در صورت نیاز به اتصال حساب Eitaa، یک جریان جداگانه سمت سرور و نیازمند تصمیم امنیتی/پیاده‌سازی مستقل است.
- سند `docs/EITAA_SERVICE_JWT_TRUST.md` درباره اعتماد Gateway به **Eitaa backend service JWT** است؛ این سند به معنی مجاز بودن قرار دادن Service JWT در Frontend یا وجود endpoint تبادل initData نیست.

## 2. احراز هویت درخواست‌های محافظت‌شده

برای درخواست‌های کاربرمحور مانند چت، پروفایل و تیکت، Gateway در کد فعلی این مرز را اعمال می‌کند:

- `X-User-Access-Token: <AD-issued-user-access-token>`
- `X-Client-ID: <allowlisted-client-id>`

در کد `require_public_or_service_identity`، مقدار `X-Client-ID` باید در `PUBLIC_USER_CLIENT_IDS` مجاز باشد و User Access Token نیز به‌صورت مستقل اعتبارسنجی می‌شود. مقدار Client ID به‌تنهایی احراز هویت نیست و نباید به‌عنوان اثبات اصالت WebView تلقی شود.

مقدار پیش‌فرض فعلی در کد:
- `enterprise-support-android`
- `enterprise-support-web`

شناسه اختصاصی Eitaa در این فهرست پیش‌فرض نیست. پیش از فعال‌سازی عملیاتی باید یک شناسه متمایز مانند `enterprise-support-eitaa` در تنظیمات محیط Gateway allowlist شود. استفاده از شناسه Web یا Android برای دور زدن این تنظیم توصیه نمی‌شود.

**Frontend نباید Service JWT، کلید خصوصی یا Bot Token دریافت، تولید یا ذخیره کند.** Service JWT فقط برای ارتباط backend-to-backend و با کلید خصوصی سمت سرور است.

## 3. چت هوشمند

**Endpoint:** `POST /api/v1/chat`

Headerها:
- `X-User-Access-Token` — الزامی
- `X-Client-ID` — باید allowlist شده باشد
- `Idempotency-Key` — الزامی
- `Content-Type: application/json`

بدنه عمومی Gateway:

```json
{
  "conversation_id": "conversation-123",
  "text": "متن پیام کاربر",
  "model": "optional-model-id"
}
```

قواعد اعتبارسنجی:
- `conversation_id`: رشته اجباری، ۱ تا ۶۴ کاراکتر.
- `text`: رشته اجباری، ۱ تا ۸۰۰۰ کاراکتر.
- `model`: اختیاری، ۱ تا ۲۰۰ کاراکتر.

Gateway درخواست را به Assistant با بدنه زیر تبدیل می‌کند:

```json
{
  "message": "متن پیام کاربر",
  "conversation_id": "conversation-123",
  "tenant_id": "derived-from-validated-user-token",
  "model": "optional-model-id"
}
```

`tenant_id` از claim معتبر کاربر (`tenant_id` یا `tid`) استخراج می‌شود و نباید از UI یا بدنه کلاینت ارسال شود.

پاسخ عمومی Gateway:

```json
{
  "request_id": "gateway-request-id",
  "correlation_id": "correlation-id",
  "conversation_id": "conversation-123",
  "answer": "پاسخ دستیار"
}
```

Gateway پاسخ Assistant را از اولین رشته غیرخالی در فیلدهای `reply`، `answer`، `response`، `content` یا `message` استخراج می‌کند. پاسخ نامعتبر با خطای `ASSISTANT_INVALID_RESPONSE` و HTTP 502 برگردانده می‌شود.

نکته: مسیر `POST /api/v1/chat/stream` در پیاده‌سازی فعلی همان تابع chat را فراخوانی می‌کند و در کد مشاهده‌شده پیاده‌سازی واقعی streaming ندارد؛ فعلاً UI نباید رفتار streaming را فرض کند.

## 4. پروفایل کاربر

**Endpoint:** `GET /api/v1/me`

Header:
`X-User-Access-Token: <user-access-token>`

پاسخ درون یک property به نام `user` قرار دارد. مدل Gateway فیلدهایی مانند `user_id`، `username`، `name`، `surname`، `email`، `employee_id`، `department`، `display_name`، `mobile`، `telephone`، `cost_center`، `job_title`، `office`، `groups`، `roles` و `permissions` را تعریف می‌کند؛ بسیاری از فیلدها اختیاری‌اند و ممکن است null یا خالی باشند.

قواعد:
- نبودن داده اختیاری باید در UI درست مدیریت شود؛ مقدار ساختگی یا پیش‌فرض هویتی نساز.
- پروفایل، منبع داده نمایشی است؛ مجوز عملیات باید توسط Backend ارزیابی شود.
- قرارداد canonical پروفایل، `sAMAccountName` را مبنای username و employee code در نسخه v1 می‌داند.

## 5. تیکت‌ها

تمام مسیرهای زیر از Gateway و با User Access Token معتبر فراخوانی می‌شوند.

| عملیات | متد و مسیر |
|---|---|
| ایجاد تیکت | `POST /api/v1/tickets` |
| فهرست تیکت‌ها | `GET /api/v1/tickets?limit=25&offset=0` |
| تیکت‌های ارجاع‌شده به من | `GET /api/v1/tickets/assigned-to-me?limit=25&offset=0` |
| جستجو | `GET /api/v1/tickets/search?q=...&limit=10&offset=0` |
| جزئیات | `GET /api/v1/tickets/{ticket_id}` |
| ویرایش | `PUT /api/v1/tickets/{ticket_id}` |
| فهرست نظرها | `GET /api/v1/tickets/{ticket_id}/comments` |
| افزودن نظر | `POST /api/v1/tickets/{ticket_id}/comments` |
| دریافت انتقال‌های وضعیت | `GET /api/v1/tickets/{ticket_id}/transitions` |
| تغییر وضعیت | `POST /api/v1/tickets/{ticket_id}/transitions` |

قرارداد ایجاد تیکت:
- Header اجباری: `Idempotency-Key`
- `title`: اجباری، ۱ تا ۲۰۰ کاراکتر پس از trim.
- `description`: اجباری، حداکثر ۲۰۰۰۰ کاراکتر.
- `priority`: اجباری؛ یکی از `low`، `medium`، `high`، `urgent`.
- `category`: اختیاری؛ مقدار پیش‌فرض `IT`.
- `source` و هویت درخواست‌کننده از کلاینت قابل اعتماد نیستند و Gateway آن‌ها را از context معتبر تعیین می‌کند.

شناسه عمومی تیکت `ticket_id` برابر Jira issue key مانند `HELP-3352` است؛ UUID یا شناسه دیتابیس نیست. کلاینت باید آن را به‌صورت رشته opaque نگهداری کند.

بدنه افزودن نظر:

```json
{
  "body": "شرح تکمیلی درخواست"
}
```

برای ایجاد تیکت و افزودن نظر، `Idempotency-Key` یکتا برای هر عملیات منطقی الزامی است. برای retry همان عملیات، همان کلید باید استفاده شود.

## 6. دانش و RAG

در کد Gateway بررسی‌شده، دو proxy زیر وجود دارد:
- `GET /api/v1/guides/it`
- `GET /api/v1/guides/organization`

Gateway برای این درخواست‌ها هویت کاربر را از token معتبر استخراج می‌کند و هدرهای هویت RAG را با HMAC امضا می‌کند. Secret مربوطه فقط در تنظیمات سرور Gateway و PersianRag قرار می‌گیرد.

**در کد Routeهای بررسی‌شده Gateway، proxy عمومی برای جستجوی آزاد RAG مانند `POST /api/v1/search` یا `POST /api/v1/rag/search` مشاهده نشد.** بنابراین قابلیت جستجوی آزاد دانش در Mini App تا زمان ارائه route واقعی از Gateway نباید فعال یا با مسیر فرضی پیاده‌سازی شود. نسخه اول می‌تواند فقط دو کاتالوگ guide موجود را مصرف کند؛ schema پاسخ آن‌ها باید با PersianRag جاری نیز تطبیق داده شود.

## 7. خطا، شناسه درخواست و تکرارپذیری

Gateway خطاها را در envelope استاندارد برمی‌گرداند:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "request_id": "request-id",
    "correlation_id": "correlation-id",
    "retryable": false
  }
}
```

کلاینت باید:
- `request_id` و `correlation_id` را برای پشتیبانی/گزارش خطا نگهداری یا نمایش کنترل‌شده دهد.
- پیام خطای خام upstream یا stack trace را نمایش ندهد.
- فقط خطاهای retryable را با backoff مناسب retry کند.
- برای عملیات POST کلید Idempotency بسازد؛ retry یک عملیات باید همان کلید را حفظ کند.

Headerهای metadata قابل ارسال:
- `X-Request-ID`
- `X-Correlation-ID`
- `X-Contract-Version`
- `X-Client-ID`
- `X-Client-Version`

## 8. موانع استقرار که باید پیش از اتصال واقعی رفع/تأیید شوند

1. **CORS:** در `app/main.py` فعلی Gateway، `allow_origins` به `http://192.168.25.150` محدود شده است. دامنه HTTPS نهایی Mini App در این allowlist نیست. اگر مرورگر Mini App مستقیماً Gateway را فراخوانی کند، origin واقعی باید به‌صورت صریح و امن در پیکربندی استقرار مجاز شود؛ از wildcard همراه credentials استفاده نشود.
2. **Client allowlist:** شناسه `enterprise-support-eitaa` در مقدار پیش‌فرض `PUBLIC_USER_CLIENT_IDS` وجود ندارد و باید در محیط Gateway اضافه شود.
3. **HTTPS:** دامنه عمومی Mini App و Gateway باید با TLS معتبر در دسترس باشند.
4. **OTP policy:** مسیر mobile OTP عمومی است و باید rate limit، محدودیت تلاش، انقضای challenge و کنترل سوءاستفاده در محیط واقعی بررسی شوند.
5. **RAG:** فقط proxyهای guide در Gateway مشاهده شدند؛ route جستجوی آزاد در Gateway هنوز مستند/پیاده‌سازی نشده است.
6. **Token lifecycle:** مستند Gateway می‌گوید endpointهای refresh/revocation فعلاً وجود ندارند؛ کلاینت باید expiry را رعایت کند و پس از انقضا ورود مجدد بخواهد.
7. **Runtime verification:** سازگاری واقعی نسخه‌های مستقر، شبکه، CORS و مجوزها با بررسی کد به‌تنهایی اثبات نمی‌شود.

## 9. قواعد امنیتی کلاینت

- فقط HTTPS.
- هرگز Service JWT، Bot Token، private key یا secret در Frontend قرار نگیرد.
- User Access Token فقط در حافظه زمان اجرا نگهداری شود؛ در localStorage/sessionStorage ذخیره نشود.
- `initDataUnsafe` فقط برای UX است، نه authorization.
- هیچ endpoint داخلی Assistant، PersianRag، AD Manager یا Ticket Manager مستقیماً فراخوانی نشود.
- نقش‌ها و مجوزهای نمایش‌داده‌شده در UI جایگزین کنترل دسترسی Backend نیستند.
- شماره موبایل، OTP، توکن و متن حساس تیکت در log ثبت نشود.

## منابع کد Gateway

- `app/api/v1/identity_auth.py`
- `app/api/v1/auth.py`
- `app/api/v1/channel.py`
- `app/api/v1/me.py`
- `app/core/dependencies.py`
- `app/models/contracts.py`
- `app/config/settings.py`
- `app/main.py`
- `docs/API_CONTRACTS.md`
- `docs/EITAA_SERVICE_JWT_TRUST.md`
- `docs/TICKET_API_CONTRACT_V1.md`
- `docs/USER_PROFILE_CONTRACT_V1.md`
- `docs/RAG_GUIDE_PROXY.md`
