import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

const API = process.env.REACT_APP_API_URL || "https://fortune-pipeline-gulf-around.trycloudflare.com/api";

// ═══════════════════════════════════════════════════════════════════════════
// AUTH CONTEXT
// ═══════════════════════════════════════════════════════════════════════════
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(() => localStorage.getItem("fo_token"));
  const [authLoading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => { localStorage.removeItem("fo_token"); setToken(null); setLoading(false); });
    } else { setLoading(false); }
  }, [token]);

  const login  = (tok, userData) => { localStorage.setItem("fo_token", tok); setToken(tok); setUser(userData); };
  const logout = () => { localStorage.removeItem("fo_token"); setToken(null); setUser(null); };
  const isPremium = user?.package === "premium";

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isPremium, authLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

function useApiFetch() {
  const { token, logout } = useAuth();
  return useCallback(async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    if (res.status === 401) { logout(); return null; }
    return res;
  }, [token, logout]);
}

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const C = {
  bg: "#060e17", card: "#0a1520", panel: "#0f1923", border: "#1e3a52",
  text: "#e2f0ff", muted: "#64748b", subtle: "#94a3b8",
  accent: "#0ea5e9", success: "#22c55e", warn: "#f59e0b",
  danger: "#ef4444", premium: "#a855f7"
};
const SW = 220;

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════
const Icon = ({ d, size = 20, color = "currentColor", fill = "none", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  truck:    "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  driver:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  trip:     "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  dash:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  map:      "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z",
  alert:    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  plus:     "M12 5v14M5 12h14",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:    "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  check:    "M20 6L9 17l-5-5",
  close:    "M18 6L6 18M6 6l12 12",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  crown:    "M3 11l5-5 4 4 4-6 5 7H3z M3 17h18",
  lock:     "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff:   "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  menu:     "M3 12h18M3 6h18M3 18h18",
  receipt:  "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  navigate: "M3 11l19-9-9 19-2-8-8-2zM22 2L11 13",
  clock:    "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  road:     "M12 2L4 7v10l8 5 8-5V7zM12 22V12M12 12L4 7M12 12l8-5",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};

const statusColor = { available:"#22c55e", on_trip:"#f59e0b", maintenance:"#ef4444", off_duty:"#94a3b8", scheduled:"#60a5fa", in_progress:"#f59e0b", completed:"#22c55e", cancelled:"#ef4444" };
const statusLabel = { available:"Available", on_trip:"On Trip", maintenance:"Maintenance", off_duty:"Off Duty", scheduled:"Scheduled", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };
const matEmoji    = { sand:"🏖️", gitti:"🪨", stone:"🪨", cement:"🏗️", other:"📦" };

// ═══════════════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
function Badge({ status }) {
  const c = statusColor[status];
  return <span style={{ background: c+"22", color: c, border:`1px solid ${c}44`, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>{statusLabel[status]||status}</span>;
}

function daysUntil(d) { if (!d) return null; return Math.ceil((new Date(d)-new Date())/(864e5)); }

function Modal({ title, onClose, children, maxW = 520 }) {
  useEffect(() => { const e = ev => ev.key==="Escape"&&onClose(); window.addEventListener("keydown",e); return ()=>window.removeEventListener("keydown",e); }, [onClose]);
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:maxW,maxHeight:"92vh",overflow:"auto",boxShadow:"0 30px 80px rgba(0,0,0,0.85)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.card,zIndex:1,borderRadius:"16px 16px 0 0" }}>
          <h2 style={{ margin:0,fontSize:17,fontWeight:700,color:C.text }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4,borderRadius:6 }}><Icon d={I.close} size={18} /></button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

function Fld({ label, name, type="text", value, onChange, options, required, placeholder, hint, rows }) {
  const base = { width:"100%",background:"#0a1520",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border 0.2s" };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block",marginBottom:6,fontSize:12,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5 }}>
        {label}{required&&<span style={{color:C.warn}}> *</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange} style={{...base,cursor:"pointer"}}>
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : rows ? (
        <textarea name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} style={{...base,resize:"vertical"}} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} style={base} />
      )}
      {hint&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{hint}</div>}
    </div>
  );
}

function Btn({ onClick, children, variant="primary", disabled, full, size="md", icon, type="button" }) {
  const bg    = {primary:"linear-gradient(135deg,#1e6fa8,#0ea5e9)",secondary:C.card,danger:"#2d1a1a",premium:"linear-gradient(135deg,#7c3aed,#a855f7)",ghost:"transparent"}[variant];
  const color = {primary:"#fff",secondary:C.subtle,danger:C.danger,premium:"#fff",ghost:C.muted}[variant];
  const pad   = size==="sm"?"7px 14px":size==="lg"?"14px 32px":"10px 20px";
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ padding:pad,borderRadius:8,border:`1px solid ${variant==="secondary"?C.border:"transparent"}`,cursor:disabled?"not-allowed":"pointer",fontWeight:700,fontSize:size==="sm"?12:13,background:bg,color,opacity:disabled?0.5:1,transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6,width:full?"100%":undefined,justifyContent:"center" }}>
      {icon&&<Icon d={icon} size={14} color={color} />}
      {children}
    </button>
  );
}

function Toast({ message, type="info", onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,4000); return()=>clearTimeout(t); },[onClose]);
  const border = {info:C.accent,success:C.success,error:C.danger,warn:C.warn}[type];
  const bg     = {info:"#0a2030",success:"#0d2a0d",error:"#2d0a0a",warn:"#2d1a0a"}[type];
  return (
    <div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,background:bg,border:`1px solid ${border}44`,borderRadius:12,padding:"14px 20px",color:C.text,fontSize:13,fontWeight:500,boxShadow:"0 8px 32px rgba(0,0,0,0.6)",maxWidth:360 }}>
      <style>{`@keyframes toastIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}`}</style>
      <div style={{ display:"flex",gap:10,alignItems:"center",animation:"toastIn 0.3s ease" }}>
        <span style={{flex:1}}>{message}</span>
        <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:0,fontSize:16 }}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION AUTOCOMPLETE INPUT
// ═══════════════════════════════════════════════════════════════════════════
function LocInput({ label, name, value, onChange, onLatLng, required, onBlurCallback }) {
  const [sugg, setSugg]       = useState([]);
  const [show, setShow]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const timer                 = useRef(null);

  const fetch_ = async q => {
    if (q.length < 3) { setSugg([]); return; }
    setBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=in`, { headers:{"Accept-Language":"en"} });
      setSugg(await r.json());
    } catch { setSugg([]); } finally { setBusy(false); }
  };

  const onCh = e => {
    onChange(e);
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>fetch_(e.target.value), 420);
    setShow(true);
  };

  const pick = s => {
    onChange({ target:{ name, value:s.display_name } });
    if (onLatLng) onLatLng(parseFloat(s.lat), parseFloat(s.lon));
    setShow(false); setSugg([]);
    if (onBlurCallback) onBlurCallback();
  };

  return (
    <div style={{ marginBottom:16,position:"relative" }}>
      <label style={{ display:"block",marginBottom:6,fontSize:12,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5 }}>
        {label}{required&&<span style={{color:C.warn}}> *</span>}
      </label>
      <input name={name} value={value} onChange={onCh} placeholder="Type a city or location..."
        onFocus={()=>sugg.length>0&&setShow(true)}
        onBlur={()=>setTimeout(()=>setShow(false),200)}
        style={{ width:"100%",background:"#0a1520",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box" }} />
      {busy&&<div style={{position:"absolute",right:14,top:38,color:C.muted,fontSize:11}}>Searching...</div>}
      {show&&sugg.length>0&&(
        <ul style={{ position:"absolute",left:0,right:0,top:"100%",background:"#0d1e2e",border:`1px solid ${C.border}`,borderRadius:8,marginTop:4,padding:0,listStyle:"none",zIndex:50,maxHeight:220,overflowY:"auto",boxShadow:"0 12px 40px rgba(0,0,0,0.6)" }}>
          {sugg.map((s,i)=>(
            <li key={i} onMouseDown={()=>pick(s)}
              style={{ padding:"10px 14px",borderBottom:i<sugg.length-1?`1px solid ${C.border}33`:"none",color:C.subtle,fontSize:12,cursor:"pointer",transition:"background 0.1s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e3a52"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              📍 {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM GATE
// ═══════════════════════════════════════════════════════════════════════════
function PremiumGate({ feature, onUpgrade }) {
  return (
    <div style={{ background:`linear-gradient(135deg,#1a0a2e,${C.panel})`,border:`1px solid ${C.premium}44`,borderRadius:16,padding:48,textAlign:"center",margin:"40px auto",maxWidth:480 }}>
      <div style={{fontSize:52,marginBottom:16}}>⭐</div>
      <h3 style={{color:C.text,fontSize:22,margin:"0 0 10px",fontWeight:800}}>Premium Feature</h3>
      <p style={{color:C.muted,fontSize:14,margin:"0 0 28px",lineHeight:1.7}}>
        <strong style={{color:C.premium}}>{feature}</strong> is available on the Premium plan. Upgrade to unlock all advanced features.
      </p>
      <Btn variant="premium" onClick={onUpgrade} icon={I.crown} size="lg">Upgrade to Premium — ₹999/mo</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION PAGE (route: /verify-email?token=...)
// ═══════════════════════════════════════════════════════════════════════════
function VerifyEmailPage({ token, onVerified }) {
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [msg, setMsg]       = useState("");
  const { login }           = useAuth();

  useEffect(() => {
    if (!token) { setStatus("error"); setMsg("No verification token found."); return; }
    fetch(`${API}/verify-email`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ token })
    })
    .then(r=>r.json().then(d=>({ok:r.ok,d})))
    .then(({ok,d}) => {
      if (ok) { login(d.access_token, d.user); setStatus("success"); setMsg(d.msg); setTimeout(onVerified, 2000); }
      else { setStatus("error"); setMsg(d.msg||"Verification failed"); }
    })
    .catch(()=>{ setStatus("error"); setMsg("Network error"); });
  }, [token]);

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,padding:24 }}>
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:48,maxWidth:440,width:"100%",textAlign:"center" }}>
        <div style={{fontSize:56,marginBottom:20}}>
          {status==="verifying"?"⏳":status==="success"?"✅":"❌"}
        </div>
        <h2 style={{color:C.text,margin:"0 0 12px",fontSize:22,fontWeight:800}}>
          {status==="verifying"?"Verifying your email...":status==="success"?"Email Verified!":"Verification Failed"}
        </h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.7}}>{msg || "Please wait..."}</p>
        {status==="success"&&<p style={{color:C.success,fontSize:13,marginTop:8}}>Redirecting to dashboard...</p>}
        {status==="error"&&(
          <div style={{marginTop:24}}>
            <Btn onClick={onVerified} variant="secondary">Go to Login</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH MODALS
// ═══════════════════════════════════════════════════════════════════════════
function LoginModal({ isOpen, onClose, onSwitch, toast }) {
  const { login }             = useAuth();
  const [form, setForm]       = useState({ username:"", password:"" });
  const [err, setErr]         = useState("");
  const [busy, setBusy]       = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [unverEmail, setUVE]  = useState("");

  if (!isOpen) return null;
  const ch = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const submit = async () => {
    if (!form.username||!form.password) { setErr("All fields required"); return; }
    setBusy(true); setErr("");
    const res = await fetch(`${API}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const d   = await res.json();
    setBusy(false);
    if (!res.ok) {
      if (d.email_unverified) { setUVE(d.email||""); setErr(""); return; }
      setErr(d.msg||"Login failed"); return;
    }
    login(d.access_token, d.user); onClose();
  };

  const resend = async () => {
    await fetch(`${API}/resend-verification`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:unverEmail})});
    toast("Verification email resent! Check your inbox.","success");
    setUVE("");
  };

  if (unverEmail) return (
    <Modal title="Verify Your Email" onClose={()=>{setUVE("");onClose();}}>
      <div style={{textAlign:"center",padding:"16px 0"}}>
        <div style={{fontSize:52,marginBottom:16}}>📧</div>
        <h3 style={{color:C.text,margin:"0 0 12px"}}>Email Not Verified</h3>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:24}}>
          Please verify your email address first.<br/>
          Check your inbox at <strong style={{color:C.accent}}>{unverEmail}</strong>
        </p>
        <Btn onClick={resend} icon={I.mail} fullWidth>Resend Verification Email</Btn>
        <div style={{marginTop:12}}><Btn variant="ghost" onClick={()=>setUVE("")}>← Back to Login</Btn></div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Login to FleetOps" onClose={onClose} maxW={420}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:42}}>🚛</div>
        <p style={{color:C.muted,fontSize:13,margin:"8px 0 0"}}>Welcome back!</p>
      </div>
      {err&&<div style={{background:"#450a0a",border:`1px solid ${C.danger}44`,borderRadius:8,padding:"10px 14px",color:C.danger,fontSize:13,marginBottom:16}}>{err}</div>}
      <Fld label="Username or Email" name="username" value={form.username} onChange={ch} placeholder="Enter username or email" required />
      <div style={{marginBottom:16}}>
        <label style={{display:"block",marginBottom:6,fontSize:12,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Password <span style={{color:C.warn}}>*</span></label>
        <div style={{position:"relative"}}>
          <input name="password" type={showPw?"text":"password"} value={form.password} onChange={ch}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Enter password"
            style={{width:"100%",background:"#0a1520",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 40px 10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box"}} />
          <button onClick={()=>setShowPw(s=>!s)} type="button" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",padding:0}}>
            <Icon d={showPw?I.eyeOff:I.eye} size={16} />
          </button>
        </div>
      </div>
      <Btn onClick={submit} disabled={busy} full size="lg">{busy?"Logging in...":"Login"}</Btn>
      <p style={{textAlign:"center",marginTop:16,fontSize:13,color:C.muted}}>
        Don't have an account? <span onClick={onSwitch} style={{color:C.accent,cursor:"pointer",fontWeight:600}}>Register here</span>
      </p>
    </Modal>
  );
}

function RegisterModal({ isOpen, onClose, onSwitch, toast }) {
  const [form, setForm] = useState({username:"",email:"",password:"",full_name:"",company_name:""});
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;
  const ch = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const submit = async () => {
    if (!form.username||!form.email||!form.password) { setErr("Username, email, and password required"); return; }
    if (form.password.length<6) { setErr("Password must be at least 6 characters"); return; }
    setBusy(true); setErr("");
    const res = await fetch(`${API}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const d   = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(d.msg||"Registration failed"); return; }
    setDone(true);
  };

  if (done) return (
    <Modal title="Check Your Email" onClose={onClose} maxW={440}>
      <div style={{textAlign:"center",padding:"16px 0"}}>
        <div style={{fontSize:56,marginBottom:20}}>📬</div>
        <h3 style={{color:C.text,fontSize:20,margin:"0 0 12px",fontWeight:800}}>Almost there!</h3>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.8,marginBottom:8}}>
          We've sent a verification email to <strong style={{color:C.accent}}>{form.email}</strong>
        </p>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:28}}>
          Click the link in the email to verify your account and login. Check your spam folder if you don't see it.
        </p>
        <Btn onClick={onClose} full>Got it, I'll check my email</Btn>
        <div style={{marginTop:12}}>
          <Btn variant="ghost" onClick={()=>{onClose();onSwitch();}}>Go to Login</Btn>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Create Free Account" onClose={onClose} maxW={460}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:42}}>✨</div>
        <p style={{color:C.muted,fontSize:13,margin:"8px 0 0"}}>Start managing your fleet for free.</p>
      </div>
      {err&&<div style={{background:"#450a0a",border:`1px solid ${C.danger}44`,borderRadius:8,padding:"10px 14px",color:C.danger,fontSize:13,marginBottom:16}}>{err}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="Full Name" name="full_name" value={form.full_name} onChange={ch} placeholder="Your name" />
        <Fld label="Company" name="company_name" value={form.company_name} onChange={ch} placeholder="Company name" />
      </div>
      <Fld label="Username" name="username" value={form.username} onChange={ch} placeholder="Choose a username" required />
      <Fld label="Email" name="email" type="email" value={form.email} onChange={ch} placeholder="your@email.com" required hint="We'll send a verification link to this email" />
      <Fld label="Password" name="password" type="password" value={form.password} onChange={ch} placeholder="Min 6 characters" required />
      <Btn onClick={submit} disabled={busy} full size="lg">{busy?"Creating account...":"Create Account & Send Verification"}</Btn>
      <p style={{textAlign:"center",marginTop:16,fontSize:13,color:C.muted}}>
        Already have an account? <span onClick={onSwitch} style={{color:C.accent,cursor:"pointer",fontWeight:600}}>Login</span>
      </p>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RAZORPAY UPGRADE MODAL
// ═══════════════════════════════════════════════════════════════════════════
function UpgradeModal({ isOpen, onClose, toast }) {
  const { token, login, user } = useAuth();
  const [loading, setLoading]  = useState(false);
  const [done, setDone]        = useState(false);
  const [invoice, setInvoice]  = useState(null);

  if (!isOpen) return null;

  const startPayment = async () => {
    setLoading(true);
    const res = await fetch(`${API}/payment/create-order`, {
      method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}
    });
    const order = await res.json();
    setLoading(false);

    if (!res.ok) { toast(order.msg||"Failed to create order","error"); return; }

    // Razorpay Checkout
    const options = {
      key:         order.key,
      amount:      order.amount,
      currency:    order.currency,
      name:        order.name,
      description: order.description,
      order_id:    order.order_id,
      prefill:     order.prefill,
      theme:       { color:"#0ea5e9" },
      handler: async function(response) {
        // Verify payment on backend
        const vRes = await fetch(`${API}/payment/verify`, {
          method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
          body: JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          })
        });
        const vData = await vRes.json();
        if (vRes.ok) {
          login(token, vData.user);
          setInvoice(vData.payment);
          setDone(true);
          toast("🎉 Premium activated! Invoice sent to your email.","success");
        } else {
          toast(vData.msg||"Payment verification failed","error");
        }
      },
      modal: { ondismiss: () => toast("Payment cancelled","warn") }
    };

    // Load Razorpay script dynamically
    if (!window.Razorpay) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => { new window.Razorpay(options).open(); };
      document.head.appendChild(s);
    } else {
      new window.Razorpay(options).open();
    }
  };

  if (done && invoice) return (
    <Modal title="🎉 Payment Successful!" onClose={onClose} maxW={500}>
      <div style={{background:`linear-gradient(135deg,#0d2a0d,${C.panel})`,border:`1px solid ${C.success}44`,borderRadius:12,padding:24,marginBottom:20,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>✅</div>
        <div style={{color:C.success,fontWeight:800,fontSize:18,marginBottom:4}}>Payment Verified!</div>
        <div style={{color:C.muted,fontSize:13}}>Premium activated. Invoice sent to your email.</div>
      </div>
      {/* Mini invoice */}
      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{color:C.accent,fontWeight:800,fontSize:16}}>🚛 FleetOps</div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.premium,fontWeight:700,letterSpacing:1}}>INVOICE</div>
            <div style={{color:C.text,fontWeight:800}}>#{invoice.id?.toString().padStart(5,"0")}</div>
          </div>
        </div>
        {[["Plan","FleetOps Premium"],["Amount",invoice.amount_display],["Payment ID",invoice.razorpay_payment_id?.slice(-10)],["Status","Paid ✅"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}33`}}>
            <span style={{color:C.muted,fontSize:13}}>{k}</span>
            <span style={{color:k==="Amount"?C.premium:C.text,fontWeight:k==="Amount"?700:500,fontSize:13}}>{v}</span>
          </div>
        ))}
      </div>
      <Btn variant="premium" onClick={onClose} full size="lg">Start using Premium ⭐</Btn>
    </Modal>
  );

  const features = ["Unlimited trucks & drivers","Advanced route planner","Multi-route comparison on map","Fleet map live tracking","Analytics & reports","Invoice on payment","Priority support"];

  return (
    <Modal title="Upgrade to Premium" onClose={onClose} maxW={500}>
      <div style={{background:`linear-gradient(135deg,#1a0a2e,${C.panel})`,border:`1px solid ${C.premium}44`,borderRadius:12,padding:24,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:28,fontWeight:800,color:C.text}}>₹999<span style={{fontSize:14,color:C.muted,fontWeight:400}}>/month</span></div>
            <div style={{color:C.premium,fontSize:13,fontWeight:600}}>FleetOps Premium</div>
          </div>
          <div style={{fontSize:40}}>⭐</div>
        </div>
        {features.map(f=>(
          <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <Icon d={I.check} size={14} color={C.premium} />
            <span style={{color:C.subtle,fontSize:13}}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{background:"#1e3a5222",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:12,color:C.muted}}>
        🔒 Powered by <strong style={{color:C.text}}>Razorpay</strong> — India's most trusted payment gateway. UPI, Cards, Net Banking, Wallets supported.
      </div>
      <Btn onClick={startPayment} disabled={loading} full variant="premium" icon={I.crown} size="lg">
        {loading?"Preparing payment...":"Pay ₹999 with Razorpay"}
      </Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE VIEW MODAL
// ═══════════════════════════════════════════════════════════════════════════
function InvoiceModal({ payment, onClose }) {
  if (!payment) return null;
  const u = payment.user || {};
  const rows = [
    ["Invoice No.", `#${payment.id?.toString().padStart(5,"0")}`],
    ["Plan", "FleetOps Premium"],
    ["Amount", payment.amount_display],
    ["Currency", payment.currency],
    ["Payment ID", payment.razorpay_payment_id||"N/A"],
    ["Order ID", payment.razorpay_order_id||"N/A"],
    ["Date", payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : "N/A"],
    ["Status", payment.status==="paid"?"✅ Paid":"Pending"],
  ];
  return (
    <Modal title="Payment Invoice" onClose={onClose} maxW={520}>
      {/* Invoice Header */}
      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:C.accent}}>🚛 FleetOps</div>
            <div style={{color:C.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase"}}>Truck Logistics Manager</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.premium,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Invoice</div>
            <div style={{fontSize:22,fontWeight:800,color:C.text}}>#{payment.id?.toString().padStart(5,"0")}</div>
          </div>
        </div>
        {/* Bill To */}
        <div style={{background:C.card,borderRadius:8,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Bill To</div>
          <div style={{color:C.text,fontWeight:700}}>{u.full_name||u.username}</div>
          <div style={{color:C.muted,fontSize:13}}>{u.email}</div>
          {u.company_name&&<div style={{color:C.muted,fontSize:13}}>{u.company_name}</div>}
        </div>
        {/* Line items */}
        {rows.map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}22`}}>
            <span style={{color:C.muted,fontSize:13}}>{k}</span>
            <span style={{color:k==="Amount"?C.premium:C.text,fontWeight:k==="Amount"?800:500,fontSize:13}}>{v}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0 0",marginTop:8,borderTop:`2px solid ${C.border}`}}>
          <span style={{color:C.text,fontWeight:700,fontSize:15}}>Total</span>
          <span style={{color:C.premium,fontWeight:800,fontSize:20}}>{payment.amount_display}</span>
        </div>
      </div>
      <div style={{background:"#0d2a0d",border:`1px solid ${C.success}33`,borderRadius:10,padding:14,textAlign:"center",marginBottom:16}}>
        <span style={{color:C.success,fontWeight:600,fontSize:14}}>✅ Payment Successful · Premium Active</span>
      </div>
      <Btn onClick={onClose} variant="secondary" full>Close</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════
const NAV = [
  {id:"dashboard",label:"Dashboard",icon:I.dash},
  {id:"trucks",   label:"Trucks",   icon:I.truck},
  {id:"drivers",  label:"Drivers",  icon:I.driver},
  {id:"trips",    label:"Trips",    icon:I.trip},
  {id:"route",    label:"Route Planner", icon:I.navigate, premium:true},
  {id:"billing",  label:"Billing",  icon:I.receipt},
  {id:"profile",  label:"Account",  icon:I.user},
];

function Sidebar({page,setPage,open,setOpen,onLogin,onUpgrade}){
  const {user,logout,isPremium}=useAuth();
  return(
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:98,display:"none"}} className="mob-overlay"/>}
      <aside className={`sidebar${open?" open":""}`} style={{width:SW,background:"#080f18",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:99,transition:"transform 0.3s ease"}}>
        {/* Brand */}
        <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}22`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:C.accent,letterSpacing:-0.5}}>🚛 FleetOps</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>Truck Logistics Manager</div>
            </div>
            <button onClick={()=>setOpen(false)} className="mob-close" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",display:"none",padding:4}}><Icon d={I.close} size={18}/></button>
          </div>
        </div>
        {/* Nav */}
        <nav style={{padding:"12px 10px",flex:1,overflowY:"auto"}}>
          {NAV.map(item=>{
            const locked=item.premium&&!isPremium;
            const active=page===item.id;
            return(
              <button key={item.id} onClick={()=>{if(locked){onUpgrade();return;}if(!user&&item.id!=="dashboard"){onLogin();return;}setPage(item.id);setOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,background:active?"#1e3a52":"transparent",color:locked?"#334155":(active?C.text:C.muted),fontSize:13,fontWeight:active?600:400,transition:"all 0.15s",textAlign:"left"}}>
                <Icon d={item.icon} size={16} color={locked?"#334155":(active?C.accent:C.muted)}/>
                {item.label}
                {locked&&<span style={{marginLeft:"auto",fontSize:9,background:`${C.premium}22`,color:C.premium,padding:"2px 6px",borderRadius:10,fontWeight:700}}>PRO</span>}
              </button>
            );
          })}
        </nav>
        {/* User */}
        <div style={{padding:"14px 16px",borderTop:`1px solid ${C.border}22`}}>
          {user?(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:isPremium?`${C.premium}33`:"#1e3a52",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:isPremium?C.premium:C.accent,border:`1px solid ${isPremium?C.premium:C.border}`}}>
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{color:C.text,fontSize:13,fontWeight:600}}>{user.username}</div>
                  <div style={{fontSize:10,color:isPremium?C.premium:C.muted}}>{isPremium?"⭐ Premium":"🆓 Free Plan"}</div>
                </div>
              </div>
              {!isPremium&&<button onClick={onUpgrade} style={{width:"100%",background:`linear-gradient(135deg,#7c3aed,#a855f7)`,border:"none",color:"#fff",padding:"8px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:8}}>⭐ Upgrade to Premium</button>}
              <button onClick={logout} style={{width:"100%",background:"none",border:`1px solid ${C.border}`,color:C.muted,padding:"7px",borderRadius:8,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Icon d={I.logout} size={12}/>Logout
              </button>
            </div>
          ):(
            <button onClick={onLogin} style={{width:"100%",background:"linear-gradient(135deg,#1e6fa8,#0ea5e9)",border:"none",color:"#fff",padding:"10px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Login / Register</button>
          )}
        </div>
      </aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function Dashboard({onNav,apiFetch,toast}){
  const [data,setData]=useState(null);const{user}=useAuth();
  const load=useCallback(()=>{if(!user)return;apiFetch("/dashboard").then(r=>r?.json()).then(d=>d&&setData(d)).catch(()=>{});},[apiFetch,user]);
  useEffect(()=>{load();},[load]);
  const seed=()=>apiFetch("/seed",{method:"POST"}).then(()=>{load();toast("Sample data loaded!","success");});
  if(!user)return(<div><h1 style={{color:C.text,fontSize:26,fontWeight:800,margin:"0 0 8px"}}>Welcome to FleetOps 🚛</h1><p style={{color:C.muted}}>Please login to see your fleet dashboard.</p></div>);
  if(!data)return<div style={{color:C.muted,padding:40,textAlign:"center"}}>Loading...</div>;
  const cards=[
    {label:"Total Trucks",value:data.trucks.total,sub:`${data.trucks.active} on trip`,icon:I.truck,color:C.accent},
    {label:"Total Drivers",value:data.drivers.total,sub:`${data.drivers.active} active`,icon:I.driver,color:C.success},
    {label:"Total Trips",value:data.trips.total,sub:`${data.trips.completed} completed`,icon:I.trip,color:C.warn},
    {label:"Active Trips",value:data.trips.active,sub:"Right now",icon:I.map,color:C.premium},
  ];
  const alerts=[
    data.alerts.expiring_insurance>0&&`${data.alerts.expiring_insurance} truck insurance expiring soon`,
    data.alerts.expiring_permits>0&&`${data.alerts.expiring_permits} truck permits expiring soon`,
    data.alerts.expiring_licenses>0&&`${data.alerts.expiring_licenses} driver licenses expiring soon`,
  ].filter(Boolean);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:C.text}}>Hello, {user.full_name||user.username} 👋</h1>
          <p style={{margin:"4px 0 0",color:C.muted,fontSize:13}}>{user.company_name?`${user.company_name} · `:""}Fleet overview</p>
        </div>
        <Btn onClick={seed} variant="secondary" size="sm">Load Sample Data</Btn>
      </div>
      {alerts.length>0&&<div style={{background:"#2d1a0a",border:`1px solid ${C.warn}44`,borderRadius:12,padding:"14px 18px",marginBottom:24}}><div style={{display:"flex",gap:8,alignItems:"flex-start"}}><Icon d={I.alert} color={C.warn} size={18}/><div>{alerts.map((a,i)=><div key={i} style={{color:"#fbbf24",fontSize:13,marginBottom:i<alerts.length-1?4:0}}>⚠ {a}</div>)}</div></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:28}}>
        {cards.map(c=>(
          <div key={c.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:14,right:14,opacity:0.1}}><Icon d={c.icon} size={44} color={c.color} sw={1.5}/></div>
            <div style={{fontSize:32,fontWeight:800,color:c.color}}>{c.value}</div>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginTop:4}}>{c.label}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20}}>
        <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:C.text}}>Recent Trips</h3>
        {data.recent_trips.length===0?(
          <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No trips yet. <span style={{color:C.accent,cursor:"pointer"}} onClick={()=>onNav("trips")}>Create one →</span></div>
        ):data.recent_trips.map(t=>(
          <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}33`,flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{matEmoji[t.material]||"📦"} {t.origin} → {t.destination}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.truck_plate} · {t.driver_name}{t.distance_km?` · ${t.distance_km}km`:""}</div>
            </div>
            <Badge status={t.status}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRUCKS
// ═══════════════════════════════════════════════════════════════════════════
function Trucks({apiFetch,toast}){
  const [trucks,setTrucks]=useState([]);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState(null);
  const [form,setForm]=useState({number_plate:"",model:"",capacity_tons:"",fuel_type:"diesel",last_service:"",insurance_expiry:"",permit_expiry:""});
  const load=useCallback(()=>apiFetch("/trucks").then(r=>r?.json()).then(d=>d&&setTrucks(d)),[apiFetch]);
  useEffect(()=>{load();},[load]);
  const ch=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const save=async()=>{
    const res=await apiFetch(edit?`/trucks/${edit.id}`:"/trucks",{method:edit?"PUT":"POST",body:JSON.stringify({...form,capacity_tons:parseFloat(form.capacity_tons)})});
    if(!res)return;
    if(!res.ok){const d=await res.json();toast(d.msg||"Failed","error");return;}
    setShow(false);setEdit(null);setForm({number_plate:"",model:"",capacity_tons:"",fuel_type:"diesel",last_service:"",insurance_expiry:"",permit_expiry:""});
    load();toast(edit?"Truck updated":"Truck added","success");
  };
  const del=async id=>{if(!window.confirm("Delete this truck?"))return;await apiFetch(`/trucks/${id}`,{method:"DELETE"});load();toast("Deleted","info");};
  const openEdit=t=>{setForm({number_plate:t.number_plate,model:t.model||"",capacity_tons:t.capacity_tons,fuel_type:t.fuel_type,last_service:t.last_service||"",insurance_expiry:t.insurance_expiry||"",permit_expiry:t.permit_expiry||""});setEdit(t);setShow(true);};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h1 style={{margin:0,fontSize:26,fontWeight:800,color:C.text}}>Trucks</h1><p style={{margin:"4px 0 0",color:C.muted,fontSize:13}}>{trucks.length} vehicles in fleet</p></div>
        <Btn onClick={()=>{setEdit(null);setShow(true);}} icon={I.plus}>Add Truck</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:14}}>
        {trucks.map(t=>{
          const ie=daysUntil(t.insurance_expiry),pe=daysUntil(t.permit_expiry);
          const warn=(ie!==null&&ie<=30)||(pe!==null&&pe<=30);
          return(
            <div key={t.id} style={{background:C.card,border:`1px solid ${warn?C.warn+"55":C.border}`,borderRadius:14,padding:18,position:"relative"}}>
              {warn&&<div style={{position:"absolute",top:12,right:12}}><Icon d={I.alert} color={C.warn} size={16}/></div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div><div style={{fontSize:17,fontWeight:800,color:C.accent,letterSpacing:1}}>{t.number_plate}</div><div style={{fontSize:12,color:C.subtle,marginTop:2}}>{t.model||"N/A"}</div></div>
                <Badge status={t.status}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[["Capacity",`${t.capacity_tons}T`],["Fuel",t.fuel_type],["Insurance",t.insurance_expiry?`${ie}d`:"N/A"],["Permit",t.permit_expiry?`${pe}d`:"N/A"]].map(([k,v])=>(
                  <div key={k} style={{background:"#0f1923",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{k}</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{v}</div></div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>openEdit(t)} style={{flex:1,background:"#1e3a52",border:"none",color:C.subtle,padding:"8px",borderRadius:8,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Icon d={I.edit} size={13}/>Edit</button>
                <button onClick={()=>del(t.id)} style={{flex:1,background:"#2d1a1a",border:"none",color:C.danger,padding:"8px",borderRadius:8,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Icon d={I.trash} size={13}/>Delete</button>
              </div>
            </div>
          );
        })}
        {trucks.length===0&&<div style={{color:C.muted,fontSize:13,padding:40,textAlign:"center",gridColumn:"1/-1"}}>No trucks added yet.</div>}
      </div>
      {show&&<Modal title={edit?"Edit Truck":"Add Truck"} onClose={()=>{setShow(false);setEdit(null);}}>
        <Fld label="Number Plate" name="number_plate" value={form.number_plate} onChange={ch} required placeholder="e.g. HR26CA1234"/>
        <Fld label="Model" name="model" value={form.model} onChange={ch} placeholder="e.g. Tata 2518"/>
        <Fld label="Capacity (Tons)" name="capacity_tons" type="number" value={form.capacity_tons} onChange={ch} required/>
        <Fld label="Fuel Type" name="fuel_type" value={form.fuel_type} onChange={ch} options={[{value:"diesel",label:"Diesel"},{value:"cng",label:"CNG"},{value:"petrol",label:"Petrol"}]}/>
        <Fld label="Last Service" name="last_service" type="date" value={form.last_service} onChange={ch}/>
        <Fld label="Insurance Expiry" name="insurance_expiry" type="date" value={form.insurance_expiry} onChange={ch}/>
        <Fld label="Permit Expiry" name="permit_expiry" type="date" value={form.permit_expiry} onChange={ch}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><Btn variant="secondary" onClick={()=>{setShow(false);setEdit(null);}}>Cancel</Btn><Btn onClick={save}>Save</Btn></div>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DRIVERS
// ═══════════════════════════════════════════════════════════════════════════
function Drivers({apiFetch,toast}){
  const [drivers,setDrivers]=useState([]);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState(null);
  const [form,setForm]=useState({name:"",phone:"",license_no:"",license_expiry:"",address:""});
  const load=useCallback(()=>apiFetch("/drivers").then(r=>r?.json()).then(d=>d&&setDrivers(d)),[apiFetch]);
  useEffect(()=>{load();},[load]);
  const ch=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const save=async()=>{
    const res=await apiFetch(edit?`/drivers/${edit.id}`:"/drivers",{method:edit?"PUT":"POST",body:JSON.stringify(form)});
    if(!res)return;if(!res.ok){const d=await res.json();toast(d.msg||"Failed","error");return;}
    setShow(false);setEdit(null);setForm({name:"",phone:"",license_no:"",license_expiry:"",address:""});load();toast(edit?"Driver updated":"Driver added","success");
  };
  const del=async id=>{if(!window.confirm("Delete?"))return;await apiFetch(`/drivers/${id}`,{method:"DELETE"});load();toast("Deleted","info");};
  const openEdit=d=>{setForm({name:d.name,phone:d.phone,license_no:d.license_no,license_expiry:d.license_expiry,address:d.address||""});setEdit(d);setShow(true);};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h1 style={{margin:0,fontSize:26,fontWeight:800,color:C.text}}>Drivers</h1><p style={{margin:"4px 0 0",color:C.muted,fontSize:13}}>{drivers.length} drivers registered</p></div>
        <Btn onClick={()=>{setEdit(null);setShow(true);}} icon={I.plus}>Add Driver</Btn>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
            <thead><tr style={{background:"#0f1923"}}>{["Driver","Phone","License","Expiry","Status","Trips",""].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:0.5,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {drivers.map((d,i)=>{
                const exp=daysUntil(d.license_expiry);
                return(
                  <tr key={d.id} style={{borderBottom:i<drivers.length-1?`1px solid ${C.border}33`:"none"}} onMouseEnter={e=>e.currentTarget.style.background="#0f1923"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"14px 16px"}}><div style={{fontWeight:600,color:C.text}}>{d.name}</div><div style={{fontSize:11,color:C.muted}}>{d.address}</div></td>
                    <td style={{padding:"14px 16px",color:C.subtle}}>{d.phone}</td>
                    <td style={{padding:"14px 16px",color:C.subtle,fontFamily:"monospace",fontSize:12}}>{d.license_no}</td>
                    <td style={{padding:"14px 16px"}}><span style={{color:exp!==null&&exp<=30?C.warn:C.subtle}}>{exp!==null&&exp<=30?"⚠ ":""}{d.license_expiry?.split("T")[0]}</span></td>
                    <td style={{padding:"14px 16px"}}><Badge status={d.status}/></td>
                    <td style={{padding:"14px 16px",color:C.muted}}>{d.total_trips}</td>
                    <td style={{padding:"14px 16px"}}><div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(d)} style={{background:"#1e3a52",border:"none",color:C.subtle,width:30,height:30,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon d={I.edit} size={13}/></button>
                      <button onClick={()=>del(d.id)} style={{background:"#2d1a1a",border:"none",color:C.danger,width:30,height:30,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon d={I.trash} size={13}/></button>
                    </div></td>
                  </tr>
                );
              })}
              {drivers.length===0&&<tr><td colSpan={7} style={{padding:40,textAlign:"center",color:C.muted}}>No drivers added yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {show&&<Modal title={edit?"Edit Driver":"Add Driver"} onClose={()=>{setShow(false);setEdit(null);}}>
        <Fld label="Full Name" name="name" value={form.name} onChange={ch} required/>
        <Fld label="Phone" name="phone" value={form.phone} onChange={ch} required/>
        <Fld label="License No." name="license_no" value={form.license_no} onChange={ch} required/>
        <Fld label="License Expiry" name="license_expiry" type="date" value={form.license_expiry} onChange={ch} required/>
        <Fld label="Address" name="address" value={form.address} onChange={ch}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><Btn variant="secondary" onClick={()=>{setShow(false);setEdit(null);}}>Cancel</Btn><Btn onClick={save}>Save</Btn></div>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIPS (with auto distance calculation)
// ═══════════════════════════════════════════════════════════════════════════
function Trips({apiFetch,toast}){
  const [trips,setTrips]=useState([]);
  const [trucks,setTrucks]=useState([]);
  const [drivers,setDrivers]=useState([]);
  const [show,setShow]=useState(false);
  const [calcBusy,setCalcBusy]=useState(false);
  const [form,setForm]=useState({truck_id:"",driver_id:"",origin:"",origin_lat:"",origin_lng:"",destination:"",dest_lat:"",dest_lng:"",material:"other",load_tons:"",scheduled_date:"",distance_km:"",estimated_hrs:"",notes:""});

  const load=useCallback(async()=>{
    const[tr,tk,dr]=await Promise.all([apiFetch("/trips").then(r=>r?.json()).catch(()=>[]),apiFetch("/trucks").then(r=>r?.json()).catch(()=>[]),apiFetch("/drivers").then(r=>r?.json()).catch(()=>[])]);
    if(tr)setTrips(tr);if(tk)setTrucks(tk);if(dr)setDrivers(dr);
  },[apiFetch]);
  useEffect(()=>{load();},[load]);

  const ch=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));

  // Auto-calc when both coords are set
  const autoCalc=useCallback(async(f)=>{
    if(!f.origin_lat||!f.origin_lng||!f.dest_lat||!f.dest_lng)return;
    setCalcBusy(true);
    try{
      const res=await apiFetch("/route/estimate",{method:"POST",body:JSON.stringify({origin_lat:f.origin_lat,origin_lng:f.origin_lng,dest_lat:f.dest_lat,dest_lng:f.dest_lng})});
      if(res?.ok){const d=await res.json();setForm(prev=>({...prev,distance_km:d.estimated_road_km,estimated_hrs:d.estimated_hrs}));}
    }catch{}finally{setCalcBusy(false);}
  },[apiFetch]);

  const onOriginLL=(lat,lng)=>{
    setForm(f=>{const nf={...f,origin_lat:lat,origin_lng:lng};
      if(nf.dest_lat&&nf.dest_lng)autoCalc(nf);
      return nf;
    });
  };
  const onDestLL=(lat,lng)=>{
    setForm(f=>{const nf={...f,dest_lat:lat,dest_lng:lng};
      if(nf.origin_lat&&nf.origin_lng)autoCalc(nf);
      return nf;
    });
  };

  const save=async()=>{
    if(!form.truck_id||!form.driver_id||!form.origin||!form.destination){toast("Fill all required fields","error");return;}
    const res=await apiFetch("/trips",{method:"POST",body:JSON.stringify({...form,load_tons:parseFloat(form.load_tons)||null,distance_km:parseFloat(form.distance_km)||null,estimated_hrs:parseFloat(form.estimated_hrs)||null})});
    if(!res)return;if(!res.ok){const d=await res.json();toast(d.msg||"Failed","error");return;}
    setShow(false);setForm({truck_id:"",driver_id:"",origin:"",origin_lat:"",origin_lng:"",destination:"",dest_lat:"",dest_lng:"",material:"other",load_tons:"",scheduled_date:"",distance_km:"",estimated_hrs:"",notes:""});
    load();toast("Trip created!","success");
  };

  const updStatus=async(id,status)=>{await apiFetch(`/trips/${id}/status`,{method:"PUT",body:JSON.stringify({status})});load();toast(`Trip: ${statusLabel[status]}`,"info");};
  const del=async id=>{if(!window.confirm("Delete trip?"))return;await apiFetch(`/trips/${id}`,{method:"DELETE"});load();toast("Deleted","info");};

  const avTrucks=trucks.filter(t=>t.status==="available"||t.status==="on_trip");
  const avDrivers=drivers.filter(d=>d.status==="available"||d.status==="on_trip");

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h1 style={{margin:0,fontSize:26,fontWeight:800,color:C.text}}>Trips</h1><p style={{margin:"4px 0 0",color:C.muted,fontSize:13}}>{trips.length} trips total</p></div>
        <Btn onClick={()=>setShow(true)} icon={I.plus}>New Trip</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {trips.map(t=>(
          <div key={t.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:C.text}}>{matEmoji[t.material]||"📦"} {t.origin} <span style={{color:C.muted,fontWeight:400}}>→</span> {t.destination}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4,display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span>🚛 {t.truck_plate}</span>
                  <span>👤 {t.driver_name}</span>
                  {t.distance_km&&<span>📏 {t.distance_km}km</span>}
                  {t.estimated_hrs&&<span>⏱ ~{t.estimated_hrs}h</span>}
                  {t.load_tons&&<span>⚖ {t.load_tons}T</span>}
                </div>
              </div>
              <Badge status={t.status}/>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {t.status==="scheduled"&&<Btn size="sm" onClick={()=>updStatus(t.id,"in_progress")} icon={I.check}>Start</Btn>}
              {t.status==="in_progress"&&<Btn size="sm" onClick={()=>updStatus(t.id,"completed")} icon={I.check}>Complete</Btn>}
              {(t.status==="scheduled"||t.status==="in_progress")&&<Btn size="sm" variant="secondary" onClick={()=>updStatus(t.id,"cancelled")}>Cancel</Btn>}
              <Btn size="sm" variant="danger" onClick={()=>del(t.id)} icon={I.trash}>Delete</Btn>
            </div>
          </div>
        ))}
        {trips.length===0&&<div style={{color:C.muted,textAlign:"center",padding:40}}>No trips yet. Create your first one!</div>}
      </div>

      {show&&<Modal title="Create New Trip" onClose={()=>setShow(false)}>
        <Fld label="Truck" name="truck_id" value={form.truck_id} onChange={ch} required options={[{value:"",label:"Select truck..."}, ...avTrucks.map(t=>({value:t.id,label:`${t.number_plate} (${t.model||"N/A"})`}))]}/>
        <Fld label="Driver" name="driver_id" value={form.driver_id} onChange={ch} required options={[{value:"",label:"Select driver..."}, ...avDrivers.map(d=>({value:d.id,label:d.name}))]}/>
        <LocInput label="Origin" name="origin" value={form.origin} onChange={ch} onLatLng={onOriginLL} required/>
        <LocInput label="Destination" name="destination" value={form.destination} onChange={ch} onLatLng={onDestLL} required/>

        {/* Auto-calculated distance/time panel */}
        {(form.distance_km||calcBusy)&&(
          <div style={{background:calcBusy?"#0f1923":`linear-gradient(135deg,#0a2030,#0f1923)`,border:`1px solid ${calcBusy?C.border:C.accent+"44"}`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
            {calcBusy?(
              <div style={{color:C.muted,fontSize:13,display:"flex",alignItems:"center",gap:8}}><Icon d={I.refresh} size={14} color={C.muted}/>Calculating route...</div>
            ):(
              <div>
                <div style={{fontSize:11,color:C.accent,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,fontWeight:600}}>📍 Auto-Calculated Route</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{background:"#0a1520",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:0.5}}>Est. Distance</div>
                    <div style={{fontSize:16,fontWeight:800,color:C.accent,marginTop:2}}>{form.distance_km} km</div>
                  </div>
                  <div style={{background:"#0a1520",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:0.5}}>Est. Time</div>
                    <div style={{fontSize:16,fontWeight:800,color:C.success,marginTop:2}}>{form.estimated_hrs} hrs</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Material" name="material" value={form.material} onChange={ch} options={[{value:"sand",label:"Sand"},{value:"gitti",label:"Gitti"},{value:"stone",label:"Stone"},{value:"cement",label:"Cement"},{value:"other",label:"Other"}]}/>
          <Fld label="Load (Tons)" name="load_tons" type="number" value={form.load_tons} onChange={ch}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Scheduled Date" name="scheduled_date" type="datetime-local" value={form.scheduled_date} onChange={ch}/>
          <Fld label="Distance (km)" name="distance_km" type="number" value={form.distance_km} onChange={ch} hint="Auto-calculated from coordinates"/>
        </div>
        <Fld label="Notes" name="notes" value={form.notes} onChange={ch} placeholder="Any additional notes..." rows={2}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <Btn variant="secondary" onClick={()=>setShow(false)}>Cancel</Btn>
          <Btn onClick={save}>Create Trip</Btn>
        </div>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED ROUTE PLANNER (Premium) — with Leaflet map + multiple routes
// ═══════════════════════════════════════════════════════════════════════════
function RoutePlanner({apiFetch, toast, onUpgrade}){
  const {isPremium} = useAuth();

  // --- ALL HOOKS FIRST (useState, useRef, useEffect) ---
  const [origin, setOrigin] = useState({name: "", lat: null, lng: null});
  const [dest, setDest] = useState({name: "", lat: null, lng: null});
  const [routes, setRoutes] = useState([]);
  const [selRoute, setSelRoute] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const routeLayers = useRef([]);

  // Effect 1: Initialize Leaflet map (runs once)
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    // Load Leaflet CSS + JS dynamically
    if (!document.getElementById("leaflet-css")){
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    const loadLeaflet = () => {
      if (window.L) { initMap(); return; }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = initMap;
      document.head.appendChild(s);
    };
    const initMap = () => {
      const map = window.L.map(mapRef.current, { zoomControl: true }).setView([22.9074872, 79.0747270], 5);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);
      leafletMap.current = map;
      setMapReady(true);
    };
    setTimeout(loadLeaflet, 100);
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Effect 2: Draw routes on map when routes/selection/origin/dest change
  useEffect(() => {
    if (!leafletMap.current || !window.L || routes.length === 0) return;
    // Clear old layers
    routeLayers.current.forEach(l => l.remove());
    routeLayers.current = [];

    const colors = ["#0ea5e9", "#f59e0b", "#a855f7"];
    const weights = [5, 4, 4];
    const opacities = [0.9, 0.7, 0.7];

    routes.forEach((route, i) => {
      if (!route.geometry) return;
      const coords = route.geometry.coordinates.map(([ln, la]) => [la, ln]);
      if (coords.length === 0) return;
      const pl = window.L.polyline(coords, {
        color: route.color || colors[i] || "#64748b",
        weight: weights[i] || 3,
        opacity: opacities[i] || 0.6,
        dashArray: i === selRoute ? null : "8,6"
      }).addTo(leafletMap.current);
      const midIdx = Math.floor(coords.length / 2);
      const lbl = window.L.divIcon({
        html: `<div style="background:${route.color || colors[i]}; color:#fff; padding:3px 8px; border-radius:20px; font-size:11px; font-weight:700; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.3)">${route.distance_km}km · ${route.duration_text}</div>`,
        className: "",
        iconAnchor: [50, 10]
      });
      const marker = window.L.marker(coords[midIdx], { icon: lbl }).addTo(leafletMap.current);
      routeLayers.current.push(pl, marker);
    });

    // Add markers for origin and dest
    if (origin.lat && dest.lat) {
      const oIcon = window.L.divIcon({
        html: `<div style="background:#22c55e; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4)">A</div>`,
        className: "",
        iconAnchor: [14, 14]
      });
      const dIcon = window.L.divIcon({
        html: `<div style="background:#ef4444; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4)">B</div>`,
        className: "",
        iconAnchor: [14, 14]
      });
      const om = window.L.marker([origin.lat, origin.lng], { icon: oIcon }).addTo(leafletMap.current);
      const dm = window.L.marker([dest.lat, dest.lng], { icon: dIcon }).addTo(leafletMap.current);
      routeLayers.current.push(om, dm);
      // Fit bounds
      const allCoords = routes.flatMap(r => r.geometry ? r.geometry.coordinates.map(([ln, la]) => [la, ln]) : []);
      if (allCoords.length > 0) {
        leafletMap.current.fitBounds(window.L.latLngBounds(allCoords), { padding: [40, 40] });
      }
    }
  }, [routes, selRoute, origin, dest]);

  // --- CONDITIONAL RETURN (AFTER ALL HOOKS) ---
  if (!isPremium) {
    return <PremiumGate feature="Advanced Route Planner" onUpgrade={onUpgrade} />;
  }

  // --- COMPONENT LOGIC (unchanged) ---
  const calcRoute = async () => {
    if (!origin.name || !dest.name) { toast("Enter origin and destination", "warn"); return; }
    if (!origin.lat || !dest.lat) { toast("Please select a location from the dropdown suggestions", "warn"); return; }
    setLoading(true);
    setRoutes([]);
    const res = await apiFetch("/route/calculate", {
      method: "POST",
      body: JSON.stringify({
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_lat: dest.lat,
        dest_lng: dest.lng
      })
    });
    setLoading(false);
    if (!res || !res.ok) { toast("Route calculation failed", "error"); return; }
    const d = await res.json();
    setRoutes(d.routes || []);
    setSelRoute(0);
    if (d.routes?.length > 0) toast(`Found ${d.routes.length} route${d.routes.length > 1 ? "s" : ""}!`, "success");
  };

  const selRouteData = routes[selRoute];
  const routeColors = ["#0ea5e9", "#f59e0b", "#a855f7"];

  // --- JSX (unchanged) ---
  return (
    <div>
      <h1 style={{margin:"0 0 4px",fontSize:26,fontWeight:800,color:C.text}}>Route Planner</h1>
      <p style={{margin:"0 0 24px",color:C.muted,fontSize:13}}>Advanced routing with multi-route comparison and live map</p>

      <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:20,alignItems:"start"}}>
        {/* Left Panel */}
        <div style={{display:"flex",flexDirection:"column",gap:14}} className="route-panel">
          {/* Input Card */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20}}>
            <h3 style={{color:C.text,margin:"0 0 16px",fontSize:14,fontWeight:700}}>📍 Plan Your Route</h3>
            <LocInput label="Origin (A)" name="origin" value={origin.name}
              onChange={e => setOrigin(o => ({...o, name: e.target.value}))}
              onLatLng={(lat, lng) => setOrigin(o => ({...o, lat, lng}))} required />
            <LocInput label="Destination (B)" name="destination" value={dest.name}
              onChange={e => setDest(d => ({...d, name: e.target.value}))}
              onLatLng={(lat, lng) => setDest(d => ({...d, lat, lng}))} required />
            <Btn onClick={calcRoute} disabled={loading} full icon={loading ? I.refresh : I.navigate} size="lg">
              {loading ? "Calculating routes..." : "Find Routes"}
            </Btn>
          </div>

          {/* Route Options */}
          {routes.length > 0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20}}>
              <h3 style={{color:C.text,margin:"0 0 14px",fontSize:14,fontWeight:700}}>🗺 Available Routes</h3>
              {routes.map((r, i) => (
                <div key={i} onClick={() => setSelRoute(i)}
                  style={{
                    background: selRoute === i ? `${r.color || routeColors[i]}18` : "#0f1923",
                    border: `1.5px solid ${selRoute === i ? (r.color || routeColors[i]) : C.border}`,
                    borderRadius: 10, padding: "12px 14px", marginBottom: 8,
                    cursor: "pointer", transition: "all 0.2s"
                  }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:r.color || routeColors[i]}} />
                      <span style={{color: selRoute === i ? C.text : C.subtle, fontWeight: 600, fontSize: 13}}>{r.label}</span>
                    </div>
                    {i === 0 && <span style={{fontSize:9,background:`${C.success}22`,color:C.success,padding:"2px 6px",borderRadius:10,fontWeight:700}}>FASTEST</span>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{background:C.card,borderRadius:6,padding:"6px 10px"}}>
                      <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:0.5}}>Distance</div>
                      <div style={{fontSize:14,fontWeight:800,color:r.color || routeColors[i]}}>{r.distance_km} km</div>
                    </div>
                    <div style={{background:C.card,borderRadius:6,padding:"6px 10px"}}>
                      <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:0.5}}>Est. Time</div>
                      <div style={{fontSize:14,fontWeight:800,color:C.text}}>{r.duration_text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Turn-by-turn for selected route */}
          {selRouteData && selRouteData.steps && selRouteData.steps.length > 0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,maxHeight:320,overflowY:"auto"}}>
              <h3 style={{color:C.text,margin:"0 0 14px",fontSize:14,fontWeight:700}}>🧭 Turn-by-Turn</h3>
              {selRouteData.steps.slice(0,20).map((s, i) => (
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom: i < Math.min(selRouteData.steps.length,20)-1 ? `1px solid ${C.border}22` : "none"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.muted,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{color:C.text,fontSize:12,lineHeight:1.4}}>{s.instruction || s.name || "Continue"}</div>
                    <div style={{color:C.muted,fontSize:10,marginTop:2}}>{s.distance_km}km · {s.duration_min}min</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",position:"sticky",top:20}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}33`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>🗺 Live Route Map</h3>
            {routes.length > 0 && <span style={{fontSize:11,color:C.muted}}>{routes.length} route{routes.length > 1 ? "s" : ""} shown</span>}
          </div>
          <div ref={mapRef} style={{height:560,background:C.bg}}>
            {!mapReady && <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>Loading map...</div>}
          </div>
          {routes.length > 0 && (
            <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}22`,display:"flex",gap:16,flexWrap:"wrap"}}>
              {routes.map((r, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={() => setSelRoute(i)}>
                  <div style={{width:24,height:3,background:r.color || routeColors[i],borderRadius:2,opacity: selRoute === i ? 1 : 0.5}}/>
                  <span style={{fontSize:11,color: selRoute === i ? C.text : C.muted, fontWeight: selRoute === i ? 600 : 400}}>{r.label} · {r.distance_km}km</span>
                </div>
              ))}
            </div>
          )}
          {routes.length === 0 && !loading && (
            <div style={{padding:32,textAlign:"center",color:C.muted,fontSize:13}}>Enter origin & destination above, then click <strong style={{color:C.text}}>Find Routes</strong> to see routes on the map.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BILLING PAGE
// ═══════════════════════════════════════════════════════════════════════════
function Billing({apiFetch,toast,onUpgrade}){
  const {user,isPremium}=useAuth();
  const [payments,setPayments]=useState([]);
  const [invoice,setInvoice]=useState(null);
  useEffect(()=>{apiFetch("/payment/history").then(r=>r?.json()).then(d=>d&&setPayments(d));},[apiFetch]);
  return(
    <div>
      <h1 style={{margin:"0 0 24px",fontSize:26,fontWeight:800,color:C.text}}>Billing & Invoices</h1>
      {/* Current Plan */}
      <div style={{background:isPremium?`linear-gradient(135deg,#1a0a2e,${C.panel})`:C.card,border:`1px solid ${isPremium?C.premium+"44":C.border}`,borderRadius:14,padding:24,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:12,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Current Plan</div>
            <div style={{fontSize:22,fontWeight:800,color:isPremium?C.premium:C.text}}>{isPremium?"⭐ Premium":"🆓 Free"}</div>
            {isPremium?<div style={{color:C.muted,fontSize:13,marginTop:4}}>Full access to all features</div>:<div style={{color:C.muted,fontSize:13,marginTop:4}}>Upgrade to unlock all features</div>}
          </div>
          {!isPremium&&<Btn variant="premium" onClick={onUpgrade} icon={I.crown}>Upgrade to Premium — ₹999/mo</Btn>}
        </div>
      </div>
      {/* Payment History */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}33`}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>Payment History</h3>
        </div>
        {payments.length===0?(
          <div style={{padding:40,textAlign:"center",color:C.muted,fontSize:13}}>No payments yet.{!isPremium&&<span> <span style={{color:C.accent,cursor:"pointer"}} onClick={onUpgrade}>Upgrade to Premium</span> to get started.</span>}</div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:500}}>
              <thead><tr style={{background:"#0f1923"}}>{["Invoice","Plan","Amount","Date","Status",""].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:0.5,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>
                {payments.map((p,i)=>(
                  <tr key={p.id} style={{borderBottom:i<payments.length-1?`1px solid ${C.border}22`:""}} onMouseEnter={e=>e.currentTarget.style.background="#0f1923"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={{padding:"14px 16px",color:C.accent,fontFamily:"monospace",fontWeight:600}}>#{p.id?.toString().padStart(5,"0")}</td>
                    <td style={{padding:"14px 16px",color:C.text,textTransform:"capitalize"}}>{p.plan}</td>
                    <td style={{padding:"14px 16px",color:C.premium,fontWeight:700}}>{p.amount_display}</td>
                    <td style={{padding:"14px 16px",color:C.muted,fontSize:12}}>{p.paid_at?new Date(p.paid_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):"—"}</td>
                    <td style={{padding:"14px 16px"}}><span style={{color:p.status==="paid"?C.success:C.warn,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{p.status==="paid"?"✅ Paid":"⏳ Pending"}</span></td>
                    <td style={{padding:"14px 16px"}}>{p.status==="paid"&&<button onClick={()=>setInvoice(p)} style={{background:"#1e3a52",border:"none",color:C.subtle,padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:4}}><Icon d={I.receipt} size={12}/>View Invoice</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {invoice&&<InvoiceModal payment={invoice} onClose={()=>setInvoice(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════
function Profile({apiFetch,toast,onUpgrade}){
  const {user,isPremium,token,login}=useAuth();
  const [form,setForm]=useState({full_name:user?.full_name||"",company_name:user?.company_name||""});
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);const res=await apiFetch("/profile",{method:"PUT",body:JSON.stringify(form)});if(res?.ok){const u=await res.json();login(token,u);toast("Profile updated!","success");}setSaving(false);};
  if(!user)return null;
  return(
    <div>
      <h1 style={{margin:"0 0 24px",fontSize:26,fontWeight:800,color:C.text}}>Account</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{color:C.text,margin:"0 0 20px",fontSize:15,fontWeight:700}}>👤 Profile Info</h3>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:isPremium?`${C.premium}33`:"#1e3a52",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:isPremium?C.premium:C.accent,border:`2px solid ${isPremium?C.premium:C.border}`}}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{color:C.text,fontWeight:700,fontSize:16}}>{user.username}</div>
              <div style={{color:C.muted,fontSize:12}}>{user.email}</div>
              <div style={{marginTop:4,display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:11,background:isPremium?`${C.premium}22`:"#1e3a52",color:isPremium?C.premium:C.muted,padding:"2px 8px",borderRadius:10,fontWeight:600}}>{isPremium?"⭐ Premium":"🆓 Free"}</span>
                <span style={{fontSize:11,color:user.email_verified?C.success:C.warn}}>
                  {user.email_verified?"✅ Verified":"⚠ Unverified"}
                </span>
              </div>
            </div>
          </div>
          <Fld label="Full Name" name="full_name" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} placeholder="Your full name"/>
          <Fld label="Company Name" name="company_name" value={form.company_name} onChange={e=>setForm(f=>({...f,company_name:e.target.value}))} placeholder="Your company"/>
          <Btn onClick={save} disabled={saving} full>{saving?"Saving...":"Save Changes"}</Btn>
        </div>
        <div style={{background:C.card,border:`1px solid ${isPremium?C.premium+"44":C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{color:C.text,margin:"0 0 20px",fontSize:15,fontWeight:700}}>📦 Plan</h3>
          {isPremium?(
            <div>
              <div style={{fontSize:28,marginBottom:8}}>⭐</div>
              <div style={{fontSize:20,fontWeight:800,color:C.premium,marginBottom:8}}>Premium</div>
              {["Unlimited trucks & drivers","Advanced route planner","Multi-route comparison","Fleet map","Analytics"].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Icon d={I.check} size={14} color={C.premium}/><span style={{color:C.subtle,fontSize:13}}>{f}</span></div>
              ))}
            </div>
          ):(
            <div>
              <div style={{fontSize:28,marginBottom:8}}>🆓</div>
              <div style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:12}}>Free Plan</div>
              {[{label:"Trucks",limit:"5"},{label:"Drivers",limit:"10"}].map(l=>(
                <div key={l.label} style={{background:"#0f1923",borderRadius:8,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:C.subtle,fontSize:13}}>{l.label}</span>
                  <span style={{color:C.warn,fontSize:13,fontWeight:700}}>Max {l.limit}</span>
                </div>
              ))}
              <div style={{marginTop:20}}><Btn onClick={onUpgrade} full variant="premium" icon={I.crown}>Upgrade — ₹999/mo</Btn></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH GATE
// ═══════════════════════════════════════════════════════════════════════════
function AuthGate({onLogin}){
  return(
    <div style={{minHeight:"80vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:24}}>
      <div style={{fontSize:64,marginBottom:16}}>🔒</div>
      <h2 style={{color:C.text,fontSize:24,margin:"0 0 8px",fontWeight:800}}>Login Required</h2>
      <p style={{color:C.muted,marginBottom:28,maxWidth:360}}>Please login or create a free account to access this feature.</p>
      <Btn onClick={onLogin} icon={I.user} size="lg">Login / Register</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
function AppContent(){
  const {user,authLoading}=useAuth();
  const [page,setPage]=useState("dashboard");
  const [sidebarOpen,setSO]=useState(false);
  const [showLogin,setShowLogin]=useState(false);
  const [showReg,setShowReg]=useState(false);
  const [showUpgrade,setShowUpgrade]=useState(false);
  const [toast,setToast]=useState(null);
  const apiFetch=useApiFetch();

  // Check for email verification token in URL
  const [verifyToken, setVerifyToken] = useState(null);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const tk=params.get("token");
    const path=window.location.pathname;
    if(path.includes("verify-email")&&tk){ setVerifyToken(tk); }
  },[]);

  const showToast=(message,type="info")=>setToast({message,type});

  if(authLoading)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>🚛</div><div style={{color:C.muted,fontSize:14}}>Loading FleetOps...</div></div>
    </div>
  );

  // Email verification screen
  if(verifyToken)return(
    <VerifyEmailPage token={verifyToken} onVerified={()=>{setVerifyToken(null);window.history.replaceState({},"","/");setPage("dashboard");}}/>
  );

  const g=(id)=>user?null:<AuthGate onLogin={()=>setShowLogin(true)}/>;

  const pages={
    dashboard: <Dashboard onNav={setPage} apiFetch={apiFetch} toast={showToast}/>,
    trucks:    g("trucks")||<Trucks apiFetch={apiFetch} toast={showToast}/>,
    drivers:   g("drivers")||<Drivers apiFetch={apiFetch} toast={showToast}/>,
    trips:     g("trips")||<Trips apiFetch={apiFetch} toast={showToast}/>,
    route:     g("route")||<RoutePlanner apiFetch={apiFetch} toast={showToast} onUpgrade={()=>setShowUpgrade(true)}/>,
    billing:   g("billing")||<Billing apiFetch={apiFetch} toast={showToast} onUpgrade={()=>setShowUpgrade(true)}/>,
    profile:   g("profile")||<Profile apiFetch={apiFetch} toast={showToast} onUpgrade={()=>setShowUpgrade(true)}/>,
  };

  return(
    <div style={{display:"flex",minHeight:"100vh",background:C.bg}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{margin:0;font-family:'Inter',sans-serif;background:${C.bg}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1e3a52;border-radius:3px}
        input,select,textarea{font-family:'Inter',sans-serif}
        .sidebar{transform:translateX(0)}
        .hamburger{display:none}
        .leaflet-container{font-family:'Inter',sans-serif!important}
        @media(max-width:900px){
          .sidebar{transform:translateX(-100%)}
          .sidebar.open{transform:translateX(0);box-shadow:4px 0 40px rgba(0,0,0,0.7)}
          .hamburger{display:flex!important}
          .mob-overlay{display:block!important}
          .mob-close{display:block!important}
          .main-content{margin-left:0!important;max-width:100vw!important;padding:72px 16px 24px!important}
          .route-panel{display:flex;flex-direction:column}
        }
        @media(max-width:600px){
          .drivers-desktop table{display:block;overflow-x:auto}
        }
      `}</style>

      <button className="hamburger" onClick={()=>setSO(s=>!s)} style={{position:"fixed",top:14,left:14,zIndex:200,background:"#1e3a52",border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:10,cursor:"pointer",display:"none",alignItems:"center",gap:6,fontSize:13,fontWeight:700}}>
        <Icon d={I.menu} size={16} color={C.accent}/>
      </button>

      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSO} onLogin={()=>setShowLogin(true)} onUpgrade={()=>setShowUpgrade(true)}/>

      <main className="main-content" style={{marginLeft:SW,flex:1,padding:"32px 28px",minHeight:"100vh",maxWidth:`calc(100vw - ${SW}px)`,overflowX:"hidden"}}>
        {pages[page]||pages.dashboard}
      </main>

      <LoginModal isOpen={showLogin} onClose={()=>setShowLogin(false)} onSwitch={()=>{setShowLogin(false);setShowReg(true);}} toast={showToast}/>
      <RegisterModal isOpen={showReg} onClose={()=>setShowReg(false)} onSwitch={()=>{setShowReg(false);setShowLogin(true);}} toast={showToast}/>
      <UpgradeModal isOpen={showUpgrade} onClose={()=>setShowUpgrade(false)} toast={showToast}/>

      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}

export default function App(){
  return<AuthProvider><AppContent/></AuthProvider>;
}
