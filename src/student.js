/* Pupil side: #/c/CODE → join the class with a first name, play its word sets,
   progress is saved to the server (with a retry queue for when the connection drops). */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

async function rpc(fn, args) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
  } catch (e) { const err = new Error("network"); err.network = true; throw err; }
  const text = await res.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
  if (!res.ok) { const err = new Error((body && body.message) || "http_" + res.status); err.status = res.status; throw err; }
  return body;
}

const cleanCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const pendKey = (tok) => "bs.pending." + tok;
let current = null; // code being opened, to ignore stale async results

function queue(tok, item) {
  let list = []; try { list = JSON.parse(ls.get(pendKey(tok)) || "[]"); } catch (e) {}
  list = list.filter((x) => !(x.set === item.set && x.kind === item.kind));
  list.push(item); ls.set(pendKey(tok), JSON.stringify(list));
}
async function flush(tok) {
  let list = []; try { list = JSON.parse(ls.get(pendKey(tok)) || "[]"); } catch (e) {}
  if (!list.length) return;
  const left = [];
  for (const it of list) {
    try { await send(tok, it); } catch (e) { if (e.network || e.status >= 500) left.push(it); }
  }
  if (left.length) ls.set(pendKey(tok), JSON.stringify(left)); else ls.del(pendKey(tok));
}
function send(tok, it) {
  return rpc("save_progress", { p_token: tok, p_set: it.set, p_kind: it.kind, p_level: it.level, p_stars: it.stars, p_misses: it.misses });
}
function push(tok, setId, kind, data) {
  const it = { set: setId, kind, level: data.level, stars: data.stars, misses: data.misses };
  send(tok, it).then(() => flush(tok)).catch((e) => { if (e.network || e.status >= 500) queue(tok, it); });
}

export async function openClass(game, rawCode) {
  const code = cleanCode(rawCode);
  current = code;
  const tokKey = "bs.token." + code;
  const retry = () => openClass(game, code);
  const enter = (tok, st) => {
    if (current !== code) return;
    flush(tok);
    game.enterClass({
      code, token: tok, className: st.class, student: st.student, sets: st.sets || [], progress: st.progress || [],
      onProgress: (setId, kind, data) => push(tok, setId, kind, data),
      onForget: () => { ls.del(tokKey); ls.del("bs.lastClass"); openClass(game, code); }
    });
  };
  game.showJoin({ state: "loading", code });
  try {
    const tok = ls.get(tokKey);
    if (tok) {
      const st = await rpc("student_state", { p_token: tok });
      if (st) return enter(tok, st);
      ls.del(tokKey);
    }
    const pv = await rpc("class_preview", { p_code: code });
    if (current !== code) return;
    if (!pv) { game.showJoin({ state: "notfound", code }); return; }
    const join = async (name) => {
      try {
        const r = await rpc("join_class", { p_code: code, p_name: name });
        ls.set(tokKey, r.token);
        const st = await rpc("student_state", { p_token: r.token });
        if (st) enter(r.token, st); else game.showJoin({ state: "notfound", code });
      } catch (e) {
        if (/class_not_found/.test(e.message)) game.showJoin({ state: "notfound", code });
        else game.showJoin({ state: "name", code, className: pv.name, onJoin: join, errorKey: e.network || e.status >= 500 ? "netErr" : "badName" });
      }
    };
    game.showJoin({ state: "name", code, className: pv.name, onJoin: join });
  } catch (e) {
    if (current !== code) return;
    game.showJoin({ state: "neterr", code, onRetry: retry });
  }
}
