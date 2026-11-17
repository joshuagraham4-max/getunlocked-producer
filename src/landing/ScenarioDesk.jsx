// Scenario Desk: agents send a tricky loan scenario, no login, no client PII. Saves to calculator_leads (source "scenario-desk");
// the trigger files the agent in Contacts (type agent) with the scenario on their timeline, and the phone alert fires.
// On a per-agent link (?ref=AGT-<slug>) the agent's name, brokerage and phone are filled in from their page, so they only pick how to be reached.
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import { DESK_VIDEO, DESK_VIDEO_TITLE, embedFor } from "./saveVideo.js";
import BrandBar, { NoSpam } from "./BrandBar.jsx";

const C = { maroon:"#4A111C", navy:"#0E1B2A", gold:"#D9A566", goldDk:"#8A5A24", cream:"#F6EEDF", ink:"#0E1B2A", muted:"#4A5568", line:"#E3D6BF", card:"#FFFFFF", btn:"#4A111C", bad:"#B3261E", chip:"#0E1B2A" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };
export const SCENARIO_TAGS = ["Self-employed / 1099", "Credit issues", "Divorce", "Sell and buy (timing)", "Low down payment", "Investor / rental", "Recently changed jobs", "Non-US citizen", "Big debts / DTI", "Other"];
const STAGES = ["Buying", "Selling and buying", "Refinancing", "Investor", "Not sure yet"];
const REACH = ["Text", "Call", "Email"];
const getRef = () => { try { const m = location.pathname.match(/\/d\/([^/?#]+)/); if (m) return "AGT-" + decodeURIComponent(m[1]).toLowerCase(); return new URLSearchParams(location.search).get("ref") || "SD"; } catch { return "SD"; } };
const input = { font:"inherit", fontSize:16, color:C.ink, background:"#fff", border:`1px solid ${C.line}`, borderRadius:4, padding:"12px 12px", width:"100%", boxSizing:"border-box" };
const labelS = { display:"flex", flexDirection:"column", gap:6, fontWeight:700, fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", color:C.navy };
const panel = { background:C.card, border:`1px solid ${C.line}`, borderTop:`4px solid ${C.gold}`, borderRadius:2, padding:24, boxShadow:"0 8px 24px rgba(74,17,28,.08)" };
const eyebrow = { fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:C.goldDk };
const btnS = { fontFamily:F.display, fontWeight:800, fontSize:15, letterSpacing:"0.1em", textTransform:"uppercase", background:C.btn, color:"#fff", border:0, borderBottom:`4px solid ${C.gold}`, borderRadius:2, padding:"16px 22px", cursor:"pointer", minHeight:54, textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box" };
const btnO = { ...btnS, background:"#fff", color:C.maroon, border:`2px solid ${C.maroon}`, borderBottom:`4px solid ${C.gold}` };
const chipS = (on) => ({ font:"inherit", fontSize:15, fontWeight:700, padding:"10px 18px", borderRadius:2, cursor:"pointer", minHeight:46, border:`1.5px solid ${on ? C.navy : C.line}`, background:on ? C.navy : "#fff", color:on ? "#fff" : C.ink });

export default function ScenarioDesk() {
  const [v, setV] = useState({ first:"", last:"", phone:"", email:"", brokerage:"", state:"", stage:"", reach:"Text", scenario:"", consent:false });
  const [tags, setTags] = useState([]); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const [ag, setAg] = useState(null); const [edit, setEdit] = useState(false); const [rate, setRate] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const tog = (t) => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  // Per-agent link: pull their name, brokerage and phone from their page (the same public fields their lander shows).
  useEffect(() => {
    const ref = getRef(); if (!/^AGT-/i.test(ref)) return;
    (async () => {
      try {
        const { data } = await supabase.rpc("get_agent_page", { p_slug: ref.slice(4) });
        const a = data && data[0]; if (!a) return;
        const parts = String(a.name || "").trim().split(/\s+/);
        setAg(a);
        setV((x) => ({ ...x, first: x.first || parts[0] || "", last: x.last || parts.slice(1).join(" "), brokerage: x.brokerage || a.brokerage || "", phone: x.phone || a.phone || "" }));
      } catch {}
    })();
  }, []);
  // Rate on my desk: your latest conventional rate from Radar. Hidden once it is more than 24 hours old.
  useEffect(() => { (async () => { try { const { data } = await supabase.rpc("get_flyer_rate"); if (data && data[0]) setRate(data[0]); } catch {} })(); }, []);
  const rateOk = !!(rate && rate.rate && (Date.now() - new Date(rate.as_of + "T12:00:00").getTime()) / 864e5 <= 1);
  const asOfTxt = rate ? new Date(rate.as_of + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "";

  const digits = v.phone.replace(/\D/g, "");
  const known = !!(ag && digits.length >= 10 && v.first.trim() && !edit);
  const showEmail = !known || v.reach === "Email";
  const vid = embedFor(DESK_VIDEO);
  const first = v.first.trim();

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const phone = digits; const miss = [];
    if (!v.first.trim()) miss.push("your first name");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (v.reach === "Email" && !v.email.trim()) miss.push("your email");
    else if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) miss.push("a valid email (or leave it blank)");
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
    <div style={{ fontFamily:F.body, color:C.ink, minHeight:"100vh", background:C.cream }}>
      <BrandBar max={860}/>
      <div style={{ background:C.maroon, color:"#F6ECE9", borderBottom:`6px solid ${C.gold}` }}>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"38px 18px 34px", display:"flex", flexWrap:"wrap", gap:28, alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ flex:"1 1 400px", minWidth:0 }}>
            <div style={{ fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.22em", color:C.gold }}>PRIVATE LINE · JOSHUA'S DESK</div>
            <h1 style={{ fontFamily:F.display, fontWeight:800, fontSize:"clamp(32px, 7vw, 50px)", lineHeight:1.06, margin:"12px 0", color:"#fff" }}>{first && ag ? `Welcome to my desk, ${first}.` : "Welcome to my desk."}</h1>
            <p style={{ fontSize:18, lineHeight:1.55, color:"#E3C9CC", margin:0, maxWidth:540 }}>Odd income, credit dings, tight timing, a sell-and-buy that has to line up. Put it on my desk in plain words. I shop many banks for the best to win yours. No client details needed.</p>
          </div>
          <div style={{ flex:"0 0 auto", width:150 }}>
            <img src="/brand/joshua-headshot.jpg" alt="Joshua Graham" style={{ display:"block", width:150, height:190, objectFit:"cover", objectPosition:"50% 18%", border:`3px solid ${C.gold}`, boxSizing:"border-box" }}/>
            <div style={{ fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.14em", color:C.gold, marginTop:8, textTransform:"uppercase" }}>Joshua Graham</div>
          </div>
        </div>
      </div>
      {rateOk && (
        <div style={{ background:C.navy, color:"#fff" }}>
          <div style={{ maxWidth:860, margin:"0 auto", padding:"16px 18px", display:"flex", flexWrap:"wrap", gap:"6px 22px", alignItems:"baseline" }}>
            <span style={{ fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.2em", color:C.gold }}>ON MY DESK TODAY</span>
            <span style={{ fontFamily:F.display, fontWeight:800, fontSize:34, lineHeight:1.1 }}>{Number(rate.rate).toFixed(3)}%</span>
            <span style={{ fontSize:15, color:"#C9D6E3" }}>30-year fixed conventional · as of {asOfTxt} · example rate, not a quote</span>
          </div>
        </div>
      )}
      <div style={{ maxWidth:860, margin:"0 auto", padding:"26px 16px 40px", display:"flex", flexDirection:"column", gap:20 }}>
        {vid && !done && (
          <div style={{ ...panel, padding:14 }}>
            <div style={{ aspectRatio:"16 / 9", borderRadius:10, overflow:"hidden", background:"#000" }} aria-label={DESK_VIDEO_TITLE}>
              {vid.kind === "iframe" ? <iframe src={vid.src} title={DESK_VIDEO_TITLE} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ width:"100%", height:"100%", border:0 }}/> : <video src={vid.src} controls playsInline preload="metadata" style={{ width:"100%", height:"100%" }}/>}
            </div>
          </div>
        )}
        {done ? (
          <div style={panel}>
            <h2 style={{ fontFamily:F.display, fontWeight:800, color:C.maroon, margin:"0 0 8px", fontSize:26 }}>It's on my desk{first ? `, ${first}` : ""}.</h2>
            <p style={{ fontSize:16, lineHeight:1.6, margin:"0 0 14px" }}>I'll get back to you by {v.reach.toLowerCase()}, usually the same day. If your client is ready to talk options, book a 5-minute call.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap:10 }}>
              <a href={BRAND.booking} target="_blank" rel="noreferrer" style={btnS}>Book 5 minutes</a>
              <button onClick={() => { setDone(false); setV({ ...v, scenario:"" }); setTags([]); }} style={btnO}>Put another on my desk</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap:16 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <div style={eyebrow}>Step 1</div>
              <h2 style={{ fontFamily:F.display, fontWeight:800, margin:"4px 0 0", fontSize:24, color:C.maroon }}>What's on your desk?</h2>
              <p style={{ margin:"6px 0 0", color:C.muted, fontSize:15 }}>Please don't include your client's last name, SSN or account numbers. First name or initials is plenty.</p>
            </div>
            <div style={{ gridColumn:"1/-1", display:"flex", flexWrap:"wrap", gap:8 }}>
              {SCENARIO_TAGS.map((t) => <button type="button" key={t} onClick={() => tog(t)} style={{ font:"inherit", fontSize:14, fontWeight:600, padding:"9px 13px", borderRadius:2, cursor:"pointer", border:`1.5px solid ${tags.includes(t) ? C.navy : C.line}`, background:tags.includes(t) ? C.navy : "#fff", color:tags.includes(t) ? "#fff" : C.ink }}>{t}</button>)}
            </div>
            <label style={{ ...labelS, gridColumn:"1/-1" }}>The scenario<textarea value={v.scenario} onChange={set("scenario")} style={{ ...input, minHeight:120 }} placeholder="Seller wants to buy next. Self-employed 14 months, paid on 1099. Credit around 660. Wants to stay under $4,000 a month."/></label>
            <label style={labelS}>Where they are<select value={v.stage} onChange={set("stage")} style={input}><option value="">Select…</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label style={labelS}>Property state<input value={v.state} onChange={set("state")} style={input} maxLength={2} placeholder="FL"/></label>
            <div style={{ gridColumn:"1/-1", borderTop:`1px solid ${C.line}`, paddingTop:14 }}>
              <div style={eyebrow}>Step 2</div>
              <h2 style={{ fontFamily:F.display, fontWeight:800, margin:"4px 0 0", fontSize:22, color:C.maroon }}>How should I get back to you?</h2>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:10 }}>
                {REACH.map((r) => <button type="button" key={r} onClick={() => setV({ ...v, reach:r })} style={chipS(v.reach === r)} aria-pressed={v.reach === r}>{r}</button>)}
              </div>
              {known && <p style={{ margin:"10px 0 0", fontSize:15, color:C.muted }}>I have you as {first}{v.brokerage ? ` at ${v.brokerage}` : ""}, number ending {digits.slice(-4)}. <button type="button" onClick={() => setEdit(true)} style={{ font:"inherit", fontSize:15, background:"none", border:0, color:C.goldDk, fontWeight:700, cursor:"pointer", padding:0, textDecoration:"underline" }}>Change</button></p>}
            </div>
            {!known && <>
              <label style={labelS}>First name<input value={v.first} onChange={set("first")} style={input} autoComplete="given-name"/></label>
              <label style={labelS}>Last name<input value={v.last} onChange={set("last")} style={input} autoComplete="family-name"/></label>
              <label style={labelS}>Mobile phone<input value={v.phone} onChange={set("phone")} style={input} inputMode="tel" autoComplete="tel"/></label>
              <label style={labelS}>Brokerage<input value={v.brokerage} onChange={set("brokerage")} style={input} autoComplete="organization"/></label>
            </>}
            {showEmail && <label style={labelS}>{v.reach === "Email" ? "Email" : "Email (optional)"}<input value={v.email} onChange={set("email")} style={input} inputMode="email" autoComplete="email"/></label>}
            <label style={{ gridColumn:"1/-1", display:"flex", gap:10, alignItems:"flex-start", fontSize:14, lineHeight:1.5 }}>
              <input type="checkbox" checked={v.consent} onChange={set("consent")} style={{ marginTop:4, width:18, height:18 }}/>
              <span>I agree that Joshua Graham may contact me by phone, text or email about this scenario. Msg and data rates may apply.<NoSpam/></span>
            </label>
            {err && <div style={{ gridColumn:"1/-1", color:C.bad, fontWeight:600 }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ ...btnS, gridColumn:"1/-1", opacity:busy ? 0.6 : 1 }}>{busy ? "Sending…" : "Put it on Joshua's desk"}</button>
          </form>
        )}
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.5, textAlign:"center", margin:0 }}>Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. General guidance only, not a loan approval or commitment to lend.</p>
      </div>
    </div>
  );
}
