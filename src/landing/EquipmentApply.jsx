// Equipment financing quick application (EQP cards, dealers, checklist). No SSN, no DOB: that goes on the lender's credit app.
// Saves to calculator_leads (source "equipment-application") → the trigger drops the lead into Contacts + phone alert.
import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import BrandBar, { NoSpam } from "./BrandBar.jsx";

const C = { green:"#12291C", gold:"#F2B84B", ink:"#12291C", muted:"#4F6657", line:"#D5DED7", bg:"#F2F5F2", card:"#FFFFFF", btn:"#1E6E4A", bad:"#C0392B" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const FOOT = "Graham Financial | Commercial equipment financing for business purposes only. Financing provided by participating lenders, subject to credit approval and lender terms. Decision times vary by lender and equipment. No upfront fees. Not available in California.";
const CHECKLIST = "/equipment/Graham_Financial_Equipment_Checklist.pdf";
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "EQP"; } catch { return "EQP"; } };
const num = (v) => { const n = Number(String(v || "").replace(/[^\d.]/g, "")); return isFinite(n) && n > 0 ? n : null; };
const usd = (n) => (n == null ? "" : "$" + Math.round(n).toLocaleString());

const input = { font:"inherit", fontSize:16, color:C.ink, background:"#fff", border:`1px solid ${C.line}`, borderRadius:8, padding:"10px 12px", width:"100%", boxSizing:"border-box" };
const labelS = { display:"flex", flexDirection:"column", gap:6, fontWeight:600, fontSize:14 };
const panel = { background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:22 };
const btnS = { fontFamily:F.display, fontWeight:700, fontSize:16, background:C.btn, color:"#fff", border:0, borderRadius:10, padding:"14px 20px", cursor:"pointer", minHeight:48, textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box" };
const btnO = { ...btnS, background:"#fff", color:C.btn, border:`2px solid ${C.btn}` };

const SELECTS = {
  years: ["Under 1 year", "1-2 years", "2-5 years", "5+ years"],
  credit: ["700+", "650-699", "600-649", "Under 600", "Not sure"],
  timing: ["Right away", "Within 30 days", "1-3 months", "Just pricing it out"],
  cond: ["New", "Used", "Not sure yet"],
};

export default function EquipmentApply() {
  const [v, setV] = useState({ business:"", first:"", last:"", phone:"", email:"", state:"", years:"", industry:"", equipment:"", cond:"", cost:"", vendor:"", credit:"", timing:"", notes:"", consent:false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const ca = v.state === "CA";
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (ca) return setErr("Sorry, we don't offer equipment financing in California.");
    const phone = v.phone.replace(/\D/g, ""); const miss = [];
    if (!v.business.trim()) miss.push("business name");
    if (!v.first.trim()) miss.push("your first name");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) miss.push("a valid email");
    if (!v.state) miss.push("your state");
    if (!v.equipment.trim()) miss.push("the equipment you need");
    if (!v.consent) miss.push("your consent to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const cost = num(v.cost);
    const summary = `Equipment application: ${v.business.trim()} (${v.industry || "industry n/a"}, ${v.years || "time in business n/a"}), ${v.equipment.trim()}${v.cond ? ` (${v.cond.toLowerCase()})` : ""}${cost ? ` ${usd(cost)}` : ""}${v.vendor ? `, vendor ${v.vendor.trim()}` : ""}, credit ${v.credit || "n/a"}, timing ${v.timing || "n/a"}${v.notes ? `. Notes: ${v.notes.trim().slice(0, 300)}` : ""}`;
    const lead = { first_name:v.first.trim(), last_name:v.last.trim() || null, email:v.email.trim(), phone, est_loan_amount:cost,
      property_state:v.state, zip:null, consent:true, ref:getRef(), source:"equipment-application",
      page_url:location.href.slice(0, 500), user_agent:navigator.userAgent.slice(0, 300),
      answers:{ summary, business:v.business.trim(), industry:v.industry, years:v.years, equipment:v.equipment.trim(), condition:v.cond, cost, vendor:v.vendor.trim(), credit:v.credit, timing:v.timing, notes:v.notes.trim().slice(0, 1000) } };
    const { error } = await supabase.from("calculator_leads").insert(lead);
    setBusy(false);
    if (error) return setErr("We couldn't save your info just now. Check your connection and try again, or call " + BRAND.phone + ".");
    setDone(true); window.scrollTo(0, 0);
  };
  const Sel = ({ k, label, opts }) => (
    <label style={labelS}>{label}<select value={v[k]} onChange={set(k)} style={input}><option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>);

  return (
    <div style={{ fontFamily:F.body, color:C.ink, minHeight:"100vh" }}>
      <BrandBar max={860}/>
      <div style={{ background:C.green, color:"#fff" }}>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"34px 16px 30px" }}>
          <div style={{ fontFamily:F.display, fontWeight:700, fontSize:13, letterSpacing:"0.18em", color:C.gold }}>BUSINESS OWNERS · EQUIPMENT FINANCING</div>
          <h1 style={{ fontFamily:F.display, fontWeight:800, fontSize:"clamp(30px, 6vw, 46px)", lineHeight:1.08, margin:"10px 0" }}>The bank said no?<br/>Let's find the yes.</h1>
          <p style={{ fontSize:18, lineHeight:1.5, color:"#CFE0D4", margin:0, maxWidth:640 }}>Two minutes. No credit pull to start. I take your deal to lenders who look past what the bank turned down.</p>
        </div>
      </div>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"22px 16px 40px", display:"flex", flexDirection:"column", gap:18 }}>
        {done ? (
          <div style={panel}>
            <h2 style={{ fontFamily:F.display, margin:"0 0 8px", fontSize:24 }}>Got it. I'll call you shortly.</h2>
            <p style={{ fontSize:16, lineHeight:1.6, margin:"0 0 14px" }}>To move faster, have these ready: the equipment quote from your vendor and your last 3 months of business bank statements (full PDFs). The checklist has everything.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap:10 }}>
              <a href={BRAND.booking} target="_blank" rel="noreferrer" style={btnS}>Book 5 minutes now</a>
              <a href={CHECKLIST} target="_blank" rel="noreferrer" style={btnO}>Open the checklist</a>
              <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} style={btnO}>Call {BRAND.phone}</a>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap:16 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <h2 style={{ fontFamily:F.display, margin:0, fontSize:22 }}>Quick application</h2>
              <p style={{ margin:"6px 0 0", color:C.muted, fontSize:15 }}>No Social Security number here. If it makes sense, I'll send the lender's full application next.</p>
            </div>
            <label style={labelS}>Business name<input value={v.business} onChange={set("business")} style={input} autoComplete="organization"/></label>
            {Sel({k:"industry", label:"Industry", opts:["Landscaping / tree care", "Restaurant / food truck", "Construction", "Trucking / transport", "Medical / dental", "Other"]})}
            <label style={labelS}>First name<input value={v.first} onChange={set("first")} style={input} autoComplete="given-name"/></label>
            <label style={labelS}>Last name<input value={v.last} onChange={set("last")} style={input} autoComplete="family-name"/></label>
            <label style={labelS}>Mobile phone<input value={v.phone} onChange={set("phone")} style={input} inputMode="tel" autoComplete="tel"/></label>
            <label style={labelS}>Email<input value={v.email} onChange={set("email")} style={input} inputMode="email" autoComplete="email"/></label>
            <label style={labelS}>Business state<select value={v.state} onChange={set("state")} style={input}><option value="">Select…</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
            {Sel({k:"years", label:"Time in business", opts:SELECTS.years})}
            <label style={{ ...labelS, gridColumn:"1/-1" }}>What equipment do you need?<input value={v.equipment} onChange={set("equipment")} style={input} placeholder="Zero-turn mower and trailer"/></label>
            {Sel({k:"cond", label:"New or used", opts:SELECTS.cond})}
            <label style={labelS}>Approximate cost<input value={v.cost} onChange={set("cost")} style={input} inputMode="numeric" placeholder="35000"/></label>
            <label style={labelS}>Vendor or dealer (if you have one)<input value={v.vendor} onChange={set("vendor")} style={input}/></label>
            {Sel({k:"credit", label:"Your credit, roughly", opts:SELECTS.credit})}
            {Sel({k:"timing", label:"When do you need it?", opts:SELECTS.timing})}
            <label style={{ ...labelS, gridColumn:"1/-1" }}>Anything I should know? (a bank turned you down, new business, etc.)<textarea value={v.notes} onChange={set("notes")} style={{ ...input, minHeight:80 }}/></label>
            {ca && <div style={{ gridColumn:"1/-1", color:C.bad, fontWeight:600 }}>Sorry, we don't offer equipment financing in California.</div>}
            <label style={{ gridColumn:"1/-1", display:"flex", gap:10, alignItems:"flex-start", fontSize:14, lineHeight:1.5 }}>
              <input type="checkbox" checked={v.consent} onChange={set("consent")} style={{ marginTop:4, width:18, height:18 }}/>
              <span>I agree that Joshua Graham with Graham Financial may contact me by phone, text or email about equipment financing. Consent isn't a condition of any purchase. Msg and data rates may apply.<NoSpam/></span>
            </label>
            {err && <div style={{ gridColumn:"1/-1", color:C.bad, fontWeight:600 }}>{err}</div>}
            <button type="submit" disabled={busy || ca} style={{ ...btnS, gridColumn:"1/-1", opacity: busy || ca ? 0.6 : 1 }}>{busy ? "Sending…" : "Send my application"}</button>
          </form>
        )}
        {!done && <div style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap:10, alignItems:"center" }}>
          <div style={{ fontFamily:F.display, fontWeight:700, fontSize:16 }}>Rather talk first?</div>
          <a href={BRAND.booking} target="_blank" rel="noreferrer" style={btnO}>Book 5 minutes</a>
          <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} style={btnO}>Call {BRAND.phone}</a>
        </div>}
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.5, textAlign:"center", margin:0 }}>{FOOT}</p>
      </div>
    </div>
  );
}
