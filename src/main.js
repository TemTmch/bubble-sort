import fontsCss from "./fonts.css?raw";
import "./styles.css";
import { startApp } from "./game.js";

// Fonts are embedded once: used by the page and copied into printable worksheets.
const style = document.createElement("style");
style.id = "bs-fonts";
style.textContent = fontsCss;
document.head.prepend(style);

const game = startApp();

// Tiny hash router: #/teacher (and returning e-mail sign-in links) open the teacher area,
// everything else shows the game.
const appEl = document.getElementById("app");
const teacherEl = document.getElementById("teacher-view");
function route() {
  const h = location.hash;
  const workshop = h.indexOf("#/teacher/sets") === 0;
  const teacher = !workshop && (h.indexOf("#/teacher") === 0 || /access_token=|error_description=/.test(h));
  appEl.hidden = teacher;
  teacherEl.hidden = !teacher;
  document.title = teacher || workshop ? "Bubble Sort · Teacher" : "Bubble Sort";
  if (!workshop) game.closeWorkshop();
  if (teacher) import("./teacher.js").then((m) => m.showTeacher(teacherEl));
  if (workshop) import("./teacher.js").then((m) => m.openSetsWorkshop(game));
}
// Unsaved changes in the workshop: ask before leaving the page.
window.addEventListener("beforeunload", (e) => { if (game.isDirty()) { e.preventDefault(); e.returnValue = ""; } });
window.addEventListener("hashchange", route);
route();
