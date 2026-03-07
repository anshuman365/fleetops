import React from "react";
import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "https://fleetops-gnij.onrender.com/api";

// ─── ICONS ────────────────────────────────────────────────────────────────────
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
  speed: "M12 2a10 10 0 110 20A10 10 0 0112 2z M12 6v6l4 2",
  location: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusColor = {
  available: "#22c55e", on_trip: "#f59e0b", maintenance: "#ef4444", off_duty: "#94a3b8",
  scheduled: "#60a5fa", in_progress: "#f59e0b", completed: "#22c55e", cancelled: "#ef4444"
};
const statusLabel = {
  available: "Available", on_trip: "On Trip", maintenance: "Maintenance", off_duty: "Off Duty",
  scheduled: "Scheduled", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled"
};
const materialEmoji = { sand: "🏖️", gitti: "🪨", stone: "🪨", cement: "🏗️", other: "📦" };

function Badge({ status }) {
  return (
    <span style={{
      background: statusColor[status] + "22",
      color: statusColor[status],
      border: `1px solid ${statusColor[status]}44`,
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: "uppercase"
    }}>{statusLabel[status] || status}</span>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#0f1923", border: "1px solid #1e3a52", borderRadius: 16,
        width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 25px 80px rgba(0,0,0,0.8)"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: "1px solid #1e3a52"
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e2f0ff", fontFamily: "'Syne', sans-serif" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <Icon d={Icons.close} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── FORM INPUT ───────────────────────────────────────────────────────────────
function Field({ label, name, type = "text", value, onChange, options, required }) {
  const inputStyle = {
    width: "100%", background: "#0a1520", border: "1px solid #1e3a52",
    borderRadius: 8, padding: "10px 14px", color: "#e2f0ff", fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit"
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: "#f59e0b" }}> *</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange} style={{ ...inputStyle, cursor: "pointer" }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required} style={inputStyle} />
      )}
    </div>
  );
}

function FormBtn({ onClick, children, variant = "primary", disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "11px 24px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
      background: variant === "primary" ? "linear-gradient(135deg, #1e6fa8, #0ea5e9)" : "#1e3a52",
      color: variant === "primary" ? "#fff" : "#94a3b8",
      opacity: disabled ? 0.5 : 1, transition: "all 0.2s"
    }}>{children}</button>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    fetch(`${API}/dashboard`).then(r => r.json()).then(setData).catch(() => {});
  }, [seeded]);

  const seed = () => fetch(`${API}/seed`, { method: "POST" }).then(() => setSeeded(s => !s));

  if (!data) return <div style={{ color: "#64748b", padding: 40, textAlign: "center" }}>Loading...</div>;

  const cards = [
    { label: "Total Trucks", value: data.trucks.total, sub: `${data.trucks.active} on trip`, icon: Icons.truck, color: "#0ea5e9" },
    { label: "Total Drivers", value: data.drivers.total, sub: `${data.drivers.active} active`, icon: Icons.driver, color: "#22c55e" },
    { label: "Total Trips", value: data.trips.total, sub: `${data.trips.completed} completed`, icon: Icons.trip, color: "#f59e0b" },
    { label: "Active Trips", value: data.trips.active, sub: "Right now", icon: Icons.map, color: "#a855f7" },
  ];

  const alerts = [
    data.alerts.expiring_insurance > 0 && `${data.alerts.expiring_insurance} truck insurance expiring soon`,
    data.alerts.expiring_permits > 0 && `${data.alerts.expiring_permits} truck permits expiring soon`,
    data.alerts.expiring_licenses > 0 && `${data.alerts.expiring_licenses} driver licenses expiring soon`,
  ].filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e2f0ff", fontFamily: "'Syne', sans-serif" }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Fleet overview & quick stats</p>
        </div>
        <button onClick={seed} style={{
          background: "#1e3a52", border: "1px solid #2d5a7a", color: "#94a3b8",
          padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600
        }}>Load Sample Data</button>
      </div>

      {alerts.length > 0 && (
        <div style={{ background: "#2d1a0a", border: "1px solid #f59e0b44", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon d={Icons.alert} color="#f59e0b" size={18} />
            <div>
              {alerts.map((a, i) => (
                <div key={i} style={{ color: "#fbbf24", fontSize: 13, marginBottom: i < alerts.length - 1 ? 4 : 0 }}>⚠ {a}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 14, padding: 20,
            position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: 16, right: 16, opacity: 0.15 }}>
              <Icon d={c.icon} size={40} color={c.color} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: c.color, fontFamily: "'Syne', sans-serif" }}>{c.value}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2f0ff", marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 14, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#e2f0ff" }}>Recent Trips</h3>
        {data.recent_trips.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            No trips yet. <span style={{ color: "#0ea5e9", cursor: "pointer" }} onClick={() => onNavigate("trips")}>Create one →</span>
          </div>
        ) : (
          data.recent_trips.map(t => (
            <div key={t.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0", borderBottom: "1px solid #1e3a5233"
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2f0ff" }}>
                  {materialEmoji[t.material] || "📦"} {t.origin} → {t.destination}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  {t.truck_plate} • {t.driver_name} • {t.load_tons ? `${t.load_tons}T` : ""}
                </div>
              </div>
              <Badge status={t.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── TRUCKS PAGE ──────────────────────────────────────────────────────────────
function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ number_plate: "", model: "", capacity_tons: "", fuel_type: "diesel", last_service: "", insurance_expiry: "", permit_expiry: "" });

  const load = () => fetch(`${API}/trucks`).then(r => r.json()).then(setTrucks);
  useEffect(() => { load(); }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const url = editItem ? `${API}/trucks/${editItem.id}` : `${API}/trucks`;
    const method = editItem ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, capacity_tons: parseFloat(form.capacity_tons) }) });
    setShowForm(false); setEditItem(null);
    setForm({ number_plate: "", model: "", capacity_tons: "", fuel_type: "diesel", last_service: "", insurance_expiry: "", permit_expiry: "" });
    load();
  };

  const del = async id => {
    if (!confirm("Delete this truck?")) return;
    await fetch(`${API}/trucks/${id}`, { method: "DELETE" });
    load();
  };

  const openEdit = t => {
    setForm({ number_plate: t.number_plate, model: t.model || "", capacity_tons: t.capacity_tons, fuel_type: t.fuel_type, last_service: t.last_service || "", insurance_expiry: t.insurance_expiry || "", permit_expiry: t.permit_expiry || "" });
    setEditItem(t); setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e2f0ff", fontFamily: "'Syne', sans-serif" }}>Trucks</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>{trucks.length} vehicles in fleet</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} style={{
          background: "linear-gradient(135deg, #1e6fa8, #0ea5e9)", border: "none", color: "#fff",
          padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
          display: "flex", alignItems: "center", gap: 6
        }}>
          <Icon d={Icons.plus} size={16} color="#fff" /> Add Truck
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {trucks.map(t => {
          const insExpiry = daysUntil(t.insurance_expiry);
          const permExpiry = daysUntil(t.permit_expiry);
          const warn = (insExpiry !== null && insExpiry <= 30) || (permExpiry !== null && permExpiry <= 30);
          return (
            <div key={t.id} style={{
              background: "#0a1520", border: `1px solid ${warn ? "#f59e0b55" : "#1e3a52"}`,
              borderRadius: 14, padding: 20, position: "relative"
            }}>
              {warn && <div style={{ position: "absolute", top: 12, right: 12 }}><Icon d={Icons.alert} color="#f59e0b" size={16} /></div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0ea5e9", fontFamily: "'Syne', sans-serif", letterSpacing: 1 }}>{t.number_plate}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{t.model || "N/A"}</div>
                </div>
                <Badge status={t.status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  ["Capacity", `${t.capacity_tons}T`],
                  ["Fuel", t.fuel_type],
                  ["Insurance", t.insurance_expiry ? `${insExpiry}d` : "N/A"],
                  ["Permit", t.permit_expiry ? `${permExpiry}d` : "N/A"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#0f1923", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2f0ff" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(t)} style={{ flex: 1, background: "#1e3a52", border: "none", color: "#94a3b8", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Icon d={Icons.edit} size={14} /> Edit
                </button>
                <button onClick={() => del(t.id)} style={{ flex: 1, background: "#2d1a1a", border: "none", color: "#ef4444", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Icon d={Icons.trash} size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <Modal title={editItem ? "Edit Truck" : "Add Truck"} onClose={() => { setShowForm(false); setEditItem(null); }}>
          <Field label="Number Plate" name="number_plate" value={form.number_plate} onChange={handleChange} required />
          <Field label="Model" name="model" value={form.model} onChange={handleChange} />
          <Field label="Capacity (Tons)" name="capacity_tons" type="number" value={form.capacity_tons} onChange={handleChange} required />
          <Field label="Fuel Type" name="fuel_type" value={form.fuel_type} onChange={handleChange} options={[{value:"diesel",label:"Diesel"},{value:"cng",label:"CNG"},{value:"petrol",label:"Petrol"}]} />
          <Field label="Last Service Date" name="last_service" type="date" value={form.last_service} onChange={handleChange} />
          <Field label="Insurance Expiry" name="insurance_expiry" type="date" value={form.insurance_expiry} onChange={handleChange} />
          <Field label="Permit Expiry" name="permit_expiry" type="date" value={form.permit_expiry} onChange={handleChange} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <FormBtn variant="secondary" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</FormBtn>
            <FormBtn onClick={save}>Save Truck</FormBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DRIVERS PAGE ─────────────────────────────────────────────────────────────
function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", license_no: "", license_expiry: "", address: "" });

  const load = () => fetch(`${API}/drivers`).then(r => r.json()).then(setDrivers);
  useEffect(() => { load(); }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const url = editItem ? `${API}/drivers/${editItem.id}` : `${API}/drivers`;
    const method = editItem ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setEditItem(null);
    setForm({ name: "", phone: "", license_no: "", license_expiry: "", address: "" });
    load();
  };

  const del = async id => {
    if (!confirm("Delete this driver?")) return;
    await fetch(`${API}/drivers/${id}`, { method: "DELETE" });
    load();
  };

  const openEdit = d => {
    setForm({ name: d.name, phone: d.phone, license_no: d.license_no, license_expiry: d.license_expiry, address: d.address || "" });
    setEditItem(d); setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e2f0ff", fontFamily: "'Syne', sans-serif" }}>Drivers</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>{drivers.length} drivers registered</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} style={{
          background: "linear-gradient(135deg, #1e6fa8, #0ea5e9)", border: "none", color: "#fff",
          padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
          display: "flex", alignItems: "center", gap: 6
        }}>
          <Icon d={Icons.plus} size={16} color="#fff" /> Add Driver
        </button>
      </div>

      <div style={{ background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0f1923" }}>
              {["Driver", "Phone", "License", "Expiry", "Status", "Trips", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #1e3a52" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((d, i) => {
              const exp = daysUntil(d.license_expiry);
              return (
                <tr key={d.id} style={{ borderBottom: i < drivers.length - 1 ? "1px solid #1e3a5233" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#0f1923"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#e2f0ff" }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{d.address}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#94a3b8" }}>{d.phone}</td>
                  <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{d.license_no}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ color: exp !== null && exp <= 30 ? "#f59e0b" : "#94a3b8" }}>
                      {exp !== null && exp <= 30 ? "⚠ " : ""}{d.license_expiry?.split("T")[0]}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}><Badge status={d.status} /></td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>{d.total_trips}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(d)} style={{ background: "#1e3a52", border: "none", color: "#94a3b8", width: 30, height: 30, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={Icons.edit} size={13} />
                      </button>
                      <button onClick={() => del(d.id)} style={{ background: "#2d1a1a", border: "none", color: "#ef4444", width: 30, height: 30, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={Icons.trash} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {drivers.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No drivers yet. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editItem ? "Edit Driver" : "Add Driver"} onClose={() => { setShowForm(false); setEditItem(null); }}>
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
          <Field label="License Number" name="license_no" value={form.license_no} onChange={handleChange} required />
          <Field label="License Expiry" name="license_expiry" type="date" value={form.license_expiry} onChange={handleChange} required />
          <Field label="Address" name="address" value={form.address} onChange={handleChange} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <FormBtn variant="secondary" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</FormBtn>
            <FormBtn onClick={save}>Save Driver</FormBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TRIPS PAGE ───────────────────────────────────────────────────────────────
function Trips() {
  const [trips, setTrips] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    truck_id: "", driver_id: "", origin: "", destination: "",
    material: "sand", load_tons: "", scheduled_date: "", notes: "",
    origin_lat: "", origin_lng: "", dest_lat: "", dest_lng: ""
  });

  const load = () => {
    const q = filter === "all" ? "" : `?status=${filter}`;
    fetch(`${API}/trips${q}`).then(r => r.json()).then(setTrips);
  };
  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    fetch(`${API}/trucks`).then(r => r.json()).then(setTrucks);
    fetch(`${API}/drivers`).then(r => r.json()).then(setDrivers);
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const geocode = async (address, prefix) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
      const d = await r.json();
      if (d[0]) setForm(f => ({ ...f, [`${prefix}_lat`]: d[0].lat, [`${prefix}_lng`]: d[0].lon }));
    } catch { }
  };

  const save = async () => {
    await fetch(`${API}/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, truck_id: parseInt(form.truck_id), driver_id: parseInt(form.driver_id), load_tons: parseFloat(form.load_tons) || 0 })
    });
    setShowForm(false);
    setForm({ truck_id: "", driver_id: "", origin: "", destination: "", material: "sand", load_tons: "", scheduled_date: "", notes: "", origin_lat: "", origin_lng: "", dest_lat: "", dest_lng: "" });
    load();
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/trips/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  const del = async id => {
    if (!confirm("Delete this trip?")) return;
    await fetch(`${API}/trips/${id}`, { method: "DELETE" });
    load();
  };

  const filters = ["all", "scheduled", "in_progress", "completed", "cancelled"];
  const availTrucks = trucks.filter(t => t.status === "available");
  const availDrivers = drivers.filter(d => d.status === "available");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e2f0ff", fontFamily: "'Syne', sans-serif" }}>Trips</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>{trips.length} trips</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: "linear-gradient(135deg, #1e6fa8, #0ea5e9)", border: "none", color: "#fff",
          padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
          display: "flex", alignItems: "center", gap: 6
        }}>
          <Icon d={Icons.plus} size={16} color="#fff" /> New Trip
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === f ? "#0ea5e9" : "#1e3a52"}`,
            background: filter === f ? "#0ea5e922" : "transparent",
            color: filter === f ? "#0ea5e9" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600,
            textTransform: "capitalize"
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {trips.map(t => (
          <div key={t.id} style={{ background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{materialEmoji[t.material] || "📦"}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e2f0ff" }}>{t.origin} → {t.destination}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      🚛 {t.truck_plate} &nbsp;•&nbsp; 👤 {t.driver_name} &nbsp;•&nbsp; {t.load_tons ? `⚖ ${t.load_tons}T` : ""} &nbsp;•&nbsp; {t.material?.toUpperCase()}
                    </div>
                  </div>
                </div>
                {t.notes && <div style={{ fontSize: 12, color: "#64748b", background: "#0f1923", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>📝 {t.notes}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <Badge status={t.status} />
                <div style={{ fontSize: 11, color: "#64748b" }}>{t.scheduled_date?.split("T")[0]}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {t.status === "scheduled" && (
                <button onClick={() => updateStatus(t.id, "in_progress")} style={{ background: "#1a2d1a", border: "1px solid #22c55e44", color: "#22c55e", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>▶ Start Trip</button>
              )}
              {t.status === "in_progress" && (
                <button onClick={() => updateStatus(t.id, "completed")} style={{ background: "#1a2d1a", border: "1px solid #22c55e44", color: "#22c55e", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✓ Mark Complete</button>
              )}
              {["scheduled", "in_progress"].includes(t.status) && (
                <button onClick={() => updateStatus(t.id, "cancelled")} style={{ background: "#2d1a1a", border: "1px solid #ef444444", color: "#ef4444", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✕ Cancel</button>
              )}
              <button onClick={() => del(t.id)} style={{ background: "transparent", border: "1px solid #1e3a52", color: "#64748b", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Delete</button>
            </div>
          </div>
        ))}
        {trips.length === 0 && (
          <div style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>No trips found.</div>
        )}
      </div>

      {showForm && (
        <Modal title="New Trip" onClose={() => setShowForm(false)}>
          <Field label="Truck" name="truck_id" value={form.truck_id} onChange={handleChange} required
            options={[{ value: "", label: "Select truck..." }, ...availTrucks.map(t => ({ value: t.id, label: `${t.number_plate} (${t.capacity_tons}T)` }))]} />
          <Field label="Driver" name="driver_id" value={form.driver_id} onChange={handleChange} required
            options={[{ value: "", label: "Select driver..." }, ...availDrivers.map(d => ({ value: d.id, label: d.name }))]} />
          <Field label="Material" name="material" value={form.material} onChange={handleChange}
            options={[{ value: "sand", label: "🏖️ Sand" }, { value: "gitti", label: "🪨 Gitti" }, { value: "stone", label: "🪨 Stone" }, { value: "cement", label: "🏗️ Cement" }, { value: "other", label: "📦 Other" }]} />
          <Field label="Load (Tons)" name="load_tons" type="number" value={form.load_tons} onChange={handleChange} />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Origin <span style={{ color: "#f59e0b" }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="origin" value={form.origin} onChange={handleChange} placeholder="e.g. Faridabad, Haryana" style={{ flex: 1, background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 8, padding: "10px 14px", color: "#e2f0ff", fontSize: 14, outline: "none" }} />
              <button onClick={() => geocode(form.origin, "origin")} style={{ background: "#1e3a52", border: "none", color: "#0ea5e9", padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>📍 Geo</button>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Destination <span style={{ color: "#f59e0b" }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Delhi NCR" style={{ flex: 1, background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 8, padding: "10px 14px", color: "#e2f0ff", fontSize: 14, outline: "none" }} />
              <button onClick={() => geocode(form.destination, "dest")} style={{ background: "#1e3a52", border: "none", color: "#0ea5e9", padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>📍 Geo</button>
            </div>
          </div>
          <Field label="Scheduled Date" name="scheduled_date" type="datetime-local" value={form.scheduled_date} onChange={handleChange} />
          <Field label="Notes" name="notes" value={form.notes} onChange={handleChange} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <FormBtn variant="secondary" onClick={() => setShowForm(false)}>Cancel</FormBtn>
            <FormBtn onClick={save} disabled={!form.truck_id || !form.driver_id || !form.origin || !form.destination}>Create Trip</FormBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MAP / ROUTE PLANNER ──────────────────────────────────────────────────────
function RouteMap() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapUrl, setMapUrl] = useState("");

  const planRoute = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setRouteInfo(null);
    try {
      // Geocode both points
      const geoA = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin)}&format=json&limit=1`).then(r => r.json());
      const geoB = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`).then(r => r.json());

      if (!geoA[0] || !geoB[0]) { alert("Location not found. Try more specific names."); setLoading(false); return; }

      const oLat = parseFloat(geoA[0].lat), oLng = parseFloat(geoA[0].lon);
      const dLat = parseFloat(geoB[0].lat), dLng = parseFloat(geoB[0].lon);

      // Get route from OSRM (free, no API key)
      const osrm = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=false&steps=false`).then(r => r.json());

      if (osrm.routes?.[0]) {
        const route = osrm.routes[0];
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);
        const hrs = Math.floor(durMin / 60);
        const mins = durMin % 60;
        setRouteInfo({ distance: distKm, duration: `${hrs}h ${mins}m`, origin: geoA[0].display_name.split(",").slice(0, 2).join(","), destination: geoB[0].display_name.split(",").slice(0, 2).join(","), oLat, oLng, dLat, dLng });
        // Embed OpenStreetMap with route markers
        const midLat = ((oLat + dLat) / 2).toFixed(4);
        const midLng = ((oLng + dLng) / 2).toFixed(4);
        setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(oLng,dLng)-0.5},${Math.min(oLat,dLat)-0.5},${Math.max(oLng,dLng)+0.5},${Math.max(oLat,dLat)+0.5}&layer=mapnik&marker=${oLat},${oLng}`);
      }
    } catch (e) { alert("Route planning failed. Check your connection."); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e2f0ff", fontFamily: "'Syne', sans-serif" }}>Route Planner</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Plan optimal routes using OpenStreetMap + OSRM (free)</p>
      </div>

      <div style={{ background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>From</label>
            <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Faridabad, Haryana"
              style={{ width: "100%", background: "#0f1923", border: "1px solid #1e3a52", borderRadius: 8, padding: "10px 14px", color: "#e2f0ff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onKeyDown={e => e.key === "Enter" && planRoute()} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>To</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Gurugram, Haryana"
              style={{ width: "100%", background: "#0f1923", border: "1px solid #1e3a52", borderRadius: 8, padding: "10px 14px", color: "#e2f0ff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onKeyDown={e => e.key === "Enter" && planRoute()} />
          </div>
          <button onClick={planRoute} disabled={loading || !origin || !destination} style={{
            background: "linear-gradient(135deg, #1e6fa8, #0ea5e9)", border: "none", color: "#fff",
            padding: "10px 22px", borderRadius: 8, cursor: loading ? "wait" : "pointer", fontWeight: 700, fontSize: 13,
            opacity: (!origin || !destination) ? 0.5 : 1, whiteSpace: "nowrap"
          }}>{loading ? "Planning..." : "Plan Route"}</button>
        </div>
      </div>

      {routeInfo && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["📍 From", routeInfo.origin],
              ["🏁 To", routeInfo.destination],
              ["📏 Distance", `${routeInfo.distance} km`],
              ["⏱ Est. Time", routeInfo.duration],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e2f0ff" }}>{v}</div>
              </div>
            ))}
            <a href={`https://www.openstreetmap.org/directions?engine=osrm_car&route=${routeInfo.oLat},${routeInfo.oLng};${routeInfo.dLat},${routeInfo.dLng}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "block", background: "#1e3a52", color: "#0ea5e9", textDecoration: "none", padding: "12px 16px", borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 13 }}>
              🗺️ Open Full Map
            </a>
          </div>
          {mapUrl && (
            <div style={{ background: "#0a1520", border: "1px solid #1e3a52", borderRadius: 14, overflow: "hidden", minHeight: 300 }}>
              <iframe src={mapUrl} style={{ width: "100%", height: "100%", minHeight: 300, border: "none" }} title="Route Map" />
            </div>
          )}
        </div>
      )}

      {!routeInfo && !loading && (
        <div style={{ background: "#0a1520", border: "1px dashed #1e3a52", borderRadius: 14, padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Enter origin & destination</div>
          <div style={{ fontSize: 13 }}>Using free OpenStreetMap + OSRM routing. No API key required.</div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { id: "trucks", label: "Trucks", icon: Icons.truck },
    { id: "drivers", label: "Drivers", icon: Icons.driver },
    { id: "trips", label: "Trips", icon: Icons.trip },
    { id: "route", label: "Route Planner", icon: Icons.map },
  ];

  const pages = { dashboard: <Dashboard onNavigate={setPage} />, trucks: <Trucks />, drivers: <Drivers />, trips: <Trips />, route: <RouteMap /> };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #060d15; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #060d15; } ::-webkit-scrollbar-thumb { background: #1e3a52; border-radius: 3px; }
        select option { background: #0f1923; color: #e2f0ff; }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif", background: "#060d15" }}>
        {/* Sidebar */}
        <div style={{
          width: 220, background: "#080f18", borderRight: "1px solid #1e3a52",
          padding: "24px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 100
        }}>
          <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1e3a5255" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}>🚛 FleetOps</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Truck Logistics Manager</div>
          </div>
          <nav style={{ padding: "16px 12px", flex: 1 }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 4,
                background: page === n.id ? "#1e3a52" : "transparent",
                color: page === n.id ? "#e2f0ff" : "#64748b",
                fontSize: 13, fontWeight: page === n.id ? 600 : 400,
                transition: "all 0.15s", textAlign: "left"
              }}>
                <Icon d={n.icon} size={16} color={page === n.id ? "#0ea5e9" : "#64748b"} />
                {n.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: "16px 20px", borderTop: "1px solid #1e3a5255", fontSize: 11, color: "#2d5a7a" }}>
            Powered by OpenStreetMap
          </div>
        </div>

        {/* Content */}
        <div style={{ marginLeft: 220, flex: 1, padding: "32px 28px", minHeight: "100vh", maxWidth: "calc(100vw - 220px)" }}>
          {pages[page]}
        </div>
      </div>
    </>
  );
}
