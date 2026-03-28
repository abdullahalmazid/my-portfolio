import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  applyAppearance,
  MONO_FONTS,
  PALETTES,
  SERIF_FONTS,
} from "../useAppearance";

/* ============================================================
   CLOUDINARY
   ============================================================ */
const CLOUDINARY_CLOUD = "dg9i2qg1c";
const CLOUDINARY_PRESET = "portfolio_upload";

async function uploadToCloudinary(file, onProgress) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("folder", "portfolio");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const r = JSON.parse(xhr.responseText);
      r.secure_url ? resolve(r.secure_url) : reject();
    };
    xhr.onerror = reject;
    xhr.send(fd);
  });
}

/* ============================================================
   CSS
   ============================================================ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .admin-root{
    background:var(--bg);color:var(--text);
    font-family:var(--mono);font-size:13px;line-height:1.6;min-height:100vh;
  }
  .admin-root ::-webkit-scrollbar{width:3px}
  .admin-root ::-webkit-scrollbar-thumb{background:var(--accent)}

  .shell{display:flex;min-height:100vh}

  /* SIDEBAR */
  .sb{width:240px;background:var(--bg2);border-right:1px solid var(--line);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:10;overflow-y:auto;transition:background 0.4s,border-color 0.4s}
  .sb-head{padding:24px 20px;border-bottom:1px solid var(--line)}
  .sb-logo{font-family:var(--serif);font-size:24px;color:var(--accent);letter-spacing:-0.5px;transition:color 0.4s}
  .sb-sub{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .sb-user{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}
  .sb-avatar{width:32px;height:32px;border-radius:50%;background:var(--accent);color:#000;display:flex;align-items:center;justify-content:center;font-size:13px;font-family:var(--serif);font-style:italic;flex-shrink:0;transition:background 0.4s}
  .sb-email{font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sb-section{padding:12px 0}
  .sb-section-title{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);padding:8px 20px 6px}
  .sb-item{display:flex;align-items:center;gap:10px;padding:10px 20px;color:var(--muted);cursor:pointer;font-size:12px;letter-spacing:0.04em;border-left:2px solid transparent;background:none;border-right:none;border-top:none;border-bottom:none;width:100%;text-align:left;transition:all 0.18s;font-family:var(--mono)}
  .sb-item:hover{color:var(--text);background:var(--bg3)}
  .sb-item.active{color:var(--accent);border-left-color:var(--accent);background:var(--bg3)}
  .sb-icon{font-size:15px;width:18px;text-align:center;flex-shrink:0}
  .sb-badge{margin-left:auto;background:var(--bg3);color:var(--muted);font-size:9px;padding:2px 7px}
  .sb-item.active .sb-badge{background:var(--accent);color:#000}
  .sb-footer{margin-top:auto;padding:16px 20px;border-top:1px solid var(--line)}
  .sb-logout{width:100%;padding:9px;background:none;border:1px solid var(--line);color:var(--muted);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;font-family:var(--mono)}
  .sb-logout:hover{border-color:#c47070;color:#c47070}

  /* MAIN */
  .main{margin-left:240px;flex:1;display:flex;flex-direction:column;min-height:100vh}
  .topbar{position:sticky;top:0;z-index:9;background:rgba(13,13,13,0.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:16px 36px;display:flex;align-items:center;gap:16px}
  .topbar-title{font-family:var(--serif);font-size:22px;font-weight:300;flex:1}
  .topbar-title em{font-style:italic;color:var(--accent)}
  .topbar-sub{font-size:11px;color:var(--muted);margin-top:2px}
  .topbar-link{font-size:10px;color:var(--muted);letter-spacing:0.08em;text-decoration:none;white-space:nowrap}
  .topbar-link:hover{color:var(--accent)}
  .content{padding:32px 36px;flex:1}

  /* STATS */
  .stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-bottom:32px}
  .stat-card{background:var(--bg2);padding:22px 24px;border-left:2px solid transparent;transition:border-color 0.2s,background 0.4s}
  .stat-card:hover{border-left-color:var(--accent)}
  .stat-num{font-family:var(--serif);font-size:38px;color:var(--accent);line-height:1;transition:color 0.4s}
  .stat-lbl{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-top:6px}

  /* SEC */
  .sec-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--line)}
  .sec-title{font-family:var(--serif);font-size:20px;font-weight:300}
  .sec-sub{font-size:11px;color:var(--muted);margin-top:3px}

  /* BUTTONS */
  .btn-primary{padding:9px 22px;background:var(--accent);border:1px solid var(--accent);color:#000;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;font-family:var(--mono)}
  .btn-primary:hover{background:transparent;color:var(--accent)}
  .btn-ghost{padding:9px 22px;background:none;border:1px solid var(--line);color:var(--muted);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;font-family:var(--mono)}
  .btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
  .btn-danger{padding:6px 14px;background:none;border:1px solid var(--line);color:var(--muted);font-size:10px;cursor:pointer;transition:all 0.2s;font-family:var(--mono)}
  .btn-danger:hover{border-color:#c47070;color:#c47070}
  .btn-edit{padding:6px 14px;background:none;border:1px solid var(--line);color:var(--muted);font-size:10px;cursor:pointer;transition:all 0.2s;font-family:var(--mono)}
  .btn-edit:hover{border-color:var(--accent2);color:var(--accent2)}
  .btn-sm{padding:6px 14px;font-size:10px}
  .admin-root button:disabled{opacity:0.4;cursor:not-allowed}

  /* TABLE */
  .tbl{width:100%;border-collapse:collapse}
  .tbl th{text-align:left;padding:10px 14px;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line);font-weight:normal}
  .tbl td{padding:12px 14px;border-bottom:1px solid var(--line);font-size:12px;vertical-align:middle}
  .tbl tr:hover td{background:var(--bg2)}
  .tbl-img{width:52px;height:40px;object-fit:cover;display:block;filter:brightness(0.85)}
  .tbl-img-ph{width:52px;height:40px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--line)}
  .tbl-actions{display:flex;gap:6px}
  .chip{display:inline-block;padding:2px 8px;border:1px solid var(--line);font-size:9px;color:var(--muted);margin:2px}
  .chip.accent{border-color:rgba(184,150,110,0.3);color:var(--accent)}

  /* GALLERY */
  .gallery-manage{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:4px}
  .gallery-item{position:relative;aspect-ratio:1;overflow:hidden;background:var(--bg3);cursor:pointer}
  .gallery-item img{width:100%;height:100%;object-fit:cover;filter:brightness(0.85);transition:all 0.3s;display:block}
  .gallery-item:hover img{filter:brightness(1.0);transform:scale(1.04)}
  .gallery-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;gap:8px;opacity:0;transition:opacity 0.2s}
  .gallery-item:hover .gallery-overlay{opacity:1}
  .gallery-caption-bar{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));padding:16px 10px 8px;font-size:10px;color:#fff}

  /* FORM */
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .form-grid.single{grid-template-columns:1fr}
  .field{display:flex;flex-direction:column;gap:6px}
  .field.full{grid-column:1/-1}
  .field label{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted)}
  .field input,.field textarea,.field select{background:var(--bg3);border:1px solid var(--line);padding:10px 14px;color:var(--text);font-size:13px;outline:none;transition:border-color 0.2s;width:100%;font-family:var(--mono)}
  .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--accent)}
  .field select option{background:var(--bg2)}
  .field textarea{resize:vertical;min-height:90px}

  /* UPLOADER */
  .uploader{display:flex;flex-direction:column;gap:8px}
  .upload-zone{border:1px dashed var(--line);padding:20px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;transition:border-color 0.2s;background:var(--bg3);position:relative;min-height:120px;justify-content:center}
  .upload-zone:hover{border-color:var(--accent)}
  .upload-zone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
  .upload-preview{width:100%;max-height:180px;object-fit:cover;display:block}
  .upload-label{font-size:11px;color:var(--muted);text-align:center}
  .upload-label span{color:var(--accent)}
  .upload-bar{width:100%;height:2px;background:var(--line);overflow:hidden}
  .upload-bar-fill{height:100%;background:var(--accent);transition:width 0.2s}
  .upload-status{font-size:10px;color:var(--accent2)}

  /* MODAL */
  .admin-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:adm-fi 0.18s ease}
  .admin-modal{background:var(--bg2);width:100%;max-width:580px;max-height:92vh;overflow-y:auto;border:1px solid var(--line);position:relative;z-index:100000;animation:adm-su 0.22s ease}
  .modal-head{padding:20px 26px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--bg2);z-index:1}
  .modal-head-title{font-family:var(--serif);font-size:20px}
  .modal-x{background:none;border:1px solid var(--line);color:var(--muted);width:28px;height:28px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
  .modal-x:hover{border-color:var(--accent);color:var(--accent)}
  .modal-body{padding:24px 26px;display:flex;flex-direction:column;gap:16px}
  .modal-foot{padding:18px 26px;border-top:1px solid var(--line);display:flex;gap:10px;justify-content:flex-end;position:sticky;bottom:0;background:var(--bg2)}

  /* QA */
  .qa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-bottom:32px}
  .qa-card{background:var(--bg2);padding:20px 22px;cursor:pointer;border-left:2px solid transparent;transition:all 0.2s;display:flex;align-items:center;gap:14px}
  .qa-card:hover{border-left-color:var(--accent);background:var(--bg3)}
  .qa-icon{font-size:22px;flex-shrink:0}
  .qa-label{font-size:12px;color:var(--text)}
  .qa-sub{font-size:10px;color:var(--muted);margin-top:3px}

  /* TOAST */
  .admin-toast{position:fixed;bottom:28px;right:28px;z-index:200000;background:var(--bg2);border:1px solid var(--accent2);color:var(--accent2);padding:11px 18px;font-size:11px;letter-spacing:0.06em;animation:adm-su 0.3s ease;font-family:var(--mono)}
  .admin-toast.error{border-color:#c47070;color:#c47070}

  /* EMPTY */
  .empty{padding:48px 0;text-align:center;color:var(--muted);font-size:12px;border:1px dashed var(--line)}
  .empty-icon{font-size:32px;margin-bottom:10px}

  /* ABOUT EDITOR */
  .about-ed{display:grid;grid-template-columns:1fr 1fr;gap:2px}
  .about-ed-field{background:var(--bg2);padding:20px}
  .about-ed-label{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
  .about-ed-input,.about-ed-textarea{width:100%;background:var(--bg3);border:1px solid var(--line);padding:9px 12px;color:var(--text);font-size:13px;outline:none;transition:border-color 0.2s;font-family:var(--mono)}
  .about-ed-input:focus,.about-ed-textarea:focus{border-color:var(--accent)}
  .about-ed-textarea{resize:vertical;min-height:100px}

  /* ── APPEARANCE EDITOR ── */
  .app-tabs{display:flex;gap:2px;margin-bottom:24px}
  .app-tab{padding:9px 22px;background:var(--bg2);border:1px solid var(--line);color:var(--muted);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;font-family:var(--mono)}
  .app-tab:hover{color:var(--text)}
  .app-tab.active{background:var(--accent);border-color:var(--accent);color:#000}

  .app-section{margin-bottom:32px}
  .app-section-title{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--line)}

  /* Mode toggle */
  .mode-cards{display:grid;grid-template-columns:1fr 1fr;gap:2px}
  .mode-card{padding:20px;background:var(--bg2);border:2px solid var(--line);cursor:pointer;transition:all 0.2s;text-align:center}
  .mode-card:hover{border-color:var(--muted)}
  .mode-card.selected{border-color:var(--accent)}
  .mode-card-icon{font-size:24px;margin-bottom:8px}
  .mode-card-label{font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)}
  .mode-card.selected .mode-card-label{color:var(--accent)}

  /* Palette grid */
  .palette-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .palette-card{padding:12px;background:var(--bg2);border:2px solid var(--line);cursor:pointer;transition:all 0.2s}
  .palette-card:hover{border-color:var(--muted)}
  .palette-card.selected{border-color:var(--accent)}
  .palette-swatch{height:24px;border-radius:2px;display:flex;overflow:hidden;margin-bottom:8px}
  .palette-swatch-h{flex:1}
  .palette-label-sm{font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)}
  .palette-card.selected .palette-label-sm{color:var(--accent)}

  /* Custom accent */
  .custom-accent-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
  .color-field{display:flex;flex-direction:column;gap:6px}
  .color-field label{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted)}
  .color-row{display:flex;gap:8px;align-items:center}
  .color-swatch{width:36px;height:36px;border:1px solid var(--line);flex-shrink:0;cursor:pointer;padding:0;background:none;overflow:hidden}
  .color-swatch input[type=color]{width:200%;height:200%;margin:-50%;border:none;cursor:pointer}
  .color-input{flex:1;background:var(--bg3);border:1px solid var(--line);padding:8px 12px;color:var(--text);font-size:12px;outline:none;font-family:var(--mono)}
  .color-input:focus{border-color:var(--accent)}

  /* Font selector */
  .font-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .font-card{padding:14px 16px;background:var(--bg2);border:2px solid var(--line);cursor:pointer;transition:all 0.2s}
  .font-card:hover{border-color:var(--muted)}
  .font-card.selected{border-color:var(--accent)}
  .font-card-name{font-size:11px;color:var(--muted);letter-spacing:0.06em;margin-bottom:6px}
  .font-card.selected .font-card-name{color:var(--accent)}
  .font-card-preview{font-size:18px;line-height:1.3}

  /* Live preview box */
  .preview-box{background:var(--bg2);border:1px solid var(--line);padding:24px;margin-bottom:24px}
  .preview-title{font-family:var(--serif);font-size:28px;font-weight:300;margin-bottom:6px;color:var(--text)}
  .preview-title em{font-style:italic;color:var(--accent)}
  .preview-mono{font-family:var(--mono);font-size:12px;color:var(--muted);letter-spacing:0.08em}
  .preview-accent{color:var(--accent2);font-size:12px;margin-top:4px;font-family:var(--mono)}

  @keyframes adm-fi{from{opacity:0}to{opacity:1}}
  @keyframes adm-su{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .adm-fade{animation:adm-su 0.35s ease both}

  @media(max-width:900px){
    .sb{width:100%;height:auto;position:relative}
    .main{margin-left:0}
    .stat-row{grid-template-columns:repeat(2,1fr)}
    .qa-grid{grid-template-columns:1fr 1fr}
    .gallery-manage{grid-template-columns:repeat(3,1fr)}
    .form-grid{grid-template-columns:1fr}
    .about-ed{grid-template-columns:1fr}
    .palette-grid{grid-template-columns:repeat(2,1fr)}
    .font-grid{grid-template-columns:1fr}
    .mode-cards{grid-template-columns:1fr 1fr}
  }
`;

/* ============================================================
   REUSABLE COMPONENTS
   ============================================================ */
function ImageUpload({ value, onChange, label = "Photo" }) {
  const [preview, setPreview] = useState(value || null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (value) setPreview(value);
  }, [value]);
  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setPreview(ev.target.result);
    r.readAsDataURL(file);
    setUploading(true);
    setStatus("Uploading...");
    setProgress(0);
    try {
      const url = await uploadToCloudinary(file, setProgress);
      setPreview(url);
      onChange(url);
      setStatus("✓ Done!");
    } catch {
      setStatus("✗ Failed.");
    }
    setUploading(false);
  };
  return (
    <div className="uploader">
      <div className="upload-zone">
        <input
          type="file"
          accept="image/*"
          onChange={handle}
          disabled={uploading}
        />
        {preview ? (
          <img src={preview} alt="preview" className="upload-preview" />
        ) : (
          <>
            <div style={{ fontSize: 28 }}>📷</div>
            <div className="upload-label">
              Click to <span>choose {label}</span>
              <br />
              <span style={{ fontSize: 10 }}>JPG·PNG·WEBP·max 10MB</span>
            </div>
          </>
        )}
      </div>
      {uploading && (
        <div className="upload-bar">
          <div className="upload-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status && <div className="upload-status">{status}</div>}
    </div>
  );
}

function MultiImageUpload({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const handle = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      setStatus(`Uploading ${i + 1}/${files.length}...`);
      try {
        const url = await uploadToCloudinary(files[i], setProgress);
        onUploaded(url, files[i].name);
      } catch {
        setStatus("One failed, continuing...");
      }
    }
    setStatus(
      `✓ ${files.length} photo${files.length > 1 ? "s" : ""} uploaded!`,
    );
    setUploading(false);
  };
  return (
    <div className="uploader">
      <div className="upload-zone" style={{ minHeight: 80 }}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handle}
          disabled={uploading}
        />
        <div style={{ fontSize: 22 }}>📁</div>
        <div className="upload-label">
          Click to <span>select photos</span> — multiple allowed
        </div>
      </div>
      {uploading && (
        <div className="upload-bar">
          <div className="upload-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status && <div className="upload-status">{status}</div>}
    </div>
  );
}

function Toast({ msg, type = "ok", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`admin-toast ${type === "error" ? "error" : ""}`}>
      {type === "ok" ? "✓" : "✗"} {msg}
    </div>
  );
}

function Modal({ title, onClose, onSave, saving, children }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      className="admin-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("admin-overlay")) onClose();
      }}
    >
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-title">{title}</div>
          <button className="modal-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APPEARANCE SECTION
   ============================================================ */
function AppearanceSection({ appearance, saveAppearance, toast }) {
  const [scope, setScope] = useState("portfolio"); // "portfolio" | "admin"
  const [local, setLocal] = useState(appearance);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(appearance);
  }, [appearance]);

  const set = (k, v) => {
    const updated = { ...local, [k]: v };
    setLocal(updated);
    // Apply preview live to the page
    applyAppearance(document.documentElement, updated, scope);
  };

  const save = async () => {
    setSaving(true);
    await saveAppearance(local);
    toast("Appearance saved!");
    setSaving(false);
  };

  const mode = local[`${scope}_mode`] || "dark";
  const paletteIdx = local[`${scope}_palette`] ?? 0;
  const serifIdx = local[`${scope}_serif`] ?? 0;
  const monoIdx = local[`${scope}_mono`] ?? 0;
  const customAcc = local[`${scope}_accent`] || "#b8966e";
  const customAcc2 = local[`${scope}_accent2`] || "#8fb8a0";

  const previewAccent =
    paletteIdx === 7 ? customAcc : PALETTES[paletteIdx]?.accent || "#b8966e";
  const previewAccent2 =
    paletteIdx === 7 ? customAcc2 : PALETTES[paletteIdx]?.accent2 || "#8fb8a0";

  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">Appearance</div>
          <div className="sec-sub">
            Customize fonts, colors & theme — independently for portfolio and
            admin
          </div>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Changes →"}
        </button>
      </div>

      {/* SCOPE TABS */}
      <div className="app-tabs">
        <button
          className={`app-tab ${scope === "portfolio" ? "active" : ""}`}
          onClick={() => setScope("portfolio")}
        >
          🌐 Portfolio
        </button>
        <button
          className={`app-tab ${scope === "admin" ? "active" : ""}`}
          onClick={() => setScope("admin")}
        >
          ⚙️ Admin Panel
        </button>
      </div>

      {/* LIVE PREVIEW */}
      <div className="preview-box">
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 12,
          }}
        >
          Live Preview — {scope}
        </div>
        <div
          className="preview-title"
          style={{ fontFamily: SERIF_FONTS[serifIdx]?.value }}
        >
          Abdullah Al <em>Mazid</em>
        </div>
        <div
          className="preview-mono"
          style={{ fontFamily: MONO_FONTS[monoIdx]?.value }}
        >
          Full Stack Developer · IoT Engineer
        </div>
        <div
          className="preview-accent"
          style={{
            fontFamily: MONO_FONTS[monoIdx]?.value,
            color: previewAccent2,
          }}
        >
          ✓ Research Collaborations
        </div>
        <div
          style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}
        >
          <div
            style={{
              padding: "8px 18px",
              background: previewAccent,
              color: "#000",
              fontSize: 11,
              letterSpacing: "0.08em",
              fontFamily: MONO_FONTS[monoIdx]?.value,
            }}
          >
            Primary Button
          </div>
          <div
            style={{
              padding: "8px 18px",
              border: `1px solid ${previewAccent}`,
              color: previewAccent,
              fontSize: 11,
              letterSpacing: "0.08em",
              fontFamily: MONO_FONTS[monoIdx]?.value,
            }}
          >
            Ghost Button
          </div>
        </div>
      </div>

      {/* DARK / LIGHT */}
      <div className="app-section">
        <div className="app-section-title">Color Mode</div>
        <div className="mode-cards">
          {["dark", "light"].map((m) => (
            <div
              key={m}
              className={`mode-card ${mode === m ? "selected" : ""}`}
              onClick={() => set(`${scope}_mode`, m)}
            >
              <div className="mode-card-icon">{m === "dark" ? "🌙" : "☀️"}</div>
              <div className="mode-card-label">{m} mode</div>
            </div>
          ))}
        </div>
      </div>

      {/* ACCENT PALETTE */}
      <div className="app-section">
        <div className="app-section-title">Accent Color</div>
        <div className="palette-grid">
          {PALETTES.map((p, i) => (
            <div
              key={i}
              className={`palette-card ${paletteIdx === i ? "selected" : ""}`}
              onClick={() => set(`${scope}_palette`, i)}
            >
              <div className="palette-swatch">
                <div
                  className="palette-swatch-h"
                  style={{ background: p.accent }}
                />
                <div
                  className="palette-swatch-h"
                  style={{ background: p.accent2 }}
                />
              </div>
              <div className="palette-label-sm">{p.label}</div>
            </div>
          ))}
        </div>

        {/* Custom color pickers — only shown when "Custom" selected */}
        {paletteIdx === 7 && (
          <div className="custom-accent-row">
            {[
              {
                key: `${scope}_accent`,
                label: "Primary Accent",
                val: customAcc,
              },
              {
                key: `${scope}_accent2`,
                label: "Secondary Accent",
                val: customAcc2,
              },
            ].map((f) => (
              <div className="color-field" key={f.key}>
                <label>{f.label}</label>
                <div className="color-row">
                  <div className="color-swatch" style={{ background: f.val }}>
                    <input
                      type="color"
                      value={f.val}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  </div>
                  <input
                    className="color-input"
                    value={f.val}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder="#b8966e"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HEADING / SERIF FONT */}
      <div className="app-section">
        <div className="app-section-title">Heading Font (Serif)</div>
        <div className="font-grid">
          {SERIF_FONTS.map((f, i) => (
            <div
              key={i}
              className={`font-card ${serifIdx === i ? "selected" : ""}`}
              onClick={() => set(`${scope}_serif`, i)}
            >
              <div className="font-card-name">{f.label}</div>
              <div
                className="font-card-preview"
                style={{ fontFamily: f.value }}
              >
                Abdullah Al{" "}
                <em style={{ fontStyle: "italic", color: previewAccent }}>
                  Mazid
                </em>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BODY / MONO FONT */}
      <div className="app-section">
        <div className="app-section-title">Body Font (Mono)</div>
        <div className="font-grid">
          {MONO_FONTS.map((f, i) => (
            <div
              key={i}
              className={`font-card ${monoIdx === i ? "selected" : ""}`}
              onClick={() => set(`${scope}_mono`, i)}
            >
              <div className="font-card-name">{f.label}</div>
              <div
                className="font-card-preview"
                style={{
                  fontFamily: f.value,
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                Full Stack Developer
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 8 }}>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Changes →"}
        </button>
        <span style={{ marginLeft: 16, fontSize: 11, color: "var(--muted)" }}>
          Changes preview live — save to apply permanently
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   OTHER SECTIONS (same as before, compact)
   ============================================================ */
function OverviewSection({ counts, setTab }) {
  const QA = [
    {
      icon: "◉",
      label: "Add Project",
      sub: "Upload a new project",
      tab: "projects",
    },
    {
      icon: "◎",
      label: "Add Publication",
      sub: "Add a research paper",
      tab: "publications",
    },
    {
      icon: "🖼",
      label: "Add Gallery Photo",
      sub: "Upload to photo gallery",
      tab: "gallery",
    },
    {
      icon: "✈",
      label: "Add Tour Memory",
      sub: "Share a travel experience",
      tab: "tours",
    },
    {
      icon: "◐",
      label: "Update Skills",
      sub: "Edit your tech stack",
      tab: "skills",
    },
    {
      icon: "🎨",
      label: "Appearance",
      sub: "Fonts, colors & themes",
      tab: "appearance",
    },
  ];
  return (
    <div className="adm-fade">
      <div className="stat-row">
        {[
          { n: counts.projects, l: "Projects" },
          { n: counts.publications, l: "Publications" },
          { n: counts.gallery, l: "Gallery Photos" },
          { n: counts.tours, l: "Tour Memories" },
        ].map((s) => (
          <div className="stat-card" key={s.l}>
            <div className="stat-num">{s.n}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginBottom: 12,
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        Quick Actions
      </div>
      <div className="qa-grid">
        {QA.map((q) => (
          <div className="qa-card" key={q.label} onClick={() => setTab(q.tab)}>
            <div className="qa-icon">{q.icon}</div>
            <div>
              <div className="qa-label">{q.label}</div>
              <div className="qa-sub">{q.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsSection({ data, reload, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openAdd = () => {
    setForm({
      title: "",
      short: "",
      detail: "",
      category: "Web",
      tags: "",
      image: "",
      links: "",
    });
    setModal(true);
  };
  const openEdit = (p) => {
    setForm({
      ...p,
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags,
      links: Array.isArray(p.links)
        ? p.links.map((l) => l.url || l).join(", ")
        : p.links || "",
    });
    setModal(true);
  };
  const save = async () => {
    setSaving(true);
    const d = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      links: form.links
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => ({ label: "Link", url: l })),
    };
    try {
      form.id
        ? await updateDoc(doc(db, "projects", form.id), d)
        : await addDoc(collection(db, "projects"), {
            ...d,
            num: String(data.length + 1).padStart(2, "0"),
          });
      await reload();
      setModal(false);
      toast("Project saved!");
    } catch {
      toast("Save failed", "error");
    }
    setSaving(false);
  };
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, "projects", id));
    await reload();
    toast("Deleted!");
  };
  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">Projects</div>
          <div className="sec-sub">Manage your portfolio projects</div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          ＋ Add Project
        </button>
      </div>
      {data.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">◉</div>No projects yet.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Title</th>
              <th>Category</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.image ? (
                    <img src={p.image} className="tbl-img" alt="" />
                  ) : (
                    <div className="tbl-img-ph">No img</div>
                  )}
                </td>
                <td style={{ maxWidth: 200 }}>{p.title}</td>
                <td>
                  <span className="chip accent">{p.category}</span>
                </td>
                <td>
                  {(p.tags || []).slice(0, 3).map((t) => (
                    <span className="chip" key={t}>
                      {t}
                    </span>
                  ))}
                </td>
                <td>
                  <div className="tbl-actions">
                    <button className="btn-edit" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => del(p.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal && (
        <Modal
          title={form.id ? "Edit Project" : "Add Project"}
          onClose={() => setModal(false)}
          onSave={save}
          saving={saving}
        >
          <div className="form-grid">
            <div className="field full">
              <label>Title</label>
              <input
                value={form.title || ""}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Project title"
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select
                value={form.category || "Web"}
                onChange={(e) => set("category", e.target.value)}
              >
                {["Web", "IoT", "CAD", "Research", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Tags (comma separated)</label>
              <input
                value={form.tags || ""}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="React, Firebase"
              />
            </div>
            <div className="field full">
              <label>Short Description</label>
              <input
                value={form.short || ""}
                onChange={(e) => set("short", e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Full Detail</label>
              <textarea
                value={form.detail || ""}
                onChange={(e) => set("detail", e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Project Photo</label>
              <ImageUpload
                value={form.image}
                onChange={(url) => set("image", url)}
              />
            </div>
            <div className="field full">
              <label>Links (comma separated)</label>
              <input
                value={form.links || ""}
                onChange={(e) => set("links", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PublicationsSection({ data, reload, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      form.id
        ? await updateDoc(doc(db, "publications", form.id), form)
        : await addDoc(collection(db, "publications"), form);
      await reload();
      setModal(false);
      toast("Saved!");
    } catch {
      toast("Failed", "error");
    }
    setSaving(false);
  };
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, "publications", id));
    await reload();
    toast("Deleted!");
  };
  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">Publications</div>
          <div className="sec-sub">Manage research papers</div>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setForm({ title: "", authors: "", journal: "", year: "", doi: "" });
            setModal(true);
          }}
        >
          ＋ Add
        </button>
      </div>
      {data.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">◎</div>No publications yet.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Title</th>
              <th>Journal</th>
              <th>Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td style={{ maxWidth: 280, fontSize: 12 }}>{p.title}</td>
                <td style={{ color: "var(--accent2)", fontSize: 11 }}>
                  {p.journal}
                </td>
                <td>{p.year}</td>
                <td>
                  <div className="tbl-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setForm(p);
                        setModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => del(p.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal && (
        <Modal
          title={form.id ? "Edit Publication" : "Add Publication"}
          onClose={() => setModal(false)}
          onSave={save}
          saving={saving}
        >
          <div className="form-grid single">
            <div className="field">
              <label>Title</label>
              <textarea
                value={form.title || ""}
                onChange={(e) => set("title", e.target.value)}
                style={{ minHeight: 70 }}
              />
            </div>
            <div className="field">
              <label>Authors</label>
              <input
                value={form.authors || ""}
                onChange={(e) => set("authors", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Journal</label>
              <input
                value={form.journal || ""}
                onChange={(e) => set("journal", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Year</label>
              <input
                value={form.year || ""}
                onChange={(e) => set("year", e.target.value)}
              />
            </div>
            <div className="field">
              <label>DOI / URL</label>
              <input
                value={form.doi || ""}
                onChange={(e) => set("doi", e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SkillsSection({ data, reload, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    const d = {
      category: form.category,
      items: form.items
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
    };
    try {
      form.id
        ? await updateDoc(doc(db, "skills", form.id), d)
        : await addDoc(collection(db, "skills"), d);
      await reload();
      setModal(false);
      toast("Saved!");
    } catch {
      toast("Failed", "error");
    }
    setSaving(false);
  };
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, "skills", id));
    await reload();
    toast("Deleted!");
  };
  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">Skills</div>
          <div className="sec-sub">Manage skill categories</div>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setForm({ category: "", items: "" });
            setModal(true);
          }}
        >
          ＋ Add
        </button>
      </div>
      {data.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">◐</div>No skills yet.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Category</th>
              <th>Skills</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id}>
                <td style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>
                  {s.category}
                </td>
                <td>
                  {(s.items || []).map((i) => (
                    <span className="chip" key={i}>
                      {i}
                    </span>
                  ))}
                </td>
                <td>
                  <div className="tbl-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setForm({
                          ...s,
                          items: Array.isArray(s.items)
                            ? s.items.join(", ")
                            : s.items,
                        });
                        setModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => del(s.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal && (
        <Modal
          title={form.id ? "Edit" : "Add Category"}
          onClose={() => setModal(false)}
          onSave={save}
          saving={saving}
        >
          <div className="form-grid single">
            <div className="field">
              <label>Category Name</label>
              <input
                value={form.category || ""}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Skills (comma separated)</label>
              <input
                value={form.items || ""}
                onChange={(e) => set("items", e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GallerySection({ data, reload, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleNew = async (url, name) => {
    await addDoc(collection(db, "gallery"), {
      url,
      caption: name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      createdAt: Date.now(),
    });
    await reload();
    toast("Photo added!");
  };
  const saveCaption = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "gallery", form.id), { caption: form.caption });
      await reload();
      setModal(false);
      toast("Updated!");
    } catch {
      toast("Failed", "error");
    }
    setSaving(false);
  };
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, "gallery", id));
    await reload();
    toast("Deleted!");
  };
  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">Photo Gallery</div>
          <div className="sec-sub">{data.length} photos</div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <MultiImageUpload onUploaded={handleNew} />
      </div>
      {data.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🖼</div>No photos yet.
        </div>
      ) : (
        <div className="gallery-manage">
          {data.map((p) => (
            <div className="gallery-item" key={p.id}>
              <img
                src={p.url}
                alt={p.caption || ""}
                onClick={() => setLightbox(p)}
              />
              {p.caption && (
                <div className="gallery-caption-bar">{p.caption}</div>
              )}
              <div className="gallery-overlay">
                <button
                  className="btn-edit btn-sm"
                  onClick={() => {
                    setForm(p);
                    setModal(true);
                  }}
                >
                  Caption
                </button>
                <button className="btn-danger btn-sm" onClick={() => del(p.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal
          title="Edit Caption"
          onClose={() => setModal(false)}
          onSave={saveCaption}
          saving={saving}
        >
          <div className="form-grid single">
            {form.url && (
              <img
                src={form.url}
                style={{ width: "100%", maxHeight: 180, objectFit: "cover" }}
                alt=""
              />
            )}
            <div className="field">
              <label>Caption</label>
              <input
                value={form.caption || ""}
                onChange={(e) => set("caption", e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
      {lightbox && (
        <div
          className="admin-overlay"
          style={{ zIndex: 200000 }}
          onClick={() => setLightbox(null)}
        >
          <div
            style={{ maxWidth: 900, width: "100%", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              style={{
                width: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                display: "block",
              }}
              alt=""
            />
            {lightbox.caption && (
              <div
                style={{
                  padding: "10px 16px",
                  background: "var(--bg2)",
                  color: "var(--muted)",
                  fontSize: 12,
                }}
              >
                {lightbox.caption}
              </div>
            )}
            <button
              className="modal-x"
              style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToursSection({ data, reload, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      form.id
        ? await updateDoc(doc(db, "tours", form.id), form)
        : await addDoc(collection(db, "tours"), {
            ...form,
            createdAt: Date.now(),
          });
      await reload();
      setModal(false);
      toast("Saved!");
    } catch {
      toast("Failed", "error");
    }
    setSaving(false);
  };
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, "tours", id));
    await reload();
    toast("Deleted!");
  };
  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">My Tours</div>
          <div className="sec-sub">Travel memories</div>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setForm({
              title: "",
              location: "",
              date: "",
              description: "",
              image: "",
            });
            setModal(true);
          }}
        >
          ＋ Add Tour
        </button>
      </div>
      {data.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✈</div>No tours yet.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Title</th>
              <th>Location</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.image ? (
                    <img src={t.image} className="tbl-img" alt="" />
                  ) : (
                    <div className="tbl-img-ph">No img</div>
                  )}
                </td>
                <td>{t.title}</td>
                <td style={{ color: "var(--accent2)" }}>{t.location}</td>
                <td style={{ color: "var(--muted)", fontSize: 11 }}>
                  {t.date}
                </td>
                <td>
                  <div className="tbl-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setForm(t);
                        setModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => del(t.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal && (
        <Modal
          title={form.id ? "Edit Tour" : "Add Tour"}
          onClose={() => setModal(false)}
          onSave={save}
          saving={saving}
        >
          <div className="form-grid">
            <div className="field">
              <label>Title</label>
              <input
                value={form.title || ""}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Location</label>
              <input
                value={form.location || ""}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input
                value={form.date || ""}
                onChange={(e) => set("date", e.target.value)}
                placeholder="March 2024"
              />
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Cover Photo</label>
              <ImageUpload
                value={form.image}
                onChange={(url) => set("image", url)}
                label="cover photo"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HobbiesSection({ data, reload, toast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      form.id
        ? await updateDoc(doc(db, "hobbies", form.id), form)
        : await addDoc(collection(db, "hobbies"), form);
      await reload();
      setModal(false);
      toast("Saved!");
    } catch {
      toast("Failed", "error");
    }
    setSaving(false);
  };
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, "hobbies", id));
    await reload();
    toast("Deleted!");
  };
  const TypeBlock = ({ items, label }) => (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      {items.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 12, padding: "12px 0" }}>
          None yet.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Emoji</th>
              <th>Title</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td style={{ fontSize: 20 }}>{i.emoji || "—"}</td>
                <td>{i.title}</td>
                <td
                  style={{ color: "var(--muted)", fontSize: 11, maxWidth: 200 }}
                >
                  {i.description}
                </td>
                <td>
                  <div className="tbl-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setForm(i);
                        setModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => del(i.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">Hobbies & Favourites</div>
          <div className="sec-sub">Hobbies, books, movies</div>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setForm({ type: "hobby", title: "", description: "", emoji: "" });
            setModal(true);
          }}
        >
          ＋ Add Entry
        </button>
      </div>
      <TypeBlock
        items={data.filter((d) => d.type === "hobby")}
        label="Hobbies"
      />
      <TypeBlock
        items={data.filter((d) => d.type === "book")}
        label="Favourite Books"
      />
      <TypeBlock
        items={data.filter((d) => d.type === "movie")}
        label="Favourite Movies"
      />
      {modal && (
        <Modal
          title={form.id ? "Edit" : "Add Entry"}
          onClose={() => setModal(false)}
          onSave={save}
          saving={saving}
        >
          <div className="form-grid single">
            <div className="field">
              <label>Type</label>
              <select
                value={form.type || "hobby"}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="hobby">Hobby</option>
                <option value="book">Book</option>
                <option value="movie">Movie</option>
              </select>
            </div>
            <div className="field">
              <label>Emoji</label>
              <input
                value={form.emoji || ""}
                onChange={(e) => set("emoji", e.target.value)}
                placeholder="🎮 🎸 📚"
              />
            </div>
            <div className="field">
              <label>Title</label>
              <input
                value={form.title || ""}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AboutSection({ data, reload, toast }) {
  const [form, setForm] = useState(data);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm(data);
  }, [data]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      form.id
        ? await updateDoc(doc(db, "about", form.id), form)
        : await setDoc(doc(db, "about", "main"), form);
      await reload();
      toast("Info saved!");
    } catch {
      toast("Failed", "error");
    }
    setSaving(false);
  };
  const FIELDS = [
    { key: "name", label: "Full Name", ph: "Abdullah Al Mazid" },
    { key: "role", label: "Role", ph: "Engineer & Developer" },
    { key: "tagline", label: "Tagline", ph: "IPE Student at BUET..." },
    { key: "email", label: "Email", ph: "your@email.com" },
    { key: "github", label: "GitHub URL", ph: "https://github.com/..." },
    {
      key: "linkedin",
      label: "LinkedIn URL",
      ph: "https://linkedin.com/in/...",
    },
    { key: "location", label: "Location", ph: "Chattogram, Bangladesh" },
  ];
  return (
    <div className="adm-fade">
      <div className="sec-head">
        <div>
          <div className="sec-title">About & Info</div>
          <div className="sec-sub">Personal info on portfolio</div>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save All →"}
        </button>
      </div>
      <div className="about-ed">
        {FIELDS.map((f) => (
          <div className="about-ed-field" key={f.key}>
            <div className="about-ed-label">{f.label}</div>
            <input
              className="about-ed-input"
              value={form[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.ph}
            />
          </div>
        ))}
        <div className="about-ed-field" style={{ gridColumn: "1/-1" }}>
          <div className="about-ed-label">About Text</div>
          <textarea
            className="about-ed-textarea"
            rows={6}
            value={form.about || ""}
            onChange={(e) => set("about", e.target.value)}
            placeholder="Write about yourself..."
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */
export default function AdminDashboard({ user, appearance, saveAppearance }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({
    projects: [],
    publications: [],
    skills: [],
    gallery: [],
    tours: [],
    hobbies: [],
    about: {},
  });
  const [toast, setToast] = useState(null);

  // Apply admin appearance on mount and whenever it changes
  useEffect(() => {
    applyAppearance(document.documentElement, appearance, "admin");
  }, [appearance]);

  const loadAll = async () => {
    try {
      const snaps = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "publications")),
        getDocs(collection(db, "skills")),
        getDocs(collection(db, "gallery")),
        getDocs(collection(db, "tours")),
        getDocs(collection(db, "hobbies")),
        getDocs(collection(db, "about")),
      ]);
      setData({
        projects: snaps[0].docs.map((d) => ({ id: d.id, ...d.data() })),
        publications: snaps[1].docs.map((d) => ({ id: d.id, ...d.data() })),
        skills: snaps[2].docs.map((d) => ({ id: d.id, ...d.data() })),
        gallery: snaps[3].docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
        tours: snaps[4].docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
        hobbies: snaps[5].docs.map((d) => ({ id: d.id, ...d.data() })),
        about: snaps[6].empty
          ? {}
          : { id: snaps[6].docs[0].id, ...snaps[6].docs[0].data() },
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg, type = "ok") => setToast({ msg, type });

  const NAV = [
    {
      section: "Portfolio",
      items: [
        { id: "overview", icon: "◈", label: "Overview" },
        {
          id: "projects",
          icon: "◉",
          label: "Projects",
          badge: data.projects.length,
        },
        {
          id: "publications",
          icon: "◎",
          label: "Publications",
          badge: data.publications.length,
        },
        { id: "skills", icon: "◐", label: "Skills", badge: data.skills.length },
      ],
    },
    {
      section: "Personal",
      items: [
        {
          id: "gallery",
          icon: "🖼",
          label: "Gallery",
          badge: data.gallery.length,
        },
        { id: "tours", icon: "✈", label: "My Tours", badge: data.tours.length },
        {
          id: "hobbies",
          icon: "🎯",
          label: "Hobbies & Favourites",
          badge: data.hobbies.length,
        },
      ],
    },
    {
      section: "Settings",
      items: [
        { id: "about", icon: "◑", label: "About & Info" },
        { id: "appearance", icon: "🎨", label: "Appearance" },
      ],
    },
  ];

  const TOPBAR = {
    overview: {
      title: "Good to see you,",
      em: "Abdullah",
      sub: "Portfolio at a glance.",
    },
    projects: {
      title: "Projects",
      em: null,
      sub: "Add, edit or remove projects.",
    },
    publications: {
      title: "Publications",
      em: null,
      sub: "Manage research papers.",
    },
    skills: { title: "Skills", em: null, sub: "Update skill categories." },
    gallery: {
      title: "Photo",
      em: "Gallery",
      sub: "Upload and manage photos.",
    },
    tours: { title: "My", em: "Tours", sub: "Share travel memories." },
    hobbies: {
      title: "Hobbies &",
      em: "Favourites",
      sub: "Hobbies, books, movies.",
    },
    about: {
      title: "About &",
      em: "Info",
      sub: "Update personal information.",
    },
    appearance: {
      title: "Appearance &",
      em: "Themes",
      sub: "Fonts, colors & themes for portfolio and admin.",
    },
  };
  const tb = TOPBAR[tab] || TOPBAR.overview;

  return (
    <>
      <style>{css}</style>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
      <div className="admin-root">
        <div className="shell">
          <div className="sb">
            <div className="sb-head">
              <div className="sb-logo">AAM</div>
              <div className="sb-sub">Admin Dashboard</div>
              <div className="sb-user">
                <div className="sb-avatar">A</div>
                <div className="sb-email">{user.email}</div>
              </div>
            </div>
            {NAV.map((group) => (
              <div className="sb-section" key={group.section}>
                <div className="sb-section-title">{group.section}</div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={`sb-item ${tab === item.id ? "active" : ""}`}
                    onClick={() => setTab(item.id)}
                  >
                    <span className="sb-icon">{item.icon}</span>
                    {item.label}
                    {item.badge !== undefined && (
                      <span className="sb-badge">{item.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
            <div className="sb-footer">
              <button className="sb-logout" onClick={() => signOut(auth)}>
                Sign Out
              </button>
            </div>
          </div>
          <div className="main">
            <div className="topbar">
              <div>
                <div className="topbar-title">
                  {tb.title}
                  {tb.em && (
                    <>
                      {" "}
                      <em>{tb.em}</em>
                    </>
                  )}
                </div>
                <div className="topbar-sub">{tb.sub}</div>
              </div>
              <a href="/" target="_blank" className="topbar-link">
                View Portfolio ↗
              </a>
            </div>
            <div className="content">
              {tab === "overview" && (
                <OverviewSection
                  counts={{
                    projects: data.projects.length,
                    publications: data.publications.length,
                    gallery: data.gallery.length,
                    tours: data.tours.length,
                  }}
                  setTab={setTab}
                />
              )}
              {tab === "projects" && (
                <ProjectsSection
                  data={data.projects}
                  reload={loadAll}
                  toast={showToast}
                />
              )}
              {tab === "publications" && (
                <PublicationsSection
                  data={data.publications}
                  reload={loadAll}
                  toast={showToast}
                />
              )}
              {tab === "skills" && (
                <SkillsSection
                  data={data.skills}
                  reload={loadAll}
                  toast={showToast}
                />
              )}
              {tab === "gallery" && (
                <GallerySection
                  data={data.gallery}
                  reload={loadAll}
                  toast={showToast}
                />
              )}
              {tab === "tours" && (
                <ToursSection
                  data={data.tours}
                  reload={loadAll}
                  toast={showToast}
                />
              )}
              {tab === "hobbies" && (
                <HobbiesSection
                  data={data.hobbies}
                  reload={loadAll}
                  toast={showToast}
                />
              )}
              {tab === "about" && (
                <AboutSection
                  data={data.about}
                  reload={loadAll}
                  toast={showToast}
                />
              )}
              {tab === "appearance" && (
                <AppearanceSection
                  appearance={appearance}
                  saveAppearance={saveAppearance}
                  toast={showToast}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
