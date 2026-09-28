import fontsCss from "./fonts.css?raw";
import "./styles.css";
import { startApp } from "./game.js";

// Fonts are embedded once: used by the page and copied into printable worksheets.
const style = document.createElement("style");
style.id = "bs-fonts";
style.textContent = fontsCss;
document.head.prepend(style);

startApp();
