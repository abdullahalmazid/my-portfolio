import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* ============================================================
   FONT OPTIONS
   ============================================================ */
export const SERIF_FONTS = [
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif",    import: "Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400" },
  { label: "Playfair Display",   value: "'Playfair Display', Georgia, serif",       import: "Playfair+Display:ital,wght@0,400;0,700;1,400" },
  { label: "Lora",               value: "'Lora', Georgia, serif",                  import: "Lora:ital,wght@0,400;0,600;1,400" },
  { label: "DM Serif Display",   value: "'DM Serif Display', Georgia, serif",       import: "DM+Serif+Display:ital@0;1" },
  { label: "Libre Baskerville",  value: "'Libre Baskerville', Georgia, serif",      import: "Libre+Baskerville:ital,wght@0,400;0,700;1,400" },
  { label: "Crimson Text",       value: "'Crimson Text', Georgia, serif",           import: "Crimson+Text:ital,wght@0,400;0,600;1,400" },
];

export const MONO_FONTS = [
  { label: "Syne Mono",       value: "'Syne Mono', monospace",       import: "Syne+Mono" },
  { label: "DM Mono",         value: "'DM Mono', monospace",         import: "DM+Mono:wght@300;400;500" },
  { label: "JetBrains Mono",  value: "'JetBrains Mono', monospace",  import: "JetBrains+Mono:wght@300;400;500" },
  { label: "Fira Code",       value: "'Fira Code', monospace",       import: "Fira+Code:wght@300;400;500" },
  { label: "IBM Plex Mono",   value: "'IBM Plex Mono', monospace",   import: "IBM+Plex+Mono:wght@300;400;500" },
  { label: "Space Mono",      value: "'Space Mono', monospace",      import: "Space+Mono:wght@400;700" },
];

/* ============================================================
   ACCENT PALETTES
   ============================================================ */
export const PALETTES = [
  { label: "Golden Sand",  accent: "#b8966e", accent2: "#8fb8a0" },
  { label: "Deep Amber",   accent: "#a07850", accent2: "#7aa898" },
  { label: "Warm Linen",   accent: "#c4a882", accent2: "#9ec4b0" },
  { label: "Steel Blue",   accent: "#8fa8b8", accent2: "#b8966e" },
  { label: "Olive Gold",   accent: "#a89070", accent2: "#90a870" },
  { label: "Muted Rose",   accent: "#b87878", accent2: "#8fb8a0" },
  { label: "Slate Teal",   accent: "#7890a8", accent2: "#a8b890" },
  { label: "Custom",       accent: "#b8966e", accent2: "#8fb8a0" }, // user sets manually
];

/* ============================================================
   THEME MODES
   ============================================================ */
export const MODES = {
  dark: {
    "--bg":    "#0d0d0d",
    "--bg2":   "#141414",
    "--bg3":   "#1a1a1a",
    "--text":  "#e8e4dc",
    "--muted": "#6b6760",
    "--line":  "#2a2a2a",
  },
  light: {
    "--bg":    "#f5f1eb",
    "--bg2":   "#edeae3",
    "--bg3":   "#e5e1da",
    "--text":  "#1a1916",
    "--muted": "#8a8680",
    "--line":  "#d5d1ca",
  },
};

/* ============================================================
   DEFAULT APPEARANCE
   ============================================================ */
export const DEFAULT_APPEARANCE = {
  // Portfolio
  portfolio_mode:        "dark",
  portfolio_palette:     0,
  portfolio_serif:       0,
  portfolio_mono:        0,
  portfolio_accent:      "#b8966e",
  portfolio_accent2:     "#8fb8a0",

  // Admin
  admin_mode:            "dark",
  admin_palette:         0,
  admin_serif:           0,
  admin_mono:            0,
  admin_accent:          "#b8966e",
  admin_accent2:         "#8fb8a0",
};

/* ============================================================
   APPLY APPEARANCE TO AN ELEMENT
   ============================================================ */
export function applyAppearance(el, appearance, scope = "portfolio") {
  const mode       = appearance[`${scope}_mode`] || "dark";
  const paletteIdx = appearance[`${scope}_palette`] ?? 0;
  const serifIdx   = appearance[`${scope}_serif`] ?? 0;
  const monoIdx    = appearance[`${scope}_mono`] ?? 0;

  const palette = PALETTES[paletteIdx] || PALETTES[0];
  const serif   = SERIF_FONTS[serifIdx] || SERIF_FONTS[0];
  const mono    = MONO_FONTS[monoIdx]   || MONO_FONTS[0];

  // Use custom accent if palette is "Custom"
  const accent  = paletteIdx === 7 ? (appearance[`${scope}_accent`]  || palette.accent)  : palette.accent;
  const accent2 = paletteIdx === 7 ? (appearance[`${scope}_accent2`] || palette.accent2) : palette.accent2;

  // Mode colors
  const modeVars = MODES[mode] || MODES.dark;
  Object.entries(modeVars).forEach(([k, v]) => el.style.setProperty(k, v));

  // Accent
  el.style.setProperty("--accent",  accent);
  el.style.setProperty("--accent2", accent2);

  // Fonts
  el.style.setProperty("--serif", serif.value);
  el.style.setProperty("--mono",  mono.value);

  // Inject Google Fonts if needed
  injectFont(serif.import);
  injectFont(mono.import);
}

/* ============================================================
   INJECT GOOGLE FONT LINK (avoids duplicates)
   ============================================================ */
const injectedFonts = new Set();
function injectFont(importStr) {
  if (!importStr || injectedFonts.has(importStr)) return;
  injectedFonts.add(importStr);
  const link = document.createElement("link");
  link.rel  = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${importStr}&display=swap`;
  document.head.appendChild(link);
}

/* ============================================================
   HOOK: useAppearance
   Loads from Firebase, provides update function
   ============================================================ */
export function useAppearance() {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "appearance", "main"));
        if (snap.exists()) {
          setAppearance({ ...DEFAULT_APPEARANCE, ...snap.data() });
        }
      } catch (e) { console.error("Appearance load error:", e); }
      setLoaded(true);
    };
    load();
  }, []);

  const saveAppearance = useCallback(async (newApp) => {
    try {
      await setDoc(doc(db, "appearance", "main"), newApp);
      setAppearance(newApp);
    } catch (e) { console.error("Appearance save error:", e); }
  }, []);

  return { appearance, saveAppearance, loaded };
}
