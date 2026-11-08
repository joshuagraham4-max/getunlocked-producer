// Portfolio Review survey funnel: one question per screen, then contact, then the "dead money" result.
// Submissions go to portfolio_reviews; a database trigger turns each one into an investor lead on Joshua's call list.
import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND, FOOTERS } from "../smart-money/data.js";
import BrandBar, { NoSpam } from "./BrandBar.jsx";

const BOOKING = "https://calendar.app.google/nz1sdrnBGK1D4LXh7";
const C = { navy:"#0E1B2A", sky:"#4FB0EA", ink:"#0E1B2A", muted:"#51647A", line:"#DCE3EB", bg:"#F3F6F9", card:"#FFFFFF", blue:"#1F6FA8", gold:"#D4A537", good:"#2E8B3E", bad:"#C0392B" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "PORTFOLIO-REVIEW"; } catch { return "PORTFOLIO-REVIEW"; } };

const Q = [
  { k:"working_on", q:"What are you working on?", opts:["Cash out a rental","Get out of a hard money loan","Buy the next property","Refinance a high rate","Something else (ask me anything)"] },
  { k:"rentals", q:"How many rentals do you own?", opts:["1","2-4","5-10","10+"] },
  { k:"equity", q:"Roughly how much equity is sitting in them?", opts:["Under $100K","$100-250K","$250-500K","$500K+"] },
  { k:"hard_money", q:"Any of them on hard money or a bridge loan?", opts:["Yes, due soon","Yes","No"] },
  { k:"rent_type", q:"How do they rent?", opts:["Long-term","Short-term (Airbnb)","Mix"] },
  { k:"llc", q:"Owned in an LLC?", opts:["Yes","No","Thinking about it"] },
  { k:"states", q:"What state are the properties in?", text:true, placeholder:"Florida, Colorado..." },
  { k:"scenario", q:"Your scenario, in your own words.", sub:"Ask me anything. Weird deals welcome.", long:true, optional:true },
];
// Equity bracket -> usable cash (keeping 25% equity in every property) -> more rentals.
// Example math: 15% down plus ~3% closing per purchase; $600-$1,500/mo cash flow per door after the payment.
// Doors = how many purchases the equity covers. Change these numbers here; the page and disclaimer follow.
const FLOW_LO = 600, FLOW_HI = 1500, DOWN = 0.15, COSTS = 0.03;
const PLAY = {
  "Under $100K": { cash:60000,  price:300000 },
  "$100-250K":   { cash:130000, price:350000 },
  "$250-500K":   { cash:280000, price:350000 },
  "$500K+":      { cash:375000, price:350000, plus:true },
};
for (const p of Object.values(PLAY)) p.doors = Math.max(1, Math.floor(p.cash / (p.price * (DOWN + COSTS))));
const pct = (n) => Math.round(n * 100) + "%";
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const k$ = (n) => "$" + (n >= 1000000 ? (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M" : Math.round(n / 1000) + "K");

const btn = { fontFamily:F.display, fontWeight:700, fontSize:16, background:C.blue, color:"#fff", border:0, borderRadius:10, padding:"14px 20px", cursor:"pointer", minHeight:48 };
const opt = (on) => ({ fontFamily:F.body, fontSize:17, textAlign:"left", background: on ? "#E3F0FA" : "#fff", color:C.ink, border:`2px solid ${on ? C.blue : C.line}`, borderRadius:12, padding:"15px 18px", cursor:"pointer", width:"100%" });
const input = { font:"inherit", fontSize:16, color:C.ink, background:"#fff", border:`1px solid ${C.line}`, borderRadius:8, padding:"12px 14px", width:"100%", boxSizing:"border-box" };

function Shell({ children }) {
  return (
  <div style={{ minHeight:"100vh", background:C.bg, fontFamily:F.body, color:C.ink }}>
    <BrandBar max={640}/>
    <header style={{ background:C.navy, color:"#fff", padding:"22px 20px" }}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <p style={{ margin:0, fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.sky }}>Free portfolio review</p>
        <h1 style={{ margin:"6px 0 0", fontFamily:F.display, fontWeight:800, fontSize:28, lineHeight:1.15 }}>Is your equity working for you?</h1>
        <p style={{ margin:"6px 0 0", color:"#C9D6E3", fontSize:15 }}>Joshua Graham, AVP · Graham Financial, powered by Zero Point Mortgage Services</p>
          <p style={{ margin:"8px 0 0", color:"#fff", fontSize:15, lineHeight:1.5 }}>Nine quick questions. I'll show you how much of your equity is sitting idle and what it could be doing, from small portfolios to large ones.</p>
      </div>
    </header>
    <main style={{ maxWidth:640, margin:"0 auto", padding:"24px 20px 40px" }}>{children}
      <p style={{ fontSize:12, color:C.muted, marginTop:32 }}>{FOOTERS.business}</p>
    </main>
  </div>
);
}

export default function PortfolioReview() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState({});
  const [f, setF] = useState({ first:"", last:"", phone:"", email:"", best_time:"", text_ok:true, consent:false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const total = Q.length + 1;
  const cur = Q[step];
  const pick = (v) => { setA((x) => ({ ...x, [cur.k]:v })); setTimeout(() => setStep((s) => s + 1), 180); };

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const phone = f.phone.replace(/\D/g, ""), email = f.email.trim();
    if (!f.first.trim()) return setErr("Please add your first name.");
    if (phone.length < 10 && !/@/.test(email)) return setErr("Add a cell number or an email so I can send your review.");
    if (!f.consent) return setErr("Please check the box so I'm allowed to contact you.");
    setBusy(true);
    const { error } = await supabase.from("portfolio_reviews").insert({
      first_name:f.first.trim(), last_name:f.last.trim() || null, phone:f.phone.trim() || null, email:email || null,
      working_on:a.working_on, rentals:a.rentals, equity:a.equity, hard_money:a.hard_money, rent_type:a.rent_type, llc:a.llc,
      states:a.states || null, scenario:(a.scenario || "").trim() || null, best_time:f.best_time.trim() || null,
      text_ok:f.text_ok, consent:true, ref:getRef(),
    });
    setBusy(false);
    if (error) return setErr(`That didn't go through. Text me instead at ${BRAND.phone} and I'll take it from there.`);
    setDone(true); try { window.scrollTo(0, 0); } catch {}
  };


  if (done) {
    const pl = PLAY[a.equity];
    const need = pl ? pl.price * (DOWN + COSTS) : 0;
    const left = pl ? Math.max(0, pl.cash - need * pl.doors) : 0;
    const lo = pl ? FLOW_LO * pl.doors : 0, hi = pl ? FLOW_HI * pl.doors : 0;
    return (
      <Shell>
        <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:24 }}>
          <p style={{ margin:0, fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.14em", textTransform:"uppercase", color:C.muted }}>Your first look</p>
          {pl ? <>
            <h2 style={{ fontFamily:F.display, fontWeight:800, fontSize:28, lineHeight:1.2, margin:"8px 0" }}>Your equity could buy <span style={{ color:C.good }}>{pl.doors}{pl.plus ? "+" : ""} more {k$(pl.price)} rental{pl.doors > 1 || pl.plus ? "s" : ""}</span>.</h2>
            <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)", gap:10, margin:"14px 0" }}>
              <div style={{ background:"#EAF5EE", borderRadius:10, padding:"14px 16px" }}>
                <div style={{ fontFamily:F.display, fontWeight:800, fontSize:"clamp(18px, 5vw, 28px)", color:C.good, lineHeight:1.15 }}>{money(lo)}-{money(hi)}{pl.plus ? "+" : ""}<span style={{ fontSize:"0.6em" }}>/mo</span></div>
                <div style={{ fontSize:14, color:C.muted }}>new cash flow</div></div>
              <div style={{ background:"#EAF5EE", borderRadius:10, padding:"14px 16px" }}>
                <div style={{ fontFamily:F.display, fontWeight:800, fontSize:"clamp(18px, 5vw, 28px)", color:C.good, lineHeight:1.15 }}>{k$(lo * 12)}-{k$(hi * 12)}{pl.plus ? "+" : ""}<span style={{ fontSize:"0.6em" }}>/yr</span></div>
                <div style={{ fontSize:14, color:C.muted }}>every year you hold them</div></div>
            </div>
            <p style={{ fontSize:16, lineHeight:1.55, margin:"0 0 14px" }}>Without selling anything or putting in your own cash. You'd still keep 25% equity in every property you own now{left >= 10000 ? <>, with about <b>{k$(left)}</b> left over for reserves</> : ""}.</p>
            <p style={{ fontSize:16, lineHeight:1.55, color:C.muted, margin:"0 0 14px" }}>That's your dead money: about <b>{k$(pl.cash)}{pl.plus ? "+" : ""}</b> sitting in your rentals right now, earning nothing.</p>
          </> : <h2 style={{ fontFamily:F.display, fontWeight:800, fontSize:26, margin:"8px 0" }}>Let's find your dead money.</h2>}
          <ul style={{ fontSize:16, lineHeight:1.7, margin:"0 0 18px", paddingLeft:20 }}>
            <li>Buy your next property, where the rent qualifies the loan instead of your tax return</li>
            {a.hard_money && a.hard_money !== "No" && <li>Pay off the hard money loan before it comes due</li>}
            <li>Build reserves so one vacancy never becomes a problem</li>
          </ul>
          <div style={{ background:C.bg, borderRadius:10, padding:"14px 16px", margin:"0 0 16px" }}>
            <p style={{ margin:"0 0 6px", fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.14em", textTransform:"uppercase", color:C.muted }}>How I work</p>
            <ul style={{ fontSize:15, lineHeight:1.65, margin:0, paddingLeft:20 }}>
              <li>25 years in. I'm the one people call for the loans other lenders couldn't close.</li>
              <li>Speed: investor loans closed in as little as 10 days.</li>
              <li>Broker access to wholesale pricing from multiple lenders, which can mean a bigger approval on the same rent.</li>
              <li>The rent qualifies the loan. No tax returns, no pay stubs, no pile of paperwork.</li>
              <li>Last week: a family with old, tangled liens. We cleared them, got them about $100K in two weeks, and mapped out their other properties around how long they plan to hold them.</li>
            </ul>
          </div>
          <p style={{ fontSize:16, fontWeight:600, margin:"0 0 14px" }}>Next is your deep dive: I'll pull current values on every property you own and show you exactly what's available, property by property. Tell me the best time to call you, or book with me here at your convenience.</p>
          <div style={{ display:"grid", gap:10 }}>
            <a href={BOOKING} style={{ ...btn, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>Book my deep dive</a>
            <a href={`sms:${BRAND.phone.replace(/\D/g, "")}?body=${encodeURIComponent(`Hi Joshua, it's ${f.first}. I just did the portfolio review.`)}`} style={{ ...btn, background:"#fff", color:C.blue, border:`2px solid ${C.blue}`, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>Text Joshua now</a>
            <a href={BRAND.apply} target="_blank" rel="noreferrer" style={{ ...btn, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>Apply here</a>
          </div>
          <p style={{ fontSize:13, color:C.muted, marginTop:14 }}>Example only: about {money(need || 63000)} per purchase ({pct(DOWN)} down plus about {pct(COSTS)} closing costs) and {money(FLOW_LO)}-{money(FLOW_HI)}/mo cash flow per door after the payment. {pct(DOWN)} down is available on qualifying purchases; credit, property and reserves apply. Your values, rents and terms will differ. Business-purpose loans, for scenario review only. Not an offer to lend.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ height:6, borderRadius:3, background:C.line, overflow:"hidden", marginBottom:18 }}><div style={{ height:"100%", width:`${(step / total) * 100}%`, background:C.blue, transition:"width .25s" }}/></div>
      {step < Q.length ? (
        <div>
          <p style={{ margin:0, fontSize:13, color:C.muted }}>Question {step + 1} of {total}</p>
          <h2 style={{ fontFamily:F.display, fontWeight:800, fontSize:24, margin:"6px 0 4px" }}>{cur.q}</h2>
          {cur.sub && <p style={{ margin:"0 0 12px", color:C.muted }}>{cur.sub}</p>}
          <div style={{ display:"grid", gap:10, marginTop:14 }}>
            {cur.opts && cur.opts.map((o) => <button key={o} onClick={() => pick(o)} style={opt(a[cur.k] === o)}>{o}</button>)}
            {cur.text && <input autoFocus value={a[cur.k] || ""} placeholder={cur.placeholder} onChange={(e) => setA((x) => ({ ...x, [cur.k]:e.target.value }))} style={input}/>}
            {cur.long && <textarea autoFocus rows={5} value={a[cur.k] || ""} placeholder="Short-term rental, LLC, mixed-use, the bank said no... tell me about it." onChange={(e) => setA((x) => ({ ...x, [cur.k]:e.target.value }))} style={{ ...input, resize:"vertical" }}/>}
            {(cur.text || cur.long) && <button onClick={() => setStep((s) => s + 1)} disabled={cur.text && !cur.optional && !(a[cur.k] || "").trim()} style={{ ...btn, opacity: cur.text && !(a[cur.k] || "").trim() ? 0.5 : 1 }}>{cur.long && !(a[cur.k] || "").trim() ? "Skip" : "Next"}</button>}
          </div>
          {step > 0 && <button onClick={() => setStep((s) => s - 1)} style={{ background:"none", border:0, color:C.muted, marginTop:16, cursor:"pointer", fontSize:14 }}>Back</button>}
        </div>
      ) : (
        <form onSubmit={submit} style={{ display:"grid", gap:12 }}>
          <p style={{ margin:0, fontSize:13, color:C.muted }}>Last step</p>
          <h2 style={{ fontFamily:F.display, fontWeight:800, fontSize:24, margin:"0 0 4px" }}>Where do I send your review?</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <input placeholder="First name" autoComplete="given-name" value={f.first} onChange={(e) => setF({ ...f, first:e.target.value })} style={input}/>
            <input placeholder="Last name" autoComplete="family-name" value={f.last} onChange={(e) => setF({ ...f, last:e.target.value })} style={input}/>
          </div>
          <input placeholder="Cell phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone:e.target.value })} style={input}/>
          <input placeholder="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email:e.target.value })} style={input}/>
          <input placeholder="Best time to call you (optional)" value={f.best_time} onChange={(e) => setF({ ...f, best_time:e.target.value })} style={input}/>
          <label style={{ display:"flex", gap:10, fontSize:15 }}><input type="checkbox" checked={f.text_ok} onChange={(e) => setF({ ...f, text_ok:e.target.checked })} style={{ width:18, height:18 }}/>Text me instead of calling</label>
          <label style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:C.muted }}>
            <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent:e.target.checked })} style={{ marginTop:3, width:18, height:18 }}/>
            <span>I agree that Graham Financial, powered by Zero Point Mortgage Services, may contact me by phone, text or email at the information above, including by automated means. Consent is not a condition of any loan. Message and data rates may apply.<NoSpam/></span>
          </label>
          {err && <p style={{ color:C.bad, margin:0 }}>{err}</p>}
          <button type="submit" disabled={busy} style={btn}>{busy ? "Sending..." : "Show me my dead money"}</button>
          <button type="button" onClick={() => setStep((s) => s - 1)} style={{ background:"none", border:0, color:C.muted, cursor:"pointer", fontSize:14 }}>Back</button>
        </form>
      )}
    </Shell>
  );
}
