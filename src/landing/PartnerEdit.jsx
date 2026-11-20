// /pe/<private key>: a referral partner (planner or attorney) edits their own info: photo, logo, name, firm, phone, email.
// Shows their three links (partner page, client page, desk) and how to turn on lead alerts (ntfy). Needs partner_pages_v2.sql.
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import { SiteFooter, LogoLink } from "./SiteBits.jsx";

const C = { maroon:"#4A111C", navy:"#0E1B2A", gold:"#D9A566", plum:"#7E4B6F", cream:"#F6EEDF", muted:"#4A5568", line:"#E3D6BF", rose:"#E3C9CC" };
const ANTON = "'Anton', 'Arial Narrow', Impact, sans-serif", SANS = "'Montserrat', Arial, sans-serif", BODY = "'Public Sans', system-ui, sans-serif";
const SITE = "https://getunlocked-producer.vercel.app";
const input = { font:"inherit", fontSize:16, color:C.navy, background:"#fff", border:`1px solid ${C.line}`, borderRadius:4, padding:"12px", width:"100%", boxSizing:"border-box" };
const labelS = { display:"flex", flexDirection:"column", gap:6, fontWeight:700, fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", color:C.navy };
const panel = { background:"#fff", border:`1px solid ${C.line}`, borderTop:`4px solid ${C.plum}`, padding:24, display:"grid", gap:16 };
const h2 = { font:`400 30px/1.05 ${ANTON}`, textTransform:"uppercase", letterSpacing:".02em", margin:0, color:C.navy };
const btn = { font:`400 18px ${ANTON}`, letterSpacing:".08em", textTransform:"uppercase", background:C.maroon, color:"#fff", border:0, borderBottom:`4px solid ${C.plum}`, borderRadius:2, padding:"14px 22px", cursor:"pointer" };
const ghost = { font:`700 12px ${SANS}`, letterSpacing:".08em", textTransform:"uppercase", background:"#fff", color:C.navy, border:`1.5px solid ${C.navy}`, borderRadius:2, padding:"9px 12px", cursor:"pointer" };

// Shrink a phone photo (JPEG) or logo (PNG keeps transparency) so it saves and loads fast.
function shrink(file, max, type) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onerror = reject;
    r.onload = () => { const img = new Image(); img.onerror = reject;
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(type === "png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.82)); };
      img.src = r.result; };
    r.readAsDataURL(file);
  });
}

export default function PartnerEdit() {
  const token = (location.pathname.match(/\/pe\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("t") || "";
  const [f, setF] = useState(undefined);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false); const [copied, setCopied] = useState("");
  useEffect(() => {
    supabase.rpc("get_partner_edit", { p_token: token }).then(({ data, error }) => {
      const r = !error && data && data[0];
      setF(r ? { ...r, last_name:r.last_name || "", firm:r.firm || "", phone:r.phone || "", email:r.email || "", photo_url:r.photo_url || "", logo_url:r.logo_url || "" } : null);
    });
  }, [token]);
  const set = (k) => (e) => { setSaved(false); setF({ ...f, [k]: e.target.value }); };
  const pick = (k, max, type) => async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return;
    try { const url = await shrink(file, max, type); setSaved(false); setF((x) => ({ ...x, [k]: url })); } catch { setErr("That image wouldn't load. Try another."); } };
  const save = async () => {
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("save_partner_edit", { p_token: token, p_first: f.first_name, p_last: f.last_name, p_firm: f.firm, p_phone: f.phone, p_email: f.email, p_photo_url: f.photo_url, p_logo_url: f.logo_url });
    setBusy(false);
    if (error || !data) return setErr("That didn't save. Try again, or text Joshua at " + BRAND.phone + ".");
    setSaved(true);
  };
  const copy = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); } catch {} };

  const wrap = (kids) => (
    <div style={{ fontFamily:BODY, color:C.navy, background:C.cream, minHeight:"100vh" }}>
      <div style={{ background:"#fff", borderBottom:`4px solid ${C.plum}` }}><div style={{ maxWidth:820, margin:"0 auto", padding:"12px 18px" }}><LogoLink to="/"/></div></div>
      <div style={{ maxWidth:820, margin:"0 auto", padding:"28px 16px 44px", display:"grid", gap:22 }}>{kids}</div>
      <SiteFooter max={820}/>
    </div>);
  if (f === undefined) return wrap(null);
  if (f === null) return wrap(<div style={panel}><h2 style={h2}>This link isn't active.</h2><p style={{ margin:0, color:C.muted }}>Text Joshua at {BRAND.phone} and he'll send a fresh one.</p></div>);

  const page = `${SITE}/p/${f.slug}`, client = `${SITE}/pl/${f.slug}`, desk = `${SITE}/scenario-desk?ref=PTR-${f.slug}&for=${f.kind}`;
  const links = [["Your partner page", page, "page"], ["Your client page (share it, boost it)", client, "client"], ["Your scenario desk", desk, "desk"]];
  return wrap(<>
    <div style={{ textAlign:"center" }}>
      <div style={{ font:`700 11px ${SANS}`, letterSpacing:".2em", color:C.maroon }}>YOUR PRIVATE LINK · KEEP IT TO YOURSELF</div>
      <h1 style={{ font:`400 clamp(40px,9vw,64px)/1 ${ANTON}`, textTransform:"uppercase", margin:"10px 0 8px" }}>Welcome, {f.first_name}.</h1>
      <p style={{ margin:"0 auto", maxWidth:560, color:C.muted, fontSize:17, lineHeight:1.55 }}>Two minutes here and your pages carry your name, photo and firm. Leads from your client page buzz your phone.</p>
    </div>

    <div style={panel}>
      <h2 style={h2}>1. Your info</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap:14 }}>
        <label style={labelS}>First name<input style={input} value={f.first_name} onChange={set("first_name")}/></label>
        <label style={labelS}>Last name<input style={input} value={f.last_name} onChange={set("last_name")}/></label>
        <label style={labelS}>Firm<input style={input} value={f.firm} onChange={set("firm")}/></label>
        <label style={labelS}>Mobile phone<input style={input} value={f.phone} onChange={set("phone")} inputMode="tel"/></label>
        <label style={labelS}>Email<input style={input} value={f.email} onChange={set("email")} inputMode="email"/></label>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap:14 }}>
        <div style={labelS}>Your photo
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            {f.photo_url ? <img src={f.photo_url} alt="" style={{ width:72, height:90, objectFit:"cover", border:`2px solid ${C.plum}` }}/> : <div style={{ width:72, height:90, background:C.line }}/>}
            <input type="file" accept="image/*" onChange={pick("photo_url", 640, "jpg")} style={{ fontSize:13, fontWeight:400, letterSpacing:0, textTransform:"none" }}/>
          </div></div>
        <div style={labelS}>Firm logo (optional)
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            {f.logo_url ? <img src={f.logo_url} alt="" style={{ maxWidth:110, maxHeight:60, objectFit:"contain" }}/> : <div style={{ width:72, height:44, background:C.line }}/>}
            <input type="file" accept="image/*" onChange={pick("logo_url", 400, "png")} style={{ fontSize:13, fontWeight:400, letterSpacing:0, textTransform:"none" }}/>
          </div></div>
      </div>
      <div><button style={btn} disabled={busy} onClick={save}>{busy ? "Saving…" : saved ? "Saved" : "Save my info"}</button>
        {err && <div style={{ color:"#B3261E", marginTop:10 }}>{err}</div>}</div>
    </div>

    <div style={panel}>
      <h2 style={h2}>2. Turn on your lead alerts</h2>
      <ol style={{ margin:0, paddingLeft:20, lineHeight:1.7, fontSize:16 }}>
        <li>Install the free app <b>ntfy</b> (App Store or Google Play).</li>
        <li>Tap <b>+</b> and type this code: <b style={{ fontFamily:"monospace", background:C.cream, padding:"2px 6px" }}>{f.ntfy_topic}</b> <button style={{ ...ghost, padding:"4px 8px", marginLeft:6 }} onClick={() => copy("code", f.ntfy_topic)}>{copied === "code" ? "Copied" : "Copy"}</button></li>
        <li>That's it. Every lead from your client page buzzes your phone with their name and number. I get it too, and I'll call them.</li>
      </ol>
    </div>

    <div style={panel}>
      <h2 style={h2}>3. Your links</h2>
      {links.map(([label, url, k]) => (
        <div key={k} style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", justifyContent:"space-between", borderTop:`1px solid ${C.line}`, paddingTop:12 }}>
          <div><div style={{ fontWeight:700 }}>{label}</div><a href={url} target="_blank" rel="noreferrer" style={{ color:C.maroon, fontSize:14, wordBreak:"break-all" }}>{url}</a></div>
          <button style={ghost} onClick={() => copy(k, url)}>{copied === k ? "Copied" : "Copy"}</button>
        </div>
      ))}
    </div>
  </>);
}
