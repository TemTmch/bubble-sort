/* Bubble Sort — game + teacher workshop (ported from the Claude artifact prototype). */
import * as PIXI from "pixi.js";
import demoData from "./data/demo-sets.json";
import { GAME_ME, PRINT_ME } from "./i18n-me.js";

// Stage 1: standalone site. Teacher tools arrive with accounts in stage 3.
var STANDALONE = !(window.claude && typeof window.claude.use === "function");
var TEACHER_UI = false;

export function startApp() {
var API = {};
(function () {
"use strict";

/* ─────────────── constants & helpers ─────────────── */
var PIXI_LOCAL = "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/8.6.6/pixi.min.js";
var PIXI_CDN = "https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.min.js";
var CAT_COLORS = ["#E0565B", "#2C93C4", "#2FA36F", "#D98A0B", "#8D63D6", "#D65C95"];
var LANGS = [["en-GB", "English (UK)"], ["en-US", "English (US)"], ["ru-RU", "Русский"], ["sr-RS", "Srpski / Crnogorski"], ["fr-FR", "Français"], ["de-DE", "Deutsch"], ["tr-TR", "Türkçe"]];

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
// In a class, progress keys are namespaced per pupil so pupils sharing a tablet don't mix results.
var LS_NS = "";
function nsKey(k) { return LS_NS && /^bs\.(lv|stars|miss|mode|kind)\./.test(k) ? k.replace(/^bs\./, "bs." + LS_NS + ".") : k; }
function lsGet(k) { try { return localStorage.getItem(nsKey(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(nsKey(k), v); } catch (e) {} }
function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
function rand(n) { return Math.floor(Math.random() * n); }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function uid() { return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
var reduceMotion = false;
try { reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

var DATA = JSON.parse(JSON.stringify(demoData));
var SETS = Array.isArray(DATA.sets) ? DATA.sets : [];
var DEMO_SETS = SETS;
var CLASS = null; // {code, className, student, onProgress(setId, kind, data), onForget()} while a pupil plays in a class
var JOIN = null;  // join screen state for #/c/CODE

/* ─────────────── i18n ─────────────── */
function plural(n, one, few, many) { var m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return one; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few; return many; }
var I18N = {
  ru: {
    sound: "Звук", langSwitch: "EN", teacher: "Наборы слов",
    moves: "ходы", level: function (n) { return "Уровень " + n; }, draft: "черновик",
    kicker: "Игра на сортировку слов",
    homeTitle: "Разложи слова по группам — и лопни все пузыри",
    rules: ["Коснись двух пузырей со словами из одной группы — они сольются в один.",
            "Ошибка стоит одного хода. Кончились ходы — уровень начинается заново.",
            "Группа собрана целиком — пузырь лопается и показывает её название."],
    chooseSet: "Выбери набор",
    noSets: "Учитель ещё не добавил наборы слов.",
    setMeta: function (g, w) { return g + " " + plural(g, "группа", "группы", "групп") + " · " + w + " " + plural(w, "слово", "слова", "слов"); },
    goLevel: function (n) { return n > 1 ? "Продолжить с уровня " + n : "Играть"; },
    lens: "Лупа", magnet: "Магнит", sorted: "Собрано",
    lensNote: "Выбери пузырь — лупа покажет его группу", cancel: "Отмена",
    groupDone: "Группа собрана", listen: "Послушать",
    winK: "Уровень пройден", winT: "Все слова на своих местах!",
    loseK: "Ходы закончились", loseT: "Почти получилось. Вот какие были группы:",
    stats: function (m, l) { return "Ошибок: " + m + " · Ходов в запасе: " + l; },
    mixups: "Что перепутали — повтори", mixWhy: function (a, b) { return a + " ≠ " + b; },
    next: "Следующий уровень", retry: "Ещё раз", toSets: "К наборам", backEditor: "Вернуться к набору",
    engineFail: "Не удалось загрузить игровой движок. Проверьте подключение и обновите страницу.",
    // teacher
    wsTitle: "Мастерская учителя", unsaved: "Есть несохранённые изменения", close: "Закрыть",
    newSet: "+ Новый набор", untitled: "Без названия", groupsShort: function (g) { return g + " " + plural(g, "группа", "группы", "групп"); },
    fTitle: "Название набора", fGrade: "Класс или тема", fLang: "Язык озвучки", fWords: "Группы и слова",
    help: "Одна строка — одна группа: <code>Fruit: apple, pear, plum</code>. Перевод или подсказку добавьте через «=»: <code>apple = яблоко</code>. Можно вставить строки из таблицы: первый столбец — группа, дальше слова. Строки с <code>#</code> — комментарии.",
    check: "Проверка", preview: "Как это увидит игра",
    allGood: "Всё в порядке — набор готов к игре.",
    vNoColon: function (l) { return "Строка «" + l + "» без двоеточия — не понятно, где название группы."; },
    vFew: function (n, c) { return "Группа «" + n + "»: " + c + " " + plural(c, "слово", "слова", "слов") + ", нужно минимум 3 — в игру не попадёт."; },
    vDup: function (w, a, b) { return "«" + w + "» есть и в «" + a + "», и в «" + b + "» — в уровне слово окажется только в одной группе."; },
    vLong: function (w) { return "Длинное слово «" + w + "» — в пузыре будет мелкий шрифт."; },
    vMin: "Нужно минимум 3 группы по 3 слова, иначе уровень не собрать.",
    notInGame: "не войдёт в игру",
    tryIt: "Попробовать уровень", del: "Удалить набор", delQ: "Удалить этот набор?", delYes: "Да, удалить",
    copyJson: "Скопировать JSON", importJson: "Импорт JSON", copied: "JSON скопирован в буфер обмена.",
    copyFallback: "Буфер обмена недоступен — выделите текст ниже и скопируйте вручную.",
    imported: function (n) { return "Добавлено наборов: " + n + ". Не забудьте сохранить."; },
    importBad: "Не получилось прочитать файл: нужен JSON, выгруженный из этой игры.",
    save: "Сохранить для учеников", saving: "Сохраняю…", saved: "Сохранено. Страница обновится с новыми наборами.",
    saveNA: "В этом просмотре сохранять нельзя — изменения видны только вам. Скопируйте JSON, чтобы их не потерять.",
    saveRO: "У вас нет прав на изменение этой страницы — наборы может менять только её владелец.",
    saveConflict: "Кто-то сохранил страницу раньше — она обновится, а ваш черновик восстановится.",
    saveRate: "Слишком частые сохранения — подождите минуту и сохраните снова.",
    saveBig: "Наборы слишком большие для одной страницы — разделите их или удалите лишние.",
    saveErr: "Не удалось сохранить. Попробуйте ещё раз через минуту.",
    restored: "Черновик восстановлен после обновления страницы — сохраните его, когда будете готовы.",
    savedOk: "Наборы сохранены — ученики видят их по той же ссылке.",
    needPlayable: "Этот набор пока нельзя сыграть — см. проверку справа."
  },
  en: {
    sound: "Sound", langSwitch: "RU", teacher: "Word sets",
    moves: "moves", level: function (n) { return "Level " + n; }, draft: "draft",
    kicker: "A word-sorting game",
    homeTitle: "Sort the words into groups and pop every bubble",
    rules: ["Tap two bubbles whose words belong to the same group — they merge into one.",
            "A wrong pair costs a move. Run out of moves and the level restarts.",
            "Finish a group and its bubble pops, showing the group's name."],
    chooseSet: "Choose a word set",
    noSets: "Your teacher hasn't added any word sets yet.",
    setMeta: function (g, w) { return g + " group" + (g === 1 ? "" : "s") + " · " + w + " word" + (w === 1 ? "" : "s"); },
    goLevel: function (n) { return n > 1 ? "Continue from level " + n : "Play"; },
    lens: "Lens", magnet: "Magnet", sorted: "Sorted",
    lensNote: "Tap a bubble — the lens shows its group", cancel: "Cancel",
    groupDone: "Group complete", listen: "Listen",
    winK: "Level complete", winT: "Every word is in its place!",
    loseK: "Out of moves", loseT: "So close. Here were the groups:",
    stats: function (m, l) { return "Mistakes: " + m + " · Moves to spare: " + l; },
    mixups: "Mix-ups to review", mixWhy: function (a, b) { return a + " ≠ " + b; },
    next: "Next level", retry: "Try again", toSets: "All sets", backEditor: "Back to the set",
    engineFail: "The game engine didn't load. Check your connection and reload the page.",
    wsTitle: "Teacher workshop", unsaved: "Unsaved changes", close: "Close",
    newSet: "+ New set", untitled: "Untitled", groupsShort: function (g) { return g + " group" + (g === 1 ? "" : "s"); },
    fTitle: "Set name", fGrade: "Class or topic", fLang: "Voice language", fWords: "Groups and words",
    help: "One line per group: <code>Fruit: apple, pear, plum</code>. Add a translation or hint with “=”: <code>apple = яблоко</code>. You can paste rows from a spreadsheet: first column is the group, then the words. Lines starting with <code>#</code> are comments.",
    check: "Check", preview: "What the game will see",
    allGood: "All good — this set is ready to play.",
    vNoColon: function (l) { return "Line “" + l + "” has no colon, so the group name is unclear."; },
    vFew: function (n, c) { return "Group “" + n + "” has " + c + " word" + (c === 1 ? "" : "s") + "; it needs at least 3 to appear in the game."; },
    vDup: function (w, a, b) { return "“" + w + "” is in both “" + a + "” and “" + b + "” — in a level it will belong to only one of them."; },
    vLong: function (w) { return "“" + w + "” is long — its bubble will use small type."; },
    vMin: "You need at least 3 groups of 3 words to build a level.",
    notInGame: "not in the game",
    tryIt: "Try a level", del: "Delete set", delQ: "Delete this set?", delYes: "Yes, delete",
    copyJson: "Copy JSON", importJson: "Import JSON", copied: "JSON copied to the clipboard.",
    copyFallback: "Clipboard isn't available — select the text below and copy it.",
    imported: function (n) { return n + " set(s) added. Remember to save."; },
    importBad: "Couldn't read that file: it needs to be JSON exported from this game.",
    save: "Save for students", saving: "Saving…", saved: "Saved. The page will reload with the new sets.",
    saveNA: "Saving isn't available in this view — changes stay with you only. Copy the JSON so you don't lose them.",
    saveRO: "You can't change this page — only its owner can edit the word sets.",
    saveConflict: "Someone saved the page first — it will reload and your draft will be restored.",
    saveRate: "Saving too often — wait a minute and save again.",
    saveBig: "The sets are too large for one page — split them or remove some.",
    saveErr: "Couldn't save. Try again in a minute.",
    restored: "Your draft was restored after the page reloaded — save it when you're ready.",
    savedOk: "Sets saved — students see them at the same link.",
    needPlayable: "This set can't be played yet — see the check on the right."
  }
};
Object.assign(I18N.ru, {
  goLevel: function (n) { return n > 1 ? "Уровень " + n : "Начать"; },
  sec: "сек", timeUp: "Время вышло",
  statsTime: function (m, s) { return "Ошибок: " + m + " · Осталось: " + s + " сек"; },
  allSets: "← Все наборы", toLevels: "К уровням", playLevel: function (n) { return "Играть уровень " + n; },
  modeQ: "Режим", modeMoves: "С ходами", modeTime: "На время",
  lvlHelp: "3×4 — три группы по четыре слова. Новый уровень открывается, когда пройден предыдущий.",
  lvlAria: function (l, cap, st, locked) { return "Уровень " + l + ": " + cap + (locked ? ", закрыт" : st ? ", пузырей: " + st + " из 3" : ""); },
  kbdHelp: "С клавиатуры: <kbd>Tab</kbd> до поля, стрелки — выбрать пузырь, <kbd>Enter</kbd> — взять, <kbd>L</kbd> — лупа, <kbd>M</kbd> — магнит.",
  canvasLabel: "Игровое поле. Стрелки — перейти к пузырю, Enter — взять, L — лупа, M — магнит.",
  srSelected: function (w) { return "Взят: " + w + ". Выберите пару."; }, srSelectedTag: "взят",
  srMerged: function (n, total) { return "Верно! В группе " + n + " из " + total + "."; },
  srWrong: "Не та группа.", srCancel: "Отменено.",
  srDone: function (g, w) { return "Группа собрана: " + g + " — " + w + "."; },
  srDummy: ""
});
Object.assign(I18N.en, {
  goLevel: function (n) { return n > 1 ? "Level " + n : "Start"; },
  sec: "sec", timeUp: "Time's up",
  statsTime: function (m, s) { return "Mistakes: " + m + " · Time left: " + s + " s"; },
  allSets: "← All sets", toLevels: "Levels", playLevel: function (n) { return "Play level " + n; },
  modeQ: "Mode", modeMoves: "Moves", modeTime: "Against the clock",
  lvlHelp: "3×4 means three groups of four words. Finish a level to open the next one.",
  lvlAria: function (l, cap, st, locked) { return "Level " + l + ": " + cap + (locked ? ", locked" : st ? ", " + st + " of 3 bubbles" : ""); },
  kbdHelp: "Keyboard: <kbd>Tab</kbd> to the board, arrows to pick a bubble, <kbd>Enter</kbd> to take it, <kbd>L</kbd> lens, <kbd>M</kbd> magnet.",
  canvasLabel: "Game board. Arrows move between bubbles, Enter takes one, L is the lens, M the magnet.",
  srSelected: function (w) { return "Took: " + w + ". Choose its pair."; }, srSelectedTag: "taken",
  srMerged: function (n, total) { return "Correct! " + n + " of " + total + " in this group."; },
  srWrong: "Not the same group.", srCancel: "Cancelled.",
  srDone: function (g, w) { return "Group complete: " + g + " — " + w + "."; },
  srDummy: ""
});
I18N.tr = {
  sound: "Ses", teacher: "Kelime setleri", langLabel: "Dil",
  moves: "hamle", level: function (n) { return "Seviye " + n; }, draft: "taslak",
  kicker: "Kelime sınıflandırma oyunu",
  homeTitle: "Kelimeleri gruplara ayır, bütün baloncukları patlat",
  rules: ["Aynı gruptan kelimeler taşıyan iki baloncuğa dokun — birleşip tek baloncuk olurlar.",
          "Yanlış eşleştirme bir hamleye mal olur. Hamlelerin biterse seviye baştan başlar.",
          "Bir grubu tamamladığında baloncuk grubun adını gösterir ve patlar."],
  chooseSet: "Bir kelime seti seç",
  noSets: "Öğretmen henüz kelime seti eklemedi.",
  setMeta: function (g, w) { return g + " grup · " + w + " kelime"; },
  goLevel: function (n) { return n > 1 ? "Seviye " + n : "Başla"; },
  lens: "Büyüteç", magnet: "Mıknatıs", sorted: "Tamamlanan",
  lensNote: "Bir baloncuğa dokun — büyüteç grubunu gösterir", cancel: "İptal",
  groupDone: "Grup tamamlandı", listen: "Dinle",
  winK: "Seviye tamamlandı", winT: "Bütün kelimeler yerli yerinde!",
  loseK: "Hamleler bitti", loseT: "Az kalmıştı. Gruplar şunlardı:",
  stats: function (m, l) { return "Hata: " + m + " · Kalan hamle: " + l; },
  mixups: "Karıştırılanlar — tekrar et", mixWhy: function (a, b) { return a + " ≠ " + b; },
  next: "Sonraki seviye", retry: "Tekrar dene", toSets: "Setlere dön", backEditor: "Sete geri dön",
  engineFail: "Oyun motoru yüklenemedi. Bağlantını kontrol edip sayfayı yenile.",
  sec: "sn", timeUp: "Süre doldu",
  statsTime: function (m, s) { return "Hata: " + m + " · Kalan süre: " + s + " sn"; },
  allSets: "← Bütün setler", toLevels: "Seviyeler", playLevel: function (n) { return "Seviye " + n + " — oyna"; },
  modeQ: "Mod", modeMoves: "Hamleli", modeTime: "Süreli",
  lvlHelp: "3×4, dörder kelimelik üç grup demek. Bir seviyeyi bitirince sıradaki açılır.",
  lvlAria: function (l, cap, st, locked) { return "Seviye " + l + ": " + cap + (locked ? ", kilitli" : st ? ", 3 baloncuktan " + st : ""); },
  kbdHelp: "Klavyeyle: <kbd>Tab</kbd> ile oyun alanına geç, oklarla baloncuk seç, <kbd>Enter</kbd> ile al, <kbd>L</kbd> büyüteç, <kbd>M</kbd> mıknatıs.",
  canvasLabel: "Oyun alanı. Oklar baloncuklar arasında gezer, Enter baloncuğu alır, L büyüteç, M mıknatıs.",
  srSelected: function (w) { return "Alındı: " + w + ". Eşini seç."; }, srSelectedTag: "alındı",
  srMerged: function (n, total) { return "Doğru! Bu grupta " + total + " kelimeden " + n + " tanesi toplandı."; },
  srWrong: "Aynı grup değil.", srCancel: "İptal edildi.",
  srDone: function (g, w) { return "Grup tamamlandı: " + g + " — " + w + "."; },
  srDummy: "",
  // teacher workshop
  wsTitle: "Öğretmen atölyesi", unsaved: "Kaydedilmemiş değişiklikler var", close: "Kapat",
  newSet: "+ Yeni set", untitled: "Adsız", groupsShort: function (g) { return g + " grup"; },
  fTitle: "Set adı", fGrade: "Sınıf veya konu", fLang: "Seslendirme dili", fWords: "Gruplar ve kelimeler",
  help: "Her satır bir grup: <code>Fruit: apple, pear, plum</code>. Çeviri veya ipucunu «=» ile ekleyin: <code>apple = elma</code>. Tablodan satır yapıştırabilirsiniz: ilk sütun grup, ardından kelimeler. <code>#</code> ile başlayan satırlar yorumdur.",
  check: "Kontrol", preview: "Oyunun göreceği hâli",
  allGood: "Her şey yolunda — set oynamaya hazır.",
  vNoColon: function (l) { return "«" + l + "» satırında iki nokta yok, grup adının nerede bittiği belli değil."; },
  vFew: function (n, c) { return "«" + n + "» grubunda " + c + " kelime var; oyuna girmesi için en az 3 gerekli."; },
  vDup: function (w, a, b) { return "«" + w + "» hem «" + a + "» hem de «" + b + "» grubunda — seviyede yalnızca birinde yer alacak."; },
  vLong: function (w) { return "«" + w + "» uzun bir kelime — baloncukta küçük yazılacak."; },
  vMin: "Seviye kurmak için en az 3 kelimelik en az 3 grup gerekir.",
  vNoName: "Adı olmayan bir grup var — öğrenciler «?» görecek.",
  notInGame: "oyuna girmez",
  tryIt: "Seviyeyi dene", del: "Seti sil", delQ: "Bu set silinsin mi?", delYes: "Evet, sil",
  copyJson: "JSON'u kopyala", importJson: "JSON içe aktar", copied: "JSON panoya kopyalandı.",
  copyFallback: "Pano kullanılamıyor — aşağıdaki metni seçip elle kopyalayın.",
  imported: function (n) { return n + " set eklendi. Kaydetmeyi unutmayın."; },
  importBad: "Dosya okunamadı: bu oyundan dışa aktarılmış bir JSON gerekli.",
  save: "Öğrenciler için kaydet", saving: "Kaydediliyor…", saved: "Kaydedildi. Sayfa yeni setlerle yenilenecek.",
  saveNA: "Bu görünümde kaydedilemiyor — değişiklikleri yalnızca siz görüyorsunuz. Kaybetmemek için JSON'u kopyalayın.",
  saveRO: "Bu sayfayı değiştirme yetkiniz yok — setleri yalnızca sayfanın sahibi düzenleyebilir.",
  saveConflict: "Sayfayı sizden önce başka biri kaydetti — sayfa yenilenecek, taslağınız geri yüklenecek.",
  saveRate: "Çok sık kaydediliyor — bir dakika bekleyip yeniden kaydedin.",
  saveBig: "Setler tek sayfa için fazla büyük — bölün ya da bazılarını silin.",
  saveErr: "Kaydedilemedi. Bir dakika sonra yeniden deneyin.",
  restored: "Sayfa yenilendikten sonra taslağınız geri yüklendi — hazır olduğunuzda kaydedin.",
  savedOk: "Setler kaydedildi — öğrenciler aynı bağlantıdan görüyor.",
  needPlayable: "Bu set henüz oynanamıyor — sağdaki kontrole bakın.",
  tabCards: "Kartlar", tabText: "Metin", tabFile: "Dosya", tabAI: "Claude",
  groupName: "Grup adı", addWord: "Kelime ekle", addWordPh: "kelime ya da kelime = çeviri, sonra Enter",
  newGroup: "+ Yeni grup", delGroup: "Grubu sil", delGroupQ: "Silinsin mi?", unnamedGroup: "Adsız grup",
  selWord: function (w) { return "«" + w + "» seçildi"; }, editWord: "Düzenle", delWord: "Sil", moveHere: "Buraya taşı",
  dragHint: "Kelimeleri gruplar arasında sürükleyin ya da düzenlemek, silmek veya taşımak için kelimeye dokunun.",
  needMore: function (n) { return "Grubun oyuna girmesi için " + n + " kelime daha gerekli."; },
  fileTitle: "Tablo yükle", fileDrop: "CSV, Excel (.xlsx) veya JSON dosyası seçin ya da buraya sürükleyin",
  fileHelpH: "Hangi tablolar uygun",
  fileHelp1: "Üç sütun «Grup · Kelime · Çeviri», her satırda bir kelime. Boş grup hücresi «yukarıdaki grupla aynı» demektir.",
  fileHelp2: "Ya da her satırda bir grup: ilk sütunda ad, ardından kelimeler. Tersi de olur — grup adları ilk satırda, kelimeler altında.",
  fileHelp3: "Excel dosyasında her sayfa ayrı bir set olur.",
  templates: "Şablonlar", tplCsv: "CSV şablonu", tplXlsx: "Excel şablonu", tplSheets: "Google Sheets için kopyala",
  exportTitle: "Bu seti dışa aktar", expCsv: "CSV indir", expXlsx: "Excel indir",
  tplCopied: "Şablon kopyalandı — boş bir Google Sheets tablosuna yapıştırın (Ctrl+V).",
  reading: "Dosya okunuyor…", fileEmpty: "Dosyada kelime içeren grup bulunamadı. Şablona göre doldurulduğunu kontrol edin.",
  fileBad: "Dosya okunamadı. CSV, XLSX ve bu oyundan dışa aktarılan JSON desteklenir.",
  xlsxFail: "Excel modülü yüklenemedi. Tabloyu CSV olarak kaydedip onu yükleyin.",
  layoutQ: "Gruplar nerede?", layoutRows: "Satırlarda", layoutCols: "Sütunlarda",
  found: function (s, g, w) { return "Bulunan: " + (s > 1 ? s + " set, " : "") + g + " grup, " + w + " kelime."; },
  asNew: "Yeni set olarak ekle", asNewMany: function (n) { return "Yeni setler olarak ekle (" + n + ")"; },
  appendTo: function (n) { return "«" + n + "» setine ekle"; }, replaceIn: function (n) { return "«" + n + "» setindeki grupları değiştir"; },
  discard: "Vazgeç",
  addedNew: function (n) { return n > 1 ? n + " set eklendi. Kaydetmeyi unutmayın." : "Set eklendi. Kaydetmeyi unutmayın."; },
  addedTo: "Gruplar sete eklendi. Kaydetmeyi unutmayın.", replaced: "Gruplar değiştirildi. Kaydetmeyi unutmayın.",
  dlNA: "Burada indirme yapılamıyor — CSV içeriği panoya kopyalandı.",
  dlNAx: "Burada dosya indirilemiyor. CSV'yi ya da «Google Sheets için kopyala» düğmesini kullanın.",
  dlNo: "İndirme iptal edildi.", dlOk: "Dosya indirilmek üzere gönderildi.",
  aiTopic: "Konu", aiTopicPh: "ör. hava durumu, vücudun bölümleri, Unit 4 — Shopping",
  aiGrade: "Kimler oynayacak", aiGradePh: "ör. Year 3, EAL, başlangıç düzeyi",
  aiGroups: "Grup sayısı", aiWords: "Gruptaki kelime", aiLang: "Kelimelerin dili", aiHint: "Kelime ipucu",
  hintNone: "ipucu yok", hintRu: "Rusça çeviri", hintSr: "Karadağca çeviri", hintFr: "Fransızca çeviri", hintDe: "Almanca çeviri", hintTr: "Türkçe çeviri", hintDef: "kısa tanım",
  aiTraps: "Tuzak kelimeler ekle: başka bir gruba benzer ama cevabı tek",
  aiExtra: "İstekler", aiExtraPh: "ör. yalnızca ders kitabındaki kelimeler, birleşik kelime olmasın",
  aiGo: "Kelime öner", aiAgain: "Başka bir seçenek", aiStop: "Durdur",
  aiThinking: "Claude kelimeleri seçiyor — genellikle 10–40 saniye sürer.",
  aiNA: "Kelime önerisi, sayfa Claude içinde açıkken çalışır. Burada kartları, metni ya da dosyayı kullanın.",
  aiNeedTopic: "Bir konu yazın, Claude gruplar ve kelimeler önersin.",
  aiCost: "İstek, Claude hesabınızın kullanım hakkından düşer. Sonuç önce önizlemeye gelir — eklenip eklenmeyeceğine siz karar verirsiniz.",
  aiErrGrant: "Bu sayfa için Claude erişimine izin verilmedi, bu yüzden kelime önerisi kullanılamıyor.",
  aiErrRate: "Arka arkaya çok fazla istek — bir dakika bekleyin.",
  aiErrJson: "Claude beklenmedik bir biçimde yanıt verdi. Yeniden deneyin ya da istekleri sadeleştirin.",
  aiErrRefused: "Claude bu isteği yanıtlamadı — konuyu farklı ifade edin.",
  aiErrStop: "Durduruldu.", aiErr: "Kelime önerilemedi. Bir dakika sonra yeniden deneyin."
};
Object.assign(I18N.ru, {
  kindQ: "Игра", kindGroups: "Группы", kindOdd: "Найди лишнее", kindPairs: "Слово ↔ перевод",
  pairsN: function (n) { return n + " " + plural(n, "пара", "пары", "пар"); }, statsOdd: function (m) { return "Ошибок: " + m; },
  noHints: "В этом наборе меньше 4 слов с переводом, поэтому «Слово ↔ перевод» недоступно.",
  modeCalm: "Без ограничений", round: "раунд",
  lvlHelpOdd: "В каждом раунде одно слово лишнее — найди его. «4+1» — четыре слова из одной группы и одно чужое.",
  lvlHelpPairs: "Соедини каждое слово с его переводом. Слова — в обычных пузырях, переводы — в розовых.",
  srRound: function (n, k) { return "Раунд " + n + " из " + k + ". Найди лишнее слово."; },
  srOddRight: function (w, g) { return "Верно! «" + w + "» — лишнее. Остальные: " + g + "."; },
  srOddWrong: "Это слово из группы. Ищи другое.",
  mixupsBack: "Эти слова чаще попадутся в следующих уровнях.",
  printT: "Печать", printLang: "Язык заданий", printHints: "Переводы на карточках",
  printCards: "Карточки для сортировки", printSheet: "Рабочий лист",
  printHelp: "Скачается HTML-файл. Откройте его в браузере и нажмите «Печать» (Ctrl+P) — на принтер или «Сохранить как PDF». Ответы — на последней странице листа."
});
Object.assign(I18N.en, {
  kindQ: "Game", kindGroups: "Groups", kindOdd: "Odd one out", kindPairs: "Word ↔ translation",
  pairsN: function (n) { return n + " pairs"; }, statsOdd: function (m) { return "Mistakes: " + m; },
  noHints: "This set has fewer than 4 words with translations, so “Word ↔ translation” is off.",
  modeCalm: "No limit", round: "round",
  lvlHelpOdd: "In each round one word doesn't belong — find it. “4+1” means four words from one group and one intruder.",
  lvlHelpPairs: "Match each word with its translation. Words are in plain bubbles, translations in pink ones.",
  srRound: function (n, k) { return "Round " + n + " of " + k + ". Find the odd one out."; },
  srOddRight: function (w, g) { return "Right! “" + w + "” is the odd one out. The rest are " + g + "."; },
  srOddWrong: "That one belongs. Try another.",
  mixupsBack: "These words will come up more often in the next levels.",
  printT: "Print", printLang: "Task language", printHints: "Translations on cards",
  printCards: "Sorting cards", printSheet: "Worksheet",
  printHelp: "An HTML file downloads. Open it in a browser and press Print (Ctrl+P) — to a printer or “Save as PDF”. Answers are on the worksheet's last page."
});
Object.assign(I18N.tr, {
  kindQ: "Oyun", kindGroups: "Gruplar", kindOdd: "Farklı olanı bul", kindPairs: "Kelime ↔ çeviri",
  pairsN: function (n) { return n + " çift"; }, statsOdd: function (m) { return "Hata: " + m; },
  noHints: "Bu sette çevirisi olan 4'ten az kelime var, bu yüzden «Kelime ↔ çeviri» kapalı.",
  modeCalm: "Sınırsız", round: "tur",
  lvlHelpOdd: "Her turda bir kelime gruba ait değil — onu bul. «4+1», bir gruptan dört kelime ve bir yabancı demek.",
  lvlHelpPairs: "Her kelimeyi çevirisiyle eşleştir. Kelimeler düz baloncuklarda, çeviriler pembe olanlarda.",
  srRound: function (n, k) { return "Tur " + n + "/" + k + ". Farklı olanı bul."; },
  srOddRight: function (w, g) { return "Doğru! «" + w + "» farklı. Diğerleri: " + g + "."; },
  srOddWrong: "Bu kelime gruba ait. Başka birini dene.",
  mixupsBack: "Bu kelimeler sonraki seviyelerde daha sık çıkacak.",
  printT: "Yazdır", printLang: "Görev dili", printHints: "Kartlarda çeviri",
  printCards: "Sınıflandırma kartları", printSheet: "Çalışma kâğıdı",
  printHelp: "Bir HTML dosyası iner. Tarayıcıda açıp Yazdır'a (Ctrl+P) basın — yazıcıya ya da «PDF olarak kaydet». Cevaplar çalışma kâğıdının son sayfasında."
});
Object.assign(I18N.ru, { haveCode: "Есть код класса?", codePh: "Например K7QX4M", go: "Войти",
  continueAs: function (c, n) { return "Продолжить: " + c + " · " + n; }, demoSets: "Примеры наборов", classK: "Класс",
  joinAsk: "Как тебя зовут? Напиши имя — так учитель увидит твои успехи.", namePh: "Имя", joinBtn: "Войти в класс",
  notFoundT: "Класс не найден", notFoundP: "Проверь код или спроси у учителя новый. Возможно, класс закрыт.",
  netErrT: "Нет связи", netErr: "Не получилось связаться с сервером. Проверь интернет и попробуй снова.",
  toMain: "← На главную", hiName: function (n) { return "Привет, " + n + "! Выбери набор"; }, notMe: "Это не я",
  leaveClass: "Выйти из класса", noClassSets: "Учитель ещё не добавил наборы в этот класс.", badName: "Напиши имя — до 40 букв.",
  loadingK: "Загружаю…", howToPlay: "Как играть" });
Object.assign(I18N.en, { haveCode: "Got a class code?", codePh: "e.g. K7QX4M", go: "Join",
  continueAs: function (c, n) { return "Continue: " + c + " · " + n; }, demoSets: "Example sets", classK: "Class",
  joinAsk: "What's your name? Type it so your teacher can see how you're doing.", namePh: "First name", joinBtn: "Join the class",
  notFoundT: "Class not found", notFoundP: "Check the code or ask your teacher for a new one. The class may be closed.",
  netErrT: "No connection", netErr: "Couldn't reach the server. Check the internet and try again.",
  toMain: "← Home", hiName: function (n) { return "Hi, " + n + "! Pick a word set"; }, notMe: "That's not me",
  leaveClass: "Leave class", noClassSets: "Your teacher hasn't added word sets to this class yet.", badName: "Type your name — up to 40 letters.",
  loadingK: "Loading…", howToPlay: "How to play" });
Object.assign(I18N.tr, { haveCode: "Sınıf kodun var mı?", codePh: "ör. K7QX4M", go: "Katıl",
  continueAs: function (c, n) { return "Devam et: " + c + " · " + n; }, demoSets: "Örnek setler", classK: "Sınıf",
  joinAsk: "Adın ne? Yaz ki öğretmenin ilerlemeni görebilsin.", namePh: "Adın", joinBtn: "Sınıfa katıl",
  notFoundT: "Sınıf bulunamadı", notFoundP: "Kodu kontrol et ya da öğretmeninden yenisini iste. Sınıf kapanmış olabilir.",
  netErrT: "Bağlantı yok", netErr: "Sunucuya ulaşılamadı. İnterneti kontrol edip tekrar dene.",
  toMain: "← Ana sayfa", hiName: function (n) { return "Merhaba " + n + "! Bir set seç"; }, notMe: "Bu ben değilim",
  leaveClass: "Sınıftan çık", noClassSets: "Öğretmenin bu sınıfa henüz set eklemedi.", badName: "Adını yaz — en fazla 40 harf.",
  loadingK: "Yükleniyor…", howToPlay: "Nasıl oynanır" });
I18N.ru.delUsed = function (c) { return "Этот набор используется в классах: " + c + ". После сохранения он исчезнет у их учеников вместе с прогрессом по нему. Удалить?"; };
I18N.en.delUsed = function (c) { return "This set is used in classes: " + c + ". After saving, it disappears for those pupils together with their progress on it. Delete?"; };
I18N.tr.delUsed = function (c) { return "Bu set şu sınıflarda kullanılıyor: " + c + ". Kaydettikten sonra bu öğrencilerden, üzerindeki ilerlemeleriyle birlikte kaybolur. Silinsin mi?"; };
Object.assign(I18N.ru, { gMoveCopy: "Копировать или переместить группу в другой набор", gToSet: "В набор", gCopy: "Копировать", gMove: "Переместить",
  gCopied: function (g, x) { return "Группа «" + g + "» скопирована в «" + x + "». Не забудьте сохранить."; }, gMoved: function (g, x) { return "Группа «" + g + "» перемещена в «" + x + "». Не забудьте сохранить."; } });
Object.assign(I18N.en, { gMoveCopy: "Copy or move this group to another set", gToSet: "To set", gCopy: "Copy", gMove: "Move",
  gCopied: function (g, x) { return "“" + g + "” copied to “" + x + "”. Remember to save."; }, gMoved: function (g, x) { return "“" + g + "” moved to “" + x + "”. Remember to save."; } });
Object.assign(I18N.tr, { gMoveCopy: "Bu grubu başka bir sete kopyala veya taşı", gToSet: "Hedef set", gCopy: "Kopyala", gMove: "Taşı",
  gCopied: function (g, x) { return "«" + g + "» grubu «" + x + "» setine kopyalandı. Kaydetmeyi unutmayın."; }, gMoved: function (g, x) { return "«" + g + "» grubu «" + x + "» setine taşındı. Kaydetmeyi unutmayın."; } });
I18N.ru.offlineNote = "Нет интернета. Играть можно: результаты сохранятся на сервере, когда связь вернётся.";
I18N.en.offlineNote = "No internet. You can still play: results will be saved when the connection is back.";
I18N.tr.offlineNote = "İnternet yok. Yine de oynayabilirsin: sonuçlar bağlantı gelince kaydedilecek.";
Object.assign(I18N.ru, { picBtn: "Картинка", picNone: "нет картинки", picUpload: "Загрузить картинку", picUploading: "Загружаю…", picUploaded: "Картинка загружена. Не забудьте сохранить.",
  picUploadErr: "Не удалось загрузить картинку (до 2 МБ: PNG, JPG, WebP, GIF).", picUrlPh: "ссылка на картинку или эмодзи 🍎", picApply: "Применить",
  picWithWord: "Показывать слово вместе с картинкой", picHelp: "Без галочки в пузыре будет только картинка. Слово всё равно нужно: его видит учитель в статистике и в ответах к печати.",
  picRemove: "Убрать картинку", picDone: "Готово", picTextNote: "Картинки добавляются во вкладке «Карточки» и при правке текста сохраняются." });
Object.assign(I18N.en, { picBtn: "Picture", picNone: "no picture", picUpload: "Upload a picture", picUploading: "Uploading…", picUploaded: "Picture uploaded. Remember to save.",
  picUploadErr: "Couldn't upload the picture (up to 2 MB: PNG, JPG, WebP, GIF).", picUrlPh: "picture link or an emoji 🍎", picApply: "Apply",
  picWithWord: "Show the word together with the picture", picHelp: "Unticked, the bubble shows only the picture. The word is still needed: the teacher sees it in statistics and printed answers.",
  picRemove: "Remove picture", picDone: "Done", picTextNote: "Pictures are added in the Cards tab and are kept when you edit the text." });
Object.assign(I18N.tr, { picBtn: "Resim", picNone: "resim yok", picUpload: "Resim yükle", picUploading: "Yükleniyor…", picUploaded: "Resim yüklendi. Kaydetmeyi unutmayın.",
  picUploadErr: "Resim yüklenemedi (en fazla 2 MB: PNG, JPG, WebP, GIF).", picUrlPh: "resim bağlantısı ya da emoji 🍎", picApply: "Uygula",
  picWithWord: "Kelimeyi resimle birlikte göster", picHelp: "İşaretsizse baloncukta yalnızca resim olur. Kelime yine de gerekli: öğretmen onu istatistikte ve basılı cevaplarda görür.",
  picRemove: "Resmi kaldır", picDone: "Tamam", picTextNote: "Resimler «Kartlar» sekmesinden eklenir ve metin düzenlenince korunur." });
I18N.ru.saveDb = "Сохранить"; I18N.en.saveDb = "Save"; I18N.tr.saveDb = "Kaydet";
I18N.ru.savedDb = "Сохранено в вашей библиотеке."; I18N.en.savedDb = "Saved to your library."; I18N.tr.savedDb = "Kitaplığınıza kaydedildi.";
I18N.ru.saveDbErr = "Не удалось сохранить. Проверьте интернет и попробуйте снова."; I18N.en.saveDbErr = "Couldn't save. Check your connection and try again."; I18N.tr.saveDbErr = "Kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.";
I18N.ru.dbHint = "Наборы видите только вы. Ученики получат их через классы."; I18N.en.dbHint = "Only you can see these sets. Pupils get them through classes."; I18N.tr.dbHint = "Bu setleri yalnızca siz görürsünüz. Öğrenciler onlara sınıflar üzerinden ulaşır.";
I18N.ru.teacherLogin = "Вход для учителей →"; I18N.en.teacherLogin = "Teacher sign-in →"; I18N.tr.teacherLogin = "Öğretmen girişi →";
I18N.ru.teacherEntry = "Я учитель — открыть мастерскую наборов";
I18N.en.teacherEntry = "I'm a teacher — open the word-set workshop";
I18N.tr.teacherEntry = "Öğretmenim — kelime seti atölyesini aç";
I18N.ru.notEditor = "Сохранять могут только редакторы этой страницы. Если вам дали доступ, войдите в Claude тем же аккаунтом и откройте страницу из Claude. Иначе соберите набор здесь и нажмите «Скопировать JSON» — отправьте текст владельцу.";
I18N.en.notEditor = "Only editors of this page can save. If you were given access, sign in to Claude with that account and open the page from Claude. Otherwise build the set here, press “Copy JSON” and send the text to the owner.";
I18N.tr.notEditor = "Yalnızca bu sayfanın editörleri kaydedebilir. Size erişim verildiyse aynı hesapla Claude'a giriş yapın ve sayfayı Claude üzerinden açın. Aksi hâlde seti burada hazırlayın, «JSON'u kopyala»ya basın ve metni sayfa sahibine gönderin.";
I18N.ru.langLabel = "Язык"; I18N.en.langLabel = "Language";
I18N.ru.hintTr = "перевод на турецкий"; I18N.en.hintTr = "Turkish translation";
I18N.me = GAME_ME;
var UI_LANGS = [["ru", "RU", "Русский"], ["en", "EN", "English"], ["tr", "TR", "Türkçe"], ["me", "CG", "Crnogorski"]];
var lang = (function () {
  var st = lsGet("bs.lang"); if (st === "ru" || st === "en" || st === "tr" || st === "me") return st;
  var nav = String((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
  return nav.indexOf("tr") === 0 ? "tr" : nav.indexOf("en") === 0 ? "en" : /^(sr|cnr|bs|hr|sh)\b/.test(nav) ? "me" : "ru";
})();
function t(k) { var v = I18N[lang][k]; if (v === undefined) v = I18N.en[k]; if (v === undefined) v = I18N.ru[k]; if (typeof v === "function") return v.apply(null, Array.prototype.slice.call(arguments, 1)); return v; }

/* ─────────────── word-set parsing & validation ─────────────── */
function parseSetText(text) {
  var cats = [];
  String(text || "").split(/\r?\n/).forEach(function (raw) {
    var line = raw.trim(), name, items;
    if (!line || line.charAt(0) === "#") return;
    if (line.indexOf("\t") >= 0) {
      var parts = line.split("\t").map(function (s) { return s.trim(); }).filter(Boolean);
      name = parts.shift(); items = parts;
    } else {
      var i = line.indexOf(":");
      if (i < 0) { cats.push({ name: line, words: [], bad: true }); return; }
      name = line.slice(0, i).trim();
      items = line.slice(i + 1).split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    var words = items.map(function (it) {
      var j = it.indexOf("=");
      return j < 0 ? { w: it, h: "" } : { w: it.slice(0, j).trim(), h: it.slice(j + 1).trim() };
    }).filter(function (x) { return x.w; });
    cats.push({ name: name || "?", words: words });
  });
  return cats;
}
function setToText(set) {
  return (set.cats || []).map(function (c) {
    return c.name + ": " + c.words.map(function (x) { return x.h ? x.w + " = " + x.h : x.w; }).join(", ");
  }).join("\n");
}
function validate(cats) {
  var issues = [], seen = {};
  cats.forEach(function (c) {
    if (c.bad) { issues.push({ lv: "error", text: t("vNoColon", c.name) }); return; }
    if (!c.name || !c.name.trim()) issues.push({ lv: "warn", text: t("vNoName") });
    if (c.words.length < 3) issues.push({ lv: "error", text: t("vFew", (c.name || "").trim() || t("unnamedGroup"), c.words.length) });
    c.words.forEach(function (x) {
      var k = x.w.toLowerCase();
      var nm = (c.name || "").trim() || t("unnamedGroup");
      if (seen[k] && seen[k] !== nm) issues.push({ lv: "warn", text: t("vDup", x.w, seen[k], nm) });
      else seen[k] = nm;
      if (x.w.length > 16) issues.push({ lv: "warn", text: t("vLong", x.w) });
    });
  });
  var ok = cats.filter(function (c) { return !c.bad && c.words.length >= 3; }).length;
  if (ok < 3) issues.unshift({ lv: "error", text: t("vMin") });
  return { issues: issues, playable: ok >= 3 };
}
function playableCats(set) { return (set.cats || []).filter(function (c) { return c.words.length >= 3; }); }
function wordCount(set) { return (set.cats || []).reduce(function (s, c) { return s + c.words.length; }, 0); }

/* ─────────────── level generator ─────────────── */
/* Words a pupil mixed up are remembered per set on this device (bs.miss.<id>)
   and are pulled into the next levels first until they are sorted without a slip. */
function missOf(set) { try { return JSON.parse(lsGet("bs.miss." + set.id) || "{}") || {}; } catch (e) { return {}; } }
function saveMiss(set, m) { lsSet("bs.miss." + set.id, JSON.stringify(m)); }
function missScore(miss, w) { return miss[String(w).toLowerCase()] || 0; }
// missed words first (most missed first, ties random), then the rest shuffled
function orderWords(words, miss) {
  return shuffle(words.slice()).map(function (x, i) { return { x: x, s: missScore(miss, x.w), i: i }; })
    .sort(function (a, b) { return (b.s > 0 ? 1 : 0) - (a.s > 0 ? 1 : 0) || b.s - a.s || a.i - b.i; })
    .map(function (o) { return o.x; });
}
// categories holding missed words come first, the rest random
function orderCats(cats, miss) {
  return cats.map(function (c) {
    var s = c.words.reduce(function (t, x) { return t + missScore(miss, x.w); }, 0);
    return { c: c, k: (s > 0 ? 100 + s : 0) + Math.random() * 3 };
  }).sort(function (a, b) { return b.k - a.k; }).map(function (o) { return o.c; });
}
function hintedWords(set) {
  var seen = {}, out = [];
  (set.cats || []).forEach(function (c) { c.words.forEach(function (x) { var k = x.w.toLowerCase(); if (x.h && !seen[k]) { seen[k] = 1; out.push(x); } }); });
  return out;
}
function slackFor(L) { return Math.max(2, 5 - Math.floor((L - 1) / 2)); }

function makeLevel(set, L) {
  var valid = playableCats(set), shape = levelShape(set, L), miss = missOf(set);
  var nCats = shape.c, k = shape.k;
  var used = {}, groups = [];
  orderCats(valid, miss).forEach(function (cat) {
    if (groups.length >= nCats) return;
    var seenHere = {}, avail = [];
    orderWords(cat.words, miss).forEach(function (x) {
      var key = x.w.toLowerCase();
      if (used[key] || seenHere[key]) return;
      seenHere[key] = 1; avail.push(x);
    });
    if (avail.length < 3) return;
    var pick = avail.slice(0, Math.min(k, avail.length));
    pick.forEach(function (x) { used[x.w.toLowerCase()] = 1; });
    groups.push({ name: cat.name, words: pick });
  });
  var colors = shuffle(CAT_COLORS.slice());
  groups.forEach(function (g, i) { g.color = colors[i % colors.length]; });
  var merges = groups.reduce(function (s, g) { return s + g.words.length - 1; }, 0);
  var total = groups.reduce(function (s, g) { return s + g.words.length; }, 0);
  return { groups: groups, moves: merges + slackFor(L), seconds: total * 6 + 10 };
}
function levelShape(set, L) {
  return { c: Math.min(3 + Math.floor((L - 1) / 2), 5, playableCats(set).length), k: Math.min(3 + Math.floor((L - 1) / 3), 6) };
}

/* "Word ↔ translation": every pair is a tiny group of two bubbles (word + its hint) */
function pairsShape(set, L) { return { n: Math.min(3 + L, 10, hintedWords(set).length) }; }
function makePairs(set, L) {
  var miss = missOf(set), n = pairsShape(set, L).n, colors = shuffle(CAT_COLORS.slice()), seenH = {};
  var picks = orderWords(hintedWords(set), miss).filter(function (x) { var k = x.h.toLowerCase(); if (seenH[k]) return false; seenH[k] = 1; return true; }).slice(0, n);
  var groups = picks.map(function (x, i) {
    var word = { w: x.w, h: x.h }; if (x.img) { word.img = x.img; if (x.txt === false) word.txt = false; }
    return { name: x.w, words: [word, { w: x.h, h: x.w, alt: true }], color: colors[i % colors.length] };
  });
  return { groups: groups, moves: groups.length + slackFor(L), seconds: groups.length * 8 + 10 };
}

/* "Odd one out": rounds of k words from one group plus one intruder from another */
function oddShape(set, L) {
  var maxK = playableCats(set).reduce(function (m, c) { return Math.max(m, c.words.length); }, 3);
  return { k: Math.min(L <= 3 ? 3 : L <= 6 ? 4 : 5, maxK), rounds: L <= 3 ? 6 : 8 };
}
function makeOdd(set, L) {
  var sh = oddShape(set, L), miss = missOf(set), cats = playableCats(set), rounds = [], prev = null, tries = 0;
  for (var r = 0; r < sh.rounds && tries < 80; r++, tries++) {
    var order = orderCats(cats, miss).filter(function (c) { return c !== prev && c.words.length >= Math.min(sh.k, 3); });
    // mix missed-first order with some randomness so rounds vary
    var main = order[r % 3 === 2 ? rand(order.length) : 0] || cats[0];
    var k = Math.min(sh.k, main.words.length);
    var words = orderWords(main.words, miss);
    if (r % 2) words = shuffle(words.slice(0, Math.min(words.length, k + 2)));
    words = words.slice(0, k);
    var inMain = {}; main.words.forEach(function (x) { inMain[x.w.toLowerCase()] = 1; });
    var others = cats.filter(function (c) { return c !== main; });
    var intrCat = others[rand(others.length)];
    var cand = orderWords(intrCat.words, miss).filter(function (x) { return !inMain[x.w.toLowerCase()]; });
    if (!cand.length) { r--; prev = main; continue; }
    var intr = r % 2 ? cand[rand(Math.min(cand.length, 3))] : cand[0];
    var c2 = shuffle(CAT_COLORS.slice());
    rounds.push({ main: { name: main.name, words: words, color: c2[0] }, intr: { name: intrCat.name, words: [intr], color: c2[1] } });
    prev = main;
  }
  return { rounds: rounds, seconds: rounds.length * (sh.k + 1) * 3 + 10 };
}

/* ─────────────── app shell ─────────────── */
var LENS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 20 20"/><path d="M7.5 8.2a3 3 0 0 1 2.2-1.6" stroke-width="1.6"/></svg>';
var MAGNET_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4v8a7 7 0 0 0 14 0V4"/><path d="M5 8h4M15 8h4"/><path d="M9 4v8a3 3 0 0 0 6 0V4"/></svg>';

$("#app").innerHTML =
  '<header class="bar">' +
    '<button class="brand" id="homeBtn" type="button"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>Bubble Sort</button>' +
    '<div class="hud" id="hud" hidden>' +
      '<div class="hud-set"><b id="hudSet"></b><span id="hudLevel"></span></div>' +
      '<div class="moves" id="movesBox"><span class="moves-n" id="movesN">0</span><span class="moves-l" data-i18n="moves"></span></div>' +
    '</div>' +
    '<div class="tools">' +
      '<button class="chipbtn" id="soundBtn" type="button" aria-pressed="false" data-i18n="sound"></button>' +
      '<label class="chipbtn langpick"><span class="sr-only" data-i18n="langLabel"></span><select id="langSel">' + UI_LANGS.map(function (l) { return '<option value="' + l[0] + '" lang="' + l[0] + '" title="' + l[2] + '">' + l[1] + "</option>"; }).join("") + "</select></label>" +
      '<button class="chipbtn" id="teacherBtn" type="button" hidden><span class="dot" id="teacherDot" hidden></span><span data-i18n="teacher"></span></button>' +
    '</div>' +
  '</header>' +
  '<main class="stage" id="stage">' +
    '<div class="screen" id="home"></div>' +
    '<div class="screen" id="levels" hidden></div>' +
    '<div class="screen" id="result" hidden></div>' +
    '<div class="note" id="note" hidden><span data-i18n="lensNote"></span><button type="button" id="noteCancel" data-i18n="cancel"></button></div>' +
    '<div id="sr" class="sr-only" aria-live="polite"></div>' +
  '</main>' +
  '<footer class="tray" id="tray" hidden>' +
    '<button class="boost" id="lensBtn" type="button" aria-pressed="false">' + LENS_SVG + '<span data-i18n="lens"></span><b id="lensN">0</b></button>' +
    '<button class="boost" id="magnetBtn" type="button">' + MAGNET_SVG + '<span data-i18n="magnet"></span><b id="magnetN">0</b></button>' +
    '<div class="sorted"><span class="sorted-l" data-i18n="sorted"></span><div class="chips" id="chips"></div></div>' +
  '</footer>' +
  '<div class="sheet-wrap" id="teacher" hidden><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="wsTitle"></div></div>';

function applyStatic() {
  document.documentElement.lang = lang === "me" ? "cnr" : lang;
  $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.dataset.i18n); });
}

/* ─────────────── theme (read from CSS tokens) ─────────────── */
var theme = {};
function hexOf(name, fb) {
  var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? parseInt(v.slice(1), 16) : fb;
}
function numOf(name, fb) { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)); return isNaN(v) ? fb : v; }
function readTheme() {
  theme = {
    ink: hexOf("--ink", 0x15304a), soft: hexOf("--ink-soft", 0x4e6577),
    bubble: hexOf("--bubble", 0xffffff), bubbleA: numOf("--bubble-a", 0.6),
    merged: hexOf("--merged", 0xfff4da), mergedA: numOf("--merged-a", 0.85),
    rim: hexOf("--rim", 0x79bfd0), rim2: hexOf("--rim2", 0xee93ba),
    accent: hexOf("--accent", 0xf2a516), bad: hexOf("--bad", 0xc93a33), hiA: numOf("--hi-a", 0.8)
  };
}
function hexNum(h) { return parseInt(h.slice(1), 16); }

/* ─────────────── sound & speech ─────────────── */
var soundOn = lsGet("bs.sound") === "1";
var actx = null;
function tone(f1, f2, dur, type, vol) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    var now = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f1, now);
    o.frequency.exponentialRampToValueAtTime(f2, now + dur * 0.7);
    g.gain.setValueAtTime(vol || 0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(now); o.stop(now + dur + 0.02);
  } catch (e) {}
}
/* Voice: female British English. Browsers only offer the voices installed on the device,
   so we rank them: a known female en-GB voice first, then any female English voice,
   and if the device has only a male/unnamed en-GB voice we raise its pitch. */
var FEMALE_PREF = ["google uk english female", "sonia", "libby", "maisie", "abbie", "bella", "hollie", "olivia", "mia", "hazel", "susan",
  "serena", "kate", "stephanie", "martha", "flo", "sandy", "shelley", "fiona", "moira", "karen", "tessa", "samantha", "victoria", "zira", "aria", "jenny",
  "gb-x-gba", "gb-x-gbc", "gb-x-gbg", "female", "woman"];
var MALE_RE = /(\bmale\b|daniel|arthur|george|ryan|oliver|thomas|james|david|mark\b|\bguy\b|rishi|\bfred\b|\balex\b|jamie|\blee\b|reed|eddy|rocko|grandpa|gb-x-gbb|gb-x-gbd|gb-x-rjs)/i;
var voiceList = [];
function refreshVoices() { try { voiceList = window.speechSynthesis.getVoices() || []; } catch (e) { voiceList = []; } return voiceList; }
try {
  if (window.speechSynthesis) {
    refreshVoices();
    if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    else window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
} catch (e) {}
function speechLang() { var l = (G && G.set && G.set.lang) || "en-GB"; return /^en/i.test(l) ? "en-GB" : l; }
function voiceRank(v) {
  var n = (String(v.name || "") + " " + String(v.voiceURI || "")).toLowerCase();
  for (var i = 0; i < FEMALE_PREF.length; i++) if (n.indexOf(FEMALE_PREF[i]) >= 0) return i;
  return MALE_RE.test(n.replace(/female/g, "")) ? 999 : 100;
}
function pickVoice(tag) {
  var vs = voiceList.length ? voiceList : refreshVoices();
  var norm = function (v) { return String(v.lang || "").replace(/_/g, "-").toLowerCase(); };
  var want = tag.toLowerCase(), pre = want.slice(0, 2);
  var exact = vs.filter(function (v) { return norm(v) === want; });
  var family = vs.filter(function (v) { return norm(v).slice(0, 2) === pre; });
  var byRank = function (list) { return list.slice().sort(function (a, b) { return voiceRank(a) - voiceRank(b) || (b.localService ? 1 : 0) - (a.localService ? 1 : 0); }); };
  var ex = byRank(exact), fam = byRank(family);
  if (ex.length && voiceRank(ex[0]) < 100) return { v: ex[0], female: true };            // female voice in the exact accent
  if (fam.length && voiceRank(fam[0]) < 100) return { v: fam[0], female: true };         // female voice, same language
  if (ex.length) return { v: ex[0], female: false };                                      // only male/unknown: pitch it up
  if (fam.length) return { v: fam[0], female: false };
  return { v: null, female: false };
}
function speakNow(text) {
  var ss = window.speechSynthesis;
  ss.cancel();
  var tag = speechLang(), pick = pickVoice(tag), u = new SpeechSynthesisUtterance(text);
  u.lang = pick.v ? pick.v.lang.replace(/_/g, "-") : tag; if (pick.v) u.voice = pick.v;
  u.rate = 0.9; u.pitch = pick.female ? 1.05 : 1.35;
  ss.speak(u);
}
var SPEECH_ON = false; // word voice-over switched off for now; set true to bring it back
function speak(text, force) {
  if (!SPEECH_ON) return;
  if (!force && !soundOn) return;
  try {
    if (!window.speechSynthesis) return;
    if (voiceList.length || refreshVoices().length) { speakNow(text); return; }
    var done = false, go = function () { if (done) return; done = true; refreshVoices(); try { speakNow(text); } catch (e) {} };
    try { window.speechSynthesis.addEventListener("voiceschanged", go, { once: true }); } catch (e) {}
    setTimeout(go, 700);
  } catch (e) {}
}

/* ─────────────── Pixi playfield ─────────────── */
var app = null, world = null, fx = null, ready = false;
var G = null;          // current game state
var tweens = [], particles = [], clock = 0;

function tween(dur, upd, done) { tweens.push({ t: 0, dur: dur, upd: upd, done: done }); }
function easeOut(p) { return 1 - Math.pow(1 - p, 3); }

function loadScript(src) {
  return new Promise(function (res) {
    var s = document.createElement("script"); s.src = src;
    s.onload = function () { res(true); }; s.onerror = function () { res(false); };
    document.head.appendChild(s);
    setTimeout(function () { res(false); }, 8000);
  });
}
async function initPixi() {

  var opts = { resizeTo: $("#stage"), backgroundAlpha: 0, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true };
  var lastErr = null;
  var prefs = ["webgl", "webgpu"];
  for (var i = 0; i < prefs.length && !app; i++) {
    try {
      var a = new PIXI.Application();
      await a.init(Object.assign({ preference: prefs[i] }, opts));
      app = a;
    } catch (e) { lastErr = e; }
  }
  if (!app) { showEngineError((lastErr && lastErr.message) || "renderer init failed"); return; }
  try {
    $("#stage").prepend(app.canvas);
    app.canvas.tabIndex = 0; app.canvas.setAttribute("role", "application");
    app.canvas.setAttribute("aria-label", t("canvasLabel"));
    app.canvas.addEventListener("keydown", onBoardKey);
    app.canvas.addEventListener("blur", function () { if (G && G.kbd) { G.kbd = false; if (G.focus && !G.focus.dead) drawBubble(G.focus); } });
    world = new PIXI.Container(); fx = new PIXI.Container();
    app.stage.addChild(world); app.stage.addChild(fx);
    app.ticker.add(tick);
    try { new ResizeObserver(function () { if (app) app.resize(); }).observe($("#stage")); } catch (e) {}
    try { await Promise.race([Promise.all([document.fonts.load('700 24px "Nunito"'), document.fonts.load('800 14px "Nunito"')]), sleep(1800)]); } catch (e) {}
    ready = true;
  } catch (e) { showEngineError(e && e.message); }
}
function showEngineError(reason) {
  var h = $("#home"); h.hidden = false;
  h.innerHTML = '<div class="card"><p class="kicker">Bubble Sort</p><p>' + esc(t("engineFail")) + '</p><p class="help">' + esc(reason || "") + "</p></div>";
}

function makeText(size, weight) {
  return new PIXI.Text({ text: "", style: { fontFamily: "Nunito, Segoe UI, sans-serif", fontWeight: String(weight || 800), fontSize: size, fill: theme.ink, align: "center", lineHeight: size * 1.12, wordWrap: false, breakWords: false } });
}
function small() { return stageSize().W < 600; }

/* Pictures: a word item may carry img (an https URL or an emoji) and txt:false for picture-only. */
function isUrl(v) { return /^https?:\/\//i.test(String(v || "")); }
var texCache = {};
function loadTex(url) {
  if (!texCache[url]) texCache[url] = new Promise(function (res) {
    var im = new Image(); im.crossOrigin = "anonymous"; im.decoding = "async";
    im.onload = function () { try { res(PIXI.Texture.from(im)); } catch (e) { res(null); } };
    im.onerror = function () { res(null); };
    im.src = url;
  });
  return texCache[url];
}
function makeEmoji() {
  return new PIXI.Text({ text: "", style: { fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Segoe UI Symbol, sans-serif", fontSize: 40, align: "center" } });
}
function wordLabel(x) { return x.img && !isUrl(x.img) && x.txt === false ? x.img : x.w; }
function newBubble(gi, words, x, y, r0) {
  var node = new PIXI.Container();
  var g = new PIXI.Graphics();
  var pic = new PIXI.Container();
  var txt = makeText(20, 800); txt.anchor.set(0.5);
  var sub = makeText(12, 800); sub.anchor.set(0.5);
  var tag = makeText(11, 800); tag.anchor.set(0.5);
  node.addChild(g); node.addChild(pic); node.addChild(txt); node.addChild(sub); node.addChild(tag);
  node.eventMode = "static"; node.cursor = "pointer";
  var b = { gi: gi, words: words, x: x, y: y, vx: 0, vy: 0, r0: r0, R: r0, r: r0 * 0.2, s: 1, sel: false,
            node: node, g: g, txt: txt, sub: sub, tag: tag, pic: pic, shake: 0, flying: false, dead: false, ph: Math.random() * 6.28, flash: 0 };
  node.on("pointertap", function () { if (G && G.kbd) { G.kbd = false; if (G.focus && !G.focus.dead) drawBubble(G.focus); } onTap(b); });
  world.addChild(node);
  refreshBubble(b);
  return b;
}

function targetRadius(b) { return Math.min(b.r0 * (1 + 0.2 * (b.words.length - 1)), b.r0 * 1.9); }

function drawBubble(b) {
  var g = b.g, R = b.R, merged = b.words.length > 1, revealed = G && G.revealed[b.gi], alt = !merged && b.words[0].alt;
  var rimCol = revealed ? hexNum(G.groups[b.gi].color) : alt ? theme.rim2 : theme.rim;
  g.clear();
  g.circle(0, 0, R).fill({ color: merged ? theme.merged : theme.bubble, alpha: merged ? theme.mergedA : theme.bubbleA });
  if (alt) g.circle(0, 0, R).fill({ color: theme.rim2, alpha: 0.16 });
  g.circle(0, 0, R).stroke({ width: revealed ? 3 : 2, color: rimCol, alpha: 0.95 });
  var rr = R - 4, a0 = 0.25, a1 = 1.35;
  g.moveTo(rr * Math.cos(a0), rr * Math.sin(a0)).arc(0, 0, rr, a0, a1).stroke({ width: 3, color: theme.rim2, alpha: 0.55 });
  if (!b.done) g.ellipse(-R * 0.42, -R * 0.46, R * 0.19, R * 0.1).fill({ color: 0xffffff, alpha: theme.hiA });
  if (b.done) {
    var cc = hexNum(G.groups[b.gi].color);
    g.circle(0, 0, R).fill({ color: cc, alpha: 0.16 });
    g.circle(0, 0, R).stroke({ width: 3.5, color: cc, alpha: 1 });
  }
  if (b.sel) g.circle(0, 0, R + 6).stroke({ width: 4, color: theme.accent, alpha: 1 });
  if (G && G.kbd && G.focus === b) g.circle(0, 0, R + 12).stroke({ width: 2.5, color: theme.ink, alpha: 0.85 });
  if (b.flash > 0) g.circle(0, 0, R + 6).stroke({ width: 4, color: theme.bad, alpha: 1 });
  b.node.hitArea = new PIXI.Circle(0, 0, R + 4);
}

function fitText(txt, maxW, maxH, size, wrap) {
  var minF = small() ? 11 : 9;
  txt.style.wordWrap = !!wrap; if (wrap) txt.style.wordWrapWidth = maxW;
  txt.style.fontSize = size; txt.style.lineHeight = size * 1.12;
  for (var i = 0; i < 6; i++) {
    var w = txt.width, h = txt.height, k = 1;
    if (w > maxW * 1.01) k = Math.min(k, maxW / w);
    if (maxH && h > maxH) k = Math.min(k, maxH / h);
    if (k >= 1 || txt.style.fontSize <= minF) break;
    var s = Math.max(minF, txt.style.fontSize * Math.max(k, 0.85)); txt.style.fontSize = s; txt.style.lineHeight = s * 1.12;
  }
}

function refreshBubble(b) {
  b.R = b.done ? Math.max(targetRadius(b), b.r0 * 1.7) : targetRadius(b);
  var R = b.R, n = b.words.length, revealed = G && G.revealed[b.gi];
  b.txt.style.fill = theme.ink; b.sub.style.fill = theme.soft; b.tag.style.fill = theme.ink;
  if (b.done) {
    b.pic.removeChildren().forEach(function (c) { c.destroy(); });
    var grp = G.groups[b.gi], hints = b.words.some(function (x) { return x.h; });
    if (G.kind === "pairs") { hints = false; }
    b.tag.text = G.kind === "pairs" ? grp.words[0].w : grp.name; b.tag.style.fill = hexNum(grp.color);
    fitText(b.tag, R * 1.45, R * 0.5, Math.round(R * 0.24), true);
    b.tag.y = -R * 0.5;
    b.txt.text = G.kind === "pairs" ? grp.words[1].w : hints ? b.words.map(function (x) { return x.h ? x.w + " · " + x.h : x.w; }).join("\n") : b.words.map(function (x) { return x.w; }).join(", ");
    fitText(b.txt, R * 1.5, R * 0.9, Math.round(R * (G.kind === "pairs" ? 0.26 : 0.17)), !hints);
    b.txt.style.fontWeight = "700";
    b.txt.y = R * 0.18;
    b.sub.text = "";
    drawBubble(b); return;
  }
  b.pic.removeChildren().forEach(function (c) { c.destroy(); });
  var one = n === 1 ? b.words[0] : null;
  if (one && one.img) {
    var withText = one.txt !== false, box = R * (withText ? 1.02 : 1.42), py = withText ? -R * 0.2 : 0;
    if (isUrl(one.img)) {
      loadTex(one.img).then(function (tex) {
        if (!tex || b.dead || !b.node || b.node.destroyed || b.words.length !== 1 || b.pic.children.length) return;
        var sp = new PIXI.Sprite(tex), k = box / Math.min(tex.width, tex.height);
        sp.anchor.set(0.5); sp.scale.set(k); sp.y = py;
        var mask = new PIXI.Graphics().circle(0, py, box * 0.5).fill({ color: 0xffffff });
        b.pic.addChild(mask); b.pic.addChild(sp); sp.mask = mask;
      });
    } else {
      var em = makeEmoji(); em.anchor.set(0.5); em.text = one.img; em.style.fontSize = Math.round(R * (withText ? 0.7 : 1.05)); em.y = py;
      b.pic.addChild(em);
    }
    b.txt.text = withText ? one.w : "";
    if (withText) fitText(b.txt, R * 1.5, R * 0.4, Math.round(R * 0.27), false);
    b.txt.y = R * 0.5;
    b.sub.text = "";
  } else if (n === 1) {
    b.txt.text = b.words[0].w;
    fitText(b.txt, R * 1.62, R * 1.15, Math.round(R * 0.42), /\s/.test(b.words[0].w));
    b.txt.y = revealed ? -R * 0.12 : 0;
    b.sub.text = "";
  } else {
    var list = b.words.map(wordLabel);
    if (list.length > 4) list = list.slice(0, 3).concat(["+" + (list.length - 3)]);
    b.txt.text = list.join("\n");
    fitText(b.txt, R * 1.45, R * 1.05, Math.round(R * 0.27), false);
    b.txt.y = -R * 0.08;
    b.sub.text = n + " / " + G.groups[b.gi].words.length;
    b.sub.style.fontSize = Math.max(11, Math.round(R * 0.17));
    b.sub.y = R * 0.68;
  }
  if (revealed) {
    b.tag.text = G.groups[b.gi].name;
    b.tag.style.fill = hexNum(G.groups[b.gi].color);
    fitText(b.tag, R * 1.5, 0, Math.max(10, Math.round(R * 0.2)));
    b.tag.y = n === 1 ? (one && one.img ? -R * 0.78 : R * 0.42) : -R * 0.74;
  } else b.tag.text = "";
  drawBubble(b);
}

function stageSize() { return { W: app ? app.screen.width : 800, H: app ? app.screen.height : 500 }; }

function clearBoard() {
  if (!G) return;
  G.bubbles.forEach(function (b) { b.node.destroy({ children: true }); });
  G.bubbles = [];
  tweens.length = 0;
  particles.forEach(function (p) { p.g.destroy(); }); particles.length = 0;
  fx.removeChildren().forEach(function (c) { c.destroy({ children: true }); });
}

function buildBoard(groups) {
  var sz = stageSize(), W = sz.W, H = sz.H;
  var items = [];
  groups.forEach(function (g, gi) { g.words.forEach(function (w) { items.push({ gi: gi, w: w }); }); });
  shuffle(items);
  var N = items.length;
  var r0 = W < 600 ? clamp(Math.sqrt((W * H * 0.5) / (N * Math.PI)), 30, 58) : clamp(Math.sqrt((W * H * 0.4) / (N * Math.PI)), 26, 62);
  var placed = [];
  items.forEach(function (it) {
    var best = null, bestD = -1;
    for (var tries = 0; tries < 40; tries++) {
      var x = r0 + 8 + Math.random() * Math.max(1, W - 2 * r0 - 16);
      var y = r0 + 8 + Math.random() * Math.max(1, H - 2 * r0 - 16);
      var dmin = 1e9;
      placed.forEach(function (p) { dmin = Math.min(dmin, Math.hypot(p.x - x, p.y - y)); });
      if (dmin > bestD) { bestD = dmin; best = { x: x, y: y }; }
      if (dmin > r0 * 2.3) break;
    }
    placed.push(best);
    var b = newBubble(it.gi, [it.w], best.x, best.y, r0);
    b.vx = (Math.random() - 0.5) * 0.6; b.vy = (Math.random() - 0.5) * 0.6;
    G.bubbles.push(b);
  });
}

function tick(ticker) {
  var dms = ticker.deltaMS, dt = Math.min(dms / 16.67, 3);
  clock += dms / 1000;
  var sz = stageSize(), W = sz.W, H = sz.H;
  // tweens
  for (var i = tweens.length - 1; i >= 0; i--) {
    var tw = tweens[i]; if (!tw) continue; tw.t += dms; var p = Math.min(1, tw.t / tw.dur);
    tw.upd(p);
    if (p >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
  }
  // particles
  for (var j = particles.length - 1; j >= 0; j--) {
    var pa = particles[j]; pa.life -= dt;
    pa.x += pa.vx * dt; pa.y += pa.vy * dt; pa.vy += 0.06 * dt; pa.vx *= 0.97; pa.vy *= 0.97;
    pa.g.x = pa.x; pa.g.y = pa.y; pa.g.alpha = Math.max(0, pa.life / pa.max);
    if (pa.life <= 0) { pa.g.destroy(); particles.splice(j, 1); }
  }
  if (!G) return;
  if (!G.demo && G.timed && !G.over) {
    G.time = Math.max(0, G.time - dms / 1000);
    var sec = Math.ceil(G.time);
    if (sec !== G.lastSec) { G.lastSec = sec; renderHud(); }
    if (G.time <= 0) { G.over = true; G.timeUp = true; renderHud(); setTimeout(function () { finish(false); }, 500); }
  }
  var bs = G.bubbles, wander = reduceMotion ? 0 : 0.014;
  for (var a = 0; a < bs.length; a++) {
    var b = bs[a]; if (b.flying) continue;
    b.vx += Math.cos(clock * 0.55 + b.ph) * wander * dt;
    b.vy += Math.sin(clock * 0.47 + b.ph * 1.3) * wander * dt;
    b.vx += (W / 2 - b.x) * 0.00004 * dt; b.vy += (H / 2 - b.y) * 0.00004 * dt;
  }
  for (a = 0; a < bs.length; a++) {
    var A = bs[a]; if (A.flying) continue;
    for (var c = a + 1; c < bs.length; c++) {
      var B = bs[c]; if (B.flying) continue;
      var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.01, min = A.r + B.r + 8;
      if (d < min) {
        var nx = dx / d, ny = dy / d, ov = (min - d);
        A.x -= nx * ov * 0.25; A.y -= ny * ov * 0.25; B.x += nx * ov * 0.25; B.y += ny * ov * 0.25;
        var push = ov / min * 0.35 * dt;
        A.vx -= nx * push; A.vy -= ny * push; B.vx += nx * push; B.vy += ny * push;
      }
    }
  }
  var damp = Math.pow(0.94, dt);
  for (a = 0; a < bs.length; a++) {
    b = bs[a];
    if (!b.flying) {
      b.vx *= damp; b.vy *= damp;
      var sp = Math.hypot(b.vx, b.vy); if (sp > 4) { b.vx *= 4 / sp; b.vy *= 4 / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      var pad = 6;
      if (b.x < b.r + pad) { b.x = b.r + pad; b.vx = Math.abs(b.vx) * 0.5; }
      if (b.x > W - b.r - pad) { b.x = Math.max(b.r + pad, W - b.r - pad); b.vx = -Math.abs(b.vx) * 0.5; }
      if (b.y < b.r + pad) { b.y = b.r + pad; b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y > H - b.r - pad) { b.y = Math.max(b.r + pad, H - b.r - pad); b.vy = -Math.abs(b.vy) * 0.5; }
    }
    b.r += (b.R - b.r) * Math.min(1, 0.16 * dt);
    b.s += ((b.sel ? 1.07 : 1) - b.s) * Math.min(1, 0.25 * dt);
    var sx = 0;
    if (b.shake > 0) { b.shake = Math.max(0, b.shake - 0.035 * dt); sx = Math.sin(clock * 60) * 7 * b.shake; }
    if (b.flash > 0) { b.flash -= dt; if (b.flash <= 0) { b.flash = 0; drawBubble(b); } }
    if (!b.flying) { b.node.x = b.x + sx; b.node.y = b.y; b.node.scale.set((b.r / b.R) * b.s); }
  }
}

function burst(x, y, color, n) {
  var col = hexNum(color);
  var ring = new PIXI.Graphics(); ring.x = x; ring.y = y; fx.addChild(ring);
  tween(420, function (p) { ring.clear(); ring.circle(0, 0, 20 + p * 70).stroke({ width: 4 * (1 - p) + 0.5, color: col, alpha: 1 - p }); }, function () { ring.destroy(); });
  if (reduceMotion) return;
  for (var i = 0; i < (n || 16); i++) {
    var g = new PIXI.Graphics(), r = 2.5 + Math.random() * 4;
    g.circle(0, 0, r).fill({ color: i % 3 === 0 ? 0xffffff : col, alpha: 0.95 });
    fx.addChild(g);
    var ang = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 4.5;
    particles.push({ g: g, x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1, life: 38 + Math.random() * 16, max: 54 });
  }
}
function floatText(x, y, s, color) {
  var tx = makeText(20, 800); tx.text = s; tx.style.fill = color; tx.anchor.set(0.5); tx.x = x; tx.y = y; fx.addChild(tx);
  tween(700, function (p) { tx.y = y - 40 * easeOut(p); tx.alpha = 1 - p; }, function () { tx.destroy(); });
}

/* ─────────────── game flow ─────────────── */
function kindSuffix(kind) { return kind && kind !== "groups" ? "." + kind : ""; }
function levelKey(set, kind) { return "bs.lv." + set.id + kindSuffix(kind); }
function savedLevel(set, kind) { var v = parseInt(lsGet(levelKey(set, kind)), 10); return v > 0 ? v : 1; }
function getMode(set) { return lsGet("bs.mode." + set.id) === "time" ? "time" : "moves"; }
function canPairs(set) { return hintedWords(set).length >= 4; }
function getKind(set) { var k = lsGet("bs.kind." + set.id); return k === "odd" || (k === "pairs" && canPairs(set)) ? k : "groups"; }
function starsOf(set, kind) { try { return JSON.parse(lsGet("bs.stars." + set.id + kindSuffix(kind)) || "{}") || {}; } catch (e) { return {}; } }
function saveStars(set, kind, L, n) { var st = starsOf(set, kind); if (!(st[L] >= n)) { st[L] = n; lsSet("bs.stars." + set.id + kindSuffix(kind), JSON.stringify(st)); } }
function kindName(kind) { return kind === "odd" ? t("kindOdd") : kind === "pairs" ? t("kindPairs") : t("kindGroups"); }
function levelCaption(set, kind, L) {
  if (kind === "odd") return oddShape(set, L).k + "+1";
  if (kind === "pairs") return t("pairsN", pairsShape(set, L).n);
  var sh = levelShape(set, L); return sh.c + "×" + sh.k;
}
function missWordOf(b) { if (!b || b.words.length !== 1) return null; var x = b.words[0]; return x.alt ? x.h : x.w; }
function noteMiss(words) {
  if (!G || G.draft) return;
  var m = missOf(G.set); G.missedNow = G.missedNow || {};
  words.forEach(function (w) { if (!w) return; var k = String(w).toLowerCase(); m[k] = Math.min(5, (m[k] || 0) + 1); G.missedNow[k] = 1; });
  saveMiss(G.set, m);
}
function relieveMiss() {
  if (!G || G.draft) return;
  var m = missOf(G.set), ch = false;
  (G.levelWords || []).forEach(function (w) { var k = String(w).toLowerCase(); if (m[k] && !(G.missedNow || {})[k]) { m[k]--; if (m[k] <= 0) delete m[k]; ch = true; } });
  if (ch) saveMiss(G.set, m);
}
function announce(msg) { var el = $("#sr"); if (!el) return; el.textContent = ""; setTimeout(function () { el.textContent = msg; }, 40); }

function startDemo() {
  if (!ready) return;
  var set = SETS.find(function (s) { return playableCats(s).length >= 3; });
  clearBoard();
  if (!set) { G = null; return; }
  var lvl = makeLevel(set, 4);
  G = { demo: true, set: set, groups: lvl.groups, bubbles: [], revealed: {}, done: {}, over: true };
  buildBoard(lvl.groups);
}

function startGame(set, L, opts) {
  if (!ready) return;
  opts = opts || {};
  clearBoard();
  var kind = opts.kind || getKind(set), timed = getMode(set) === "time";
  if (kind === "pairs" && !canPairs(set)) kind = "groups";
  G = { demo: false, draft: !!opts.draft, kind: kind, set: set, L: L, groups: [], bubbles: [], moves: 0,
        timed: timed, time: 60, lastSec: -1, timeUp: false, focus: null, kbd: false, missedNow: {}, levelWords: [],
        mistakes: 0, mixups: [], selected: null, lensArmed: false, lens: L <= 2 ? 2 : 1, magnet: 1, revealed: {}, done: {}, doneCount: 0, popped: 0, over: false };
  $("#home").hidden = true; $("#levels").hidden = true; $("#result").hidden = true; $("#note").hidden = true;
  $("#hud").hidden = false; $("#tray").hidden = false;
  $("#lensBtn").hidden = kind === "pairs"; $("#magnetBtn").hidden = kind === "odd";
  if (app) app.resize();
  if (kind === "odd") {
    var od = makeOdd(set, L);
    if (od.rounds.length) {
      G.rounds = od.rounds; G.round = 0; G.time = od.seconds; G.oddLog = []; G.magnet = 0;
      od.rounds.forEach(function (r) { r.main.words.concat(r.intr.words).forEach(function (x) { G.levelWords.push(x.w); }); });
      startOddRound(); return;
    }
    G.kind = kind = "groups"; $("#magnetBtn").hidden = false;
  }
  var lvl = kind === "pairs" ? makePairs(set, L) : makeLevel(set, L);
  G.groups = lvl.groups; G.moves = lvl.moves; G.startMoves = lvl.moves; G.time = lvl.seconds;
  if (kind === "pairs") G.lens = 0;
  lvl.groups.forEach(function (g) { g.words.forEach(function (x) { if (!x.alt) G.levelWords.push(x.w); }); });
  buildBoard(G.groups);
  renderHud(); renderChips();
}
function startOddRound() {
  clearBoard();
  var r = G.rounds[G.round];
  G.groups = [r.main, r.intr]; G.revealed = {}; G.selected = null; G.focus = null; G.roundLocked = false;
  buildBoard(G.groups);
  renderHud(); renderChips();
  announce(t("srRound", G.round + 1, G.rounds.length));
  if (G.kbd) moveFocus();
}
function oddTap(b) {
  if (G.roundLocked) return;
  var r = G.rounds[G.round];
  if (b.gi === 1) {
    G.roundLocked = true;
    b.flying = true; b.node.eventMode = "none";
    var base = b.node.scale.x;
    tween(reduceMotion ? 60 : 220, function (p) { b.node.x = b.x; b.node.y = b.y; b.node.scale.set(base * (1 + 0.2 * p)); b.node.alpha = 1 - p; },
      function () { burst(b.x, b.y, r.intr.color, 16); b.dead = true; b.node.destroy({ children: true }); G.bubbles = G.bubbles.filter(function (x) { return x !== b; }); });
    floatText(b.x, b.y - b.R * 0.6, r.intr.name, r.intr.color);
    G.revealed[0] = true; G.bubbles.forEach(function (x) { if (x.gi === 0) refreshBubble(x); });
    tone(700, 1400, 0.16, "sine", 0.16);
    G.oddLog.push(r.main); renderChips();
    announce(t("srOddRight", r.intr.words[0].w, r.main.name));
    tween(1300, function () {}, function () {
      G.round++;
      if (G.round >= G.rounds.length) { G.over = true; renderHud(); finish(true); } else startOddRound();
    });
  } else {
    G.mistakes++; if (G.timed) G.time = Math.max(0, G.time - 3);
    var iw = r.intr.words[0].w, key = b.words[0].w + "|" + iw;
    if (!G.mixups.some(function (m) { return m.key === key; })) G.mixups.push({ key: key, a: b.words[0].w, an: r.main.name, ac: r.main.color, b: iw, bn: r.intr.name, bc: r.intr.color });
    noteMiss([b.words[0].w, iw]);
    b.shake = 1; b.flash = 22; drawBubble(b);
    floatText(b.x, b.y, G.timed ? "−3 " + t("sec") : "✗", "#" + theme.bad.toString(16).padStart(6, "0"));
    tone(220, 130, 0.18, "triangle", 0.12);
    announce(t("srOddWrong"));
    renderHud();
  }
}

function renderHud() {
  if (!G || G.demo) return;
  $("#hudSet").innerHTML = esc(G.set.title || t("untitled")) + (G.draft ? '<span class="tag">' + esc(t("draft")) + "</span>" : "");
  $("#hudLevel").textContent = t("level", G.L) + " · " + kindName(G.kind) + (G.timed ? " · " + t("modeTime") : "");
  var odd = G.kind === "odd";
  var n = G.timed ? Math.ceil(G.time) : odd ? Math.min(G.round + 1, G.rounds.length) + "/" + G.rounds.length : G.moves;
  $("#movesN").textContent = n;
  $(".moves-l").textContent = G.timed ? t("sec") : odd ? t("round") : t("moves");
  $("#movesBox").classList.toggle("low", G.timed ? n <= 10 : !odd && n <= 2);
  $("#lensN").textContent = G.lens; $("#magnetN").textContent = G.magnet;
  $("#lensBtn").disabled = G.lens <= 0 || G.over; $("#magnetBtn").disabled = G.magnet <= 0 || G.over;
  $("#lensBtn").setAttribute("aria-pressed", G.lensArmed ? "true" : "false");
}
function renderChips() {
  if (!G || G.demo) return;
  var html = "";
  if (G.kind === "odd") {
    G.oddLog.forEach(function (g) { html += '<span class="chip" style="--c:' + g.color + '">' + esc(g.name) + "</span>"; });
    for (var j = G.oddLog.length; j < G.rounds.length; j++) html += '<span class="chip ghost">?</span>';
    $("#chips").innerHTML = html; return;
  }
  G.groups.forEach(function (g, i) {
    if (G.done[i]) html += '<span class="chip" style="--c:' + g.color + '">' + esc(g.name) + "</span>";
  });
  for (var k = G.doneCount; k < G.groups.length; k++) html += '<span class="chip ghost">?</span>';
  $("#chips").innerHTML = html;
}

function select(b) { if (G.selected) { G.selected.sel = false; drawBubble(G.selected); } G.selected = b; if (b) { b.sel = true; drawBubble(b); } }

function groupSpeech(grp) { return grp.name + ". " + grp.words.map(function (x) { return x.w; }).join(", "); }

function onTap(b) {
  if (!G || G.demo || b.dead || b.flying) return;
  if (b.done) return;
  if (G.over) return;
  if (b.words.length === 1 && !b.words[0].alt) speak(b.words[0].w);
  if (G.lensArmed) { G.lensArmed = false; $("#note").hidden = true; useLens(b); return; }
  if (G.kind === "odd") { oddTap(b); return; }
  if (!G.selected) {
    select(b); tone(420, 560, 0.08, "sine", 0.08);
    announce(t("srSelected", labelOf(b)));
    return;
  }
  if (G.selected === b) { select(null); announce(t("srCancel")); return; }
  var a = G.selected; select(null);
  if (a.gi === b.gi) {
    var dest = b.words.length > a.words.length ? b : a, src = dest === a ? b : a;
    if (!G.timed) G.moves--;
    renderHud();
    mergeInto(dest, src);
  } else {
    wrongPair(a, b);
  }
}

function labelOf(b) { return b.words.length === 1 ? b.words[0].w : b.words[0].w + " +" + (b.words.length - 1); }

function wrongPair(a, b) {
  G.mistakes++;
  if (G.timed) G.time = Math.max(0, G.time - 3); else G.moves--;
  var key = [labelOf(a), labelOf(b)].sort().join("|"), ga = G.groups[a.gi], gb = G.groups[b.gi];
  if (!G.mixups.some(function (m) { return m.key === key; })) G.mixups.push({ key: key, a: labelOf(a), an: ga.name, ac: ga.color, b: labelOf(b), bn: gb.name, bc: gb.color });
  noteMiss([missWordOf(a), missWordOf(b)]);
  [a, b].forEach(function (x) { x.shake = 1; x.flash = 22; drawBubble(x); });
  var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  a.vx -= dx / d * 2; a.vy -= dy / d * 2; b.vx += dx / d * 2; b.vy += dy / d * 2;
  floatText((a.x + b.x) / 2, (a.y + b.y) / 2, G.timed ? "−3 " + t("sec") : "−1", "#" + theme.bad.toString(16).padStart(6, "0"));
  tone(220, 130, 0.18, "triangle", 0.12);
  announce(t("srWrong"));
  renderHud();
  if (!G.timed && G.moves <= 0) { G.over = true; renderHud(); setTimeout(function () { finish(false); }, 650); }
}

function mergeInto(dest, src) {
  src.flying = true; src.node.eventMode = "none";
  var sx = src.x, sy = src.y, sc = src.node.scale.x;
  var willComplete = dest.words.length + src.words.length === G.groups[dest.gi].words.length;
  var willWin = willComplete && G.doneCount + 1 === G.groups.length;
  if (!G.timed && !willWin && G.moves <= 0) G.over = true;
  tween(reduceMotion ? 60 : 230, function (p) {
    var e = easeOut(p);
    src.node.x = sx + (dest.x - sx) * e; src.node.y = sy + (dest.y - sy) * e;
    src.node.scale.set(sc * (1 - 0.6 * e)); src.node.alpha = 1 - 0.7 * e;
  }, function () {
    src.dead = true; src.node.destroy({ children: true });
    G.bubbles = G.bubbles.filter(function (x) { return x !== src; });
    if (G.focus === src) G.focus = dest;
    dest.words = dest.words.concat(src.words);
    dest.r = dest.R * 0.92; refreshBubble(dest);
    tone(520, 900, 0.1, "sine", 0.14);
    var total = G.groups[dest.gi].words.length;
    if (dest.words.length === total) completeGroup(dest);
    else {
      announce(t("srMerged", dest.words.length, total));
      if (!G.timed && G.moves <= 0 && !willWin) { G.over = true; renderHud(); setTimeout(function () { finish(false); }, 650); }
    }
  });
}

/* A finished group stays on the board as a labelled bubble (name + words),
   keeps floating with the others so nothing is covered, then pops by itself.
   Tapping it reads the group aloud and pops it at once. */
function completeGroup(b) {
  var gi = b.gi, grp = G.groups[gi];
  G.done[gi] = true; G.doneCount++;
  if (G.selected === b) select(null);
  b.done = true; b.sel = false; b.flash = 0;
  refreshBubble(b);
  burst(b.x, b.y, grp.color, 10);
  tone(700, 1400, 0.16, "sine", 0.16);
  renderChips();
  announce(t("srDone", grp.name, grp.words.map(function (x) { return x.w; }).join(", ")));
  var last = G.doneCount === G.groups.length;
  if (last) { G.over = true; renderHud(); }
  if (G.focus === b) { G.focus = null; if (G.kbd) moveFocus(); }
  b.node.eventMode = "none"; b.node.cursor = "default";
  tween(last ? 900 : 1500, function () {}, function () { popDone(b); });
  if (!last && !G.timed && G.moves <= 0) { G.over = true; renderHud(); setTimeout(function () { finish(false); }, 900); }
}
function popDone(b) {
  if (b.popped || !G) return;
  b.popped = true; b.flying = true; b.node.eventMode = "none";
  var grp = G.groups[b.gi], base = b.node.scale.x;
  tween(reduceMotion ? 60 : 260, function (p) {
    b.node.x = b.x; b.node.y = b.y;
    b.node.scale.set(base * (1 + 0.18 * easeOut(p))); b.node.alpha = 1 - p;
  }, function () {
    burst(b.x, b.y, grp.color, 18);
    tone(760, 1500, 0.12, "sine", 0.12);
    b.dead = true; b.node.destroy({ children: true });
    G.bubbles = G.bubbles.filter(function (x) { return x !== b; });
    G.popped++;
    if (G.doneCount === G.groups.length && G.popped === G.groups.length && !G.finished) setTimeout(function () { finish(true); }, 350);
  });
}

function useLens(b) {
  if (!G || G.lens <= 0 || b.done) return;
  G.lens--; G.revealed[b.gi] = true;
  G.bubbles.forEach(function (x) { if (x.gi === b.gi && !x.done) refreshBubble(x); });
  tone(600, 760, 0.12, "sine", 0.1);
  announce(G.groups[b.gi].name);
  renderHud();
}
function useMagnet() {
  if (!G || G.over || G.magnet <= 0) return;
  var pref = G.selected ? G.selected.gi : -1, order = [];
  if (pref >= 0) order.push(pref);
  G.groups.forEach(function (g, i) { if (i !== pref) order.push(i); });
  for (var k = 0; k < order.length; k++) {
    var gi = order[k];
    var live = G.bubbles.filter(function (x) { return x.gi === gi && !x.flying && !x.dead && !x.done; });
    if (live.length >= 2) {
      live.sort(function (p, q) { return q.words.length - p.words.length; });
      select(null);
      G.magnet--; renderHud();
      mergeInto(live[0], live[1]);
      return;
    }
  }
}

/* ── keyboard play on the board ── */
function liveBubbles() { return G.bubbles.filter(function (b) { return !b.flying && !b.dead && !b.done; }); }
function describe(b) {
  if (b.done) return G.groups[b.gi].name + ": " + b.words.map(function (x) { return x.w; }).join(", ");
  var s = b.words.length === 1 ? b.words[0].w : b.words.map(function (x) { return x.w; }).join(", ") + " — " + b.words.length + "/" + G.groups[b.gi].words.length;
  if (G.revealed[b.gi]) s += " (" + G.groups[b.gi].name + ")";
  if (b.sel) s += ", " + t("srSelectedTag");
  return s;
}
function setFocus(b) {
  var prev = G.focus; G.focus = b;
  if (prev && prev !== b && !prev.dead) drawBubble(prev);
  if (b) { drawBubble(b); announce(describe(b)); }
}
function moveFocus(key) {
  var bs = liveBubbles(); if (!bs.length) return;
  var f = G.focus && bs.indexOf(G.focus) >= 0 ? G.focus : null;
  if (!f || !key) {
    var sz = stageSize();
    bs.sort(function (a, b) { return Math.hypot(a.x - sz.W / 2, a.y - sz.H / 2) - Math.hypot(b.x - sz.W / 2, b.y - sz.H / 2); });
    setFocus(bs[0]); return;
  }
  var dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key];
  var best = null, bestS = 1e9;
  bs.forEach(function (c) {
    if (c === f) return;
    var dx = c.x - f.x, dy = c.y - f.y, along = dx * dir[0] + dy * dir[1];
    if (along <= 4) return;
    var score = along + 2.2 * Math.abs(dx * dir[1] - dy * dir[0]);
    if (score < bestS) { bestS = score; best = c; }
  });
  if (best) setFocus(best);
}
function onBoardKey(e) {
  if (!G || G.demo) return;
  var k = e.key;
  if (k.indexOf("Arrow") === 0) { e.preventDefault(); G.kbd = true; moveFocus(k); return; }
  if (k === "Enter" || k === " ") {
    e.preventDefault(); G.kbd = true;
    if (!G.focus || G.focus.dead || G.focus.flying) moveFocus(); else onTap(G.focus);
    return;
  }
  if (k === "Escape") { if (G.selected) { e.stopPropagation(); select(null); announce(t("srCancel")); } return; }
  var low = k.toLowerCase();
  if (low === "l" || low === "д") { e.preventDefault(); if (G.focus && !G.focus.dead && G.lens > 0 && !G.over) { var b = G.focus; select(null); useLens(b); } else $("#lensBtn").click(); return; }
  if (low === "m" || low === "ь") { e.preventDefault(); useMagnet(); return; }
}

function syncProgress() {
  if (!CLASS || !G || G.draft || !CLASS.onProgress) return;
  var set = G.set, kind = G.kind || "groups";
  try { CLASS.onProgress(set.id, kind, { level: savedLevel(set, kind), stars: starsOf(set, kind), misses: missOf(set) }); } catch (e) {}
}
function finish(won) {
  if (!G || G.finished) return;
  G.finished = true;
  setTimeout(syncProgress, 0);
  $("#note").hidden = true;
  var res = $("#result"), html = '<div class="card">';
  var left = G.timed ? Math.ceil(G.time) : G.moves;
  if (won) {
    var stars = G.mistakes === 0 ? 3 : G.mistakes <= 2 ? 2 : 1;
    if (!G.draft) { var next = G.L + 1; if (next > savedLevel(G.set, G.kind)) lsSet(levelKey(G.set, G.kind), String(next)); saveStars(G.set, G.kind, G.L, stars); }
    relieveMiss();
    html += '<p class="kicker">' + esc(t("winK")) + " · " + esc(t("level", G.L)) + "</p>" +
      '<h2 class="h1">' + esc(t("winT")) + "</h2>" +
      '<div class="score" aria-label="' + stars + '/3">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= stars ? "on" : "") + '"></i>'; }).join("") + "</div>" +
      '<p class="stats">' + esc(G.timed ? t("statsTime", G.mistakes, left) : G.kind === "odd" ? t("statsOdd", G.mistakes) : t("stats", G.mistakes, left)) + "</p>";
  } else {
    html += '<p class="kicker">' + esc(G.timeUp ? t("timeUp") : t("loseK")) + " · " + esc(t("level", G.L)) + "</p>" +
      '<h2 class="h1">' + esc(t("loseT")) + "</h2>" +
      '<ul class="grouplist">' + G.groups.map(function (g) {
        if (G.kind === "pairs") return '<li><span class="grp" style="--c:' + g.color + '">' + esc(g.words[0].w) + "</span><span>" + esc(g.words[1].w) + "</span></li>";
        return '<li><span class="grp" style="--c:' + g.color + '">' + esc(g.name) + "</span><span>" + g.words.map(function (x) { return esc(x.w) + (x.h ? " <i>(" + esc(x.h) + ")</i>" : ""); }).join(", ") + "</span></li>";
      }).join("") + "</ul>";
  }
  if (G.mixups.length) {
    html += '<h3 class="h2">' + esc(t("mixups")) + '</h3>' + (G.draft ? "" : '<p class="help" style="margin-bottom:10px">' + esc(t("mixupsBack")) + "</p>") + '<ul class="review">' + G.mixups.slice(0, 6).map(function (m) {
      return '<li><div class="pair">' + esc(t("mixWhy", m.a, m.b)) + '</div><div class="why"><span class="grp" style="--c:' + m.ac + '">' + esc(m.an) + '</span> · <span class="grp" style="--c:' + m.bc + '">' + esc(m.bn) + "</span></div></li>";
    }).join("") + "</ul>";
  }
  html += '<div class="row" style="margin-top:22px">';
  if (won) html += '<button class="btn" type="button" id="rNext">' + esc(t("next")) + "</button>";
  html += '<button class="btn ' + (won ? "ghost" : "") + '" type="button" id="rRetry">' + esc(t("retry")) + "</button>";
  html += '<button class="btn ghost" type="button" id="rHome">' + esc(G.draft ? t("backEditor") : t("toLevels")) + "</button></div></div>";
  res.innerHTML = html; res.hidden = false;
  var set = G.set, L = G.L, draft = G.draft, kind = G.kind;
  if (won) $("#rNext").onclick = function () { startGame(set, L + 1, { draft: draft, kind: kind }); };
  $("#rRetry").onclick = function () { startGame(set, L, { draft: draft, kind: kind }); };
  $("#rHome").onclick = function () { if (draft) { goHome(); openTeacher(); } else openLevels(set); };
  var first = won ? $("#rNext") : $("#rRetry"); if (first) first.focus({ preventScroll: true });
}

/* ─────────────── home screen & level map ─────────────── */
function renderJoin() {
  var h = $("#home"), j = JOIN, html = '<div class="card join">';
  if (j.state === "loading") html += '<div class="thinking" aria-label="' + esc(t("loadingK")) + '"><i></i><i></i><i></i></div>';
  else if (j.state === "name") {
    html += '<p class="kicker">' + esc(t("classK")) + '</p><h1 class="h1">' + esc(j.className) + "</h1>" +
      '<form id="joinForm" class="join-form" novalidate><label class="lbl" for="joinName">' + esc(t("joinAsk")) + "</label>" +
      '<input id="joinName" type="text" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="' + esc(t("namePh")) + '">' +
      '<button class="btn" type="submit"' + (j.busy ? " disabled" : "") + ">" + esc(t("joinBtn")) + "</button></form>";
  } else {
    html += '<p class="kicker">' + esc(t("classK")) + " " + esc(j.code || "") + '</p><h1 class="h1">' + esc(j.state === "neterr" ? t("netErrT") : t("notFoundT")) + "</h1>" +
      '<p class="help">' + esc(j.state === "neterr" ? t("netErr") : t("notFoundP")) + "</p>" +
      (j.state === "neterr" ? '<div class="row"><button class="btn" type="button" id="joinRetry">' + esc(t("retry")) + "</button></div>" : codeFormHtml());
  }
  var errText = j.error || (j.errorKey ? t(j.errorKey) : "");
  if (errText) html += '<p class="join-err" role="alert">' + esc(errText) + "</p>";
  html += '<p class="teacher-entry"><a class="linkbtn" href="#/">' + esc(t("toMain")) + "</a></p></div>";
  h.innerHTML = html;
  var f = $("#joinForm");
  if (f) {
    var inp = $("#joinName"); if (!j.busy) setTimeout(function () { inp.focus(); }, 30);
    f.onsubmit = function (e) {
      e.preventDefault(); var v = inp.value.trim();
      if (!v || v.length > 40) { JOIN.error = t("badName"); renderJoin(); return; }
      JOIN.busy = true; JOIN.error = null; renderJoin(); j.onJoin(v);
    };
  }
  if ($("#joinRetry")) $("#joinRetry").onclick = function () { j.onRetry && j.onRetry(); };
  wireCodeForm();
}
function codeFormHtml() {
  return '<form id="codeForm" class="code-form" novalidate><label class="lbl" for="codeIn">' + esc(t("haveCode")) + '</label><div class="row">' +
    '<input id="codeIn" type="text" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + esc(t("codePh")) + '">' +
    '<button class="btn" type="submit">' + esc(t("go")) + "</button></div></form>";
}
function wireCodeForm() {
  var cf = $("#codeForm"); if (!cf) return;
  cf.onsubmit = function (e) {
    e.preventDefault(); var v = $("#codeIn").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (v.length >= 4) location.hash = "#/c/" + v;
  };
}
function renderHome() {
  if (JOIN) return renderJoin();
  if (CLASS) return renderClassHome();
  var h = $("#home");
  var cards = SETS.filter(function (s) { return playableCats(s).length >= 3; }).map(function (s) {
    var cats = playableCats(s), lv = savedLevel(s);
    return '<button class="setcard" type="button" data-set="' + esc(s.id) + '"><b>' + esc(s.title || t("untitled")) + '</b><span class="meta">' +
      (s.grade ? esc(s.grade) + " · " : "") + esc(t("setMeta", cats.length, wordCount({ cats: cats }))) + '</span><span class="go">' + esc(t("goLevel", lv)) + "</span></button>";
  }).join("");
  var last = null; try { last = JSON.parse(lsGet("bs.lastClass") || "null"); } catch (e) {}
  h.innerHTML = '<div class="card"><p class="kicker">' + esc(t("kicker")) + '</p><h1 class="h1">' + esc(t("homeTitle")) + '</h1>' +
    (STANDALONE ? '<div class="classbox">' + (last && last.code ? '<a class="btn" href="#/c/' + esc(last.code) + '">' + esc(t("continueAs", last.className, last.student)) + "</a>" : "") + codeFormHtml() + "</div>" : "") +
    '<ul class="rules">' +
    t("rules").map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + '</ul><h2 class="h2">' + esc(STANDALONE ? t("demoSets") : t("chooseSet")) + "</h2>" +
    (cards ? '<div class="sets">' + cards + "</div>" : '<p class="empty">' + esc(t("noSets")) + "</p>") +
    '<p class="kbdhelp">' + t("kbdHelp") + "</p>" +
    (STANDALONE && !TEACHER_UI ? '<p class="teacher-entry"><a class="linkbtn" href="#/teacher">' + esc(t("teacherLogin")) + "</a></p>" : "") +
    (canEdit || !TEACHER_UI ? "" : '<p class="teacher-entry"><button class="linkbtn" type="button" id="teacherEntry">' + esc(t("teacherEntry")) + "</button></p>") + "</div>";
  $$(".setcard", h).forEach(function (btn) {
    btn.onclick = function () { var s = SETS.find(function (x) { return x.id === btn.dataset.set; }); if (s) openLevels(s); };
  });
  if ($("#teacherEntry")) $("#teacherEntry").onclick = openTeacher;
  wireCodeForm();
}
function renderClassHome() {
  var h = $("#home");
  var cards = SETS.filter(function (s) { return playableCats(s).length >= 3; }).map(function (s) {
    var cats = playableCats(s), lv = savedLevel(s);
    return '<button class="setcard" type="button" data-set="' + esc(s.id) + '"><b>' + esc(s.title || t("untitled")) + '</b><span class="meta">' +
      (s.grade ? esc(s.grade) + " · " : "") + esc(t("setMeta", cats.length, wordCount({ cats: cats }))) + '</span><span class="go">' + esc(t("goLevel", lv)) + "</span></button>";
  }).join("");
  h.innerHTML = '<div class="card"><p class="kicker">' + esc(t("classK")) + " · " + esc(CLASS.className) + '</p><h1 class="h1">' + esc(t("hiName", CLASS.student)) + "</h1>" +
    (CLASS.offline ? '<p class="offline-note">' + esc(t("offlineNote")) + "</p>" : "") +
    (cards ? '<div class="sets">' + cards + "</div>" : '<p class="empty">' + esc(t("noClassSets")) + "</p>") +
    '<details class="rules-d"><summary>' + esc(t("howToPlay")) + '</summary><ul class="rules">' + t("rules").map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></details>" +
    '<p class="teacher-entry class-links"><button class="linkbtn" type="button" id="notMe">' + esc(t("notMe")) + '</button><a class="linkbtn" href="#/">' + esc(t("leaveClass")) + "</a></p></div>";
  $$(".setcard", h).forEach(function (btn) {
    btn.onclick = function () { var s = SETS.find(function (x) { return x.id === btn.dataset.set; }); if (s) openLevels(s); };
  });
  $("#notMe").onclick = function () { if (CLASS && CLASS.onForget) CLASS.onForget(); };
}
function primeProgress(list) {
  (list || []).forEach(function (p) {
    var set = { id: p.set }, kind = p.kind;
    if ((p.level || 1) > savedLevel(set, kind)) lsSet(levelKey(set, kind), String(p.level));
    var st = starsOf(set, kind), changed = false;
    Object.keys(p.stars || {}).forEach(function (L) { if (!(st[L] >= p.stars[L])) { st[L] = p.stars[L]; changed = true; } });
    if (changed) lsSet("bs.stars." + p.set + kindSuffix(kind), JSON.stringify(st));
    var m = missOf(set), mc = false;
    Object.keys(p.misses || {}).forEach(function (w) { if (!(m[w] >= p.misses[w])) { m[w] = p.misses[w]; mc = true; } });
    if (mc) saveMiss(set, m);
  });
}
var levelsSet = null;
function openLevels(set) {
  levelsSet = set;
  $("#hud").hidden = true; $("#tray").hidden = true; $("#result").hidden = true; $("#home").hidden = true; $("#note").hidden = true;
  if (!G || !G.demo) startDemo();
  renderLevels(); $("#levels").hidden = false;
  var cur = $("#levels .lvl.cur"); if (cur) cur.focus({ preventScroll: true });
}
function renderLevels() {
  var set = levelsSet; if (!set) return;
  var kind = getKind(set), un = savedLevel(set, kind), st = starsOf(set, kind), mode = getMode(set), N = Math.max(12, un), btns = "";
  for (var L = 1; L <= N; L++) {
    var cap = levelCaption(set, kind, L), locked = L > un, n = st[L] || 0;
    btns += '<button class="lvl' + (locked ? " locked" : "") + (L === un ? " cur" : "") + '" type="button" data-l="' + L + '"' + (locked ? " disabled" : "") +
      ' aria-label="' + esc(t("lvlAria", L, cap, n, locked)) + '"><span class="lvl-n">' + L + '</span><span class="lvl-s" aria-hidden="true">' +
      [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? "on" : "") + '"></i>'; }).join("") + '</span><span class="lvl-d" aria-hidden="true">' + esc(cap) + "</span></button>";
  }
  var pairsOk = canPairs(set);
  var kinds = [["groups", t("kindGroups")], ["odd", t("kindOdd")], ["pairs", t("kindPairs")]];
  var el = $("#levels");
  el.innerHTML = '<div class="card"><div class="lvtop"><button class="btn ghost small" type="button" id="lvBack">' + esc(t("allSets")) + "</button></div>" +
    '<p class="kicker">' + esc(set.grade || t("kicker")) + '</p><h1 class="h1">' + esc(set.title || t("untitled")) + "</h1>" +
    '<div class="seg kinds" role="group" aria-label="' + esc(t("kindQ")) + '"><span class="lbl">' + esc(t("kindQ")) + "</span>" +
    kinds.map(function (k) {
      var dis = k[0] === "pairs" && !pairsOk;
      return '<button type="button" class="segbtn" data-kind="' + k[0] + '" aria-pressed="' + (kind === k[0]) + '"' + (dis ? ' disabled title="' + esc(t("noHints")) + '"' : "") + ">" + esc(k[1]) + "</button>";
    }).join("") + "</div>" +
    '<div class="seg" role="group" aria-label="' + esc(t("modeQ")) + '"><span class="lbl">' + esc(t("modeQ")) + "</span>" +
    '<button type="button" class="segbtn" data-mode="moves" aria-pressed="' + (mode === "moves") + '">' + esc(kind === "odd" ? t("modeCalm") : t("modeMoves")) + "</button>" +
    '<button type="button" class="segbtn" data-mode="time" aria-pressed="' + (mode === "time") + '">' + esc(t("modeTime")) + "</button></div>" +
    '<p class="help" style="margin-top:12px">' + esc(kind === "odd" ? t("lvlHelpOdd") : kind === "pairs" ? t("lvlHelpPairs") : t("lvlHelp")) + (pairsOk ? "" : " " + esc(t("noHints"))) + '</p><div class="levels">' + btns + "</div>" +
    '<button class="btn" type="button" id="lvPlay">' + esc(t("playLevel", un)) + "</button></div>";
  $("#lvBack").onclick = goHome;
  $("#lvPlay").onclick = function () { startGame(set, un, { kind: kind }); };
  $$(".lvl", el).forEach(function (b) { b.onclick = function () { startGame(set, +b.dataset.l, { kind: kind }); }; });
  $$("[data-mode]", el).forEach(function (b) { b.onclick = function () { lsSet("bs.mode." + set.id, b.dataset.mode); renderLevels(); var m = $('[data-mode="' + b.dataset.mode + '"]'); if (m) m.focus(); }; });
  $$("[data-kind]", el).forEach(function (b) { b.onclick = function () { lsSet("bs.kind." + set.id, b.dataset.kind); renderLevels(); var m = $('[data-kind="' + b.dataset.kind + '"]'); if (m) m.focus(); }; });
}
function goHome() {
  $("#hud").hidden = true; $("#tray").hidden = true; $("#result").hidden = true; $("#note").hidden = true; $("#levels").hidden = true;
  levelsSet = null;
  renderHome(); $("#home").hidden = false;
  startDemo();
}

/* ─────────────── teacher workshop ─────────────── */
Object.assign(I18N.ru, {
  tabCards: "Карточки", tabText: "Текст", tabFile: "Файл", tabAI: "Claude",
  groupName: "Название группы", addWord: "Добавить слово", addWordPh: "слово или слово = перевод, затем Enter",
  newGroup: "+ Новая группа", delGroup: "Удалить группу", delGroupQ: "Удалить?", unnamedGroup: "Группа без названия",
  vNoName: "Есть группа без названия — ученики увидят «?».",
  selWord: function (w) { return "Выбрано «" + w + "»"; }, editWord: "Изменить", delWord: "Удалить", moveHere: "Переместить сюда",
  dragHint: "Перетаскивайте слова между группами или нажмите на слово, чтобы изменить, удалить или переместить его.",
  needMore: function (n) { return "Нужно ещё " + n + " " + plural(n, "слово", "слова", "слов") + ", чтобы группа попала в игру."; },
  fileTitle: "Загрузить таблицу", fileDrop: "Выберите или перетащите сюда файл CSV, Excel (.xlsx) или JSON",
  fileHelpH: "Какие таблицы подходят",
  fileHelp1: "Три столбца «Группа · Слово · Перевод» — по слову в строке. Пустая ячейка группы значит «та же группа, что выше».",
  fileHelp2: "Или одна группа в строке: название в первом столбце, дальше слова. Можно и наоборот — названия групп в первой строке, слова под ними.",
  fileHelp3: "В файле Excel каждый лист становится отдельным набором.",
  templates: "Шаблоны", tplCsv: "Шаблон CSV", tplXlsx: "Шаблон Excel", tplSheets: "Скопировать для Google Sheets",
  exportTitle: "Выгрузить текущий набор", expCsv: "Скачать CSV", expXlsx: "Скачать Excel",
  tplCopied: "Шаблон скопирован — вставьте его в пустую таблицу Google Sheets (Ctrl+V).",
  reading: "Читаю файл…", fileEmpty: "В файле не нашлось групп со словами. Проверьте, что он заполнен как шаблон.",
  fileBad: "Не удалось прочитать файл. Подходят CSV, XLSX и JSON, выгруженный из этой игры.",
  xlsxFail: "Не загрузился модуль Excel. Сохраните таблицу как CSV и загрузите её.",
  layoutQ: "Как расположены группы?", layoutRows: "В строках", layoutCols: "В столбцах",
  found: function (s, g, w) { return "Найдено: " + (s > 1 ? s + " " + plural(s, "набор", "набора", "наборов") + ", " : "") + g + " " + plural(g, "группа", "группы", "групп") + ", " + w + " " + plural(w, "слово", "слова", "слов") + "."; },
  asNew: "Добавить как новый набор", asNewMany: function (n) { return "Добавить как новые наборы (" + n + ")"; },
  appendTo: function (n) { return "Дописать в «" + n + "»"; }, replaceIn: function (n) { return "Заменить группы в «" + n + "»"; },
  discard: "Отменить",
  addedNew: function (n) { return n > 1 ? "Добавлено наборов: " + n + ". Не забудьте сохранить." : "Набор добавлен. Не забудьте сохранить."; },
  addedTo: "Группы дописаны в набор. Не забудьте сохранить.", replaced: "Группы заменены. Не забудьте сохранить.",
  dlNA: "Скачивание здесь недоступно — содержимое CSV скопировано в буфер обмена.",
  dlNAx: "Скачивание файлов здесь недоступно. Используйте CSV или «Скопировать для Google Sheets».",
  dlNo: "Скачивание отменено.", dlOk: "Файл отправлен на скачивание.",
  aiTopic: "Тема", aiTopicPh: "например: погода, части тела, Unit 4 — Shopping",
  aiGrade: "Кто играет", aiGradePh: "например: Year 3, EAL, начальный уровень",
  aiGroups: "Групп", aiWords: "Слов в группе", aiLang: "Язык слов", aiHint: "Подсказка к слову",
  hintNone: "без подсказки", hintRu: "перевод на русский", hintSr: "перевод на черногорский", hintFr: "перевод на французский", hintDe: "перевод на немецкий", hintDef: "короткое определение",
  aiTraps: "Добавить слова-ловушки: похожи на другую группу, но ответ однозначный",
  aiExtra: "Пожелания", aiExtraPh: "например: только слова из учебника, без составных слов",
  aiGo: "Предложить слова", aiAgain: "Другой вариант", aiStop: "Остановить",
  aiThinking: "Claude подбирает слова — обычно это 10–40 секунд.",
  aiNA: "Подбор слов работает, когда страница открыта в Claude. Здесь пока используйте карточки, текст или файл.",
  aiNeedTopic: "Напишите тему — Claude подберёт группы и слова.",
  aiCost: "Запрос расходует лимит вашего аккаунта Claude. Результат сначала попадает в предпросмотр — вы решаете, добавлять ли его.",
  aiErrGrant: "Доступ к Claude для этой страницы не разрешён, поэтому подбор слов недоступен.",
  aiErrRate: "Слишком много запросов подряд — подождите минуту.",
  aiErrJson: "Claude ответил в неожиданном формате. Попробуйте ещё раз или упростите пожелания.",
  aiErrRefused: "Claude не стал отвечать на этот запрос — переформулируйте тему.",
  aiErrStop: "Остановлено.", aiErr: "Не получилось подобрать слова. Попробуйте ещё раз через минуту."
});
Object.assign(I18N.en, {
  tabCards: "Cards", tabText: "Text", tabFile: "File", tabAI: "Claude",
  groupName: "Group name", addWord: "Add a word", addWordPh: "word or word = translation, then Enter",
  newGroup: "+ New group", delGroup: "Delete group", delGroupQ: "Delete?", unnamedGroup: "Unnamed group",
  vNoName: "A group has no name — students will see “?”.",
  selWord: function (w) { return "“" + w + "” selected"; }, editWord: "Edit", delWord: "Delete", moveHere: "Move here",
  dragHint: "Drag words between groups, or tap a word to edit, delete or move it.",
  needMore: function (n) { return n + " more word" + (n === 1 ? "" : "s") + " needed for this group to appear in the game."; },
  fileTitle: "Upload a spreadsheet", fileDrop: "Choose or drop a CSV, Excel (.xlsx) or JSON file here",
  fileHelpH: "Which spreadsheets work",
  fileHelp1: "Three columns “Group · Word · Hint”, one word per row. An empty group cell means “same group as above”.",
  fileHelp2: "Or one group per row: the name in the first column, then the words. The other way round works too — group names in the first row, words below.",
  fileHelp3: "In an Excel file, each sheet becomes a separate set.",
  templates: "Templates", tplCsv: "CSV template", tplXlsx: "Excel template", tplSheets: "Copy for Google Sheets",
  exportTitle: "Export the current set", expCsv: "Download CSV", expXlsx: "Download Excel",
  tplCopied: "Template copied — paste it into an empty Google Sheet (Ctrl+V).",
  reading: "Reading the file…", fileEmpty: "No groups with words found. Check that the file follows the template.",
  fileBad: "Couldn't read that file. CSV, XLSX and JSON exported from this game work.",
  xlsxFail: "The Excel module didn't load. Save the sheet as CSV and upload that.",
  layoutQ: "Where are the groups?", layoutRows: "In rows", layoutCols: "In columns",
  found: function (s, g, w) { return "Found: " + (s > 1 ? s + " sets, " : "") + g + " group" + (g === 1 ? "" : "s") + ", " + w + " word" + (w === 1 ? "" : "s") + "."; },
  asNew: "Add as a new set", asNewMany: function (n) { return "Add as new sets (" + n + ")"; },
  appendTo: function (n) { return "Add to “" + n + "”"; }, replaceIn: function (n) { return "Replace groups in “" + n + "”"; },
  discard: "Discard",
  addedNew: function (n) { return n > 1 ? n + " sets added. Remember to save." : "Set added. Remember to save."; },
  addedTo: "Groups added to the set. Remember to save.", replaced: "Groups replaced. Remember to save.",
  dlNA: "Downloads aren't available here — the CSV was copied to your clipboard instead.",
  dlNAx: "Downloads aren't available here. Use CSV or “Copy for Google Sheets”.",
  dlNo: "Download cancelled.", dlOk: "File sent to download.",
  aiTopic: "Topic", aiTopicPh: "e.g. weather, parts of the body, Unit 4 — Shopping",
  aiGrade: "Who's playing", aiGradePh: "e.g. Year 3, EAL, beginners",
  aiGroups: "Groups", aiWords: "Words per group", aiLang: "Word language", aiHint: "Hint for each word",
  hintNone: "no hint", hintRu: "Russian translation", hintSr: "Montenegrin translation", hintFr: "French translation", hintDe: "German translation", hintDef: "short definition",
  aiTraps: "Add tricky words: look like another group, but have one clear answer",
  aiExtra: "Extra wishes", aiExtraPh: "e.g. only words from the textbook, no compound words",
  aiGo: "Suggest words", aiAgain: "Another version", aiStop: "Stop",
  aiThinking: "Claude is choosing words — usually 10–40 seconds.",
  aiNA: "Word suggestions work when the page is open in Claude. Here, use cards, text or a file.",
  aiNeedTopic: "Write a topic and Claude will suggest groups and words.",
  aiCost: "This uses your own Claude account's usage. Results land in a preview first — you decide whether to add them.",
  aiErrGrant: "Claude access isn't allowed for this page, so suggestions are unavailable.",
  aiErrRate: "Too many requests in a row — wait a minute.",
  aiErrJson: "Claude replied in an unexpected format. Try again or simplify the wishes.",
  aiErrRefused: "Claude declined this request — rephrase the topic.",
  aiErrStop: "Stopped.", aiErr: "Couldn't get suggestions. Try again in a minute."
});

var artifactNS = null, sampleNS = null, downloadsNS = null, canEdit = false;
var draft = null, curId = null, dirty = false, confirmDel = false, statusMsg = null;
var wsTab = lsGet("bs.wsTab") || "cards";
var groupMenu = -1, imgEdit = false, imgBusy = false, pendingExtra = null;
function picHtml(x, cls) {
  if (!x || !x.img) return "";
  return isUrl(x.img) ? '<img class="' + cls + '" src="' + esc(x.img) + '" alt="" loading="lazy">' : '<span class="' + cls + ' emo">' + esc(x.img) + "</span>";
}
var selChip = null, armedGroup = -1, imp = null, aiCand = null, aiBusy = false, aiCtl = null, aiMsg = null;
var aiForm = { topic: "", grade: "", groups: 5, words: 6, lang: "", hint: "none", traps: false, extra: "" };
var XLSX_LOCAL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
var GROUP_RE = /^(group|category|topic|группа|категория|тема|grupa|kategorija|grup|kategori|konu)$/i;
var WORD_RE = /^(word|words|term|слово|слова|riječ|rijec|reč|rec|mot|wort|kelime|sözcük)$/i;
var HINT_RE = /^(hint|translation|meaning|перевод|подсказка|значение|prijevod|prevod|traduction|übersetzung|çeviri|ipucu|anlam)$/i;
var IMG_RE = /^(picture|image|img|emoji|картинка|изображение|рисунок|эмодзи|slika|resim|görsel|gorsel)$/i;
var ONLY_RE = /^(picture only|image only|только картинка|без слова|samo slika|yalnızca resim|sadece resim)$/i;
var YES_RE = /^(1|x|\+|yes|y|true|да|д|evet|e|da)$/i;
function tableHead(withPic) {
  var h = lang === "ru" ? ["Группа", "Слово", "Перевод"] : lang === "tr" ? ["Grup", "Kelime", "Çeviri"] : lang === "me" ? ["Grupa", "Riječ", "Prevod"] : ["Group", "Word", "Hint"];
  if (withPic) h = h.concat(lang === "ru" ? ["Картинка", "Только картинка"] : lang === "tr" ? ["Resim", "Yalnızca resim"] : lang === "me" ? ["Slika", "Samo slika"] : ["Picture", "Picture only"]);
  return h;
}

function parseWord(s) { var j = s.indexOf("="); return j < 0 ? { w: s.trim(), h: "" } : { w: s.slice(0, j).trim(), h: s.slice(j + 1).trim() }; }
function cleanSet(s) {
  var cats = (s.cats || []).map(function (c) {
    return { name: (c.name || "").trim() || "?", words: c.words.filter(function (x) { return x.w && x.w.trim(); }).map(function (x) {
      var o = { w: x.w.trim(), h: (x.h || "").trim() };
      if (x.img && String(x.img).trim()) { o.img = String(x.img).trim(); if (x.txt === false) o.txt = false; }
      return o;
    }) };
  }).filter(function (c) { return c.words.length; });
  return { id: s.id, title: (s.title || "").trim(), grade: (s.grade || "").trim(), lang: s.lang || "en-GB", cats: cats };
}
function draftClean() { return draft.map(cleanSet); }
function stashDraft() { if (draft) ssSet("bs.draft", JSON.stringify({ draft: draft, curId: curId })); }
function markDirty() { dirty = true; stashDraft(); var d = $("#dirtyFlag"); if (d) d.hidden = false; $("#teacherDot").hidden = false; }
function curSet() { return draft.find(function (s) { return s.id === curId; }) || draft[0]; }
function leaveText() { draft.forEach(function (s) { delete s._text; }); }
function copyOf(o) { return JSON.parse(JSON.stringify(o)); }
function catsForCheck(s) { return wsTab === "text" && s._text != null ? parseSetText(s._text) : s.cats; }
function changed() { markDirty(); renderSide(); renderSetList(); }

var dbMode = null; // {onSave(sets) -> Promise<sets>, onClose()} when the workshop edits the teacher's library in the database
function openTeacher() {
  if (!draft) draft = SETS.map(copyOf);
  if (!curId || !draft.some(function (s) { return s.id === curId; })) curId = draft[0] ? draft[0].id : null;
  $("#teacher").hidden = false;
  renderTeacher();
}
function closeTeacher(keepOpenMode) {
  if (aiCtl) aiCtl.abort(); leaveText(); $("#teacher").hidden = true;
  if (dbMode && !keepOpenMode) dbMode.onClose();
}

function renderTeacher() {
  var sheet = $("#teacher .sheet"), s = curSet();
  var tabs = [["cards", t("tabCards")], ["text", t("tabText")], ["file", t("tabFile")]];
  if (!STANDALONE || sampleNS) tabs.push(["ai", t("tabAI")]);
  if (wsTab === "ai" && tabs.length === 3) wsTab = "cards";
  var html = '<div class="sheet-head"><h2 id="wsTitle">' + esc(t("wsTitle")) + '</h2><span class="dirty" id="dirtyFlag"' + (dirty ? "" : " hidden") + ">" + esc(t("unsaved")) + '</span><button class="btn ghost small" type="button" id="wsClose">' + esc(t("close")) + "</button></div>";
  html += '<div class="sheet-body"><nav class="setlist" id="setList"></nav><div class="editor"><div class="main">';
  if (s) {
    html += '<div class="meta">' +
      '<div class="f"><label for="fTitle">' + esc(t("fTitle")) + '</label><input id="fTitle" type="text" value="' + esc(s.title) + '"></div>' +
      '<div class="f"><label for="fGrade">' + esc(t("fGrade")) + '</label><input id="fGrade" type="text" value="' + esc(s.grade || "") + '"></div>' +
      '<div class="f"><label for="fLang">' + esc(t("fLang")) + '</label><select id="fLang">' + LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === s.lang ? " selected" : "") + ">" + esc(l[1]) + "</option>"; }).join("") + "</select></div></div>";
  }
  html += '<div class="tabs" role="tablist">' + tabs.map(function (tb) {
    return '<button class="tab" role="tab" type="button" id="tab-' + tb[0] + '" data-tab="' + tb[0] + '" aria-selected="' + (wsTab === tb[0]) + '">' + esc(tb[1]) + "</button>";
  }).join("") + '</div><div class="pane" id="pane" role="tabpanel"></div></div>';
  html += '<aside class="side" id="side"></aside></div></div>';
  html += '<div class="sheet-foot"><span class="status" id="wsStatus"></span>' +
    '<button class="btn ghost small" type="button" id="copyJson">' + esc(t("copyJson")) + "</button>" +
    '<button class="btn" type="button" id="saveBtn">' + esc(dbMode ? t("saveDb") : t("save")) + "</button></div>" +
    '<div id="copyWrap" class="copywrap" hidden><textarea class="jsonbox" id="copyBox" readonly aria-label="JSON"></textarea></div>';
  sheet.innerHTML = html;
  renderSetList();
  if (s) {
    $("#fTitle").oninput = function (e) { s.title = e.target.value; changed(); };
    $("#fGrade").oninput = function (e) { s.grade = e.target.value; markDirty(); };
    $("#fLang").onchange = function (e) { s.lang = e.target.value; markDirty(); };
  }
  $$(".tab", sheet).forEach(function (b) {
    b.onclick = function () { if (wsTab === "text") leaveText(); wsTab = b.dataset.tab; lsSet("bs.wsTab", wsTab); selChip = null; renderTeacher(); };
  });
  $("#wsClose").onclick = function () { closeTeacher(); };
  $("#saveBtn").onclick = saveForStudents;
  $("#copyJson").onclick = function () { copyText(JSON.stringify({ version: 1, sets: draftClean() }, null, 2), t("copied")); };
  renderPane(); renderSide();
  if (statusMsg) setStatus(statusMsg.text, statusMsg.kind);
  else if (dbMode) setStatus(dirty ? "" : t("dbHint"), "");
  else if (!artifactNS) setStatus(t("saveNA"), "");
  else if (capsChecked && !canEdit) setStatus(t("notEditor"), "");
}

function renderSetList() {
  var nav = $("#setList"); if (!nav) return;
  nav.innerHTML = draft.map(function (s) {
    var n = (s.cats || []).length;
    return '<button class="setitem' + (s.id === curId ? " cur" : "") + '" type="button" data-id="' + esc(s.id) + '">' + esc(s.title || t("untitled")) + "<small>" + esc(t("groupsShort", n)) + (s.grade ? " · " + esc(s.grade) : "") + "</small></button>";
  }).join("") + '<button class="setitem add" type="button" id="addSet">' + esc(t("newSet")) + "</button>";
  $$(".setitem[data-id]", nav).forEach(function (b) {
    b.onclick = function () { leaveText(); curId = b.dataset.id; confirmDel = false; selChip = null; armedGroup = -1; renderTeacher(); };
  });
  $("#addSet").onclick = function () {
    leaveText();
    var s = { id: uid(), title: "", grade: "", lang: "en-GB", cats: [{ name: "", words: [] }, { name: "", words: [] }, { name: "", words: [] }] };
    draft.push(s); curId = s.id; if (wsTab !== "cards" && wsTab !== "text") wsTab = "cards";
    markDirty(); renderTeacher(); $("#fTitle").focus();
  };
}

function renderSide() {
  var side = $("#side"), s = curSet(); if (!side) return;
  if (!s) { side.innerHTML = ""; return; }
  var cats = catsForCheck(s), v = validate(cats);
  side.innerHTML = '<p class="lbl">' + esc(t("check")) + '</p><ul class="issues">' + (v.issues.length ? v.issues.map(function (i) {
    return '<li><span class="sev ' + i.lv + '">' + (i.lv === "error" ? "!" : "?") + "</span><span>" + esc(i.text) + "</span></li>";
  }).join("") : '<li class="ok">' + esc(t("allGood")) + "</li>") + "</ul>" +
  '<div class="row"><button class="btn small" type="button" id="tryBtn"' + (v.playable ? "" : " disabled") + ">" + esc(t("tryIt")) + '</button><button class="btn ghost small" type="button" id="delBtn">' + esc(t("del")) + '</button></div><div id="delBox"></div>' +
  printBox(s, v.playable);
  wirePrintBox(s);
  $("#tryBtn").onclick = function () {
    var c = cleanSet(s);
    if (!validate(c.cats).playable) { setStatus(t("needPlayable"), "err"); return; }
    closeTeacher(true); startGame(c, 1, { draft: true });
  };
  $("#delBtn").onclick = function () { confirmDel = true; renderDelBox(); };
  renderDelBox();
}
function renderDelBox() {
  var box = $("#delBox"); if (!box) return;
  if (!confirmDel) { box.innerHTML = ""; return; }
  var used = dbMode && dbMode.usage && dbMode.usage[curId];
  box.innerHTML = '<div class="confirm"><span>' + esc(used && used.length ? t("delUsed", used.join(", ")) : t("delQ")) + '</span><button class="btn danger small" type="button" id="delYes">' + esc(t("delYes")) + '</button><button class="btn ghost small" type="button" id="delNo">' + esc(t("cancel")) + "</button></div>";
  $("#delYes").onclick = function () { draft = draft.filter(function (x) { return x.id !== curId; }); curId = draft[0] ? draft[0].id : null; confirmDel = false; markDirty(); renderTeacher(); };
  $("#delNo").onclick = function () { confirmDel = false; renderDelBox(); };
}
function setStatus(text, kind) {
  statusMsg = text ? { text: text, kind: kind || "" } : null;
  var el = $("#wsStatus"); if (!el) return;
  el.textContent = text || ""; el.className = "status" + (kind ? " " + kind : "");
}
function copyText(text, okMsg) {
  var fallback = function () { var w = $("#copyWrap"); if (!w) return; w.hidden = false; var box = $("#copyBox"); box.value = text; box.focus(); box.select(); setStatus(t("copyFallback"), ""); };
  try { navigator.clipboard.writeText(text).then(function () { setStatus(okMsg, "ok"); }, fallback); } catch (e) { fallback(); }
}

function renderPane() {
  var pane = $("#pane"), s = curSet(); if (!pane) return;
  if (wsTab === "file") return renderFilePane(pane, s);
  if (wsTab === "ai") return renderAiPane(pane, s);
  if (!s) { pane.innerHTML = '<p class="empty">' + esc(t("noSets")) + "</p>"; return; }
  if (wsTab === "text") return renderTextPane(pane, s);
  renderCardsPane(pane, s);
}

/* ── cards ── */
function dupKeys(cats) {
  var seen = {}, dup = {};
  cats.forEach(function (c, ci) { c.words.forEach(function (x) { var k = x.w.toLowerCase(); if (seen[k] !== undefined && seen[k] !== ci) dup[k] = 1; else seen[k] = ci; }); });
  return dup;
}
function addWordsTo(c, raw) {
  var have = {}, before = c.words.length; c.words.forEach(function (x) { have[x.w.toLowerCase()] = 1; });
  var pe = pendingExtra; pendingExtra = null;
  setTimeout(function () { if (pe && c.words.length === before + 1) { var nw = c.words[c.words.length - 1]; nw.img = pe.img; if (pe.txt === false) nw.txt = false; } }, 0);
  raw.split(/[,;\n\t]/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (it) {
    var w = parseWord(it); if (!w.w || have[w.w.toLowerCase()]) return; have[w.w.toLowerCase()] = 1; c.words.push(w);
  });
}
function moveWord(from, to) {
  var s = curSet(); if (!s || from.ci === to) return;
  var w = s.cats[from.ci].words.splice(from.wi, 1)[0]; if (!w) return;
  var dst = s.cats[to];
  if (!dst.words.some(function (x) { return x.w.toLowerCase() === w.w.toLowerCase(); })) dst.words.push(w);
  selChip = null; changed(); renderPane();
}
function renderCardsPane(pane, s) {
  var dup = dupKeys(s.cats), html = '<p class="help">' + esc(t("dragHint")) + "</p>";
  if (selChip && s.cats[selChip.ci] && s.cats[selChip.ci].words[selChip.wi]) {
    var sw = s.cats[selChip.ci].words[selChip.wi];
    html += '<div class="selbar"><b>' + esc(t("selWord", sw.w)) + '</b><button class="btn ghost small" type="button" id="selPic" aria-pressed="' + !!imgEdit + '">' + esc(t("picBtn")) + '</button><button class="btn ghost small" type="button" id="selEdit">' + esc(t("editWord")) + '</button><button class="btn ghost small" type="button" id="selDel">' + esc(t("delWord")) + '</button><button class="btn ghost small" type="button" id="selCancel">' + esc(t("cancel")) + "</button></div>";
    if (imgEdit) {
      html += '<div class="imgpanel"><div class="imgprev">' + (sw.img ? picHtml(sw, "bigpic") : '<span class="noimg">' + esc(t("picNone")) + "</span>") + "</div><div class=\"imgctl\">" +
        (dbMode && dbMode.uploadImage ? '<label class="btn small filebtn">' + esc(imgBusy ? t("picUploading") : t("picUpload")) + '<input type="file" id="imgFile" accept="image/png,image/jpeg,image/webp,image/gif"' + (imgBusy ? " disabled" : "") + "></label>" : "") +
        '<div class="row"><input id="imgUrl" type="text" autocomplete="off" placeholder="' + esc(t("picUrlPh")) + '" value="' + esc(sw.img || "") + '"><button class="btn ghost small" type="button" id="imgApply">' + esc(t("picApply")) + "</button></div>" +
        '<div class="emojis">' + ["🍎", "🍌", "🥕", "🐶", "🐱", "🐟", "🚗", "✏️", "📚", "⚽", "☀️", "🌧️", "🏠", "👕", "🔴", "3️⃣"].map(function (e) { return '<button type="button" class="emo-btn" data-emo="' + e + '">' + e + "</button>"; }).join("") + "</div>" +
        '<label class="check-row"><input type="checkbox" id="imgTxt"' + (sw.txt === false ? "" : " checked") + "><span>" + esc(t("picWithWord")) + "</span></label>" +
        '<p class="help">' + esc(t("picHelp")) + "</p>" +
        '<div class="row">' + (sw.img ? '<button class="btn ghost small" type="button" id="imgRemove">' + esc(t("picRemove")) + "</button>" : "") + '<button class="btn small" type="button" id="imgDone">' + esc(t("picDone")) + "</button></div></div></div>";
    }
  } else selChip = null;
  html += '<div class="gcards">' + s.cats.map(function (c, ci) {
    var n = c.words.length;
    return '<section class="gcard' + (n < 3 ? " short" : "") + '" data-ci="' + ci + '">' +
      '<div class="gcard-h"><input class="gname" type="text" id="gname-' + ci + '" data-ci="' + ci + '" value="' + esc(c.name) + '" placeholder="' + esc(t("groupName")) + '" aria-label="' + esc(t("groupName")) + '">' +
      '<span class="gcount">' + n + "</span>" +
      (draft.length > 1 ? '<button class="iconbtn" type="button" data-gmenu="' + ci + '" aria-label="' + esc(t("gMoveCopy")) + '" aria-expanded="' + (groupMenu === ci) + '" title="' + esc(t("gMoveCopy")) + '">⇄</button>' : "") +
      '<button class="iconbtn' + (armedGroup === ci ? " armed" : "") + '" type="button" data-delg="' + ci + '" aria-label="' + esc(t("delGroup")) + '">' + (armedGroup === ci ? esc(t("delGroupQ")) : "×") + "</button></div>" +
      (groupMenu === ci ? '<div class="gmenu"><label class="lbl" for="gTarget">' + esc(t("gToSet")) + '</label><select id="gTarget">' +
        draft.filter(function (x) { return x.id !== s.id; }).map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.title || t("untitled")) + "</option>"; }).join("") +
        '</select><div class="row"><button class="btn small" type="button" data-gcopy="' + ci + '">' + esc(t("gCopy")) + '</button><button class="btn ghost small" type="button" data-gmove="' + ci + '">' + esc(t("gMove")) + '</button><button class="btn ghost small" type="button" data-gclose="1">' + esc(t("cancel")) + "</button></div></div>" : "") +
      '<div class="wchips">' + c.words.map(function (x, wi) {
        var sel = selChip && selChip.ci === ci && selChip.wi === wi;
        return '<button class="wchip' + (dup[x.w.toLowerCase()] ? " dup" : "") + (sel ? " sel" : "") + (x.img ? " haspic" : "") + '" type="button" draggable="true" data-ci="' + ci + '" data-wi="' + wi + '">' + picHtml(x, "wimg") +
          (x.img && x.txt === false ? '<s class="wlabel">' + esc(x.w) + "</s>" : esc(x.w)) + (x.h ? "<i>" + esc(x.h) + "</i>" : "") + "</button>";
      }).join("") + "</div>" +
      (selChip && selChip.ci !== ci ? '<button class="btn ghost small movehere" type="button" data-move="' + ci + '">' + esc(t("moveHere")) + "</button>" : "") +
      '<input class="wadd" type="text" id="wadd-' + ci + '" data-ci="' + ci + '" placeholder="' + esc(t("addWordPh")) + '" aria-label="' + esc(t("addWord")) + '">' +
      (n < 3 ? '<p class="gwarn">' + esc(t("needMore", 3 - n)) + "</p>" : "") +
      "</section>";
  }).join("") + '<button class="gcard addg" type="button" id="addGroup">' + esc(t("newGroup")) + "</button></div>";
  pane.innerHTML = html;

  $$(".gname", pane).forEach(function (inp) { inp.oninput = function () { s.cats[+inp.dataset.ci].name = inp.value; changed(); }; });
  $$(".wadd", pane).forEach(function (inp) {
    var commit = function () {
      if (!inp.value.trim()) return false;
      var ci = +inp.dataset.ci; addWordsTo(s.cats[ci], inp.value); inp.value = "";
      changed(); renderPane(); var again = $("#wadd-" + ci); if (again) again.focus(); return true;
    };
    inp.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); commit(); } };
    inp.onpaste = function () { setTimeout(function () { if (/[\n\t]/.test(inp.value) || inp.value.split(",").length > 2) commit(); }, 0); };
  });
  $$("[data-delg]", pane).forEach(function (b) {
    b.onclick = function () {
      var ci = +b.dataset.delg;
      if (armedGroup !== ci && s.cats[ci].words.length) { armedGroup = ci; renderPane(); return; }
      s.cats.splice(ci, 1); armedGroup = -1; selChip = null; changed(); renderPane();
    };
  });
  $$(".wchip", pane).forEach(function (b) {
    var ci = +b.dataset.ci, wi = +b.dataset.wi;
    b.onclick = function () { var same = selChip && selChip.ci === ci && selChip.wi === wi; selChip = same ? null : { ci: ci, wi: wi }; if (!selChip) imgEdit = false; armedGroup = -1; renderPane(); };
    b.ondragstart = function (e) { e.dataTransfer.setData("text/plain", ci + ":" + wi); e.dataTransfer.effectAllowed = "move"; };
  });
  $$(".gcard[data-ci]", pane).forEach(function (card) {
    card.ondragover = function (e) { e.preventDefault(); card.classList.add("over"); };
    card.ondragleave = function () { card.classList.remove("over"); };
    card.ondrop = function (e) {
      e.preventDefault(); card.classList.remove("over");
      var d = (e.dataTransfer.getData("text/plain") || "").split(":");
      if (d.length === 2) moveWord({ ci: +d[0], wi: +d[1] }, +card.dataset.ci);
    };
  });
  $$("[data-move]", pane).forEach(function (b) { b.onclick = function () { moveWord(selChip, +b.dataset.move); }; });
  if ($("#selEdit")) {
    $("#selEdit").onclick = function () {
      var ci = selChip.ci, w = s.cats[ci].words.splice(selChip.wi, 1)[0]; selChip = null; imgEdit = false; changed(); renderPane();
      pendingExtra = w.img ? { ci: ci, img: w.img, txt: w.txt } : null;
      var inp = $("#wadd-" + ci); inp.value = w.h ? w.w + " = " + w.h : w.w; inp.focus(); inp.select();
    };
    var cur = function () { return s.cats[selChip.ci].words[selChip.wi]; };
    $("#selPic").onclick = function () { imgEdit = !imgEdit; renderPane(); };
    if (imgEdit) {
      var setImg = function (v) { var x = cur(); v = String(v || "").trim(); if (v) x.img = v; else { delete x.img; delete x.txt; } changed(); renderPane(); };
      $("#imgApply").onclick = function () { setImg($("#imgUrl").value); };
      $("#imgUrl").onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); setImg($("#imgUrl").value); } };
      $$(".emo-btn", pane).forEach(function (b) { b.onclick = function () { setImg(b.dataset.emo); }; });
      $("#imgTxt").onchange = function (e) { var x = cur(); if (e.target.checked) delete x.txt; else x.txt = false; changed(); renderPane(); };
      if ($("#imgRemove")) $("#imgRemove").onclick = function () { setImg(""); };
      $("#imgDone").onclick = function () { imgEdit = false; renderPane(); };
      if ($("#imgFile")) $("#imgFile").onchange = function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        var target = cur(); imgBusy = true; renderPane(); setStatus(t("picUploading"), "");
        dbMode.uploadImage(f).then(function (url) { imgBusy = false; target.img = url; changed(); renderPane(); setStatus(t("picUploaded"), "ok"); },
          function (err) { imgBusy = false; renderPane(); setStatus(t("picUploadErr") + (err && err.message ? " (" + err.message + ")" : ""), "err"); });
      };
    }
    $("#selDel").onclick = function () { s.cats[selChip.ci].words.splice(selChip.wi, 1); selChip = null; changed(); renderPane(); };
    $("#selCancel").onclick = function () { selChip = null; renderPane(); };
  }
  $$("[data-gmenu]", pane).forEach(function (b) { b.onclick = function () { var ci = +b.dataset.gmenu; groupMenu = groupMenu === ci ? -1 : ci; armedGroup = -1; renderPane(); }; });
  $$("[data-gclose]", pane).forEach(function (b) { b.onclick = function () { groupMenu = -1; renderPane(); }; });
  var groupTo = function (ci, move) {
    var target = draft.find(function (x) { return x.id === $("#gTarget").value; }); if (!target) return;
    var g = s.cats[ci]; if (!g) return;
    mergeCats(target.cats = target.cats || [], [g]);
    if (move) s.cats.splice(ci, 1);
    groupMenu = -1; changed(); renderPane();
    setStatus(t(move ? "gMoved" : "gCopied", g.name || t("unnamedGroup"), target.title || t("untitled")), "ok");
  };
  $$("[data-gcopy]", pane).forEach(function (b) { b.onclick = function () { groupTo(+b.dataset.gcopy, false); }; });
  $$("[data-gmove]", pane).forEach(function (b) { b.onclick = function () { groupTo(+b.dataset.gmove, true); }; });
  $("#addGroup").onclick = function () { s.cats.push({ name: "", words: [] }); changed(); renderPane(); var g = $("#gname-" + (s.cats.length - 1)); if (g) g.focus(); };
}

/* ── text ── */
function keepPics(oldCats, newCats) {
  var m = {};
  (oldCats || []).forEach(function (c) { (c.words || []).forEach(function (x) { if (x.img) m[x.w.toLowerCase()] = x; }); });
  newCats.forEach(function (c) { c.words.forEach(function (x) { var o = m[x.w.toLowerCase()]; if (o) { x.img = o.img; if (o.txt === false) x.txt = false; } }); });
  return newCats;
}
function renderTextPane(pane, s) {
  if (s._text == null) s._text = setToText(s);
  pane.innerHTML = '<div class="f"><label for="fText">' + esc(t("fWords")) + '</label><textarea id="fText" spellcheck="false"></textarea></div><p class="help">' + t("help") + " " + esc(t("picTextNote")) + "</p>";
  $("#fText").value = s._text;
  $("#fText").oninput = function (e) { s._text = e.target.value; s.cats = keepPics(s.cats, parseSetText(s._text).filter(function (c) { return !c.bad; })); changed(); };
}

/* ── candidates preview (file + Claude) ── */
function candTotals(cands) {
  var g = 0, w = 0; cands.forEach(function (s) { g += s.cats.length; s.cats.forEach(function (c) { w += c.words.length; }); });
  return { s: cands.length, g: g, w: w };
}
function renderCands(box, cands, opts) {
  var tot = candTotals(cands), cur = curSet();
  var html = '<div class="cand"><p class="cand-found">' + esc(t("found", tot.s, tot.g, tot.w)) + "</p>";
  if (opts.layoutToggle) {
    html += '<div class="seg" role="group" aria-label="' + esc(t("layoutQ")) + '"><span class="lbl">' + esc(t("layoutQ")) + "</span>" +
      '<button type="button" class="segbtn" data-layout="rows" aria-pressed="' + (opts.layout === "rows") + '">' + esc(t("layoutRows")) + "</button>" +
      '<button type="button" class="segbtn" data-layout="cols" aria-pressed="' + (opts.layout === "cols") + '">' + esc(t("layoutCols")) + "</button></div>";
  }
  html += cands.map(function (s) {
    return '<div class="cand-set">' + (cands.length > 1 || s.title ? "<b>" + esc(s.title || t("untitled")) + "</b>" : "") + '<div class="pgroups">' + s.cats.map(function (c) {
      var off = c.words.length < 3;
      return '<div class="pg' + (off ? " off" : "") + '"><div class="pg-h">' + esc(c.name) + "<span>" + c.words.length + (off ? " · " + esc(t("notInGame")) : "") + "</span></div><p>" +
        c.words.map(function (x) { return esc(x.w) + (x.h ? " <i>(" + esc(x.h) + ")</i>" : ""); }).join(", ") + "</p></div>";
    }).join("") + "</div></div>";
  }).join("");
  html += '<div class="row"><button class="btn small" type="button" data-apply="new">' + esc(cands.length > 1 ? t("asNewMany", cands.length) : t("asNew")) + "</button>";
  if (cur) html += '<button class="btn ghost small" type="button" data-apply="append">' + esc(t("appendTo", cur.title || t("untitled"))) + '</button><button class="btn ghost small" type="button" data-apply="replace">' + esc(t("replaceIn", cur.title || t("untitled"))) + "</button>";
  html += (opts.extra || "") + '<button class="btn ghost small" type="button" data-apply="discard">' + esc(t("discard")) + "</button></div></div>";
  box.innerHTML = html;
  $$("[data-apply]", box).forEach(function (b) { b.onclick = function () { opts.onApply(b.dataset.apply); }; });
  $$("[data-layout]", box).forEach(function (b) { b.onclick = function () { opts.onLayout(b.dataset.layout); }; });
}
function mergeCats(into, cats) {
  cats.forEach(function (c) {
    var ex = into.find(function (x) { return (x.name || "").toLowerCase() === (c.name || "").toLowerCase(); });
    if (!ex) { into.push(copyOf(c)); return; }
    c.words.forEach(function (w) { if (!ex.words.some(function (x) { return x.w.toLowerCase() === w.w.toLowerCase(); })) ex.words.push(copyOf(w)); });
  });
  return into;
}
function applyCands(cands, mode) {
  var cur = curSet(), msg;
  if (mode === "new" || !cur) {
    var first = null;
    cands.forEach(function (c) {
      var ns = { id: uid(), title: c.title || "", grade: c.grade || "", lang: c.lang || (cur && cur.lang) || "en-GB", cats: copyOf(c.cats) };
      draft.push(ns); if (!first) first = ns;
    });
    curId = first.id; msg = t("addedNew", cands.length);
  } else if (mode === "append") {
    cands.forEach(function (c) { mergeCats(cur.cats, c.cats); }); msg = t("addedTo");
  } else {
    var all = []; cands.forEach(function (c) { mergeCats(all, c.cats); }); cur.cats = all; msg = t("replaced");
  }
  markDirty(); wsTab = "cards"; lsSet("bs.wsTab", wsTab);
  renderTeacher(); setStatus(msg, "ok");
}

/* ── file import / export ── */
function parseCSV(text) {
  text = String(text).replace(/^﻿/, "");
  var firstLine = (text.split(/\r?\n/).find(function (l) { return l.trim(); }) || "");
  var cnt = function (ch) { return firstLine.split(ch).length - 1; };
  var delim = cnt("\t") > 0 ? "\t" : cnt(";") > cnt(",") ? ";" : ",";
  var rows = [], row = [], cell = "", q = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"' && cell === "") q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function normRows(rows) { return rows.map(function (r) { return (r || []).map(function (c) { return String(c == null ? "" : c).trim(); }); }).filter(function (r) { return r.some(Boolean); }); }
function isLongFormat(rows) {
  if (!rows.length) return null;
  var head = rows[0], gi = -1, wi = -1, hi = -1, ii = -1, oi = -1;
  head.forEach(function (c, i) { if (gi < 0 && GROUP_RE.test(c)) gi = i; else if (wi < 0 && WORD_RE.test(c)) wi = i; else if (hi < 0 && HINT_RE.test(c)) hi = i; else if (ii < 0 && IMG_RE.test(c)) ii = i; else if (oi < 0 && ONLY_RE.test(c)) oi = i; });
  return gi >= 0 && wi >= 0 ? { gi: gi, wi: wi, hi: hi, ii: ii, oi: oi } : null;
}
function guessLayout(rows) {
  rows = normRows(rows); if (!rows.length) return "rows";
  var nCols = rows.reduce(function (m, r) { var last = 0; r.forEach(function (c, i) { if (c) last = i + 1; }); return Math.max(m, last); }, 0);
  return rows.length > nCols && nCols >= 2 ? "cols" : "rows";
}
function rowsToCats(rows, layout) {
  rows = normRows(rows);
  var order = [], map = {};
  var add = function (name, raw, hint, img, only) {
    name = (name || "").trim(); if (!name || !raw) return;
    var w = hint ? { w: raw.trim(), h: hint.trim() } : parseWord(raw);
    if (!w.w) return;
    if (img && String(img).trim()) { w.img = String(img).trim(); if (only && YES_RE.test(String(only).trim())) w.txt = false; }
    var key = name.toLowerCase();
    if (!map[key]) { map[key] = { name: name, words: [] }; order.push(key); }
    if (!map[key].words.some(function (x) { return x.w.toLowerCase() === w.w.toLowerCase(); })) map[key].words.push(w);
  };
  var split = function (cell) { return (cell || "").split(/[,;]/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var lf = isLongFormat(rows);
  if (lf) {
    var last = "";
    rows.slice(1).forEach(function (r) { var g = r[lf.gi] || last; last = g; add(g, r[lf.wi] || "", lf.hi >= 0 ? r[lf.hi] || "" : "", lf.ii >= 0 ? r[lf.ii] : "", lf.oi >= 0 ? r[lf.oi] : ""); });
  } else if (layout === "cols") {
    var names = rows[0];
    names.forEach(function (n, ci) { if (!n) return; rows.slice(1).forEach(function (r) { split(r[ci]).forEach(function (x) { add(n, x, ""); }); }); });
  } else {
    rows.forEach(function (r, ri) {
      if (ri === 0 && GROUP_RE.test(r[0] || "")) return;
      r.slice(1).forEach(function (cell) { split(cell).forEach(function (x) { add(r[0], x, ""); }); });
    });
  }
  return order.map(function (k) { return map[k]; });
}
function computeImp() {
  imp.sets = imp.raw.map(function (sh) {
    return { title: imp.raw.length > 1 ? sh.name : imp.base, cats: rowsToCats(sh.rows, imp.layout) };
  }).filter(function (s) { return s.cats.length; });
}
var XLSX = null;
async function ensureXLSX() {
  if (!XLSX) { try { XLSX = await import("xlsx"); } catch (e) { XLSX = null; } }
  return !!XLSX;
}
function readFile(f, asText) {
  return new Promise(function (res, rej) {
    var rd = new FileReader();
    rd.onload = function () { res(rd.result); }; rd.onerror = function () { rej(rd.error); };
    if (asText) rd.readAsText(f); else rd.readAsArrayBuffer(f);
  });
}
function pickExtras(src, w) { var im = src.img || src.image || src.picture || src.emoji; if (im) { w.img = String(im).trim(); if (src.txt === false || src.pictureOnly === true) w.txt = false; } return w; }
function jsonToCands(obj) {
  var list = Array.isArray(obj) ? obj : obj && Array.isArray(obj.sets) ? obj.sets : obj && obj.cats ? [obj] : null;
  if (!list) return [];
  return list.filter(function (s) { return s && Array.isArray(s.cats); }).map(function (s) {
    return { title: String(s.title || ""), grade: String(s.grade || ""), lang: s.lang || "", cats: s.cats.map(function (c) {
      return { name: String(c.name || "?"), words: (c.words || []).map(function (w) { return typeof w === "string" ? parseWord(w) : pickExtras(w, { w: String(w.w || w.word || ""), h: String(w.h || w.hint || "") }); }).filter(function (w) { return w.w; }) };
    }) };
  });
}
async function handleFile(f) {
  if (!f) return;
  var ext = (f.name.split(".").pop() || "").toLowerCase(), base = f.name.replace(/\.[^.]+$/, "");
  setStatus(t("reading"), "");
  try {
    if (ext === "json") {
      var cands = jsonToCands(JSON.parse(await readFile(f, true)));
      imp = { json: true, sets: cands.filter(function (s) { return s.cats.length; }) };
    } else if (ext === "xlsx" || ext === "xls") {
      if (!(await ensureXLSX())) { setStatus(t("xlsxFail"), "err"); return; }
      var wb = XLSX.read(new Uint8Array(await readFile(f, false)), { type: "array" });
      var raw = wb.SheetNames.map(function (n) { return { name: n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: "", raw: false }) }; })
        .filter(function (sh) { return normRows(sh.rows).length; });
      imp = { raw: raw, base: base, layout: raw.length ? guessLayout(raw[0].rows) : "rows" };
      imp.long = raw.length && !!isLongFormat(normRows(raw[0].rows));
      computeImp();
    } else {
      var rows = parseCSV(await readFile(f, true));
      imp = { raw: [{ name: base, rows: rows }], base: base, layout: guessLayout(rows) };
      imp.long = !!isLongFormat(normRows(rows));
      computeImp();
    }
    if (!imp.sets.length) { imp = null; setStatus(t("fileEmpty"), "err"); renderPane(); return; }
    setStatus("", ""); renderPane();
  } catch (e) { imp = null; setStatus(t("fileBad"), "err"); renderPane(); }
}
function templateRows() {
  var h = tableHead(true), yes = lang === "ru" ? "да" : lang === "tr" ? "evet" : lang === "me" ? "da" : "yes";
  return [h, ["Fruit", "apple", "яблоко", "🍎", ""], ["", "pear", "груша", "🍐", ""], ["", "banana", "банан", "🍌", yes], ["", "cherry", "вишня", "", ""],
    ["Vegetables", "carrot", "морковь", "🥕", yes], ["", "onion", "лук", "", ""], ["", "potato", "картофель", "", ""], ["", "cucumber", "огурец", "🥒", ""],
    ["Drinks", "water", "вода", "", ""], ["", "milk", "молоко", "", ""], ["", "juice", "сок", "", ""], ["", "tea", "чай", "", ""]];
}
function setRows(s) {
  var cs = cleanSet(s), pics = cs.cats.some(function (c) { return c.words.some(function (w) { return w.img; }); });
  var yes = lang === "ru" ? "да" : lang === "tr" ? "evet" : lang === "me" ? "da" : "yes", rows = [tableHead(pics)];
  cs.cats.forEach(function (c) { c.words.forEach(function (w) { rows.push(pics ? [c.name, w.w, w.h, w.img || "", w.img && w.txt === false ? yes : ""] : [c.name, w.w, w.h]); }); });
  return rows;
}
function toCSV(rows) {
  return "﻿" + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? "" : c); return /[",\n;]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n") + "\r\n";
}
function safeName(s, fb) { s = String(s || "").replace(/[\\/:*?"<>|\[\]]+/g, " ").replace(/\s+/g, " ").trim(); return s || fb; }
function saveBlob(filename, data) {
  var blob = data instanceof Blob ? data : new Blob([data], { type: /\.html$/i.test(filename) ? "text/html" : /\.csv$/i.test(filename) ? "text/csv" : "text/plain" });
  var url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}
async function offerFile(filename, data, csvFallback) {
  if (!downloadsNS) {
    try { saveBlob(filename, data); setStatus(t("dlOk"), "ok"); }
    catch (e) { if (csvFallback != null) copyText(csvFallback, t("dlNA")); else setStatus(t("dlNAx"), "err"); }
    return;
  }
  try { await downloadsNS.save({ filename: filename, data: data }); setStatus(t("dlOk"), "ok"); }
  catch (e) {
    var c = e && e.code;
    if (c === "declined") setStatus(t("dlNo"), "");
    else if (c === "rate_limited") setStatus(t("saveRate"), "err");
    else if (csvFallback != null) copyText(csvFallback, t("dlNA"));
    else setStatus(t("dlNAx"), "err");
  }
}
async function offerXlsx(filename, sheetName, rows) {
  if (!(await ensureXLSX())) { setStatus(t("xlsxFail"), "err"); return; }
  var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, ws, safeName(sheetName, "Words").slice(0, 31));
  var out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  await offerFile(filename, new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), null);
}
function renderFilePane(pane, s) {
  pane.innerHTML =
    '<label class="drop" id="drop"><input type="file" id="fileIn" accept=".csv,.tsv,.txt,.xlsx,.xls,.json"><b>' + esc(t("fileTitle")) + "</b><span>" + esc(t("fileDrop")) + "</span></label>" +
    '<div id="impBox"></div>' +
    '<div class="fhelp"><p class="lbl">' + esc(t("fileHelpH")) + "</p><ul class=\"rules\"><li>" + esc(t("fileHelp1")) + "</li><li>" + esc(t("fileHelp2")) + "</li><li>" + esc(t("fileHelp3")) + "</li></ul></div>" +
    '<div class="fgroup"><p class="lbl">' + esc(t("templates")) + '</p><div class="row"><button class="btn ghost small" type="button" id="tplCsv">' + esc(t("tplCsv")) + '</button><button class="btn ghost small" type="button" id="tplXlsx">' + esc(t("tplXlsx")) + '</button><button class="btn ghost small" type="button" id="tplSheets">' + esc(t("tplSheets")) + "</button></div></div>" +
    (s ? '<div class="fgroup"><p class="lbl">' + esc(t("exportTitle")) + '</p><div class="row"><button class="btn ghost small" type="button" id="expCsv">' + esc(t("expCsv")) + '</button><button class="btn ghost small" type="button" id="expXlsx">' + esc(t("expXlsx")) + "</button></div></div>" : "");
  var drop = $("#drop");
  $("#fileIn").onchange = function (e) { handleFile(e.target.files && e.target.files[0]); e.target.value = ""; };
  drop.ondragover = function (e) { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = function () { drop.classList.remove("over"); };
  drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove("over"); handleFile(e.dataTransfer.files && e.dataTransfer.files[0]); };
  $("#tplCsv").onclick = function () { var c = toCSV(templateRows()); offerFile("bubble-sort-template.csv", c, c); };
  $("#tplXlsx").onclick = function () { offerXlsx("bubble-sort-template.xlsx", "Food", templateRows()); };
  $("#tplSheets").onclick = function () { copyText(templateRows().map(function (r) { return r.join("\t"); }).join("\n"), t("tplCopied")); };
  if (s) {
    var fname = safeName(s.title, "word-set");
    $("#expCsv").onclick = function () { var c = toCSV(setRows(s)); offerFile(fname + ".csv", c, c); };
    $("#expXlsx").onclick = function () { offerXlsx(fname + ".xlsx", s.title || "Words", setRows(s)); };
  }
  if (imp && imp.sets && imp.sets.length) {
    renderCands($("#impBox"), imp.sets, {
      layoutToggle: !imp.json && !imp.long, layout: imp.layout,
      onLayout: function (l) { imp.layout = l; computeImp(); renderPane(); },
      onApply: function (mode) { if (mode === "discard") { imp = null; renderPane(); return; } var c = imp.sets; imp = null; applyCands(c, mode); }
    });
  }
}

/* ── Claude suggestions ── */
var HINTS = { none: "hintNone", ru: "hintRu", tr: "hintTr", sr: "hintSr", fr: "hintFr", de: "hintDe", def: "hintDef" };
function buildAiPrompt(f) {
  var langName = (LANGS.find(function (l) { return l[0] === f.lang; }) || ["", "English (UK)"])[1];
  var hintRule = {
    none: '"h" must be an empty string.',
    ru: '"h" is the Russian translation of the word.',
    sr: '"h" is the Montenegrin translation of the word, in Latin script.',
    fr: '"h" is the French translation of the word.',
    de: '"h" is the German translation of the word.',
    tr: '"h" is the Turkish translation of the word.',
    def: '"h" is a very short, simple definition in the same language as the words (at most 6 words).'
  }[f.hint] || '"h" must be an empty string.';
  return [
    "You are helping a school teacher build a word-sorting vocabulary game (players merge bubbles whose words belong to the same group). Many players are learners of the word language.",
    "",
    "Create one word set:",
    "- Topic: " + f.topic,
    "- Players: " + (f.grade || "primary school pupils"),
    "- Number of groups: " + f.groups,
    "- Words per group: " + f.words,
    "- Language of the words and group names: " + langName + (f.lang === "en-GB" ? " (British spelling)" : ""),
    f.extra ? "- Teacher's wishes: " + f.extra : "",
    "",
    "Rules:",
    "- Words must be common, age-appropriate and correctly spelled; single words or two-word phrases, at most 16 characters.",
    "- Group names are short (1–3 words) and name the category plainly.",
    "- No word may appear twice in the whole set.",
    f.traps ? "- Include 2–3 tricky words in the whole set: at first glance they could fit another group, but on reflection they clearly belong to exactly one." : "- Every word must clearly belong to exactly one group; avoid words that could reasonably fit two groups.",
    "- " + hintRule,
    "",
    'Reply with only JSON in this shape: {"title": "short set title", "cats": [{"name": "Fruit", "words": [{"w": "apple", "h": ""}]}]}'
  ].filter(function (l) { return l !== ""; }).join("\n");
}
function sanitizeAi(res, f) {
  var obj = res && Array.isArray(res.cats) ? res : res && res.set && Array.isArray(res.set.cats) ? res.set : Array.isArray(res) ? { cats: res } : null;
  if (!obj) return null;
  var cats = obj.cats.map(function (c) {
    var words = (c && Array.isArray(c.words) ? c.words : []).map(function (w) {
      return typeof w === "string" ? parseWord(w) : { w: String((w && (w.w || w.word)) || "").trim(), h: f.hint === "none" ? "" : String((w && (w.h || w.hint)) || "").trim() };
    }).filter(function (w) { return w.w; }).slice(0, 12);
    return { name: String((c && (c.name || c.group)) || "?").trim(), words: words };
  }).filter(function (c) { return c.words.length; });
  return cats.length ? { title: String(obj.title || f.topic).trim(), grade: f.grade, lang: f.lang, cats: cats } : null;
}
function readAiForm() {
  aiForm.topic = $("#aiTopic").value.trim(); aiForm.grade = $("#aiGrade").value.trim();
  aiForm.groups = +$("#aiGroups").value; aiForm.words = +$("#aiWords").value;
  aiForm.lang = $("#aiLang").value; aiForm.hint = $("#aiHint").value;
  aiForm.traps = $("#aiTraps").checked; aiForm.extra = $("#aiExtra").value.trim();
  return aiForm;
}
function setAiMsg(text, kind) { aiMsg = text ? { text: text, kind: kind || "" } : null; var el = $("#aiStatus"); if (el) { el.textContent = text || ""; el.className = "status" + (kind ? " " + kind : ""); } }
async function aiGenerate() {
  var f = readAiForm();
  if (!f.topic) { setAiMsg(t("aiNeedTopic"), "err"); $("#aiTopic").focus(); return; }
  if (!sampleNS || aiBusy) return;
  aiBusy = true; aiCtl = new AbortController(); aiCand = null; renderPane(); setAiMsg(t("aiThinking"), "");
  try {
    var res = await sampleNS.json(buildAiPrompt(f), { signal: aiCtl.signal, cache: false });
    var cand = sanitizeAi(res, f);
    if (!cand) throw { code: "invalid_json" };
    aiCand = [cand]; setAiMsg("", "");
  } catch (e) {
    var c = e && e.code;
    if (c === "cancelled") setAiMsg(t("aiErrStop"), "");
    else if (c === "not_granted" || c === "sampling_disabled" || c === "not_declared" || c === "capability_disabled" || c === "capability_removed") { setAiMsg(t("aiErrGrant"), "err"); sampleNS = null; }
    else if (c === "rate_limited" || c === "queue_overflow") setAiMsg(t("aiErrRate"), "err");
    else if (c === "invalid_json" || c === "empty_completion") setAiMsg(t("aiErrJson"), "err");
    else if (c === "refused") setAiMsg(t("aiErrRefused"), "err");
    else setAiMsg(t("aiErr"), "err");
  } finally { aiBusy = false; aiCtl = null; if (wsTab === "ai" && !$("#teacher").hidden) renderPane(); }
}
function renderAiPane(pane, s) {
  if (!aiForm.lang) aiForm.lang = (s && s.lang) || "en-GB";
  if (!aiForm.grade && s && s.grade) aiForm.grade = s.grade;
  if (!sampleNS) { pane.innerHTML = '<p class="note-box">' + esc(aiMsg && aiMsg.kind === "err" ? aiMsg.text : t("aiNA")) + "</p>"; return; }
  var opt = function (vals, cur) { return vals.map(function (v) { return '<option value="' + v + '"' + (String(v) === String(cur) ? " selected" : "") + ">" + v + "</option>"; }).join(""); };
  pane.innerHTML = '<p class="help">' + esc(t("aiCost")) + "</p>" +
    '<div class="aiform">' +
      '<div class="f wide"><label for="aiTopic">' + esc(t("aiTopic")) + '</label><input id="aiTopic" type="text" placeholder="' + esc(t("aiTopicPh")) + '" value="' + esc(aiForm.topic) + '"></div>' +
      '<div class="f wide"><label for="aiGrade">' + esc(t("aiGrade")) + '</label><input id="aiGrade" type="text" placeholder="' + esc(t("aiGradePh")) + '" value="' + esc(aiForm.grade) + '"></div>' +
      '<div class="f"><label for="aiGroups">' + esc(t("aiGroups")) + '</label><select id="aiGroups">' + opt([3, 4, 5, 6, 7, 8], aiForm.groups) + "</select></div>" +
      '<div class="f"><label for="aiWords">' + esc(t("aiWords")) + '</label><select id="aiWords">' + opt([4, 5, 6, 7, 8], aiForm.words) + "</select></div>" +
      '<div class="f"><label for="aiLang">' + esc(t("aiLang")) + '</label><select id="aiLang">' + LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === aiForm.lang ? " selected" : "") + ">" + esc(l[1]) + "</option>"; }).join("") + "</select></div>" +
      '<div class="f"><label for="aiHint">' + esc(t("aiHint")) + '</label><select id="aiHint">' + Object.keys(HINTS).map(function (k) { return '<option value="' + k + '"' + (k === aiForm.hint ? " selected" : "") + ">" + esc(t(HINTS[k])) + "</option>"; }).join("") + "</select></div>" +
      '<label class="check-row wide"><input type="checkbox" id="aiTraps"' + (aiForm.traps ? " checked" : "") + "><span>" + esc(t("aiTraps")) + "</span></label>" +
      '<div class="f wide"><label for="aiExtra">' + esc(t("aiExtra")) + '</label><input id="aiExtra" type="text" placeholder="' + esc(t("aiExtraPh")) + '" value="' + esc(aiForm.extra) + '"></div>' +
    "</div>" +
    '<div class="row"><button class="btn" type="button" id="aiGo"' + (aiBusy ? " disabled" : "") + ">" + esc(aiCand ? t("aiAgain") : t("aiGo")) + "</button>" +
    (aiBusy ? '<button class="btn ghost" type="button" id="aiStop">' + esc(t("aiStop")) + "</button>" : "") + '<span class="status" id="aiStatus"></span></div>' +
    '<div id="aiBox"></div>';
  if (aiBusy) $("#aiBox").innerHTML = '<div class="thinking" aria-hidden="true"><i></i><i></i><i></i></div>';
  if (aiMsg) setAiMsg(aiMsg.text, aiMsg.kind);
  $("#aiGo").onclick = aiGenerate;
  if ($("#aiStop")) $("#aiStop").onclick = function () { if (aiCtl) aiCtl.abort(); };
  $("#aiTopic").onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); aiGenerate(); } };
  ["aiTopic", "aiGrade", "aiGroups", "aiWords", "aiLang", "aiHint", "aiTraps", "aiExtra"].forEach(function (id) { $("#" + id).onchange = readAiForm; });
  if (aiCand && !aiBusy) {
    renderCands($("#aiBox"), aiCand, {
      onApply: function (mode) { if (mode === "discard") { aiCand = null; renderPane(); return; } var c = aiCand; aiCand = null; applyCands(c, mode); }
    });
  }
}

/* ── printable pack (downloaded as a self-contained HTML file to print or save as PDF) ── */
var PRINT_TXT = {
  en: { name: "Name", date: "Date", ex1: "Sort the words into the groups.", bank: "Word bank", ex2: "Circle the odd one out in each row.",
        ex3: "Match each word to its translation. Write the letter.", key: "Answer key", cards: "Word cards",
        cardsHelp: "Cut along the dashed lines. Lay out the coloured group cards and sort the word cards under them." },
  ru: { name: "Имя", date: "Дата", ex1: "Распредели слова по группам.", bank: "Слова", ex2: "В каждой строке обведи лишнее слово.",
        ex3: "Соедини слово с переводом: впиши букву.", key: "Ответы", cards: "Карточки со словами",
        cardsHelp: "Разрежьте по пунктирным линиям. Разложите цветные карточки групп и раскладывайте под ними карточки со словами." },
  tr: { name: "Ad", date: "Tarih", ex1: "Kelimeleri gruplara ayır.", bank: "Kelimeler", ex2: "Her satırda farklı olanı daire içine al.",
        ex3: "Her kelimeyi çevirisiyle eşleştir: harfi yaz.", key: "Cevap anahtarı", cards: "Kelime kartları",
        cardsHelp: "Kesikli çizgilerden kesin. Renkli grup kartlarını dizin, kelime kartlarını altlarına yerleştirin." }
};
PRINT_TXT.me = PRINT_ME;
var printLang = (function () { var v = lsGet("bs.printLang"); return v === "ru" || v === "tr" || v === "me" ? v : "en"; })();
var printHints = lsGet("bs.printHints") !== "0";
var PRINT_CSS = ".pimg{display:block;margin:0 auto 3px;max-width:64px;max-height:64px;object-fit:contain}.pemo{display:block;font-size:30px;line-height:1.15;text-align:center}.bank .pimg{max-width:44px;max-height:44px}.bank .pemo{font-size:24px}" + "@page{size:A4;margin:12mm}*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
  "body{margin:0 auto;max-width:190mm;padding:6mm 0;font-family:'Nunito',Arial,sans-serif;color:#15304A;font-size:12pt;line-height:1.35}" +
  "h1{font-family:'Unbounded',Arial,sans-serif;font-weight:700;font-size:17pt;margin:0 0 1.5mm}.sub{color:#4E6577;margin:0 0 5mm}" +
  ".namebar{display:flex;gap:10mm;margin:0 0 6mm}.namebar span{flex:1;border-bottom:1px solid #15304A;padding-bottom:1mm;color:#4E6577}" +
  "h2{font-size:12.5pt;font-weight:800;margin:7mm 0 3mm}h2 b{display:inline-block;width:7mm;height:7mm;border-radius:50%;background:#15304A;color:#fff;text-align:center;line-height:7mm;margin-right:2mm;font-size:10pt}" +
  ".bank{border:1.5px solid #15304A;border-radius:4mm;padding:3mm 4mm;display:flex;flex-wrap:wrap;gap:2mm 6mm;font-weight:700}" +
  ".bank .lbl{width:100%;font-size:9pt;text-transform:uppercase;letter-spacing:.08em;color:#4E6577;font-weight:800}" +
  "table.sort{width:100%;border-collapse:collapse;margin-top:4mm;table-layout:fixed;break-inside:avoid}table.sort th{border:1.5px solid #15304A;padding:2mm;font-weight:800;text-align:center}" +
  "table.sort td{border:1px solid #9FB5BE;height:9mm}" +
  ".oddrow{display:grid;grid-template-columns:7mm repeat(6,1fr);gap:2.5mm;align-items:center;margin:0 0 2.5mm;break-inside:avoid}.oddrow .n{font-weight:800;color:#4E6577}" +
  ".oddrow .w{border:1px solid #9FB5BE;border-radius:10mm;padding:1.5mm 2mm;text-align:center;font-weight:700}" +
  ".match{display:grid;grid-template-columns:7mm 1fr 14mm 7mm 1fr;gap:2.5mm 2mm;align-items:center}.match .n{font-weight:800;color:#4E6577}" +
  ".match .w{border:1px solid #9FB5BE;border-radius:3mm;padding:1.8mm 3mm;font-weight:700}.match .blank{border-bottom:1px solid #15304A;height:6mm}" +
  ".key{break-before:page;page-break-before:always}.key h2{margin-top:4mm}.key p{margin:1mm 0}.key .g{font-weight:800}" +
  ".cards{display:grid;grid-template-columns:repeat(3,1fr)}.cardp{height:32mm;border:1px dashed #9FB5BE;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2mm;break-inside:avoid}" +
  ".cardp b{font-size:18pt;line-height:1.15}.cardp i{font-style:normal;color:#4E6577;font-size:10.5pt;margin-top:1mm}" +
  ".cardp.head{border:2.5px solid var(--c);background:var(--bg)}.cardp.head b{font-family:'Unbounded',Arial,sans-serif;font-size:12.5pt;color:var(--c);text-transform:uppercase;letter-spacing:.02em}" +
  "@media screen{body{padding:10mm 6mm}}";

function printPage(title, body) {
  return "<!doctype html>\n<html lang=\"" + (printLang === "me" ? "cnr" : printLang) + "\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>" + esc(title) +
    "</title><style>" + $("#bs-fonts").textContent + PRINT_CSS + "</style></head><body>" + body + "</body></html>\n";
}
function printSetData(s) {
  var c = cleanSet(s);
  var cats = c.cats.filter(function (x) { return x.words.length >= 3; }).slice(0, 6).map(function (x, i) {
    return { name: x.name, words: x.words.slice(0, 8), color: CAT_COLORS[i % CAT_COLORS.length] };
  });
  return { title: c.title || t("untitled"), grade: c.grade, cats: cats, hinted: hintedWords(c) };
}
function pw(x) {
  var pic = !x.img ? "" : isUrl(x.img) ? '<img class="pimg" src="' + esc(x.img) + '" alt="">' : '<span class="pemo">' + esc(x.img) + "</span>";
  return pic + (x.img && x.txt === false ? "" : esc(x.w));
}
function headBlock(d, P) {
  return "<h1>" + esc(d.title) + "</h1>" + (d.grade ? '<p class="sub">' + esc(d.grade) + "</p>" : "") +
    '<div class="namebar"><span>' + esc(P.name) + ':</span><span>' + esc(P.date) + ":</span></div>";
}
function buildWorksheet(s) {
  var d = printSetData(s), P = PRINT_TXT[printLang], body = headBlock(d, P), keyHtml = "", n = 1;
  // 1. sort into groups
  var all = []; d.cats.forEach(function (c) { c.words.forEach(function (x) { all.push(x); }); });
  body += "<h2><b>" + n + "</b>" + esc(P.ex1) + '</h2><div class="bank"><span class="lbl">' + esc(P.bank) + "</span>" + shuffle(all).map(function (x) { return "<span>" + pw(x) + "</span>"; }).join("") + "</div>";
  for (var i = 0; i < d.cats.length; i += 3) {
    var chunk = d.cats.slice(i, i + 3), rows = chunk.reduce(function (m, c) { return Math.max(m, c.words.length); }, 0);
    body += '<table class="sort"><tr>' + chunk.map(function (c) { return '<th style="color:' + c.color + '">' + esc(c.name) + "</th>"; }).join("") + "</tr>";
    for (var r = 0; r < rows; r++) body += "<tr>" + chunk.map(function () { return "<td></td>"; }).join("") + "</tr>";
    body += "</table>";
  }
  keyHtml += "<h2><b>" + n + "</b>" + esc(P.ex1) + "</h2>" + d.cats.map(function (c) { return '<p><span class="g" style="color:' + c.color + '">' + esc(c.name) + ":</span> " + c.words.map(function (x) { return esc(x.w); }).join(", ") + "</p>"; }).join("");
  n++;
  // 2. odd one out
  if (d.cats.length >= 2) {
    var rowsHtml = "", keys = [];
    for (var q = 0; q < 6; q++) {
      var main = d.cats[q % d.cats.length], others = d.cats.filter(function (c) { return c !== main; });
      var intrCat = others[rand(others.length)], inMain = {};
      main.words.forEach(function (x) { inMain[x.w.toLowerCase()] = 1; });
      var cand = intrCat.words.filter(function (x) { return !inMain[x.w.toLowerCase()]; });
      if (!cand.length) continue;
      var intrX = cand[rand(cand.length)], intr = intrX.w, picks = shuffle(main.words.slice()).slice(0, 3);
      var row = shuffle(picks.concat([intrX]));
      rowsHtml += '<div class="oddrow"><span class="n">' + (keys.length + 1) + ".</span>" + row.map(function (x) { return '<span class="w">' + pw(x) + "</span>"; }).join("") + "</div>";
      keys.push(intr + " (" + intrCat.name + " ≠ " + main.name + ")");
    }
    if (keys.length) {
      body += "<h2><b>" + n + "</b>" + esc(P.ex2) + "</h2>" + rowsHtml;
      keyHtml += "<h2><b>" + n + "</b>" + esc(P.ex2) + "</h2>" + keys.map(function (k, i) { return "<p>" + (i + 1) + ". " + esc(k) + "</p>"; }).join("");
      n++;
    }
  }
  // 3. word ↔ translation
  if (d.hinted.length >= 4) {
    var pairs = shuffle(d.hinted.slice()).slice(0, 8), letters = "abcdefgh", right = shuffle(pairs.map(function (p, i) { return i; }));
    var m = '<div class="match">';
    pairs.forEach(function (p, i) {
      m += '<span class="n">' + (i + 1) + '.</span><span class="w">' + esc(p.w) + '</span><span class="blank"></span><span class="n">' + letters[i] + ')</span><span class="w">' + esc(pairs[right[i]].h) + "</span>";
    });
    body += "<h2><b>" + n + "</b>" + esc(P.ex3) + "</h2>" + m + "</div>";
    keyHtml += "<h2><b>" + n + "</b>" + esc(P.ex3) + "</h2><p>" + pairs.map(function (p, i) { return (i + 1) + " — " + letters[right.indexOf(i)] + " (" + esc(p.w) + " = " + esc(p.h) + ")"; }).join("<br>") + "</p>";
  }
  body += '<div class="key"><h1>' + esc(P.key) + "</h1><p class=\"sub\">" + esc(d.title) + "</p>" + keyHtml + "</div>";
  return printPage(d.title, body);
}
function buildCards(s) {
  var d = printSetData(s), P = PRINT_TXT[printLang];
  var body = "<h1>" + esc(P.cards) + " · " + esc(d.title) + '</h1><p class="sub">' + esc(P.cardsHelp) + '</p><div class="cards">';
  d.cats.forEach(function (c) {
    body += '<div class="cardp head" style="--c:' + c.color + ";--bg:" + c.color + '1f"><b>' + esc(c.name) + "</b></div>";
    c.words.forEach(function (x) { body += '<div class="cardp"><b>' + pw(x) + "</b>" + (printHints && x.h ? "<i>" + esc(x.h) + "</i>" : "") + "</div>"; });
  });
  return printPage(d.title, body + "</div>");
}
function printBox(s, playable) {
  return '<div class="printbox"><p class="lbl">' + esc(t("printT")) + "</p>" +
    '<div class="row"><label class="inline" for="prLang">' + esc(t("printLang")) + '</label><select id="prLang">' +
    [["en", "English"], ["ru", "Русский"], ["tr", "Türkçe"], ["me", "Crnogorski"]].map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === printLang ? " selected" : "") + ">" + l[1] + "</option>"; }).join("") + "</select></div>" +
    '<label class="check-row"><input type="checkbox" id="prHints"' + (printHints ? " checked" : "") + "><span>" + esc(t("printHints")) + "</span></label>" +
    '<div class="row"><button class="btn ghost small" type="button" id="prCards"' + (playable ? "" : " disabled") + ">" + esc(t("printCards")) + '</button><button class="btn ghost small" type="button" id="prSheet"' + (playable ? "" : " disabled") + ">" + esc(t("printSheet")) + "</button></div>" +
    '<p class="help">' + esc(t("printHelp")) + "</p></div>";
}
function wirePrintBox(s) {
  $("#prLang").onchange = function (e) { printLang = e.target.value; lsSet("bs.printLang", printLang); };
  $("#prHints").onchange = function (e) { printHints = e.target.checked; lsSet("bs.printHints", printHints ? "1" : "0"); };
  var name = safeName(s.title, "word-set");
  $("#prCards").onclick = function () { offerFile(name + " - cards.html", buildCards(s), null); };
  $("#prSheet").onclick = function () { offerFile(name + " - worksheet.html", buildWorksheet(s), null); };
}

function buildPage(data) {
  var css = $("#bs-css").textContent, js = $("#bs-js").textContent;
  var json = JSON.stringify(data).replace(/</g, "\\u003c");
  var sc = "script";
  return "<!doctype html>\n<html lang=\"ru\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n" +
    "<title>Bubble Sort</title>\n<style id=\"bs-fonts\">" + $("#bs-fonts").textContent + "</style>\n" +
    "<style id=\"bs-css\">" + css + "</style>\n</head>\n<body>\n<div id=\"app\"></div>\n" +
    "<" + sc + " type=\"application/json\" id=\"bs-data\">" + json + "</" + sc + ">\n" +
    "<" + sc + " src=\"" + PIXI_LOCAL + "\"></" + sc + ">\n" +
    "<" + sc + " id=\"bs-js\">" + js + "</" + sc + ">\n</body>\n</html>\n";
}

async function saveToDb() {
  var btn = $("#saveBtn"); btn.disabled = true; setStatus(t("saving"), "");
  try {
    leaveText();
    var saved = await dbMode.onSave(draftClean());
    var oldIdx = draft.findIndex(function (x) { return x.id === curId; });
    draft = saved.map(copyOf);
    curId = draft[Math.max(0, Math.min(oldIdx, draft.length - 1))] ? draft[Math.max(0, Math.min(oldIdx, draft.length - 1))].id : null;
    dirty = false; $("#teacherDot").hidden = true;
    statusMsg = { text: t("savedDb"), kind: "ok" };
    renderTeacher();
  } catch (e) {
    btn.disabled = false;
    setStatus(t("saveDbErr") + (e && e.message ? " (" + e.message + ")" : ""), "err");
  }
}
async function saveForStudents() {
  if (!draft) return;
  if (dbMode) return saveToDb();
  if (!artifactNS) { setStatus(t("saveNA"), "err"); return; }
  var html = buildPage({ version: 1, sets: draftClean() });
  var btn = $("#saveBtn"); btn.disabled = true; setStatus(t("saving"), "");
  stashDraft(); ssSet("bs.reopen", "1");
  try {
    await artifactNS.publish(html);
    setStatus(t("saved"), "ok");
  } catch (err) {
    var code = err && err.code;
    if (code === "conflict") { setStatus(t("saveConflict"), ""); return; }
    ssDel("bs.reopen");
    btn.disabled = false;
    if (code === "not_writer" || code === "not_granted" || code === "consent_required" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") setStatus(t("saveRO"), "err");
    else if (code === "rate_limited") setStatus(t("saveRate"), "err");
    else if (code === "too_large") setStatus(t("saveBig"), "err");
    else setStatus(t("saveErr"), "err");
  }
}

function restoreDraftIfAny() {
  var raw = ssGet("bs.draft"); if (!raw) return false;
  try {
    var obj = JSON.parse(raw);
    var d = obj.draft;
    d.forEach(function (s) { if (s._text != null) { s.cats = parseSetText(s._text).filter(function (c) { return !c.bad; }); delete s._text; } if (!Array.isArray(s.cats)) s.cats = []; });
    var same = JSON.stringify(d.map(cleanSet)) === JSON.stringify(SETS);
    if (same) { ssDel("bs.draft"); return false; }
    draft = d; curId = obj.curId; dirty = true; $("#teacherDot").hidden = false;
    return true;
  } catch (e) { ssDel("bs.draft"); return false; }
}

var capsChecked = false;
async function initCaps() {
  // the Claude runtime can appear late on phones: wait up to ~10 s for it
  for (var i = 0; !STANDALONE && i < 100 && !(window.claude && typeof window.claude.use === "function"); i++) await sleep(100);
  if (window.claude && typeof window.claude.use === "function") {
    var use = function (n) { return window.claude.use(n).catch(function () { return null; }); };
    var got = await Promise.all([use("artifact"), use("user"), use("sample"), use("downloads")]);
    artifactNS = got[0]; sampleNS = got[2]; downloadsNS = got[3];
    var u = got[1];
    if (u) {
      try { canEdit = !!(await u.canEdit()); } catch (e) { canEdit = false; }
      if (!canEdit) { try { canEdit = (await u.can("files.write")) === true; } catch (e) {} }
    }
  }
  capsChecked = true;
  var teacherMode = canEdit || location.hash === "#teacher";
  $("#teacherBtn").hidden = !teacherMode;
  if (!$("#home").hidden) renderHome();
  if (!$("#teacher").hidden) renderTeacher();
  if (!teacherMode) return;
  var restored = restoreDraftIfAny();
  var reopen = ssGet("bs.reopen") === "1"; ssDel("bs.reopen");
  if (reopen || restored) {
    statusMsg = restored ? { text: t("restored"), kind: "" } : { text: t("savedOk"), kind: "ok" };
    openTeacher();
  } else if (!$("#teacher").hidden) renderTeacher();
}

/* ─────────────── wiring ─────────────── */
$("#homeBtn").onclick = goHome;
$("#langSel").value = lang;
$("#langSel").onchange = function () {
  lang = this.value; lsSet("bs.lang", lang); applyStatic();
  if (!$("#home").hidden) renderHome();
  if (!$("#levels").hidden) renderLevels();
  if (app) app.canvas.setAttribute("aria-label", t("canvasLabel"));
  if (!$("#teacher").hidden) renderTeacher();
  if (G && !G.demo) renderHud();
  if (G && !G.demo && G.finished && !$("#result").hidden) { G.finished = false; finish(!!(G.doneCount === G.groups.length)); }
};
$("#soundBtn").setAttribute("aria-pressed", soundOn ? "true" : "false");
$("#soundBtn").onclick = function () { soundOn = !soundOn; lsSet("bs.sound", soundOn ? "1" : "0"); this.setAttribute("aria-pressed", soundOn ? "true" : "false"); tone(500, 800, 0.08); };
$("#teacherBtn").onclick = openTeacher;
$("#lensBtn").onclick = function () {
  if (!G || G.over || G.lens <= 0) return;
  if (G.selected) { var b = G.selected; select(null); useLens(b); return; }
  G.lensArmed = !G.lensArmed; $("#note").hidden = !G.lensArmed; renderHud();
};
$("#noteCancel").onclick = function () { if (G) G.lensArmed = false; $("#note").hidden = true; renderHud(); };
$("#magnetBtn").onclick = useMagnet;
$("#teacher").addEventListener("click", function (e) { if (e.target.id === "teacher") closeTeacher(); });
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { if (!$("#teacher").hidden) closeTeacher(); else if (G && G.selected) select(null); }
});
function onThemeChange() { readTheme(); if (G) G.bubbles.forEach(refreshBubble); }
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onThemeChange); } catch (e) {}
new MutationObserver(onThemeChange).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

applyStatic();
readTheme();
renderHome();
initPixi().then(function () {
  startDemo();
  var rz = null;
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (G && G.demo) startDemo(); }, 250); });
});
initCaps();

/* ── API for the site shell (teacher area) ── */
API.openWorkshop = function (opts) {
  dbMode = { onSave: opts.onSave, onClose: opts.onClose, usage: opts.usage || {}, uploadImage: opts.uploadImage || null };
  if (!(dirty && draft)) { draft = (opts.sets || []).map(copyOf); dirty = false; curId = null; }
  statusMsg = null;
  if (wsTab === "ai" && STANDALONE && !sampleNS) wsTab = "cards";
  goHome();
  openTeacher();
};
API.showJoin = function (opts) {
  if (CLASS) API.leaveClass(true);
  var onHome = !$("#home").hidden && (!G || G.demo);
  JOIN = opts;
  if (onHome) renderJoin(); else goHome();
};
API.enterClass = function (opts) {
  JOIN = null; CLASS = opts;
  LS_NS = "u" + String(opts.token || "").replace(/[^a-z0-9]/gi, "").slice(0, 10);
  SETS = opts.sets || [];
  primeProgress(opts.progress);
  lsSet("bs.lastClass", JSON.stringify({ code: opts.code, className: opts.className, student: opts.student }));
  goHome();
};
API.leaveClass = function (quiet) {
  if (!CLASS && !JOIN) return;
  CLASS = null; JOIN = null; LS_NS = ""; SETS = DEMO_SETS;
  if (!quiet) goHome();
};
if (/[?&]debug\b/.test(location.search)) window.__BS = { G: function () { return G; }, api: API, I18N: I18N, PRINT_TXT: PRINT_TXT };
API.isPlaying = function () { return !!(G && !G.demo && !G.over && $("#home").hidden); };
API.inClass = function () { return !!(CLASS || JOIN); };
API.closeWorkshop = function () { if (!$("#teacher").hidden) closeTeacher(true); };
API.isDirty = function () { return !!(dbMode && dirty); };
})();
return API;
}
