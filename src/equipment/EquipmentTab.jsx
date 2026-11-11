// Equipment finance: local dealer call list + scripts. Kept apart from Contacts (past clients, agents) on purpose.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";
import { today } from "../radar/engine.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10, padding:14, marginBottom:10 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 12px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light };
const inp = { padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, width:"100%", boxSizing:"border-box" };

// Local Sarasota / Bradenton dealers from the launch kit. Added to the table once.
export const SEED = [
  { name:"LESS of Bradenton (Landscape Equipment Super Store)", niche:"Landscaping", address:"4911 Lena Rd, Bradenton, FL 34211", phone:"(941) 201-5007", notes:"Off I-75 and SR-70 near Lakewood Ranch. Commercial zero-turns, loaders, trailers." },
  { name:"Preferred Turf Equipment", niche:"Landscaping", address:"850 Cattlemen Rd, Sarasota, FL 34232", phone:"(941) 371-2966", notes:"Independent Sarasota commercial mower dealer serving local lawn crews." },
  { name:"Mowers, Inc.", niche:"Landscaping", address:"4511 Clark Rd, Sarasota, FL 34233", phone:"(941) 706-4465", notes:"Family-owned. Wright, Scag, Toro commercial units." },
  { name:"Gravely of Bradenton", niche:"Landscaping", address:"5732 15th St E, Bradenton, FL 34203", phone:"(941) 755-1565", notes:"High-volume commercial mower showroom. Buyers often bundle trailers and handheld gear." },
  { name:"Russo's Restaurant Equipment & Supply", niche:"Restaurant", address:"1537 Northgate Blvd, Sarasota, FL 34234", phone:"(941) 554-8315", notes:"Family-operated 10,000 sq ft showroom, new and used commercial kitchen gear." },
  { name:"Restaurant City Sarasota", niche:"Restaurant", address:"7810 25th Ct E #106, Sarasota, FL 34243", phone:"(941) 358-9555", notes:"Commercial refrigeration and cooking showroom near SRQ airport." },
  { name:"Kesco Kitchen Equipment & Supply Co", niche:"Restaurant", address:"816 Manatee Ave E Ste 13, Bradenton, FL 34208", phone:"(941) 417-0200", notes:"Independent Bradenton supplier: ovens, ice machines, refrigeration." },
  { name:"Glade & Grove Supply Co", niche:"Construction", address:"6150 Porter Rd, Sarasota, FL 34240", phone:"(941) 526-0726", notes:"" },
];

const PHONE = `Hi [Name], I'm Joshua with Graham Financial right here in Sarasota. I specialize in equipment financing for [landscaping/restaurant/construction] dealers in the area. I know most of your cash buyers are easy, and you probably already have a primary bank for your top-tier credit buyers.

Where I help dealers like you is catching the deals that fall through the cracks: startups, buyers with a few credit dings, or customers who want to bundle attachments and delivery into one monthly payment so they don't walk off the lot. You get paid the full invoice before the equipment leaves your lot. Next time you have a buyer sitting on the fence over price, can I run a soft-pull quote for you to help save the sale?`;
const EMAIL = `Subject: Helping you close more [mowers/ovens/skid steers] this month

Hi [Name],

I'm with Graham Financial here in Sarasota, and I work with local [industry] dealers to help convert buyers who stall on upfront cash or get turned down by traditional banks.

- Fast turns: app-only approvals on smaller deals.
- Full spectrum: programs for A-credit down to startups and challenged credit.
- Zero hassle: I handle the customer paperwork, and you get paid in full before equipment leaves your lot.

Do you have a stalled quote on your desk right now that I can take a look at to show you how fast we move?

Best,
Joshua Graham
Graham Financial | Sarasota, FL
720-468-6872`;
const OBJ = [
  ["We already have a financing company / bank.", "That's great, keep sending your A-credit buyers to them. I'm not trying to replace your main bank. I catch the buyers they turn down (startups, 600 scores, private-party sales) so you don't lose a sale you already worked hard to close. Fair enough?"],
  ["Just drop off brochures / send an email.", "I can email my one-page flyer. Before I hang up: out of the quotes on your desk right now, is there one buyer who's stalled on cash or got a no from their bank? Let me run that one deal to show you how fast we move."],
];
const OUTCOMES = [["voicemail","Voicemail",3],["talked","Talked",7],["sending deals","Sending deals",14],["not now","Not now",45]];
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const copy = (t) => navigator.clipboard?.writeText(t);
const tel = (p) => "tel:" + (p || "").replace(/[^\d+]/g, "");
const maps = (a) => "https://www.google.com/maps/search/" + encodeURIComponent(a || "");

export default function EquipmentTab({ userId }) {
  const [rows, setRows] = useState([]); const [missing, setMissing] = useState(false); const [msg, setMsg] = useState("");
  const [niche, setNiche] = useState("All"); const [note, setNote] = useState({}); const [open, setOpen] = useState(""); const [add, setAdd] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("equipment_prospects").select("*").order("created_at");
    if (error) { setMissing(true); setRows(SEED.map((s, i) => ({ ...s, id:"seed"+i, status:"new", next_date:today(), calls:0 }))); return; }
    if (!data.length) {
      const { error: e2 } = await supabase.from("equipment_prospects").insert(SEED.map((s) => ({ ...s, user_id:userId })));
      if (e2) { setMsg(e2.message); return; }
      return load();
    }
    setMissing(false); setRows(data);
  }, [userId]);
  useEffect(() => { if (userId) load(); }, [userId, load]);

  const log = async (r, [status, , days]) => {
    if (missing) { setMsg("Run equipment_prospects_v1.sql first so calls save."); return; }
    const n = (note[r.id] || "").trim();
    const { error } = await supabase.from("equipment_prospects").update({ status, next_date:addDays(days), last_called_at:new Date().toISOString(), calls:(r.calls||0)+1, last_note: n ? `${today()}: ${n}${r.last_note ? "\n" + r.last_note : ""}` : r.last_note }).eq("id", r.id);
    if (error) setMsg(error.message); else { setNote((p) => ({ ...p, [r.id]:"" })); load(); }
  };
  const saveNew = async () => {
    if (!add?.name?.trim()) return;
    const { error } = await supabase.from("equipment_prospects").insert({ ...add, name:add.name.trim(), user_id:userId });
    if (error) setMsg(error.message); else { setAdd(null); load(); }
  };

  const t = today();
  const list = rows.filter((r) => niche === "All" || r.niche === niche);
  const due = list.filter((r) => !r.next_date || r.next_date <= t).sort((a, b) => (a.next_date || "").localeCompare(b.next_date || ""));
  const later = list.filter((r) => r.next_date && r.next_date > t).sort((a, b) => a.next_date.localeCompare(b.next_date));
  const niches = ["All", ...new Set(rows.map((r) => r.niche).filter(Boolean))];

  const Row = (r) => (
    <div key={r.id} style={card}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
        <div style={{ fontFamily:F.cond, fontWeight:800, fontSize:18, color:C.ink }}>{r.name}</div>
        <div style={{ fontFamily:F.mono, fontSize:11, color:r.status==="sending deals"?C.green:C.light }}>{(r.niche||"").toUpperCase()} · {r.status.toUpperCase()}{r.calls ? ` · ${r.calls} CALL${r.calls>1?"S":""}` : ""}{r.next_date && r.next_date > t ? ` · NEXT ${r.next_date}` : ""}</div>
      </div>
      <div style={{ fontFamily:F.body, fontSize:14, color:C.mid, margin:"4px 0 8px" }}>{r.address}{r.notes ? ` · ${r.notes}` : ""}</div>
      {r.contact_name && <div style={{ fontFamily:F.body, fontSize:14, color:C.ink, marginBottom:6 }}>Contact: {r.contact_name}{r.email ? ` · ${r.email}` : ""}</div>}
      {r.last_note && <div style={{ fontFamily:F.mono, fontSize:12, color:C.mid, whiteSpace:"pre-wrap", background:"#fff", border:`1px solid ${C.rule}`, borderRadius:6, padding:8, marginBottom:8 }}>{r.last_note}</div>}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
        <a href={tel(r.phone)} style={btnG}>Call {r.phone}</a>
        <a href={maps(r.address)} target="_blank" rel="noreferrer" style={btn}>Map</a>
        <button style={btn} onClick={() => copy(EMAIL)}>Copy email</button>
        {r.email && <a href={`mailto:${r.email}`} style={btn}>Email</a>}
      </div>
      <input style={inp} placeholder="Call note (who you spoke with, stalled deals, follow-up)" value={note[r.id] || ""} onChange={(e) => setNote((p) => ({ ...p, [r.id]:e.target.value }))} />
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
        {OUTCOMES.map((o) => <button key={o[0]} style={btn} onClick={() => log(r, o)}>{o[1]}</button>)}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ ...card, background:"#fff" }}>
        <div style={lbl}>Equipment finance · local dealers</div>
        <div style={{ fontFamily:F.body, fontSize:14, color:C.mid, marginTop:4 }}>Dealers who lose sales when the buyer's bank says no. Kept separate from Contacts. Outcome buttons log the call and set the next date.</div>
        {missing && <div style={{ fontFamily:F.body, fontSize:14, color:C.amber, background:C.amberBg, borderRadius:6, padding:8, marginTop:8 }}>The list shows, but calls won't save until equipment_prospects_v1.sql is run in Supabase.</div>}
        {msg && <div style={{ fontFamily:F.mono, fontSize:12, color:C.amber, marginTop:8 }}>{msg}</div>}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
          {niches.map((n) => <button key={n} style={niche===n?btnG:btn} onClick={() => setNiche(n)}>{n}</button>)}
          <button style={btn} onClick={() => setOpen(open==="scripts"?"":"scripts")}>{open==="scripts"?"Hide scripts":"Scripts"}</button>
          {!missing && <button style={btn} onClick={() => setAdd(add ? null : { name:"", niche:"", address:"", phone:"", contact_name:"", email:"", notes:"" })}>{add ? "Cancel" : "Add dealer"}</button>}
          <a href="https://www.floridaucc.com/" target="_blank" rel="noreferrer" style={btn}>Florida UCC search</a>
        </div>
      </div>

      {add && <div style={card}>
        {[["name","Business name"],["niche","Niche (Landscaping, Restaurant, Construction)"],["phone","Phone"],["address","Address"],["contact_name","Contact name"],["email","Email"],["notes","Notes"]].map(([k, p]) =>
          <input key={k} style={{ ...inp, marginBottom:6 }} placeholder={p} value={add[k]} onChange={(e) => setAdd({ ...add, [k]:e.target.value })} />)}
        <button style={btnG} onClick={saveNew}>Save dealer</button>
      </div>}

      {open === "scripts" && <div style={card}>
        <div style={lbl}>Dealer call</div>
        <div style={{ fontFamily:F.body, fontSize:15, color:C.ink, whiteSpace:"pre-wrap", margin:"6px 0 8px" }}>{PHONE}</div>
        <button style={btn} onClick={() => copy(PHONE)}>Copy call script</button>
        <div style={{ ...lbl, marginTop:14 }}>Objections</div>
        {OBJ.map(([q, a]) => <div key={q} style={{ margin:"8px 0" }}><div style={{ fontFamily:F.cond, fontWeight:700, fontSize:16, color:C.ink }}>"{q}"</div><div style={{ fontFamily:F.body, fontSize:15, color:C.mid }}>{a}</div></div>)}
        <div style={{ ...lbl, marginTop:14 }}>Dealer email</div>
        <div style={{ fontFamily:F.body, fontSize:15, color:C.ink, whiteSpace:"pre-wrap", margin:"6px 0 8px" }}>{EMAIL}</div>
        <button style={btn} onClick={() => copy(EMAIL)}>Copy email</button>
      </div>}

      <div style={{ ...lbl, margin:"14px 0 8px" }}>Call today ({due.length})</div>
      {due.length ? due.map(Row) : <div style={{ fontFamily:F.body, color:C.light, marginBottom:10 }}>Nothing due. Add dealers or check back on the next dates below.</div>}
      {later.length > 0 && <><div style={{ ...lbl, margin:"14px 0 8px" }}>Coming up ({later.length})</div>{later.map(Row)}</>}
    </div>
  );
}
