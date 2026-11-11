# ورود با کد پرسنلی در Mini App ایتا

## روش‌ها

- شماره موبایل: همان مسیر عمومی OTP موبایل در Gateway.
- کد پرسنلی: همان عملیات سازمانی OTP که Bale استفاده می‌کند؛ اما احراز هویت کلاینت ایتا با `initData` امضاشده انجام می‌شود.

## درخواست کد پرسنلی

Mini App مقدار خام `window.Eitaa.WebApp.initData` را از SDK دریافت می‌کند و در Header زیر می‌فرستد:

```http
X-Client-ID: enterprise-support-eitaa
X-Eitaa-Init-Data: <raw-initData>
Idempotency-Key: <unique-key>
```

درخواست به قرارداد Canonical Gateway ارسال می‌شود:

```http
POST /api/v1/identity/otp/request
Content-Type: application/json
```

```json
{
  "employee_id": "14033874",
  "channel": "sms"
}
```

Gateway امضای Eitaa را در سرور بررسی می‌کند و سپس عملیات employee OTP را به AD Manager می‌فرستد. OTP به شماره موبایل ثبت‌شده در حساب سازمانی ارسال می‌شود.

## تأیید OTP

Mini App از همان مسیر مشترک استفاده می‌کند:

```http
POST /api/v1/identity/otp/verify
```

```json
{
  "request_id": "<request_id>",
  "code": "123456"
}
```

پس از تأیید موفق، نشست کاربر با User Access Token ایجاد می‌شود.

## محدودیت‌ها

- ورود با کد پرسنلی فقط داخل Eitaa WebView قابل استفاده است؛ مرورگر معمولی `initData` معتبر ندارد.
- `initDataUnsafe` صرفاً برای نمایش اطلاعات است و برای احراز هویت استفاده نمی‌شود.
- آدرس Gateway باید در `src/config.js` با HTTPS واقعی تنظیم شود.
- توکن خصوصی برنامه ایتا فقط در محیط سرور Gateway قرار می‌گیرد.
