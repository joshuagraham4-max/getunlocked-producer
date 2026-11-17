// Scenario Desk: agents send a tricky loan scenario, no login, no client PII. Saves to calculator_leads (source "scenario-desk");
// the trigger files the agent in Contacts (type agent) with the scenario on their timeline, and the phone alert fires.
import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import BrandBar, { NoSpam } from "./BrandBar.jsx";

const C = { navy:"#0E1B2A", gold:"#F2B84B", ink:"#0E1B2A", muted:"#51647A", line:"#DCE3EB", card:"#FFFFFF", btn:"#1F6FA8", bad:"#C0392B", chip:"#EEF3F8" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };
export const SCENARIO_TAGS = ["Self-employed / 1099", "Credit issues", "Divorce", "Sell and buy (timing)", "Low down payment", "Investor / rental", "Recently changed jobs", "Non-US citizen", "Big debts / DTI", "Other"];
const STAGES = ["Buying", "Selling and buying", "Refinancing", "Investor", "Not sure yet"];
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "SD"; } catch { return "SD"; } };
const input = { font:"inherit", fontSize:16, color:C.ink, background:"#fff", border:`1px solid ${C.line}`, borderRadius:8, padding:"10px 12px", width:"100%", boxSizing:"border-box" };
const labelS = { display:"flex", flexDirection:"column", gap:6, fontWeight:600, fontSize:14 };
const panel = { background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:22 };
const btnS = { fontFamily:F.display, fontWeight:700, fontSize:16, background:C.btn, color:"#fff", border:0, borderRadius:10, padding:"14px 20px", cursor:"pointer", minHeight:48, textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box" };
const btnO = { ...btnS, background:"#fff", color:C.btn, border:`2px solid ${C.btn}` };

export default function ScenarioDesk() {
  const [v, setV] = useState({ first:"", last:"", phone:"", email:"", brokerage:"", state:"", stage:"", reach:"Text", scenario:"", consent:false });
  const [tags, setTags] = useState([]); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const tog = (t) => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const phone = v.phone.replace(/\D/g, ""); const miss = [];
    if (!v.first.trim()) miss.push("your first name");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) miss.push("a valid email (or leave it blank)");
    if (v.scenario.trim().length < 10) miss.push("the scenario");
    if (!v.consent) miss.push("your consent to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const summary = `Scenario from ${v.first.trim()}${v.brokerage ? ` (${v.brokerage.trim()})` : ""}${v.stage ? ` · ${v.stage}` : ""}${tags.length ? ` · ${tags.join(", ")}` : ""} · reply by ${v.reach}: ${v.scenario.trim().slice(0, 1500)}`;
    const lead = { first_name:v.first.trim(), last_name:v.last.trim() || null, email:v.email.trim() || null, phone, property_state:v.state.trim().toUpperCase().slice(0, 2) || null,
      consent:true, ref:getRef(), source:"scenario-desk", page_url:location.href.slice(0, 500), user_agent:navigator.userAgent.slice(0, 300),
      answers:{ summary, brokerage:v.brokerage.trim(), stage:v.stage, tags, reach:v.reach, scenario:v.scenario.trim().slice(0, 3000) } };
    const { error } = await supabase.from("calculator_leads").insert(lead);
    setBusy(false);
    if (error) return setErr("We couldn't send that just now. Try again, or text Joshua at " + BRAND.phone + ".");
    setDone(true); window.scrollTo(0, 0);
  };
  return (
    <div style={{ fontFamily:F.body, color:C.ink, minHeight:"100vh" }}>
      <BrandBar max={860}/>
      <div style={{ background:C.navy, color:"#fff" }}>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"34px 16px 30px" }}>
          <div style={{ fontFamily:F.display, fontWeight:700, fontSize:13, letterSpacing:"0.18em", color:C.gold }}>AGENTS · SCENARIO DESK</div>
          <h1 style={{ fontFamily:F.display, fontWeight:800, fontSize:"clamp(30px, 6vw, 46px)", lineHeight:1.08, margin:"10px 0" }}>Weird scenario?<br/>Get a straight answer.</h1>
          <p style={{ fontSize:18, lineHeight:1.5, color:"#C9D6E3", margin:0, maxWidth:640 }}>Self-employed, credit dings, sell-and-buy timing, divorce. Type it in plain words. No lead required, no client details. I'm a wholesale broker with dozens of lenders behind me.</p>
        </div>
      </div>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"22px 16px 40px", display:"flex", flexDirection:"column", gap:18 }}>
        {done ? (
          <div style={panel}>
            <h2 style={{ fontFamily:F.display, margin:"0 0 8px", fontSize:24 }}>Got it. I'm on it.</h2>
            <p style={{ fontSize:16, lineHeight:1.6, margin:"0 0 14px" }}>I'll get back to you by {v.reach.toLowerCase()}, usually the same day. If your client is ready to talk options, book a 5-minute call.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap:10 }}>
              <a href={BRAND.booking} target="_blank" rel="noreferrer" style={btnS}>Book 5 minutes</a>
              <button onClick={() => { setDone(false); setV({ ...v, scenario:"" }); setTags([]); }} style={btnO}>Send another scenario</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap:16 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <h2 style={{ fontFamily:F.display, margin:0, fontSize:22 }}>The scenario</h2>
              <p style={{ margin:"6px 0 0", color:C.muted, fontSize:15 }}>Please don't include your client's last name, SSN or account numbers. First name or initials is plenty.</p>
            </div>
            <div style={{ gridColumn:"1/-1", display:"flex", flexWrap:"wrap", gap:8 }}>
              {SCENARIO_TAGS.map((t) => <button type="button" key={t} onClick={() => tog(t)} style={{ font:"inherit", fontSize:14, fontWeight:600, padding:"8px 12px", borderRadius:18, cursor:"pointer", border:`1.5px solid ${tags.includes(t) ? C.btn : C.line}`, background:tags.includes(t) ? C.chip : "#fff", color:tags.includes(t) ? C.btn : C.ink }}>{t}</button>)}
            </div>
            <label style={{ ...labelS, gridColumn:"1/-1" }}>What's going on?<textarea value={v.scenario} onChange={set("scenario")} style={{ ...input, minHeight:120 }} placeholder="Seller wants to buy next. Self-employed 14 months, paid on 1099. Credit around 660. Wants to stay under $4,000 a month."/></label>
            <label style={labelS}>Where they are<select value={v.stage} onChange={set("stage")} style={input}><option value="">Select…</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label style={labelS}>Property state<input value={v.state} onChange={set("state")} style={input} maxLength={2} placeholder="FL"/></label>
            <div style={{ gridColumn:"1/-1", borderTop:`1px solid ${C.line}`, paddingTop:14 }}><h2 style={{ fontFamily:F.display, margin:0, fontSize:20 }}>You</h2></div>
            <label style={labelS}>First name<input value={v.first} onChange={set("first")} style={input} autoComplete="given-name"/></label>
            <label style={labelS}>Last name<input value={v.last} onChange={set("last")} style={input} autoComplete="family-name"/></label>
            <label style={labelS}>Mobile phone<input value={v.phone} onChange={set("phone")} style={input} inputMode="tel" autoComplete="tel"/></label>
            <label style={labelS}>Email (optional)<input value={v.email} onChange={set("email")} style={input} inputMode="email" autoComplete="email"/></label>
            <label style={labelS}>Brokerage<input value={v.brokerage} onChange={set("brokerage")} style={input} autoComplete="organization"/></label>
            <label style={labelS}>Best way to reply<select value={v.reach} onChange={set("reach")} style={input}>{["Text", "Call", "Email"].map((s) => <option key={s}>{s}</option>)}</select></label>
            <label style={{ gridColumn:"1/-1", display:"flex", gap:10, alignItems:"flex-start", fontSize:14, lineHeight:1.5 }}>
              <input type="checkbox" checked={v.consent} onChange={set("consent")} style={{ marginTop:4, width:18, height:18 }}/>
              <span>I agree that Joshua Graham may contact me by phone, text or email about this scenario. Msg and data rates may apply.<NoSpam/></span>
            </label>
            {err && <div style={{ gridColumn:"1/-1", color:C.bad, fontWeight:600 }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ ...btnS, gridColumn:"1/-1", opacity:busy ? 0.6 : 1 }}>{busy ? "Sending…" : "Send the scenario"}</button>
          </form>
        )}
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.5, textAlign:"center", margin:0 }}>Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. General guidance only, not a loan approval or commitment to lend.</p>
      </div>
    </div>
  );
}
