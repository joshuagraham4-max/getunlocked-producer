// Quick updates while on the phone: new phone/email, rate correction, refinanced (new rate), sold the home, do not contact.
import { useState } from "react";
import { supabase } from "../supabase.js";
import { today } from "../radar/engine.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", red:"#9e3020" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:13, padding:"6px 11px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"7px 9px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box" };
const ACTIONS = [["phone","New phone"],["email","New email"],["rate","Correct rate"],["refi","Refinanced / new rate"],["sold","Sold the home"],["dnc","Do not contact"]];

export default function QuickUpdate({ userId, c, setContacts, onLoansChanged }) {
  const [open, setOpen] = useState(null);
  const [v, setV] = useState({ value:"", rate:"", date:today(), type:"Conventional" });
  const [msg, setMsg] = useState("");
  const reset = () => { setOpen(null); setV({ value:"", rate:"", date:today(), type:"Conventional" }); };

  const commit = async (fields, label, loanChange) => {
    const line = `${today()}: update · ${label}`;
    const tags = fields.tags || c.tags || [];
    const { data, error } = await supabase.from("contacts").update({ ...fields, tags, contact_note:[c.contact_note, line].filter(Boolean).join("\n") }).eq("id", c.id).select().single();
    if (error) { setMsg("Save failed: " + error.message); return; }
    await supabase.from("contact_touches").insert({ user_id:userId, contact_id:c.id, channel:"update", outcome:label });
    if (loanChange) { await loanChange(); onLoansChanged?.(); }
    setContacts((p) => p.map((x) => (x.id === data.id ? data : x)));
    setMsg(`Saved: ${label}`); reset();
  };

  const save = async () => {
    const val = v.value.trim(); const rate = Number(v.rate);
    switch (open) {
      case "phone": if (!val) return; return commit({ phone:val, phone_2:c.phone && c.phone !== val ? c.phone : c.phone_2 }, `new phone ${val}`);
      case "email": if (!/@/.test(val)) return setMsg("That email doesn't look right."); return commit({ email:val, email_2:c.email && c.email !== val ? c.email : c.email_2 }, `new email ${val}`);
      case "rate": if (!rate) return setMsg("Enter the rate.");
        return commit({ note_rate:rate }, `rate corrected to ${rate}%`, async () => { await supabase.from("loans").update({ note_rate:rate }).eq("contact_id", c.id).eq("is_current", true); });
      case "refi": if (!rate) return setMsg("Enter the new rate.");
        return commit({ note_rate:rate, funded_date:v.date, loan_type:v.type, loan_type_source:"verified" }, `refinanced: ${rate}% ${v.type}, ${v.date}`, async () => {
          await supabase.from("loans").update({ is_current:false }).eq("contact_id", c.id);
          await supabase.from("loans").insert({ user_id:userId, contact_id:c.id, note_rate:rate, funded_date:v.date, loan_type:v.type, loan_type_source:"verified", loan_purpose:"refinance", is_current:true, source:"call update" });
        });
      case "sold":
        return commit({ tags:[...new Set([...(c.tags || []), "sold home"])], note_rate:null }, `sold the home${val ? `: ${val}` : ""}`, async () => { await supabase.from("loans").update({ is_current:false }).eq("contact_id", c.id); });
      case "dnc":
        return commit({ do_not_contact:true, tags:[...new Set([...(c.tags || []), "dnc"])] }, `do not contact${val ? `: ${val}` : ""}`);
      default:
    }
  };

  return (
    <div style={{marginTop:14, paddingTop:12, borderTop:`1px dashed ${C.rule}`}}>
      <div style={{display:"flex", gap:6, flexWrap:"wrap", alignItems:"center"}}>
        <span style={{fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginRight:4}}>Quick update</span>
        {ACTIONS.map(([k, l]) => <button key={k} onClick={() => { setMsg(""); setOpen(open === k ? null : k); }} style={open === k ? btnG : { ...btn, ...(k === "dnc" ? { color:C.red } : {}) }}>{l}</button>)}
      </div>
      {open && (
        <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginTop:10}}>
          {open === "phone" && <input autoFocus value={v.value} onChange={(e) => setV({ ...v, value:e.target.value })} placeholder={`New phone (now ${c.phone || "none"})`} style={{...inp, flex:"1 1 220px"}}/>}
          {open === "email" && <input autoFocus value={v.value} onChange={(e) => setV({ ...v, value:e.target.value })} placeholder={`New email (now ${c.email || "none"})`} style={{...inp, flex:"1 1 220px"}}/>}
          {open === "rate" && <input autoFocus type="number" step="0.001" value={v.rate} onChange={(e) => setV({ ...v, rate:e.target.value })} placeholder={`Correct rate (now ${c.note_rate ?? "unknown"})`} style={{...inp, width:220}}/>}
          {open === "refi" && <>
            <input autoFocus type="number" step="0.001" value={v.rate} onChange={(e) => setV({ ...v, rate:e.target.value })} placeholder="New rate %" style={{...inp, width:120}}/>
            <input type="date" value={v.date} onChange={(e) => setV({ ...v, date:e.target.value })} title="When they closed" style={{...inp, width:160}}/>
            <select value={v.type} onChange={(e) => setV({ ...v, type:e.target.value })} style={inp}>{["Conventional","FHA","VA","Jumbo","Non-QM","Other"].map((x) => <option key={x}>{x}</option>)}</select>
          </>}
          {(open === "sold" || open === "dnc") && <input autoFocus value={v.value} onChange={(e) => setV({ ...v, value:e.target.value })} placeholder={open === "sold" ? "Note (optional): moved where, renting, bought new" : "Reason (optional)"} style={{...inp, flex:"1 1 260px"}}/>}
          <button onClick={save} style={btnG}>Save</button><button onClick={reset} style={btn}>Cancel</button>
        </div>
      )}
      {open === "sold" && <div style={{fontFamily:F.mono, fontSize:11, color:C.light, marginTop:6}}>Takes them off rate and equity lists. They stay a contact for future calls.</div>}
      {open === "dnc" && <div style={{fontFamily:F.mono, fontSize:11, color:C.red, marginTop:6}}>Removes them from all call and email lists.</div>}
      {msg && <div style={{fontFamily:F.mono, fontSize:11, color: msg.startsWith("Saved") ? C.green : C.red, marginTop:6}}>{msg}</div>}
    </div>
  );
}
