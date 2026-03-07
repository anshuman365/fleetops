import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("fo_token"));
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => { setUser(u); setAuthLoading(false); })
        .catch(() => { setToken(null); localStorage.removeItem("fo_token"); setAuthLoading(false); });
    } else {
      setAuthLoading(false);
    }
  }, [token]);

  const login = (tok, userData) => {
    localStorage.setItem("fo_token", tok);
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("fo_token");
    setToken(null);
    setUser(null);
  };

  const isPremium = user?.package === "premium";

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isPremium, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() { return useContext(AuthContext); }

// Authenticated fetch helper
function useApiFetch() {
  const { token, logout } = useAuth();
  return useCallback(async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    if (res.status === 401) { logout(); return null; }
    return res;
  }, [token, logout]);
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", fill = "none", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  driver: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  trip: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10m-3 0a3 3 0 106 0 3 3 0 10-6 0",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  check: "M20 6L9 17l-5-5",
  close: "M18 6L6 18M6 6l12 12",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  location: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  menu: "M3 12h18M3 6h18M3 18h18",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  crown: "M2 20h20M5 20V10l7-7 7 7v10",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const statusColor = {
  available: "#22c55e", on_trip: "#f59e0b", maintenance: "#ef4444", off_duty: "#94a3b8",
  scheduled: "#60a5fa", in_progress: "#f59e0b", completed: "#22c55e", cancelled: "#ef4444"
};
const statusLabel = {
  available: "Available", on_trip: "On Trip", maintenance: "Maintenance", off_duty: "Off Duty",
  scheduled: "Scheduled", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled"
};
const materialEmoji = { sand: "🏖️", gitti: "🪨", stone: "🪨", cement: "🏗️", other: "📦" };

const S = {
  sidebar: { width: 220 },
  colors: {
    bg: "#060e17", card: "#0a1520", border: "#1e3a52", text: "#e2f0ff",
    muted: "#64748b", subtle: "#94a3b8", accent: "#0ea5e9", danger: "#ef4444",
    warn: "#f59e0b", success: "#22c55e", premium: "#a855f7"
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Badge({ status }) {
  return (
    <span style={{
      background: statusColor[status] + "22", color: statusColor[status],
      border: `1px solid ${statusColor[status]}44`, padding: "2px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase"
    }}>{statusLabel[status] || status}</span>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── DESIGN SYSTEM ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 520 }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 16,
        width: "100%", maxWidth, maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 25px 80px rgba(0,0,0,0.8)"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: `1px solid ${S.colors.border}`, position: "sticky", top: 0,
          background: S.colors.card, zIndex: 1
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: S.colors.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.colors.muted, padding: 4, borderRadius: 6 }}>
            <Icon d={Icons.close} size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, options, required, placeholder, hint }) {
  const inputStyle = {
    width: "100%", background: "#0a1520", border: `1px solid ${S.colors.border}`,
    borderRadius: 8, padding: "10px 14px", color: S.colors.text, fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border 0.2s"
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: S.colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: S.colors.warn }}> *</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange} style={{ ...inputStyle, cursor: "pointer" }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required}
          placeholder={placeholder} style={inputStyle} />
      )}
      {hint && <div style={{ fontSize: 11, color: S.colors.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Btn({ onClick, children, variant = "primary", disabled, fullWidth, size = "md", icon }) {
  const bg = {
    primary: "linear-gradient(135deg, #1e6fa8, #0ea5e9)",
    secondary: S.colors.card,
    danger: "#2d1a1a",
    premium: "linear-gradient(135deg, #7c3aed, #a855f7)",
    ghost: "transparent"
  }[variant];
  const color = {
    primary: "#fff", secondary: S.colors.subtle, danger: S.colors.danger, premium: "#fff", ghost: S.colors.muted
  }[variant];
  const pad = size === "sm" ? "7px 14px" : size === "lg" ? "13px 28px" : "10px 20px";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: pad, borderRadius: 8, border: `1px solid ${variant === "secondary" ? S.colors.border : "transparent"}`,
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: size === "sm" ? 12 : 13,
      background: bg, color, opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
      display: "inline-flex", alignItems: "center", gap: 6, width: fullWidth ? "100%" : undefined,
      justifyContent: "center"
    }}>
      {icon && <Icon d={icon} size={14} color={color} />}
      {children}
    </button>
  );
}

function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = { info: "#1e3a52", success: "#14532d", error: "#450a0a", warn: "#431407" }[type];
  const border = { info: S.colors.accent, success: S.colors.success, error: S.colors.danger, warn: S.colors.warn }[type];
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: bg, border: `1px solid ${border}`,
      borderRadius: 12, padding: "14px 20px", color: S.colors.text, fontSize: 13, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxWidth: 340, animation: "slideIn 0.3s ease"
    }}>
      <style>{`@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span>{message}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: S.colors.muted, cursor: "pointer", marginLeft: "auto" }}>✕</button>
      </div>
    </div>
  );
}

// ─── LOCATION INPUT with autocomplete ────────────────────────────────────────
function LocationInput({ label, name, value, onChange, onLatLngChange, required, placeholder = "Type a location..." }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchSugg = async (q) => {
    if (q.length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=in`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    onChange(e);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSugg(e.target.value), 450);
    setShowSugg(true);
  };

  const pick = (s) => {
    onChange({ target: { name, value: s.display_name } });
    if (onLatLngChange) onLatLngChange(parseFloat(s.lat), parseFloat(s.lon));
    setShowSugg(false);
    setSuggestions([]);
  };

  return (
    <div style={{ marginBottom: 16, position: "relative" }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: S.colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: S.colors.warn }}> *</span>}
      </label>
      <input
        name={name} value={value} onChange={handleChange} placeholder={placeholder}
        onFocus={() => suggestions.length > 0 && setShowSugg(true)}
        onBlur={() => setTimeout(() => setShowSugg(false), 200)}
        style={{
          width: "100%", background: "#0a1520", border: `1px solid ${S.colors.border}`,
          borderRadius: 8, padding: "10px 14px", color: S.colors.text, fontSize: 14,
          outline: "none", boxSizing: "border-box"
        }}
      />
      {loading && (
        <div style={{ position: "absolute", right: 14, top: 38, color: S.colors.muted, fontSize: 11 }}>Searching...</div>
      )}
      {showSugg && suggestions.length > 0 && (
        <ul style={{
          position: "absolute", left: 0, right: 0, top: "100%", background: "#0f1923",
          border: `1px solid ${S.colors.border}`, borderRadius: 8, marginTop: 4,
          padding: 0, listStyle: "none", zIndex: 50, maxHeight: 220, overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}>
          {suggestions.map((s, i) => (
            <li key={i} onMouseDown={() => pick(s)} style={{
              padding: "10px 14px", borderBottom: i < suggestions.length - 1 ? `1px solid ${S.colors.border}33` : "none",
              color: S.colors.subtle, fontSize: 12, cursor: "pointer", transition: "background 0.1s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e3a52"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              📍 {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── PREMIUM GATE ─────────────────────────────────────────────────────────────
function PremiumGate({ feature, onUpgrade, children }) {
  const { isPremium } = useAuth();
  if (isPremium) return children;
  return (
    <div style={{
      background: `linear-gradient(135deg, #1a0a2e, #0f1923)`,
      border: `1px solid ${S.colors.premium}44`, borderRadius: 16, padding: 40, textAlign: "center"
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
      <h3 style={{ color: S.colors.text, fontSize: 20, margin: "0 0 8px" }}>Premium Feature</h3>
      <p style={{ color: S.colors.muted, fontSize: 14, margin: "0 0 24px" }}>
        <strong style={{ color: S.colors.premium }}>{feature}</strong> is available on the Premium plan.
      </p>
      <Btn variant="premium" onClick={onUpgrade} icon={Icons.crown}>Upgrade to Premium — ₹999/mo</Btn>
    </div>
  );
}

// ─── AUTH MODALS ─────────────────────────────────────────────────────────────
function LoginModal({ isOpen, onClose, onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!isOpen) return null;

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.username || !form.password) { setError("All fields required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.msg || "Login failed"); return; }
      login(data.access_token, data.user);
      onClose();
    } catch { setError("Network error. Check your connection."); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Login to FleetOps" onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 40 }}>🚛</div>
        <p style={{ color: S.colors.muted, fontSize: 13, margin: "8px 0 0" }}>Welcome back! Login to manage your fleet.</p>
      </div>
      {error && <div style={{ background: "#450a0a", border: `1px solid ${S.colors.danger}44`, borderRadius: 8, padding: "10px 14px", color: S.colors.danger, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <Field label="Username or Email" name="username" value={form.username} onChange={handleChange} placeholder="Enter username or email" required />
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: S.colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Password <span style={{ color: S.colors.warn }}>*</span></label>
        <div style={{ position: "relative" }}>
          <input name="password" type={showPw ? "text" : "password"} value={form.password} onChange={handleChange}
            placeholder="Enter password" onKeyDown={e => e.key === "Enter" && submit()}
            style={{ width: "100%", background: "#0a1520", border: `1px solid ${S.colors.border}`, borderRadius: 8, padding: "10px 40px 10px 14px", color: S.colors.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          <button onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: S.colors.muted, cursor: "pointer", padding: 0 }}>
            <Icon d={showPw ? Icons.eyeOff : Icons.eye} size={16} />
          </button>
        </div>
      </div>
      <Btn onClick={submit} disabled={loading} fullWidth>{loading ? "Logging in..." : "Login"}</Btn>
      <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: S.colors.muted }}>
        Don't have an account?{" "}
        <span onClick={onSwitch} style={{ color: S.colors.accent, cursor: "pointer", fontWeight: 600 }}>Register here</span>
      </p>
    </Modal>
  );
}

function RegisterModal({ isOpen, onClose, onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", full_name: "", company_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.username || !form.email || !form.password) { setError("Username, email, and password are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.msg || "Registration failed"); return; }
      login(data.access_token, data.user);
      onClose();
    } catch { setError("Network error. Check your connection."); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Create Account" onClose={onClose} maxWidth={460}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 40 }}>✨</div>
        <p style={{ color: S.colors.muted, fontSize: 13, margin: "8px 0 0" }}>Start managing your fleet for free.</p>
      </div>
      {error && <div style={{ background: "#450a0a", border: `1px solid ${S.colors.danger}44`, borderRadius: 8, padding: "10px 14px", color: S.colors.danger, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Your name" />
        <Field label="Company" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company name" />
      </div>
      <Field label="Username" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required />
      <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
      <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
      <Btn onClick={submit} disabled={loading} fullWidth>{loading ? "Creating account..." : "Create Free Account"}</Btn>
      <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: S.colors.muted }}>
        Already have an account?{" "}
        <span onClick={onSwitch} style={{ color: S.colors.accent, cursor: "pointer", fontWeight: 600 }}>Login</span>
      </p>
    </Modal>
  );
}

// ─── UPGRADE MODAL ─────────────────────────────────────────────────────────
function UpgradeModal({ isOpen, onClose }) {
  const { token, login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const upgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/upgrade`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ package: "premium" })
      });
      const data = await res.json();
      if (res.ok) {
        login(token, data.user);
        setDone(true);
      }
    } finally { setLoading(false); }
  };

  if (done) return (
    <Modal title="🎉 Welcome to Premium!" onClose={onClose} maxWidth={400}>
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⭐</div>
        <h3 style={{ color: S.colors.text, margin: "0 0 8px" }}>You're Premium now!</h3>
        <p style={{ color: S.colors.muted, marginBottom: 24 }}>All features unlocked. Enjoy FleetOps Premium!</p>
        <Btn onClick={onClose} variant="premium">Start using Premium</Btn>
      </div>
    </Modal>
  );

  const features = ["Unlimited trucks & drivers", "Advanced route planner", "Fleet map tracking", "Analytics & reports", "Priority support", "CSV data export"];

  return (
    <Modal title="Upgrade to Premium" onClose={onClose} maxWidth={480}>
      <div style={{ background: "linear-gradient(135deg, #1a0a2e, #0f1923)", border: `1px solid ${S.colors.premium}44`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: S.colors.text }}>₹999<span style={{ fontSize: 14, color: S.colors.muted, fontWeight: 400 }}>/month</span></div>
            <div style={{ color: S.colors.premium, fontSize: 13, fontWeight: 600 }}>FleetOps Premium</div>
          </div>
          <div style={{ fontSize: 36 }}>⭐</div>
        </div>
        {features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon d={Icons.check} size={14} color={S.colors.premium} />
            <span style={{ color: S.colors.subtle, fontSize: 13 }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "#1e3a5244", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: S.colors.muted }}>
        💡 In production, this would connect to a payment gateway (Razorpay/Stripe). For demo, click below to activate Premium instantly.
      </div>
      <Btn onClick={upgrade} disabled={loading} fullWidth variant="premium" icon={Icons.crown} size="lg">
        {loading ? "Activating..." : "Activate Premium"}
      </Btn>
    </Modal>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { id: "trucks", label: "Trucks", icon: Icons.truck },
  { id: "drivers", label: "Drivers", icon: Icons.driver },
  { id: "trips", label: "Trips", icon: Icons.trip },
  { id: "route", label: "Route Planner", icon: Icons.map, premium: true },
  { id: "profile", label: "Account", icon: Icons.user },
];

function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, onLoginClick, onUpgradeClick }) {
  const { user, logout, isPremium } = useAuth();

  return (
    <>
      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 98,
          display: "none"
        }} className="mob-overlay" />
      )}

      <aside style={{
        width: S.sidebar.width, background: "#080f18", borderRight: `1px solid ${S.colors.border}`,
        padding: "0", display: "flex", flexDirection: "column", position: "fixed",
        top: 0, bottom: 0, left: 0, zIndex: 99, transition: "transform 0.3s ease",
      }} className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${S.colors.border}33` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: S.colors.accent, letterSpacing: -0.5 }}>🚛 FleetOps</div>
              <div style={{ fontSize: 10, color: S.colors.muted, marginTop: 2 }}>Truck Logistics Manager</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="mob-close" style={{
              background: "none", border: "none", color: S.colors.muted, cursor: "pointer",
              display: "none", padding: 4
            }}>
              <Icon d={Icons.close} size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
          {NAV.map(item => {
            const locked = item.premium && !isPremium;
            const active = page === item.id;
            return (
              <button key={item.id}
                onClick={() => {
                  if (locked) { onUpgradeClick(); return; }
                  if (!user && item.id !== "dashboard") { onLoginClick(); return; }
                  setPage(item.id);
                  setSidebarOpen(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2,
                  background: active ? "#1e3a52" : "transparent",
                  color: locked ? "#334155" : (active ? S.colors.text : S.colors.muted),
                  fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s", textAlign: "left"
                }}>
                <Icon d={item.icon} size={16} color={locked ? "#334155" : (active ? S.colors.accent : S.colors.muted)} />
                {item.label}
                {locked && (
                  <span style={{ marginLeft: "auto", fontSize: 9, background: `${S.colors.premium}22`, color: S.colors.premium, padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>PRO</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${S.colors.border}33` }}>
          {user ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: isPremium ? `${S.colors.premium}33` : "#1e3a52", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: `1px solid ${isPremium ? S.colors.premium : S.colors.border}` }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ color: S.colors.text, fontSize: 13, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 10, color: isPremium ? S.colors.premium : S.colors.muted }}>
                    {isPremium ? "⭐ Premium" : "🆓 Free Plan"}
                  </div>
                </div>
              </div>
              {!isPremium && (
                <button onClick={onUpgradeClick} style={{
                  width: "100%", background: `linear-gradient(135deg, #7c3aed, #a855f7)`, border: "none",
                  color: "#fff", padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", marginBottom: 8
                }}>⭐ Upgrade to Premium</button>
              )}
              <button onClick={logout} style={{
                width: "100%", background: "none", border: `1px solid ${S.colors.border}`, color: S.colors.muted,
                padding: "7px", borderRadius: 8, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>
                <Icon d={Icons.logout} size={12} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={onLoginClick} style={{
              width: "100%", background: "linear-gradient(135deg, #1e6fa8, #0ea5e9)", border: "none",
              color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}>Login / Register</button>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── AUTH GATE ───────────────────────────────────────────────────────────────
function AuthGate({ onLoginClick }) {
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <h2 style={{ color: S.colors.text, fontSize: 24, margin: "0 0 8px" }}>Login Required</h2>
      <p style={{ color: S.colors.muted, marginBottom: 28, maxWidth: 360 }}>Please login or create a free account to manage your fleet operations.</p>
      <Btn onClick={onLoginClick} icon={Icons.user} size="lg">Login / Register</Btn>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ onNavigate, apiFetch, toast }) {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  const load = useCallback(() => {
    if (!user) return;
    apiFetch("/dashboard").then(r => r && r.json()).then(d => d && setData(d)).catch(() => {});
  }, [apiFetch, user]);

  useEffect(() => { load(); }, [load]);

  const seed = () => apiFetch("/seed", { method: "POST" }).then(() => { load(); toast("Sample data loaded!", "success"); });

  if (!user) return (
    <div>
      <h1 style={{ color: S.colors.text, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome to FleetOps 🚛</h1>
      <p style={{ color: S.colors.muted }}>Please login to see your fleet dashboard.</p>
    </div>
  );

  if (!data) return <div style={{ color: S.colors.muted, padding: 40, textAlign: "center" }}>Loading...</div>;

  const cards = [
    { label: "Total Trucks", value: data.trucks.total, sub: `${data.trucks.active} on trip`, icon: Icons.truck, color: S.colors.accent },
    { label: "Total Drivers", value: data.drivers.total, sub: `${data.drivers.active} active`, icon: Icons.driver, color: S.colors.success },
    { label: "Total Trips", value: data.trips.total, sub: `${data.trips.completed} completed`, icon: Icons.trip, color: S.colors.warn },
    { label: "Active Trips", value: data.trips.active, sub: "Right now", icon: Icons.map, color: "#a855f7" },
  ];

  const alerts = [
    data.alerts.expiring_insurance > 0 && `${data.alerts.expiring_insurance} truck insurance expiring within 30 days`,
    data.alerts.expiring_permits > 0 && `${data.alerts.expiring_permits} truck permits expiring within 30 days`,
    data.alerts.expiring_licenses > 0 && `${data.alerts.expiring_licenses} driver licenses expiring within 30 days`,
  ].filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: S.colors.text }}>
            Hello, {user.full_name || user.username} 👋
          </h1>
          <p style={{ margin: "4px 0 0", color: S.colors.muted, fontSize: 13 }}>
            {user.company_name ? `${user.company_name} • ` : ""}Fleet overview
          </p>
        </div>
        <Btn onClick={seed} variant="secondary" size="sm">Load Sample Data</Btn>
      </div>

      {alerts.length > 0 && (
        <div style={{ background: "#2d1a0a", border: `1px solid ${S.colors.warn}44`, borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon d={Icons.alert} color={S.colors.warn} size={18} />
            <div>
              {alerts.map((a, i) => <div key={i} style={{ color: "#fbbf24", fontSize: 13, marginBottom: i < alerts.length - 1 ? 4 : 0 }}>⚠ {a}</div>)}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, padding: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.12 }}>
              <Icon d={c.icon} size={44} color={c.color} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: S.colors.text, marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: S.colors.muted, marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: S.colors.text }}>Recent Trips</h3>
        {data.recent_trips.length === 0 ? (
          <div style={{ color: S.colors.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            No trips yet. <span style={{ color: S.colors.accent, cursor: "pointer" }} onClick={() => onNavigate("trips")}>Create one →</span>
          </div>
        ) : data.recent_trips.map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${S.colors.border}33`, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: S.colors.text }}>
                {materialEmoji[t.material] || "📦"} {t.origin} → {t.destination}
              </div>
              <div style={{ fontSize: 11, color: S.colors.muted, marginTop: 2 }}>
                {t.truck_plate} • {t.driver_name}{t.load_tons ? ` • ${t.load_tons}T` : ""}
              </div>
            </div>
            <Badge status={t.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRUCKS ──────────────────────────────────────────────────────────────────
function Trucks({ apiFetch, toast }) {
  const [trucks, setTrucks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ number_plate: "", model: "", capacity_tons: "", fuel_type: "diesel", last_service: "", insurance_expiry: "", permit_expiry: "" });

  const load = useCallback(() => apiFetch("/trucks").then(r => r && r.json()).then(d => d && setTrucks(d)), [apiFetch]);
  useEffect(() => { load(); }, [load]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const url = editItem ? `/trucks/${editItem.id}` : "/trucks";
    const method = editItem ? "PUT" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify({ ...form, capacity_tons: parseFloat(form.capacity_tons) }) });
    if (!res) return;
    if (!res.ok) {
      const d = await res.json();
      toast(d.msg || "Failed to save", "error");
      return;
    }
    setShowForm(false); setEditItem(null);
    setForm({ number_plate: "", model: "", capacity_tons: "", fuel_type: "diesel", last_service: "", insurance_expiry: "", permit_expiry: "" });
    load(); toast(editItem ? "Truck updated" : "Truck added", "success");
  };

  const del = async id => {
    if (!window.confirm("Delete this truck?")) return;
    await apiFetch(`/trucks/${id}`, { method: "DELETE" });
    load(); toast("Truck deleted", "info");
  };

  const openEdit = t => {
    setForm({ number_plate: t.number_plate, model: t.model || "", capacity_tons: t.capacity_tons, fuel_type: t.fuel_type, last_service: t.last_service || "", insurance_expiry: t.insurance_expiry || "", permit_expiry: t.permit_expiry || "" });
    setEditItem(t); setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: S.colors.text }}>Trucks</h1>
          <p style={{ margin: "4px 0 0", color: S.colors.muted, fontSize: 13 }}>{trucks.length} vehicles in fleet</p>
        </div>
        <Btn onClick={() => { setEditItem(null); setShowForm(true); }} icon={Icons.plus}>Add Truck</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
        {trucks.map(t => {
          const insExp = daysUntil(t.insurance_expiry);
          const permExp = daysUntil(t.permit_expiry);
          const warn = (insExp !== null && insExp <= 30) || (permExp !== null && permExp <= 30);
          return (
            <div key={t.id} style={{ background: S.colors.card, border: `1px solid ${warn ? S.colors.warn + "55" : S.colors.border}`, borderRadius: 14, padding: 18, position: "relative" }}>
              {warn && <div style={{ position: "absolute", top: 12, right: 12 }}><Icon d={Icons.alert} color={S.colors.warn} size={16} /></div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: S.colors.accent, letterSpacing: 1 }}>{t.number_plate}</div>
                  <div style={{ fontSize: 12, color: S.colors.subtle, marginTop: 2 }}>{t.model || "N/A"}</div>
                </div>
                <Badge status={t.status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[["Capacity", `${t.capacity_tons}T`], ["Fuel", t.fuel_type], ["Insurance", t.insurance_expiry ? `${insExp}d` : "N/A"], ["Permit", t.permit_expiry ? `${permExp}d` : "N/A"]].map(([k, v]) => (
                  <div key={k} style={{ background: "#0f1923", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: S.colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: S.colors.text }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(t)} style={{ flex: 1, background: "#1e3a52", border: "none", color: S.colors.subtle, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Icon d={Icons.edit} size={13} /> Edit
                </button>
                <button onClick={() => del(t.id)} style={{ flex: 1, background: "#2d1a1a", border: "none", color: S.colors.danger, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Icon d={Icons.trash} size={13} /> Delete
                </button>
              </div>
            </div>
          );
        })}
        {trucks.length === 0 && (
          <div style={{ color: S.colors.muted, fontSize: 13, padding: 40, textAlign: "center", gridColumn: "1/-1" }}>No trucks added yet.</div>
        )}
      </div>

      {showForm && (
        <Modal title={editItem ? "Edit Truck" : "Add Truck"} onClose={() => { setShowForm(false); setEditItem(null); }}>
          <Field label="Number Plate" name="number_plate" value={form.number_plate} onChange={handleChange} required placeholder="e.g. HR26CA1234" />
          <Field label="Model" name="model" value={form.model} onChange={handleChange} placeholder="e.g. Tata 2518" />
          <Field label="Capacity (Tons)" name="capacity_tons" type="number" value={form.capacity_tons} onChange={handleChange} required />
          <Field label="Fuel Type" name="fuel_type" value={form.fuel_type} onChange={handleChange} options={[{ value: "diesel", label: "Diesel" }, { value: "cng", label: "CNG" }, { value: "petrol", label: "Petrol" }]} />
          <Field label="Last Service Date" name="last_service" type="date" value={form.last_service} onChange={handleChange} />
          <Field label="Insurance Expiry" name="insurance_expiry" type="date" value={form.insurance_expiry} onChange={handleChange} />
          <Field label="Permit Expiry" name="permit_expiry" type="date" value={form.permit_expiry} onChange={handleChange} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Btn>
            <Btn onClick={save}>Save Truck</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DRIVERS ─────────────────────────────────────────────────────────────────
function Drivers({ apiFetch, toast }) {
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", license_no: "", license_expiry: "", address: "" });

  const load = useCallback(() => apiFetch("/drivers").then(r => r && r.json()).then(d => d && setDrivers(d)), [apiFetch]);
  useEffect(() => { load(); }, [load]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const url = editItem ? `/drivers/${editItem.id}` : "/drivers";
    const method = editItem ? "PUT" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(form) });
    if (!res) return;
    if (!res.ok) {
      const d = await res.json();
      toast(d.msg || "Failed to save", "error");
      return;
    }
    setShowForm(false); setEditItem(null);
    setForm({ name: "", phone: "", license_no: "", license_expiry: "", address: "" });
    load(); toast(editItem ? "Driver updated" : "Driver added", "success");
  };

  const del = async id => {
    if (!window.confirm("Delete this driver?")) return;
    await apiFetch(`/drivers/${id}`, { method: "DELETE" });
    load(); toast("Driver deleted", "info");
  };

  const openEdit = d => {
    setForm({ name: d.name, phone: d.phone, license_no: d.license_no, license_expiry: d.license_expiry, address: d.address || "" });
    setEditItem(d); setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: S.colors.text }}>Drivers</h1>
          <p style={{ margin: "4px 0 0", color: S.colors.muted, fontSize: 13 }}>{drivers.length} drivers registered</p>
        </div>
        <Btn onClick={() => { setEditItem(null); setShowForm(true); }} icon={Icons.plus}>Add Driver</Btn>
      </div>

      {/* Table on desktop, cards on mobile */}
      <div className="drivers-desktop" style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#0f1923" }}>
                {["Driver", "Phone", "License", "Expiry", "Status", "Trips", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: S.colors.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${S.colors.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, i) => {
                const exp = daysUntil(d.license_expiry);
                return (
                  <tr key={d.id} style={{ borderBottom: i < drivers.length - 1 ? `1px solid ${S.colors.border}33` : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0f1923"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: S.colors.text }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: S.colors.muted }}>{d.address}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: S.colors.subtle }}>{d.phone}</td>
                    <td style={{ padding: "14px 16px", color: S.colors.subtle, fontFamily: "monospace", fontSize: 12 }}>{d.license_no}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: exp !== null && exp <= 30 ? S.colors.warn : S.colors.subtle }}>
                        {exp !== null && exp <= 30 ? "⚠ " : ""}{d.license_expiry?.split("T")[0]}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}><Badge status={d.status} /></td>
                    <td style={{ padding: "14px 16px", color: S.colors.muted }}>{d.total_trips}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(d)} style={{ background: "#1e3a52", border: "none", color: S.colors.subtle, width: 30, height: 30, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon d={Icons.edit} size={13} />
                        </button>
                        <button onClick={() => del(d.id)} style={{ background: "#2d1a1a", border: "none", color: S.colors.danger, width: 30, height: 30, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon d={Icons.trash} size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {drivers.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: S.colors.muted }}>No drivers added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title={editItem ? "Edit Driver" : "Add Driver"} onClose={() => { setShowForm(false); setEditItem(null); }}>
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} required />
          <Field label="License No." name="license_no" value={form.license_no} onChange={handleChange} required />
          <Field label="License Expiry" name="license_expiry" type="date" value={form.license_expiry} onChange={handleChange} required />
          <Field label="Address" name="address" value={form.address} onChange={handleChange} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Btn>
            <Btn onClick={save}>Save Driver</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TRIPS ───────────────────────────────────────────────────────────────────
function Trips({ apiFetch, toast }) {
  const [trips, setTrips] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ truck_id: "", driver_id: "", origin: "", origin_lat: "", origin_lng: "", destination: "", dest_lat: "", dest_lng: "", material: "other", load_tons: "", scheduled_date: "", distance_km: "", notes: "" });

  const load = useCallback(async () => {
    const [tr, tk, dr] = await Promise.all([
      apiFetch("/trips").then(r => r?.json()).catch(() => []),
      apiFetch("/trucks").then(r => r?.json()).catch(() => []),
      apiFetch("/drivers").then(r => r?.json()).catch(() => [])
    ]);
    if (tr) setTrips(tr);
    if (tk) setTrucks(tk);
    if (dr) setDrivers(dr);
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.truck_id || !form.driver_id || !form.origin || !form.destination) {
      toast("Fill all required fields", "error"); return;
    }
    const res = await apiFetch("/trips", { method: "POST", body: JSON.stringify({ ...form, load_tons: parseFloat(form.load_tons) || null, distance_km: parseFloat(form.distance_km) || null }) });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); toast(d.msg || "Failed", "error"); return; }
    setShowForm(false);
    setForm({ truck_id: "", driver_id: "", origin: "", origin_lat: "", origin_lng: "", destination: "", dest_lat: "", dest_lng: "", material: "other", load_tons: "", scheduled_date: "", distance_km: "", notes: "" });
    load(); toast("Trip created!", "success");
  };

  const updateStatus = async (id, status) => {
    await apiFetch(`/trips/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    load(); toast(`Trip marked as ${statusLabel[status]}`, "info");
  };

  const del = async id => {
    if (!window.confirm("Delete this trip?")) return;
    await apiFetch(`/trips/${id}`, { method: "DELETE" });
    load(); toast("Trip deleted", "info");
  };

  const availableTrucks = trucks.filter(t => t.status === "available" || t.status === "on_trip");
  const availableDrivers = drivers.filter(d => d.status === "available" || d.status === "on_trip");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: S.colors.text }}>Trips</h1>
          <p style={{ margin: "4px 0 0", color: S.colors.muted, fontSize: 13 }}>{trips.length} trips total</p>
        </div>
        <Btn onClick={() => setShowForm(true)} icon={Icons.plus}>New Trip</Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {trips.map(t => (
          <div key={t.id} style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: S.colors.text }}>
                  {materialEmoji[t.material] || "📦"} {t.origin}
                  <span style={{ color: S.colors.muted, fontWeight: 400 }}> → </span>
                  {t.destination}
                </div>
                <div style={{ fontSize: 12, color: S.colors.muted, marginTop: 4 }}>
                  🚛 {t.truck_plate} &nbsp;•&nbsp; 👤 {t.driver_name}
                  {t.load_tons ? ` &nbsp;•&nbsp; ${t.load_tons}T` : ""}
                  {t.distance_km ? ` &nbsp;•&nbsp; ${t.distance_km}km` : ""}
                </div>
              </div>
              <Badge status={t.status} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {t.status === "scheduled" && <Btn size="sm" onClick={() => updateStatus(t.id, "in_progress")} icon={Icons.check}>Start Trip</Btn>}
              {t.status === "in_progress" && <Btn size="sm" onClick={() => updateStatus(t.id, "completed")} icon={Icons.check}>Complete</Btn>}
              {(t.status === "scheduled" || t.status === "in_progress") && (
                <Btn size="sm" variant="secondary" onClick={() => updateStatus(t.id, "cancelled")}>Cancel</Btn>
              )}
              <Btn size="sm" variant="danger" onClick={() => del(t.id)} icon={Icons.trash}>Delete</Btn>
            </div>
          </div>
        ))}
        {trips.length === 0 && (
          <div style={{ color: S.colors.muted, textAlign: "center", padding: 40 }}>No trips yet. Create your first one!</div>
        )}
      </div>

      {showForm && (
        <Modal title="Create New Trip" onClose={() => setShowForm(false)}>
          <Field label="Truck" name="truck_id" value={form.truck_id} onChange={handleChange} required
            options={[{ value: "", label: "Select truck..." }, ...availableTrucks.map(t => ({ value: t.id, label: `${t.number_plate} (${t.model || "N/A"})` }))]} />
          <Field label="Driver" name="driver_id" value={form.driver_id} onChange={handleChange} required
            options={[{ value: "", label: "Select driver..." }, ...availableDrivers.map(d => ({ value: d.id, label: d.name }))]} />
          <LocationInput label="Origin" name="origin" value={form.origin} onChange={handleChange} required
            onLatLngChange={(lat, lng) => setForm(f => ({ ...f, origin_lat: lat, origin_lng: lng }))} />
          <LocationInput label="Destination" name="destination" value={form.destination} onChange={handleChange} required
            onLatLngChange={(lat, lng) => setForm(f => ({ ...f, dest_lat: lat, dest_lng: lng }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Material" name="material" value={form.material} onChange={handleChange}
              options={[{ value: "sand", label: "Sand" }, { value: "gitti", label: "Gitti" }, { value: "stone", label: "Stone" }, { value: "cement", label: "Cement" }, { value: "other", label: "Other" }]} />
            <Field label="Load (Tons)" name="load_tons" type="number" value={form.load_tons} onChange={handleChange} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Scheduled Date" name="scheduled_date" type="datetime-local" value={form.scheduled_date} onChange={handleChange} />
            <Field label="Distance (km)" name="distance_km" type="number" value={form.distance_km} onChange={handleChange} />
          </div>
          <Field label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any additional notes..." />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={save}>Create Trip</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ROUTE PLANNER (Premium) ──────────────────────────────────────────────────
function RoutePlanner({ apiFetch, toast, onUpgrade }) {
  const { isPremium } = useAuth();
  const [origin, setOrigin] = useState({ name: "", lat: null, lng: null });
  const [dest, setDest] = useState({ name: "", lat: null, lng: null });
  const [mapUrl, setMapUrl] = useState(null);
  const [info, setInfo] = useState(null);

  const handleOriginChange = (e) => setOrigin(o => ({ ...o, name: e.target.value }));
  const handleDestChange = (e) => setDest(d => ({ ...d, name: e.target.value }));

  const calcRoute = () => {
    if (!origin.name || !dest.name) { toast("Enter origin and destination", "warn"); return; }
    const lat1 = origin.lat || 28.6139, lng1 = origin.lng || 77.2090;
    const lat2 = dest.lat || 19.0760, lng2 = dest.lng || 72.8777;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    const hrs = Math.round(dist / 60);
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(lng1, lng2) - 1},${Math.min(lat1, lat2) - 1},${Math.max(lng1, lng2) + 1},${Math.max(lat1, lat2) + 1}&layer=mapnik&marker=${lat1},${lng1}`;
    setMapUrl(url);
    setInfo({ dist, hrs, origin: origin.name, dest: dest.name });
    toast(`Route calculated: ~${dist}km`, "success");
  };

  if (!isPremium) return <PremiumGate feature="Route Planner" onUpgrade={onUpgrade} />;

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: S.colors.text }}>Route Planner</h1>
      <p style={{ margin: "0 0 24px", color: S.colors.muted, fontSize: 13 }}>Plan and calculate routes with location autocomplete</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 20 }}>
        <div style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ color: S.colors.text, margin: "0 0 16px", fontSize: 15 }}>📍 Plan Route</h3>
          <LocationInput label="Origin" name="origin" value={origin.name} onChange={handleOriginChange}
            onLatLngChange={(lat, lng) => setOrigin(o => ({ ...o, lat, lng }))} required placeholder="Type origin city..." />
          <LocationInput label="Destination" name="destination" value={dest.name} onChange={handleDestChange}
            onLatLngChange={(lat, lng) => setDest(d => ({ ...d, lat, lng }))} required placeholder="Type destination city..." />
          <Btn onClick={calcRoute} fullWidth icon={Icons.map}>Calculate Route</Btn>
        </div>

        {info && (
          <div style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ color: S.colors.text, margin: "0 0 16px", fontSize: 15 }}>📊 Route Info</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Distance", `~${info.dist} km`], ["Est. Time", `~${info.hrs} hrs`], ["From", info.origin.slice(0, 30)], ["To", info.dest.slice(0, 30)]].map(([k, v]) => (
                <div key={k} style={{ background: "#0f1923", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: S.colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: S.colors.accent }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#0f1923", borderRadius: 10, fontSize: 12, color: S.colors.muted }}>
              💡 Distance is straight-line estimate. Actual road distance may vary.
            </div>
          </div>
        )}
      </div>

      {mapUrl && (
        <div style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.colors.border}33` }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: S.colors.text }}>🗺 Map Preview</h3>
          </div>
          <iframe src={mapUrl} style={{ width: "100%", height: 380, border: "none", display: "block" }} title="Route Map" />
        </div>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ────────────────────────────────────────────────────────────
function ProfilePage({ apiFetch, toast, onUpgrade }) {
  const { user, isPremium, token, login } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || "", company_name: user?.company_name || "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await apiFetch("/profile", { method: "PUT", body: JSON.stringify(form) });
    if (res?.ok) {
      const u = await res.json();
      login(token, u);
      toast("Profile updated!", "success");
    }
    setSaving(false);
  };

  if (!user) return null;

  const FREE_LIMITS = [{ label: "Trucks", limit: 5 }, { label: "Drivers", limit: 10 }];

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: 26, fontWeight: 800, color: S.colors.text }}>Account</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {/* Profile info */}
        <div style={{ background: S.colors.card, border: `1px solid ${S.colors.border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ color: S.colors.text, margin: "0 0 20px", fontSize: 15 }}>👤 Profile</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: isPremium ? `${S.colors.premium}33` : "#1e3a52", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: isPremium ? S.colors.premium : S.colors.accent, border: `2px solid ${isPremium ? S.colors.premium : S.colors.border}` }}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{ color: S.colors.text, fontWeight: 700, fontSize: 16 }}>{user.username}</div>
              <div style={{ color: S.colors.muted, fontSize: 12 }}>{user.email}</div>
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, background: isPremium ? `${S.colors.premium}22` : "#1e3a52", color: isPremium ? S.colors.premium : S.colors.muted, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                  {isPremium ? "⭐ Premium" : "🆓 Free"}
                </span>
              </div>
            </div>
          </div>
          <Field label="Full Name" name="full_name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" />
          <Field label="Company Name" name="company_name" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Your company" />
          <Btn onClick={save} disabled={saving} fullWidth>{saving ? "Saving..." : "Save Changes"}</Btn>
        </div>

        {/* Package info */}
        <div style={{ background: S.colors.card, border: `1px solid ${isPremium ? S.colors.premium + "44" : S.colors.border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ color: S.colors.text, margin: "0 0 20px", fontSize: 15 }}>📦 Current Plan</h3>
          {isPremium ? (
            <div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: S.colors.premium, marginBottom: 4 }}>Premium</div>
              <p style={{ color: S.colors.muted, fontSize: 13, marginBottom: 20 }}>Full access to all FleetOps features.</p>
              {["Unlimited trucks & drivers", "Route planner with autocomplete", "Fleet map tracking", "Analytics & reports"].map(f => (
                <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <Icon d={Icons.check} size={14} color={S.colors.premium} />
                  <span style={{ color: S.colors.subtle, fontSize: 13 }}>{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🆓</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: S.colors.text, marginBottom: 4 }}>Free Plan</div>
              <p style={{ color: S.colors.muted, fontSize: 13, marginBottom: 16 }}>Basic fleet management.</p>
              {FREE_LIMITS.map(l => (
                <div key={l.label} style={{ background: "#0f1923", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: S.colors.subtle, fontSize: 13 }}>{l.label}</span>
                  <span style={{ color: S.colors.warn, fontSize: 13, fontWeight: 700 }}>Max {l.limit}</span>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <Btn onClick={onUpgrade} fullWidth variant="premium" icon={Icons.crown}>Upgrade to Premium — ₹999/mo</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
function AppContent() {
  const { user, authLoading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState(null);
  const apiFetch = useApiFetch();

  const showToast = (message, type = "info") => setToast({ message, type });

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: S.colors.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚛</div>
          <div style={{ color: S.colors.muted, fontSize: 14 }}>Loading FleetOps...</div>
        </div>
      </div>
    );
  }

  const pages = {
    dashboard: <Dashboard onNavigate={setPage} apiFetch={apiFetch} toast={showToast} />,
    trucks: user ? <Trucks apiFetch={apiFetch} toast={showToast} /> : <AuthGate onLoginClick={() => setShowLogin(true)} />,
    drivers: user ? <Drivers apiFetch={apiFetch} toast={showToast} /> : <AuthGate onLoginClick={() => setShowLogin(true)} />,
    trips: user ? <Trips apiFetch={apiFetch} toast={showToast} /> : <AuthGate onLoginClick={() => setShowLogin(true)} />,
    route: user ? <RoutePlanner apiFetch={apiFetch} toast={showToast} onUpgrade={() => setShowUpgrade(true)} /> : <AuthGate onLoginClick={() => setShowLogin(true)} />,
    profile: user ? <ProfilePage apiFetch={apiFetch} toast={showToast} onUpgrade={() => setShowUpgrade(true)} /> : <AuthGate onLoginClick={() => setShowLogin(true)} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: S.colors.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; font-family: 'Inter', sans-serif; background: ${S.colors.bg}; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3a52; border-radius: 3px; }
        input, select, textarea { font-family: 'Inter', sans-serif; }
        .sidebar { transform: translateX(0); }
        .hamburger { display: none; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); box-shadow: 4px 0 40px rgba(0,0,0,0.7); }
          .hamburger { display: flex !important; }
          .mob-overlay { display: block !important; }
          .mob-close { display: block !important; }
          .main-content { margin-left: 0 !important; max-width: 100vw !important; padding: 72px 16px 24px !important; }
        }
      `}</style>

      {/* Hamburger button */}
      <button className="hamburger" onClick={() => setSidebarOpen(s => !s)} style={{
        position: "fixed", top: 14, left: 14, zIndex: 200, background: "#1e3a52",
        border: `1px solid ${S.colors.border}`, color: S.colors.text, padding: "9px 12px",
        borderRadius: 10, cursor: "pointer", display: "none", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700
      }}>
        <Icon d={Icons.menu} size={16} color={S.colors.accent} />
      </button>

      <Sidebar
        page={page} setPage={setPage}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        onLoginClick={() => setShowLogin(true)}
        onUpgradeClick={() => setShowUpgrade(true)}
      />

      <main className="main-content" style={{
        marginLeft: S.sidebar.width, flex: 1, padding: "32px 28px",
        minHeight: "100vh", maxWidth: `calc(100vw - ${S.sidebar.width}px)`, overflowX: "hidden"
      }}>
        {pages[page] || pages.dashboard}
      </main>

      {/* Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitch={() => { setShowLogin(false); setShowRegister(true); }} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSwitch={() => { setShowRegister(false); setShowLogin(true); }} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
