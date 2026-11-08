// Investor lead tools inside a Contact: call opener, playbook, follow-up email, voicemail/text, and the PropStream
// property & loan record. Works with or without a phone number.
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { scriptsFor } from "../radar/engine.js";
import { personFirst, sunbizUrl, isEntity } from "../radar/investorPlaybook.js";
import Playbook from "../calls/Playbook.jsx";
import { PsDetail } from "../investors/InvestorImport.jsx";
import { leadStory, listingOf } from "../investors/psDetail.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const box = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10, padding:"14px 16px", marginBottom:12 };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginBottom:4 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const text = { whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.5, color:C.ink, background:"#fff", border:`1px solid ${C.rule}`, borderRadius:7, padding:"10px 12px", margin:"4px 0 8px" };

export const isInvestorLead = (c) => (c.tags || []).includes("investor lead");

export default function InvestorPanel({ c, profileName, contacts, onOpen }) {
  const lead = useLead(c.id); const [copied, setCopied] = useState("");
  const s = scriptsFor({ ...c, property_address: c.property_address || lead?.property_address }, null, { key:"newlead" }, profileName || "Joshua Graham");
  const copy = (k, t) => { navigator.clipboard?.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); };
  return (
    <>
      <LeadStory c={c} lead={lead} contacts={contacts} onOpen={onOpen}/>
      <div style={box}>
        {(c.company || isEntity(c.first_name)) && (
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:10}}>
            <a href={sunbizUrl(c.company || c.first_name)} target="_blank" rel="noreferrer" style={btn}>Look up owner (Sunbiz)</a>
            <span style={{fontFamily:F.mono, fontSize:11, color: personFirst(c) ? C.mid : "#b05e0d"}}>{personFirst(c) ? `Greeting uses ${personFirst(c)}` : "No owner name yet: put the manager's name in First / Last name below"}</span>
          </div>)}
        <div style={lbl}>Call opener</div>
        <div style={text}>{s.say}</div>
        {s.playbook && <Playbook pb={s.playbook}/>}
        <div style={lbl}>Follow-up email</div>
        <div style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>Subject: {s.emailSubject}</div>
        <div style={text}>{s.emailBody}</div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:10}}>
          {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent(s.emailSubject)}&body=${encodeURIComponent(s.emailBody)}`} style={btnG}>Open email</a>}
          <button onClick={() => copy("email", s.emailBody)} style={btn}>{copied === "email" ? "Copied" : "Copy email"}</button>
          {!c.email && <span style={{fontFamily:F.mono, fontSize:11, color:C.light, alignSelf:"center"}}>No email on file</span>}
        </div>
        <div style={lbl}>Voicemail / text</div>
        <div style={text}>{s.vmText}</div>
        <button onClick={() => copy("vm", s.vmText)} style={btn}>{copied === "vm" ? "Copied" : "Copy text"}</button>
      </div>
      {lead?.ps_detail && <div style={box}><div style={lbl}>Property & loans (PropStream)</div><div style={{fontSize:13, lineHeight:1.6}}><PsDetail ps={lead.ps_detail}/></div></div>}
    </>
  );
}

// Listing agent contact: the "saw the listing fell through" email for each property they're linked to.
export const isListingAgent = (c) => (c.tags || []).some((t) => t === "listing agent" || t === "leasing agent");
export function ListingAgentPanel({ c, contacts, links }) {
  const [copied, setCopied] = useState("");
  const props = (links || []).filter((l) => ["listing agent", "leasing agent"].includes(l.relation) && l.contact_id === c.id)
    .map((l) => ({ o:contacts.find((x) => x.id === l.linked_id), leasing:l.relation === "leasing agent" })).filter((x) => x.o);
  const first = personFirst(c) || "there";
  return (
    <div style={box}>
      <div style={lbl}>{props.some((p) => p.leasing) ? "LEASING agent email" : "Listing agent email"}</div>
      {props.length === 0 && <div style={{fontFamily:F.mono, fontSize:11, color:C.light}}>No linked property yet.</div>}
      {props.map(({ o, leasing }) => {
        const addr = o.property_address || "the property";
        const { subject, body } = agentEmail(first, addr, leasing);
        return (
          <div key={o.id} style={{marginBottom:12}}>
            <div style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{leasing ? "LEASING · " : ""}{addr} · owner {o.company || [o.first_name, o.last_name].filter(Boolean).join(" ")}</div>
            <div style={text}>{body}</div>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} style={btnG}>Open email</a>}
              <button onClick={() => { navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`); setCopied(o.id); setTimeout(() => setCopied(""), 1500); }} style={btn}>{copied === o.id ? "Copied" : "Copy email"}</button>
            </div>
          </div>);
      })}
    </div>
  );
}

// The investor_leads row behind a contact (PropStream record).
export function useLead(contactId) {
  const [lead, setLead] = useState(null);
  useEffect(() => { let on = true; setLead(null); if (!contactId) return;
    supabase.from("investor_leads").select("ps_detail,lead_type,property_address,property_city,est_maturity,lender").eq("contact_id", contactId).maybeSingle()
      .then(({ data }) => { if (on) setLead(data || null); });
    return () => { on = false; }; }, [contactId]);
  return lead;
}

export const agentEmail = (agentFirst, addr, leasing) => leasing ? {
  subject: addr,
  body: `Hi ${agentFirst || "there"},\n\nSaw the unit at ${addr} came off the rental market. Is the owner keeping the building long term?\n\nI'm a local loan originator working with investors here in Sarasota and Manatee. I help owners who are holding rentals move out of short-term loans and into long-term rental financing. If the owner's in that spot, I'd love an introduction, and I'm glad to send leasing clients your way when I can.\n\nWorth a quick call?\n\nJoshua Graham\nAVP / Regional Loan Originator\nGraham Financial powered by Zero Point Mortgage Services\nNMLS 169809 | 720-468-6872`,
} : {
  subject: addr,
  body: `Hi ${agentFirst || "there"},\n\nSaw the listing on ${addr} fell through. What's up with the property? Is the owner still looking to sell, or would they consider holding it as a rental for now?\n\nI'm a local loan originator working with investors here in Sarasota and Manatee. When a flip doesn't sell, I help owners move out of the short-term loan into long-term rental financing, which takes the time pressure off. If your seller's in that spot, I'm glad to help, and you stay their agent on it either way.\n\nWorth a quick call?\n\nJoshua Graham\nAVP / Regional Loan Originator\nGraham Financial powered by Zero Point Mortgage Services\nNMLS 169809 | 720-468-6872`,
};

// "What happened" + why + watch, and the listing/leasing agent one tap away. Used on the Calls card and the contact.
export function LeadStory({ c, lead, contacts, onOpen, compact }) {
  const [copied, setCopied] = useState(false);
  const d = lead?.ps_detail?.detail; const st = d ? leadStory(d) : null; if (!st) return null;
  const l = listingOf(d), a = l?.agent; const leasing = !!l?.rental;
  const digitsOf = (p) => String(p || "").replace(/\D/g, "").slice(-10);
  const agentC = a && (contacts || []).find((x) => (a.email && [x.email, x.email_2].includes(a.email)) || (a.phone && digitsOf(x.phone) === digitsOf(a.phone)));
  const addr = c.property_address || lead.property_address || "the property";
  const em = a ? agentEmail((a.name || "").split(/\s+/)[0], addr, leasing) : null;
  return (
    <div style={{...box, borderColor:"#c9b98f"}}>
      <div style={lbl}>What happened</div>
      <ul style={{margin:"2px 0 8px", paddingLeft:18, fontSize:14, lineHeight:1.5, color:C.ink}}>{st.facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
      <div style={{fontSize:14, lineHeight:1.5, marginBottom:6}}><b style={{color:C.green}}>Why this lead:</b> {st.why}</div>
      {st.watch.length > 0 && <div style={{fontSize:14, lineHeight:1.5, marginBottom:6}}><b style={{color:"#b05e0d"}}>Watch:</b> {st.watch.join(" ")}</div>}
      {a?.name && (
        <div style={{borderTop:`1px solid ${C.rule}`, marginTop:8, paddingTop:8, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
          <span style={{fontFamily:F.cond, fontWeight:800, fontSize:15, color: leasing ? "#5b3fa6" : C.ink}}>{leasing ? "LEASING AGENT" : "LISTING AGENT"}:</span>
          <span style={{fontSize:14}}>{a.name}{a.office ? ` · ${a.office}` : ""}</span>
          {a.phone && <a href={`tel:${digitsOf(a.phone)}`} style={btn}>Call {a.phone}</a>}
          {a.email && <a href={`mailto:${a.email}?subject=${encodeURIComponent(em.subject)}&body=${encodeURIComponent(em.body)}`} style={btnG}>Email agent</a>}
          <button onClick={() => { navigator.clipboard?.writeText(`Subject: ${em.subject}\n\n${em.body}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={btn}>{copied ? "Copied" : "Copy agent email"}</button>
          {agentC && onOpen && <button onClick={() => onOpen(agentC)} style={btn}>Open agent</button>}
        </div>)}
    </div>
  );
}
