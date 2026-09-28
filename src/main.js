import fontsCss from "./fonts.css?raw";
import "./styles.css";
import { startApp } from "./game.js";

// Fonts are embedded once: used by the page and copied into printable worksheets.
const style = document.createElement("style");
style.id = "bs-fonts";
style.textContent = fontsCss;
document.head.prepend(style);

startApp();

// Tiny hash router: #/teacher (and returning e-mail sign-in links) open the teacher area,
// everything else shows the game.
const appEl = document.getElementById("app");
const teacherEl = document.getElementById("teacher-view");
function route() {
  const h = location.hash;
  const teacher = h.indexOf("#/teacher") === 0 || /access_token=|error_description=/.test(h);
  appEl.hidden = teacher;
  teacherEl.hidden = !teacher;
  document.title = teacher ? "Bubble Sort · Teacher" : "Bubble Sort";
  if (teacher) import("./teacher.js").then((m) => m.showTeacher(teacherEl));
}
window.addEventListener("hashchange", route);
route();
