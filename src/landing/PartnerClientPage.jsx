// /pl/<slug>: the partner's client page (consumer-facing, co-branded with the planner or attorney and Joshua).
// A few tap questions + contact. Saves to calculator_leads (source "partner-lander", ref PTL-<slug>): files in Joshua's Contacts,
// buzzes Joshua's phone, and buzzes the partner's phone on their ntfy code (route_partner_lead, partner_pages_v2.sql).
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import { loadPartner } from "./partners.js";
import { SiteFooter, WhoLink, LogoLink, TopButtons } from "./SiteBits.jsx";
import { NoSpam } from "./BrandBar.jsx";

const C = { maroon:"#4A111C", navy:"#0E1B2A", gold:"#D9A566", plum:"#7E4B6F", cream:"#F6EEDF", muted:"#4A5568", line:"#E3D6BF", rose:"#E3C9CC" };
const ANTON = "'Anton', 'Arial Narrow', Impact, sans-serif", SANS = "'Montserrat', Arial, sans-serif", BODY = "'Public Sans', system-ui, sans-serif";

const COPY = {
  planner: {
    eyebrow: "Your mortgage, inside your plan",
    lines: ["Your home loan,", "built around", "your plan."],
    sub: (p) => `${p.first}${p.firm ? " at " + p.firm : ""} and I work together so your mortgage fits the plan you've built: the right payment, your assets left where they are, and no surprises at closing.`,
    qs: [
      { id:"goal", label:"What are you looking to do?", opts:["Buy a home", "Refinance", "Use my equity", "Downsize", "Pay it off faster", "Not sure yet"] },
      { id:"when", label:"When?", opts:["Now", "Within 3 months", "3 to 12 months", "Just planning"] },
      { id:"income", label:"Your income is mostly", opts:["Salary", "My own business", "Investments or retirement", "Commission"] },
    ],
    thanks: (p) => `Thank you. I'll reach out shortly, and ${p.first} will see the plan before anything is final.`,
  },
  attorney: {
    eyebrow: "The house, handled",
    lines: ["Keeping", "the house?", "Let's make it work."],
    sub: (p) => `${p.first}${p.firm ? " at " + p.firm : ""} handles your case. I handle the house and the mortgage, so the terms you agree to can actually close. Private, plain answers, no pressure.`,
    qs: [
      { id:"stage", label:"Where are things?", opts:["Just starting", "In mediation", "Agreement drafted", "Divorce final"] },
      { id:"house", label:"The house", opts:["I want to keep it", "We're selling", "Not sure yet"] },
      { id:"loan", label:"Current loan, if you know", opts:["FHA", "VA", "Conventional", "Not sure"] },
      { id:"when", label:"When does it need to be done?", opts:["Within 90 days", "3 to 6 months", "No deadline yet"] },
    ],
    thanks: (p) => `Thank you. I'll reach out shortly. Everything stays private, and I'll keep ${p.first} in the loop on the house.`,
  },
};

const CSS = `
.pc{font-family:${BODY};color:${C.navy};background:${C.cream};min-height:100vh}
.pc-top{background:#fff;border-bottom:4px solid ${C.plum}}
.pc-top>div{max-width:1000px;margin:0 auto;padding:12px 18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 12px}
.pc-hero{max-width:1000px;margin:0 auto;display:flex;align-items:stretch}
.pc-l{flex:1;min-width:0;padding:34px 22px;display:flex;flex-direction:column;gap:14px;justify-content:center}
.pc-k{font:700 11px ${SANS};letter-spacing:.2em;text-transform:uppercase;color:${C.maroon}}
.pc-h1{font:400 clamp(42px,10vw,80px)/1.0 ${ANTON};text-transform:uppercase;margin:0}
.pc-h1 .ln2{color:${C.maroon}}
.pc-ln{display:block;animation:pcln .65s cubic-bezier(.2,.7,.2,1) both}
.pc-bar{width:40px;height:4px;background:${C.gold};transform-origin:left;animation:pcbar .7s .95s ease-out both}
.pc-sub{font:400 17px/1.6 ${BODY};color:${C.muted};margin:0;max-width:560px}
.pc-photos{width:140px;flex:none;background:${C.maroon};display:flex;flex-direction:column;gap:10px;padding:0 0 14px}
.pc-photos img.a{display:block;width:100%;height:170px;object-fit:cover;object-position:50% 15%;animation:pcph 1.4s 1.1s both}
.pc-photos .jbox{position:relative;overflow:hidden;aspect-ratio:1/1.5;animation:pcph 1.5s 1.4s both}
.pc-photos .jbox img{position:absolute;top:0;left:-22%;width:160%;max-width:none;transform-origin:0 0;animation:pcdrift 9s ease-in-out 3s infinite}
.pc-photos .cap{padding:0 8px;text-align:center;font:700 10px/1.45 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:#fff}
.pc-photos .cap span{color:${C.rose};font-weight:600}
@keyframes pcln{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:none}}
@keyframes pcbar{from{transform:scaleX(0)}to{transform:none}}
@keyframes pcph{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes pcdrift{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.pc-form{max-width:760px;margin:30px auto 0;padding:0 16px}
.pc-card{background:#fff;border:1px solid ${C.line};border-top:4px solid ${C.plum};padding:26px 22px;display:grid;gap:18px}
.pc-q{font:700 12px ${SANS};letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}
.pc-chip{font:600 15px ${BODY};padding:10px 14px;border-radius:2px;cursor:pointer;border:1.5px solid ${C.line};background:#fff;color:${C.navy}}
.pc-chip.on{border-color:${C.navy};background:${C.navy};color:#fff}
.pc-in{font:inherit;font-size:16px;color:${C.navy};background:#fff;border:1px solid ${C.line};border-radius:4px;padding:12px;width:100%;box-sizing:border-box}
.pc-btn{font:400 20px ${ANTON};letter-spacing:.08em;text-transform:uppercase;background:${C.maroon};color:#fff;border:0;border-bottom:4px solid ${C.plum};border-radius:2px;padding:16px 26px;cursor:pointer;width:100%}
@media (max-width:640px){.pc-photos{width:112px}.pc-photos img.a{height:130px}.pc-l{padding:26px 16px}}
@media (prefers-reduced-motion:reduce){.pc-ln,.pc-bar,.pc-photos img.a,.pc-photos .jbox,.pc-photos .jbox img{animation:none}}
`;

export default function PartnerClientPage() {
  const slug = (location.pathname.match(/\/pl\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("p") || "";
  const [p, setP] = useState(undefined);
  const [q, setQ] = useState({});
  const [v, setV] = useState({ first:"", last:"", phone:"", email:"", state:"", consent:false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { let live = true; loadPartner(slug).then((x) => { if (live) setP(x || null); }); return () => { live = false; }; }, [slug]);
  if (p === undefined) return <div style={{ minHeight:"100vh", background:C.cream }}/>;
  const pp = p || { slug:"", first:"my partner", firm:"", type:"planner" };
  const t = COPY[pp.type] || COPY.planner;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const digits = v.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

  const submit = async (e) => {
    e.preventDefault(); setErr(""); const miss = [];
    if (!v.first.trim()) miss.push("your first name");
    if (digits.length < 10) miss.push("a 10-digit phone number");
    if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) miss.push("a valid email (or leave it blank)");
    if (!v.consent) miss.push("your OK to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const qa = t.qs.filter((x) => q[x.id]).map((x) => `${x.label} ${q[x.id]}`).join(" | ");
    const summary = `Client of ${pp.first}${pp.firm ? " (" + pp.firm + ")" : ""}, ${pp.type === "attorney" ? "family law" : "financial planner"} partner · ${qa}`;
    const { error } = await supabase.from("calculator_leads").insert({
      first_name:v.first.trim(), last_name:v.last.trim() || null, phone:digits, email:v.email.trim() || null,
      property_state:v.state.trim().toUpperCase().slice(0, 2) || null, consent:true, ref:`PTL-${pp.slug || "partner"}`, source:"partner-lander",
      page_url:location.href.slice(0, 500), user_agent:navigator.userAgent.slice(0, 300),
      answers:{ summary, partner_slug:pp.slug, partner_type:pp.type, qa:q } });
    setBusy(false);
    if (error) return setErr("That didn't send. Try again, or call " + BRAND.phone + ".");
    setDone(true); try { window.scrollTo({ top:0, behavior:"smooth" }); } catch {}
  };

  return (
    <div className="pc"><style>{CSS}</style>
      <div className="pc-top"><div><LogoLink to={location.pathname}/><TopButtons hideAgent extra={pp.logo ? <img src={pp.logo} alt={pp.firm} style={{ maxHeight:38, maxWidth:110, objectFit:"contain" }}/> : null}/></div></div>
      <section className="pc-hero">
        <div className="pc-l">
          <div className="pc-k">{t.eyebrow}</div>
          <h1 className="pc-h1">{(done ? ["You're in,", v.first.trim() + "."] : t.lines).map((x, i) => <span key={x + i} className={"pc-ln" + (i === 2 ? " ln2" : "")} style={{ animationDelay:`${i * 260}ms` }}>{x}</span>)}</h1>
          <div className="pc-bar"/>
          <p className="pc-sub pc-ln" style={{ animationDelay:"1000ms" }}>{done ? t.thanks(pp) : t.sub(pp)}</p>
        </div>
        <aside className="pc-photos">
          {pp.photo && <img className="a" src={pp.photo} alt={pp.first}/>}
          {pp.photo && <div className="cap">{pp.first} {pp.last || ""}<br/><span>{pp.firm}</span></div>}
          <div className="jbox"><img src="/brand/joshua-plum-suit.jpg" alt="Joshua Graham"/></div>
          <div className="cap">Joshua Graham<br/><span>NMLS #169809</span></div>
          <div className="cap"><WhoLink label="Who is Joshua?" style={{ color:"#fff", fontSize:11 }}/></div>
        </aside>
      </section>
      <div style={{ height:10, background:C.plum }}/>

      {!done && <form className="pc-form" onSubmit={submit} noValidate>
        <div className="pc-card">
          {t.qs.map((x) => (
            <div key={x.id}><div className="pc-q">{x.label}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{x.opts.map((o) => <button type="button" key={o} className={"pc-chip" + (q[x.id] === o ? " on" : "")} onClick={() => setQ({ ...q, [x.id]: q[x.id] === o ? "" : o })}>{o}</button>)}</div>
            </div>
          ))}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap:12 }}>
            <input className="pc-in" placeholder="First name" value={v.first} onChange={set("first")} autoComplete="given-name"/>
            <input className="pc-in" placeholder="Last name" value={v.last} onChange={set("last")} autoComplete="family-name"/>
            <input className="pc-in" placeholder="Mobile phone" value={v.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel"/>
            <input className="pc-in" placeholder="Email (optional)" value={v.email} onChange={set("email")} inputMode="email" autoComplete="email"/>
            <input className="pc-in" placeholder="State (FL, CO…)" value={v.state} onChange={set("state")} maxLength={2}/>
          </div>
          <label style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:14, lineHeight:1.5, color:C.muted }}>
            <input type="checkbox" checked={v.consent} onChange={set("consent")} style={{ marginTop:4 }}/>
            <span>I agree that Joshua Graham may contact me by phone, text or email, and share my request with {pp.first}. Msg and data rates may apply.<NoSpam/></span>
          </label>
          {err && <div style={{ color:"#B3261E" }}>{err}</div>}
          <button className="pc-btn" disabled={busy}>{busy ? "Sending…" : "Send it to Joshua"}</button>
        </div>
      </form>}

      <p style={{ fontSize:12, color:C.muted, lineHeight:1.5, textAlign:"center", maxWidth:820, margin:"30px auto 0", padding:"0 20px 36px" }}>
        Joshua Graham, loan originator, NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. {pp.type === "attorney" ? "Not legal advice. " : "Not investment advice. "}General guidance only, not a loan approval or commitment to lend.
      </p>
      <SiteFooter max={1000}/>
    </div>
  );
}
