// Equity Unlock Estimator (BBYS-01): what a homeowner's equity can do for the next move.
// Inputs → contact gate (saves to calculator_leads, which drops the lead into Contacts with a follow-up today) → results.
import React, { useMemo, useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND, FOOTERS } from "../smart-money/data.js";
import BrandBar, { NoSpam } from "./BrandBar.jsx";

const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const UNLOCK_KEY = "gf_equity_unlocked";
const SELL_COST = 7;   // % of the sale price: agent commissions plus closing costs (editable)

const C = { navy:"#0E1B2A", sky:"#4FB0EA", ink:"#0E1B2A", muted:"#51647A", line:"#DCE3EB", bg:"#F3F6F9", card:"#FFFFFF", blue:"#1F6FA8", good:"#2E8B3E", warn:"#B7791F", bad:"#C0392B", mustard:"#D4A83F" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };

const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
const usd = (n) => (n < 0 ? "-$" : "$") + Math.round(Math.abs(n)).toLocaleString("en-US");
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "BBYS-01"; } catch { return "BBYS-01"; } };
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const commas = (v) => { const n = num(v); return n ? n.toLocaleString("en-US") : ""; };

export function computeEquity({ value, owed, sellPct, debts, nextPrice }) {
  const gross = value - owed;
  const sellCosts = value * (sellPct / 100);
  const net = gross - sellCosts;
  const afterDebts = net - debts;
  const downPct = nextPrice > 0 ? Math.max(0, afterDebts) / nextPrice * 100 : 0;
  const ltv = value > 0 ? owed / value * 100 : 0;
  return { gross, sellCosts, net, afterDebts, downPct, ltv, newLoan: Math.max(0, nextPrice - Math.max(0, afterDebts)) };
}

const input = { font:"inherit", fontSize:16, color:C.ink, background:"#fff", border:`1px solid ${C.line}`, borderRadius:8, padding:"10px 12px", width:"100%", boxSizing:"border-box", minWidth:0 };
const labelS = { display:"flex", flexDirection:"column", gap:6, fontWeight:600, fontSize:14 };
const panel = { background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:22 };
const btnS = { fontFamily:F.display, fontWeight:700, fontSize:16, background:C.blue, color:"#fff", border:0, borderRadius:10, padding:"14px 20px", cursor:"pointer", minHeight:48 };

function Field({ label, hint, money, pct, ...p }) {
  return (
    <label style={labelS}>
      <span>{label} {hint && <span style={{ fontWeight:400, color:C.muted, fontSize:13 }}>{hint}</span>}</span>
      <span style={{ position:"relative" }}>
        {money && <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.muted }}>$</span>}
        <input {...p} style={{ ...input, paddingLeft: money ? 26 : 12, paddingRight: pct ? 28 : 12 }}/>
        {pct && <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:C.muted }}>%</span>}
      </span>
    </label>
  );
}

function Inputs({ v, setV, compact }) {
  const set = (k, fmt) => (e) => setV({ ...v, [k]: fmt ? commas(e.target.value) : e.target.value });
  return (
    <div style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap:16 }}>
      <h2 style={{ gridColumn:"1/-1", fontFamily:F.display, margin:0, fontSize:20 }}>{compact ? "Your numbers" : "Start with your home"}</h2>
      <Field label="What your home is worth" hint="Your best guess" id="value" money inputMode="numeric" placeholder="550,000" value={v.value} onChange={set("value", true)}/>
      <Field label="What you still owe" hint="All mortgages and HELOCs" id="owed" money inputMode="numeric" placeholder="280,000" value={v.owed} onChange={set("owed", true)}/>
      <Field label="Debts you'd like gone" hint="Optional: cards, car, loans" id="debts" money inputMode="numeric" placeholder="0" value={v.debts} onChange={set("debts", true)}/>
      <Field label="Price of your next home" id="next" money inputMode="numeric" placeholder="625,000" value={v.next} onChange={set("next", true)}/>
      <Field label="Cost to sell" hint="Commissions + closing" id="sell" pct inputMode="decimal" value={v.sell} onChange={set("sell")}/>
      <label style={labelS}>State of your current home
        <select id="state" value={v.state} onChange={set("state")} style={input}><option value="">Select…</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
      </label>
    </div>
  );
}

function Gate({ v, onDone }) {
  const [f, setF] = useState({ first:"", last:"", email:"", phone:"", zip:"", consent:false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const phone = f.phone.replace(/\D/g, ""); const miss = [];
    if (!num(v.value)) miss.push("your home's value");
    if (!f.first.trim()) miss.push("first name");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) miss.push("a valid email");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (!v.state) miss.push("your state");
    if (!f.consent) miss.push("your consent to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const r = computeEquity({ value:num(v.value), owed:num(v.owed), sellPct:num(v.sell), debts:num(v.debts), nextPrice:num(v.next) });
    const summary = `Equity Unlock: value ${usd(num(v.value))}, owes ${usd(num(v.owed))}, net after selling ${usd(r.net)}, debts ${usd(num(v.debts))}, next home ${usd(num(v.next))} (${r.downPct.toFixed(0)}% down available)`;
    const lead = { first_name:f.first.trim(), last_name:f.last.trim() || null, email:f.email.trim(), phone, est_loan_amount: num(v.next) ? Math.round(r.newLoan) : null,
      property_state:v.state, zip:f.zip.trim() || null, consent:true, ref:getRef(), source:"equity-unlock",
      page_url:location.href.slice(0, 500), user_agent:navigator.userAgent.slice(0, 300),
      answers:{ summary, value:num(v.value), owed:num(v.owed), debts:num(v.debts), next_price:num(v.next), sell_pct:num(v.sell), net:Math.round(r.net), down_pct:Math.round(r.downPct) } };
    let { error } = await supabase.from("calculator_leads").insert(lead);
    if (error && /answers/.test(error.message || "")) { const { answers, ...rest } = lead; ({ error } = await supabase.from("calculator_leads").insert({ ...rest, source:"equity-unlock" })); }
    setBusy(false);
    if (error) return setErr("We couldn't save your info just now. Check your connection and try again, or call " + BRAND.phone + ".");
    ls.set(UNLOCK_KEY, "1"); onDone();
  };
  return (
    <form onSubmit={submit} noValidate style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap:16 }}>
      <div style={{ gridColumn:"1/-1" }}>
        <h2 style={{ fontFamily:F.display, margin:0, fontSize:22 }}>See what your equity can do</h2>
        <p style={{ margin:"6px 0 0", color:C.muted }}>Where should I send your numbers? You'll see them right away, and you can change the inputs as often as you like.</p>
      </div>
      <Field label="First name" id="first" autoComplete="given-name" value={f.first} onChange={set("first")}/>
      <Field label="Last name" id="last" autoComplete="family-name" value={f.last} onChange={set("last")}/>
      <Field label="Email" id="email" type="email" autoComplete="email" value={f.email} onChange={set("email")}/>
      <Field label="Phone" id="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")}/>
      <Field label="Zip" hint="Optional" id="zip" inputMode="numeric" maxLength={5} value={f.zip} onChange={set("zip")}/>
      <label style={{ gridColumn:"1/-1", display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:C.muted }}>
        <input id="consent" type="checkbox" checked={f.consent} onChange={set("consent")} style={{ marginTop:3, width:18, height:18 }}/>
        <span>I agree that Graham Financial, powered by Zero Point Mortgage Services, may contact me by phone, text or email at the information above, including by automated means. Consent is not a condition of any loan. Message and data rates may apply.<NoSpam/></span>
      </label>
      {err && <p style={{ gridColumn:"1/-1", color:C.bad, margin:0 }}>{err}</p>}
      <button type="submit" disabled={busy} style={{ ...btnS, gridColumn:"1/-1" }}>{busy ? "One moment…" : "Show my equity"}</button>
    </form>
  );
}

function Results({ v }) {
  const r = useMemo(() => computeEquity({ value:num(v.value), owed:num(v.owed), sellPct:num(v.sell), debts:num(v.debts), nextPrice:num(v.next) }), [v]);
  const row = (k, val, bold, color) => (<><dt style={{ color: bold ? C.ink : C.muted, fontWeight: bold ? 700 : 400 }}>{k}</dt><dd style={{ margin:0, textAlign:"right", fontWeight: bold ? 700 : 400, color: color || C.ink }}>{val}</dd></>);
  const marks = [5, 10, 20];
  const pos = Math.min(100, (r.downPct / 25) * 100);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ ...panel, background:C.navy, color:"#fff", borderColor:C.navy }}>
        <div style={{ fontFamily:F.display, fontSize:13, letterSpacing:"0.12em", textTransform:"uppercase", color:C.sky }}>Equity you could put to work</div>
        <div style={{ fontFamily:F.display, fontWeight:800, fontSize:"clamp(38px, 7vw, 56px)", lineHeight:1.05, fontVariantNumeric:"tabular-nums", color: r.afterDebts >= 0 ? "#fff" : "#F2A39A" }}>{usd(Math.max(0, r.afterDebts))}</div>
        <div style={{ color:"#B9C8D8", fontSize:15 }}>after selling costs{num(v.debts) ? " and paying off the debts you listed" : ""}</div>
      </div>
      <div style={panel}>
        <dl style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"6px 12px", margin:0, fontSize:15, fontVariantNumeric:"tabular-nums" }}>
          {row("Home value", usd(num(v.value)))}
          {row("What you owe", "−" + usd(num(v.owed)))}
          {row("Equity today", usd(r.gross), true)}
          {row(`Cost to sell (${num(v.sell)}%)`, "−" + usd(r.sellCosts))}
          {row("Equity after selling", usd(r.net), true)}
          {num(v.debts) > 0 && row("Debts paid off", "−" + usd(num(v.debts)))}
          {num(v.debts) > 0 && row("Left for your next home", usd(r.afterDebts), true, r.afterDebts < 0 ? C.bad : C.good)}
        </dl>
      </div>
      {num(v.next) > 0 && (
        <div style={panel}>
          <h3 style={{ fontFamily:F.display, margin:"0 0 4px", fontSize:18 }}>Toward a {usd(num(v.next))} home</h3>
          <p style={{ margin:"0 0 14px", color:C.muted }}>Your equity covers about <b style={{ color:C.ink }}>{r.downPct.toFixed(1)}%</b> of the price.</p>
          <div style={{ position:"relative", height:44 }} role="img" aria-label={`About ${r.downPct.toFixed(1)} percent of the next home's price`}>
            <div style={{ position:"absolute", left:0, right:0, top:8, height:12, borderRadius:6, background:C.line }}/>
            <div style={{ position:"absolute", left:0, top:8, height:12, borderRadius:6, width:`${pos}%`, background:C.blue }}/>
            {marks.map((m) => <span key={m} style={{ position:"absolute", top:24, left:`${(m / 25) * 100}%`, transform:"translateX(-50%)", fontSize:12, color:C.muted }}>{m}%</span>)}
          </div>
          <p style={{ margin:"8px 0 0", fontSize:14, color:C.muted }}>{r.downPct >= 20 ? "That's enough to skip mortgage insurance on most loans." : r.downPct >= 5 ? "That's a real down payment. Many buyers move with less." : "Even a smaller amount can work. There are options built for exactly this."}</p>
        </div>
      )}
      <div style={{ ...panel, borderColor:C.mustard }}>
        <h3 style={{ fontFamily:F.display, margin:"0 0 6px", fontSize:18 }}>The catch most people hit</h3>
        <p style={{ margin:"0 0 8px" }}>Your equity is stuck in your house until it sells, but you need it to buy the next one. There are ways to use it <b>before</b> you sell, so you move once, on your timeline, without two mortgages or a rush sale.</p>
        <p style={{ margin:"0 0 8px", color:C.muted }}>Every situation is different. I'll walk you through which path fits yours.</p>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <a href={BRAND.booking} target="_blank" rel="noreferrer" style={{ ...btnS, textDecoration:"none", display:"inline-block" }}>Book 15 minutes with me</a>
          <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} style={{ ...btnS, background:"#fff", color:C.blue, border:`1px solid ${C.blue}`, textDecoration:"none", display:"inline-block" }}>Call {BRAND.phone}</a>
        </div>
      </div>
    </div>
  );
}

export default function EquityUnlock() {
  const [unlocked, setUnlocked] = useState(!!ls.get(UNLOCK_KEY));
  const [v, setV] = useState({ value:"", owed:"", debts:"", next:"", sell:String(SELL_COST), state:"" });
  return (
    <div style={{ fontFamily:F.body, color:C.ink, background:C.bg, minHeight:"100vh", fontSize:16, lineHeight:1.5 }}>
      <BrandBar/>
      <header style={{ background:C.navy, color:"#fff" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"40px 16px 44px", display:"flex", flexDirection:"column", gap:10 }}>
          <p style={{ margin:0, fontFamily:F.display, fontWeight:700, fontSize:13, letterSpacing:"0.16em", textTransform:"uppercase", color:C.sky }}>Equity Unlock Estimator</p>
          <h1 style={{ margin:0, fontFamily:F.display, fontWeight:800, fontSize:"clamp(30px, 5vw, 46px)", lineHeight:1.08 }}>Your house has been quietly saving for your next move.</h1>
          <p style={{ margin:0, color:"#B9C8D8", fontSize:18, maxWidth:"60ch" }}>See how much equity you'd walk away with, what it does for your next down payment, and what's left after clearing debt.</p>
        </div>
      </header>
      <main style={{ maxWidth:1120, margin:"0 auto", padding:"32px 16px 48px", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap:24, alignItems:"start" }}>
        <Inputs v={v} setV={setV} compact={unlocked}/>
        {unlocked ? <Results v={v}/> : <Gate v={v} onDone={() => setUnlocked(true)}/>}
      </main>
      <footer style={{ maxWidth:1120, margin:"0 auto", padding:"0 16px 40px" }}>
        <p style={{ fontSize:12, color:C.muted, textAlign:"center", maxWidth:"90ch", margin:"0 auto" }}>Estimates for illustration only, based on the numbers you enter. Not an appraisal, an offer of credit or a prediction of home values. {FOOTERS.consumer}</p>
      </footer>
    </div>
  );
}
