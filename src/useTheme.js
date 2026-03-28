import { useState, useEffect, useCallback } from "react";

/* ============================================================
   THEMES
   ============================================================ */
export const THEMES = {
  dark: {
    name: "dark",
    "--bg":      "#0d0d0d",
    "--bg2":     "#141414",
    "--bg3":     "#1a1a1a",
    "--text":    "#e8e4dc",
    "--muted":   "#6b6760",
    "--line":    "#2a2a2a",
  },
  light: {
    name: "light",
    "--bg":      "#f5f1eb",
    "--bg2":     "#edeae3",
    "--bg3":     "#e5e1da",
    "--text":    "#1a1916",
    "--muted":   "#8a8680",
    "--line":    "#d5d1ca",
  },
};

/* ============================================================
   ACCENT COLOR PALETTES
   These shift automatically over time
   ============================================================ */
const ACCENT_PALETTES = [
  { accent: "#b8966e", accent2: "#8fb8a0", label: "Golden Sand" },   // your original
  { accent: "#a07850", accent2: "#7aa898", label: "Deep Amber" },
  { accent: "#c4a882", accent2: "#9ec4b0", label: "Warm Linen" },
  { accent: "#8fa8b8", accent2: "#b8966e", label: "Steel Blue" },
  { accent: "#a89070", accent2: "#90a870", label: "Olive Gold" },
  { accent: "#b87878", accent2: "#8fb8a0", label: "Muted Rose" },
  { accent: "#7890a8", accent2: "#a8b890", label: "Slate Teal" },
];

// How often accent shifts (in minutes)
const SHIFT_INTERVAL_MINUTES = 30;

/* ============================================================
   GET CURRENT PALETTE INDEX BASED ON TIME
   Changes every SHIFT_INTERVAL_MINUTES automatically
   ============================================================ */
function getTimedPaletteIndex() {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  return Math.floor(minutesSinceMidnight / SHIFT_INTERVAL_MINUTES) % ACCENT_PALETTES.length;
}

/* ============================================================
   APPLY THEME TO DOCUMENT
   ============================================================ */
function applyTheme(modeName, palette) {
  const mode = THEMES[modeName];
  const root = document.documentElement;

  // Apply mode colors
  Object.entries(mode).forEach(([key, val]) => {
    if (key !== "name") root.style.setProperty(key, val);
  });

  // Apply accent colors
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent2", palette.accent2);

  // Smooth transition on body
  document.body.style.transition = "background 0.6s ease, color 0.6s ease";
}

/* ============================================================
   MAIN HOOK
   ============================================================ */
export function useTheme() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("aam-theme") || "dark";
  });

  const [paletteIndex, setPaletteIndex] = useState(getTimedPaletteIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const palette = ACCENT_PALETTES[paletteIndex];

  // Apply theme whenever mode or palette changes
  useEffect(() => {
    applyTheme(mode, palette);
    localStorage.setItem("aam-theme", mode);
  }, [mode, palette]);

  // Auto-shift accent color every SHIFT_INTERVAL_MINUTES
  useEffect(() => {
    const check = () => {
      const newIndex = getTimedPaletteIndex();
      if (newIndex !== paletteIndex) {
        setIsTransitioning(true);
        setTimeout(() => {
          setPaletteIndex(newIndex);
          setIsTransitioning(false);
        }, 300);
      }
    };

    // Check every minute
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [paletteIndex]);

  const toggleMode = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(m => m === "dark" ? "light" : "dark");
      setIsTransitioning(false);
    }, 150);
  }, []);

  const setPalette = useCallback((index) => {
    setPaletteIndex(index);
  }, []);

  return {
    mode,
    palette,
    paletteIndex,
    palettes: ACCENT_PALETTES,
    isTransitioning,
    toggleMode,
    setPalette,
    isDark: mode === "dark",
  };
}
