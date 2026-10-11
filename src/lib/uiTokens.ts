export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Caveat:wght@500;600;700&display=swap');`;

// ============================================================
// Ranglar: kunduzgi va tungi rejim.
// Komponentlar TOKENS.* orqali CSS o'zgaruvchilarini ishlatadi — rejim
// almashganda (html[data-theme]) butun interfeys qayta render bo'lmasdan
// o'zgaradi. Albom sahifalarining o'z ranglari bunga bog'liq emas.
// ============================================================

const LIGHT = {
  ink: "#1E2621",
  parchment: "#F2EDE2",
  parchmentDeep: "#E9E1D0",
  card: "#FBF8F0",
  field: "#FFFFFF",
  gold: "#B8863B",
  goldSoft: "#D9BC85",
  teal: "#2F4C48",
  tealSoft: "#5C7A73",
  ink60: "rgba(30,38,33,0.6)",
  ink40: "rgba(30,38,33,0.4)",
  danger: "#A8453A",
  navBg: "#1E2621",
  navFg: "#F2EDE2",
  bookCover: "#141915",
  bookCoverSoft: "#1E2621",
  paper: "#F4EDDD",
  paperShadow: "rgba(120,96,54,0.16)",
  tape: "rgba(217,188,133,0.55)",
};

const DARK: typeof LIGHT = {
  ink: "#ECE6D9",
  parchment: "#121715",
  parchmentDeep: "#2B332E",
  card: "#1A211E",
  field: "#202824",
  gold: "#D3A45A",
  goldSoft: "#BF9C62",
  teal: "#86B5AA",
  tealSoft: "#7E9C93",
  ink60: "rgba(236,230,217,0.64)",
  ink40: "rgba(236,230,217,0.42)",
  danger: "#E58A7C",
  navBg: "#0C100E",
  navFg: "#ECE6D9",
  bookCover: "#0C100E",
  bookCoverSoft: "#1A211E",
  paper: "#262E2A",
  paperShadow: "rgba(0,0,0,0.35)",
  tape: "rgba(211,164,90,0.45)",
};

const EDITOR_LIGHT = {
  ink: "#1E2621", ink2: "#3B3A36", muted: "rgba(30,38,33,0.58)", faint: "rgba(30,38,33,0.38)",
  line: "#E7E0D0", bg: "#EFEADF", stage: "#E6E0D3", card: "#FFFDF8",
  gold: "#B8863B", goldSoft: "#D9BC85", teal: "#2F4C48", danger: "#A8453A", select: "#B8863B",
};
const EDITOR_DARK: typeof EDITOR_LIGHT = {
  ink: "#ECE6D9", ink2: "#CFC8BA", muted: "rgba(236,230,217,0.62)", faint: "rgba(236,230,217,0.4)",
  line: "#2E3632", bg: "#101412", stage: "#0B0E0C", card: "#1A201D",
  gold: "#D3A45A", goldSoft: "#BF9C62", teal: "#86B5AA", danger: "#E58A7C", select: "#D3A45A",
};

type TokenName = keyof typeof LIGHT;
const varName = (k: string) => `--hl-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
const vars = (palette: Record<string, string>, prefix = "--hl-") =>
  Object.entries(palette).map(([k, v]) => `${varName(k).replace("--hl-", prefix)}:${v};`).join("");

export const TOKENS = {
  ...(Object.fromEntries(Object.keys(LIGHT).map((k) => [k, `var(${varName(k)})`])) as Record<TokenName, string>),
  handwriting: "'Caveat', cursive",
};

/** :root uchun ranglar; tungi rejim — html[data-theme="dark"]. */
export const THEME_CSS = `
:root{${vars(LIGHT)}${vars(EDITOR_LIGHT, "--he-")}color-scheme:light;}
html[data-theme="dark"]{${vars(DARK)}${vars(EDITOR_DARK, "--he-")}color-scheme:dark;}
html,body{background:var(--hl-parchment);color:var(--hl-ink);}
`;

export type ThemeMode = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "heirloom-theme";

/**
 * Sahifa chizilishidan oldin ishlaydigan kichik skript — saqlangan rejimni
 * qo'llaydi, shunda tungi rejimda oq "chaqnash" bo'lmaydi.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");document.documentElement.setAttribute("data-theme-mode",m);window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(e){if((localStorage.getItem("${THEME_STORAGE_KEY}")||"system")==="system")document.documentElement.setAttribute("data-theme",e.matches?"dark":"light");});}catch(e){}})();`;

export function applyThemeMode(mode: ThemeMode) {
  try { localStorage.setItem(THEME_STORAGE_KEY, mode); } catch { /* ignore */ }
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme-mode", mode);
}

export function readThemeMode(): ThemeMode {
  try {
    const m = localStorage.getItem(THEME_STORAGE_KEY);
    return m === "light" || m === "dark" ? m : "system";
  } catch {
    return "system";
  }
}

export const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 8,
  border: `1px solid ${TOKENS.parchmentDeep}`,
  background: TOKENS.field,
  fontSize: 13.5,
  color: TOKENS.ink,
  outline: "none",
  fontFamily: "Inter, sans-serif",
};
