/* Teacher area: sign-in by e-mail link (or code), dashboard shell, admin invites.
   Word sets (stage 3), classes (stage 4) and statistics (stage 6) plug into this view. */
import { supabase, siteUrl } from "./supabase.js";
import demoData from "./data/demo-sets.json";
import qrcode from "qrcode-generator";

const T = {
  ru: {
    setsN: (n) => { const m10 = n % 10, m100 = n % 100; return n + " " + (m10 === 1 && m100 !== 11 ? "набор" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "набора" : "наборов"); },
    openWs: "Открыть мастерскую", noSetsYet: "Пока нет ни одного набора.", importDemo: (n) => `Добавить наборы-примеры (${n})`,
    importing: "Добавляю…", importedDemo: (n) => `Добавлено наборов: ${n}.`, andMore: (n) => `и ещё ${n}`,
    classesN: (n) => { const m10 = n % 10, m100 = n % 100; return n + " " + (m10 === 1 && m100 !== 11 ? "класс" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "класса" : "классов"); },
    pupilsN: (n) => { const m10 = n % 10, m100 = n % 100; return n + " " + (m10 === 1 && m100 !== 11 ? "ученик" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "ученика" : "учеников"); },
    openClasses: "Открыть классы", noClassesYet: "Классов пока нет.",
    classesT: "Классы", classesP: "Класс — это группа учеников и наборы слов для неё. Ученики входят по ссылке или коду класса.",
    newClassPh: "Название, например 3B English", createClass: "Создать класс", archiveT: "Архив", allClasses: "← Все классы",
    code: "Код класса", studentLink: "Ссылка для учеников", copyLink: "Скопировать ссылку", linkCopied: "Ссылка скопирована.",
    copyFail: "Не получилось скопировать — выделите ссылку и скопируйте вручную.",
    qrPng: "Скачать QR-код", projector: "Показать на экране", newCode: "Новый код",
    newCodeQ: "Старый код и ссылка перестанут работать. Ученики, которые уже вошли, останутся в классе.", codeChanged: "Код класса обновлён.",
    joinHelp: "Ученики открывают ссылку (или сканируют QR-код) и вводят своё имя. Можно и так: главная страница сайта → «Код класса».",
    rename: "Сохранить название", renamed: "Название сохранено.",
    classSets: "Наборы класса", classSetsP: "Ученики увидят эти наборы в таком порядке.",
    noClassSets: "Наборы ещё не выбраны.", addSets: "Добавить из библиотеки", allAdded: "Все ваши наборы уже в классе.",
    libEmpty: "В вашей библиотеке пока нет наборов.", toLibrary: "Открыть мастерскую",
    up: "Выше", down: "Ниже", take: "Убрать из класса", add: "Добавить", saveSets: "Сохранить наборы класса", setsSaved: "Наборы класса сохранены.",
    unsavedSets: "Есть несохранённые изменения в наборах класса.",
    studentsT: "Ученики", noStudents: "Пока никто не вошёл. Дайте ученикам ссылку или код класса.",
    joined: "вошёл", lastSeen: "был(а)", removeStudent: "Удалить", removeStudentQ: "Удалить ученика и его прогресс?",
    manageT: "Управление классом", archiveBtn: "В архив", unarchiveBtn: "Вернуть из архива",
    archiveP: "В архивном классе ученики не могут войти, но все данные сохраняются.", archived: "архив",
    deleteClass: "Удалить класс", deleteClassQ: "Удалить класс вместе со всеми учениками и их прогрессом? Отменить нельзя.",
    classDeleted: "Класс удалён.", notFound: "Класс не найден.", saveErrGen: "Не удалось сохранить. Проверьте интернет и попробуйте снова.",
    close: "Закрыть", scanOr: "Отсканируйте QR-код или откройте",
    statsT: "Статистика класса", statsEmpty: "Статистика появится, когда ученики начнут проходить уровни.",
    sPupils: "учеников", sActive: "играли за 7 дней", sLevels: "уровней пройдено", sPlays: "игр сыграно",
    kGroups: "Группы", kOdd: "Найди лишнее", kPairs: "Слово ↔ перевод",
    gridT: "Пройдено уровней по наборам", gridP: "Число — сколько уровней пройдено; кружки — лучший результат (из 3) на последнем пройденном уровне. Нажмите на имя, чтобы увидеть подробности.",
    gridNone: "—", cellT: (n, set, lv, st) => `${n} · ${set}: пройдено уровней — ${lv}${st ? `, пузырей на последнем — ${st} из 3` : ""}`,
    lastSeenCol: "Заходил(а)", confT: "Слова, которые путают чаще всего", confP: "Сколько раз слово участвовало в ошибке и у скольких учеников. Эти слова игра сама чаще подкладывает в уровни.",
    confNone: "Пока без ошибок — или ученики ещё не играли.", timesPupils: (n, m) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "раз" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "раза" : "раз"} · ${m} уч.`,
    detailSets: "По наборам", detailMiss: "Путает", noMiss: "ошибок нет", lvShort: (n) => `ур. ${n}`,
    tStatsOn: "Статистика — на странице каждого класса: уровни учеников по наборам и слова, которые путают.",
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
    classesN: (n) => n + (n === 1 ? " class" : " classes"),
    pupilsN: (n) => n + (n === 1 ? " pupil" : " pupils"),
    openClasses: "Open classes", noClassesYet: "No classes yet.",
    classesT: "Classes", classesP: "A class is a group of pupils plus the word sets for it. Pupils join with the class link or code.",
    newClassPh: "Name, e.g. 3B English", createClass: "Create class", archiveT: "Archive", allClasses: "← All classes",
    code: "Class code", studentLink: "Link for pupils", copyLink: "Copy link", linkCopied: "Link copied.",
    copyFail: "Couldn't copy — select the link and copy it by hand.",
    qrPng: "Download QR code", projector: "Show on screen", newCode: "New code",
    newCodeQ: "The old code and link will stop working. Pupils who already joined stay in the class.", codeChanged: "Class code updated.",
    joinHelp: "Pupils open the link (or scan the QR code) and type their name. Or: the site's home page → “Class code”.",
    rename: "Save name", renamed: "Name saved.",
    classSets: "Class word sets", classSetsP: "Pupils see these sets in this order.",
    noClassSets: "No sets chosen yet.", addSets: "Add from your library", allAdded: "All your sets are already in this class.",
    libEmpty: "Your library has no sets yet.", toLibrary: "Open the workshop",
    up: "Up", down: "Down", take: "Remove from class", add: "Add", saveSets: "Save class sets", setsSaved: "Class sets saved.",
    unsavedSets: "Class sets have unsaved changes.",
    studentsT: "Pupils", noStudents: "Nobody has joined yet. Give pupils the class link or code.",
    joined: "joined", lastSeen: "last seen", removeStudent: "Remove", removeStudentQ: "Remove this pupil and their progress?",
    manageT: "Manage class", archiveBtn: "Archive", unarchiveBtn: "Restore from archive",
    archiveP: "Pupils can't join an archived class, but all data is kept.", archived: "archived",
    deleteClass: "Delete class", deleteClassQ: "Delete the class with all its pupils and their progress? This can't be undone.",
    classDeleted: "Class deleted.", notFound: "Class not found.", saveErrGen: "Couldn't save. Check your connection and try again.",
    close: "Close", scanOr: "Scan the QR code or open",
    statsT: "Class statistics", statsEmpty: "Statistics appear once pupils start finishing levels.",
    sPupils: "pupils", sActive: "played in last 7 days", sLevels: "levels completed", sPlays: "games played",
    kGroups: "Groups", kOdd: "Odd one out", kPairs: "Word ↔ translation",
    gridT: "Levels completed per set", gridP: "The number is levels completed; dots show the best result (of 3) on the latest completed level. Click a name for details.",
    gridNone: "—", cellT: (n, set, lv, st) => `${n} · ${set}: ${lv} level(s) completed${st ? `, ${st} of 3 bubbles on the latest` : ""}`,
    lastSeenCol: "Last seen", confT: "Most mixed-up words", confP: "How many times a word was part of a mistake, and for how many pupils. The game already brings these words back more often.",
    confNone: "No mistakes yet — or nobody has played.", timesPupils: (n, m) => `${n}× · ${m} pupil${m === 1 ? "" : "s"}`,
    detailSets: "By set", detailMiss: "Mixes up", noMiss: "no mistakes", lvShort: (n) => `lvl ${n}`,
    tStatsOn: "Statistics live on each class page: pupils' levels per set and the words they mix up.",
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
    classesN: (n) => n + " sınıf",
    pupilsN: (n) => n + " öğrenci",
    openClasses: "Sınıfları aç", noClassesYet: "Henüz sınıf yok.",
    classesT: "Sınıflar", classesP: "Sınıf, bir öğrenci grubu ve ona ait kelime setleridir. Öğrenciler sınıf bağlantısı veya koduyla katılır.",
    newClassPh: "Ad, ör. 3B English", createClass: "Sınıf oluştur", archiveT: "Arşiv", allClasses: "← Tüm sınıflar",
    code: "Sınıf kodu", studentLink: "Öğrenci bağlantısı", copyLink: "Bağlantıyı kopyala", linkCopied: "Bağlantı kopyalandı.",
    copyFail: "Kopyalanamadı — bağlantıyı seçip elle kopyalayın.",
    qrPng: "QR kodu indir", projector: "Ekranda göster", newCode: "Yeni kod",
    newCodeQ: "Eski kod ve bağlantı çalışmayı bırakır. Zaten katılmış öğrenciler sınıfta kalır.", codeChanged: "Sınıf kodu yenilendi.",
    joinHelp: "Öğrenciler bağlantıyı açar (veya QR kodu okutur) ve adlarını yazar. Ya da: sitenin ana sayfası → «Sınıf kodu».",
    rename: "Adı kaydet", renamed: "Ad kaydedildi.",
    classSets: "Sınıfın setleri", classSetsP: "Öğrenciler bu setleri bu sırayla görür.",
    noClassSets: "Henüz set seçilmedi.", addSets: "Kitaplığınızdan ekleyin", allAdded: "Tüm setleriniz zaten bu sınıfta.",
    libEmpty: "Kitaplığınızda henüz set yok.", toLibrary: "Atölyeyi aç",
    up: "Yukarı", down: "Aşağı", take: "Sınıftan çıkar", add: "Ekle", saveSets: "Sınıf setlerini kaydet", setsSaved: "Sınıf setleri kaydedildi.",
    unsavedSets: "Sınıf setlerinde kaydedilmemiş değişiklikler var.",
    studentsT: "Öğrenciler", noStudents: "Henüz kimse katılmadı. Öğrencilere sınıf bağlantısını veya kodunu verin.",
    joined: "katıldı", lastSeen: "son görülme", removeStudent: "Sil", removeStudentQ: "Bu öğrenci ve ilerlemesi silinsin mi?",
    manageT: "Sınıf yönetimi", archiveBtn: "Arşive al", unarchiveBtn: "Arşivden çıkar",
    archiveP: "Arşivdeki sınıfa öğrenciler katılamaz, ama tüm veriler saklanır.", archived: "arşiv",
    deleteClass: "Sınıfı sil", deleteClassQ: "Sınıf tüm öğrencileri ve ilerlemeleriyle birlikte silinsin mi? Geri alınamaz.",
    classDeleted: "Sınıf silindi.", notFound: "Sınıf bulunamadı.", saveErrGen: "Kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.",
    close: "Kapat", scanOr: "QR kodu okutun veya açın:",
    statsT: "Sınıf istatistiği", statsEmpty: "Öğrenciler seviye bitirmeye başlayınca istatistik görünür.",
    sPupils: "öğrenci", sActive: "son 7 günde oynadı", sLevels: "seviye tamamlandı", sPlays: "oyun oynandı",
    kGroups: "Gruplar", kOdd: "Farklı olanı bul", kPairs: "Kelime ↔ çeviri",
    gridT: "Setlere göre tamamlanan seviyeler", gridP: "Sayı tamamlanan seviye sayısıdır; noktalar son tamamlanan seviyedeki en iyi sonucu (3 üzerinden) gösterir. Ayrıntı için ada tıklayın.",
    gridNone: "—", cellT: (n, set, lv, st) => `${n} · ${set}: ${lv} seviye tamamlandı${st ? `, sonuncuda 3 baloncuktan ${st}` : ""}`,
    lastSeenCol: "Son giriş", confT: "En çok karıştırılan kelimeler", confP: "Bir kelimenin kaç kez hataya karıştığı ve kaç öğrencide. Oyun bu kelimeleri zaten daha sık getiriyor.",
    confNone: "Henüz hata yok — ya da kimse oynamadı.", timesPupils: (n, m) => `${n} kez · ${m} öğrenci`,
    detailSets: "Setlere göre", detailMiss: "Karıştırdıkları", noMiss: "hata yok", lvShort: (n) => `sv. ${n}`,
    tStatsOn: "İstatistik her sınıfın sayfasında: öğrencilerin setlere göre seviyeleri ve karıştırdıkları kelimeler.",
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
let state = { view: "loading", session: null, teacher: null, sentTo: "", msg: null, busy: false, admin: { teachers: [], invites: [] }, confirmInvite: null, sets: [], importing: false,
  page: "home", classes: [], cls: null, confirm: null, projector: false };
let authHooked = false, lastSub = null;
const sub = () => location.hash.replace(/^#\/teacher\/?/, "").split("?")[0];

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
  if (state.teacher && state.session) { await loadPage(); return; }
  render();
  await load();
}

async function loadPage() {
  const s = sub();
  if (s !== lastSub) { if (lastSub !== null) state.msg = state.keepMsg ? state.msg : null; state.confirm = null; state.projector = false; lastSub = s; }
  state.keepMsg = false;
  state.page = s.indexOf("classes/") === 0 ? "class" : s === "classes" ? "classes" : "home";
  try {
    if (state.page === "home") {
      [state.sets, state.classes] = await Promise.all([loadMySets(), loadClasses()]);
      if (state.teacher.is_admin) await loadAdmin();
    } else if (state.page === "classes") {
      state.classes = await loadClasses();
    } else {
      await loadClassDetail(s.slice(8));
      if (!state.cls) { state.msg = { kind: "err", text: t("notFound") }; state.keepMsg = true; location.hash = "#/teacher/classes"; return; }
    }
  } catch (e) { state.msg = { kind: "err", text: t("loadErr") }; }
  render();
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
    if (me) { lastSub = null; await loadPage(); return; }
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
  else if (state.view === "home") inner = state.page === "classes" ? classesHtml() : state.page === "class" && state.cls ? classHtml() : homeHtml();
  root.innerHTML = shell(inner) + (state.projector && state.cls ? projectorHtml() : "");
  wire();
}

function homeHtml() {
  const me = state.teacher || {};
  const tile = (title, p, n) => `<div class="tv-tile" aria-disabled="true"><b>${esc(title)}</b><span>${esc(p)}</span><em>${esc(t("soon", n))}</em></div>`;
  let html = `<section class="card tv-wide"><p class="kicker">${esc(t("hello", me.email || ""))}${me.is_admin ? ` · ${esc(t("admin"))}` : ""}</p>
    <h1 class="h1">${esc(t("tilesT"))}</h1><div class="tv-tiles">${setsTile()}${classesTile()}<div class="tv-tile on"><b>${esc(t("tStats"))}</b><span>${esc(t("tStatsOn"))}</span><div class="row"><a class="btn ghost small" href="#/teacher/classes">${esc(t("openClasses"))}</a></div></div></div></section>`;
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

/* ── classes ── */
const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const randomCode = () => Array.from({ length: 6 }, () => CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]).join("");
const classLink = (code) => siteUrl() + "#/c/" + code;
const cnt = (v) => (Array.isArray(v) && v[0] && typeof v[0].count === "number" ? v[0].count : 0);

async function loadClasses() {
  const { data, error } = await supabase.from("classes").select("id,name,join_code,archived,created_at,class_sets(count),students(count)").order("created_at");
  if (error) throw error;
  return (data || []).map((c) => ({ id: c.id, name: c.name, code: c.join_code, archived: c.archived, created_at: c.created_at, nSets: cnt(c.class_sets), nStudents: cnt(c.students) }));
}
async function loadClassDetail(id) {
  const [cq, csq, stq, sets, pq] = await Promise.all([
    supabase.from("classes").select("*").eq("id", id).maybeSingle(),
    supabase.from("class_sets").select("set_id,position").eq("class_id", id).order("position"),
    supabase.from("students").select("id,display_name,created_at,last_seen").eq("class_id", id).order("display_name"),
    loadMySets(),
    supabase.from("progress").select("student_id,set_id,kind,level,stars,misses,plays,updated_at, students!inner(class_id)").eq("students.class_id", id)
  ]);
  if (cq.error) throw cq.error;
  if (!cq.data) { state.cls = null; return; }
  const own = new Set(sets.map((x) => x.id));
  state.cls = { row: cq.data, sets, chosen: (csq.data || []).map((r) => r.set_id).filter((sid) => own.has(sid)), students: stq.data || [], dirty: false, nameDraft: null,
    progress: (pq.data || []).map((r) => ({ student: r.student_id, set: r.set_id, kind: r.kind, level: r.level, stars: r.stars || {}, misses: r.misses || {}, plays: r.plays || 0, at: r.updated_at })),
    statKind: (state.cls && state.cls.row && state.cls.row.id === id && state.cls.statKind) || "groups", openStudent: null };
}

/* ── class statistics ── */
function statsHtml() {
  const c = state.cls, P = c.progress, byId = new Map(c.sets.map((x) => [x.id, x]));
  const sets = c.chosen.map((sid) => byId.get(sid)).filter(Boolean);
  const week = Date.now() - 7 * 864e5;
  const active = c.students.filter((st) => new Date(st.last_seen).getTime() >= week).length;
  const levels = P.reduce((n, r) => n + Math.max(0, r.level - 1), 0), plays = P.reduce((n, r) => n + r.plays, 0);
  const stat = (v, l) => `<div class="st-tile"><b>${v}</b><span>${esc(l)}</span></div>`;
  let html = `<section class="card tv-wide"><h2 class="h2" style="margin-top:0">${esc(t("statsT"))}</h2>
    <div class="st-tiles">${stat(c.students.length, t("sPupils"))}${stat(active, t("sActive"))}${stat(levels, t("sLevels"))}${stat(plays, t("sPlays"))}</div>`;
  if (!P.length || !sets.length) return html + `<p class="help" style="margin-top:12px">${esc(t("statsEmpty"))}</p></section>`;

  // grid: pupils × sets for the chosen game kind
  const kinds = [["groups", t("kGroups")], ["odd", t("kOdd")], ["pairs", t("kPairs")]];
  const k = c.statKind, cell = new Map(P.filter((r) => r.kind === k).map((r) => [r.student + "|" + r.set, r]));
  const maxLv = Math.max(1, ...[...cell.values()].map((r) => r.level - 1));
  const lastStars = (r) => { const keys = Object.keys(r.stars).map(Number).filter((n) => n <= r.level - 1); return keys.length ? r.stars[Math.max(...keys)] : 0; };
  html += `<h3 class="h2">${esc(t("gridT"))}</h3><div class="seg" role="group">${kinds.map(([v, l]) => `<button type="button" class="segbtn" data-act="skind" data-kind="${v}" aria-pressed="${k === v}">${esc(l)}</button>`).join("")}</div>
    <p class="help" style="margin:8px 0 10px">${esc(t("gridP"))}</p><div class="st-scroll"><table class="st-grid"><thead><tr><th scope="col"></th>${sets.map((x) => `<th scope="col">${esc(x.title)}</th>`).join("")}<th scope="col">${esc(t("lastSeenCol"))}</th></tr></thead><tbody>`;
  c.students.forEach((st) => {
    html += `<tr><th scope="row"><button class="linkbtn" type="button" data-act="sopen" data-id="${esc(st.id)}" aria-expanded="${c.openStudent === st.id}">${esc(st.display_name)}</button></th>` +
      sets.map((x) => {
        const r = cell.get(st.id + "|" + x.id);
        if (!r || r.level <= 1) return `<td class="st-cell none" title="${esc(t("cellT", st.display_name, x.title, 0, 0))}">${esc(t("gridNone"))}</td>`;
        const lv = r.level - 1, sc = lastStars(r), a = Math.round(18 + 62 * Math.min(1, lv / maxLv));
        return `<td class="st-cell" style="--a:${a}%" title="${esc(t("cellT", st.display_name, x.title, lv, sc))}"><b>${lv}</b><span class="st-dots">${[1, 2, 3].map((i) => `<i class="${i <= sc ? "on" : ""}"></i>`).join("")}</span></td>`;
      }).join("") + `<td class="st-seen">${esc(fmtDate(st.last_seen))}</td></tr>`;
    if (c.openStudent === st.id) html += `<tr class="st-detail"><td colspan="${sets.length + 2}">${studentDetail(st, sets)}</td></tr>`;
  });
  html += `</tbody></table></div>`;

  // most confused words (latest misses per pupil per set, all kinds merged)
  const latest = new Map();
  P.forEach((r) => { const key = r.student + "|" + r.set, prev = latest.get(key); if (!prev || prev.at < r.at) latest.set(key, r); });
  const words = new Map();
  latest.forEach((r) => Object.entries(r.misses).forEach(([w, n]) => {
    if (!(n > 0)) return; const e = words.get(w) || { n: 0, pupils: new Set(), set: r.set }; e.n += n; e.pupils.add(r.student); words.set(w, e);
  }));
  const groupOf = (setId, w) => { const x = byId.get(setId); if (!x) return ""; const g = (x.cats || []).find((c2) => (c2.words || []).some((y) => String(y.w).toLowerCase() === w)); return g ? g.name : ""; };
  const top = [...words.entries()].sort((a, b) => b[1].n - a[1].n || b[1].pupils.size - a[1].pupils.size).slice(0, 12);
  const maxN = top.length ? top[0][1].n : 1;
  html += `<h3 class="h2">${esc(t("confT"))}</h3><p class="help" style="margin-bottom:10px">${esc(t("confP"))}</p>` + (top.length
    ? `<ol class="st-bars">${top.map(([w, e]) => `<li><span class="st-word"><b>${esc(w)}</b><i>${esc(groupOf(e.set, w))}</i></span><span class="st-bar"><span style="width:${Math.max(4, Math.round(100 * e.n / maxN))}%"></span></span><span class="st-num">${esc(t("timesPupils", e.n, e.pupils.size))}</span></li>`).join("")}</ol>`
    : `<p class="help">${esc(t("confNone"))}</p>`);
  return html + `</section>`;
}
function studentDetail(st, sets) {
  const rows = state.cls.progress.filter((r) => r.student === st.id);
  const kindName = { groups: t("kGroups"), odd: t("kOdd"), pairs: t("kPairs") };
  const per = sets.map((x) => {
    const rs = rows.filter((r) => r.set === x.id && r.level > 1);
    return rs.length ? `<li><b>${esc(x.title)}</b> ${rs.map((r) => `<span class="tag">${esc(kindName[r.kind] || r.kind)} · ${esc(t("lvShort", r.level - 1))}</span>`).join(" ")}</li>` : "";
  }).join("");
  const miss = {}; rows.forEach((r) => Object.entries(r.misses).forEach(([w, n]) => { miss[w] = Math.max(miss[w] || 0, n); }));
  const mw = Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  return `<div class="st-det"><div><p class="lbl">${esc(t("detailSets"))}</p><ul class="tv-mini">${per || `<li><i>${esc(t("gridNone"))}</i></li>`}</ul></div>
    <div><p class="lbl">${esc(t("detailMiss"))}</p><p class="st-miss">${mw.length ? mw.map(esc).join(", ") : `<i>${esc(t("noMiss"))}</i>`}</p></div></div>`;
}
function classesTile() {
  const list = state.classes.filter((c) => !c.archived);
  const names = list.slice(0, 5).map((c) => `<li>${esc(c.name)} <i>${esc(c.code)} · ${esc(t("pupilsN", c.nStudents))}</i></li>`).join("");
  return `<div class="tv-tile on"><b>${esc(t("tClasses"))}</b><span>${esc(list.length ? t("classesN", list.length) : t("noClassesYet"))}</span>
    ${list.length ? `<ul class="tv-mini">${names}${list.length > 5 ? `<li><i>${esc(t("andMore", list.length - 5))}</i></li>` : ""}</ul>` : ""}
    <div class="row"><a class="btn small" href="#/teacher/classes">${esc(t("openClasses"))}</a></div></div>`;
}
function classRow(c) {
  return `<li><a class="cls-item" href="#/teacher/classes/${esc(c.id)}"><b>${esc(c.name)}</b><span class="cls-code-sm">${esc(c.code)}</span>
    <span class="tv-date">${esc(t("setsN", c.nSets))} · ${esc(t("pupilsN", c.nStudents))}</span></a></li>`;
}
function classesHtml() {
  const act = state.classes.filter((c) => !c.archived), arch = state.classes.filter((c) => c.archived);
  return `<section class="card tv-wide"><a class="linkbtn" href="#/teacher">← ${esc(t("title"))}</a>
    <h1 class="h1" style="margin-top:8px">${esc(t("classesT"))}</h1><p class="help">${esc(t("classesP"))}</p>
    <form class="row tv-invite" id="newClass" novalidate style="margin:16px 0"><input id="newClassIn" type="text" maxlength="60" placeholder="${esc(t("newClassPh"))}" aria-label="${esc(t("newClassPh"))}"><button class="btn small" type="submit">${esc(t("createClass"))}</button></form>
    ${act.length ? `<ul class="tv-list">${act.map(classRow).join("")}</ul>` : `<p class="help">${esc(t("noClassesYet"))}</p>`}
    ${arch.length ? `<details class="cls-arch"><summary>${esc(t("archiveT"))} (${arch.length})</summary><ul class="tv-list">${arch.map(classRow).join("")}</ul></details>` : ""}
  </section>`;
}
function qrSvg(text) {
  const qr = qrcode(0, "M"); qr.addData(text); qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
function classHtml() {
  const c = state.cls, r = c.row, link = classLink(r.join_code);
  const byId = new Map(c.sets.map((x) => [x.id, x]));
  const confirmRow = (key, q, yesAct, data) => state.confirm === key
    ? `<span class="tv-confirm">${esc(q)} <button class="btn danger small" type="button" data-act="${yesAct}"${data || ""}>${esc(t("yes"))}</button><button class="btn ghost small" type="button" data-act="cancel">${esc(t("no"))}</button></span>` : "";
  const chosen = c.chosen.map((sid, i) => {
    const x = byId.get(sid); if (!x) return "";
    return `<li><span class="cls-pos">${i + 1}</span><b>${esc(x.title || "—")}</b>${x.grade ? `<span class="tv-date" style="margin-left:0">${esc(x.grade)}</span>` : ""}
      <span class="cls-ord"><button class="iconbtn" type="button" data-act="up" data-i="${i}" aria-label="${esc(t("up"))}"${i === 0 ? " disabled" : ""}>↑</button><button class="iconbtn" type="button" data-act="down" data-i="${i}" aria-label="${esc(t("down"))}"${i === c.chosen.length - 1 ? " disabled" : ""}>↓</button><button class="iconbtn" type="button" data-act="take" data-i="${i}" aria-label="${esc(t("take"))}">×</button></span></li>`;
  }).join("");
  const rest = c.sets.filter((x) => c.chosen.indexOf(x.id) < 0);
  return `<section class="card tv-wide"><a class="linkbtn" href="#/teacher/classes">${esc(t("allClasses"))}</a>
      <form class="cls-head" id="clsRename" novalidate><input id="clsName" class="cls-name" type="text" maxlength="60" value="${esc(c.nameDraft != null ? c.nameDraft : r.name)}" aria-label="${esc(t("classesT"))}">
      ${r.archived ? `<span class="tag">${esc(t("archived"))}</span>` : ""}<button class="btn ghost small" type="submit" id="clsRenameBtn" hidden>${esc(t("rename"))}</button></form>
      <div class="cls-join">
        <div class="cls-qr" aria-hidden="true">${qrSvg(link)}</div>
        <div class="cls-info">
          <p class="lbl">${esc(t("code"))}</p><p class="cls-code">${esc(r.join_code)}</p>
          <p class="lbl">${esc(t("studentLink"))}</p><p class="cls-link"><code id="clsLink">${esc(link)}</code></p>
          <div class="row"><button class="btn small" type="button" data-act="copy">${esc(t("copyLink"))}</button><button class="btn ghost small" type="button" data-act="qrpng">${esc(t("qrPng"))}</button><button class="btn ghost small" type="button" data-act="proj">${esc(t("projector"))}</button>
          ${state.confirm === "code" ? "" : `<button class="btn ghost small" type="button" data-act="code">${esc(t("newCode"))}</button>`}</div>
          ${state.confirm === "code" ? `<p class="tv-confirm cls-warn">${esc(t("newCodeQ"))} <button class="btn danger small" type="button" data-act="code-yes">${esc(t("newCode"))}</button><button class="btn ghost small" type="button" data-act="cancel">${esc(t("no"))}</button></p>` : ""}
          <p class="help">${esc(t("joinHelp"))}</p>
        </div>
      </div></section>
    ${statsHtml()}
    <section class="card tv-wide"><h2 class="h2" style="margin-top:0">${esc(t("classSets"))}</h2><p class="help">${esc(t("classSetsP"))}</p>
      ${c.chosen.length ? `<ol class="tv-list cls-sets">${chosen}</ol>` : `<p class="help"><b>${esc(t("noClassSets"))}</b></p>`}
      ${c.sets.length ? (rest.length ? `<p class="lbl" style="margin:14px 0 6px">${esc(t("addSets"))}</p><ul class="cls-add">${rest.map((x) => `<li><button class="chipbtn" type="button" data-act="add" data-id="${esc(x.id)}">+ ${esc(x.title || "—")}${x.grade ? ` · ${esc(x.grade)}` : ""}</button></li>`).join("")}</ul>` : `<p class="help">${esc(t("allAdded"))}</p>`)
        : `<p class="help">${esc(t("libEmpty"))} <a class="linkbtn" href="#/teacher/sets">${esc(t("toLibrary"))}</a></p>`}
      <div class="row" style="margin-top:14px"><button class="btn" type="button" data-act="savesets"${c.dirty ? "" : " disabled"}>${esc(t("saveSets"))}</button>${c.dirty ? `<span class="dirty">${esc(t("unsavedSets"))}</span>` : ""}</div></section>
    <section class="card tv-wide"><h2 class="h2" style="margin-top:0">${esc(t("studentsT"))} · ${c.students.length}</h2>
      ${c.students.length ? `<ul class="tv-list">${c.students.map((st) => `<li><b>${esc(st.display_name)}</b><span class="tv-date">${esc(t("joined"))} ${esc(fmtDate(st.created_at))} · ${esc(t("lastSeen"))} ${esc(fmtDate(st.last_seen))}</span>
        ${state.confirm === "st:" + st.id ? confirmRow("st:" + st.id, t("removeStudentQ"), "st-yes", ` data-id="${esc(st.id)}"`) : `<button class="btn ghost small" type="button" data-act="st" data-id="${esc(st.id)}">${esc(t("removeStudent"))}</button>`}</li>`).join("")}</ul>`
        : `<p class="help">${esc(t("noStudents"))}</p>`}</section>
    <section class="card tv-wide"><h2 class="h2" style="margin-top:0">${esc(t("manageT"))}</h2><p class="help">${esc(t("archiveP"))}</p>
      <div class="row" style="margin-top:10px"><button class="btn ghost small" type="button" data-act="arch">${esc(r.archived ? t("unarchiveBtn") : t("archiveBtn"))}</button>
      ${state.confirm === "del" ? confirmRow("del", t("deleteClassQ"), "del-yes") : `<button class="btn ghost small cls-danger" type="button" data-act="del">${esc(t("deleteClass"))}</button>`}</div></section>`;
}
function projectorHtml() {
  const r = state.cls.row, link = classLink(r.join_code);
  return `<div class="projector" role="dialog" aria-modal="true" aria-label="${esc(r.name)}"><button class="btn ghost small proj-close" type="button" data-act="proj-close">${esc(t("close"))}</button>
    <p class="proj-name">${esc(r.name)}</p><div class="proj-qr">${qrSvg(link)}</div><p class="proj-code">${esc(r.join_code)}</p>
    <p class="proj-link">${esc(t("scanOr"))} <b>${esc(link.replace(/^https?:\/\//, ""))}</b></p></div>`;
}
async function createClass(name) {
  name = String(name || "").trim(); if (!name) return;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.from("classes").insert({ owner_id: state.teacher.id, name, join_code: randomCode() }).select("id").single();
    if (!error) { location.hash = "#/teacher/classes/" + data.id; return; }
    if (String(error.code) !== "23505") break;
  }
  state.msg = { kind: "err", text: t("saveErrGen") }; render();
}
async function classUpdate(fields, okMsg) {
  const { error } = await supabase.from("classes").update(fields).eq("id", state.cls.row.id);
  if (error) { state.msg = { kind: "err", text: t("saveErrGen") }; render(); return false; }
  Object.assign(state.cls.row, fields);
  if (okMsg) state.msg = { kind: "ok", text: okMsg };
  render(); return true;
}
async function newCode() {
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    const { error } = await supabase.from("classes").update({ join_code: code }).eq("id", state.cls.row.id);
    if (!error) { state.cls.row.join_code = code; state.confirm = null; state.msg = { kind: "ok", text: t("codeChanged") }; render(); return; }
    if (String(error.code) !== "23505") break;
  }
  state.msg = { kind: "err", text: t("saveErrGen") }; render();
}
async function saveClassSets() {
  const c = state.cls, id = c.row.id;
  let q = supabase.from("class_sets").delete().eq("class_id", id);
  if (c.chosen.length) q = q.not("set_id", "in", "(" + c.chosen.join(",") + ")");
  const { error: e1 } = await q;
  let e2 = null;
  if (!e1 && c.chosen.length) ({ error: e2 } = await supabase.from("class_sets").upsert(c.chosen.map((sid, i) => ({ class_id: id, set_id: sid, position: i })), { onConflict: "class_id,set_id" }));
  if (e1 || e2) { state.msg = { kind: "err", text: t("saveErrGen") }; render(); return; }
  c.dirty = false; state.msg = { kind: "ok", text: t("setsSaved") }; render();
}
async function copyLink() {
  const link = classLink(state.cls.row.join_code);
  try { await navigator.clipboard.writeText(link); state.msg = { kind: "ok", text: t("linkCopied") }; }
  catch (e) {
    const el = root.querySelector("#clsLink");
    if (el) { const rg = document.createRange(); rg.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg); }
    state.msg = { kind: "err", text: t("copyFail") };
  }
  render();
}
function downloadQr() {
  const r = state.cls.row, qr = qrcode(0, "M"); qr.addData(classLink(r.join_code)); qr.make();
  const n = qr.getModuleCount(), cell = 16, margin = 4, size = (n + margin * 2) * cell, pad = 90;
  const cv = document.createElement("canvas"); cv.width = size; cv.height = size + pad;
  const ctx = cv.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = "#15304A";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) ctx.fillRect((x + margin) * cell, (y + margin) * cell, cell, cell);
  ctx.textAlign = "center"; ctx.font = "800 44px Nunito, Arial, sans-serif"; ctx.fillText(r.name + " · " + r.join_code, size / 2, size + 50);
  cv.toBlob((b) => {
    const url = URL.createObjectURL(b), a = document.createElement("a");
    a.href = url; a.download = "Bubble Sort - " + r.name.replace(/[\\/:*?"<>|]+/g, " ") + " - QR.png"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, "image/png");
}
function classAction(a, b) {
  const c = state.cls; if (!c) return false;
  const i = +b.dataset.i;
  if (a === "skind") { c.statKind = b.dataset.kind; render(); }
  else if (a === "sopen") { c.openStudent = c.openStudent === b.dataset.id ? null : b.dataset.id; render(); }
  else if (a === "up" && i > 0) { [c.chosen[i - 1], c.chosen[i]] = [c.chosen[i], c.chosen[i - 1]]; c.dirty = true; render(); }
  else if (a === "down" && i < c.chosen.length - 1) { [c.chosen[i + 1], c.chosen[i]] = [c.chosen[i], c.chosen[i + 1]]; c.dirty = true; render(); }
  else if (a === "take") { c.chosen.splice(i, 1); c.dirty = true; render(); }
  else if (a === "add") { c.chosen.push(b.dataset.id); c.dirty = true; render(); }
  else if (a === "savesets") saveClassSets();
  else if (a === "copy") copyLink();
  else if (a === "qrpng") downloadQr();
  else if (a === "proj") { state.projector = true; render(); }
  else if (a === "proj-close") { state.projector = false; render(); }
  else if (a === "code") { state.confirm = "code"; render(); }
  else if (a === "code-yes") newCode();
  else if (a === "cancel") { state.confirm = null; render(); }
  else if (a === "st") { state.confirm = "st:" + b.dataset.id; render(); }
  else if (a === "st-yes") {
    supabase.from("students").delete().eq("id", b.dataset.id).then(({ error }) => {
      if (error) state.msg = { kind: "err", text: t("saveErrGen") }; else c.students = c.students.filter((s) => s.id !== b.dataset.id);
      state.confirm = null; render();
    });
  }
  else if (a === "arch") classUpdate({ archived: !c.row.archived });
  else if (a === "del") { state.confirm = "del"; render(); }
  else if (a === "del-yes") {
    supabase.from("classes").delete().eq("id", c.row.id).then(({ error }) => {
      if (error) { state.msg = { kind: "err", text: t("saveErrGen") }; render(); return; }
      state.msg = { kind: "ok", text: t("classDeleted") }; state.keepMsg = true; state.cls = null; location.hash = "#/teacher/classes";
    });
  }
  else return false;
  return true;
}

function wire() {
  const q = (s) => root.querySelector(s);
  const login = q("#tvLogin");
  if (login) { login.onsubmit = (e) => { e.preventDefault(); sendLink(q("#tvEmail").value); }; if (!state.busy) q("#tvEmail").focus(); }
  const code = q("#tvCode");
  if (code) code.onsubmit = (e) => { e.preventDefault(); verifyCode(q("#tvCodeIn").value); };
  const nc = q("#newClass");
  if (nc) nc.onsubmit = (e) => { e.preventDefault(); createClass(q("#newClassIn").value); };
  const rn = q("#clsRename");
  if (rn) {
    const inp = q("#clsName"), btn = q("#clsRenameBtn");
    const sync = () => { btn.hidden = inp.value.trim() === state.cls.row.name || !inp.value.trim(); };
    sync();
    inp.oninput = () => { state.cls.nameDraft = inp.value; sync(); };
    rn.onsubmit = async (e) => { e.preventDefault(); const v = inp.value.trim(); if (!v || v === state.cls.row.name) return; if (await classUpdate({ name: v }, t("renamed"))) state.cls.nameDraft = null; };
  }
  const inv = q("#tvInvite");
  if (inv) inv.onsubmit = (e) => { e.preventDefault(); addInvite(q("#tvInviteIn").value); };
  root.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = () => {
      const a = b.dataset.act;
      if (classAction(a, b)) return;
      if (a === "signout") signOut();
      else if (a === "again") { state.view = "login"; state.msg = null; render(); }
      else if (a === "rm") { state.confirmInvite = b.dataset.email; render(); }
      else if (a === "rm-no") { state.confirmInvite = null; render(); }
      else if (a === "rm-yes") removeInvite(b.dataset.email);
      else if (a === "demo") importDemo();
    };
  });
}

document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.projector) { state.projector = false; render(); } });

export function rerenderTeacher() { if (root && !root.hidden) render(); }
