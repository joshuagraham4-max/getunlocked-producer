// /p/<slug>: a referral partner's page (financial planner, divorce attorney or CPA). "Welcome, Phil."
// Hero and motion match /save (line-by-line headline, gold bar, maroon photo column with the slow drift, scroll reveals).
// Then: video, done-for-you with-me / without-me table, three moves, the private-line desk, leads both ways.
import React, { useEffect, useState } from "react";
import { BRAND } from "../smart-money/data.js";
import { loadPartner, PARTNER_COPY } from "./partners.js";
import { embedFor } from "./saveVideo.js";
import { SiteFooter, WhoLink, LogoLink, TopButtons } from "./SiteBits.jsx";

const C = { maroon:"#4A111C", navy:"#0E1B2A", gold:"#D9A566", plum:"#7E4B6F", cream:"#F6EEDF", muted:"#4A5568", line:"#E3D6BF", rose:"#E3C9CC" };
const ANTON = "'Anton', 'Arial Narrow', Impact, sans-serif", SANS = "'Montserrat', Arial, sans-serif", BODY = "'Public Sans', system-ui, sans-serif";
export const PARTNER_VIDEO = ""; // paste a YouTube, Vimeo, Loom or .mp4 link; empty shows a quiet placeholder

const CSS = `
.pp{font-family:${BODY};color:${C.navy};background:${C.cream};min-height:100vh}
.pp-top{background:#fff;border-bottom:4px solid ${C.plum}}
.pp-top>div{max-width:1000px;margin:0 auto;padding:12px 18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 12px}
.pp-hero{max-width:1000px;margin:0 auto;display:flex;align-items:stretch}
.pp-hero-l{flex:1;min-width:0;padding:34px 22px;display:flex;flex-direction:column;gap:14px;justify-content:center}
.pp-k{font:700 11px ${SANS};letter-spacing:.2em;text-transform:uppercase;color:${C.maroon}}
.pp-hi{font:700 20px ${SANS};color:${C.plum}}
.pp-h1{font:400 clamp(44px,11vw,88px)/1.0 ${ANTON};letter-spacing:.01em;text-transform:uppercase;margin:0;color:${C.navy}}
.pp-h1 .ln2{color:${C.maroon}}
.pp-bar{width:40px;height:4px;background:${C.gold};transform-origin:left;animation:ppbar .7s .95s ease-out both}
.pp-sub{font:400 17px/1.6 ${BODY};color:${C.muted};margin:0;max-width:560px}
.pp-ln{display:block;animation:ppln .65s cubic-bezier(.2,.7,.2,1) both}
.pp-photos{width:150px;flex:none;background:${C.maroon};display:flex;flex-direction:column;gap:12px;padding:0 0 16px}
.pp-photos .jbox{position:relative;overflow:hidden;aspect-ratio:1/1.85;background:${C.maroon};animation:ppph 1.5s 1.3s cubic-bezier(.2,.7,.2,1) both}
.pp-photos .jbox img{position:absolute;top:0;left:-22%;width:160%;max-width:none;height:auto;transform-origin:0 0;animation:ppdrift 9s ease-in-out 3s infinite}
.pp-photos .cap{padding:0 8px;text-align:center;font:700 10px/1.45 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:#fff;animation:ppph 1.2s 2.3s cubic-bezier(.2,.7,.2,1) both}
.pp-photos .cap span{color:${C.rose};font-weight:600}.pp-photos .cap a{color:#fff;text-decoration:none;letter-spacing:.04em}
@keyframes ppln{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:none}}
@keyframes ppbar{from{transform:scaleX(0)}to{transform:none}}
@keyframes ppph{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes ppdrift{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.pp-plum{height:10px;background:${C.plum}}
.pp-sec{max-width:880px;margin:0 auto;padding:44px 20px 0;text-align:center}
.pp-sec h2{font:400 clamp(30px,6vw,46px)/1.06 ${ANTON};letter-spacing:.01em;text-transform:uppercase;color:${C.navy};margin:10px auto 0;max-width:760px}
.pp-sec .lead{font:400 17px/1.6 ${BODY};color:${C.muted};margin:14px auto 0;max-width:640px}
.pp-vid{max-width:880px;margin:30px auto 0;padding:0 20px}
.pp-vid>div{position:relative;aspect-ratio:16/9;background:${C.navy};border:3px solid ${C.plum};display:flex;align-items:center;justify-content:center}
.pp-vid iframe,.pp-vid video{position:absolute;inset:0;width:100%;height:100%;border:0}
.pp-tbl{margin:26px auto 0;background:#fff;border:1px solid ${C.line};border-top:4px solid ${C.plum};text-align:left}
.pp-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid ${C.line}}
.pp-row:first-child{border-top:0}
.pp-row>div{padding:16px 20px;font-size:16px;line-height:1.5}
.pp-row .w{color:${C.muted}}.pp-row .w b{color:#B3261E;margin-right:8px}
.pp-row .m{font-weight:600;color:${C.navy};border-left:1px solid ${C.line}}.pp-row .m b{color:${C.plum};margin-right:8px}
.pp-head{background:${C.navy};color:#fff;font:800 12px ${SANS};letter-spacing:.16em}
.pp-head>div{padding:12px 20px}
.pp-solved{font:400 clamp(24px,5vw,34px) ${ANTON};text-transform:uppercase;color:${C.maroon};letter-spacing:.02em;margin-top:22px}
.pp-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px;margin-top:22px}
.pp-step{background:#fff;border:1px solid ${C.line};padding:24px 20px}
.pp-step .n{font:400 40px/1 ${ANTON};color:${C.plum}}
.pp-step .t{font:800 17px ${SANS};color:${C.navy};margin:10px 0 6px}
.pp-step .x{font-size:15px;line-height:1.55;color:${C.muted}}
.pp-desk{background:${C.navy};color:#fff;padding:40px 24px;border-bottom:6px solid ${C.plum};text-align:center}
.pp-tick{background:#08111C;border-top:6px solid ${C.plum};border-bottom:1px solid rgba(217,165,102,.35);overflow:hidden;white-space:nowrap;margin-top:44px}
.pp-tick-in{display:inline-flex;padding:13px 0;animation:pptick 38s linear infinite}
.pp-tick:hover .pp-tick-in{animation-play-state:paused}
.pp-tick span{font:700 12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:#C9D6E3;padding:0 26px;border-right:1px solid rgba(201,214,227,.22)}
.pp-tick .pp-tick-dup{padding:0;border:0}
.pp-tick b{color:${C.gold};font-weight:800;margin-left:8px}
.pp-tick i{font-style:normal;color:${C.rose}}
@keyframes pptick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.pp-desk h2{color:#fff}.pp-desk .lead{color:#C9D6E3}
.pp-btn{font:400 20px ${ANTON};letter-spacing:.08em;text-transform:uppercase;background:${C.maroon};color:#fff;border:0;border-bottom:4px solid ${C.plum};border-radius:2px;padding:16px 26px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:54px}
.pp-btn.ghost{background:#fff;color:${C.maroon};border:2px solid ${C.maroon};border-bottom:4px solid ${C.plum}}
.pp-fine{font-size:12px;color:${C.muted};line-height:1.5;text-align:center;max-width:880px;margin:36px auto 0;padding:0 20px 36px}
.rv{opacity:0;transform:translateY(22px);transition:opacity .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0ms)}
.rv.in{opacity:1;transform:none}
@media (max-width:640px){.pp-row{grid-template-columns:1fr}.pp-row .m{border-left:0;padding-top:0}.pp-row .w{padding-bottom:6px}.pp-head{display:none}.pp-photos{width:118px}.pp-hero-l{padding:26px 16px}}
@media (prefers-reduced-motion:reduce){.pp-tick{white-space:normal}.pp-tick-in{animation:none;flex-wrap:wrap;justify-content:center}.pp-tick .pp-tick-dup{display:none !important}.pp-ln,.pp-bar,.pp-photos .jbox,.pp-photos .jbox img,.pp-photos .cap{animation:none}.rv{opacity:1;transform:none;transition:none}}
`;

export default function PartnerPage() {
  const slug = (location.pathname.match(/\/p\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("p") || "";
  const [p, setP] = useState(undefined);
  useEffect(() => { let live = true; loadPartner(slug).then((x) => { if (live) setP(x || null); }); return () => { live = false; }; }, [slug]);
  useEffect(() => {
    if (p === undefined) return;
    const els = Array.from(document.querySelectorAll(".rv:not(.in)"));
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold:.12, rootMargin:"0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [p]);
  const [rates, setRates] = useState(null);
  useEffect(() => { fetch("/api/rates").then((r) => r.ok ? r.json() : {}).then((d) => setRates(d && d.r30 ? d : {})).catch(() => setRates({})); }, []);
  if (p === undefined) return <div style={{ minHeight:"100vh", background:C.cream }}/>;

  const type = p ? p.type : "planner";
  const t = PARTNER_COPY[type] || PARTNER_COPY.planner;
  const desk = `/scenario-desk?ref=PTR-${encodeURIComponent(p ? p.slug : "partner")}&for=${type}`;
  const vid = embedFor(PARTNER_VIDEO);
  const sms = `sms:${BRAND.phone.replace(/\D/g, "")}?&body=${encodeURIComponent(`Hi Joshua, it's ${p ? p.first : ""}${p && p.firm ? ` at ${p.firm}` : ""}. Yes, I'm interested in leads from you.`)}`;

  return (
    <div className="pp"><style>{CSS}</style>
      <div className="pp-top"><div><LogoLink to={location.pathname + location.search}/><TopButtons hideAgent noApply extra={p && p.logo ? <img src={p.logo} alt={p.firm} style={{ maxHeight:38, maxWidth:110, objectFit:"contain" }}/> : null}/></div></div>

      <section className="pp-hero">
        <div className="pp-hero-l">
          <div className="pp-k">{t.eyebrow}{p && p.firm ? ` · ${p.firm}` : ""}</div>
          <div className="pp-hi pp-ln" style={{ animationDelay:"0ms" }}>{p ? `Welcome, ${p.first}.` : "Welcome."}</div>
          <h1 className="pp-h1">{t.lines.map((x, i) => <span key={x} className={"pp-ln" + (i === 2 ? " ln2" : "")} style={{ animationDelay:`${(i + 1) * 260}ms` }}>{x}</span>)}</h1>
          <div className="pp-bar"/>
          <p className="pp-sub pp-ln" style={{ animationDelay:"1100ms" }}>{t.sub}</p>
        </div>
        <aside className="pp-photos">
          {p && p.photo && <img src={p.photo} alt={p.first} style={{ display:"block", width:"100%", height:170, objectFit:"cover", objectPosition:"50% 15%", animation:"ppph 1.4s 1.1s both" }}/>}
          {p && p.photo && <div className="cap">{p.first} {p.last || ""}<br/><span>{p.firm}</span></div>}
          <div className="jbox"><img src="/brand/joshua-plum-suit.jpg" alt="Joshua Graham"/></div>
          <div className="cap">Joshua Graham<br/><span>NMLS #169809</span><br/><a href={`tel:${BRAND.phone.replace(/\D/g, "")}`}>{BRAND.phone}</a></div>
          <div className="cap"><WhoLink label="Who is Joshua?" style={{ color:"#fff", fontSize:11 }}/></div>
        </aside>
      </section>
      <div className="pp-plum"/>

      <div className="pp-vid rv"><div>
        {vid ? (vid.kind === "iframe" ? <iframe src={vid.src} title="A word from Joshua" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/> : <video src={vid.src} controls playsInline preload="metadata"/>)
          : <div style={{ textAlign:"center", color:C.rose, font:`700 12px ${SANS}`, letterSpacing:"0.2em" }}>A 60-SECOND WORD FROM JOSHUA<div style={{ fontFamily:BODY, fontWeight:400, letterSpacing:0, fontSize:14, marginTop:6, color:"#C9D6E3" }}>Video slot</div></div>}
      </div></div>

      <section className="pp-sec">
        <div className="pp-k rv">Done for you</div>
        <h2 className="rv" style={{ "--d":"80ms" }}>Your client's house and financing nightmare. I solve it.</h2>
        <p className="lead rv" style={{ "--d":"160ms" }}>{t.pains}</p>
        <div className="pp-tbl rv" style={{ "--d":"200ms" }}>
          <div className="pp-row pp-head"><div>WITHOUT ME</div><div>WITH ME</div></div>
          {t.rows.map(([w, m], i) => (
            <div className="pp-row" key={i}><div className="w"><b>✗</b>{w}</div><div className="m"><b>✓</b>{m}</div></div>
          ))}
        </div>
        <div className="pp-solved rv">Name and phone number, and it's solved.</div>
      </section>

      <section className="pp-sec">
        <div className="pp-k rv">How it works</div>
        <h2 className="rv" style={{ "--d":"80ms" }}>Off your plate in three moves.</h2>
        <div className="pp-steps">
          {t.steps.map(([title, body], i) => (
            <div key={i} className="pp-step rv" style={{ "--d":`${i * 120}ms` }}><div className="n">{i + 1}</div><div className="t">{title}</div><div className="x">{body}</div></div>
          ))}
        </div>
      </section>

      <RateTicker rates={rates}/>
      <section className="pp-desk">
        <div className="pp-sec" style={{ padding:0 }}>
          <div className="pp-k rv" style={{ color:C.rose }}>Your private line</div>
          <h2 className="rv" style={{ "--d":"80ms" }}>{t.deskTitle}</h2>
          <p className="lead rv" style={{ "--d":"160ms" }}>{t.deskSub}</p>
          <div className="rv" style={{ "--d":"220ms", marginTop:22 }}>
            <div style={{ fontSize:15, color:C.rose, marginBottom:12 }}>Complete this once so I can tailor your desk to you.</div>
            <a href={desk} className="pp-btn">Access your tailored scenario desk</a>
            <div style={{ fontSize:14, color:"#C9D6E3", marginTop:14 }}>Rather talk? Text or call {BRAND.phone}.</div>
          </div>
        </div>
      </section>

      <section className="pp-sec">
        <div className="pp-k rv">Both ways</div>
        <h2 className="rv" style={{ "--d":"80ms" }}>Interested in leads from me?</h2>
        <p className="lead rv" style={{ "--d":"160ms" }}>{type === "cpa" ? "I work with a lot of investors and business owners who need a CPA who gets it. When they ask me for one, I want to send them to someone I trust. Tap below and I'll set up how they reach you." : type === "attorney" ? "When my clients need a family law attorney, I want to send them to someone I trust. Tap below and I'll set up how they reach you." : "When my clients need a financial advisor, I want to send them to someone I trust. Tap below and I'll set up how they reach you."}</p>
        <div className="rv" style={{ "--d":"220ms", marginTop:20 }}><a href={sms} className="pp-btn ghost">Yes, send me leads</a></div>
      </section>

      <p className="pp-fine">
        {t.footnote && <>{t.footnote}<br/></>}
        Joshua Graham, loan originator, NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. General guidance only, not a loan approval or commitment to lend.
      </p>
      <SiteFooter max={1000}/>
    </div>
  );
}

// Market strip above the private line: Freddie Mac national averages (market stats, not an offer), then "ask me" for the rest.
function RateTicker({ rates }) {
  const wk = rates && rates.date ? new Date(rates.date + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "";
  const items = [
    ...(rates && rates.r30 ? [<>30-yr fixed · national avg<b>{rates.r30.toFixed(2)}%</b></>, <>15-yr fixed · national avg<b>{rates.r15.toFixed(2)}%</b></>] : []),
    <>Conventional · FHA · VA · DSCR · Bank statement</>,
    <i>Ask me for today's wholesale rate</i>,
    ...(wk ? [<>Freddie Mac PMMS · week of {wk}</>] : []),
  ];
  const row = (k) => items.map((x, i) => <span key={k + i}>{x}</span>);
  return (
    <div className="pp-tick" aria-label="Mortgage rate market strip">
      <div className="pp-tick-in">{row("a")}<span className="pp-tick-dup" style={{ display:"contents" }}>{row("b")}</span></div>
    </div>
  );
}
