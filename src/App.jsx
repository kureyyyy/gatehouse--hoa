import React, { useState, useEffect, useCallback } from "react";
import {
  Home, CalendarDays, Wallet, ShieldCheck, Plus, Bell, Waves,
  Dumbbell, PartyPopper, TreePine, ScanLine, UserCheck, UserX,
  ArrowRight, Building2, LogOut, Loader2, AlertCircle
} from "lucide-react";

// ---------------------------------------------------------------------------
// SUPABASE CONNECTION
// ---------------------------------------------------------------------------
const SUPABASE_URL = "https://lmxujfokowpejtsxyxbr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteHVqZm9rb3dwZWp0c3h5eGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3Mzc4NzUsImV4cCI6MjA5OTMxMzg3NX0.R4UMzYd_G-MmKxd2XZI-e0_5jfsPH12yVX1Tm5P7r58";

async function rest(path, { method = "GET", token, body } = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
  if (method !== "GET") headers["Prefer"] = "return=representation";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function authRequest(path, payload) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Request failed");
  return data;
}

// ---------------------------------------------------------------------------
// DESIGN TOKENS (same visual system as the prototype)
// ---------------------------------------------------------------------------
const C = {
  paper: "#F7F6F1", paper2: "#EFEDE3", ink: "#1C2B24", inkSoft: "#4B5A50",
  forest: "#2F4A3C", sage: "#7C9B82", sageBg: "#E7EEE6",
  brick: "#A6432E", brickBg: "#F3E3DE", gold: "#C79A2B", goldBg: "#F5EBD3", line: "#DDD8CB",
};

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .f-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
    .f-body { font-family: 'Inter', sans-serif; }
    .f-mono { font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.02em; }
  `}</style>
);

const AMENITY_ICONS = { "Swimming Pool": Waves, "Function Hall": PartyPopper, "Gym": Dumbbell, "Garden Pavilion": TreePine };
const SLOTS = ["7:00 – 9:00 AM", "10:00 AM – 12:00 PM", "2:00 – 4:00 PM", "5:00 – 7:00 PM"];

function nextDays(n) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}
const DAYS = nextDays(6);
const isoDate = (d) => d.toISOString().slice(0, 10);
const fmtShort = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtDate = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
function genCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
}

// ---------------------------------------------------------------------------
// SHARED UI PIECES
// ---------------------------------------------------------------------------
function Pass({ eyebrow, title, subtitle, code, meta = [], accent = C.forest, accentBg = C.sageBg, right }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="f-mono text-[10px] uppercase tracking-widest" style={{ color: C.inkSoft }}>{eyebrow}</span>
            {right}
          </div>
          <div className="f-display text-lg leading-tight" style={{ color: C.ink }}>{title}</div>
          {subtitle && <div className="f-body text-sm mt-0.5" style={{ color: C.inkSoft }}>{subtitle}</div>}
          {meta.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {meta.map((m, i) => (
                <div key={i} className="f-body text-xs" style={{ color: C.inkSoft }}>
                  <span style={{ color: C.ink, fontWeight: 600 }}>{m.label}</span>{" "}{m.value}
                </div>
              ))}
            </div>
          )}
        </div>
        {code && (
          <div className="relative flex flex-col items-center justify-center px-3" style={{ background: accentBg, borderLeft: `1.5px dashed ${C.line}`, minWidth: "92px" }}>
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full" style={{ background: C.paper }} />
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full" style={{ background: C.paper }} />
            <span className="f-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: accent }}>Code</span>
            <span className="f-mono text-sm font-semibold text-center" style={{ color: accent }}>{code}</span>
          </div>
        )}
      </div>
    </div>
  );
}
function StatCard({ label, value, sub, accent = C.forest }) {
  return (
    <div className="rounded-xl p-3.5 flex-1" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="f-body text-[11px] uppercase tracking-wide" style={{ color: C.inkSoft }}>{label}</div>
      <div className="f-display text-2xl mt-1" style={{ color: accent }}>{value}</div>
      {sub && <div className="f-body text-[11px] mt-0.5" style={{ color: C.inkSoft }}>{sub}</div>}
    </div>
  );
}
function SectionLabel({ children }) {
  return <div className="f-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: C.inkSoft }}>{children}</div>;
}
function Pill({ children, tone = "sage" }) {
  const map = {
    sage: { bg: C.sageBg, fg: C.forest }, gold: { bg: C.goldBg, fg: "#8A6A1D" },
    brick: { bg: C.brickBg, fg: C.brick }, ink: { bg: C.paper2, fg: C.inkSoft },
  };
  const t = map[tone];
  return <span className="f-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: t.bg, color: t.fg }}>{children}</span>;
}
function BottomNav({ items, active, onChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-around px-2 pt-2" style={{ background: "#fff", borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", maxWidth: "480px", margin: "0 auto" }}>
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onChange(it.key)} className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg" style={{ color: isActive ? C.forest : C.inkSoft }}>
            <it.icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
            <span className="f-body text-[10px] font-medium">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
function TopBar({ title, subtitle, onSignOut }) {
  return (
    <div className="sticky top-0 z-10" style={{ background: C.forest }}>
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Building2 size={16} color={C.sage} />
            <span className="f-mono text-[10px] uppercase tracking-widest" style={{ color: C.sage }}>Gatehouse</span>
          </div>
          <div className="f-display text-xl text-white mt-0.5">{title}</div>
          {subtitle && <div className="f-body text-xs mt-0.5" style={{ color: "#B9C9BE" }}>{subtitle}</div>}
        </div>
        <button onClick={onSignOut} className="flex flex-col items-center gap-0.5" style={{ color: "#B9C9BE" }}>
          <LogOut size={17} />
          <span className="f-body text-[9px]">Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AUTH SCREEN
// ---------------------------------------------------------------------------
function AuthScreen({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [role, setRole] = useState("resident");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit() {
    setError(""); setNotice(""); setBusy(true);
    try {
      if (mode === "signin") {
        await onSignIn(email, password);
      } else {
        const result = await onSignUp(email, password, name, unit, role);
        if (result === "needs-confirmation") {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen f-body flex flex-col justify-center px-6" style={{ background: C.forest, maxWidth: "480px", margin: "0 auto" }}>
      {FONTS}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Building2 size={18} color={C.sage} />
          <span className="f-mono text-xs uppercase tracking-widest" style={{ color: C.sage }}>Gatehouse</span>
        </div>
        <div className="f-display text-3xl text-white">Sunrise Meadows</div>
        <div className="f-body text-sm mt-1" style={{ color: "#B9C9BE" }}>Security · Amenities · HOA Dues</div>
      </div>

      <div className="rounded-2xl p-5 space-y-3" style={{ background: "#fff" }}>
        <div className="flex gap-1.5 mb-1">
          <button onClick={() => setMode("signin")} className="flex-1 f-body text-sm font-medium py-2 rounded-lg" style={{ background: mode === "signin" ? C.forest : C.paper2, color: mode === "signin" ? "#fff" : C.inkSoft }}>Sign in</button>
          <button onClick={() => setMode("signup")} className="flex-1 f-body text-sm font-medium py-2 rounded-lg" style={{ background: mode === "signup" ? C.forest : C.paper2, color: mode === "signup" ? "#fff" : C.inkSoft }}>Sign up</button>
        </div>

        {mode === "signup" && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (e.g. Blk 4 Lot 12)" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
            <div>
              <SectionLabel>Role (demo only)</SectionLabel>
              <div className="flex gap-1.5">
                {["resident", "admin", "security"].map((r) => (
                  <button key={r} onClick={() => setRole(r)} className="flex-1 f-body text-xs font-medium py-2 rounded-lg capitalize" style={{ background: role === r ? C.ink : C.paper, color: role === r ? "#fff" : C.inkSoft, border: `1px solid ${role === r ? C.ink : C.line}` }}>{r}</button>
                ))}
              </div>
              <p className="f-body text-[10px] mt-1" style={{ color: C.inkSoft }}>In production, admin/security accounts are provisioned by an HOA admin, not self-selected.</p>
            </div>
          </>
        )}

        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />

        {error && (
          <div className="flex items-start gap-1.5 f-body text-xs px-3 py-2 rounded-lg" style={{ background: C.brickBg, color: C.brick }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {notice && (
          <div className="f-body text-xs px-3 py-2 rounded-lg" style={{ background: C.sageBg, color: C.forest }}>{notice}</div>
        )}

        <button onClick={submit} disabled={busy || !email || !password} className="f-body text-sm font-medium w-full py-3 rounded-xl flex items-center justify-center gap-1.5" style={{ background: busy || !email || !password ? C.paper2 : C.forest, color: busy || !email || !password ? "#A4ABA3" : "#fff" }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESIDENT SCREENS
// ---------------------------------------------------------------------------
function ResidentHome({ profile, bookings, dues, visitors, amenities, setTab }) {
  const myBookings = bookings.filter((b) => b.status !== "cancelled");
  const myDue = dues.find((d) => d.status !== "paid");
  const myVisitors = visitors.filter((v) => v.status !== "checked-out");
  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-body text-sm" style={{ color: C.inkSoft }}>Welcome back,</div>
        <div className="f-display text-2xl" style={{ color: C.ink }}>{profile.name.split(" ")[0]}</div>
        <div className="f-mono text-xs mt-1" style={{ color: C.inkSoft }}>{profile.unit}</div>
      </div>
      <div className="flex gap-3">
        <StatCard label="Dues status" value={myDue ? "Due" : "Paid"} accent={myDue ? C.brick : C.sage} sub={myDue ? `₱${Number(myDue.amount).toLocaleString()}` : "You're all set"} />
        <StatCard label="Upcoming" value={myBookings.length} accent={C.forest} sub="bookings" />
        <StatCard label="Active passes" value={myVisitors.length} accent={C.gold} sub="visitors" />
      </div>
      {myDue && (
        <div>
          <SectionLabel>Needs attention</SectionLabel>
          <button onClick={() => setTab("dues")} className="w-full text-left">
            <Pass eyebrow={myDue.status === "overdue" ? "Overdue" : "Due"} title={`${myDue.month} HOA Dues`} subtitle={`Due ${fmtDate(myDue.due_date)}`} code={`₱${Number(myDue.amount).toLocaleString()}`} accent={C.brick} accentBg={C.brickBg} right={<Pill tone={myDue.status === "overdue" ? "brick" : "gold"}>{myDue.status}</Pill>} />
          </button>
        </div>
      )}
      {myBookings.length > 0 && (
        <div>
          <SectionLabel>Your bookings</SectionLabel>
          <div className="space-y-2">
            {myBookings.slice(0, 2).map((b) => {
              const am = amenities.find((a) => a.id === b.amenity_id);
              return <Pass key={b.id} eyebrow="Booking" title={am?.name || "Amenity"} subtitle={`${fmtDate(b.booking_date)} · ${b.slot}`} code={b.id.slice(0, 8).toUpperCase()} accent={C.forest} accentBg={C.sageBg} right={<Pill tone="sage">confirmed</Pill>} />;
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setTab("book")} className="rounded-xl p-4 text-left" style={{ background: C.forest }}>
          <CalendarDays size={18} color="#fff" />
          <div className="f-body text-sm font-medium text-white mt-2">Book an amenity</div>
        </button>
        <button onClick={() => setTab("passes")} className="rounded-xl p-4 text-left" style={{ background: C.brick }}>
          <ShieldCheck size={18} color="#fff" />
          <div className="f-body text-sm font-medium text-white mt-2">Issue a gate pass</div>
        </button>
      </div>
    </div>
  );
}

function ResidentBook({ profile, bookings, amenities, addBooking, busy }) {
  const [amenityId, setAmenityId] = useState(amenities[0]?.id || null);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { if (!amenityId && amenities[0]) setAmenityId(amenities[0].id); }, [amenities]);

  const amenity = amenities.find((a) => a.id === amenityId);
  const day = DAYS[dayIdx];
  const dateVal = isoDate(day);
  const isTaken = (s) => bookings.some((b) => b.amenity_id === amenityId && b.booking_date === dateVal && b.slot === s && b.status !== "cancelled");

  async function confirm() {
    if (!slot) return;
    setError("");
    try {
      const b = await addBooking({ amenity_id: amenityId, booking_date: dateVal, slot });
      setConfirmed(b);
      setSlot(null);
    } catch (e) {
      setError(e.message.includes("duplicate") ? "That slot was just taken — pick another." : e.message);
    }
  }

  if (confirmed) {
    return (
      <div className="px-4 py-4 space-y-4">
        <SectionLabel>Booking confirmed</SectionLabel>
        <Pass eyebrow="Amenity pass" title={amenity?.name} subtitle={`${fmtDate(confirmed.booking_date)} · ${confirmed.slot}`} code={confirmed.id.slice(0, 8).toUpperCase()} meta={[{ label: "Resident", value: profile.name }, { label: "Unit", value: profile.unit }]} accent={C.forest} accentBg={C.sageBg} right={<Pill tone="sage">confirmed</Pill>} />
        <p className="f-body text-xs" style={{ color: C.inkSoft }}>Show this pass at the amenity entrance.</p>
        <button onClick={() => setConfirmed(null)} className="f-body text-sm font-medium w-full py-3 rounded-xl" style={{ background: C.paper2, color: C.ink }}>Book another</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Book an amenity</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Pick a space, a date, and a slot.</div>
      </div>
      <div>
        <SectionLabel>Amenity</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {amenities.map((a) => {
            const active = a.id === amenityId;
            const Icon = AMENITY_ICONS[a.name] || Waves;
            return (
              <button key={a.id} onClick={() => { setAmenityId(a.id); setSlot(null); }} className="rounded-xl p-3 text-left" style={{ background: active ? C.forest : "#fff", border: `1px solid ${active ? C.forest : C.line}` }}>
                <Icon size={17} color={active ? "#fff" : C.forest} />
                <div className="f-body text-sm font-medium mt-1.5" style={{ color: active ? "#fff" : C.ink }}>{a.name}</div>
                <div className="f-body text-[10px] mt-0.5" style={{ color: active ? "#CFE0D3" : C.inkSoft }}>{a.hours}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <SectionLabel>Date</SectionLabel>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DAYS.map((d, i) => {
            const active = i === dayIdx;
            return (
              <button key={i} onClick={() => { setDayIdx(i); setSlot(null); }} className="flex flex-col items-center rounded-xl px-3 py-2 shrink-0" style={{ background: active ? C.ink : "#fff", border: `1px solid ${active ? C.ink : C.line}`, minWidth: "64px" }}>
                <span className="f-body text-[10px]" style={{ color: active ? "#CFE0D3" : C.inkSoft }}>{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <span className="f-display text-base" style={{ color: active ? "#fff" : C.ink }}>{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <SectionLabel>Time slot{amenity ? ` · ${amenity.capacity}` : ""}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {SLOTS.map((s) => {
            const taken = isTaken(s);
            const active = slot === s;
            return (
              <button key={s} disabled={taken} onClick={() => setSlot(s)} className="rounded-xl px-3 py-2.5 f-body text-xs font-medium text-left" style={{ background: taken ? C.paper2 : active ? C.sageBg : "#fff", border: `1px solid ${active ? C.sage : C.line}`, color: taken ? "#A4ABA3" : C.ink, textDecoration: taken ? "line-through" : "none" }}>
                {s}
                {taken && <div className="text-[10px] mt-0.5" style={{ color: "#A4ABA3" }}>Booked</div>}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="f-body text-xs" style={{ color: C.brick }}>{error}</p>}
      <button onClick={confirm} disabled={!slot || busy} className="f-body text-sm font-medium w-full py-3 rounded-xl flex items-center justify-center gap-1.5" style={{ background: slot && !busy ? C.forest : C.paper2, color: slot && !busy ? "#fff" : "#A4ABA3" }}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <>Confirm booking <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

function ResidentDues({ profile, dues, payDue }) {
  const outstanding = dues.filter((d) => d.status !== "paid");
  const totalDue = outstanding.reduce((s, d) => s + Number(d.amount), 0);
  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>HOA Dues</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>{profile.unit}</div>
      </div>
      <div className="rounded-2xl p-5" style={{ background: C.ink }}>
        <div className="f-body text-xs" style={{ color: "#B9C2BC" }}>Total outstanding</div>
        <div className="f-display text-3xl mt-1 text-white">₱{totalDue.toLocaleString()}</div>
        <div className="f-body text-[11px] mt-1" style={{ color: "#B9C2BC" }}>{outstanding.length === 0 ? "You have no balance due." : `${outstanding.length} invoice${outstanding.length > 1 ? "s" : ""} pending`}</div>
      </div>
      <div className="space-y-2">
        <SectionLabel>Invoices</SectionLabel>
        {dues.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No invoices yet. Your HOA admin will post dues here.</p>}
        {dues.map((d) => (
          <div key={d.id}>
            <Pass eyebrow={d.status === "paid" ? "Receipt" : d.status} title={`${d.month} Dues`} subtitle={d.status === "paid" ? `Paid ${fmtDate(d.paid_date)}` : `Due ${fmtDate(d.due_date)}`} code={`₱${Number(d.amount).toLocaleString()}`} accent={d.status === "paid" ? C.sage : d.status === "overdue" ? C.brick : C.gold} accentBg={d.status === "paid" ? C.sageBg : d.status === "overdue" ? C.brickBg : C.goldBg} right={<Pill tone={d.status === "paid" ? "sage" : d.status === "overdue" ? "brick" : "gold"}>{d.status}</Pill>} />
            {d.status !== "paid" && (
              <button onClick={() => payDue(d.id)} className="f-body text-xs font-medium w-full mt-1.5 py-2.5 rounded-lg" style={{ background: C.forest, color: "#fff" }}>Pay ₱{Number(d.amount).toLocaleString()} now</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResidentPasses({ visitors, addVisitor, busy }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dayIdx, setDayIdx] = useState(0);

  async function issue() {
    if (!name.trim()) return;
    await addVisitor({ name: name.trim(), purpose: purpose.trim() || "Personal visit", visit_date: isoDate(DAYS[dayIdx]), code: genCode(), status: "pending" });
    setName(""); setPurpose("");
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Gate passes</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Pre-register a visitor for faster gate entry.</div>
      </div>
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <SectionLabel>New visitor pass</SectionLabel>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Visitor name" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose (e.g. Family visit, Delivery)" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
        <div className="flex gap-2 overflow-x-auto">
          {DAYS.slice(0, 4).map((d, i) => (
            <button key={i} onClick={() => setDayIdx(i)} className="f-body text-xs px-3 py-1.5 rounded-full shrink-0" style={{ background: dayIdx === i ? C.forest : C.paper, color: dayIdx === i ? "#fff" : C.inkSoft, border: `1px solid ${dayIdx === i ? C.forest : C.line}` }}>{fmtShort(d)}</button>
          ))}
        </div>
        <button onClick={issue} disabled={!name.trim() || busy} className="f-body text-sm font-medium w-full py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: name.trim() && !busy ? C.brick : C.paper2, color: name.trim() && !busy ? "#fff" : "#A4ABA3" }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Issue pass</>}
        </button>
      </div>
      <div className="space-y-2">
        <SectionLabel>My passes</SectionLabel>
        {visitors.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No passes issued yet.</p>}
        {visitors.map((v) => (
          <Pass key={v.id} eyebrow={fmtDate(v.visit_date)} title={v.name} subtitle={v.purpose} code={v.code} accent={C.brick} accentBg={C.brickBg} right={<Pill tone={v.status === "checked-in" ? "sage" : v.status === "checked-out" ? "ink" : "gold"}>{v.status}</Pill>} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN SCREENS
// ---------------------------------------------------------------------------
function AdminOverview({ residents, bookings, dues, visitors }) {
  const paidCount = dues.filter((d) => d.status === "paid").length;
  const collectionRate = dues.length ? Math.round((paidCount / dues.length) * 100) : 0;
  const pendingBookings = bookings.filter((b) => b.status === "confirmed").length;
  const onSiteVisitors = visitors.filter((v) => v.status === "checked-in").length;
  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Community overview</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Live data from Supabase</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Residents" value={residents.length} accent={C.forest} sub="registered units" />
        <StatCard label="Dues collected" value={`${collectionRate}%`} accent={C.gold} sub={`${paidCount}/${dues.length} invoices`} />
        <StatCard label="Bookings" value={pendingBookings} accent={C.sage} sub="confirmed" />
        <StatCard label="On-site now" value={onSiteVisitors} accent={C.brick} sub="checked-in visitors" />
      </div>
      <div>
        <SectionLabel>Overdue dues</SectionLabel>
        <div className="space-y-2">
          {dues.filter((d) => d.status === "overdue").map((d) => {
            const r = residents.find((x) => x.id === d.resident_id);
            return <Pass key={d.id} eyebrow={r?.unit || ""} title={r?.name || "Resident"} subtitle={`${d.month} dues overdue`} code={`₱${Number(d.amount).toLocaleString()}`} accent={C.brick} accentBg={C.brickBg} right={<Pill tone="brick">overdue</Pill>} />;
          })}
          {dues.filter((d) => d.status === "overdue").length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No overdue accounts. Nice.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminBookings({ bookings, residents, amenities, updateBooking }) {
  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Bookings</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>{bookings.length} total requests</div>
      </div>
      <div className="space-y-2">
        {bookings.map((b) => {
          const am = amenities.find((a) => a.id === b.amenity_id);
          const r = residents.find((x) => x.id === b.resident_id);
          return (
            <div key={b.id}>
              <Pass eyebrow={am?.name || "Amenity"} title={r?.name || "Resident"} subtitle={`${fmtDate(b.booking_date)} · ${b.slot} · ${r?.unit || ""}`} code={b.id.slice(0, 8).toUpperCase()} accent={b.status === "cancelled" ? "#A4ABA3" : C.forest} accentBg={b.status === "cancelled" ? C.paper2 : C.sageBg} right={<Pill tone={b.status === "cancelled" ? "ink" : "sage"}>{b.status}</Pill>} />
              {b.status === "confirmed" && (
                <button onClick={() => updateBooking(b.id, "cancelled")} className="f-body text-xs font-medium mt-1.5 px-3 py-1.5 rounded-lg" style={{ background: C.paper2, color: C.brick }}>Cancel booking</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminDues({ dues, residents, payDue }) {
  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Dues ledger</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>All resident invoices</div>
      </div>
      <div className="space-y-2">
        {dues.map((d) => {
          const r = residents.find((x) => x.id === d.resident_id);
          return (
            <div key={d.id}>
              <Pass eyebrow={r?.unit || ""} title={r?.name || "Resident"} subtitle={`${d.month} · ${d.status === "paid" ? "Paid " + fmtDate(d.paid_date) : "Due " + fmtDate(d.due_date)}`} code={`₱${Number(d.amount).toLocaleString()}`} accent={d.status === "paid" ? C.sage : d.status === "overdue" ? C.brick : C.gold} accentBg={d.status === "paid" ? C.sageBg : d.status === "overdue" ? C.brickBg : C.goldBg} right={<Pill tone={d.status === "paid" ? "sage" : d.status === "overdue" ? "brick" : "gold"}>{d.status}</Pill>} />
              {d.status !== "paid" && (
                <button onClick={() => payDue(d.id)} className="f-body text-xs font-medium mt-1.5 px-3 py-1.5 rounded-lg" style={{ background: C.forest, color: "#fff" }}>Mark as paid</button>
              )}
            </div>
          );
        })}
        {dues.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No invoices yet.</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECURITY SCREEN
// ---------------------------------------------------------------------------
function SecurityGate({ visitors, residents, checkIn, checkOut, addWalkIn, busy }) {
  const [tab, setTab] = useState("expected");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  const expected = visitors.filter((v) => v.status === "pending");
  const onsite = visitors.filter((v) => v.status === "checked-in");
  const history = visitors.filter((v) => v.status === "checked-out");

  async function logWalkIn() {
    if (!name.trim()) return;
    await addWalkIn({ name: name.trim(), purpose: unit.trim() ? `Visiting ${unit.trim()}` : "Walk-in visitor", visit_date: isoDate(DAYS[0]), code: genCode(), status: "checked-in" });
    setName(""); setUnit("");
  }

  const subtabs = [
    { key: "expected", label: `Expected (${expected.length})` },
    { key: "onsite", label: `On-site (${onsite.length})` },
    { key: "logvisitor", label: "Log walk-in" },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Gate log</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto">
        {subtabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="f-body text-xs font-medium px-3 py-1.5 rounded-full shrink-0" style={{ background: tab === t.key ? C.ink : "#fff", color: tab === t.key ? "#fff" : C.inkSoft, border: `1px solid ${tab === t.key ? C.ink : C.line}` }}>{t.label}</button>
        ))}
      </div>
      {tab === "expected" && (
        <div className="space-y-2">
          {expected.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No pre-registered visitors pending.</p>}
          {expected.map((v) => {
            const r = residents.find((x) => x.id === v.resident_id);
            return (
              <div key={v.id}>
                <Pass eyebrow={r ? r.unit : fmtDate(v.visit_date)} title={v.name} subtitle={v.purpose} code={v.code} accent={C.gold} accentBg={C.goldBg} right={<Pill tone="gold">pending</Pill>} />
                <button onClick={() => checkIn(v.id)} className="f-body text-xs font-medium w-full mt-1.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.forest, color: "#fff" }}><ScanLine size={14} /> Check in at gate</button>
              </div>
            );
          })}
        </div>
      )}
      {tab === "onsite" && (
        <div className="space-y-2">
          {onsite.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No visitors on-site right now.</p>}
          {onsite.map((v) => {
            const r = residents.find((x) => x.id === v.resident_id);
            return (
              <div key={v.id}>
                <Pass eyebrow={r ? r.unit : "Walk-in"} title={v.name} subtitle={v.purpose} code={v.code} accent={C.sage} accentBg={C.sageBg} right={<Pill tone="sage">on-site</Pill>} />
                <button onClick={() => checkOut(v.id)} className="f-body text-xs font-medium w-full mt-1.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.paper2, color: C.ink }}><UserX size={14} /> Check out</button>
              </div>
            );
          })}
        </div>
      )}
      {tab === "logvisitor" && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 space-y-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            <SectionLabel>Manual gate log</SectionLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Visitor name" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Destination unit (e.g. Blk 4 Lot 12)" className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
            <button onClick={logWalkIn} disabled={!name.trim() || busy} className="f-body text-sm font-medium w-full py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: name.trim() && !busy ? C.brick : C.paper2, color: name.trim() && !busy ? "#fff" : "#A4ABA3" }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <><UserCheck size={15} /> Log entry &amp; check in</>}
            </button>
          </div>
          <div>
            <SectionLabel>Recently checked out</SectionLabel>
            <div className="space-y-2">
              {history.slice(-3).reverse().map((v) => <Pass key={v.id} eyebrow={fmtDate(v.visit_date)} title={v.name} subtitle={v.purpose} code={v.code} accent="#A4ABA3" accentBg={C.paper2} right={<Pill tone="ink">left</Pill>} />)}
              {history.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No completed visits yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP ROOT
// ---------------------------------------------------------------------------
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");
  const [loadingApp, setLoadingApp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dues, setDues] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const token = session?.access_token;

  const loadAll = useCallback(async (tok, role) => {
    setLoadingApp(true);
    setLoadError("");
    try {
      const [am, bk, du, vi, pr] = await Promise.all([
        rest("amenities?select=*&order=name", { token: tok }),
        rest("bookings?select=*&order=booking_date", { token: tok }),
        rest("dues?select=*&order=due_date", { token: tok }),
        rest("visitors?select=*&order=created_at.desc", { token: tok }),
        rest("profiles?select=id,name,unit,role", { token: tok }),
      ]);
      setAmenities(am); setBookings(bk); setDues(du); setVisitors(vi); setProfiles(pr);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    if (session && profile) loadAll(session.access_token, profile.role);
  }, [session, profile, loadAll]);

  async function handleSignIn(email, password) {
    const data = await authRequest("token?grant_type=password", { email, password });
    const prof = await rest(`profiles?id=eq.${data.user.id}&select=*`, { token: data.access_token });
    setSession(data);
    setProfile(prof[0]);
    setTab(prof[0].role === "resident" ? "home" : prof[0].role === "admin" ? "overview" : "gate");
  }

  async function handleSignUp(email, password, name, unit, role) {
    const data = await authRequest("signup", { email, password, data: { name, unit, role } });
    if (data.access_token) {
      const prof = await rest(`profiles?id=eq.${data.user.id}&select=*`, { token: data.access_token });
      setSession(data);
      setProfile(prof[0]);
      setTab(prof[0].role === "resident" ? "home" : prof[0].role === "admin" ? "overview" : "gate");
      return "ok";
    }
    return "needs-confirmation";
  }

  function handleSignOut() {
    setSession(null); setProfile(null);
    setAmenities([]); setBookings([]); setDues([]); setVisitors([]); setProfiles([]);
  }

  async function addBooking(fields) {
    setBusy(true);
    try {
      const [row] = await rest("bookings", { method: "POST", token, body: { ...fields, resident_id: profile.id } });
      setBookings((prev) => [...prev, row]);
      return row;
    } finally { setBusy(false); }
  }
  async function updateBooking(id, status) {
    const [row] = await rest(`bookings?id=eq.${id}`, { method: "PATCH", token, body: { status } });
    setBookings((prev) => prev.map((b) => (b.id === id ? row : b)));
  }
  async function payDue(id) {
    const [row] = await rest(`dues?id=eq.${id}`, { method: "PATCH", token, body: { status: "paid", paid_date: isoDate(new Date()) } });
    setDues((prev) => prev.map((d) => (d.id === id ? row : d)));
  }
  async function addVisitor(fields) {
    setBusy(true);
    try {
      const [row] = await rest("visitors", { method: "POST", token, body: { ...fields, resident_id: profile.id } });
      setVisitors((prev) => [row, ...prev]);
      return row;
    } finally { setBusy(false); }
  }
  async function addWalkIn(fields) {
    setBusy(true);
    try {
      const [row] = await rest("visitors", { method: "POST", token, body: { ...fields, resident_id: null, check_in_time: new Date().toISOString() } });
      setVisitors((prev) => [row, ...prev]);
      return row;
    } finally { setBusy(false); }
  }
  async function checkIn(id) {
    const [row] = await rest(`visitors?id=eq.${id}`, { method: "PATCH", token, body: { status: "checked-in", check_in_time: new Date().toISOString() } });
    setVisitors((prev) => prev.map((v) => (v.id === id ? row : v)));
  }
  async function checkOut(id) {
    const [row] = await rest(`visitors?id=eq.${id}`, { method: "PATCH", token, body: { status: "checked-out", check_out_time: new Date().toISOString() } });
    setVisitors((prev) => prev.map((v) => (v.id === id ? row : v)));
  }

  if (!session || !profile) {
    return <AuthScreen onSignIn={handleSignIn} onSignUp={handleSignUp} />;
  }

  const residents = profiles.filter((p) => p.role === "resident");
  const myBookings = bookings.filter((b) => b.resident_id === profile.id);
  const myDues = dues.filter((d) => d.resident_id === profile.id);
  const myVisitors = visitors.filter((v) => v.resident_id === profile.id);

  const residentNav = [
    { key: "home", label: "Home", icon: Home },
    { key: "book", label: "Book", icon: CalendarDays },
    { key: "dues", label: "Dues", icon: Wallet },
    { key: "passes", label: "Passes", icon: ShieldCheck },
  ];
  const adminNav = [
    { key: "overview", label: "Overview", icon: Home },
    { key: "bookingsAdmin", label: "Bookings", icon: CalendarDays },
    { key: "duesAdmin", label: "Dues", icon: Wallet },
  ];
  const securityNav = [{ key: "gate", label: "Gate log", icon: ScanLine }];

  const titles = { home: "Home", book: "Book amenity", dues: "Dues", passes: "Gate passes", overview: "Admin", bookingsAdmin: "Bookings", duesAdmin: "Dues ledger", gate: "Security" };

  return (
    <div className="min-h-screen f-body" style={{ background: C.paper, maxWidth: "480px", margin: "0 auto", position: "relative" }}>
      {FONTS}
      <TopBar title={titles[tab]} subtitle={`${profile.name} · ${profile.role === "resident" ? profile.unit : profile.role}`} onSignOut={handleSignOut} />

      {loadingApp && (
        <div className="flex items-center gap-2 px-4 py-3 f-body text-xs" style={{ color: C.inkSoft }}>
          <Loader2 size={14} className="animate-spin" /> Loading live data…
        </div>
      )}
      {loadError && (
        <div className="mx-4 mt-3 flex items-start gap-1.5 f-body text-xs px-3 py-2 rounded-lg" style={{ background: C.brickBg, color: C.brick }}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {loadError}
        </div>
      )}

      <div style={{ paddingBottom: "88px" }}>
        {profile.role === "resident" && tab === "home" && <ResidentHome profile={profile} bookings={myBookings} dues={myDues} visitors={myVisitors} amenities={amenities} setTab={setTab} />}
        {profile.role === "resident" && tab === "book" && <ResidentBook profile={profile} bookings={bookings} amenities={amenities} addBooking={addBooking} busy={busy} />}
        {profile.role === "resident" && tab === "dues" && <ResidentDues profile={profile} dues={myDues} payDue={payDue} />}
        {profile.role === "resident" && tab === "passes" && <ResidentPasses visitors={myVisitors} addVisitor={addVisitor} busy={busy} />}

        {profile.role === "admin" && tab === "overview" && <AdminOverview residents={residents} bookings={bookings} dues={dues} visitors={visitors} />}
        {profile.role === "admin" && tab === "bookingsAdmin" && <AdminBookings bookings={bookings} residents={profiles} amenities={amenities} updateBooking={updateBooking} />}
        {profile.role === "admin" && tab === "duesAdmin" && <AdminDues dues={dues} residents={profiles} payDue={payDue} />}

        {profile.role === "security" && tab === "gate" && <SecurityGate visitors={visitors} residents={profiles} checkIn={checkIn} checkOut={checkOut} addWalkIn={addWalkIn} busy={busy} />}
      </div>

      <BottomNav items={profile.role === "resident" ? residentNav : profile.role === "admin" ? adminNav : securityNav} active={tab} onChange={setTab} />
    </div>
  );
}
