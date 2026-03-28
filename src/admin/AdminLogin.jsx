import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0d0d; --bg2: #141414; --text: #e8e4dc;
    --muted: #6b6760; --accent: #b8966e; --line: #2a2a2a;
    --mono: 'Syne Mono', monospace; --serif: 'Cormorant Garamond', serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--mono); }
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 24px;
  }
  .login-box { width: 100%; max-width: 400px; }
  .login-logo {
    font-family: var(--serif); font-size: 32px; font-weight: 300;
    color: var(--accent); margin-bottom: 8px;
  }
  .login-sub { color: var(--muted); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 40px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-field label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .form-field input {
    background: var(--bg2); border: 1px solid var(--line);
    padding: 12px 16px; font-family: var(--mono); font-size: 13px;
    color: var(--text); outline: none; transition: border-color 0.2s; width: 100%;
  }
  .form-field input:focus { border-color: var(--accent); }
  .login-btn {
    width: 100%; padding: 13px; background: var(--accent);
    border: 1px solid var(--accent); color: #000;
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
    text-transform: uppercase; cursor: pointer; transition: all 0.2s; margin-top: 8px;
  }
  .login-btn:hover { background: transparent; color: var(--accent); }
  .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .error-msg {
    background: rgba(184,50,50,0.1); border: 1px solid rgba(184,50,50,0.3);
    color: #e88080; padding: 10px 14px; font-size: 12px; margin-bottom: 16px;
  }
  .login-divider { border: none; border-top: 1px solid var(--line); margin: 32px 0; }
  .back-link {
    color: var(--muted); font-size: 11px; letter-spacing: 0.08em;
    text-decoration: none; display: flex; align-items: center; gap: 8px;
    transition: color 0.2s; cursor: pointer; background: none; border: none;
    font-family: var(--mono);
  }
  .back-link:hover { color: var(--accent); }
`;

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.jsx will handle the redirect
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-logo">AAM</div>
          <div className="login-sub">Admin Dashboard</div>

          {error && <div className="error-msg">{error}</div>}

          <div className="form-field">
            <label>Email</label>
            <input
              type="email" value={email} placeholder="your@email.com"
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password" value={password} placeholder="••••••••"
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <hr className="login-divider" />

          <button className="back-link" onClick={() => window.location.href = "/"}>
            ← Back to Portfolio
          </button>
        </div>
      </div>
    </>
  );
}
