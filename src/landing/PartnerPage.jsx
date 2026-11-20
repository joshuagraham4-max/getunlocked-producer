// /p/<slug>: a referral partner's page (financial planner or divorce attorney). "Welcome, Phil."
// Video, the with-me / without-me checklist, how easy it is, then Register, which opens the Scenario Desk in partner mode.
// MOCK: partners come from partners.js. No database changes yet.
import React, { useEffect, useState } from "react";
import { BRAND } from "../smart-money/data.js";
import { loadPartner, PARTNER_COPY } from "./partners.js";
import { embedFor } from "./saveVideo.js";
import { SiteFooter, WhoLink, LogoLink, TopButtons } from "./SiteBits.jsx";

const C = { maroon:"#4A111C", navy:"#0E1B2A", gold:"#D9A566", plum:"#7E4B6F", cream:"#F6EEDF", ink:"#0E1B2A", muted:"#4A5568", line:"#E3D6BF", rose:"#E3C9CC" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif", anton:"'Anton', 'Arial Narrow', Impact, sans-serif" };
export const PARTNER_VIDEO = ""; // paste a YouTube, Vimeo, Loom or .mp4 link; empty shows a quiet placeholder
const eyebrow = { fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:C.maroon };
const h2 = { fontFamily:F.anton, fontWeight:400, textTransform:"uppercase", letterSpacing:"0.02em", color:C.navy, margin:"6px 0 0", fontSize:"clamp(28px, 6vw, 38px)", lineHeight:1.08 };
const btn = { fontFamily:F.anton, fontSize:20, letterSpacing:"0.08em", textTransform:"uppercase", background:C.maroon, color:"#fff", border:0, borderBottom:`4px solid ${C.plum}`, borderRadius:2, padding:"16px 26px", textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", minHeight:54 };

export default function PartnerPage() {
  const slug = (location.pathname.match(/\/p\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("p") || "";
  const [p, setP] = useState(undefined);
  useEffect(() => { let live = true; loadPartner(slug).then((x) => { if (live) setP(x || null); }); return () => { live = false; }; }, [slug]);
  if (p === undefined) return <div style={{ minHeight:"100vh", background:C.cream }}/>;
  const type = p ? p.type : "planner";
  const t = PARTNER_COPY[type];
  const desk = `/scenario-desk?ref=PTR-${encodeURIComponent(p ? p.slug : "partner")}&for=${type}`;
  const vid = embedFor(PARTNER_VIDEO);

  return (
    <div style={{ fontFamily:F.body, color:C.ink, minHeight:"100vh", background:C.cream }}>
      <style>{`.pp-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid ${C.line}}.pp-row>div{padding:16px 18px;font-size:16px;line-height:1.5}
@media(max-width:640px){.pp-row{grid-template-columns:1fr}.pp-row>div:first-child{padding-bottom:4px}.pp-head{display:none !important}}`}</style>
      <div style={{ background:"#fff", borderBottom:`4px solid ${C.plum}` }}>
        <div style={{ maxWidth:920, margin:"0 auto", padding:"12px 18px", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"10px 12px" }}>
          <LogoLink to={location.pathname + location.search}/>
          <TopButtons hideAgent noApply/>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background:C.maroon, color:"#F6ECE9", borderBottom:`10px solid ${C.plum}` }}>
        <div style={{ maxWidth:920, margin:"0 auto", padding:"40px 18px 36px", display:"flex", flexWrap:"wrap", gap:28, alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ flex:"1 1 420px", minWidth:0 }}>
            <div style={{ fontFamily:F.display, fontWeight:700, fontSize:11, letterSpacing:"0.22em", color:C.rose }}>{t.eyebrow}{p && p.firm ? ` · ${p.firm.toUpperCase()}` : ""}</div>
            <div style={{ fontFamily:F.display, fontWeight:700, fontSize:20, color:"#fff", margin:"14px 0 4px" }}>{p ? `Welcome, ${p.first}.` : "Welcome."}</div>
            <h1 style={{ fontFamily:F.anton, fontWeight:400, fontSize:"clamp(42px, 10vw, 68px)", lineHeight:1.02, textTransform:"uppercase", margin:"4px 0 12px", color:"#fff" }}>{t.headline}</h1>
            <div style={{ width:40, height:4, background:C.gold, marginBottom:14 }}/>
            <p style={{ fontSize:18, lineHeight:1.55, color:C.rose, margin:0, maxWidth:560 }}>{t.sub}</p>
          </div>
          <div style={{ flex:"0 0 auto", width:150 }}>
            <img src="/brand/joshua-plum-suit.jpg" alt="Joshua Graham" style={{ display:"block", width:150, height:200, objectFit:"cover", objectPosition:"50% 10%", border:`3px solid ${C.plum}`, boxSizing:"border-box" }}/>
            <div style={{ fontFamily:F.display, fontWeight:700, fontSize:11, letterSpacing:"0.14em", color:C.rose, marginTop:8, textTransform:"uppercase", textAlign:"center" }}>Joshua Graham<div style={{ marginTop:4 }}><WhoLink label="Who is Joshua?" style={{ color:"#fff", fontSize:11 }}/></div></div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:920, margin:"0 auto", padding:"28px 16px 44px", display:"flex", flexDirection:"column", gap:30 }}>
        {/* Video */}
        <div style={{ background:"#fff", border:`1px solid ${C.line}`, padding:12 }}>
          <div style={{ aspectRatio:"16 / 9", background:C.navy, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
            {vid ? (vid.kind === "iframe"
              ? <iframe src={vid.src} title="A word from Joshua" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ width:"100%", height:"100%", border:0 }}/>
              : <video src={vid.src} controls playsInline preload="metadata" style={{ width:"100%", height:"100%" }}/>)
              : <div style={{ textAlign:"center", color:C.rose, fontFamily:F.display, fontWeight:700, fontSize:12, letterSpacing:"0.2em" }}>A 60-SECOND WORD FROM JOSHUA<div style={{ fontFamily:F.body, fontWeight:400, letterSpacing:0, fontSize:14, marginTop:6, color:"#C9D6E3" }}>Video slot</div></div>}
          </div>
        </div>

        {/* The pain, then the checklist */}
        <section>
          <div style={eyebrow}>The nightmare, and how it ends</div>
          <h2 style={h2}>With me, and without me.</h2>
          <p style={{ fontSize:17, lineHeight:1.6, color:C.muted, margin:"10px 0 18px", maxWidth:700 }}>{t.pains}</p>
          <div style={{ background:"#fff", border:`1px solid ${C.line}`, borderTop:`4px solid ${C.plum}` }}>
            <div className="pp-row pp-head" style={{ borderTop:0, background:C.navy, color:"#fff", fontFamily:F.display, fontWeight:800, fontSize:12, letterSpacing:"0.16em" }}>
              <div>WITHOUT ME</div><div>WITH ME</div>
            </div>
            {t.rows.map(([without, withMe], i) => (
              <div className="pp-row" key={i} style={i === 0 ? { borderTop:0 } : null}>
                <div style={{ color:C.muted }}><span style={{ color:"#B3261E", fontWeight:700, marginRight:8 }}>✗</span>{without}</div>
                <div style={{ fontWeight:600, color:C.navy }}><span style={{ color:C.plum, fontWeight:800, marginRight:8 }}>✓</span>{withMe}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily:F.anton, fontSize:"clamp(24px, 5vw, 32px)", textTransform:"uppercase", color:C.maroon, marginTop:18, letterSpacing:"0.02em" }}>Name and phone number, and it's solved.</div>
        </section>

        {/* How easy */}
        <section>
          <div style={eyebrow}>How it works</div>
          <h2 style={h2}>Off your plate in three moves.</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap:14, marginTop:16 }}>
            {t.steps.map(([title, body], i) => (
              <div key={i} style={{ background:"#fff", border:`1px solid ${C.line}`, padding:20 }}>
                <div style={{ fontFamily:F.anton, fontSize:34, color:C.plum, lineHeight:1 }}>{i + 1}</div>
                <div style={{ fontFamily:F.display, fontWeight:800, fontSize:17, color:C.navy, margin:"10px 0 6px" }}>{title}</div>
                <div style={{ fontSize:15, lineHeight:1.55, color:C.muted }}>{body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Register gate */}
        <section style={{ background:C.navy, color:"#fff", padding:"30px 24px", borderBottom:`6px solid ${C.plum}` }}>
          <div style={{ ...eyebrow, color:C.rose }}>Your private line</div>
          <h2 style={{ ...h2, color:"#fff" }}>{t.deskTitle}</h2>
          <p style={{ fontSize:17, lineHeight:1.6, color:"#C9D6E3", margin:"10px 0 20px", maxWidth:620 }}>{t.deskSub}</p>
          <a href={desk} style={btn}>Register for my desk</a>
          <div style={{ fontSize:14, color:"#C9D6E3", marginTop:14 }}>Rather talk? Text or call {BRAND.phone}.</div>
        </section>

        {/* Leads the other way: one tap texts Joshua */}
        <section style={{ background:"#fff", border:`1px solid ${C.line}`, borderTop:`4px solid ${C.plum}`, padding:"26px 24px" }}>
          <div style={eyebrow}>Both ways</div>
          <h2 style={h2}>Interested in leads from me?</h2>
          <p style={{ fontSize:17, lineHeight:1.6, color:C.muted, margin:"10px 0 18px", maxWidth:620 }}>{type === "attorney" ? "When my clients need a family law attorney, I want to send them to someone I trust. Tap below and I'll set up how they reach you." : "When my clients need a financial advisor, I want to send them to someone I trust. Tap below and I'll set up how they reach you."}</p>
          <a href={`sms:${BRAND.phone.replace(/\D/g, "")}?&body=${encodeURIComponent(`Hi Joshua, it's ${p ? p.first : ""}${p && p.firm ? ` at ${p.firm}` : ""}. Yes, I'm interested in leads from you.`)}`} style={{ ...btn, background:"#fff", color:C.maroon, border:`2px solid ${C.maroon}`, borderBottom:`4px solid ${C.plum}` }}>Yes, send me leads</a>
        </section>

        <p style={{ fontSize:12, color:C.muted, lineHeight:1.5, textAlign:"center", margin:0 }}>
          {t.footnote && <>{t.footnote}<br/></>}
          Joshua Graham, loan originator, NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. General guidance only, not a loan approval or commitment to lend.
        </p>
      </div>
      <SiteFooter max={920}/>
    </div>
  );
}
