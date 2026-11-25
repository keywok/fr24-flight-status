// Writes FR24's flight/list.json status into the Status column of /data/aircraft/<reg>: into an empty cell, or over a
// page pill whose word differs from the API's (the page's own status often stops at "estimated" on a landed leg).
// Every Status pill, FR24's and ours, is coloured by its word in the OnFinals palette.
// Self-check: node content.js

const MARK = "data-fr24-flight-status";
// OnFinals tokens (client/src/lib/ui/tokens.css): --ok, --warn, --err; any other word --text-muted.
const HUE = { landed: "#63cda8", estimated: "#ed9e51", delayed: "#ed9e51", diverted: "#e05561", canceled: "#e05561" };
const SCHEDULED = "#528bff"; // --accent, filled: the one pill that is not a tint, so a scheduled leg stands out

// The status word of a pill: "Est. dep. 11:47Estimated dep. 11:47" -> "estimated", "Landed 16:01" -> "landed".
function pageWord(text) {
  const w = (text.trim().match(/^[A-Za-z]+/) || [""])[0].toLowerCase();
  return w === "est" ? "estimated" : w;
}

// {bg, dot, text} of a pill with status word `word`, on FR24's light page.
function colours(word) {
  if (word === "scheduled") return { bg: SCHEDULED, dot: "#fff", text: "#fff" };
  const c = HUE[word] || "#abb2bf";
  return { bg: `color-mix(in srgb, ${c} 22%, white)`, dot: c, text: `color-mix(in srgb, ${c} 60%, black)` };
}

function paint(box) {
  const c = colours(pageWord(box.textContent));
  box.style.background = c.bg;
  for (const s of box.querySelectorAll("span")) {
    if (s.getAttribute("aria-hidden") === "true") s.style.background = c.dot;
    else s.style.color = c.text;
  }
}

// {hex flight id: status} of a flight/list.json answer. Unflown flights share an empty or repeated id, so an id that
// appears twice maps to nothing rather than to whichever flight came last.
function index(rows) {
  const by = {};
  for (const a of rows) {
    const id = a.identification && a.identification.id;
    if (id) by[id] = id in by ? null : a.status;
  }
  return by;
}

function pill(status) {
  const box = document.createElement("div");
  box.className = "inline-flex h-[25px] items-center gap-1.5 rounded-radius-full px-s py-xs";
  box.setAttribute(MARK, "");
  box.title = "From FR24 flight/list.json";
  const dot = document.createElement("span");
  dot.className = "inline-flex shrink-0 rounded-radius-full size-s";
  dot.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "min-w-0 overflow-x-auto whitespace-nowrap text-sm";
  label.textContent = status.text;
  box.append(dot, label);
  return box;
}

let reg = "";
let byId = null;

async function load(r) {
  reg = r;
  byId = null;
  // Anonymous: FR24 answers the last 7 days of flights, older rows keep the page's own status.
  const url = `https://api.flightradar24.com/common/v1/flight/list.json?query=${encodeURIComponent(r)}` +
    "&fetchBy=reg&limit=100&page=1";
  try {
    const got = index((await (await fetch(url)).json()).result.response.data || []);
    if (reg === r) byId = got;
  } catch (e) {
    console.warn("FR24 Flight Status: no answer for", r, e); // one ask a registration a page view, no retry loop
  }
  apply();
}

function apply() {
  const m = location.pathname.match(/^\/data\/aircraft\/([^/]+)/);
  if (!m) return;
  const r = m[1].toLowerCase();
  if (r !== reg) load(r);
  for (const row of document.querySelectorAll("article[data-flight-id]")) {
    const cell = row.querySelector(':scope > div.lg\\:flex > div[class*="w-[140px]"]');
    if (!cell) continue;
    const play = row.querySelector('a[href*="/data/playback/"]');
    const status = byId && play && byId[play.pathname.split("/").pop()];
    let box = cell.querySelector(`[${MARK}]`);
    if (!box && status) {
      const page = cell.firstElementChild;
      if (!page || pageWord(page.textContent) !== status.generic.status.text) {
        if (page) page.style.display = "none"; // hidden, not removed: the page's framework still owns that node
        box = pill(status);
        cell.append(box);
      }
    }
    box = box || cell.firstElementChild;
    if (box) paint(box);
  }
}

if (typeof document === "undefined") {
  const assert = require("assert");
  assert.equal(pageWord("Est. dep. 11:47Estimated dep. 11:47"), "estimated");
  assert.equal(pageWord("Landed 16:01"), "landed");
  assert.equal(pageWord("Diverted to CEK"), "diverted");
  assert.equal(pageWord(""), "");
  assert.equal(colours("landed").dot, "#63cda8");
  assert.equal(colours("delayed").dot, colours("estimated").dot, "not settled reads one orange");
  assert.equal(colours("unknown").dot, "#abb2bf");
  const fills = ["landed", "estimated", "delayed", "diverted", "canceled", "unknown", "x"].map((w) => colours(w).bg);
  assert.ok(!fills.includes(colours("scheduled").bg), "scheduled's fill is its own");
  const s = (t) => ({ text: t });
  const by = index([
    { identification: { id: "a1" }, status: s("Landed 10:00") },
    { identification: { id: "" }, status: s("Scheduled") },
    { identification: { id: "b2" }, status: s("x") },
    { identification: { id: "b2" }, status: s("y") },
    { identification: { id: "b2" }, status: s("z") },
  ]);
  assert.equal(by.a1.text, "Landed 10:00");
  assert.equal(by.b2, null, "an id seen three times still matches nothing");
  assert.ok(!("" in by), "an empty id is never a key");
  console.log("ok");
} else {
  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(apply, 300);
  }).observe(document.body, { childList: true, subtree: true });
  apply();
}
