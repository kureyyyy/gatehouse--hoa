import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Home, CalendarDays, Wallet, ShieldCheck, Plus, Waves, Users, IdCard,
  Dumbbell, PartyPopper, TreePine, ScanLine, UserCheck, UserX, Camera,
  ArrowRight, Building2, LogOut, Loader2, AlertCircle, CheckCircle2,
  XCircle, Car, Phone, Image as ImageIcon
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
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`);
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

async function callFunction(name, token, payload) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function uploadPhoto(file, token, folder) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!res.ok) throw new Error((await res.text()) || "Upload failed");
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

function qrImageUrl(code, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(code)}`;
}

// ---------------------------------------------------------------------------
// DESIGN TOKENS
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
  const out = []; const today = new Date();
  for (let i = 0; i < n; i++) { const d = new Date(today); d.setDate(today.getDate() + i); out.push(d); }
  return out;
}
const DAYS = nextDays(6);
const isoDate = (d) => d.toISOString().slice(0, 10);
const fmtShort = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtDate = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "");
function genCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
}
function genTempPassword() {
  return "Gate" + Math.floor(1000 + Math.random() * 9000) + "!";
}

// ---------------------------------------------------------------------------
// SHARED UI
// ---------------------------------------------------------------------------
function Pass({ eyebrow, title, subtitle, code, qrCode, photoUrl, meta = [], accent = C.forest, accentBg = C.sageBg, right }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="flex">
        <div className="flex-1 p-4 flex gap-3">
          {photoUrl && (
            <img src={photoUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: `1px solid ${C.line}` }} />
          )}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2 gap-2">
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
        </div>
        {(code || qrCode) && (
          <div className="relative flex flex-col items-center justify-center px-3 py-2" style={{ background: accentBg, borderLeft: `1.5px dashed ${C.line}`, minWidth: qrCode ? "116px" : "92px" }}>
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full" style={{ background: C.paper }} />
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full" style={{ background: C.paper }} />
            {qrCode ? (
              <img src={qrImageUrl(qrCode, 90)} alt="QR code" className="w-[72px] h-[72px] rounded-md bg-white p-1" />
            ) : (
              <>
                <span className="f-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: accent }}>Code</span>
                <span className="f-mono text-sm font-semibold text-center" style={{ color: accent }}>{code}</span>
              </>
            )}
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
function Field({ label, ...props }) {
  const extra = props.type === "email"
    ? { autoCapitalize: "none", autoCorrect: "off", spellCheck: false, inputMode: "email" }
    : {};
  return (
    <div>
      {label && <div className="f-body text-[11px] font-medium mb-1" style={{ color: C.inkSoft }}>{label}</div>}
      <input {...extra} {...props} className="f-body text-sm w-full px-3 py-2.5 rounded-lg outline-none" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }} />
    </div>
  );
}
function BottomNav({ items, active, onChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-around px-1 pt-2" style={{ background: "#fff", borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", maxWidth: "480px", margin: "0 auto" }}>
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onChange(it.key)} className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg" style={{ color: isActive ? C.forest : C.inkSoft }}>
            <it.icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
            <span className="f-body text-[9.5px] font-medium">{it.label}</span>
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
function Banner({ tone = "brick", children }) {
  const bg = tone === "brick" ? C.brickBg : C.sageBg;
  const fg = tone === "brick" ? C.brick : C.forest;
  const Icon = tone === "brick" ? AlertCircle : CheckCircle2;
  return (
    <div className="flex items-start gap-1.5 f-body text-xs px-3 py-2 rounded-lg" style={{ background: bg, color: fg }}>
      <Icon size={14} className="mt-0.5 shrink-0" /> {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AUTH — sign in only, accounts are admin-provisioned
// ---------------------------------------------------------------------------
function AuthScreen({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError(""); setBusy(true);
    try {
      const raw = email.trim().toLowerCase();
      const identifier = raw.includes("@") ? raw : `${raw}@${USERNAME_DOMAIN}`;
      await onSignIn(identifier, password);
    }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
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
        <SectionLabel>Sign in</SectionLabel>
        <Field value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Username (residents) or email (staff)" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        <Field value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        {error && <Banner tone="brick">{error}</Banner>}
        <button onClick={submit} disabled={busy || !email || !password} className="f-body text-sm font-medium w-full py-3 rounded-xl flex items-center justify-center gap-1.5" style={{ background: busy || !email || !password ? C.paper2 : C.forest, color: busy || !email || !password ? "#A4ABA3" : "#fff" }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : "Sign in"}
        </button>
        <p className="f-body text-[11px] text-center pt-1" style={{ color: C.inkSoft }}>
          Accounts are created by your HOA admin. Contact the office if you don't have login details yet.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESIDENT: HOME
// ---------------------------------------------------------------------------
function ResidentHome({ profile, bookings, dues, family, setTab }) {
  const myBookings = bookings.filter((b) => b.status !== "cancelled");
  const myDue = dues.find((d) => d.status !== "paid");
  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center gap-3">
        {profile.photo_url && <img src={profile.photo_url} className="w-14 h-14 rounded-full object-cover" style={{ border: `1px solid ${C.line}` }} />}
        <div>
          <div className="f-body text-sm" style={{ color: C.inkSoft }}>Welcome back,</div>
          <div className="f-display text-2xl" style={{ color: C.ink }}>{profile.name.split(" ")[0]}</div>
          <div className="f-mono text-xs mt-0.5" style={{ color: C.inkSoft }}>Blk {profile.blk || "—"} Lot {profile.lot || "—"}, {profile.phase || "—"}</div>
        </div>
      </div>
      <div className="flex gap-3">
        <StatCard label="Dues status" value={myDue ? "Due" : "Paid"} accent={myDue ? C.brick : C.sage} sub={myDue ? `₱${Number(myDue.amount).toLocaleString()}` : "You're all set"} />
        <StatCard label="Bookings" value={myBookings.length} accent={C.forest} sub="upcoming" />
        <StatCard label="Household" value={family.length} accent={C.gold} sub="members" />
      </div>
      {myDue && (
        <div>
          <SectionLabel>Needs attention</SectionLabel>
          <button onClick={() => setTab("dues")} className="w-full text-left">
            <Pass eyebrow={myDue.status === "overdue" ? "Overdue" : "Due"} title={`${myDue.month} HOA Dues`} subtitle={`Due ${fmtDate(myDue.due_date)}`} code={`₱${Number(myDue.amount).toLocaleString()}`} accent={C.brick} accentBg={C.brickBg} right={<Pill tone={myDue.status === "overdue" ? "brick" : "gold"}>{myDue.status}</Pill>} />
          </button>
        </div>
      )}
      {family.length === 0 && (
        <div>
          <SectionLabel>Get started</SectionLabel>
          <button onClick={() => setTab("household")} className="w-full rounded-xl p-4 text-left" style={{ background: C.brick }}>
            <IdCard size={18} color="#fff" />
            <div className="f-body text-sm font-medium text-white mt-2">Add your household members to generate gate QR passes</div>
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setTab("book")} className="rounded-xl p-4 text-left" style={{ background: C.forest }}>
          <CalendarDays size={18} color="#fff" />
          <div className="f-body text-sm font-medium text-white mt-2">Book an amenity</div>
        </button>
        <button onClick={() => setTab("household")} className="rounded-xl p-4 text-left" style={{ background: C.gold }}>
          <ShieldCheck size={18} color="#fff" />
          <div className="f-body text-sm font-medium text-white mt-2">View household QR passes</div>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESIDENT: BOOK
// ---------------------------------------------------------------------------
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
      setConfirmed(b); setSlot(null);
    } catch (e) { setError(e.message.includes("duplicate") ? "That slot was just taken — pick another." : e.message); }
  }

  if (confirmed) {
    return (
      <div className="px-4 py-4 space-y-4">
        <SectionLabel>Booking confirmed</SectionLabel>
        <Pass eyebrow="Amenity pass" title={amenity?.name} subtitle={`${fmtDate(confirmed.booking_date)} · ${confirmed.slot}`} code={confirmed.id.slice(0, 8).toUpperCase()} meta={[{ label: "Resident", value: profile.name }, { label: "Unit", value: `Blk ${profile.blk} Lot ${profile.lot}` }]} accent={C.forest} accentBg={C.sageBg} right={<Pill tone="sage">confirmed</Pill>} />
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
                {s}{taken && <div className="text-[10px] mt-0.5" style={{ color: "#A4ABA3" }}>Booked</div>}
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

// ---------------------------------------------------------------------------
// RESIDENT: DUES
// ---------------------------------------------------------------------------
function ResidentDues({ profile, dues, payDue }) {
  const outstanding = dues.filter((d) => d.status !== "paid");
  const totalDue = outstanding.reduce((s, d) => s + Number(d.amount), 0);
  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>HOA Dues</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Blk {profile.blk} Lot {profile.lot}, {profile.phase}</div>
      </div>
      <div className="rounded-2xl p-5" style={{ background: C.ink }}>
        <div className="f-body text-xs" style={{ color: "#B9C2BC" }}>Total outstanding</div>
        <div className="f-display text-3xl mt-1 text-white">₱{totalDue.toLocaleString()}</div>
        <div className="f-body text-[11px] mt-1" style={{ color: "#B9C2BC" }}>{outstanding.length === 0 ? "You have no balance due." : `${outstanding.length} invoice${outstanding.length > 1 ? "s" : ""} pending`}</div>
      </div>
      <div className="space-y-2">
        <SectionLabel>Invoices</SectionLabel>
        {dues.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No invoices yet.</p>}
        {dues.map((d) => (
          <div key={d.id}>
            <Pass eyebrow={d.status === "paid" ? "Receipt" : d.status} title={`${d.month} Dues`} subtitle={d.status === "paid" ? `Paid ${fmtDate(d.paid_date)}` : `Due ${fmtDate(d.due_date)}`} code={`₱${Number(d.amount).toLocaleString()}`} accent={d.status === "paid" ? C.sage : d.status === "overdue" ? C.brick : C.gold} accentBg={d.status === "paid" ? C.sageBg : d.status === "overdue" ? C.brickBg : C.goldBg} right={<Pill tone={d.status === "paid" ? "sage" : d.status === "overdue" ? "brick" : "gold"}>{d.status}</Pill>} />
            {d.status !== "paid" && <button onClick={() => payDue(d.id)} className="f-body text-xs font-medium w-full mt-1.5 py-2.5 rounded-lg" style={{ background: C.forest, color: "#fff" }}>Pay ₱{Number(d.amount).toLocaleString()} now</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESIDENT: HOUSEHOLD (family members + their QR passes)
// ---------------------------------------------------------------------------
function ResidentHousehold({ profile, family, addMember, uploadHouseholdPhoto, token, busy }) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return;
    setError("");
    try {
      let photo_url = null;
      if (file) photo_url = await uploadPhoto(file, token, `family/${profile.id}`);
      await addMember({ name: name.trim(), relation: relation.trim() || "Family member", photo_url });
      setName(""); setRelation(""); setFile(null);
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Household</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Every member gets their own gate QR pass.</div>
      </div>

      <div className="rounded-xl p-4 space-y-2" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <SectionLabel>On file with the HOA</SectionLabel>
        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          <div className="f-body text-xs" style={{ color: C.inkSoft }}><Car size={12} className="inline mr-1" />{profile.vehicle || "No vehicle on file"}</div>
          <div className="f-body text-xs" style={{ color: C.inkSoft }}><Phone size={12} className="inline mr-1" />{profile.phone || "No contact on file"}</div>
          <div className="f-body text-xs col-span-2" style={{ color: C.inkSoft }}>Declared household size: {profile.family_member_count || 1}</div>
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <SectionLabel>Add a household member</SectionLabel>
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <Field value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relation (e.g. Spouse, Child, Helper)" />
        <label className="f-body text-xs flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
          <ImageIcon size={14} />
          {file ? file.name : "Add a photo (optional)"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {error && <Banner tone="brick">{error}</Banner>}
        <button onClick={submit} disabled={!name.trim() || busy} className="f-body text-sm font-medium w-full py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: name.trim() && !busy ? C.brick : C.paper2, color: name.trim() && !busy ? "#fff" : "#A4ABA3" }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Generate QR pass</>}
        </button>
      </div>

      <div className="space-y-2">
        <SectionLabel>Household QR passes ({family.length})</SectionLabel>
        {family.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No members added yet.</p>}
        {family.map((m) => (
          <Pass key={m.id} eyebrow={m.relation} title={m.name} subtitle={`Blk ${profile.blk} Lot ${profile.lot}, ${profile.phase}`} qrCode={m.qr_code} photoUrl={m.photo_url} accent={C.gold} accentBg={C.goldBg} right={<Pill tone="gold">resident</Pill>} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN: OVERVIEW
// ---------------------------------------------------------------------------
function AdminOverview({ residents, bookings, dues, family, entryLogsToday }) {
  const paidCount = dues.filter((d) => d.status === "paid").length;
  const collectionRate = dues.length ? Math.round((paidCount / dues.length) * 100) : 0;
  const pendingBookings = bookings.filter((b) => b.status === "confirmed").length;
  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Community overview</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Live data from Supabase</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Households" value={residents.length} accent={C.forest} sub={`${family.length} registered members`} />
        <StatCard label="Dues collected" value={`${collectionRate}%`} accent={C.gold} sub={`${paidCount}/${dues.length} invoices`} />
        <StatCard label="Bookings" value={pendingBookings} accent={C.sage} sub="confirmed" />
        <StatCard label="Gate scans" value={entryLogsToday.length} accent={C.brick} sub="today" />
      </div>
      <div>
        <SectionLabel>Overdue dues</SectionLabel>
        <div className="space-y-2">
          {dues.filter((d) => d.status === "overdue").map((d) => {
            const r = residents.find((x) => x.id === d.resident_id);
            return <Pass key={d.id} eyebrow={r ? `Blk ${r.blk} Lot ${r.lot}` : ""} title={r?.name || "Resident"} subtitle={`${d.month} dues overdue`} code={`₱${Number(d.amount).toLocaleString()}`} accent={C.brick} accentBg={C.brickBg} right={<Pill tone="brick">overdue</Pill>} />;
          })}
          {dues.filter((d) => d.status === "overdue").length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No overdue accounts. Nice.</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN: RESIDENTS (create + list)
// ---------------------------------------------------------------------------
function surnameOf(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "Resident";
}
function usernameOf(blk, lot, phase) {
  const clean = (s) => (s || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `b${clean(blk)}l${clean(lot)}p${clean(phase)}`;
}
const USERNAME_DOMAIN = "gatehouse.local";

function AdminResidents({ residents, family, token, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", blk: "", lot: "", phase: "", vehicle: "", phone: "", family_member_count: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  const previewUsername = form.blk && form.lot && form.phase ? usernameOf(form.blk, form.lot, form.phase) : null;

  async function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.blk.trim() || !form.lot.trim() || !form.phase.trim()) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const username = usernameOf(form.blk, form.lot, form.phase);
      const email = `${username}@${USERNAME_DOMAIN}`;
      const name = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const password = form.lastName.trim();
      await callFunction("admin-create-user", token, { ...form, name, email, role: "resident", password, family_member_count: Number(form.family_member_count) || 1 });
      setResult({ username, password });
      setForm({ firstName: "", lastName: "", blk: "", lot: "", phase: "", vehicle: "", phone: "", family_member_count: 1 });
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="f-display text-xl" style={{ color: C.ink }}>Residents</div>
          <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>{residents.length} households</div>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="f-body text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1" style={{ background: C.forest, color: "#fff" }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {open && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <SectionLabel>New resident household</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <Field label="First name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Juan" />
            <Field label="Last name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Dela Cruz" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Block" value={form.blk} onChange={(e) => set("blk", e.target.value)} placeholder="4" />
            <Field label="Lot" value={form.lot} onChange={(e) => set("lot", e.target.value)} placeholder="12" />
            <Field label="Phase" value={form.phase} onChange={(e) => set("phase", e.target.value)} placeholder="2" />
          </div>
          <Field label="Vehicle (plate / model)" value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder="ABC 1234, Toyota Vios" />
          <Field label="Contact number" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0917 555 0142" />
          <Field label="Declared family member count" value={form.family_member_count} onChange={(e) => set("family_member_count", e.target.value)} type="number" min="1" />
          {previewUsername && (
            <p className="f-body text-[11px]" style={{ color: C.inkSoft }}>
              Login username will be <span className="f-mono" style={{ color: C.ink }}>{previewUsername}</span>, password will be the last name <span className="f-mono" style={{ color: C.ink }}>{form.lastName.trim() || "—"}</span>.
            </p>
          )}
          {error && <Banner tone="brick">{error}</Banner>}
          {result && (
            <Banner tone="sage">
              Account created. Share these login details with the resident: <br />
              <span className="f-mono">{result.username} / {result.password}</span>
            </Banner>
          )}
          <button onClick={submit} disabled={busy || !form.firstName.trim() || !form.lastName.trim() || !form.blk.trim() || !form.lot.trim() || !form.phase.trim()} className="f-body text-sm font-medium w-full py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.forest, color: "#fff" }}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : "Create resident account"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {residents.map((r) => {
          const members = family.filter((m) => m.resident_id === r.id);
          return (
            <Pass key={r.id} eyebrow={`Blk ${r.blk || "—"} Lot ${r.lot || "—"}, ${r.phase || "—"}`} title={r.name} subtitle={`${r.phone || "No contact"} · ${r.vehicle || "No vehicle"}`} code={`${members.length}/${r.family_member_count || 1}`} accent={C.forest} accentBg={C.sageBg} right={<Pill tone="sage">{members.length} QR issued</Pill>} />
          );
        })}
        {residents.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No residents yet — add the first household above.</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN: STAFF (admin + security accounts)
// ---------------------------------------------------------------------------
const STAFF_ROLES = [
  { key: "admin", label: "Admin" },
  { key: "security", label: "Security" },
  { key: "cashier", label: "Cashier" },
  { key: "staff", label: "General staff" },
];

function AdminStaff({ staff, token, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", role: "security" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  const nextNumber = staff.filter((s) => s.role === form.role).length + 1;
  const previewUsername = `${form.role}${nextNumber}`;

  async function submit() {
    if (!form.name.trim()) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const username = `${form.role}${staff.filter((s) => s.role === form.role).length + 1}`;
      const email = `${username}@${USERNAME_DOMAIN}`;
      const password = genTempPassword();
      await callFunction("admin-create-user", token, { ...form, email, password });
      setResult({ username, password });
      setForm({ name: "", phone: "", role: form.role });
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="f-display text-xl" style={{ color: C.ink }}>Staff accounts</div>
          <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Admin, security, cashier &amp; general staff</div>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="f-body text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1" style={{ background: C.forest, color: "#fff" }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {open && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <SectionLabel>New staff account</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {STAFF_ROLES.map((r) => (
              <button key={r.key} onClick={() => set("role", r.key)} className="f-body text-xs font-medium py-2 rounded-lg" style={{ background: form.role === r.key ? C.ink : C.paper, color: form.role === r.key ? "#fff" : C.inkSoft, border: `1px solid ${form.role === r.key ? C.ink : C.line}` }}>{r.label}</button>
            ))}
          </div>
          <Field label="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
          <Field label="Contact number" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0917 555 0142" />
          <p className="f-body text-[11px]" style={{ color: C.inkSoft }}>
            Login username will be <span className="f-mono" style={{ color: C.ink }}>{previewUsername}</span>.
          </p>
          {error && <Banner tone="brick">{error}</Banner>}
          {result && (
            <Banner tone="sage">
              Account created. Share these login details: <br />
              <span className="f-mono">{result.username} / {result.password}</span>
            </Banner>
          )}
          <button onClick={submit} disabled={busy || !form.name.trim()} className="f-body text-sm font-medium w-full py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.forest, color: "#fff" }}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : "Create staff account"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {STAFF_ROLES.map((r) => r.key).map((roleKey) =>
          staff.filter((s) => s.role === roleKey).map((s) => (
            <Pass key={s.id} eyebrow={s.role} title={s.name} subtitle={s.phone || ""} accent={s.role === "admin" ? C.forest : s.role === "security" ? C.brick : s.role === "cashier" ? C.gold : C.sage} accentBg={s.role === "admin" ? C.sageBg : s.role === "security" ? C.brickBg : s.role === "cashier" ? C.goldBg : C.sageBg} right={<Pill tone={s.role === "admin" ? "sage" : s.role === "security" ? "brick" : s.role === "cashier" ? "gold" : "sage"}>{s.role}</Pill>} />
          ))
        )}
        {staff.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No staff accounts yet.</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN: BOOKINGS / DUES
// ---------------------------------------------------------------------------
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
              <Pass eyebrow={am?.name || "Amenity"} title={r?.name || "Resident"} subtitle={`${fmtDate(b.booking_date)} · ${b.slot}`} code={b.id.slice(0, 8).toUpperCase()} accent={b.status === "cancelled" ? "#A4ABA3" : C.forest} accentBg={b.status === "cancelled" ? C.paper2 : C.sageBg} right={<Pill tone={b.status === "cancelled" ? "ink" : "sage"}>{b.status}</Pill>} />
              {b.status === "confirmed" && <button onClick={() => updateBooking(b.id, "cancelled")} className="f-body text-xs font-medium mt-1.5 px-3 py-1.5 rounded-lg" style={{ background: C.paper2, color: C.brick }}>Cancel booking</button>}
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
              <Pass eyebrow={r ? `Blk ${r.blk} Lot ${r.lot}` : ""} title={r?.name || "Resident"} subtitle={`${d.month} · ${d.status === "paid" ? "Paid " + fmtDate(d.paid_date) : "Due " + fmtDate(d.due_date)}`} code={`₱${Number(d.amount).toLocaleString()}`} accent={d.status === "paid" ? C.sage : d.status === "overdue" ? C.brick : C.gold} accentBg={d.status === "paid" ? C.sageBg : d.status === "overdue" ? C.brickBg : C.goldBg} right={<Pill tone={d.status === "paid" ? "sage" : d.status === "overdue" ? "brick" : "gold"}>{d.status}</Pill>} />
              {d.status !== "paid" && <button onClick={() => payDue(d.id)} className="f-body text-xs font-medium mt-1.5 px-3 py-1.5 rounded-lg" style={{ background: C.forest, color: "#fff" }}>Mark as paid</button>}
            </div>
          );
        })}
        {dues.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No invoices yet.</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECURITY: SCAN (camera QR scanner + manual fallback)
// ---------------------------------------------------------------------------
function SecurityScan({ residents, lookupFamilyByCode, logEntry, recentLogs, busy }) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [matched, setMatched] = useState(null); // { member, resident } | "not-found" | null
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  async function startScan() {
    setCameraError(""); setMatched(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setScanning(true);
      tick();
    } catch (e) {
      setCameraError("Couldn't access the camera. You can still enter a code manually below.");
    }
  }
  function stopScan() {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }
  function tick() {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) { handleCode(code.data); return; }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  async function handleCode(code) {
    stopScan();
    const found = await lookupFamilyByCode(code);
    setMatched(found || "not-found");
  }

  async function submitManual() {
    if (!manualCode.trim()) return;
    const found = await lookupFamilyByCode(manualCode.trim());
    setMatched(found || "not-found");
    setManualCode("");
  }

  useEffect(() => () => stopScan(), []);

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <div className="f-display text-xl" style={{ color: C.ink }}>Scan resident QR</div>
        <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>Verify legitimacy, then log entry or exit.</div>
      </div>

      {!scanning && (
        <button onClick={startScan} className="w-full rounded-xl p-4 flex items-center justify-center gap-2" style={{ background: C.forest }}>
          <Camera size={18} color="#fff" />
          <span className="f-body text-sm font-medium text-white">Open camera scanner</span>
        </button>
      )}
      {scanning && (
        <div className="relative rounded-xl overflow-hidden" style={{ background: "#000" }}>
          <video ref={videoRef} className="w-full" style={{ maxHeight: "260px", objectFit: "cover" }} muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          <button onClick={stopScan} className="absolute top-2 right-2 f-body text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>Stop</button>
        </div>
      )}
      {cameraError && <Banner tone="brick">{cameraError}</Banner>}

      <div className="flex gap-2">
        <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Or type QR code manually" className="f-body text-sm flex-1 px-3 py-2.5 rounded-lg outline-none" style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.ink }} />
        <button onClick={submitManual} className="f-body text-xs font-medium px-3 rounded-lg" style={{ background: C.paper2, color: C.ink }}>Check</button>
      </div>

      {matched === "not-found" && <Banner tone="brick">No resident found for that code. Do not admit — escalate to admin.</Banner>}

      {matched && matched !== "not-found" && (
        <div className="space-y-2">
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: C.sageBg, border: `1.5px solid ${C.sage}` }}>
            <CheckCircle2 size={28} color={C.forest} />
            <div>
              <div className="f-display text-lg" style={{ color: C.ink }}>{matched.member.name}</div>
              <div className="f-body text-xs" style={{ color: C.inkSoft }}>{matched.member.relation} · Blk {matched.resident.blk} Lot {matched.resident.lot}, {matched.resident.phase}</div>
              <div className="f-body text-xs mt-0.5" style={{ color: C.forest, fontWeight: 600 }}>Verified legitimate resident</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={async () => { await logEntry(matched.member.id, "in"); setMatched(null); }} className="f-body text-sm font-medium py-3 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.forest, color: "#fff" }}>
              <UserCheck size={15} /> Log IN
            </button>
            <button disabled={busy} onClick={async () => { await logEntry(matched.member.id, "out"); setMatched(null); }} className="f-body text-sm font-medium py-3 rounded-lg flex items-center justify-center gap-1.5" style={{ background: C.paper2, color: C.ink }}>
              <UserX size={15} /> Log OUT
            </button>
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Recent scans</SectionLabel>
        <div className="space-y-2">
          {recentLogs.slice(0, 6).map((l) => (
            <Pass key={l.id} eyebrow={fmtTime(l.scanned_at)} title={l.memberName} subtitle={l.residentLabel} accent={l.direction === "in" ? C.sage : "#A4ABA3"} accentBg={l.direction === "in" ? C.sageBg : C.paper2} right={<Pill tone={l.direction === "in" ? "sage" : "ink"}>{l.direction}</Pill>} />
          ))}
          {recentLogs.length === 0 && <p className="f-body text-xs" style={{ color: C.inkSoft }}>No scans logged yet today.</p>}
        </div>
      </div>
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
  const [profiles, setProfiles] = useState([]);
  const [family, setFamily] = useState([]);
  const [entryLogs, setEntryLogs] = useState([]);

  const token = session?.access_token;

  const loadAll = useCallback(async (tok) => {
    setLoadingApp(true); setLoadError("");
    try {
      const [am, bk, du, pr, fm, el] = await Promise.all([
        rest("amenities?select=*&order=name", { token: tok }),
        rest("bookings?select=*&order=booking_date", { token: tok }),
        rest("dues?select=*&order=due_date", { token: tok }),
        rest("profiles?select=*", { token: tok }),
        rest("family_members?select=*&order=created_at", { token: tok }),
        rest("entry_logs?select=*&order=scanned_at.desc&limit=50", { token: tok }),
      ]);
      setAmenities(am); setBookings(bk); setDues(du); setProfiles(pr); setFamily(fm); setEntryLogs(el);
    } catch (e) { setLoadError(e.message); }
    finally { setLoadingApp(false); }
  }, []);

  useEffect(() => { if (session && profile) loadAll(session.access_token); }, [session, profile, loadAll]);

  async function handleSignIn(email, password) {
    const data = await authRequest("token?grant_type=password", { email, password });
    const prof = await rest(`profiles?id=eq.${data.user.id}&select=*`, { token: data.access_token });
    if (!prof[0]) throw new Error("No profile found for this account.");
    setSession(data); setProfile(prof[0]);
    const defaults = { resident: "home", admin: "overview", security: "scan", cashier: "duesAdmin", staff: "staffHome" };
    setTab(defaults[prof[0].role] || "home");
  }
  function handleSignOut() {
    setSession(null); setProfile(null);
    setAmenities([]); setBookings([]); setDues([]); setProfiles([]); setFamily([]); setEntryLogs([]);
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
  async function addFamilyMember(fields) {
    setBusy(true);
    try {
      const [row] = await rest("family_members", { method: "POST", token, body: { ...fields, resident_id: profile.id } });
      setFamily((prev) => [...prev, row]);
      return row;
    } finally { setBusy(false); }
  }
  async function lookupFamilyByCode(code) {
    const rows = await rest(`family_members?qr_code=eq.${encodeURIComponent(code)}&select=*`, { token });
    if (!rows[0]) return null;
    const resident = profiles.find((p) => p.id === rows[0].resident_id) || (await rest(`profiles?id=eq.${rows[0].resident_id}&select=*`, { token }))[0];
    return { member: rows[0], resident };
  }
  async function logEntry(familyMemberId, direction) {
    setBusy(true);
    try {
      const [row] = await rest("entry_logs", { method: "POST", token, body: { family_member_id: familyMemberId, scanned_by: profile.id, direction } });
      setEntryLogs((prev) => [row, ...prev]);
    } finally { setBusy(false); }
  }
  async function uploadHouseholdPhoto(file) {
    const url = await uploadPhoto(file, token, `household/${profile.id}`);
    const [row] = await rest(`profiles?id=eq.${profile.id}`, { method: "PATCH", token, body: { photo_url: url } });
    setProfile(row);
  }

  if (!session || !profile) return <AuthScreen onSignIn={handleSignIn} />;

  const residents = profiles.filter((p) => p.role === "resident");
  const staff = profiles.filter((p) => p.role !== "resident");
  const myBookings = bookings.filter((b) => b.resident_id === profile.id);
  const myDues = dues.filter((d) => d.resident_id === profile.id);
  const myFamily = family.filter((m) => m.resident_id === profile.id);

  const todayStr = isoDate(new Date());
  const entryLogsToday = entryLogs.filter((l) => l.scanned_at?.slice(0, 10) === todayStr);
  const recentLogsEnriched = entryLogs.map((l) => {
    const m = family.find((fm) => fm.id === l.family_member_id);
    const r = m ? profiles.find((p) => p.id === m.resident_id) : null;
    return { ...l, memberName: m?.name || "Unknown", residentLabel: r ? `Blk ${r.blk} Lot ${r.lot}` : "" };
  });

  const residentNav = [
    { key: "home", label: "Home", icon: Home },
    { key: "book", label: "Book", icon: CalendarDays },
    { key: "dues", label: "Dues", icon: Wallet },
    { key: "household", label: "Household", icon: IdCard },
  ];
  const adminNav = [
    { key: "overview", label: "Overview", icon: Home },
    { key: "residents", label: "Residents", icon: Users },
    { key: "staff", label: "Staff", icon: ShieldCheck },
    { key: "bookingsAdmin", label: "Bookings", icon: CalendarDays },
    { key: "duesAdmin", label: "Dues", icon: Wallet },
  ];
  const securityNav = [{ key: "scan", label: "Scan", icon: ScanLine }];
  const cashierNav = [{ key: "duesAdmin", label: "Dues", icon: Wallet }];
  const staffNav = [{ key: "staffHome", label: "Home", icon: Home }];

  const navByRole = { resident: residentNav, admin: adminNav, security: securityNav, cashier: cashierNav, staff: staffNav };
  const defaultTabByRole = { resident: "home", admin: "overview", security: "scan", cashier: "duesAdmin", staff: "staffHome" };

  const titles = { home: "Home", book: "Book amenity", dues: "Dues", household: "Household", overview: "Admin", residents: "Residents", staff: "Staff", bookingsAdmin: "Bookings", duesAdmin: "Dues ledger", scan: "Security", staffHome: "Home" };

  return (
    <div className="min-h-screen f-body" style={{ background: C.paper, maxWidth: "480px", margin: "0 auto", position: "relative" }}>
      {FONTS}
      <TopBar title={titles[tab]} subtitle={`${profile.name} · ${profile.role === "resident" ? `Blk ${profile.blk || "—"} Lot ${profile.lot || "—"}` : profile.role}`} onSignOut={handleSignOut} />

      {loadingApp && <div className="flex items-center gap-2 px-4 py-3 f-body text-xs" style={{ color: C.inkSoft }}><Loader2 size={14} className="animate-spin" /> Loading live data…</div>}
      {loadError && <div className="mx-4 mt-3"><Banner tone="brick">{loadError}</Banner></div>}

      <div style={{ paddingBottom: "88px" }}>
        {profile.role === "resident" && tab === "home" && <ResidentHome profile={profile} bookings={myBookings} dues={myDues} family={myFamily} setTab={setTab} />}
        {profile.role === "resident" && tab === "book" && <ResidentBook profile={profile} bookings={bookings} amenities={amenities} addBooking={addBooking} busy={busy} />}
        {profile.role === "resident" && tab === "dues" && <ResidentDues profile={profile} dues={myDues} payDue={payDue} />}
        {profile.role === "resident" && tab === "household" && <ResidentHousehold profile={profile} family={myFamily} addMember={addFamilyMember} uploadHouseholdPhoto={uploadHouseholdPhoto} token={token} busy={busy} />}

        {profile.role === "admin" && tab === "overview" && <AdminOverview residents={residents} bookings={bookings} dues={dues} family={family} entryLogsToday={entryLogsToday} />}
        {profile.role === "admin" && tab === "residents" && <AdminResidents residents={residents} family={family} token={token} onCreated={() => loadAll(token)} />}
        {profile.role === "admin" && tab === "staff" && <AdminStaff staff={staff} token={token} onCreated={() => loadAll(token)} />}
        {profile.role === "admin" && tab === "bookingsAdmin" && <AdminBookings bookings={bookings} residents={profiles} amenities={amenities} updateBooking={updateBooking} />}
        {profile.role === "admin" && tab === "duesAdmin" && <AdminDues dues={dues} residents={profiles} payDue={payDue} />}

        {profile.role === "security" && tab === "scan" && <SecurityScan residents={residents} lookupFamilyByCode={lookupFamilyByCode} logEntry={logEntry} recentLogs={recentLogsEnriched} busy={busy} />}

        {profile.role === "cashier" && tab === "duesAdmin" && <AdminDues dues={dues} residents={profiles} payDue={payDue} />}

        {profile.role === "staff" && tab === "staffHome" && (
          <div className="px-4 py-4 space-y-4">
            <div>
              <div className="f-display text-xl" style={{ color: C.ink }}>Welcome, {profile.name.split(" ")[0]}</div>
              <div className="f-body text-xs mt-0.5" style={{ color: C.inkSoft }}>General staff account</div>
            </div>
            <Banner tone="sage">Your account is active. Ask your admin what tasks you should have access to next — this role doesn't have a dedicated screen yet.</Banner>
          </div>
        )}
      </div>

      <BottomNav items={navByRole[profile.role] || []} active={tab} onChange={setTab} />
    </div>
  );
}
