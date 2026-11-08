// Investor lead tools inside a Contact: call opener, playbook, follow-up email, voicemail/text, and the PropStream
// property & loan record. Works with or without a phone number.
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { scriptsFor } from "../radar/engine.js";
import { personFirst, sunbizUrl, isEntity } from "../radar/investorPlaybook.js";
import Playbook from "../calls/Playbook.jsx";
import { PsDetail } from "../investors/InvestorImport.jsx";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const box = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10, padding:"14px 16px", marginBottom:12 };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginBottom:4 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const text = { whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.5, color:C.ink, background:"#fff", border:`1px solid ${C.rule}`, borderRadius:7, padding:"10px 12px", margin:"4px 0 8px" };

export const isInvestorLead = (c) => (c.tags || []).includes("investor lead");

export default function InvestorPanel({ c, profileName }) {
  const [lead, setLead] = useState(null); const [copied, setCopied] = useState("");
  useEffect(() => { let on = true;
    supabase.from("investor_leads").select("ps_detail,lead_type,property_address,property_city,est_maturity,lender").eq("contact_id", c.id).maybeSingle()
      .then(({ data }) => { if (on) setLead(data || null); });
    return () => { on = false; }; }, [c.id]);
  const s = scriptsFor({ ...c, property_address: c.property_address || lead?.property_address }, null, { key:"newlead" }, profileName || "Joshua Graham");
  const copy = (k, t) => { navigator.clipboard?.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); };
  return (
    <>
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
export const isListingAgent = (c) => (c.tags || []).includes("listing agent");
export function ListingAgentPanel({ c, contacts, links }) {
  const [copied, setCopied] = useState("");
  const props = (links || []).filter((l) => l.relation === "listing agent" && l.contact_id === c.id).map((l) => contacts.find((x) => x.id === l.linked_id)).filter(Boolean);
  const first = personFirst(c) || "there";
  return (
    <div style={box}>
      <div style={lbl}>Listing agent email</div>
      {props.length === 0 && <div style={{fontFamily:F.mono, fontSize:11, color:C.light}}>No linked property yet.</div>}
      {props.map((o) => {
        const addr = o.property_address || "the property";
        const subject = addr;
        const body = `Hi ${first},\n\nSaw the listing on ${addr} fell through. What's up with the property? Is the owner still looking to sell, or would they consider holding it as a rental for now?\n\nI'm a local loan originator working with investors here in Sarasota and Manatee. When a flip doesn't sell, I help owners move out of the short-term loan into long-term rental financing, which takes the time pressure off. If your seller's in that spot, I'm glad to help, and you stay their agent on it either way.\n\nWorth a quick call?\n\nJoshua Graham\nAVP / Regional Loan Originator\nGraham Financial powered by Zero Point Mortgage Services\nNMLS 169809 | 720-468-6872`;
        return (
          <div key={o.id} style={{marginBottom:12}}>
            <div style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{addr} · owner {o.company || [o.first_name, o.last_name].filter(Boolean).join(" ")}</div>
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
