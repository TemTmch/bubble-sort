import { defineConfig } from "vite";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

// Offline mode: after the build, write dist/sw.js with the list of every built file to pre-cache.
const serviceWorker = {
  name: "service-worker",
  apply: "build",
  closeBundle() {
    const dist = "dist", files = [];
    const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); });
    walk(dist);
    const list = files.map((p) => relative(dist, p).split("\\").join("/")).filter((p) => p !== "sw.js" && !p.endsWith(".map")).sort();
    const hash = createHash("sha256");
    list.forEach((p) => hash.update(p).update(readFileSync(join(dist, p))));
    const precache = ["./"].concat(list);
    const src = readFileSync("sw/sw.js", "utf8").replace("__VERSION__", hash.digest("hex").slice(0, 12)).replace("__PRECACHE__", JSON.stringify(precache));
    writeFileSync(join(dist, "sw.js"), src);
  }
};

// SheetJS 0.18.5 (the last npm release) decodes XML character references with String.fromCharCode,
// which breaks emoji written as &#128054; (openpyxl and some other tools do that). Patch it to fromCodePoint.
const sheetjsEmojiFix = {
  name: "sheetjs-emoji-fix",
  transform(code, id) {
    if (!/[\\/]xlsx[\\/]xlsx\.m?js$/.test(id)) return null;
    const from = 'String.fromCharCode(parseInt($1,$$.indexOf("x")>-1?16:10))';
    const out = code.split(from).join(from.replace("fromCharCode", "fromCodePoint"));
    return out === code ? null : { code: out, map: null };
  }
};

// Relative base so the site works at https://<user>.github.io/bubble-sort/ and on any custom domain.
export default defineConfig({
  base: "./",
  plugins: [sheetjsEmojiFix, serviceWorker],
  build: { target: "es2019", chunkSizeWarningLimit: 1500 }
});
