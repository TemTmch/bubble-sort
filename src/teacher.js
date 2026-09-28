/* Teacher area: sign-in by e-mail link (or code), dashboard shell, admin invites.
   Word sets (stage 3), classes (stage 4) and statistics (stage 6) plug into this view. */
import { supabase, siteUrl } from "./supabase.js";
import demoData from "./data/demo-sets.json";

const T = {
  ru: {
    setsN: (n) => { const m10 = n % 10, m100 = n % 100; return n + " " + (m10 === 1 && m100 !== 11 ? "набор" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "набора" : "наборов"); },
    openWs: "Открыть мастерскую", noSetsYet: "Пока нет ни одного набора.", importDemo: (n) => `Добавить наборы-примеры (${n})`,
    importing: "Добавляю…", importedDemo: (n) => `Добавлено наборов: ${n}.`, andMore: (n) => `и ещё ${n}`,
    back: "← К игре", title: "Кабинет учителя", signout: "Выйти",
    loginT: "Вход для учителей", loginP: "Введите рабочую почту — пришлём ссылку для входа. Пароль не нужен.",
    email: "Почта", send: "Прислать ссылку", sending: "Отправляю…",
    sentT: "Письмо отправлено", sentP: (e) => `Откройте ссылку из письма на ${e} — на этом или на любом другом устройстве. Письмо может прийти через минуту; проверьте «Спам».`,
    codeL: "Или введите код из письма", codeBtn: "Войти по коду", again: "Отправить ещё раз",
    pupils: "Ученикам вход не нужен — они заходят по ссылке своего класса.",
    errEmail: "Проверьте адрес почты.", errRate: "Слишком много писем подряд. Подождите немного и попробуйте снова.",
    errCode: "Код не подошёл или устарел. Запросите новое письмо.", errNet: "Нет связи с сервером. Проверьте интернет и попробуйте снова.",
    errLink: "Ссылка для входа устарела или уже использована. Запросите новую.",
    noAccessT: "Нет доступа", noAccessP: (e) => `Почта ${e} не приглашена в кабинет учителей. Попросите администратора добавить её, затем войдите снова.`,
    hello: (e) => `Вы вошли как ${e}`, admin: "администратор",
    tilesT: "Ваше пространство",
    tSets: "Наборы слов", tSetsP: "Ваши группы и слова, импорт таблиц, печать.",
    tClasses: "Классы", tClassesP: "Группы учеников, наборы для каждой, ссылки и QR-коды.",
    tStats: "Статистика", tStatsP: "Кто на каком уровне и какие слова путают.",
    soon: (n) => `этап ${n}`,
    teachersT: "Учителя", invitesT: "Приглашения",
    invitesP: "Добавьте почту коллеги — после входа по ссылке он получит своё отдельное пространство.",
    invite: "Пригласить", inviteDone: (e) => `${e} приглашён(а). Пусть откроет сайт и войдёт с этой почты.`,
    remove: "Убрать", removeQ: "Убрать приглашение?", yes: "Да", no: "Нет",
    noInvites: "Пока никого не пригласили.", since: "с", you: "вы",
    errInvite: "Не получилось добавить приглашение.", loadErr: "Не удалось загрузить данные. Обновите страницу."
  },
  en: {
    setsN: (n) => n + (n === 1 ? " set" : " sets"),
    openWs: "Open the workshop", noSetsYet: "No word sets yet.", importDemo: (n) => `Add example sets (${n})`,
    importing: "Adding…", importedDemo: (n) => `${n} set(s) added.`, andMore: (n) => `and ${n} more`,
    back: "← Back to the game", title: "Teacher area", signout: "Sign out",
    loginT: "Teacher sign-in", loginP: "Enter your work e-mail and we'll send you a sign-in link. No password needed.",
    email: "E-mail", send: "Send link", sending: "Sending…",
    sentT: "Check your e-mail", sentP: (e) => `Open the link we sent to ${e} — on this or any other device. It can take a minute; check your spam folder.`,
    codeL: "Or enter the code from the e-mail", codeBtn: "Sign in with code", again: "Send again",
    pupils: "Pupils don't sign in — they use their class link.",
    errEmail: "Check the e-mail address.", errRate: "Too many e-mails in a row. Wait a little and try again.",
    errCode: "That code is wrong or expired. Ask for a new e-mail.", errNet: "Can't reach the server. Check your connection and try again.",
    errLink: "This sign-in link has expired or was already used. Ask for a new one.",
    noAccessT: "No access", noAccessP: (e) => `${e} hasn't been invited to the teacher area. Ask the administrator to add it, then sign in again.`,
    hello: (e) => `Signed in as ${e}`, admin: "administrator",
    tilesT: "Your space",
    tSets: "Word sets", tSetsP: "Your groups and words, spreadsheet import, printing.",
    tClasses: "Classes", tClassesP: "Groups of pupils, sets for each, links and QR codes.",
    tStats: "Statistics", tStatsP: "Who is on which level and which words get mixed up.",
    soon: (n) => `stage ${n}`,
    teachersT: "Teachers", invitesT: "Invitations",
    invitesP: "Add a colleague's e-mail — after signing in with it they get their own separate space.",
    invite: "Invite", inviteDone: (e) => `${e} is invited. Ask them to open the site and sign in with that e-mail.`,
    remove: "Remove", removeQ: "Remove this invitation?", yes: "Yes", no: "No",
    noInvites: "Nobody invited yet.", since: "since", you: "you",
    errInvite: "Couldn't add the invitation.", loadErr: "Couldn't load data. Reload the page."
  },
  tr: {
    setsN: (n) => n + " set",
    openWs: "Atölyeyi aç", noSetsYet: "Henüz kelime seti yok.", importDemo: (n) => `Örnek setleri ekle (${n})`,
    importing: "Ekleniyor…", importedDemo: (n) => `${n} set eklendi.`, andMore: (n) => `ve ${n} tane daha`,
    back: "← Oyuna dön", title: "Öğretmen alanı", signout: "Çıkış",
    loginT: "Öğretmen girişi", loginP: "İş e-postanızı yazın, size giriş bağlantısı gönderelim. Şifre gerekmez.",
    email: "E-posta", send: "Bağlantı gönder", sending: "Gönderiliyor…",
    sentT: "E-postanızı kontrol edin", sentP: (e) => `${e} adresine gönderdiğimiz bağlantıyı açın — bu veya başka bir cihazda. Bir dakika sürebilir; istenmeyen klasörüne de bakın.`,
    codeL: "Ya da e-postadaki kodu girin", codeBtn: "Kodla giriş", again: "Yeniden gönder",
    pupils: "Öğrenciler giriş yapmaz — sınıf bağlantılarını kullanırlar.",
    errEmail: "E-posta adresini kontrol edin.", errRate: "Arka arkaya çok fazla e-posta. Biraz bekleyip tekrar deneyin.",
    errCode: "Kod yanlış ya da süresi dolmuş. Yeni e-posta isteyin.", errNet: "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edip tekrar deneyin.",
    errLink: "Bu giriş bağlantısının süresi dolmuş ya da kullanılmış. Yenisini isteyin.",
    noAccessT: "Erişim yok", noAccessP: (e) => `${e} öğretmen alanına davet edilmemiş. Yöneticiden eklemesini isteyin, sonra yeniden giriş yapın.`,
    hello: (e) => `${e} olarak giriş yaptınız`, admin: "yönetici",
    tilesT: "Alanınız",
    tSets: "Kelime setleri", tSetsP: "Gruplarınız ve kelimeleriniz, tablo aktarımı, yazdırma.",
    tClasses: "Sınıflar", tClassesP: "Öğrenci grupları, her birine setler, bağlantılar ve QR kodları.",
    tStats: "İstatistik", tStatsP: "Kim hangi seviyede, hangi kelimeler karıştırılıyor.",
    soon: (n) => `aşama ${n}`,
    teachersT: "Öğretmenler", invitesT: "Davetler",
    invitesP: "Bir meslektaşınızın e-postasını ekleyin — bu e-postayla giriş yapınca kendi ayrı alanını alır.",
    invite: "Davet et", inviteDone: (e) => `${e} davet edildi. Siteyi açıp bu e-postayla giriş yapmasını söyleyin.`,
    remove: "Kaldır", removeQ: "Bu davet kaldırılsın mı?", yes: "Evet", no: "Hayır",
    noInvites: "Henüz kimse davet edilmedi.", since: "", you: "siz",
    errInvite: "Davet eklenemedi.", loadErr: "Veriler yüklenemedi. Sayfayı yenileyin."
  }
};
const lang = () => { try { const l = localStorage.getItem("bs.lang"); if (l === "en" || l === "tr" || l === "ru") return l; } catch (e) {} return "ru"; };
const t = (k, ...a) => { const d = T[lang()] || T.ru; const v = d[k] !== undefined ? d[k] : T.en[k]; return typeof v === "function" ? v(...a) : v; };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(lang() === "tr" ? "tr-TR" : lang() === "en" ? "en-GB" : "ru-RU", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };

let root = null;
let state = { view: "loading", session: null, teacher: null, sentTo: "", msg: null, busy: false, admin: { teachers: [], invites: [] }, confirmInvite: null, sets: [], importing: false };
let authHooked = false;

export async function showTeacher(el) {
  root = el;
  if (!authHooked) {
    authHooked = true;
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const changed = (state.session && state.session.user.id) !== (session && session.user.id);
        state.session = session;
        if (changed) setTimeout(load, 0);
      }
    });
  }
  // An e-mail link comes back as #access_token=… (or #error=…); clean it into #/teacher.
  const h = location.hash;
  if (/error_description=/.test(h)) state.msg = { kind: "err", text: t("errLink") };
  if (/access_token=|error_description=/.test(h)) setTimeout(() => history.replaceState(null, "", location.pathname + location.search + "#/teacher"), 400);
  render();
  await load();
}

async function load() {
  try {
    const { data } = await supabase.auth.getSession();
    state.session = data.session;
    if (!state.session) { state.view = state.sentTo ? "sent" : "login"; render(); return; }
    const { data: me, error } = await supabase.from("teachers").select("*").eq("id", state.session.user.id).maybeSingle();
    if (error) throw error;
    state.teacher = me;
    state.view = me ? "home" : "noaccess";
    if (me) state.sets = await loadMySets();
    if (me && me.is_admin) await loadAdmin();
  } catch (e) {
    state.view = state.session ? "home" : "login";
    state.msg = { kind: "err", text: t("loadErr") };
  }
  render();
}

async function loadAdmin() {
  const [tq, iq] = await Promise.all([
    supabase.from("teachers").select("id,email,is_admin,created_at").order("created_at"),
    supabase.from("teacher_invites").select("email,created_at").order("created_at", { ascending: false })
  ]);
  state.admin.teachers = tq.data || [];
  const joined = new Set(state.admin.teachers.map((x) => x.email));
  state.admin.invites = (iq.data || []).filter((i) => !joined.has(i.email));
}

function errText(e) {
  const m = String((e && (e.message || e.error_description)) || "").toLowerCase();
  const code = e && (e.status || e.code);
  if (code === 429 || /rate limit|too many|security purposes/.test(m)) return t("errRate");
  if (/invalid.*email|email.*invalid|validate email/.test(m)) return t("errEmail");
  if (/token|otp|expired|invalid/.test(m)) return t("errCode");
  if (/fetch|network|failed to/.test(m)) return t("errNet");
  return (e && e.message) || t("errNet");
}

async function sendLink(email) {
  email = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { state.msg = { kind: "err", text: t("errEmail") }; render(); return; }
  state.busy = true; state.msg = null; render();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: siteUrl(), shouldCreateUser: true } });
  state.busy = false;
  if (error) { state.msg = { kind: "err", text: errText(error) }; render(); return; }
  state.sentTo = email; state.view = "sent"; render();
}

async function verifyCode(code) {
  code = String(code || "").replace(/\s+/g, "");
  if (!code) return;
  state.busy = true; state.msg = null; render();
  const { error } = await supabase.auth.verifyOtp({ email: state.sentTo, token: code, type: "email" });
  state.busy = false;
  if (error) { state.msg = { kind: "err", text: t("errCode") }; render(); return; }
  await load();
}

async function signOut() {
  await supabase.auth.signOut();
  state = { ...state, view: "login", session: null, teacher: null, sentTo: "", msg: null, admin: { teachers: [], invites: [] } };
  render();
}

async function addInvite(email) {
  email = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { state.msg = { kind: "err", text: t("errEmail") }; render(); return; }
  const { error } = await supabase.from("teacher_invites").upsert({ email, invited_by: state.teacher.id }, { onConflict: "email" });
  if (error) { state.msg = { kind: "err", text: t("errInvite") }; render(); return; }
  state.msg = { kind: "ok", text: t("inviteDone", email) };
  await loadAdmin(); render();
}

async function removeInvite(email) {
  await supabase.from("teacher_invites").delete().eq("email", email);
  state.confirmInvite = null;
  await loadAdmin(); render();
}

/* ───────── rendering ───────── */
function shell(inner) {
  const who = state.teacher ? `<span class="tv-who">${esc(state.teacher.email)}</span><button class="chipbtn" type="button" data-act="signout">${esc(t("signout"))}</button>` : "";
  return `<header class="bar tv-bar"><a class="brand" href="#/"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>Bubble Sort</a>
    <span class="tv-title">${esc(t("title"))}</span><div class="tools">${who}<a class="chipbtn" href="#/">${esc(t("back"))}</a></div></header>
    <main class="tv-main">${state.msg ? `<p class="tv-msg ${state.msg.kind}" role="status">${esc(state.msg.text)}</p>` : ""}${inner}</main>`;
}

function render() {
  if (!root) return;
  let inner = "";
  if (state.view === "loading") inner = `<div class="card tv-card"><div class="thinking" aria-hidden="true"><i></i><i></i><i></i></div></div>`;
  else if (state.view === "login") inner = `<form class="card tv-card" id="tvLogin" novalidate>
      <p class="kicker">Bubble Sort</p><h1 class="h1">${esc(t("loginT"))}</h1><p class="help">${esc(t("loginP"))}</p>
      <div class="f"><label for="tvEmail">${esc(t("email"))}</label><input id="tvEmail" type="email" autocomplete="email" inputmode="email" required value="${esc(state.sentTo)}"></div>
      <div class="row"><button class="btn" type="submit"${state.busy ? " disabled" : ""}>${esc(state.busy ? t("sending") : t("send"))}</button></div>
      <p class="help tv-note">${esc(t("pupils"))}</p></form>`;
  else if (state.view === "sent") inner = `<div class="card tv-card"><p class="kicker">Bubble Sort</p><h1 class="h1">${esc(t("sentT"))}</h1><p class="help">${esc(t("sentP", state.sentTo))}</p>
      <form class="tv-code" id="tvCode" novalidate><div class="f"><label for="tvCodeIn">${esc(t("codeL"))}</label><input id="tvCodeIn" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></div>
      <div class="row"><button class="btn" type="submit"${state.busy ? " disabled" : ""}>${esc(t("codeBtn"))}</button><button class="btn ghost" type="button" data-act="again">${esc(t("again"))}</button></div></form></div>`;
  else if (state.view === "noaccess") inner = `<div class="card tv-card"><p class="kicker">Bubble Sort</p><h1 class="h1">${esc(t("noAccessT"))}</h1>
      <p class="help">${esc(t("noAccessP", state.session ? state.session.user.email : ""))}</p><div class="row"><button class="btn ghost" type="button" data-act="signout">${esc(t("signout"))}</button></div></div>`;
  else if (state.view === "home") inner = homeHtml();
  root.innerHTML = shell(inner);
  wire();
}

function homeHtml() {
  const me = state.teacher || {};
  const tile = (title, p, n) => `<div class="tv-tile" aria-disabled="true"><b>${esc(title)}</b><span>${esc(p)}</span><em>${esc(t("soon", n))}</em></div>`;
  let html = `<section class="card tv-wide"><p class="kicker">${esc(t("hello", me.email || ""))}${me.is_admin ? ` · ${esc(t("admin"))}` : ""}</p>
    <h1 class="h1">${esc(t("tilesT"))}</h1><div class="tv-tiles">${setsTile()}${tile(t("tClasses"), t("tClassesP"), 4)}${tile(t("tStats"), t("tStatsP"), 6)}</div></section>`;
  if (me.is_admin) {
    const a = state.admin;
    html += `<section class="card tv-wide"><h2 class="h2" style="margin-top:0">${esc(t("teachersT"))}</h2><ul class="tv-list">` +
      a.teachers.map((x) => `<li><b>${esc(x.email)}</b>${x.id === me.id ? ` <span class="tag">${esc(t("you"))}</span>` : ""}${x.is_admin ? ` <span class="tag">${esc(t("admin"))}</span>` : ""}<span class="tv-date">${esc(t("since"))} ${esc(fmtDate(x.created_at))}</span></li>`).join("") + `</ul>
      <h2 class="h2">${esc(t("invitesT"))}</h2><p class="help">${esc(t("invitesP"))}</p>
      <form class="row tv-invite" id="tvInvite" novalidate><input id="tvInviteIn" type="email" autocomplete="off" placeholder="colleague@school.me" aria-label="${esc(t("email"))}"><button class="btn small" type="submit">${esc(t("invite"))}</button></form>
      ${a.invites.length ? `<ul class="tv-list">` + a.invites.map((i) => `<li><b>${esc(i.email)}</b><span class="tv-date">${esc(fmtDate(i.created_at))}</span>` +
        (state.confirmInvite === i.email
          ? `<span class="tv-confirm">${esc(t("removeQ"))} <button class="btn danger small" type="button" data-act="rm-yes" data-email="${esc(i.email)}">${esc(t("yes"))}</button><button class="btn ghost small" type="button" data-act="rm-no">${esc(t("no"))}</button></span>`
          : `<button class="btn ghost small" type="button" data-act="rm" data-email="${esc(i.email)}">${esc(t("remove"))}</button>`) + `</li>`).join("") + `</ul>` : `<p class="help">${esc(t("noInvites"))}</p>`}
    </section>`;
  }
  return html;
}

function missingDemo() {
  const have = new Set(state.sets.map((x) => x.title.trim().toLowerCase()));
  return demoData.sets.filter((x) => !have.has(x.title.trim().toLowerCase()));
}
function setsTile() {
  const list = state.sets, miss = missingDemo();
  const names = list.slice(0, 5).map((x) => `<li>${esc(x.title || "—")}${x.grade ? ` <i>${esc(x.grade)}</i>` : ""}</li>`).join("");
  return `<div class="tv-tile on"><b>${esc(t("tSets"))}</b><span>${esc(list.length ? t("setsN", list.length) : t("noSetsYet"))}</span>
    ${list.length ? `<ul class="tv-mini">${names}${list.length > 5 ? `<li><i>${esc(t("andMore", list.length - 5))}</i></li>` : ""}</ul>` : ""}
    <div class="row"><a class="btn small" href="#/teacher/sets">${esc(t("openWs"))}</a>
    ${miss.length ? `<button class="btn ghost small" type="button" data-act="demo"${state.importing ? " disabled" : ""}>${esc(state.importing ? t("importing") : t("importDemo", miss.length))}</button>` : ""}</div></div>`;
}
async function importDemo() {
  const miss = missingDemo(); if (!miss.length) return;
  state.importing = true; render();
  const { error } = await supabase.from("word_sets").insert(miss.map((x) => ({ owner_id: state.teacher.id, title: x.title, grade: x.grade || "", lang: x.lang || "en-GB", cats: x.cats })));
  state.importing = false;
  if (error) state.msg = { kind: "err", text: t("loadErr") };
  else { state.msg = { kind: "ok", text: t("importedDemo", miss.length) }; state.sets = await loadMySets(); }
  render();
}

/* ── word-set library (used by the workshop in the game shell) ── */
const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
export async function loadMySets() {
  const { data, error } = await supabase.from("word_sets").select("id,title,grade,lang,cats,created_at").order("created_at");
  if (error) throw error;
  return (data || []).map((r) => ({ id: r.id, title: r.title, grade: r.grade, lang: r.lang, cats: Array.isArray(r.cats) ? r.cats : [] }));
}
export async function saveMySets(list, ownerId) {
  const { data: existing, error: e1 } = await supabase.from("word_sets").select("id");
  if (e1) throw e1;
  const known = new Set((existing || []).map((r) => r.id));
  const keep = new Set(list.filter((x) => known.has(x.id)).map((x) => x.id));
  const del = [...known].filter((id) => !keep.has(id));
  if (del.length) { const { error } = await supabase.from("word_sets").delete().in("id", del); if (error) throw error; }
  const row = (x) => ({ owner_id: ownerId, title: x.title || "", grade: x.grade || "", lang: x.lang || "en-GB", cats: x.cats || [] });
  const olds = list.filter((x) => known.has(x.id));
  if (olds.length) { const { error } = await supabase.from("word_sets").upsert(olds.map((x) => ({ id: x.id, ...row(x) }))); if (error) throw error; }
  const news = list.filter((x) => !known.has(x.id));
  let inserted = [];
  if (news.length) { const { data, error } = await supabase.from("word_sets").insert(news.map(row)).select("id"); if (error) throw error; inserted = data || []; }
  let k = 0;
  const out = list.map((x) => (known.has(x.id) ? x : { ...x, id: (inserted[k++] || {}).id || x.id }));
  state.sets = out;
  return out;
}
// Opens the game's workshop on the teacher's own library. Needs a signed-in teacher.
export async function openSetsWorkshop(api) {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) { location.hash = "#/teacher"; return; }
  const { data: me } = await supabase.from("teachers").select("id").eq("id", session.user.id).maybeSingle();
  if (!me) { location.hash = "#/teacher"; return; }
  let sets = [];
  try { sets = await loadMySets(); } catch (e) { location.hash = "#/teacher"; return; }
  if (location.hash.indexOf("#/teacher/sets") !== 0) return;
  api.openWorkshop({ sets, onSave: (list) => saveMySets(list, me.id), onClose: () => { if (location.hash.indexOf("#/teacher/sets") === 0) location.hash = "#/teacher"; } });
}

function wire() {
  const q = (s) => root.querySelector(s);
  const login = q("#tvLogin");
  if (login) { login.onsubmit = (e) => { e.preventDefault(); sendLink(q("#tvEmail").value); }; if (!state.busy) q("#tvEmail").focus(); }
  const code = q("#tvCode");
  if (code) code.onsubmit = (e) => { e.preventDefault(); verifyCode(q("#tvCodeIn").value); };
  const inv = q("#tvInvite");
  if (inv) inv.onsubmit = (e) => { e.preventDefault(); addInvite(q("#tvInviteIn").value); };
  root.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = () => {
      const a = b.dataset.act;
      if (a === "signout") signOut();
      else if (a === "again") { state.view = "login"; state.msg = null; render(); }
      else if (a === "rm") { state.confirmInvite = b.dataset.email; render(); }
      else if (a === "rm-no") { state.confirmInvite = null; render(); }
      else if (a === "rm-yes") removeInvite(b.dataset.email);
      else if (a === "demo") importDemo();
    };
  });
}

export function rerenderTeacher() { if (root && !root.hidden) render(); }
