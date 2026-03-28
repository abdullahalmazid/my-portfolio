import { useState } from "react";

const css = `
  /* THEME TOGGLE BUTTON */
  .theme-toggle-wrap {
    position: fixed;
    bottom: 32px;
    right: 32px;
    z-index: 300;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  /* PALETTE PICKER PANEL */
  .palette-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--bg2);
    border: 1px solid var(--line);
    padding: 12px;
    opacity: 0;
    transform: translateY(8px) scale(0.97);
    pointer-events: none;
    transition: all 0.25s ease;
  }
  .palette-panel.open {
    opacity: 1;
    transform: none;
    pointer-events: all;
  }
  .palette-label {
    font-family: 'Syne Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .palette-swatches {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    max-width: 160px;
  }
  .palette-swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.2s, border-color 0.2s;
    position: relative;
  }
  .palette-swatch:hover { transform: scale(1.2); }
  .palette-swatch.active {
    border-color: var(--text);
    transform: scale(1.15);
  }
  .palette-swatch-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    overflow: hidden;
  }
  .swatch-half { flex: 1; }

  /* AUTO SHIFT INDICATOR */
  .auto-label {
    font-family: 'Syne Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .auto-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent2);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* TOGGLE BUTTONS ROW */
  .toggle-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  /* DARK/LIGHT BUTTON */
  .mode-btn {
    width: 40px;
    height: 40px;
    background: var(--bg2);
    border: 1px solid var(--line);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .mode-btn:hover {
    border-color: var(--accent);
    background: var(--bg3);
  }
  .mode-btn .icon {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .mode-btn.transitioning .icon {
    transform: rotate(90deg) scale(0);
    opacity: 0;
  }

  /* PALETTE TOGGLE BUTTON */
  .palette-btn {
    width: 40px;
    height: 40px;
    background: var(--bg2);
    border: 1px solid var(--line);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 0;
    overflow: hidden;
  }
  .palette-btn:hover { border-color: var(--accent); }
  .palette-btn.panel-open { border-color: var(--accent); }
  .palette-btn-preview {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    pointer-events: none;
  }

  @media (max-width: 480px) {
    .theme-toggle-wrap { bottom: 20px; right: 20px; }
  }
`;

export default function ThemeToggle({ mode, palette, paletteIndex, palettes, toggleMode, setPalette, isTransitioning }) {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <style>{css}</style>
      <div className="theme-toggle-wrap">

        {/* PALETTE PANEL */}
        <div className={`palette-panel ${panelOpen ? "open" : ""}`}>
          <div className="palette-label">Accent Color</div>
          <div className="palette-swatches">
            {palettes.map((p, i) => (
              <div
                key={i}
                className={`palette-swatch ${i === paletteIndex ? "active" : ""}`}
                title={p.label}
                onClick={() => setPalette(i)}
              >
                <div className="palette-swatch-inner">
                  <div className="swatch-half" style={{ background: p.accent }} />
                  <div className="swatch-half" style={{ background: p.accent2 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="auto-label">
            <div className="auto-dot" />
            Auto-shifts every 30 min
          </div>
        </div>

        {/* BUTTONS ROW */}
        <div className="toggle-row">

          {/* PALETTE PICKER BUTTON */}
          <button
            className={`palette-btn ${panelOpen ? "panel-open" : ""}`}
            onClick={() => setPanelOpen(o => !o)}
            title="Change accent color"
          >
            <div className="palette-btn-preview">
              <div style={{ flex: 1, background: palette.accent }} />
              <div style={{ flex: 1, background: palette.accent2 }} />
            </div>
          </button>

          {/* DARK / LIGHT TOGGLE */}
          <button
            className={`mode-btn ${isTransitioning ? "transitioning" : ""}`}
            onClick={toggleMode}
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="icon">
              {mode === "dark" ? "☀️" : "🌙"}
            </span>
          </button>

        </div>
      </div>
    </>
  );
}
