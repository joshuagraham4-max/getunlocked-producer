// Save my info (the capture page every Bond flyer and post points to). Short form → calculator_leads
// (source "save-my-info", ref from ?ref=) → the existing triggers drop the lead into Contacts as a "lead" and ping the phone.
// Interest (buyer / homeowner / investor / agent) and city go in answers.summary, so they show in the contact note.
import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import BrandBar, { NoSpam } from "./BrandBar.jsx";
import CtaRow from "./CtaRow.jsx";

const C = { navy:"#0E1B2A", sky:"#4FB0EA", ink:"#0E1B2A", muted:"#51647A", line:"#DCE3EB", bg:"#F3F6F9", card:"#FFFFFF", blue:"#1F6FA8", red:"#C8102E", bad:"#C0392B" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const WHO = [
  { id:"buyer", label:"Buying a home", next:"I'll text you your next step today, and we'll run your real numbers." },
  { id:"homeowner", label:"I own a home", next:"I'll text you today and we'll see what your equity could do." },
  { id:"investor", label:"Real estate investor", next:"I'll text you today. Ask me about the free portfolio review, no credit pull." },
  { id:"agent", label:"Real estate agent", next:"I'll reach out today about your market, your buyers and training your team." },
];
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "SAVE-01"; } catch { return "SAVE-01"; } };
const input = { font:"inherit", fontSize:16, color:C.ink, background:"#fff", border:`1px solid ${C.line}`, borderRadius:8, padding:"10px 12px", width:"100%", boxSizing:"border-box" };
const labelS = { display:"flex", flexDirection:"column", gap:6, fontWeight:600, fontSize:14 };
const panel = { background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:22 };

export default function SaveMyInfo() {
  const [f, setF] = useState({ who:"", first:"", last:"", email:"", phone:"", city:"", state:"", zip:"", note:"", consent:false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const who = WHO.find((w) => w.id === f.who);

  const submit = async (ev) => {
    ev.preventDefault(); setErr("");
    const phone = f.phone.replace(/\D/g, ""); const miss = [];
    if (!f.who) miss.push("what brings you here");
    if (!f.first.trim()) miss.push("first name");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) miss.push("a valid email");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (!f.state && !/^\d{5}$/.test(f.zip.trim())) miss.push("your state or zip");
    if (!f.consent) miss.push("your consent to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const place = [f.city.trim(), f.state].filter(Boolean).join(", ");
    const summary = `Save my info: ${who.label}${place ? " · " + place : ""}${f.note.trim() ? ` · "${f.note.trim().slice(0, 160)}"` : ""}`;
    const { error } = await supabase.from("calculator_leads").insert({
      first_name:f.first.trim(), last_name:f.last.trim() || null, email:f.email.trim(), phone,
      property_state:f.state || null, zip:/^\d{5}$/.test(f.zip.trim()) ? f.zip.trim() : null, consent:true,
      ref:getRef(), source:"save-my-info", page_url:location.href.slice(0, 500), user_agent:navigator.userAgent.slice(0, 300),
      answers:{ summary, interest:f.who, city:f.city.trim() || null, note:f.note.trim() || null } });
    setBusy(false);
    if (error) return setErr("We couldn't send that just now. Check your connection and try again, or call " + BRAND.phone + ".");
    setDone(true);
  };

  return (
    <div style={{ fontFamily:F.body, color:C.ink, background:C.bg, minHeight:"100vh", fontSize:16, lineHeight:1.5 }}>
      <BrandBar/>
      <header style={{ background:C.navy, color:"#fff" }}>
        <div style={{ maxWidth:760, margin:"0 auto", padding:"38px 16px 40px", display:"flex", flexDirection:"column", gap:10 }}>
          <p style={{ margin:0, fontFamily:F.display, fontWeight:700, fontSize:13, letterSpacing:"0.16em", textTransform:"uppercase", color:C.sky }}>Smooth. Precise. Elite.</p>
          <h1 style={{ margin:0, fontFamily:F.display, fontWeight:800, fontSize:"clamp(30px, 5vw, 44px)", lineHeight:1.08 }}>Save my info. <span style={{ color:"#FF5A6E", fontStyle:"italic" }}>I'll show you your number.</span></h1>
          <p style={{ margin:0, color:"#B9C8D8", fontSize:18, maxWidth:"58ch" }}>I'm a wholesale broker, so I shop several lenders for you and you get access to the best rates. Get a quote from anyone. Then get mine.</p>
        </div>
      </header>
      <main style={{ maxWidth:760, margin:"0 auto", padding:"28px 16px 48px" }}>
        {done ? (
          <div style={{ ...panel, display:"flex", flexDirection:"column", gap:14 }}>
            <h2 style={{ fontFamily:F.display, margin:0, fontSize:24 }}>You're saved, {f.first.trim()}.</h2>
            <p style={{ margin:0 }}>{who.next} It's not a sales call. When it has to go right, I'm your guy.</p>
            <p style={{ margin:0, color:C.muted }}>Want to talk sooner?</p>
            <CtaRow/>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap:16 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>What brings you here?</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {WHO.map((w) => (
                  <button key={w.id} type="button" onClick={() => setF({ ...f, who:w.id })}
                    style={{ font:"inherit", fontWeight:600, fontSize:15, padding:"10px 14px", borderRadius:999, cursor:"pointer", minHeight:44,
                      border:`2px solid ${f.who === w.id ? C.red : C.line}`, background:f.who === w.id ? C.red : "#fff", color:f.who === w.id ? "#fff" : C.ink }}>{w.label}</button>
                ))}
              </div>
            </div>
            <label style={labelS}>First name<input value={f.first} onChange={set("first")} autoComplete="given-name" style={input}/></label>
            <label style={labelS}>Last name<input value={f.last} onChange={set("last")} autoComplete="family-name" style={input}/></label>
            <label style={labelS}>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" style={input}/></label>
            <label style={labelS}>Phone<input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" style={input}/></label>
            <label style={labelS}>City or area<input value={f.city} onChange={set("city")} autoComplete="address-level2" style={input}/></label>
            <label style={labelS}>State
              <select value={f.state} onChange={set("state")} style={input}><option value="">Select…</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label style={labelS}>Zip <span style={{ fontWeight:400, color:C.muted, fontSize:13 }}>Optional</span><input value={f.zip} onChange={set("zip")} inputMode="numeric" maxLength={5} autoComplete="postal-code" style={input}/></label>
            <label style={{ ...labelS, gridColumn:"1/-1" }}>What would you like to know? <span style={{ fontWeight:400, color:C.muted, fontSize:13 }}>Optional</span>
              <textarea value={f.note} onChange={set("note")} rows={3} style={{ ...input, resize:"vertical" }}/></label>
            <label style={{ gridColumn:"1/-1", display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:C.muted }}>
              <input type="checkbox" checked={f.consent} onChange={set("consent")} style={{ marginTop:3, width:18, height:18 }}/>
              <span>I agree that Graham Financial, powered by Zero Point Mortgage Services, may contact me by phone, text or email at the information above, including by automated means. Consent is not a condition of any purchase or loan. Message and data rates may apply.</span>
            </label>
            <div style={{ gridColumn:"1/-1" }}><NoSpam/></div>
            {err && <p style={{ gridColumn:"1/-1", color:C.bad, margin:0 }}>{err}</p>}
            <button type="submit" disabled={busy} style={{ gridColumn:"1/-1", fontFamily:F.display, fontWeight:700, fontSize:16, background:C.red, color:"#fff", border:0, borderRadius:10, padding:"14px 20px", cursor:"pointer", minHeight:48 }}>{busy ? "Saving…" : "Save my info"}</button>
          </form>
        )}
      </main>
      <footer style={{ maxWidth:760, margin:"0 auto", padding:"0 16px 40px" }}>
        <p style={{ fontSize:12, color:C.muted, textAlign:"center", maxWidth:"90ch", margin:"0 auto" }}>Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.</p>
      </footer>
    </div>
  );
}
