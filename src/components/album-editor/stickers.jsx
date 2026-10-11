"use client";

import React from "react";
import {
  Leaf, Flower2, Heart, Star, Sun, Sparkles, Moon, Cloud, Gift, Cake, PartyPopper,
  Camera, Music, Crown, Umbrella, Snowflake, Smile, Feather, Plane, MapPin, Coffee, Anchor,
} from "lucide-react";

// ============================================================
// Scrapbook elementlari katalogi
// Har bir element SVG — istalgan o'lchamda tiniq, rangi o'zgartiriladi
// va eksportda ham aynan shunday chiqadi.
//   fit: "stretch" — element qutisiga to'liq cho'ziladi (lenta, qog'oz)
//   fit: "contain" — nisbatini saqlaydi (ikonka, gul)
// ============================================================

function shade(hex, amt) {
  const h = (hex || "#888888").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const TORN_TAPE = "M0,4 L4,0 L8,5 L12,1 L14,4 L186,2 L190,0 L193,5 L196,1 L200,4 L200,46 L196,50 L193,45 L190,49 L186,46 L14,48 L11,50 L8,45 L4,49 L0,46 Z";

function Tape({ color, uid, pattern }) {
  const pid = `tp-${uid}`;
  return (
    <svg viewBox="0 0 200 50" preserveAspectRatio="none" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        {pattern === "stripe" && (
          <pattern id={pid} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="rgba(255,255,255,0.5)" />
          </pattern>
        )}
        {pattern === "dots" && (
          <pattern id={pid} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="2.6" fill="rgba(255,255,255,0.65)" />
          </pattern>
        )}
        {pattern === "grid" && (
          <pattern id={pid} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0H0V12" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" />
          </pattern>
        )}
      </defs>
      <path d={TORN_TAPE} fill={color} opacity={pattern === "kraft" ? 0.92 : 0.8} />
      {pattern && pattern !== "kraft" && <path d={TORN_TAPE} fill={`url(#${pid})`} />}
      {pattern === "kraft" && <path d={TORN_TAPE} fill="rgba(255,255,255,0.08)" />}
    </svg>
  );
}

function svgBox(children, viewBox = "0 0 100 100", stretch = false) {
  return (
    <svg viewBox={viewBox} preserveAspectRatio={stretch ? "none" : "xMidYMid meet"} width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
      {children}
    </svg>
  );
}

function LucideSticker({ Icon, color }) {
  return <Icon width="100%" height="100%" color={color} strokeWidth={1.4} fill={color} fillOpacity={0.28} style={{ display: "block" }} />;
}

export const STICKER_GROUPS = [
  {
    id: "tape",
    label: "Lentalar",
    items: [
      { id: "tape-gold", name: "Oltin lenta", color: "#D9BC85", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} /> },
      { id: "tape-teal", name: "Teal lenta", color: "#5C7A73", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} /> },
      { id: "tape-blush", name: "Pushti lenta", color: "#E6C9BC", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} /> },
      { id: "tape-stripe", name: "Chiziqli lenta", color: "#B8863B", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} pattern="stripe" /> },
      { id: "tape-dots", name: "Nuqtali lenta", color: "#C97B84", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} pattern="dots" /> },
      { id: "tape-grid", name: "Katakli lenta", color: "#8CA6C0", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} pattern="grid" /> },
      { id: "tape-kraft", name: "Kraft lenta", color: "#C9A57A", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} pattern="kraft" /> },
      { id: "tape-clear", name: "Shaffof lenta", color: "#F2EDE2", aspect: 4, fit: "stretch", render: (p) => <Tape {...p} /> },
    ],
  },
  {
    id: "paper",
    label: "Qog'ozlar",
    items: [
      {
        id: "paper-note", name: "Yozuv qog'ozi", color: "#FBF8F0", aspect: 0.8, fit: "stretch",
        render: ({ color }) => svgBox(<>
          <rect x="0" y="0" width="100" height="125" fill={color} stroke="rgba(0,0,0,0.06)" />
          {[25, 40, 55, 70, 85, 100, 115].map((y) => <line key={y} x1="6" x2="94" y1={y} y2={y} stroke="rgba(62,92,118,0.28)" strokeWidth="0.8" />)}
          <line x1="14" x2="14" y1="0" y2="125" stroke="rgba(168,69,58,0.35)" strokeWidth="0.8" />
        </>, "0 0 100 125", true),
      },
      {
        id: "paper-torn", name: "Yirtiq qog'oz", color: "#F7F1E3", aspect: 3, fit: "stretch",
        render: ({ color }) => svgBox(
          <path d="M0,6 L8,2 L15,7 L24,1 L33,6 L41,2 L50,7 L60,1 L69,6 L78,2 L87,7 L95,2 L100,5 L100,29 L93,33 L85,28 L76,34 L67,29 L58,33 L49,28 L40,34 L31,29 L22,33 L13,28 L5,33 L0,29 Z" fill={color} stroke="rgba(0,0,0,0.05)" />,
          "0 0 100 35", true),
      },
      {
        id: "paper-sticky", name: "Stiker-qog'oz", color: "#F3DE8A", aspect: 1, fit: "stretch",
        render: ({ color }) => svgBox(<>
          <path d="M0,0 H100 V84 L84,100 H0 Z" fill={color} />
          <path d="M84,100 L84,84 L100,84 Z" fill={shade(color, -30)} />
        </>, "0 0 100 100", true),
      },
      {
        id: "paper-tag", name: "Kraft yorliq", color: "#C9A57A", aspect: 2, fit: "stretch",
        render: ({ color }) => svgBox(<>
          <path d="M18,0 H200 V100 H18 L0,50 Z" fill={color} />
          <circle cx="26" cy="50" r="7" fill="none" stroke={shade(color, -50)} strokeWidth="3" />
          <path d="M26,50 C10,40 4,20 -10,14" fill="none" stroke="#6B645A" strokeWidth="2" />
        </>, "0 0 200 100", true),
      },
      {
        id: "paper-ticket", name: "Chipta", color: "#E9A99A", aspect: 2.4, fit: "stretch",
        render: ({ color }) => svgBox(<>
          <path d="M0,0 H240 V38 A12,12 0 0 0 240,62 V100 H0 V62 A12,12 0 0 0 0,38 Z" fill={color} />
          <line x1="180" x2="180" y1="6" y2="94" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="14" y="14" width="152" height="72" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        </>, "0 0 240 100", true),
      },
      {
        id: "paper-banner", name: "Lentali banner", color: "#A8453A", aspect: 4, fit: "stretch",
        render: ({ color }) => svgBox(<>
          <path d="M0,10 L30,10 L30,50 L0,50 L10,30 Z" fill={shade(color, -35)} />
          <path d="M370,10 L400,10 L390,30 L400,50 L370,50 Z" fill={shade(color, -35)} />
          <rect x="22" y="0" width="356" height="44" fill={color} />
        </>, "0 0 400 54", true),
      },
    ],
  },
  {
    id: "nature",
    label: "Gullar va barglar",
    items: [
      {
        id: "flower-bloom", name: "Gul", color: "#C97B84", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="50" cy="28" rx="15" ry="24" fill={color} opacity="0.9" transform={`rotate(${a} 50 50)`} />)}
          <circle cx="50" cy="50" r="11" fill="#E8C468" />
          <circle cx="50" cy="50" r="5" fill={shade("#E8C468", -50)} />
        </>),
      },
      {
        id: "flower-daisy", name: "Romashka", color: "#FFFFFF", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<>
          {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => <ellipse key={a} cx="50" cy="24" rx="7" ry="20" fill={color} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" transform={`rotate(${a} 50 50)`} />)}
          <circle cx="50" cy="50" r="12" fill="#E8B23A" />
        </>),
      },
      {
        id: "flower-tulip", name: "Lola", color: "#A8453A", aspect: 0.6, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M30,160 C30,120 32,90 30,70" stroke="#4E6B4F" strokeWidth="4" fill="none" />
          <path d="M30,120 C10,110 4,95 6,84 C18,90 26,102 30,118" fill="#5C7A5E" />
          <path d="M8,30 C8,60 18,74 30,74 C42,74 52,60 52,30 L42,44 L30,22 L18,44 Z" fill={color} />
        </>, "0 0 60 160"),
      },
      {
        id: "leaf-branch", name: "Novda", color: "#5C7A5E", aspect: 0.5, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M50,195 C48,140 52,80 50,5" stroke={shade(color, -30)} strokeWidth="3" fill="none" />
          {[30, 60, 90, 120, 150].map((y, i) => (
            <g key={y}>
              <path d={`M50,${y + 10} C30,${y} 18,${y - 14} 14,${y - 26} C34,${y - 22} 46,${y - 8} 50,${y + 10}`} fill={color} opacity={0.85} />
              <path d={`M50,${y + 22} C70,${y + 12} 82,${y - 2} 86,${y - 14} C66,${y - 10} 54,${y + 4} 50,${y + 22}`} fill={shade(color, i % 2 ? 15 : -10)} opacity={0.85} />
            </g>
          ))}
        </>, "0 0 100 200"),
      },
      {
        id: "leaf-single", name: "Barg", color: "#2F4C48", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M10,90 C10,50 34,14 88,10 C90,50 66,84 22,88 Z" fill={color} opacity="0.85" />
          <path d="M14,86 C30,64 50,40 80,18" stroke={shade(color, 50)} strokeWidth="2" fill="none" />
        </>),
      },
      {
        id: "leaf-sprig", name: "Shoxcha", color: "#8FA89B", aspect: 1.6, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M5,50 C60,46 110,40 155,30" stroke={shade(color, -40)} strokeWidth="2.5" fill="none" />
          {[30, 60, 90, 120].map((x, i) => (
            <g key={x}>
              <ellipse cx={x} cy={44 - i * 3} rx="12" ry="5" transform={`rotate(-40 ${x} ${44 - i * 3})`} fill={color} />
              <ellipse cx={x + 8} cy={56 - i * 3} rx="12" ry="5" transform={`rotate(35 ${x + 8} ${56 - i * 3})`} fill={shade(color, -15)} />
            </g>
          ))}
        </>, "0 0 160 100"),
      },
      { id: "flower", name: "Gul (ikonka)", color: "#A8453A", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Flower2} color={color} /> },
      { id: "leaf", name: "Barg (ikonka)", color: "#2F4C48", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Leaf} color={color} /> },
    ],
  },
  {
    id: "shapes",
    label: "Shakllar va dudllar",
    items: [
      {
        id: "heart-solid", name: "Yurak", color: "#C0504D", aspect: 1.1, fit: "contain",
        render: ({ color }) => svgBox(<path d="M50,88 C20,66 4,48 4,30 C4,16 15,6 28,6 C38,6 46,12 50,20 C54,12 62,6 72,6 C85,6 96,16 96,30 C96,48 80,66 50,88 Z" fill={color} />, "0 0 100 92"),
      },
      {
        id: "star-solid", name: "Yulduz", color: "#E0B04A", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<path d="M50,4 L62,36 L96,38 L69,59 L79,93 L50,73 L21,93 L31,59 L4,38 L38,36 Z" fill={color} />),
      },
      {
        id: "sparkle", name: "Uchqun", color: "#B8863B", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M50,0 C54,36 64,46 100,50 C64,54 54,64 50,100 C46,64 36,54 0,50 C36,46 46,36 50,0 Z" fill={color} />
        </>),
      },
      { id: "circle-shape", name: "Doira", color: "#D9BC85", aspect: 1, fit: "stretch", render: ({ color }) => svgBox(<ellipse cx="50" cy="50" rx="50" ry="50" fill={color} opacity="0.9" />, "0 0 100 100", true) },
      { id: "square-shape", name: "To'rtburchak", color: "#5C7A73", aspect: 1, fit: "stretch", render: ({ color }) => svgBox(<rect x="0" y="0" width="100" height="100" rx="4" fill={color} opacity="0.9" />, "0 0 100 100", true) },
      { id: "triangle-shape", name: "Uchburchak", color: "#A8453A", aspect: 1.15, fit: "stretch", render: ({ color }) => svgBox(<path d="M50,0 L100,100 L0,100 Z" fill={color} opacity="0.9" />, "0 0 100 100", true) },
      {
        id: "blob", name: "Dog'", color: "#E6C9BC", aspect: 1.2, fit: "stretch",
        render: ({ color }) => svgBox(<path d="M60,4 C90,0 116,20 118,48 C120,78 96,98 64,96 C34,94 6,84 2,56 C-2,26 30,8 60,4 Z" fill={color} />, "0 0 120 100", true),
      },
      {
        id: "arrow-curve", name: "Egri strelka", color: "#1E2621", aspect: 1.6, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M8,70 C40,10 110,8 140,40" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <path d="M122,40 L142,42 L138,22" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>, "0 0 160 100"),
      },
      {
        id: "arrow-straight", name: "Strelka", color: "#1E2621", aspect: 3, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M6,26 C60,22 120,30 170,24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <path d="M152,12 L172,24 L154,38" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>, "0 0 180 50"),
      },
      {
        id: "doodle-circle", name: "Aylana dudl", color: "#A8453A", aspect: 1.4, fit: "stretch",
        render: ({ color }) => svgBox(<path d="M70,8 C110,6 136,24 136,50 C136,78 104,94 68,92 C30,90 4,74 6,48 C8,22 40,6 82,12 C100,14 112,20 120,28" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />, "0 0 140 100", true),
      },
      {
        id: "doodle-underline", name: "Tagiga chiziq", color: "#B8863B", aspect: 6, fit: "stretch",
        render: ({ color }) => svgBox(<path d="M4,22 C60,8 120,10 196,14 M20,30 C80,22 140,22 186,26" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />, "0 0 200 36", true),
      },
      {
        id: "doodle-squiggle", name: "To'lqin", color: "#2F4C48", aspect: 4, fit: "stretch",
        render: ({ color }) => svgBox(<path d="M4,20 Q19,4 34,20 T64,20 T94,20 T124,20 T154,20 T184,20" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />, "0 0 190 40", true),
      },
      {
        id: "doodle-hearts", name: "Kichik yuraklar", color: "#C0504D", aspect: 2, fit: "contain",
        render: ({ color }) => svgBox(<>
          {[[30, 40, 1], [90, 26, 0.7], [140, 50, 0.85]].map(([x, y, s], i) => (
            <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d="M0,24 C-14,14 -22,6 -22,-3 C-22,-10 -16,-15 -10,-15 C-5,-15 -1,-12 0,-8 C1,-12 5,-15 10,-15 C16,-15 22,-10 22,-3 C22,6 14,14 0,24 Z" fill="none" stroke={color} strokeWidth="2.6" />
          ))}
        </>, "0 0 180 90"),
      },
    ],
  },
  {
    id: "clips",
    label: "Biriktirgichlar",
    items: [
      {
        id: "pin", name: "Knopka", color: "#C0504D", aspect: 0.8, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M40,58 L36,96" stroke="#8A8F93" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="40" cy="56" rx="22" ry="7" fill={shade(color, -40)} />
          <path d="M26,54 C24,40 28,30 30,24 L50,24 C52,30 56,40 54,54 Z" fill={color} />
          <ellipse cx="40" cy="22" rx="20" ry="12" fill={shade(color, 20)} />
          <ellipse cx="34" cy="18" rx="6" ry="3" fill="rgba(255,255,255,0.5)" />
        </>, "0 0 80 100"),
      },
      {
        id: "clip", name: "Skrepka", color: "#9AA3A8", aspect: 0.4, fit: "contain",
        render: ({ color }) => svgBox(<path d="M28,30 L28,98 C28,112 12,112 12,98 L12,18 C12,-2 44,-2 44,18 L44,104 C44,126 4,126 4,104 L4,40" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />, "0 0 50 125"),
      },
      {
        id: "binder", name: "Qisqich", color: "#1E2621", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M30,46 C22,20 30,6 50,6 C70,6 78,20 70,46" fill="none" stroke="#B9BEC2" strokeWidth="4" />
          <path d="M14,44 H86 L80,94 H20 Z" fill={color} />
          <rect x="14" y="44" width="72" height="8" fill={shade(color, 30)} />
        </>),
      },
      {
        id: "stamp", name: "Pochta markasi", color: "#5C7A73", aspect: 0.82, fit: "stretch",
        render: ({ color, uid }) => svgBox(<>
          <defs>
            <mask id={`stm-${uid}`}>
              <rect x="0" y="0" width="82" height="100" fill="white" />
              {Array.from({ length: 9 }, (_, i) => <circle key={`t${i}`} cx={5 + i * 9} cy="0" r="3" fill="black" />)}
              {Array.from({ length: 9 }, (_, i) => <circle key={`b${i}`} cx={5 + i * 9} cy="100" r="3" fill="black" />)}
              {Array.from({ length: 11 }, (_, i) => <circle key={`l${i}`} cx="0" cy={5 + i * 9} r="3" fill="black" />)}
              {Array.from({ length: 11 }, (_, i) => <circle key={`r${i}`} cx="82" cy={5 + i * 9} r="3" fill="black" />)}
            </mask>
          </defs>
          <rect x="0" y="0" width="82" height="100" fill="#FBF8F0" mask={`url(#stm-${uid})`} />
          <rect x="9" y="9" width="64" height="66" fill={color} />
          <path d="M18,62 L32,40 L42,52 L52,34 L66,62 Z" fill={shade(color, 45)} />
          <circle cx="58" cy="24" r="6" fill="#E0B04A" />
          <text x="41" y="91" textAnchor="middle" fontFamily="'Special Elite', monospace" fontSize="9" fill="#3B3A36">HEIRLOOM</text>
        </>, "0 0 82 100", true),
      },
      {
        id: "seal", name: "Muhr", color: "#A8453A", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<>
          <path d="M50,4 C62,6 66,0 76,8 C84,14 92,14 94,26 C96,36 100,42 96,54 C92,64 96,72 86,82 C78,90 72,96 60,96 C50,96 44,100 34,94 C24,88 14,90 8,78 C2,68 4,60 4,50 C4,38 0,30 8,20 C16,10 22,10 30,6 C38,2 42,4 50,4 Z" fill={color} />
          <circle cx="50" cy="50" r="30" fill="none" stroke={shade(color, -35)} strokeWidth="3" />
          <path d="M50,34 L55,46 L68,47 L58,55 L61,68 L50,61 L39,68 L42,55 L32,47 L45,46 Z" fill={shade(color, -35)} />
        </>),
      },
      {
        id: "corner", name: "Burchak", color: "#1E2621", aspect: 1, fit: "contain",
        render: ({ color }) => svgBox(<path d="M0,0 H100 L0,100 Z" fill={color} opacity="0.9" />),
      },
    ],
  },
  {
    id: "icons",
    label: "Belgilar",
    items: [
      { id: "heart", name: "Yurak", color: "#A8453A", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Heart} color={color} /> },
      { id: "star", name: "Yulduz", color: "#B8863B", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Star} color={color} /> },
      { id: "sun", name: "Quyosh", color: "#B8863B", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Sun} color={color} /> },
      { id: "sparkles", name: "Yulduzcha", color: "#B8863B", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Sparkles} color={color} /> },
      { id: "moon", name: "Oy", color: "#2F4C48", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Moon} color={color} /> },
      { id: "cloud", name: "Bulut", color: "#5C7A73", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Cloud} color={color} /> },
      { id: "gift", name: "Sovg'a", color: "#A8453A", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Gift} color={color} /> },
      { id: "cake", name: "Tort", color: "#A8453A", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Cake} color={color} /> },
      { id: "party", name: "Bayram", color: "#B8863B", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={PartyPopper} color={color} /> },
      { id: "camera", name: "Kamera", color: "#1E2621", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Camera} color={color} /> },
      { id: "music", name: "Musiqa", color: "#2F4C48", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Music} color={color} /> },
      { id: "crown", name: "Toj", color: "#B8863B", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Crown} color={color} /> },
      { id: "umbrella", name: "Soyabon", color: "#5C7A73", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Umbrella} color={color} /> },
      { id: "snowflake", name: "Qor", color: "#5C7A73", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Snowflake} color={color} /> },
      { id: "smile", name: "Tabassum", color: "#B8863B", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Smile} color={color} /> },
      { id: "feather", name: "Pat", color: "#5C7A73", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Feather} color={color} /> },
      { id: "plane", name: "Samolyot", color: "#3E5C76", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Plane} color={color} /> },
      { id: "map-pin", name: "Joy", color: "#A8453A", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={MapPin} color={color} /> },
      { id: "coffee", name: "Qahva", color: "#6B4F3A", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Coffee} color={color} /> },
      { id: "anchor", name: "Langar", color: "#3E5C76", aspect: 1, fit: "contain", render: ({ color }) => <LucideSticker Icon={Anchor} color={color} /> },
    ],
  },
  {
    id: "words",
    label: "Qo'lyozma so'zlar",
    items: [
      ["word-love", "sevgi", "#A8453A"],
      ["word-memories", "xotiralar", "#2F4C48"],
      ["word-happy", "baxtli kunlar", "#B8863B"],
      ["word-family", "oilam", "#5C7A73"],
      ["word-travel", "sayohat", "#3E5C76"],
      ["word-forever", "abadiy", "#6E5A8A"],
    ].map(([id, word, color]) => ({
      id, name: `"${word}"`, color, aspect: Math.max(1.6, word.length * 0.55), fit: "contain",
      render: ({ color: c }) => svgBox(
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Caveat', cursive" fontWeight="700" fontSize="44" fill={c}>{word}</text>,
        `0 0 ${Math.max(90, word.length * 26)} 60`),
    })),
  },
];

export const STICKERS = STICKER_GROUPS.flatMap((g) => g.items.map((s) => ({ ...s, group: g.id })));
export const STICKER_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

export function stickerDef(id) {
  return STICKER_BY_ID[id] || STICKER_BY_ID["leaf"];
}

export function StickerArt({ stickerId, color, uid }) {
  const def = stickerDef(stickerId);
  return def.render({ color: color || def.color, uid: uid || stickerId });
}
