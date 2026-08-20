export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Caveat:wght@500;600;700&display=swap');`;

export const TOKENS = {
  ink: "#1E2621",
  parchment: "#F2EDE2",
  parchmentDeep: "#E9E1D0",
  card: "#FBF8F0",
  gold: "#B8863B",
  goldSoft: "#D9BC85",
  teal: "#2F4C48",
  tealSoft: "#5C7A73",
  ink60: "rgba(30,38,33,0.6)",
  ink40: "rgba(30,38,33,0.4)",
  danger: "#A8453A",
  // Scrapbook / album-spread specific tokens
  bookCover: "#141915",
  bookCoverSoft: "#1E2621",
  paper: "#F4EDDD",
  paperShadow: "rgba(120,96,54,0.16)",
  tape: "rgba(217,188,133,0.55)",
  handwriting: "'Caveat', cursive",
};

export const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 8,
  border: `1px solid ${TOKENS.parchmentDeep}`,
  background: "#fff",
  fontSize: 13.5,
  color: TOKENS.ink,
  outline: "none",
  fontFamily: "Inter, sans-serif",
};
