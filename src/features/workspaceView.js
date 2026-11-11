import { getAuthSession, clearAuthSession } from "../services/authService.js";

const content = document.querySelector(".workspace-content");
const workspace = document.querySelector("#signed-in-panel");
const pageTitles = { home: "نمای کلی", chat: "گفتگوی هوشمند", tickets: "درخواست‌های من", knowledge: "راهنما و دانش‌نامه", profile: "پروفایل سازمانی" };
let activePage = "home";
let chatMessages = [{ role: "assistant", text: "سلام! من همیار هوشمند فناوری اطلاعات انتخاب هستم. چه مسئله‌ای دارید؟" }];
let ticketDraft = { category: "نرم‌افزار", priority: "عادی", title: "", description: "" };
let searchTerm = "";

const icon = { home:"⌂", chat:"✧", tickets:"▤", knowledge:"▧", profile:"◎" };
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);

function statusPill(text = "آماده اتصال") {
  return `<span class="ui-status"><i></i>${text}</span>`;
}
function shell(title, subtitle, body) {
  return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">همیار انتخاب / خدمات فناوری اطلاعات</span><h1>${title}</h1><p>${subtitle}</p></div>${statusPill()}</div>${body}</section>`;
}
function homeView() {
  const user = getAuthSession()?.user ?? {};
  const name = user.display_name || user.name || user.username || "کاربر سازمانی";
  return `<section class="dashboard-hero">
    <div class="hero-content"><span class="eyebrow">مرکز هوشمند خدمات فناوری اطلاعات</span><h1>سلام ${escapeHtml(name)}، خوش آمدید</h1><p>برای دریافت راهنمایی یا ثبت درخواست، خدمت موردنیازتان را انتخاب کنید. مسیرهای پشتیبانی در یک فضای یکپارچه در دسترس شما هستند.</p><button class="hero-cta" data-page="chat">شروع گفتگوی هوشمند <b>←</b></button></div>
    <div class="hero-art" aria-hidden="true"><div class="art-ring ring-a"></div><div class="art-ring ring-b"></div><div class="art-core">هـ<span></span></div><i class="art-node node-a"></i><i class="art-node node-b"></i><i class="art-node node-c"></i></div><div class="hero-glow"></div>
  </section>
  <div class="section-title section-title-spaced"><div><span class="eyebrow">دسترسی سریع</span><h2>چه کمکی از دست ما برمی‌آید؟</h2></div><span class="section-hint">یک مسیر ساده برای خدمات IT</span></div>
  <div class="service-grid">
    <button class="service-card service-card-action" data-page="chat"><span class="service-card-top"><span class="service-icon">✧</span>${statusPill("رابط آماده")}</span><h3>گفتگوی هوشمند</h3><p>پرسش‌های فناوری اطلاعات را مطرح کنید و راهنمایی بگیرید.</p><span class="card-arrow">←</span></button>
    <button class="service-card service-card-action" data-page="tickets"><span class="service-card-top"><span class="service-icon">＋</span>${statusPill()}</span><h3>ثبت درخواست پشتیبانی</h3><p>شرح مشکل و اطلاعات لازم را برای ثبت درخواست آماده کنید.</p><span class="card-arrow">←</span></button>
    <button class="service-card service-card-action" data-page="knowledge"><span class="service-card-top"><span class="service-icon">▤</span>${statusPill("رابط آماده")}</span><h3>راهنما و دانش‌نامه</h3><p>راهنماها و پاسخ پرسش‌های پرتکرار را جست‌وجو کنید.</p><span class="card-arrow">←</span></button>
    <button class="service-card service-card-action" data-page="profile"><span class="service-card-top"><span class="service-icon">◎</span>${statusPill("اطلاعات نشست")}</span><h3>پروفایل سازمانی</h3><p>مشاهده اطلاعات هویتی دریافت‌شده از نشست ورود.</p><span class="card-arrow">←</span></button>
  </div>
  <div class="bottom-grid"><article class="info-panel"><div class="panel-heading"><div><span class="eyebrow">پیگیری خدمات</span><h2>درخواست‌های اخیر</h2></div><span class="panel-symbol">▤</span></div><div class="empty-state"><span class="empty-icon">⌁</span><strong>هنوز اطلاعاتی از درخواست‌ها دریافت نشده است</strong><p>پس از اتصال سرویس تیکت به Gateway، درخواست‌های شما در این قسمت نمایش داده می‌شوند.</p><button class="text-button" data-page="tickets">رفتن به درخواست‌های من ←</button></div></article><article class="support-panel"><div class="support-orb">؟</div><span class="eyebrow">پشتیبانی سازمانی</span><h2>در مسیر حل مسئله همراه شما هستیم</h2><p>برای مشکلات فوری، مطابق روال داخلی واحد فناوری اطلاعات اقدام کنید.</p><span class="support-note">اتصال Backend هنوز انجام نشده است.</span></article></div><footer class="workspace-footer"><span>همیار انتخاب · خدمات فناوری اطلاعات گروه انتخاب</span><span id="runtime-note">در حال شناسایی محیط اجرا…</span></footer>`;
}
function chatView() {
 return shell("گفتگوی هوشمند","پرسش خود را درباره خدمات و مشکلات فناوری اطلاعات مطرح کنید.",`<div class="chat-layout"><aside class="chat-aside"><div class="chat-aside-icon">✧</div><h3>همیار هوشمند انتخاب</h3><p>رابط گفتگو آماده است. پاسخ‌گویی هوشمند پس از اتصال به Gateway فعال می‌شود.</p><div class="connection-note"><span class="connection-dot"></span> ${statusPill()}</div><button class="outline-button" data-action="clear-chat">گفتگوی جدید</button></aside><div class="chat-panel"><div class="chat-panel-head"><div><strong>گفتگوی پشتیبانی</strong><small>پرسش خود را بنویسید</small></div><span class="chat-online">● رابط کاربری فعال</span></div><div class="chat-stream" id="chat-stream">${chatMessages.map(m=>`<div class="chat-message ${m.role === "user" ? "user-message" : "assistant-message"}"><span class="message-avatar">${m.role === "user" ? "ش" : "هـ"}</span><p>${escapeHtml(m.text)}</p></div>`).join("")}<div class="chat-disabled-hint">برای ارسال پیام واقعی، ابتدا آدرس و قرارداد Chat در Gateway تنظیم می‌شود.</div></div><form class="chat-composer" id="chat-form"><textarea id="chat-input" rows="1" placeholder="پیام خود را بنویسید…" aria-label="متن پیام" maxlength="2000"></textarea><button class="send-button" type="submit" aria-label="ارسال پیام" disabled>↑</button></form></div></div>`);
}
function ticketsView() {
 return shell("درخواست‌های پشتیبانی","اطلاعات مشکل را آماده کنید. ثبت نهایی پس از اتصال سرویس تیکت فعال خواهد شد.",`<div class="ticket-layout"><form id="ticket-form" class="surface-form"><div class="form-section-title"><span>۱</span><div><strong>شرح درخواست</strong><small>اطلاعات را دقیق و شفاف وارد کنید.</small></div></div><label for="ticket-title">عنوان درخواست</label><input id="ticket-title" name="title" maxlength="120" required placeholder="مثلاً: عدم اتصال به شبکه داخلی"><div class="form-two-col"><div><label for="ticket-category">دسته‌بندی</label><select id="ticket-category"><option>نرم‌افزار</option><option>سخت‌افزار</option><option>شبکه و اینترنت</option><option>حساب کاربری و دسترسی</option><option>سایر موارد</option></select></div><div><label for="ticket-priority">اولویت</label><select id="ticket-priority"><option>عادی</option><option>بالا</option><option>فوری</option></select></div></div><label for="ticket-description">شرح کامل مشکل</label><textarea id="ticket-description" rows="5" maxlength="3000" required placeholder="چه اتفاقی افتاده؟ از چه زمانی؟ چه پیامی مشاهده می‌کنید؟"></textarea><div class="form-footnote">اطلاعات واردشده فقط در همین صفحه نگهداری می‌شود و هنوز به سرور ارسال نمی‌شود.</div><button class="primary-button" type="submit"><span>بررسی و آماده‌سازی درخواست</span><b>←</b></button><p class="inline-feedback" id="ticket-feedback" role="status" aria-live="polite"></p></form><aside class="ticket-help"><span class="panel-symbol">i</span><h3>قبل از ثبت درخواست</h3><ul><li>عنوان کوتاه و مشخص انتخاب کنید.</li><li>متن خطا را در شرح مشکل بنویسید.</li><li>اطلاعات محرمانه و رمز عبور ارسال نکنید.</li></ul><div class="ticket-state-card">${statusPill()}<p>ثبت نهایی پس از اتصال Gateway و Ticket Manager انجام می‌شود.</p></div></aside></div>`);
}
const articles = [
 ["اتصال به شبکه سازمانی","شبکه و اینترنت","مراحل اولیه بررسی اتصال شبکه و موارد لازم برای گزارش مشکل."],
 ["بازیابی دسترسی حساب کاربری","حساب کاربری","نکات امنیتی و مسیر درخواست بازیابی دسترسی سازمانی."],
 ["نصب و به‌روزرسانی نرم‌افزار","نرم‌افزار","اطلاعات موردنیاز برای درخواست نصب نرم‌افزارهای مجاز."]
];
function knowledgeView() {
 const filtered = articles.filter(a=>a.join(" ").includes(searchTerm));
 return shell("راهنما و دانش‌نامه","راهنمای موردنیاز را جست‌وجو کنید. محتوای زیر نمونه رابط کاربری است، نه مقاله منتشرشده سازمان.",`<div class="knowledge-search"><span>⌕</span><input id="knowledge-search" value="${escapeHtml(searchTerm)}" placeholder="جست‌وجو در راهنماها…" aria-label="جست‌وجوی راهنما"></div><div class="knowledge-grid">${filtered.length ? filtered.map((a,i)=>`<article class="knowledge-card"><span class="knowledge-icon">${["⌘","◎","▤"][articles.indexOf(a)]}</span><small>${a[1]}</small><h3>${a[0]}</h3><p>${a[2]}</p><span class="knowledge-link">مشاهده راهنما <b>←</b></span></article>`).join("") : '<div class="empty-state knowledge-empty">موردی با این عبارت پیدا نشد.</div>'}</div><div class="knowledge-disclaimer">مقالات واقعی پس از اتصال دانش‌نامه سازمانی نمایش داده می‌شوند.</div>`);
}
function profileView() {
 const user = getAuthSession()?.user ?? {};
 const fields = [["نام نمایشی",user.display_name || user.name],["نام کاربری",user.username],["شناسه کاربر",user.id],["واحد سازمانی",user.department],["شماره همراه",user.mobile || user.phone]];
 return shell("پروفایل سازمانی","اطلاعاتی که در پاسخ احراز هویت Gateway موجود است.",`<div class="profile-layout"><div class="profile-card"><div class="profile-avatar">هـ</div><h2>${escapeHtml(user.display_name || user.name || user.username || "کاربر سازمانی")}</h2><p>حساب کاربری همیار انتخاب</p><div class="profile-tag">${statusPill("نشست فعال در حافظه")}</div></div><div class="profile-details"><div class="form-section-title"><span>✓</span><div><strong>اطلاعات حساب</strong><small>فقط فیلدهای موجود در پاسخ Gateway نمایش داده می‌شوند.</small></div></div><div class="profile-fields">${fields.filter(f=>f[1]).map(f=>`<div class="profile-field"><small>${f[0]}</small><strong>${escapeHtml(f[1])}</strong></div>`).join("") || '<p class="empty-profile">Gateway هنوز اطلاعات پروفایل را در نشست فعلی ارائه نکرده است.</p>'}</div><div class="profile-warning">توکن دسترسی در حافظه نگهداری می‌شود و در این صفحه نمایش داده نمی‌شود.</div><button class="outline-button danger-outline" data-action="logout">خروج از حساب کاربری</button></div></div>`);
}
function render(page) {
 activePage = pageTitles[page] ? page : "home";
 content.innerHTML = activePage === "home" ? homeView() : activePage === "chat" ? chatView() : activePage === "tickets" ? ticketsView() : activePage === "knowledge" ? knowledgeView() : profileView();
 document.querySelectorAll("[data-page]").forEach(el=>el.classList.toggle("active",el.dataset.page===activePage));
 document.querySelector(".breadcrumb strong").textContent = pageTitles[activePage];
 document.querySelector(".workspace-header .breadcrumb").setAttribute("aria-label",pageTitles[activePage]);
 document.querySelectorAll(".side-nav .nav-link,.mobile-nav-item").forEach(el=>el.classList.toggle("active",el.dataset.page===activePage));
 document.querySelectorAll(".side-nav .nav-link,.mobile-nav-item").forEach(el=>el.setAttribute("aria-current",el.dataset.page===activePage?"page":"false"));
}
function navigate(page) {
 if (!pageTitles[page]) return;
 render(page);
 content.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
workspace.addEventListener("click",event=>{
 const page=event.target.closest("[data-page]")?.dataset.page;
 if(page){event.preventDefault();navigate(page);return;}
 const action=event.target.closest("[data-action]")?.dataset.action;
 if(action==="clear-chat"){chatMessages=[{role:"assistant",text:"گفتگوی تازه شروع شد. پس از اتصال Gateway می‌توانید پرسش خود را ارسال کنید."}];render("chat");}
 if(action==="logout"){clearAuthSession();window.dispatchEvent(new Event("auth:expired"));}
});
workspace.addEventListener("submit",event=>{
 if(event.target.id==="chat-form"){
  event.preventDefault();
  const input=document.querySelector("#chat-input");
  const text=input.value.trim();
  if(!text)return;
  chatMessages.push({role:"user",text});
  chatMessages.push({role:"assistant",text:"پیام شما در رابط ثبت شد؛ برای دریافت پاسخ واقعی باید سرویس گفتگو به Gateway متصل شود."});
  render("chat");
 }
 if(event.target.id==="ticket-form"){
  event.preventDefault();
  const title=document.querySelector("#ticket-title").value.trim();
  const description=document.querySelector("#ticket-description").value.trim();
  if(!title||!description)return;
  ticketDraft={title,description,category:document.querySelector("#ticket-category").value,priority:document.querySelector("#ticket-priority").value};
  document.querySelector("#ticket-feedback").textContent="اطلاعات درخواست در همین صفحه آماده شد؛ به دلیل نبود اتصال Backend هیچ تیکتی ثبت یا ارسال نشده است.";
 }
});
workspace.addEventListener("input",event=>{
 if(event.target.id==="chat-input") document.querySelector(".send-button").disabled=!event.target.value.trim();
 if(event.target.id==="knowledge-search"){searchTerm=event.target.value;const cursor=event.target.selectionStart;render("knowledge");const next=document.querySelector("#knowledge-search");next.focus();next.setSelectionRange(cursor,cursor);}
});
document.querySelectorAll(".side-nav .nav-link,.mobile-nav-item").forEach(el=>{
 const target=el.getAttribute("href")?.replace("#","");
 const page=({home:"home",services:"home","my-requests":"tickets",knowledge:"knowledge"})[target] || target;
 el.dataset.page=page;
 el.setAttribute("href","#"+page);
});
document.querySelector(".sidebar-brand")?.addEventListener("click",event=>{event.preventDefault();navigate("home");});
document.querySelector(".workspace-header .breadcrumb")?.addEventListener("click",()=>navigate("home"));
window.addEventListener("auth:ready", () => render("home"));
if(content && !workspace.hidden) render("home");
