// Small shared pieces for the public pages: Get approved button, "Who is Joshua Graham" popup,
// the "Powered by ZPM" mark, and the DPA estimate. Plain inline styles so every page can use them.
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BRAND } from "../smart-money/data.js";

const A = "'Anton', 'Arial Narrow', Impact, sans-serif";
const M = "'Montserrat', Arial, sans-serif";
const P = "'Public Sans', system-ui, sans-serif";
const NAVY = "#0E1B2A", MAROON = "#4A111C", PLUM = "#7E4B6F", CREAM = "#F6EEDF", LINE = "#E3D6BF", MUTE = "#4A5568";

export const APPLY_URL = BRAND.apply || "https://approvedbyjoshua.com";

export function ApplyNow({ style }) {
  return (
    <a href={APPLY_URL} target="_blank" rel="noreferrer"
      style={{ fontFamily:M, fontWeight:800, fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", textDecoration:"none", background:MAROON, color:"#fff", borderBottom:`3px solid ${PLUM}`, borderRadius:2, padding:"11px 14px", whiteSpace:"nowrap", display:"inline-block", ...style }}>
      Get approved
    </a>
  );
}

// Small, bottom-right mark. Reads like a copyright line.
export function PoweredBy({ style }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:8, fontFamily:P, fontSize:10, letterSpacing:"0.06em", color:MUTE, ...style }}>
      Powered by <img src="/brand/zpm-logo-ink.png" alt="Zero Point Mortgage Services" style={{ height:18, width:"auto", opacity:0.85 }}/>
    </span>
  );
}

export function SiteFooter({ max = 1000 }) {
  return (
    <footer style={{ borderTop:`4px solid ${PLUM}`, background:"#fff" }}>
      <div style={{ maxWidth:max, margin:"0 auto", padding:"14px 20px", display:"flex", flexWrap:"wrap", gap:"10px 18px", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 16px", alignItems:"center", fontFamily:P, fontSize:12, color:MUTE }}>
          <WhoLink style={{ color:NAVY }}/>
          <span>Joshua Graham NMLS #169809 · {BRAND.phone}</span>
        </div>
        <PoweredBy/>
      </div>
    </footer>
  );
}

export function WhoLink({ label = "Who is Joshua Graham?", style }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        style={{ all:"unset", cursor:"pointer", fontFamily:P, fontSize:12, fontWeight:700, letterSpacing:"0.04em", textDecoration:"underline", textUnderlineOffset:3, ...style }}>
        {label}
      </button>
      {open && createPortal(<WhoModal onClose={() => setOpen(false)}/>, document.body)}
    </>
  );
}

function WhoModal({ onClose }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Who is Joshua Graham" onClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(14,27,42,.72)", display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"24px 14px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:CREAM, width:"100%", maxWidth:640, borderTop:`10px solid ${PLUM}`, position:"relative", boxShadow:"0 20px 60px rgba(0,0,0,.35)" }}>
        <button type="button" onClick={onClose} aria-label="Close"
          style={{ all:"unset", position:"absolute", top:8, right:10, cursor:"pointer", fontFamily:M, fontWeight:800, fontSize:26, lineHeight:1, color:NAVY, padding:"4px 10px", zIndex:2 }}>×</button>
        <div style={{ display:"flex", flexWrap:"wrap" }}>
          <div style={{ flex:"0 0 190px", maxWidth:"100%", background:MAROON, width:190, minHeight:260, position:"relative", overflow:"hidden", margin:"0 auto" }}>
            <img src="/brand/joshua-plum-suit.jpg" alt="Joshua Graham" style={{ position:"absolute", top:0, left:"-22%", width:"160%", maxWidth:"none", height:"auto" }}/>
          </div>
          <div style={{ flex:"1 1 280px", minWidth:0, padding:"26px 24px 8px" }}>
            <div style={{ fontFamily:M, fontWeight:700, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:MAROON }}>Since 2001</div>
            <h2 style={{ fontFamily:A, fontWeight:400, fontSize:38, lineHeight:1.02, textTransform:"uppercase", letterSpacing:"0.01em", margin:"8px 0 4px", color:NAVY }}>Joshua Graham</h2>
            <div style={{ fontFamily:M, fontWeight:700, fontSize:13, color:MUTE }}>Senior Mortgage Strategist</div>
          </div>
        </div>
        <div style={{ padding:"8px 24px 24px", fontFamily:P, color:NAVY }}>
          <p style={{ fontSize:16, lineHeight:1.6, margin:"14px 0 0" }}>I help buyers, owners and investors with the deals other lenders walk away from: VA loans, self-employed borrowers, non-QM, DSCR investment loans and credit-challenged files.</p>
          <p style={{ fontSize:16, lineHeight:1.6, margin:"12px 0 0" }}>Since 2001 I've personally produced over $200 million in loans and overseen and managed over $500 million. I'm a wholesale broker, so I shop many banks and give you options.</p>
          <p style={{ fontSize:16, lineHeight:1.6, margin:"12px 0 0" }}>Most buyers who think they can't qualify actually can. Let's find out.</p>
          <div style={{ marginTop:16, borderTop:`1px solid ${LINE}`, paddingTop:12, fontSize:13, lineHeight:1.55, color:MUTE }}>
            <b style={{ color:NAVY }}>Agency and conventional loans:</b> Colorado.<br/>
            <b style={{ color:NAVY }}>Business-purpose (DSCR) loans:</b> most states.
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:18 }}>
            <a href={BRAND.booking} target="_blank" rel="noreferrer" style={{ flex:"1 1 200px", textAlign:"center", textDecoration:"none", fontFamily:A, fontSize:19, letterSpacing:"0.08em", textTransform:"uppercase", background:MAROON, color:"#fff", borderBottom:`4px solid ${PLUM}`, padding:"14px 18px", borderRadius:2 }}>Book my free credit review</a>
            <ApplyNow style={{ flex:"1 1 120px", textAlign:"center", background:"transparent", color:MAROON, border:`2px solid ${MAROON}`, borderBottom:`4px solid ${PLUM}`, padding:"13px 16px", fontSize:13 }}/>
          </div>
          <p style={{ fontFamily:P, fontSize:11, lineHeight:1.5, color:MUTE, margin:"16px 0 0" }}>Joshua Graham NMLS #169809 | Zero Point Mortgage Services NMLS #1216108 | 5200 DTC Parkway, Suite 300, Greenwood Village, CO 80111 | Equal Housing Opportunity.</p>
        </div>
      </div>
    </div>
  );
}

// Buyer tool: a rough "up to 5%" DPA figure. Always labeled an estimate.
export function DpaEstimate() {
  const [v, setV] = useState("");
  const n = Number(String(v).replace(/[^\d]/g, ""));
  const fmt = (x) => "$" + Math.round(x).toLocaleString("en-US");
  return (
    <div style={{ background:"#fff", border:`1px solid ${LINE}`, borderTop:`4px solid ${PLUM}`, padding:20 }}>
      <div style={{ fontFamily:M, fontWeight:700, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:MAROON }}>Your DPA estimate</div>
      <div style={{ fontFamily:A, fontSize:28, lineHeight:1.08, textTransform:"uppercase", color:NAVY, margin:"6px 0 10px" }}>How much down payment help could there be?</div>
      <label style={{ display:"flex", flexDirection:"column", gap:4, fontFamily:M, fontWeight:700, fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:NAVY }}>
        Purchase price you have in mind
        <span style={{ display:"flex", alignItems:"baseline", gap:6 }}>
          <span style={{ fontFamily:P, fontSize:22 }}>$</span>
          <input inputMode="numeric" placeholder="350,000" value={v}
            onChange={(e) => setV(e.target.value.replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
            style={{ fontFamily:P, fontSize:22, width:"100%", border:`1px solid ${LINE}`, borderBottom:`2px solid ${NAVY}`, borderRadius:2, padding:"10px 12px", background:"#fff", color:NAVY }}/>
        </span>
      </label>
      <div style={{ marginTop:14, background:NAVY, color:"#fff", padding:"14px 16px" }}>
        <div style={{ fontFamily:P, fontSize:13, color:"#C9D6E3" }}>You could be eligible for up to 5% of the purchase price</div>
        <div style={{ fontFamily:A, fontSize:44, lineHeight:1.05, letterSpacing:"0.01em" }}>{n >= 50000 ? fmt(n * 0.05) : "$ —"}</div>
      </div>
      <p style={{ fontFamily:P, fontSize:11.5, lineHeight:1.5, color:MUTE, margin:"10px 0 0" }}>Estimate only. Down payment assistance programs, amounts and terms vary by area and eligibility and are subject to change. Not a commitment to lend; subject to credit approval and underwriting.</p>
    </div>
  );
}
