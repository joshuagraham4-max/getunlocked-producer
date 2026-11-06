// Investor Leads (bolt-on): PropStream imports + Portfolio Review funnel leads. Score, review, and send the best
// to the call list (they become leads in Contacts with a follow-up due today, so they show up on Calls).
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase.js";
import { today } from "../radar/engine.js";
import { ANGLES, angleFromName } from "../radar/investorPlaybook.js";
import HowTo from "../HowTo.jsx";
import { GUIDES } from "../howto/guides.jsx";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", greenBg:"#e8f4ee", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020", redBg:"#fbeae7", purple:"#5b3fa6", purpleBg:"#eeebf8", blue:"#1d4f91" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"7px 9px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box" };
const TYPES = { maturing_hard_money:["Hard money due", C.red, C.redBg], dead_money:["Dead money", C.green, C.greenBg], portfolio_review:["Portfolio review", C.purple, C.purpleBg],
  ...Object.fromEntries(ANGLES.slice(2).map(([k, l]) => [k, [l, C.blue, "#eef3fb"]])) };
const STATUS = ["new","queued","talked","booked","dead"];
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

// ---------- CSV ----------
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim()));
}
// PropStream (and similar list tools) header names → our fields. First match wins.
const MAP = {
  first_name:["owner 1 first name","owner first name","first name","firstname"],
  last_name:["owner 1 last name","owner last name","last name","lastname"],
  company:["owner 1 full name","owner name","owner","company","llc"],
  phone:["phone 1","mobile 1","cell 1","wireless 1","phone","mobile","cell","phone number"],
  phone_2:["phone 2","mobile 2","cell 2","landline 1"],
  email:["email 1","email","email address"],
  mailing_address:["mailing address","mail address"], mailing_city:["mailing city","mail city"], mailing_state:["mailing state","mail state"], mailing_zip:["mailing zip","mail zip","mailing zip code"],
  property_address:["property address","address","situs address","street address"], property_city:["property city","city"], property_state:["property state","state"], property_zip:["property zip","zip","zip code"],
  county:["county"], property_type:["property type","land use"], units:["units","number of units","# of units"],
  properties_owned:["properties owned","total properties owned","owned properties","# of properties"],
  est_value:["est. value","estimated value","avm","est value","market value"],
  est_equity:["est. equity","estimated equity","equity","est equity"],
  loan_balance:["est. remaining balance of open loans","open mortgage balance","total loan balance","loan balance","est. loan balance","mortgage balance"],
  lender:["lender name","lender","mortgage lender","1st mortgage lender","lender 1"],
  loan_amount:["loan amount","mortgage amount","1st mortgage amount","original loan amount"],
  recording_date:["recording date","mortgage recording date","loan recording date","1st mortgage recording date","last sale recording date"],
};
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9#. ]/g, " ").replace(/\s+/g, " ").trim();
const money = (v) => { const n = parseFloat(String(v || "").replace(/[^0-9.-]/g, "")); return isFinite(n) ? n : null; };
const dateOf = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString().slice(0, 10); };
const digits = (s) => String(s || "").replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
const fmtPhone = (s) => { const d = digits(s); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : (s || null); };
const monthsSince = (d) => { if (!d) return null; const a = new Date(d), b = new Date(); return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); };
const k$ = (n) => (n == null ? "" : "$" + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + "M" : Math.round(n / 1000) + "K"));

// Lenders known for short-term investor loans. A match means a real hard money note, not a guess from loan type.
const HARD_MONEY = /kiavi|lima one|limaone|rcn capital|corevest|lendingone|lending one|visio|easy street|anchor loans|roc capital|genesis capital|civic|groundfloor|fund that flip|patch of land|new silver|renovo|temple view|park place|builders capital|sherman bridge|bridge|private|capital fund|asset based|hard money|investor loan|fix.?flip|rehab|tidal|dominion|bayport|express capital/i;
export const isHardMoneyLender = (name) => !!name && HARD_MONEY.test(name);

export function scoreLead(l) {
  let s = 0;
  if (l.lead_type === "maturing_hard_money" && isHardMoneyLender(l.lender)) s += 35;
  if (l.lead_type === "maturing_hard_money" && l.lender && /bank|credit union|mortgage|home loans|federal|wells|chase|rocket|freedom|pennymac|lakeview/i.test(l.lender) && !isHardMoneyLender(l.lender)) s -= 25;
  if (l.lead_type === "maturing_hard_money") { const m = monthsSince(l.recording_date); s += 50; if (m != null) s += m >= 9 && m <= 15 ? 40 : m > 15 ? 30 : m >= 6 ? 15 : 0; }
  const eq = l.est_equity ?? (l.est_value != null && l.loan_balance != null ? l.est_value - l.loan_balance : null);
  if (eq != null) s += eq >= 500000 ? 30 : eq >= 250000 ? 22 : eq >= 100000 ? 14 : eq > 0 ? 5 : 0;
  if (l.properties_owned) s += l.properties_owned >= 10 ? 20 : l.properties_owned >= 5 ? 15 : l.properties_owned >= 2 ? 10 : 0;
  if (l.company && /llc|inc|trust|holdings|properties|investments/i.test(l.company)) s += 5;
  if (l.phone) s += 10; else s -= 20;
  return s;
}

export default function InvestorLeads({ userId, contacts, setContacts }) {
  const [leads, setLeads] = useState([]); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [type, setType] = useState("all"); const [status, setStatus] = useState("open"); const [q, setQ] = useState("");
  const [imp, setImp] = useState(null);   // { rows, headers, map, lead_type, batch }
  const [sel, setSel] = useState(null);

  const load = useCallback(async () => {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase.from("investor_leads").select("*").order("score", { ascending:false }).range(from, from + 999);
      all.push(...(data || [])); if (!data || data.length < 1000) break;
    }
    setLeads(all);
  }, []);
  useEffect(() => { if (userId) load(); }, [userId, load]);

  const shown = useMemo(() => leads.filter((l) => (type === "all" || l.lead_type === type)
    && (status === "all" || (status === "open" ? ["new","queued"].includes(l.status) : l.status === status))
    && (!q || [l.first_name, l.last_name, l.company, l.property_address, l.property_city, l.lender, l.phone].join(" ").toLowerCase().includes(q.toLowerCase()))), [leads, type, status, q]);
  const counts = useMemo(() => Object.fromEntries(Object.keys(TYPES).map((k) => [k, leads.filter((l) => l.lead_type === k && ["new","queued"].includes(l.status)).length])), [leads]);

  // ---------- import ----------
  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    const rows = parseCSV(await file.text()); if (rows.length < 2) return setMsg("That file has no rows.");
    const headers = rows[0].map(norm);
    const map = {};
    for (const [field, names] of Object.entries(MAP)) { const i = headers.findIndex((h) => names.includes(h)); if (i >= 0) map[field] = i; }
    setImp({ rows:rows.slice(1), headers:rows[0], map, lead_type: angleFromName(file.name), batch:`${file.name} · ${today()}` });
  };
  const runImport = async () => {
    setBusy(true); setMsg("");
    const seen = new Set(leads.flatMap((l) => [digits(l.phone), (l.email || "").toLowerCase(), norm(l.property_address)]).filter(Boolean));
    const cSeen = new Set(contacts.flatMap((c) => [digits(c.phone), digits(c.phone_2), (c.email || "").toLowerCase()]).filter(Boolean));
    const out = []; let dup = 0, known = 0;
    for (const r of imp.rows) {
      const g = (f) => (imp.map[f] != null ? String(r[imp.map[f]] || "").trim() : "");
      const l = {
        user_id:userId, lead_type:imp.lead_type, source:"propstream", import_batch:imp.batch,
        first_name:g("first_name") || null, last_name:g("last_name") || null, company:g("company") || null,
        phone:fmtPhone(g("phone")), phone_2:fmtPhone(g("phone_2")), email:g("email").toLowerCase() || null,
        mailing_address:g("mailing_address") || null, mailing_city:g("mailing_city") || null, mailing_state:g("mailing_state") || null, mailing_zip:g("mailing_zip") || null,
        property_address:g("property_address") || null, property_city:g("property_city") || null, property_state:g("property_state") || null, property_zip:g("property_zip") || null,
        county:g("county") || null, property_type:g("property_type") || null, units:parseInt(g("units")) || null, properties_owned:parseInt(g("properties_owned")) || null,
        est_value:money(g("est_value")), est_equity:money(g("est_equity")), loan_balance:money(g("loan_balance")),
        lender:g("lender") || null, loan_amount:money(g("loan_amount")), recording_date:dateOf(g("recording_date")),
      };
      if (!l.first_name && !l.last_name && !l.company && !l.property_address) continue;
      if (l.recording_date && imp.lead_type === "maturing_hard_money") { const d = new Date(l.recording_date); d.setMonth(d.getMonth() + 12); l.est_maturity = d.toISOString().slice(0, 10); }
      const keys = [digits(l.phone), l.email, norm(l.property_address)].filter(Boolean);
      if (keys.some((k) => seen.has(k))) { dup++; continue; }
      if ([digits(l.phone), l.email].filter(Boolean).some((k) => cSeen.has(k))) known++;
      keys.forEach((k) => seen.add(k));
      l.score = scoreLead(l); out.push(l);
    }
    for (let i = 0; i < out.length; i += 500) {
      const { error } = await supabase.from("investor_leads").insert(out.slice(i, i + 500));
      if (error) { setBusy(false); return setMsg("Import stopped: " + error.message); }
    }
    setBusy(false); setImp(null); load();
    setMsg(`Imported ${out.length} leads.${dup ? ` Skipped ${dup} duplicates.` : ""}${known ? ` ${known} are already in your Contacts.` : ""}`);
  };

  // ---------- send to call list ----------
  const toCalls = async (list) => {
    setBusy(true); let n = 0;
    for (const l of list) {
      if (l.contact_id) { await supabase.from("contacts").update({ follow_up_date:today() }).eq("id", l.contact_id); await supabase.from("investor_leads").update({ status:"queued" }).eq("id", l.id); n++; continue; }
      const t = TYPES[l.lead_type]?.[0] || "Investor";
      const note = [`${today()}: Investor lead · ${t}`, l.property_address && `${l.property_address}, ${l.property_city || ""} ${l.property_state || ""}`,
        l.lender && `lender ${l.lender}`, l.recording_date && `recorded ${l.recording_date}`, l.est_maturity && `est. due ${l.est_maturity}`,
        l.est_equity != null && `equity ${k$(l.est_equity)}`, l.properties_owned && `${l.properties_owned} properties`, l.company && `owner ${l.company}`].filter(Boolean).join(" · ");
      const row = { user_id:userId, first_name:l.first_name || (l.company ? l.company : null), last_name:l.last_name, phone:l.phone, phone_2:l.phone_2, email:l.email,
        address:l.mailing_address, city:l.mailing_city, state:l.mailing_state, zip:l.mailing_zip, property_address:l.property_address, property_city:l.property_city,
        property_state:l.property_state, property_zip:l.property_zip, company:l.company, contact_type:"lead", subtype:"investor lead", follow_up_date:today(),
        contact_note:note, tags:["investor lead", l.lead_type], source_category:"investor leads", source_file:l.import_batch || l.source, external_id:"inv-" + l.id, do_not_contact:false };
      const { data, error } = await supabase.from("contacts").insert(row).select().single();
      if (error) { setMsg("Couldn't add " + (l.first_name || l.company) + ": " + error.message); continue; }
      await supabase.from("investor_leads").update({ status:"queued", contact_id:data.id }).eq("id", l.id);
      setContacts((p) => [...p, data]); n++;
    }
    setBusy(false); load(); setMsg(`${n} sent to today's call list. They're on the Customers list on Calls, ranked as new leads.`);
  };
  const setStat = async (l, s) => { await supabase.from("investor_leads").update({ status:s }).eq("id", l.id); load(); };

  const wide = typeof window !== "undefined" && window.innerWidth >= 900;
  return (
    <div>
      <HowTo id="pull-leads" {...GUIDES.pullLeads} defaultOpen={false}/>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12, marginBottom:14}}>
        {Object.entries(TYPES).filter(([k]) => k in counts && (counts[k] > 0 || ["maturing_hard_money","dead_money"].includes(k))).map(([k, [l, c, bg]]) => (
          <div key={k} onClick={() => setType(type === k ? "all" : k)} style={{...card, padding:"12px 16px", cursor:"pointer", borderColor: type === k ? c : C.rule, background: type === k ? bg : C.card}}>
            <div style={{fontFamily:F.cond, fontWeight:800, fontSize:30, color:c, lineHeight:1}}>{counts[k] || 0}</div>
            <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, marginTop:4}}>{l.toUpperCase()} · OPEN</div>
          </div>))}
        <div style={{...card, padding:"12px 16px"}}>
          <div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>PORTFOLIO REVIEW FUNNEL</div>
          <div style={{fontSize:13, wordBreak:"break-all", margin:"4px 0 6px"}}>{ORIGIN}/review</div>
          <button onClick={() => navigator.clipboard?.writeText(`${ORIGIN}/review`)} style={{...btn, padding:"3px 10px", fontSize:12}}>Copy link</button>
        </div>
      </div>

      <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:12}}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, address, lender" style={{...inp, flex:"1 1 220px"}}/>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inp}><option value="open">Open (new + queued)</option>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}<option value="all">All</option></select>
        <label style={{...btnG, display:"inline-block"}}>Import PropStream CSV<input type="file" accept=".csv,text/csv" onChange={onFile} style={{display:"none"}}/></label>
        <button disabled={busy} onClick={() => toCalls(shown.filter((l) => l.status === "new" && l.phone).slice(0, 10))} style={btn}>Send top 10 to calls</button>
      </div>
      {msg && <div style={{fontFamily:F.mono, fontSize:12, color: /fail|stopped|Couldn't/.test(msg) ? C.red : C.green, marginBottom:10}}>{msg}</div>}

      {imp && (
        <div style={{...card, padding:"14px 16px", marginBottom:14}}>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:18}}>Import {imp.rows.length} rows</div>
          <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, margin:"4px 0 10px"}}>Matched columns: {Object.keys(imp.map).join(", ") || "none"}.{!("phone" in imp.map) && " No phone column found: run skip tracing in PropStream first, or these won't be callable."}</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
            <span style={{fontFamily:F.mono, fontSize:12}}>These are:</span>
            {ANGLES.map(([k, l]) => <button key={k} onClick={() => setImp({ ...imp, lead_type:k })} style={imp.lead_type === k ? btnG : btn}>{l}</button>)}
            <button disabled={busy} onClick={runImport} style={{...btnG, marginLeft:"auto"}}>{busy ? "Importing..." : "Import"}</button>
            <button onClick={() => setImp(null)} style={btn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{...card, overflow:"hidden"}}>
        {shown.slice(0, 200).map((l) => { const t = TYPES[l.lead_type] || TYPES.dead_money; const eq = l.est_equity ?? (l.est_value != null && l.loan_balance != null ? l.est_value - l.loan_balance : null); return (
          <div key={l.id}>
            <div onClick={() => setSel(sel === l.id ? null : l.id)} style={{display:"grid", gridTemplateColumns: wide ? "52px 1.4fr 1.6fr 1fr 130px" : "44px 1fr auto", gap:10, alignItems:"center", padding:"10px 16px", borderTop:"1px solid #ece5d9", cursor:"pointer"}}>
              <div style={{fontFamily:F.cond, fontWeight:800, fontSize:20, color:t[1]}}>{l.score}</div>
              <div><div style={{fontFamily:F.cond, fontWeight:700, fontSize:16}}>{[l.first_name, l.last_name].filter(Boolean).join(" ") || l.company || "(no name)"}</div>
                <div style={{fontFamily:F.mono, fontSize:10, color:C.light}}><span style={{background:t[2], color:t[1], padding:"1px 6px", borderRadius:9, marginRight:6}}>{t[0].toUpperCase()}</span>{l.status.toUpperCase()}</div></div>
              {wide && <div style={{fontSize:13}}>{l.property_address ? `${l.property_address}, ${l.property_city || ""} ${l.property_state || ""}` : (l.answers?.working_on || "")}<div style={{fontSize:12, color:C.mid}}>{[l.lender && `lender ${l.lender}`, l.est_maturity && `due ~${l.est_maturity.slice(0, 7)}`, eq != null && `equity ${k$(eq)}`, l.properties_owned && `${l.properties_owned} props`, l.answers?.equity && `equity ${l.answers.equity}`].filter(Boolean).join(" · ")}</div></div>}
              {wide && <div style={{fontSize:13}}>{l.phone || <span style={{color:C.red, fontFamily:F.mono, fontSize:11}}>no phone</span>}</div>}
              <div onClick={(e) => e.stopPropagation()}>{l.status === "new" ? <button disabled={busy || !l.phone} onClick={() => toCalls([l])} style={{...btnG, padding:"5px 10px", fontSize:13, opacity:l.phone ? 1 : 0.4}}>To calls</button>
                : <select value={l.status} onChange={(e) => setStat(l, e.target.value)} style={{...inp, padding:"4px"}}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>}</div>
            </div>
            {sel === l.id && <div style={{padding:"4px 16px 14px 78px", fontSize:13, color:C.mid, lineHeight:1.6}}>
              {l.company && <div>Owner: {l.company}</div>}
              {l.mailing_address && <div>Mailing: {l.mailing_address}, {l.mailing_city} {l.mailing_state} {l.mailing_zip}</div>}
              {l.est_value != null && <div>Value {k$(l.est_value)} · balance {k$(l.loan_balance)} · equity {k$(eq)}</div>}
              {l.loan_amount != null && <div>Loan {k$(l.loan_amount)} recorded {l.recording_date}</div>}
              {l.answers && <div>Answers: {Object.entries(l.answers).filter(([, v]) => v !== null && v !== "").map(([k, v]) => `${k.replace("_", " ")}: ${v}`).join(" · ")}</div>}
              {l.scenario && <div>Scenario: "{l.scenario}"</div>}
              <div>{l.email} {l.phone_2 && `· alt ${l.phone_2}`} · source {l.source}</div>
            </div>}
          </div>); })}
        {shown.length === 0 && <div style={{padding:18, fontFamily:F.mono, fontSize:12, color:C.light}}>No investor leads yet. Import a PropStream export (skip-traced), or share the Portfolio Review link.</div>}
        {shown.length > 200 && <div style={{padding:12, fontFamily:F.mono, fontSize:11, color:C.light}}>Showing the top 200 of {shown.length} by score.</div>}
      </div>
    </div>
  );
}
