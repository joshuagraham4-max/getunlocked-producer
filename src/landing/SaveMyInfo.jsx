// Save my info: the page every Bond flyer and post points to, styled like the flyers (bone ground, Bodoni, hairline ledger, red italic, navy panel).
// Pick what brings you here → talking points for that choice appear → short form → calculator_leads (source "save-my-info", ref from ?ref=)
// → existing triggers drop the lead into Contacts and ping the phone. Intro video comes from saveVideo.js (hidden until a link is set).
import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import { SAVE_VIDEO, SAVE_VIDEO_TITLE, embedFor } from "./saveVideo.js";

const C = { bone:"#EFEAE0", ink:"#101820", red:"#C8102E", navy:"#0E1B2A", mute:"#5A5F66", rule:"#101820", soft:"#D8D1C3" };
const SERIF = "'Bodoni Moda', 'Playfair Display', Georgia, serif", SANS = "'Montserrat', Arial, sans-serif";
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

// Talking points per choice, in the flyer's ledger shape: [label, sub, value, hot]. Examples only; the small print says so.
const WHO = [
  { id:"buyer", label:"Buying a home", sub:"First home, next home or moving up",
    head:["What if you only needed", "3% down, and I could get you 5%?"],
    rows:[["3% DOWN, $400K HOME", "What you bring", "$12,000", 0], ["ASSISTANCE TOWARD IT", "3.5% to 5% of the price", "$14K–$20K", 0], ["SELLER CREDITS", "3% to 6%, on almost every deal I closed this year", "$12K–$24K", 0], ["YOUR CASH TO CLOSE", "It can drop close to", "Near $0", 1]],
    fine:"Example: $400,000 purchase price, 3% down. Assistance and seller credits depend on program eligibility, lender and seller agreement, and are illustrative.",
    next:"I'll text you your next step today, and we'll run your real numbers." },
  { id:"homeowner", label:"I own a home", sub:"Equity, a low rate, a second property",
    head:["What would you do with", "$180,000 of equity?"],
    rows:[["80% OF YOUR HOME'S VALUE", "On a $600,000 home, up to", "$480,000", 0], ["MINUS WHAT YOU OWE", "Your mortgage balance", "−$300,000", 0], ["EQUITY YOU MAY BE ABLE TO USE", "The down payment on a rental, no sale", "$180,000", 1]],
    fine:"Example only: home value, balance and equity are illustrative. Equity available depends on value, lien position, credit and program guidelines.",
    next:"I'll text you today, and we'll see what your equity could do without touching your low rate." },
  { id:"investor", label:"Real estate investor", sub:"One property or a whole portfolio",
    head:["Is your portfolio financed", "as well as it was bought?"],
    rows:[["YOUR LOANS TODAY", "Placed one at a time, with whoever was there", "Scattered", 0], ["A PORTFOLIO REVIEW", "Every loan, rate and maturity on one page", "One page", 0], ["THE EDGE", "Several lenders, for every property you hold", "Options", 1]],
    fine:"Portfolio reviews are for business-purpose (investment) properties and are estimates based on the information you provide. No credit is pulled.",
    next:"I'll text you today. Ask me about the free portfolio review. No credit pull." },
  { id:"agent", label:"Real estate agent", sub:"Your buyers, your deals, your team",
    head:["Your buyer loves the house.", "The payment doesn't reach."],
    rows:[["THE PAYMENT YOUR BUYER CAN HOLD", "Example, all in", "$3,000", 0], ["A HALF-POINT LOWER RATE", "What a wholesale broker can often find", "−0.5%", 0], ["THE HOUSE THEY CAN NOW REACH", "More purchase price, same payment", "+$20K–25K", 1]],
    fine:"Example only: a $3,000 payment, a half-point lower rate and the added purchase price are illustrative and vary by scenario.",
    next:"I'll reach out today about your market, your buyers and training your team." },
];
const WHY = [["THE NATIONAL TOTAL", "Overpaid on mortgages, every year", "$65 billion", 0], ["YOUR SHARE", "About, per borrower, per year", "$3,300", 0], ["THE CAUSE", "Most buyers take one lender's quote", "1 quote", 0], ["THE FIX", "A wholesale broker shops several lenders for you", "Me", 1]];

const getWho = () => { try { const w = new URLSearchParams(location.search).get("who"); return WHO.some((x) => x.id === w) ? w : ""; } catch { return ""; } };
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "SAVE-01"; } catch { return "SAVE-01"; } };
const CSS = `
.sv{font-family:${SANS};color:${C.ink};background:${C.bone};min-height:100vh}
.sv *{box-sizing:border-box}
.sv-wrap{display:grid;grid-template-columns:minmax(0,1fr) 300px;max-width:1180px;margin:0 auto}
.sv-main{padding:34px 48px 56px}
.sv-side{background:${C.navy};color:${C.bone};position:sticky;top:0;align-self:start;height:100vh;padding:36px 28px;display:flex;flex-direction:column;gap:18px;overflow:hidden}
.sv-h1{font:600 clamp(40px,5.6vw,66px)/1.04 ${SERIF};margin:18px 0 0;letter-spacing:-.01em}
.sv-h1 i{display:block;font-weight:500;color:${C.red}}
.sv-k{font:700 12px ${SANS};letter-spacing:.2em;text-transform:uppercase;display:flex;gap:10px;align-items:center}
.sv-k:before{content:"";width:12px;height:12px;background:${C.red};display:inline-block}
.sv-sub{font:italic 400 17px/1.45 ${SERIF};color:${C.mute};margin:8px 0 0}
.sv-rule{border:0;border-top:2px solid ${C.rule};margin:30px 0 0}
.sv-hair{border:0;border-top:1px solid ${C.soft};margin:0}
.sv-lab{font:700 11px ${SANS};letter-spacing:.2em;text-transform:uppercase}
.sv-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:14px 0;border-bottom:1px solid ${C.soft}}
.sv-row .sub{font:400 16px ${SERIF};color:${C.ink}}
.sv-row .val{font:500 34px ${SERIF};white-space:nowrap}
.sv-row.hot .lab{color:${C.red}} .sv-row.hot .val{color:${C.red}}
.sv-choice{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;background:transparent;border:0;border-bottom:1px solid ${C.soft};padding:16px 0;cursor:pointer;color:${C.ink};min-height:56px}
.sv-choice .t{font:500 26px ${SERIF}} .sv-choice .s{font:400 14px ${SERIF};color:${C.mute};display:block;margin-top:2px}
.sv-choice .dot{width:22px;height:22px;border:2px solid ${C.ink};border-radius:50%;flex:none}
.sv-choice.on .t{color:${C.red}} .sv-choice.on .dot{background:${C.red};border-color:${C.red};box-shadow:inset 0 0 0 4px ${C.bone}}
.sv-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:20px 22px;margin-top:6px}
.sv-f{display:flex;flex-direction:column;gap:4px}
.sv-f span{font:700 11px ${SANS};letter-spacing:.18em;text-transform:uppercase}
.sv-f em{font:italic 400 13px ${SERIF};color:${C.mute};text-transform:none;letter-spacing:0;font-weight:400}
.sv-in{font:400 19px ${SERIF};color:${C.ink};background:transparent;border:0;border-bottom:2px solid ${C.ink};border-radius:0;padding:8px 0;width:100%;outline:none}
.sv-in:focus{border-bottom-color:${C.red}}
.sv-btn{font:700 15px ${SANS};letter-spacing:.14em;text-transform:uppercase;background:${C.red};color:#fff;border:0;padding:18px 26px;cursor:pointer;width:100%;min-height:56px}
.sv-btn:disabled{opacity:.6}
.sv-fine{font:400 11.5px/1.5 ${SANS};color:${C.mute}}
.sv-vid{position:relative;aspect-ratio:16/9;background:${C.navy};border:1px solid ${C.rule};margin-top:26px}
.sv-vid iframe,.sv-vid video{position:absolute;inset:0;width:100%;height:100%;border:0}
.sv-side h2{font:italic 500 38px/1.12 ${SERIF};margin:0}
.sv-side img.ph{width:100%;flex:1;min-height:0;object-fit:cover;object-position:50% 12%}
.sv-side .bar{width:36px;height:3px;background:#FF4B5C}
.sv-side a{color:${C.bone};text-decoration:none}
@media(max-width:900px){
 .sv-wrap{grid-template-columns:1fr}
 .sv-main{padding:24px 20px 40px}
 .sv-side{position:static;height:auto;flex-direction:row;align-items:center;padding:22px 20px}
 .sv-side img.ph{width:96px;height:120px;flex:none}
 .sv-side h2{font-size:26px}
 .sv-row .val{font-size:26px}
}`;

function Ledger({ rows }) {
  return <div style={{ borderTop:`2px solid ${C.rule}`, marginTop:12 }}>{rows.map(([l, s, v, hot], i) => (
    <div key={i} className={"sv-row" + (hot ? " hot" : "")}><div><div className="sv-lab lab">{l}</div><div className="sub">{s}</div></div><div className="val">{v}</div></div>))}</div>;
}

export default function SaveMyInfo() {
  const [f, setF] = useState({ who:getWho(), first:"", last:"", email:"", phone:"", city:"", state:"", zip:"", note:"", consent:false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const who = WHO.find((w) => w.id === f.who); const vid = embedFor(SAVE_VIDEO);

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
    setDone(true); try { window.scrollTo({ top:0, behavior:"smooth" }); } catch {}
  };

  return (
    <div className="sv"><style>{CSS}</style>
      <div className="sv-wrap">
        <main className="sv-main">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <img src="/brand/gf-logo-ink.png" alt="Graham Financial" style={{ height:54, width:"auto" }}/>
            <img src="/brand/zpm-logo-ink.png" alt="Zero Point Mortgage Services" style={{ height:36, width:"auto" }}/>
          </div>
          <div className="sv-k" style={{ marginTop:30 }}>Buyers · Homeowners · Investors · Agents</div>
          <h1 className="sv-h1">{done ? <>You're saved, {f.first.trim()}.</> : <>Save my info.<i>I'll show you your number.</i></>}</h1>
          <p className="sv-sub">{done ? `${who.next} It's not a sales call. When it has to go right, I'm your guy.` : "I'm a wholesale broker. I shop several lenders for you, so you get access to the best rates. Get a quote from anyone. Then get mine."}</p>

          {done ? (
            <div style={{ marginTop:30 }}>
              <hr className="sv-rule"/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,180px),1fr))", gap:12, marginTop:22 }}>
                <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} className="sv-btn" style={{ background:"transparent", color:C.ink, border:`2px solid ${C.ink}`, textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>Call me</a>
                <a href={BRAND.booking} target="_blank" rel="noreferrer" className="sv-btn" style={{ textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>Book a call</a>
              </div>
            </div>
          ) : (<>
            {vid && <div className="sv-vid" aria-label={SAVE_VIDEO_TITLE}>
              {vid.kind === "iframe" ? <iframe src={vid.src} title={SAVE_VIDEO_TITLE} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/> : <video src={vid.src} controls playsInline preload="metadata"/>}
            </div>}
            <hr className="sv-rule"/>
            <div className="sv-lab" style={{ marginTop:22 }}>What brings you here?</div>
            <div role="radiogroup" style={{ marginTop:6 }}>
              {WHO.map((w) => (
                <button key={w.id} type="button" role="radio" aria-checked={f.who === w.id} className={"sv-choice" + (f.who === w.id ? " on" : "")} onClick={() => setF({ ...f, who:w.id })}>
                  <span><span className="t">{w.label}</span><span className="s">{w.sub}</span></span><span className="dot"/>
                </button>))}
            </div>

            {who && <div style={{ marginTop:30 }}>
              <div className="sv-k">For you</div>
              <h2 style={{ font:`600 clamp(30px,4vw,44px)/1.08 ${SERIF}`, margin:"12px 0 0" }}>{who.head[0]}<br/><i style={{ fontWeight:500, color:C.red }}>{who.head[1]}</i></h2>
              <Ledger rows={who.rows}/>
              <p className="sv-fine" style={{ marginTop:10 }}>{who.fine}</p>
            </div>}

            <form onSubmit={submit} noValidate style={{ marginTop:34 }}>
              <hr className="sv-rule" style={{ marginTop:0 }}/>
              <div className="sv-lab" style={{ margin:"22px 0 8px" }}>Where do I send your number?</div>
              <div className="sv-fields">
                <label className="sv-f"><span>First name</span><input className="sv-in" value={f.first} onChange={set("first")} autoComplete="given-name"/></label>
                <label className="sv-f"><span>Last name</span><input className="sv-in" value={f.last} onChange={set("last")} autoComplete="family-name"/></label>
                <label className="sv-f"><span>Email</span><input className="sv-in" type="email" value={f.email} onChange={set("email")} autoComplete="email"/></label>
                <label className="sv-f"><span>Phone</span><input className="sv-in" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel"/></label>
                <label className="sv-f"><span>City or area</span><input className="sv-in" value={f.city} onChange={set("city")} autoComplete="address-level2"/></label>
                <label className="sv-f"><span>State</span>
                  <select className="sv-in" value={f.state} onChange={set("state")}><option value="">Select…</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label className="sv-f"><span>Zip <em>optional</em></span><input className="sv-in" value={f.zip} onChange={set("zip")} inputMode="numeric" maxLength={5} autoComplete="postal-code"/></label>
                <label className="sv-f" style={{ gridColumn:"1/-1" }}><span>What would you like to know? <em>optional</em></span><textarea className="sv-in" rows={2} value={f.note} onChange={set("note")} style={{ resize:"vertical" }}/></label>
              </div>
              <label style={{ display:"flex", gap:10, alignItems:"flex-start", margin:"22px 0 10px" }} className="sv-fine">
                <input type="checkbox" checked={f.consent} onChange={set("consent")} style={{ marginTop:2, width:18, height:18, accentColor:C.red, flex:"none" }}/>
                <span>I agree that Graham Financial, powered by Zero Point Mortgage Services, may contact me by phone, text or email at the information above, including by automated means. Consent is not a condition of any purchase or loan. Message and data rates may apply.</span>
              </label>
              <p style={{ font:`italic 500 17px/1.4 ${SERIF}`, margin:"4px 0 16px" }}>You will not be spammed. You'll only hear from me, Joshua Graham, a real live person. It's not a sales call.</p>
              {err && <p style={{ color:C.red, font:`600 14px ${SANS}`, margin:"0 0 12px" }}>{err}</p>}
              <button className="sv-btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Save my info"}</button>
            </form>

            <div style={{ marginTop:44 }}>
              <div className="sv-k">Why me</div>
              <h2 style={{ font:`600 clamp(30px,4vw,44px)/1.08 ${SERIF}`, margin:"12px 0 0" }}>Buyers leave $65 billion<br/><i style={{ fontWeight:500, color:C.red }}>a year on the table.</i></h2>
              <Ledger rows={WHY}/>
              <p style={{ font:`italic 500 20px ${SERIF}`, margin:"14px 0 0" }}>Get a quote from anyone. Then get mine.</p>
            </div>
          </>)}

          <p className="sv-fine" style={{ marginTop:44 }}>Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. Source: Bankrate research, July 2026, based on 2025 mortgage data: about $65 billion a year in mortgage overpayments nationwide; about $3,300 is the national average per borrower per year. Your own savings will vary. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.</p>
        </main>
        <aside className="sv-side">
          <div className="bar"/>
          <h2>When it has to go right, I'm your guy.</h2>
          <img className="ph" src="/brand/joshua-plum-suit.jpg" alt="Joshua Graham"/>
          <div style={{ font:`700 12px/1.6 ${SANS}`, letterSpacing:".12em" }}>
            JOSHUA GRAHAM<br/><span style={{ color:"#FF4B5C" }}>REGIONAL LOAN ORIGINATOR</span><br/><span style={{ fontWeight:500, opacity:.8 }}>NMLS #169809</span><br/>
            <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} style={{ font:`500 22px ${SERIF}`, letterSpacing:0 }}>{BRAND.phone}</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
