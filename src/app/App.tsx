import { useEffect, useMemo } from "react";
import { getEitaaRuntime, notifyEitaaReady } from "../eitaa/eitaaBridge";

export function App() {
  const runtime = useMemo(() => getEitaaRuntime(), []);

  useEffect(() => {
    notifyEitaaReady();
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">هـ</div>
        <div>
          <p className="eyebrow">گروه انتخاب</p>
          <h1>همیار انتخاب</h1>
          <p className="subtitle">همیار هوشمند خدمات فناوری اطلاعات</p>
        </div>
      </header>

      <section className="welcome-card" aria-labelledby="welcome-title">
        <span className="status-dot" />
        <p className="eyebrow">مرکز خدمات فناوری اطلاعات</p>
        <h2 id="welcome-title">سلام، خوش آمدید</h2>
        <p>برای دریافت راهنمایی، ثبت درخواست یا پیگیری خدمات فناوری اطلاعات از اینجا شروع کنید.</p>
      </section>

      <section className="service-grid" aria-label="خدمات">
        <article className="service-card">
          <span className="service-icon">✦</span>
          <h3>گفتگوی هوشمند</h3>
          <p>پاسخ به پرسش‌های فناوری اطلاعات</p>
          <span className="coming-soon">در حال آماده‌سازی</span>
        </article>
        <article className="service-card">
          <span className="service-icon">＋</span>
          <h3>ثبت درخواست</h3>
          <p>ثبت و پیگیری درخواست پشتیبانی</p>
          <span className="coming-soon">در حال آماده‌سازی</span>
        </article>
        <article className="service-card">
          <span className="service-icon">⌕</span>
          <h3>پایگاه دانش</h3>
          <p>جستجو در راهنماهای سازمانی</p>
          <span className="coming-soon">در حال آماده‌سازی</span>
        </article>
        <article className="service-card">
          <span className="service-icon">◎</span>
          <h3>پروفایل من</h3>
          <p>اطلاعات حساب و درخواست‌ها</p>
          <span className="coming-soon">در حال آماده‌سازی</span>
        </article>
      </section>

      <footer className="runtime-note">
        {runtime.available
          ? `محیط ایتا شناسایی شد · ${runtime.platform ?? "platform نامشخص"}`
          : "پیش‌نمایش مرورگر · احراز هویت ایتا فعال نیست"}
      </footer>
    </main>
  );
}
