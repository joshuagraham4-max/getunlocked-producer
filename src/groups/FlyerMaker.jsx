// Co-branded open house flyers for agent partners' listings.
// Fill in the listing, upload the photo and the agent's headshot, set the rate and buydown, print to letter PDF.
// Photos stay at their uploaded resolution so prints are sharp. Recent flyers are kept on this device.
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase.js";

const C = { ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", card:"#faf7f2", green:"#1e6e4a", greenBg:"#e8f4ee", red:"#9e3020" };
const F = { cond:"'Barlow Condensed', sans-serif", mono:"'DM Mono',monospace", body:"'Barlow', sans-serif" };
const ACCENTS = [["#1e5a42", "Green"], ["#8a6a3b", "Bronze"], ["#1d3f6e", "Navy"], ["#141414", "Black"]];
const DOWNS = [20, 10, 3];
const BUYDOWNS = { none:[], "1/0":[1], "2/1":[2, 1] };   // points below the note rate, by year
const SERIF = "'Playfair Display', Georgia, serif";
const JOSHUA = { name:"Joshua Graham", title:"AVP / Regional Loan Originator · NMLS 169809", contact:"720.468.6872 · approvedbyjoshua.com", photo:"/brand/joshua-headshot.jpg", logo:"/brand/gf-logo.png" };
const BLANK = { agentName:"", brokerage:"", agentPhone:"", agentEmail:"", agentPhoto:"", address:"", city:"", price:"", beds:"", baths:"", sqft:"",
  extraValue:"", extraLabel:"", openHouse:"", photo:"", rate:"6.375", buydown:"2/1", credit:"", apr:"", fees:"", score:"", asOf:"", headline:"", accent:"#1e5a42" };

const num = (v) => { const n = parseFloat(String(v || "").replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");
const k$ = (n) => "$" + (n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(/\.0$/, "") + "K" : Math.round(n));
const pmt = (L, r) => { const i = r / 1200; return i ? L * i / (1 - Math.pow(1 + i, -360)) : L / 360; };
const pct = (r) => `${(+r).toFixed(3)}%`;
const localDate = () => new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

// Resize an uploaded photo (long edge max px) to a JPEG data URL: sharp for print, light enough to save.
const loadPhoto = (file, max) => new Promise((resolve) => {
  const r = new FileReader();
  r.onload = () => { const img = new Image(); img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/jpeg", 0.88)); }; img.src = r.result; };
  r.readAsDataURL(file);
});

export function flyerMath(f) {
  const price = num(f.price), rate = num(f.rate), steps = BUYDOWNS[f.buydown] || [];
  const years = [...steps.map((d) => rate - d), rate];   // e.g. 2/1 -> [r-2, r-1, r]
  const rows = DOWNS.map((d) => {
    const loan = Math.round(price * (1 - d / 100)), full = pmt(loan, rate);
    const pays = years.map((r) => pmt(loan, r));
    const cost = steps.reduce((s, dpts) => s + (full - pmt(loan, rate - dpts)) * 12, 0);
    return { d, down:price * d / 100, loan, pays, cost };
  });
  const costs = rows.map((r) => r.cost); const credit = num(f.credit);
  return { price, rate, years, rows, costLo:Math.min(...costs), costHi:Math.max(...costs), credit };
}

const defaultHeadline = (f, m) => {
  if (!m.years.length || f.buydown === "none") return "Here's what it takes to own it.";
  if (m.credit && m.credit >= m.costLo * 0.9) return `The seller's ${k$(m.credit)} credit can buy your rate down.`;
  return f.buydown === "1/0" ? "A lower payment for your whole first year." : "Settle in at a lower payment for two full years.";
};

// ---------- the printed page (816x1056 = letter at 96px/in) ----------
export function Flyer({ f, m }) {
  const A = f.accent || "#1e5a42"; const yrLabels = f.buydown === "2/1" ? ["Year 1", "Year 2", "Years 3–30"] : f.buydown === "1/0" ? ["Year 1", "Years 2–30"] : ["Monthly"];
  const cols = `repeat(${yrLabels.length + 1}, minmax(0, 1fr))`;
  const stats = [[f.beds, "Beds"], [f.baths, "Baths"], [f.sqft, "Sq Ft"], [f.extraValue, f.extraLabel]].filter(([v]) => v);
  const eyebrow = f.buydown === "none" ? "30-Year Fixed" : `${m.credit ? "Seller-paid " : ""}${f.buydown} Buydown`;
  const headline = f.headline || defaultHeadline(f, m);
  const lbl = { fontSize:10, fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase", color:"#5c564d" };
  const bars = m.years.map((r, i) => ({ r, h: m.years.length === 1 ? 88 : 52 + i * (36 / Math.max(1, m.years.length - 1)), bg: i === m.years.length - 1 ? "#141414" : A, op: i === 0 || i === m.years.length - 1 ? 1 : 0.7, label: yrLabels[i] }));
  const creditNote = m.credit ? `Seller is offering ${usd(m.credit)} in concessions, subject to lender approval; any buydown cost above the seller credit is paid by the buyer. ` : (f.buydown !== "none" ? "Buydown cost shown as paid by the seller. " : "");
  return (
    <div id="gup-flyer" style={{ width:816, height:1056, boxSizing:"border-box", background:"#f7f4ee", color:"#141414", fontFamily:"Inter, system-ui, sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ position:"relative", flex:"1 1 0", minHeight:280, overflow:"hidden", background:"#2a2724" }}>
        {f.photo ? <img src={f.photo} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}/> :
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#cfc8bd", fontSize:15 }}>Upload the listing photo</div>}
        <div style={{ position:"absolute", left:0, right:0, bottom:0, height:230, background:"linear-gradient(to bottom, rgba(20,20,20,0) 0%, rgba(20,20,20,0.82) 100%)" }}/>
        <div style={{ position:"absolute", left:44, top:32, display:"flex", gap:10 }}>
          <div style={{ background:"#fff", color:"#141414", fontSize:11, fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", padding:"8px 14px" }}>Open House</div>
          {f.openHouse && <div style={{ background:"rgba(20,20,20,0.6)", color:"#fff", fontSize:12, fontWeight:500, padding:"8px 14px" }}>{f.openHouse}</div>}
        </div>
        <div style={{ position:"absolute", left:44, right:44, bottom:30, display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:24, color:"#fff" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:0 }}>
            <div style={{ fontFamily:SERIF, fontSize: (f.address || "").length > 22 ? 40 : 50, fontWeight:600, lineHeight:1 }}>{f.address || "Street address"}</div>
            <div style={{ fontSize:14, fontWeight:500, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.9 }}>{f.city || "City, State"}</div>
          </div>
          <div style={{ fontFamily:SERIF, fontSize:40, fontWeight:600, lineHeight:1 }}>{m.price ? usd(m.price) : "$—"}</div>
        </div>
      </div>
      {stats.length > 0 && <div style={{ background:"#141414", color:"#fff", display:"grid", gridTemplateColumns:`repeat(${stats.length}, minmax(0, 1fr))`, flexShrink:0 }}>
        {stats.map(([v, l], i) => <div key={i} style={{ padding:"14px 0", textAlign:"center", borderRight: i < stats.length - 1 ? "1px solid #3a3733" : "none" }}>
          <span style={{ fontFamily:SERIF, fontSize:22, fontWeight:600 }}>{v}</span> <span style={{ fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"#cfc8bd" }}>{l}</span></div>)}
      </div>}
      <div style={{ padding:"26px 44px 0", display:"grid", gridTemplateColumns:"250px minmax(0, 1fr)", gap:32, flexShrink:0 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color:A }}>{eyebrow}</div>
          <div style={{ fontFamily:SERIF, fontSize:27, fontWeight:600, lineHeight:1.12 }}>{headline}</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:130, marginTop:4 }}>
            {bars.map((b, i) => <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontFamily:SERIF, fontSize:19, fontWeight:600, textAlign:"center" }}>{pct(b.r)}</div>
              <div style={{ height:b.h, background:b.bg, opacity:b.op }}/>
              <div style={{ ...lbl, textAlign:"center" }}>{b.label.replace("Years", "Yrs")}</div></div>)}
          </div>
          <div style={{ fontSize:11, color:"#5c564d", lineHeight:1.45 }}>30-year fixed conventional · APR {f.apr ? `${f.apr}%` : "[required]"}{f.buydown !== "none" ? ` · Buydown costs about ${k$(m.costLo)}–${k$(m.costHi)}${m.credit ? ", covered in part or full by the seller credit." : "."}` : ""}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color:"#5c564d" }}>Monthly principal &amp; interest</div>
          <div style={{ display:"grid", gridTemplateColumns:cols, ...lbl, borderBottom:"1px solid #141414", paddingBottom:8 }}>
            <div>Down</div>{yrLabels.map((l) => <div key={l} style={{ textAlign:"right" }}>{l}</div>)}
          </div>
          {m.rows.map((r, i) => <div key={r.d} style={{ display:"grid", gridTemplateColumns:cols, alignItems:"baseline", borderBottom: i < 2 ? "1px solid #d9d2c6" : "none", padding:"4px 0 12px" }}>
            <div style={{ display:"flex", flexDirection:"column" }}><span style={{ fontFamily:SERIF, fontSize:24, fontWeight:600 }}>{r.d}%</span><span style={{ fontSize:11, color:"#5c564d" }}>{usd(r.down)} down</span></div>
            {r.pays.map((p, j) => <div key={j} style={j === 0 ? { textAlign:"right", fontFamily:SERIF, fontSize:30, fontWeight:600, color:A } : { textAlign:"right", fontSize:17, fontWeight:500 }}>{m.price ? usd(p) : "—"}</div>)}
          </div>)}
        </div>
      </div>
      <div style={{ margin:"24px 44px 0", borderTop:"1px solid #141414", paddingTop:18, display:"grid", gridTemplateColumns:"minmax(0, 0.92fr) minmax(0, 1.08fr)", gap:24, flexShrink:0 }}>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          {f.agentPhoto ? <img src={f.agentPhoto} alt="" style={{ width:84, height:84, borderRadius:"50%", objectFit:"cover", flexShrink:0, filter:"grayscale(1)" }}/> : <div style={{ width:84, height:84, borderRadius:"50%", background:"#e0d8cc", flexShrink:0 }}/>}
          <div style={{ display:"flex", flexDirection:"column", gap:2, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#5c564d" }}>Listing Broker</div>
            <div style={{ fontFamily:SERIF, fontSize:22, fontWeight:600 }}>{f.agentName || "Agent name"}</div>
            {f.brokerage && <div style={{ fontSize:12, fontWeight:600, letterSpacing:"0.08em" }}>{f.brokerage}</div>}
            <div style={{ fontSize:12, color:"#2e2b27", wordBreak:"break-word" }}>{[f.agentPhone, f.agentEmail].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <img src={JOSHUA.photo} alt="" style={{ width:84, height:84, borderRadius:"50%", objectFit:"cover", flexShrink:0, filter:"grayscale(1)" }}/>
          <div style={{ display:"flex", flexDirection:"column", gap:2, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#5c564d" }}>Financing</div>
            <div style={{ fontFamily:SERIF, fontSize:22, fontWeight:600 }}>{JOSHUA.name}</div>
            <div style={{ fontSize:12, color:"#2e2b27" }}>{JOSHUA.title}</div>
            <div style={{ fontSize:12, color:"#2e2b27" }}>{JOSHUA.contact}</div>
          </div>
          <img src={JOSHUA.logo} alt="Graham Financial" style={{ width:72, height:"auto", marginLeft:"auto", flexShrink:0 }}/>
        </div>
      </div>
      <div style={{ margin:"14px 44px 24px", flexShrink:0, fontSize:9, lineHeight:1.45, color:"#5c564d" }}>
        Example for illustration as of {f.asOf || localDate()}. Purchase price {m.price ? usd(m.price) : "[price]"}; 30-year fixed conventional loan. Rate {pct(m.rate)}, APR {f.apr ? `${f.apr}%` : "[APR]"}, based on {f.fees || "[points/fees]"} and a {f.score || "[credit score]"} credit score.
        {f.buydown !== "none" && ` ${f.buydown} buydown: ${m.years.slice(0, -1).map((r, i) => `${pct(r)} in year ${i + 1}`).join(" and ")}, then ${pct(m.rate)} for the remaining term; buydown cost about ${usd(m.costLo)}–${usd(m.costHi)} depending on down payment.`} {creditNote}Payments are principal and interest only and do not include taxes, insurance, HOA dues or mortgage insurance, which is required with less than 20% down and will raise the payment. 3% down is available to qualifying buyers. Rates and terms change daily; subject to credit approval and underwriting. Not a commitment to lend. Graham Financial powered by Zero Point Mortgage Services, NMLS 1216108. Equal Housing Opportunity.
      </div>
    </div>
  );
}

// ---------- the maker ----------
export default function FlyerMaker({ userId }) {
  const KEY = `gupFlyers:${userId}`;
  const [f, setF] = useState(BLANK); const [agents, setAgents] = useState([]); const [saved, setSaved] = useState([]); const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const m = useMemo(() => flyerMath(f), [f]);

  useEffect(() => {   // print fonts, once
    if (document.getElementById("gup-flyer-fonts")) return;
    const l = document.createElement("link"); l.id = "gup-flyer-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"; document.head.appendChild(l);
  }, []);
  useEffect(() => { if (!userId) return;
    supabase.from("agent_outreach").select("*").eq("user_id", userId).order("full_name").then(({ data }) => setAgents(data || []));
    try { setSaved(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { setSaved([]); }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickAgent = (id) => { const a = agents.find((x) => x.id === id); if (!a) return;
    const photos = (() => { try { return JSON.parse(localStorage.getItem(`${KEY}:agentPhotos`) || "{}"); } catch { return {}; } })();
    setF((x) => ({ ...x, agentId:a.id, agentName:a.full_name || "", brokerage:a.brokerage || "", agentPhone:a.phone || x.agentPhone, agentEmail:a.email || x.agentEmail, agentPhoto:photos[a.id] || "" })); };
  const upload = (k, max) => async (e) => { const file = e.target.files?.[0]; if (!file) return; const url = await loadPhoto(file, max); setF((x) => ({ ...x, [k]: url }));
    if (k === "agentPhoto" && f.agentId) { try { const p = JSON.parse(localStorage.getItem(`${KEY}:agentPhotos`) || "{}"); p[f.agentId] = url; localStorage.setItem(`${KEY}:agentPhotos`, JSON.stringify(p)); } catch { /* storage full: photo still used now */ } } };
  const save = () => { const entry = { ...f, id: f.id || Date.now().toString(36), savedAt: new Date().toISOString() };
    const list = [entry, ...saved.filter((s) => s.id !== entry.id)].slice(0, 8);
    try { localStorage.setItem(KEY, JSON.stringify(list)); setSaved(list); setF(entry); setMsg("Saved on this device."); }
    catch { try { localStorage.setItem(KEY, JSON.stringify(list.map((s) => ({ ...s, photo:"" })))); setSaved(list); setMsg("Saved (without the listing photo; this device is out of space)."); } catch { setMsg("Couldn't save on this device."); } } };
  const canPrint = !!(f.apr && m.price && f.address);
  const print = () => { if (!canPrint) return; setTimeout(() => window.print(), 50); };

  const inp = { border:`1px solid ${C.rule}`, borderRadius:6, padding:"8px 10px", fontFamily:F.body, fontSize:15, background:"#fff", width:"100%", boxSizing:"border-box" };
  const lb = (t, el, wide) => <label style={{ display:"flex", flexDirection:"column", gap:4, gridColumn: wide ? "1 / -1" : "auto", fontFamily:F.mono, fontSize:11, color:C.mid }}>{t}{el}</label>;
  const btn = { border:`1px solid ${C.rule}`, borderRadius:6, padding:"8px 14px", background:"#fff", fontFamily:F.cond, fontWeight:700, fontSize:15, cursor:"pointer" };
  const sec = (t) => <div style={{ gridColumn:"1 / -1", fontFamily:F.cond, fontWeight:800, fontSize:18, marginTop:8 }}>{t}</div>;
  const wide = typeof window !== "undefined" && window.innerWidth >= 1100;
  const scale = wide ? 0.62 : Math.min(1, (typeof window !== "undefined" ? window.innerWidth - 40 : 816) / 816);

  return (
    <div>
      <style>{`@page { size: letter; margin: 0 } @media print { html, body { height: 1056px !important; overflow: hidden !important; margin: 0 !important } body * { visibility: hidden !important } #gup-flyer, #gup-flyer * { visibility: visible !important } #gup-flyer-wrap { position: fixed !important; left: 0; top: 0; transform: none !important; } #gup-flyer { -webkit-print-color-adjust: exact; print-color-adjust: exact } }`}</style>
      <div style={{ display:"flex", gap:24, alignItems:"flex-start", flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 360px", minWidth:0, display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:10 }}>
          {saved.length > 0 && lb("Recent flyers", <select value="" onChange={(e) => { const s = saved.find((x) => x.id === e.target.value); if (s) setF({ ...BLANK, ...s }); }} style={inp}><option value="">Open a saved flyer…</option>{saved.map((s) => <option key={s.id} value={s.id}>{s.address || "Untitled"} · {s.agentName}</option>)}</select>, true)}
          {sec("Agent")}
          {lb("Pick an agent partner", <select value={f.agentId || ""} onChange={(e) => pickAgent(e.target.value)} style={inp}><option value="">Choose…</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}{a.area ? ` · ${a.area}` : ""}</option>)}</select>, true)}
          {lb("Name", <input value={f.agentName} onChange={set("agentName")} style={inp}/>)}
          {lb("Brokerage", <input value={f.brokerage} onChange={set("brokerage")} style={inp}/>)}
          {lb("Phone", <input value={f.agentPhone} onChange={set("agentPhone")} style={inp}/>)}
          {lb("Email", <input value={f.agentEmail} onChange={set("agentEmail")} style={inp}/>)}
          {lb("Agent headshot (saved for next time)", <input type="file" accept="image/*" onChange={upload("agentPhoto", 600)} style={inp}/>, true)}
          {sec("Listing")}
          {lb("Street address", <input value={f.address} onChange={set("address")} placeholder="5701 E Melody Way" style={inp}/>)}
          {lb("City, State", <input value={f.city} onChange={set("city")} placeholder="Castle Rock, Colorado" style={inp}/>)}
          {lb("Price", <input value={f.price} onChange={set("price")} inputMode="numeric" placeholder="530000" style={inp}/>)}
          {lb("Open house (date and time)", <input value={f.openHouse} onChange={set("openHouse")} placeholder="Sunday, Nov 15 · 12–3 PM" style={inp}/>)}
          {lb("Beds", <input value={f.beds} onChange={set("beds")} style={inp}/>)}
          {lb("Baths", <input value={f.baths} onChange={set("baths")} style={inp}/>)}
          {lb("Sq ft", <input value={f.sqft} onChange={set("sqft")} placeholder="2,150" style={inp}/>)}
          {lb("4th stat (optional)", <div style={{ display:"flex", gap:6 }}><input value={f.extraValue} onChange={set("extraValue")} placeholder="$10K" style={inp}/><input value={f.extraLabel} onChange={set("extraLabel")} placeholder="Seller Credit" style={inp}/></div>)}
          {lb("Listing photo (use the original file for sharp prints)", <input type="file" accept="image/*" onChange={upload("photo", 2000)} style={inp}/>, true)}
          {sec("Financing")}
          {lb("Note rate %", <input value={f.rate} onChange={set("rate")} inputMode="decimal" style={inp}/>)}
          {lb("Buydown", <select value={f.buydown} onChange={set("buydown")} style={inp}><option value="2/1">2/1</option><option value="1/0">1/0</option><option value="none">None</option></select>)}
          {lb("Seller credit $ (optional)", <input value={f.credit} onChange={set("credit")} inputMode="numeric" placeholder="10000" style={inp}/>)}
          {lb("APR % (required to print)", <input value={f.apr} onChange={set("apr")} inputMode="decimal" style={{ ...inp, borderColor: f.apr ? C.rule : C.red }}/>)}
          {lb("APR based on (points/fees)", <input value={f.fees} onChange={set("fees")} placeholder="0 points, $1,995 lender fee" style={inp}/>)}
          {lb("Credit score assumed", <input value={f.score} onChange={set("score")} placeholder="740" style={inp}/>)}
          {lb("Rates as of", <input value={f.asOf} onChange={set("asOf")} placeholder={localDate()} style={inp}/>)}
          {lb("Accent", <select value={f.accent} onChange={set("accent")} style={inp}>{ACCENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>)}
          {lb(`Headline (blank = "${defaultHeadline(f, m)}")`, <input value={f.headline} onChange={set("headline")} style={inp}/>, true)}
          {f.buydown !== "none" && m.price > 0 && <div style={{ gridColumn:"1 / -1", fontFamily:F.mono, fontSize:12, color: m.credit && m.credit >= m.costHi ? C.green : C.mid, background:"#fff", border:`1px solid ${C.rule}`, borderRadius:6, padding:"8px 10px" }}>
            Buydown cost: {usd(m.costLo)} (20% down) to {usd(m.costHi)} (3% down).{m.credit ? (m.credit >= m.costHi ? " The seller credit covers it at every down payment." : ` The seller credit covers it at ${m.rows.filter((r) => m.credit >= r.cost).map((r) => r.d + "%").join(", ") || "no"} down; short ${usd(m.costHi - m.credit)} at 3% down.`) : " Ask the listing agent whether the seller will pay it."}
          </div>}
          <div style={{ gridColumn:"1 / -1", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginTop:6 }}>
            <button onClick={print} disabled={!canPrint} style={{ ...btn, background: canPrint ? C.green : "#ddd", color: canPrint ? "#fff" : C.mid, borderColor: canPrint ? C.green : "#ddd" }}>Print / Save as PDF</button>
            <button onClick={save} style={btn}>Save flyer</button>
            <button onClick={() => setF(BLANK)} style={btn}>New</button>
            {!canPrint && <span style={{ fontFamily:F.mono, fontSize:11, color:C.red }}>Needs address, price and APR to print.</span>}
            {msg && <span style={{ fontFamily:F.mono, fontSize:11, color:C.green }}>{msg}</span>}
          </div>
          <div style={{ gridColumn:"1 / -1", fontFamily:F.mono, fontSize:11, color:C.light }}>In the print dialog choose Letter, margins None, and turn on Background graphics. Co-marketing: split the print or ad cost with the agent (RESPA).</div>
        </div>
        <div style={{ flex:"0 0 auto", width: 816 * scale, height: 1056 * scale, overflow:"hidden", border:`1px solid ${C.rule}`, borderRadius:4 }}>
          <div id="gup-flyer-wrap" style={{ transform:`scale(${scale})`, transformOrigin:"top left", width:816, height:1056 }}><Flyer f={f} m={m}/></div>
        </div>
      </div>
    </div>
  );
}
