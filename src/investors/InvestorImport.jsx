import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";
import { today } from "../radar/engine.js";
import { ANGLES, angleFromName } from "../radar/investorPlaybook.js";
import HowTo from "../HowTo.jsx";
import { leadFieldsFromDetail, detailScore, openLoans, isArm, isSaleListed, listingOf } from "./psDetail.js";
import { GUIDES } from "../howto/guides.jsx";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", greenBg:"#e8f4ee", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020", redBg:"#fbeae7", purple:"#5b3fa6", purpleBg:"#eeebf8", blue:"#1d4f91" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"7px 9px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box" };
const TYPES = { maturing_hard_money:["Hard money due", C.red, C.redBg], dead_money:["Dead money", C.green, C.greenBg], portfolio_review:["Portfolio review", C.purple, C.purpleBg],
  ...Object.fromEntries(ANGLES.slice(2).map(([k, l]) => [k, [l, C.blue, "#eef3fb"]])) };
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
  est_maturity:["loan due date","maturity date","due date","loan maturity date"],
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
  if (l.lead_type === "maturing_hard_money") {
    s += 50;
    const given = l.est_maturity_given ?? !!(l.ps_detail && l.est_maturity);   // PropStream detail due dates are real
    const due = given ? -monthsSince(l.est_maturity) : null;   // months until the real due date
    if (due != null) s += due <= 0 ? 45 : due <= 6 ? 40 : due <= 12 ? 25 : due <= 36 ? 5 : -60;   // 3+ years out = already in long-term financing
    else { const m = monthsSince(l.recording_date); if (m != null) s += m >= 9 && m <= 15 ? 40 : m > 15 ? 30 : m >= 6 ? 15 : 0; }
  }
  const eq = l.est_equity ?? (l.est_value != null && l.loan_balance != null ? l.est_value - l.loan_balance : null);
  if (eq != null) s += eq >= 500000 ? 30 : eq >= 250000 ? 22 : eq >= 100000 ? 14 : eq > 0 ? 5 : 0;
  if (l.properties_owned) s += l.properties_owned >= 10 ? 20 : l.properties_owned >= 5 ? 15 : l.properties_owned >= 2 ? 10 : 0;
  if (l.company && /llc|inc|trust|holdings|properties|investments/i.test(l.company)) s += 5;
  if (l.phone) s += 10; else s -= 20;
  return s + detailScore(l.ps_detail);
}

// Investor lead import, shown in Contacts → Investor Leads. PropStream CSV or detail JSON → investor_leads (full record kept)
// → Contacts in the Investor Leads category. Skips properties listed for sale, confidential owners and DNC numbers.
// Callable investors show up on Calls → Investors automatically.
export default function InvestorImport({ userId, contacts, setContacts, onLinksChanged }) {
  const [leads, setLeads] = useState([]); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [imp, setImp] = useState(null);   // { rows, headers, map, lead_type, batch, json }

  const load = useCallback(async () => {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase.from("investor_leads").select("*").order("score", { ascending:false }).range(from, from + 999);
      all.push(...(data || [])); if (!data || data.length < 1000) break;
    }
    setLeads(all); return all;
  }, []);
  useEffect(() => { if (userId) load(); }, [userId, load]);

  // ---------- import ----------
  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    const text = await file.text();
    if (/\.json$/i.test(file.name) || text.trim().startsWith("{")) {
      let j; try { j = JSON.parse(text); } catch { return setMsg("That JSON file couldn't be read."); }
      if (j.format !== "propstream-detail-v1" || !Array.isArray(j.leads)) return setMsg("That isn't a PropStream detail file.");
      return setImp({ json:true, rows:j.leads.map((r) => ({ ...r, pulled:j.pulled })), headers:[], map:{}, lead_type: angleFromName(file.name), batch:`${file.name} · ${today()}` });
    }
    const rows = parseCSV(text); if (rows.length < 2) return setMsg("That file has no rows.");
    const headers = rows[0].map(norm);
    const map = {};
    for (const [field, names] of Object.entries(MAP)) { const i = headers.findIndex((h) => names.includes(h)); if (i >= 0) map[field] = i; }
    setImp({ rows:rows.slice(1), headers:rows[0], map, lead_type: angleFromName(file.name), batch:`${file.name} · ${today()}` });
  };
  // Full PropStream detail: update the leads already here (matched by PropStream id or address), add the rest.
  const runDetailImport = async () => {
    setBusy(true); setMsg("");
    const byId = new Map(leads.filter((l) => l.ps_property_id).map((l) => [String(l.ps_property_id), l]));
    const byAddr = new Map(leads.filter((l) => l.property_address).map((l) => [norm(l.property_address) + "|" + String(l.property_zip || "").slice(0, 5), l]));
    const out = [], updates = [];
    for (const rec of imp.rows) {
      const f = leadFieldsFromDetail(rec);
      if (/confidential/i.test(`${f.last_name || ""} ${f.company || ""} ${rec.detail?.owner1FullName || ""}`)) continue;   // protected owner records stay out
      const old = byId.get(String(f.ps_property_id)) || byAddr.get(norm(f.property_address) + "|" + String(f.property_zip || "").slice(0, 5));
      if (old) {
        // Detail wins for property, loan and mailing data. Keep names, phones and emails already on the lead; fill them only if blank.
        const patch = { ...f };
        for (const k of ["first_name","last_name","company","phone","phone_2","email"]) if (old[k]) delete patch[k];
        for (const k of Object.keys(patch)) if (patch[k] == null) delete patch[k];
        patch.score = scoreLead({ ...old, ...patch });
        updates.push([old.id, patch]);
      } else {
        const l = { user_id:userId, lead_type:imp.lead_type, source:"propstream", import_batch:imp.batch, ...f };
        l.score = scoreLead(l); out.push(l);
      }
    }
    for (let i = 0; i < out.length; i += 200) {
      const { error } = await supabase.from("investor_leads").insert(out.slice(i, i + 200));
      if (error) { setBusy(false); return setMsg("Import stopped: " + error.message); }
    }
    for (const [id, patch] of updates) {
      const { error } = await supabase.from("investor_leads").update(patch).eq("id", id);
      if (error) { setBusy(false); return setMsg("Import stopped: " + error.message); }
    }
    setImp(null); const fresh = await load();
    const n = await toContacts(fresh.filter(contactable));
    const fresh2 = await load(); await addListingAgents(fresh2.filter((l) => l.contact_id && FAILED.test(l.ps_detail?.detail?.mlsListingStatus || "") && agentOf(l) && !(agentLinked || new Set()).has(l.contact_id)));
    setMsg(`Loan and owner details added to ${updates.length} leads you had.${out.length ? ` ${out.length} new.` : ""} ${n} added to Contacts → Investor Leads.`);
  };

  const runImport = async () => {
    if (imp.json) return runDetailImport();
    setBusy(true); setMsg("");
    const seen = new Set(leads.flatMap((l) => [digits(l.phone), (l.email || "").toLowerCase(), norm(l.property_address)]).filter(Boolean));
    const cSeen = new Set(contacts.flatMap((c) => [digits(c.phone), digits(c.phone_2), (c.email || "").toLowerCase()]).filter(Boolean));
    const out = [], updates = []; let dup = 0, known = 0;
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
      if (/confidential/i.test(`${l.last_name || ""} ${l.company || ""}`)) continue;   // protected owner records stay out
      const dueGiven = dateOf(g("est_maturity"));
      if (dueGiven) l.est_maturity = dueGiven;
      else if (l.recording_date && imp.lead_type === "maturing_hard_money") { const d = new Date(l.recording_date); d.setMonth(d.getMonth() + 12); l.est_maturity = d.toISOString().slice(0, 10); }
      const keys = [digits(l.phone), l.email, norm(l.property_address)].filter(Boolean);
      if (keys.some((k) => seen.has(k))) {
        // Same property already here: fill in what this file adds (lender, dates, equity) and re-score.
        const old = leads.find((o) => l.property_address && norm(o.property_address) === norm(l.property_address));
        if (old) {
          const patch = {}; for (const f of ["lender","loan_amount","recording_date","est_maturity","est_value","est_equity","loan_balance","properties_owned","email","phone_2"]) if (l[f] != null && l[f] !== old[f]) patch[f] = l[f];
          if (Object.keys(patch).length) { patch.score = scoreLead({ ...old, ...patch, est_maturity_given: !!dueGiven }); updates.push([old.id, patch]); }
        } else dup++;
        continue;
      }
      if ([digits(l.phone), l.email].filter(Boolean).some((k) => cSeen.has(k))) known++;
      keys.forEach((k) => seen.add(k));
      l.score = scoreLead({ ...l, est_maturity_given: !!dueGiven }); out.push(l);
    }
    for (let i = 0; i < out.length; i += 500) {
      const { error } = await supabase.from("investor_leads").insert(out.slice(i, i + 500));
      if (error) { setBusy(false); return setMsg("Import stopped: " + error.message); }
    }
    for (const [id, patch] of updates) await supabase.from("investor_leads").update(patch).eq("id", id);
    setImp(null); const fresh = await load();
    const nc = await toContacts(fresh.filter(contactable));
    setMsg(`Imported ${out.length} leads, ${nc} added to Contacts → Investor Leads.${updates.length ? ` Updated ${updates.length} you already had.` : ""}${dup ? ` Skipped ${dup} duplicates.` : ""}${known ? ` ${known} are already in your Contacts.` : ""}`);
  };

  // ---------- add to Contacts (own category "Investor leads"; no forced follow-up, so they don't jump onto Calls) ----------
  // Skip only properties listed FOR SALE (active/pending/under contract). Units listed for rent = owner is holding: keep.
  const contactable = (l) => !l.contact_id && l.status !== "dead" && !isSaleListed(l.ps_detail?.detail);
  const contactRow = (l, followUp) => {
    const t = TYPES[l.lead_type]?.[0] || "Investor";
    const note = [`${today()}: Investor lead · ${t}`, l.property_address && `${l.property_address}, ${l.property_city || ""} ${l.property_state || ""}`,
      l.lender && `lender ${l.lender}`, l.recording_date && `recorded ${l.recording_date}`, l.est_maturity && `due ${l.est_maturity}`,
      l.est_equity != null && `equity ${k$(l.est_equity)}`, l.ps_detail?.detail?.mlsListingStatus && `MLS ${l.ps_detail.detail.mlsListingStatus.toLowerCase()}`,
      l.properties_owned && `${l.properties_owned} properties`, l.company && `owner ${l.company}`].filter(Boolean).join(" · ");
    return { user_id:userId, first_name:l.first_name || null, last_name:l.last_name, phone:l.phone, phone_2:l.phone_2, email:l.email,
      address:l.mailing_address, city:l.mailing_city, state:l.mailing_state, zip:l.mailing_zip, property_address:l.property_address, property_city:l.property_city,
      property_state:l.property_state, property_zip:l.property_zip, company:l.company, contact_type:"lead", subtype:"investor lead", follow_up_date:followUp,
      contact_note:note, tags:["investor lead", l.lead_type], source_category:"investor leads", source_file:l.import_batch || l.source, external_id:"inv-" + l.id, do_not_contact:false };
  };
  const toContacts = async (list) => {
    setBusy(true); let n = 0;   // returns how many were added
    for (const l of list) {
      const { data, error } = await supabase.from("contacts").insert(contactRow(l, null)).select().single();
      if (error) { setMsg("Couldn't add " + (l.first_name || l.company) + ": " + error.message); continue; }
      await supabase.from("investor_leads").update({ contact_id:data.id }).eq("id", l.id);
      setContacts((p) => [...p, data]); n++;
    }
    setBusy(false); return n;
  };

  // ---------- listing agents on failed listings → their own Agent contacts, linked to the investor contact ----------
  const [agentLinked, setAgentLinked] = useState(null);   // Set of investor contact ids that already have a linked listing agent
  const loadAgentLinks = useCallback(async () => {
    const { data } = await supabase.from("contact_links").select("linked_id").in("relation", ["listing agent", "leasing agent"]);
    setAgentLinked(new Set((data || []).map((x) => x.linked_id)));
  }, []);
  useEffect(() => { if (userId) loadAgentLinks(); }, [userId, loadAgentLinks]);
  const agentOf = (l) => { const d = l.ps_detail?.detail || {}, m = d.mlsListing || {};
    const name = (m.agentName || d.mlsAgentName || "").trim(); if (!name) return null;
    return { name, email:(m.agentEmail || d.mlsAgentEmail || "").trim().toLowerCase() || null, phone:fmtPhone(m.agentPhone || d.mlsAgentPhone) || null, office:m.officeName || d.mlsOfficeName || null }; };
  const FAILED = /^(FAIL|EXPIRED|WITHDRAWN|CANCELLED|CANCELED)$/i;
  const needsAgent = (l) => l.contact_id && FAILED.test(l.ps_detail?.detail?.mlsListingStatus || "") && agentOf(l) && agentLinked && !agentLinked.has(l.contact_id);
  const addListingAgents = async (list) => {
    setBusy(true); let made = 0, linked = 0; const known = [...contacts];
    for (const l of list) {
      const a = agentOf(l); if (!a) continue;
      const leasing = !!listingOf(l.ps_detail?.detail)?.rental; const role = leasing ? "leasing agent" : "listing agent";
      const addr = [l.property_address, l.property_city].filter(Boolean).join(", ");
      const owner = l.company || [l.first_name, l.last_name].filter(Boolean).join(" ");
      const line = `${today()}: ${leasing ? "LEASING agent (unit for rent)" : "Listing agent"} · ${addr} (listing ${/^FAIL$/i.test(l.ps_detail.detail.mlsListingStatus) ? "failed" : String(l.ps_detail.detail.mlsListingStatus).toLowerCase()}) · owner ${owner}`;
      let agent = known.find((c) => (a.email && [c.email, c.email_2].includes(a.email)) || (a.phone && [c.phone, c.phone_2].some((p) => digits(p) === digits(a.phone))));
      if (agent) {
        const { data } = await supabase.from("contacts").update({ tags:[...new Set([...(agent.tags || []), role])], contact_note:[agent.contact_note, line].filter(Boolean).join("\n") }).eq("id", agent.id).select().single();
        if (data) { agent = data; setContacts((p) => p.map((x) => (x.id === data.id ? data : x))); }
      } else {
        const parts = a.name.split(/\s+/); const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        const { data, error } = await supabase.from("contacts").insert({ user_id:userId, first_name:cap(parts[0]), last_name:parts.slice(1).map(cap).join(" ") || null, email:a.email, phone:a.phone,
          company:a.office, contact_type:"agent", subtype:role, agent_role: leasing ? null : "seller", tags:[role], contact_note:line, source_category:"investor leads",
          source_file:"PropStream listing agent", external_id:"lagent-" + (a.email || digits(a.phone) || a.name.toLowerCase().replace(/\W+/g, "-")), do_not_contact:false }).select().single();
        if (error) { setMsg("Couldn't add agent " + a.name + ": " + error.message); continue; }
        agent = data; known.push(data); setContacts((p) => [...p, data]); made++;
      }
      const { error } = await supabase.from("contact_links").insert({ user_id:userId, contact_id:agent.id, linked_id:l.contact_id, relation:role });
      if (!error || /duplicate/i.test(error.message)) linked++;
    }
    setBusy(false); loadAgentLinks(); onLinksChanged?.(); return { made, linked };
  };

  const waiting = leads.filter(contactable);
  const agentsWaiting = leads.filter(needsAgent);
  return (
    <div style={{marginBottom:14}}>
      <HowTo id="pull-leads" {...GUIDES.pullLeads} defaultOpen={false}/>
      <HowTo id="lead-score" {...GUIDES.leadScore} defaultOpen={false}/>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8}}>
        <a href="https://app.propstream.com/" target="_blank" rel="noreferrer" style={{...btn, display:"inline-block", textDecoration:"none"}}>Open PropStream</a>
        <label style={{...btnG, display:"inline-block"}}>Import PropStream file<input type="file" accept=".csv,text/csv,.json,application/json" onChange={onFile} style={{display:"none"}}/></label>
        {agentsWaiting.length > 0 && <button disabled={busy} onClick={async () => { const r = await addListingAgents(agentsWaiting); setMsg(`${r.made} listing agents added to Contacts, ${r.linked} linked to their property's owner.`); }} style={btn}>Add {agentsWaiting.length} listing agents</button>}
        {waiting.length > 0 && <button disabled={busy} onClick={async () => { const n = await toContacts(waiting); load(); setMsg(`${n} added to Contacts → Investor Leads.`); }} style={btn}>Add {waiting.length} waiting to Contacts</button>}
        <span style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>Portfolio Review link: {ORIGIN}/review</span>
        <button onClick={() => navigator.clipboard?.writeText(`${ORIGIN}/review`)} style={{...btn, padding:"3px 10px", fontSize:12}}>Copy</button>
      </div>
      {msg && <div style={{fontFamily:F.mono, fontSize:12, color: /fail|stopped|Couldn't/.test(msg) ? C.red : C.green, marginBottom:10}}>{msg}</div>}
      {imp && (
        <div style={{...card, padding:"14px 16px", marginBottom:14}}>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:18}}>Import {imp.rows.length} {imp.json ? "PropStream detail records" : "rows"}</div>
          <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, margin:"4px 0 10px"}}>{imp.json ? "Adds every open loan, owner and mailing data to leads you already have (matched by address). New properties come in as new leads; DNC numbers are left off."
            : <>Matched columns: {Object.keys(imp.map).join(", ") || "none"}.{!("phone" in imp.map) && " No phone column found: run skip tracing in PropStream first, or these won't be callable."}</>}</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
            <span style={{fontFamily:F.mono, fontSize:12}}>These are:</span>
            {ANGLES.map(([k, l]) => <button key={k} onClick={() => setImp({ ...imp, lead_type:k })} style={imp.lead_type === k ? btnG : btn}>{l}</button>)}
            <button disabled={busy} onClick={runImport} style={{...btnG, marginLeft:"auto"}}>{busy ? "Importing..." : "Import"}</button>
            <button onClick={() => setImp(null)} style={btn}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}

// ---------- Property & loans (from the PropStream detail record) ----------
const pct = (r) => (r == null ? "" : (r * 100).toFixed(2).replace(/\.?0+$/, "") + "%");
const usd = (n) => (n == null ? "" : "$" + Math.round(n).toLocaleString());
export function PsDetail({ ps }) {
  const d = ps.detail || {}, loans = openLoans(d), ml = d.mlsListing || {};
  const head = { fontFamily:F.mono, fontSize:10, color:C.light, marginTop:8 };
  const owners = [d.owner1FullName, d.owner2FullName].filter(Boolean).join(" & ");
  const linked = d.linkedPropertyTotal ?? (d.linkedProperties || []).length;
  return (
    <div style={{color:C.ink}}>
      <div style={head}>OWNER</div>
      <div>{owners}{d.ownerType && ` · ${d.ownerType.toLowerCase()}`}{d.ownerOccupancy && ` · ${d.ownerOccupancy.toLowerCase()}`}{d.propertiesOwned ? ` · owns ${d.propertiesOwned}` : ""}{linked > 1 ? ` · ${linked} properties at this mailing address` : ""}</div>
      <div style={head}>OPEN LOANS ({loans.length})</div>
      {loans.length === 0 && <div>None on record (free and clear).</div>}
      {loans.map((x, i) => (
        <div key={i} style={{marginBottom:4}}>
          <b>{x.lender || "Unknown lender"}</b> · {usd(x.amount)}{x.rate ? ` at ${pct(x.rate)}` : ""}{isArm(x) ? <span style={{color:C.amber}}> · ARM</span> : x.financing ? ` · ${x.financing}` : ""}
          <div style={{fontSize:12, color:C.mid}}>{[x.loanType, x.detail, x.recorded && `recorded ${x.recorded}`, x.due && `due ${x.due}`, x.termMonths && `${x.termMonths} mo term`,
            x.balance != null && `est. balance ${usd(x.balance)}`, x.payment != null && `est. payment ${usd(x.payment)}/mo`].filter(Boolean).join(" · ")}</div>
        </div>))}
      <div style={head}>VALUE</div>
      <div>{[d.estimatedValue != null && `value ${usd(d.estimatedValue)}`, d.estimatedEquity != null && `equity ${usd(d.estimatedEquity)}`, d.ltvRatio != null && `LTV ${Math.round(d.ltvRatio)}%`,
        d.lastSaleAmount && `last sale ${usd(d.lastSaleAmount)}${d.lastSaleDate ? " on " + (typeof d.lastSaleDate === "number" ? new Date(d.lastSaleDate).toLocaleDateString() : d.lastSaleDate) : ""}`,
        d.residentialUnits > 1 && `${d.residentialUnits} units`].filter(Boolean).join(" · ")}</div>
      {(d.mlsListingStatus || (d.foreclosureStatus && d.foreclosureStatus !== "NONE")) && <>
        <div style={head}>LISTING / DISTRESS</div>
        <div>{[d.mlsListingStatus && `MLS ${d.mlsListingStatus.toLowerCase()}${ml.amount ? " at " + usd(ml.amount) : ""}`, d.foreclosureStatus && d.foreclosureStatus !== "NONE" && <span key="f" style={{color:C.red}}>{d.foreclosureStatus.replace("_", "-").toLowerCase()}</span>]
          .filter(Boolean).reduce((a, x, i) => [...a, i ? " · " : "", x], [])}</div>
        {(ml.agentName || d.mlsAgentName) && <div style={{fontSize:12, color:C.mid}}>Listing agent: {[ml.agentName || d.mlsAgentName, ml.officeName || d.mlsOfficeName, ml.agentPhone || d.mlsAgentPhone, ml.agentEmail || d.mlsAgentEmail].filter(Boolean).join(" · ")}</div>}
      </>}
    </div>
  );
}
