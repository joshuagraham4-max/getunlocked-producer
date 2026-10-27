import React, { useMemo, useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND, FOOTERS } from "../smart-money/data.js";

const SKOOL_URL = ""; // add the Smart Money Skool invite link when it's ready
const TAX_RATE = 0.0125, INS_RATE = 0.002; // estimates when taxes/insurance are left blank
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const UNLOCK_KEY = "gf_rental_calc_unlocked";

const C = { navy: "#0E1B2A", sky: "#4FB0EA", ink: "#0E1B2A", muted: "#51647A", line: "#DCE3EB", bg: "#F3F6F9", card: "#FFFFFF", blue: "#1F6FA8", good: "#2E8B3E", warn: "#B7791F", bad: "#C0392B" };
const F = { display: "'Montserrat', Arial, sans-serif", body: "'Public Sans', system-ui, sans-serif" };

const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
const usd = (n, d = 2) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "RENTAL-CALC"; } catch { return "RENTAL-CALC"; } };
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

export function compute({ loan, ratePct, years, tax, ins, hoa, income }) {
  const r = ratePct / 100 / 12, n = years * 12;
  const pi = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
  const io = loan * r;
  const taxUsed = tax ?? (loan * TAX_RATE) / 12, insUsed = ins ?? (loan * INS_RATE) / 12;
  const escrow = taxUsed + insUsed + hoa;
  return { pi, io, taxUsed, insUsed, hoa, income, fixedPmt: pi + escrow, ioPmt: io + escrow, fixedDscr: income / (pi + escrow), ioDscr: income / (io + escrow) };
}

const input = { font: "inherit", fontSize: 16, color: C.ink, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", width: "100%", boxSizing: "border-box", minWidth: 0 };
const labelS = { display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 };
const panel = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 };
const btnS = { fontFamily: F.display, fontWeight: 700, fontSize: 16, background: C.blue, color: "#fff", border: 0, borderRadius: 10, padding: "14px 20px", cursor: "pointer", minHeight: 48 };

function Field({ label, hint, money, ...p }) {
  return (
    <label style={labelS}>
      <span>{label} {hint && <span style={{ fontWeight: 400, color: C.muted, fontSize: 13 }}>{hint}</span>}</span>
      <span style={{ position: "relative" }}>
        {money && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }}>$</span>}
        <input {...p} style={{ ...input, paddingLeft: money ? 26 : 12 }} />
      </span>
    </label>
  );
}

function Gate({ onDone }) {
  const [f, setF] = useState({ first: "", last: "", email: "", phone: "", loan: "", state: "", zip: "", consent: false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const phone = f.phone.replace(/\D/g, ""); const miss = [];
    if (!f.first.trim()) miss.push("first name");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) miss.push("a valid email");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (!num(f.loan)) miss.push("an estimated loan amount");
    if (!f.state) miss.push("the property state");
    if (!f.consent) miss.push("your consent to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const lead = { first_name: f.first.trim(), last_name: f.last.trim() || null, email: f.email.trim(), phone, est_loan_amount: num(f.loan),
      property_state: f.state, zip: f.zip.trim() || null, consent: true, ref: getRef(), source: "rental-calculator",
      page_url: location.href.slice(0, 500), user_agent: navigator.userAgent.slice(0, 300) };
    const { error } = await supabase.from("calculator_leads").insert(lead);
    setBusy(false);
    if (error) return setErr("We couldn't save your info just now. Check your connection and try again, or call " + BRAND.phone + ".");
    ls.set(UNLOCK_KEY, String(lead.est_loan_amount)); onDone(lead.est_loan_amount, true);
  };
  return (
    <form onSubmit={submit} noValidate style={{ ...panel, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16 }}>
      <div style={{ gridColumn: "1/-1" }}>
        <h2 style={{ fontFamily: F.display, margin: 0, fontSize: 22 }}>Unlock the calculator</h2>
        <p style={{ margin: "6px 0 0", color: C.muted }}>Tell us about your property, then run as many scenarios as you like.</p>
      </div>
      <Field label="First name" id="first" autoComplete="given-name" value={f.first} onChange={set("first")} />
      <Field label="Last name" id="last" autoComplete="family-name" value={f.last} onChange={set("last")} />
      <Field label="Email" id="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
      <Field label="Phone" id="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} />
      <Field label="Estimated loan amount" id="loanEst" money inputMode="numeric" placeholder="450,000" value={f.loan} onChange={set("loan")} />
      <label style={labelS}>Property state
        <select id="state" value={f.state} onChange={set("state")} style={input}><option value="">Select…</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
      </label>
      <Field label="Property zip" hint="Optional" id="zip" inputMode="numeric" maxLength={5} value={f.zip} onChange={set("zip")} />
      <label style={{ gridColumn: "1/-1", display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: C.muted }}>
        <input id="consent" type="checkbox" checked={f.consent} onChange={set("consent")} style={{ marginTop: 3, width: 18, height: 18 }} />
        <span>I agree that Graham Financial, powered by Zero Point Mortgage Services, may contact me by phone, text or email at the information above, including by automated means. Consent is not a condition of any loan. Message and data rates may apply.</span>
      </label>
      {err && <p style={{ gridColumn: "1/-1", color: C.bad, margin: 0 }}>{err}</p>}
      <button type="submit" disabled={busy} style={{ ...btnS, gridColumn: "1/-1" }}>{busy ? "Unlocking…" : "Unlock the calculator"}</button>
    </form>
  );
}

function status(d) {
  if (d >= 1) return [C.good, "Rent covers the payment"];
  if (d >= 0.75) return [C.warn, "Below 1.0 — some programs still allow this"];
  return [C.bad, "Rent falls well short of the payment"];
}

function ResultCard({ title, ratio, piLabel, piVal, total, r, taxEst, insEst, str }) {
  const [col, msg] = status(ratio); const pos = (Math.max(0, Math.min(2, ratio)) / 2) * 100;
  const row = (k, v, bold) => (<><dt style={{ color: bold ? C.ink : C.muted, fontWeight: bold ? 700 : 400 }}>{k}</dt><dd style={{ margin: 0, textAlign: "right", fontWeight: bold ? 700 : 400 }}>{v}</dd></>);
  return (
    <div style={{ ...panel, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontFamily: F.display, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>{title}</div>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 44, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{ratio.toFixed(2)}</div>
      <span style={{ alignSelf: "flex-start", fontSize: 13, fontWeight: 700, color: col, background: col + "1F", borderRadius: 999, padding: "4px 10px" }}>{msg}</span>
      <div style={{ position: "relative", height: 40 }} role="img" aria-label={`Ratio ${ratio.toFixed(2)} on a 0 to 2 scale`}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 8, height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${C.bad} 0 37.5%, ${C.warn} 37.5% 50%, ${C.good} 50% 100%)` }} />
        <div style={{ position: "absolute", top: 2, left: `${pos}%`, width: 3, height: 24, background: C.ink, borderRadius: 2, transform: "translateX(-50%)" }} />
        {[[0, "0"], [37.5, "0.75"], [50, "1.0"], [75, "1.5"], [100, "2"]].map(([l, t]) => <span key={t} style={{ position: "absolute", top: 24, left: `${l}%`, transform: "translateX(-50%)", fontSize: 12, color: C.muted }}>{t}</span>)}
      </div>
      <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 12px", margin: 0, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
        {row(piLabel, usd(piVal))}{row(`Taxes${taxEst ? " (est.)" : ""}`, usd(r.taxUsed))}{row(`Insurance${insEst ? " (est.)" : ""}`, usd(r.insUsed))}{row("HOA", usd(r.hoa))}
        {row("Total payment", usd(total), true)}{row(str ? "Monthly STR income" : "Monthly rent", usd(r.income))}
      </dl>
    </div>
  );
}

function Calculator({ estLoan }) {
  const [v, setV] = useState({ loan: (estLoan || 450000).toLocaleString("en-US"), term: "30", rate: "7.125", tax: "", ins: "", hoa: "0", income: "4,500", str: false });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const loan = num(v.loan);
  const r = useMemo(() => compute({ loan, ratePct: num(v.rate), years: num(v.term) || 30, tax: v.tax.trim() === "" ? null : num(v.tax), ins: v.ins.trim() === "" ? null : num(v.ins), hoa: num(v.hoa), income: num(v.income) }), [v]);
  const step = (d) => setV({ ...v, rate: Math.max(0, num(v.rate) + d).toFixed(3) });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 24, alignItems: "start" }}>
      <div style={{ ...panel, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 16 }}>
        <h2 style={{ gridColumn: "1/-1", fontFamily: F.display, margin: 0, fontSize: 20 }}>Your property</h2>
        <Field label="Loan amount" id="loan" money inputMode="numeric" value={v.loan} onChange={set("loan")} />
        <Field label="Amortization (years)" id="term" inputMode="numeric" value={v.term} onChange={set("term")} />
        <label style={{ ...labelS, gridColumn: "1/-1" }}>Interest rate (%)
          <span style={{ display: "flex" }}>
            <button type="button" onClick={() => step(-0.125)} aria-label="Lower rate by one eighth" style={{ width: 44, border: `1px solid ${C.line}`, background: "#fff", borderRadius: "8px 0 0 8px", fontSize: 20, cursor: "pointer" }}>−</button>
            <input id="rate" inputMode="decimal" value={v.rate} onChange={set("rate")} style={{ ...input, borderRadius: 0, textAlign: "center" }} />
            <button type="button" onClick={() => step(0.125)} aria-label="Raise rate by one eighth" style={{ width: 44, border: `1px solid ${C.line}`, background: "#fff", borderRadius: "0 8px 8px 0", fontSize: 20, cursor: "pointer" }}>+</button>
          </span>
        </label>
        <Field label="Monthly taxes" hint={v.tax.trim() === "" ? `Est. ${usd((loan * TAX_RATE) / 12)}` : ""} id="tax" money inputMode="decimal" value={v.tax} onChange={set("tax")} />
        <Field label="Monthly insurance" hint={v.ins.trim() === "" ? `Est. ${usd((loan * INS_RATE) / 12)}` : ""} id="ins" money inputMode="decimal" value={v.ins} onChange={set("ins")} />
        <Field label="Monthly HOA" id="hoa" money inputMode="decimal" value={v.hoa} onChange={set("hoa")} />
        <div style={{ gridColumn: "1/-1", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[[false, "Long-term rental"], [true, "Short-term (Airbnb, VRBO)"]].map(([val, lab]) => (
            <label key={lab} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${v.str === val ? C.blue : C.line}`, borderRadius: 999, padding: "8px 14px", cursor: "pointer" }}>
              <input type="radio" name="rtype" checked={v.str === val} onChange={() => setV({ ...v, str: val })} /> {lab}
            </label>
          ))}
        </div>
        <div style={{ gridColumn: "1/-1" }}><Field label={v.str ? "Average monthly STR income (12-month)" : "Monthly rent"} id="income" money inputMode="decimal" value={v.income} onChange={set("income")} /></div>
        <p style={{ gridColumn: "1/-1", margin: 0, fontSize: 13, color: C.muted }}>Leave taxes or insurance blank and we'll use an estimate. Florida insurance often runs higher, so a real quote gives you the truest number.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 16 }}>
          <ResultCard title="Fixed rate" ratio={r.fixedDscr} piLabel="Principal & interest" piVal={r.pi} total={r.fixedPmt} r={r} taxEst={v.tax.trim() === ""} insEst={v.ins.trim() === ""} str={v.str} />
          <ResultCard title="Interest only" ratio={r.ioDscr} piLabel="Interest only" piVal={r.io} total={r.ioPmt} r={r} taxEst={v.tax.trim() === ""} insEst={v.ins.trim() === ""} str={v.str} />
        </div>
        <div style={panel}>
          <h3 style={{ fontFamily: F.display, margin: "0 0 6px" }}>Want a real quote?</h3>
          <p style={{ margin: "0 0 8px", color: C.muted }}>I'll price this scenario across my lenders and tell you where it lands.</p>
          <p style={{ margin: 0, fontWeight: 700, userSelect: "all" }}>Joshua Graham · {BRAND.phone}</p>
          <p style={{ margin: 0, userSelect: "all" }}>{BRAND.email}</p>
        </div>
      </div>
    </div>
  );
}

function Welcome() {
  return (
    <div style={{ ...panel, borderColor: C.sky, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 18 }}>You're in. Run as many scenarios as you like.</div>
      {SKOOL_URL
        ? <p style={{ margin: 0 }}>Want the strategy behind the numbers? <a href={SKOOL_URL} target="_blank" rel="noreferrer" style={{ color: C.blue, fontWeight: 700 }}>Join the Smart Money community</a> — free lessons on how investors finance and scale.</p>
        : <p style={{ margin: 0, color: C.muted }}>Watch your inbox — your invite to the Smart Money community is on the way.</p>}
    </div>
  );
}

export default function RentalCalculator() {
  const prior = ls.get(UNLOCK_KEY);
  const [unlocked, setUnlocked] = useState(prior ? { loan: num(prior), fresh: false } : null);
  return (
    <div style={{ fontFamily: F.body, color: C.ink, background: C.bg, minHeight: "100vh", fontSize: 16, lineHeight: 1.5 }}>
      <header style={{ background: C.navy, color: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 16px 44px", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontFamily: F.display, fontWeight: 700, fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: C.sky }}>{BRAND.motto}</p>
          <h1 style={{ margin: 0, fontFamily: F.display, fontWeight: 800, fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.08 }}>Run the REAL numbers on your next rental.</h1>
          <p style={{ margin: 0, color: "#B9C8D8", fontSize: 18, maxWidth: "60ch" }}>See whether the rent covers the payment on a fixed and an interest-only loan, with taxes and insurance counted in.</p>
          <p style={{ margin: 0, color: "#7F93A8", fontSize: 13, fontFamily: F.display, fontWeight: 600 }}>{BRAND.tag}</p>
        </div>
      </header>
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 16px 48px", display: "flex", flexDirection: "column", gap: 24 }}>
        {unlocked ? (<>{unlocked.fresh && <Welcome />}<Calculator estLoan={unlocked.loan} /></>) : <Gate onDone={(loan, fresh) => setUnlocked({ loan, fresh })} />}
      </main>
      <footer style={{ maxWidth: 1120, margin: "0 auto", padding: "0 16px 40px" }}>
        <p style={{ fontSize: 12, color: C.muted, textAlign: "center", maxWidth: "90ch", margin: "0 auto" }}>{FOOTERS.business} This calculator is an estimate for scenario review only.</p>
      </footer>
    </div>
  );
}
