// /e/<private key>: an agent edits their own page (photo, contact info, optional intro video) and copies ready-made posts.
// No login: the long secret in the link is the key (see supabase/agent_pages_v2.sql). Anyone holding the link can change the page.
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { embedFor } from "./saveVideo.js";
import QRCode from "qrcode";
import { Flyer, flyerMath, PRINT_CSS } from "../groups/FlyerMaker.jsx";

const C = { bone:"#E4EDF5", ink:"#0E1B2A", red:"#C8102E", panel:"#0E1B2A", mute:"#4A5B70", soft:"#C5D3E0" };
const SERIF = "'Bodoni Moda', 'Didot', 'Playfair Display', Georgia, serif", SANS = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";
const SITE = typeof location !== "undefined" ? location.origin : "";
const inp = { width:"100%", boxSizing:"border-box", border:"none", borderBottom:`2px solid ${C.ink}`, background:"transparent", padding:"10px 2px", font:`500 20px ${SERIF}`, color:C.ink, outline:"none", borderRadius:0 };
const lab = { font:`700 11px ${SANS}`, letterSpacing:".16em", textTransform:"uppercase", color:C.ink };
const btn = { border:"none", background:C.red, color:"#fff", font:`700 13px ${SANS}`, letterSpacing:".12em", textTransform:"uppercase", padding:"15px 24px", cursor:"pointer" };
const ghost = { ...btn, background:"transparent", color:C.ink, border:`2px solid ${C.ink}`, padding:"10px 16px", fontSize:11 };
const h2 = { font:`600 30px/1.1 ${SERIF}`, margin:"0 0 6px" };

// Listing photos stay larger so they print sharp.
function shrinkPhoto(file, max) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onerror = reject;
    r.onload = () => { const img = new Image(); img.onerror = reject;
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/jpeg", 0.88)); };
      img.src = r.result; };
    r.readAsDataURL(file);
  });
}

// Shrink a phone photo to a small JPEG (long edge 640px) so it saves fast and loads fast.
function shrink(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, 640 / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

// Logos keep their transparency: shrink to a small PNG (long edge 360px).
function shrinkPng(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onerror = reject;
    r.onload = () => { const img = new Image(); img.onerror = reject;
      img.onload = () => { const k = Math.min(1, 360 / Math.max(img.width, img.height)); const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/png")); };
      img.src = r.result; };
    r.readAsDataURL(file);
  });
}
const BLANK_FL = { address:"", city:"", price:"", beds:"", baths:"", sqft:"", openHouse:"", photo:"", buydown:"2/1", credit:"", listingLink:"", joshua:true };
const FIN = (v) => parseFloat(String(v || "").replace(/[^0-9.]/g, "")) || 0;

export default function AgentEdit() {
  const token = (location.pathname.match(/\/e\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("t") || "";
  const [f, setF] = useState(null); const [bad, setBad] = useState(false);
  const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [copied, setCopied] = useState("");
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await supabase.rpc("get_agent_edit", { p_token: token });
        if (!live) return;
        if (data && data[0]) setF({ ...data[0], brokerage:data[0].brokerage || "", market:data[0].market || "", phone:data[0].phone || "", email:data[0].email || "", photo_url:data[0].photo_url || "", video_url:data[0].video_url || "", logo_url:data[0].logo_url || "" });
        else setBad(true);
      } catch { if (live) setBad(true); }
    })();
    return () => { live = false; };
  }, [token]);
  useEffect(() => { if (document.getElementById("gup-flyer-fonts")) return; const l = document.createElement("link"); l.id = "gup-flyer-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"; document.head.appendChild(l); }, []);
  const [fl, setFl] = useState(BLANK_FL); const [rate, setRate] = useState(null); const [qr, setQr] = useState("");
  useEffect(() => { (async () => { try { const { data } = await supabase.rpc("get_flyer_rate"); if (data && data[0]) setRate(data[0]); } catch {} })(); }, []);
  const setL = (k) => (e) => setFl((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const pickL = (k, max) => async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return;
    try { const url = await shrinkPhoto(file, max); setFl((x) => ({ ...x, [k]: url })); } catch { setErr("That photo wouldn't load."); } };
  const qrTarget = f ? (fl.listingLink.trim() || `${SITE}/a/${f.slug}`) : "";
  useEffect(() => { if (!qrTarget) return; QRCode.toDataURL(qrTarget, { margin:1, width:240 }).then(setQr).catch(() => setQr("")); }, [qrTarget]);
  const pickLogo = async (e) => { const file = e.target.files && e.target.files[0]; if (!file) return;
    try { const url = await shrinkPng(file); setSaved(false); setF((x) => ({ ...x, logo_url:url })); } catch { setErr("That logo wouldn't load. Try a PNG or JPG."); } };
  const set = (k) => (e) => { setSaved(false); setF({ ...f, [k]: e.target.value }); };
  const pickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    try { const url = await shrink(file); setSaved(false); setF((x) => ({ ...x, photo_url:url })); } catch { setErr("That photo wouldn't load. Try a different one."); }
  };
  const save = async (ev) => {
    ev.preventDefault(); setErr(""); setSaved(false);
    if (!f.name.trim()) return setErr("Please add your name.");
    if (f.video_url.trim() && !embedFor(f.video_url)) return setErr("That video link isn't one I can play. Use a YouTube, Vimeo or Loom share link.");
    setBusy(true);
    const { data, error } = await supabase.rpc("save_agent_edit", { p_token:token, p_name:f.name, p_brokerage:f.brokerage, p_market:f.market, p_phone:f.phone,
      p_email:f.email, p_photo_url:f.photo_url, p_video_url:f.video_url, p_lead_pref:f.lead_pref, p_logo_url:f.logo_url });
    setBusy(false);
    if (error || !data) return setErr("That didn't save. Check your connection and try again.");
    setSaved(true);
  };
  const copy = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1600); } catch {} };

  if (bad) return <div style={{ minHeight:"100vh", background:C.bone, padding:"60px 24px", font:`500 22px ${SERIF}`, color:C.ink }}>This edit link isn't valid. Please ask Joshua for your link.</div>;
  if (!f) return <div style={{ minHeight:"100vh", background:C.bone }}/>;

  const link = `${SITE}/a/${f.slug}`; const desk = `${SITE}/scenario-desk?ref=AGT-${f.slug}`;
  const mk = f.market ? ` in ${f.market}` : ""; const vid = embedFor(f.video_url);
  const rateOk = !!(rate && rate.rate && (Date.now() - new Date(rate.as_of + "T12:00:00").getTime()) / 864e5 <= 3.5);
  const asOfTxt = rate ? new Date(rate.as_of + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "";
  const fm = flyerMath({ price:fl.price, rate:rate ? rate.rate : 0, buydown:fl.buydown, credit:fl.credit, financeCharges:rate ? rate.finance_charges : 0 });
  const fx = { ...fl, agentName:f.name, brokerage:f.brokerage, agentPhone:f.phone, agentEmail:f.email, agentPhoto:f.photo_url, agentLogo:f.logo_url,
    rate: rate ? String(rate.rate) : "", financeCharges: rate ? String(rate.finance_charges) : "", score: rate ? String(rate.score) : "740", asOf:asOfTxt,
    apr: fm.aprAuto, fees: rate ? `$${Math.round(rate.finance_charges).toLocaleString("en-US")} in prepaid finance charges (20% down example)` : "",
    accent:"#1d3f6e", joshuaOff:!fl.joshua, noPay:!rateOk || !fm.aprAuto, qr, qrNote: fl.listingLink.trim() ? "Scan for the full listing" : "Scan to see where you stand" };
  const canPrint = !!(fl.address.trim() && FIN(fl.price) && fl.photo);
  const flScale = typeof window !== "undefined" ? Math.min(0.62, (window.innerWidth - 44) / 816) : 0.5;
  const posts = [
    ["Buyers", `Most buyers get one lender's quote and call it a day. They leave thousands on the table without ever knowing it.\n\nI work with a lender who shops several lenders for you. Answer a few quick questions and see where you stand: a free credit report review, appraisal credits and access to wholesale rates.\n\n${link}`],
    ["Sell, then buy", `Selling and buying in the same move is the part that keeps people up at night. What will I net? When do I list? Can I afford the next one?\n\nAnswer a few quick questions. I'll run the real numbers on your home, not a Zillow guess, while my lender partner looks at the buy side.\n\n${link}`],
    ["Sellers", `Thinking about selling${mk}? Before you list, find out what your home is really worth and what you'd actually walk away with.\n\nTwo minutes, no pressure: ${link}`],
    ["Video post", `60 seconds on why I do this differently. Then take two minutes and see where you stand${mk}: ${link}`],
  ];
  const Block = ({ title, children }) => (<section style={{ marginTop:46 }}><hr style={{ border:0, borderTop:`2px solid ${C.ink}`, margin:"0 0 22px" }}/><h2 style={h2}>{title}</h2>{children}</section>);

  return (
    <div style={{ minHeight:"100vh", background:C.bone, color:C.ink, fontFamily:SANS }}>
      <style>{`@media (max-width:640px){.ae-g{grid-template-columns:1fr !important}}`}</style>
      <div style={{ maxWidth:760, margin:"0 auto", padding:"40px 22px 80px" }}>
        <div style={{ font:`700 11px ${SANS}`, letterSpacing:".2em", textTransform:"uppercase", color:C.red }}>Your page · Graham Financial</div>
        <h1 style={{ font:`600 clamp(34px,6vw,52px)/1.05 ${SERIF}`, margin:"12px 0 6px" }}>Make it yours, {f.name.split(" ")[0]}.</h1>
        <p style={{ font:`italic 500 20px/1.4 ${SERIF}`, color:C.mute, margin:0 }}>Add your photo, check your info, and your page is ready. Keep this link private. Anyone who has it can change your page.</p>
        <p style={{ margin:"14px 0 0" }}><a href={link} target="_blank" rel="noreferrer" style={{ color:C.red, font:`700 14px ${SANS}` }}>{link}</a></p>

        <form onSubmit={save}>
          <Block title="Your photo">
            <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
              {f.photo_url ? <img src={f.photo_url} alt="" style={{ width:120, height:150, objectFit:"cover", objectPosition:"50% 15%" }}/> :
                <div style={{ width:120, height:150, background:C.soft, display:"flex", alignItems:"center", justifyContent:"center", font:`500 44px ${SERIF}` }}>{f.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}</div>}
              <div>
                <label style={{ ...ghost, display:"inline-block" }}>{f.photo_url ? "Change photo" : "Add your photo"}<input type="file" accept="image/*" onChange={pickPhoto} style={{ display:"none" }}/></label>
                <p style={{ font:`italic 500 16px ${SERIF}`, color:C.mute, margin:"10px 0 0", maxWidth:360 }}>A clear head-and-shoulders photo with your face centered works best.</p>
              </div>
            </div>
          </Block>

          <Block title="Your logo (optional)">
            <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
              {f.logo_url ? <img src={f.logo_url} alt="" style={{ maxWidth:160, maxHeight:80, objectFit:"contain", background:"#fff", padding:8 }}/> : <div style={{ width:160, height:80, background:C.soft }}/>}
              <div>
                <label style={{ ...ghost, display:"inline-block" }}>{f.logo_url ? "Change logo" : "Add your logo"}<input type="file" accept="image/*" onChange={pickLogo} style={{ display:"none" }}/></label>
                {f.logo_url && <button type="button" style={{ ...ghost, marginLeft:8 }} onClick={() => { setSaved(false); setF({ ...f, logo_url:"" }); }}>Remove</button>}
                <p style={{ font:`italic 500 16px ${SERIF}`, color:C.mute, margin:"10px 0 0", maxWidth:360 }}>Your brokerage or personal logo. It shows on your page and on your flyers.</p>
              </div>
            </div>
          </Block>

          <Block title="Your info">
            <div className="ae-g" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px 24px", marginTop:14 }}>
              <label><span style={lab}>Name</span><input style={inp} value={f.name} onChange={set("name")}/></label>
              <label><span style={lab}>Brokerage</span><input style={inp} value={f.brokerage} onChange={set("brokerage")}/></label>
              <label><span style={lab}>Phone</span><input style={inp} type="tel" value={f.phone} onChange={set("phone")}/></label>
              <label><span style={lab}>Email (your lead emails go here)</span><input style={inp} type="email" value={f.email} onChange={set("email")}/></label>
              <label><span style={lab}>Your market</span><input style={inp} value={f.market} onChange={set("market")} placeholder="Sarasota, FL"/></label>
              <label><span style={lab}>Send my leads by</span>
                <select style={inp} value={f.lead_pref} onChange={set("lead_pref")}><option value="both">Phone alert and email</option><option value="push">Phone alert only</option><option value="email">Email only</option></select></label>
            </div>
          </Block>

          <Block title="Your intro video (optional)">
            <p style={{ font:`500 18px/1.45 ${SERIF}`, margin:"0 0 12px" }}>A 30 to 60 second selfie video is the single best thing you can add. Record it on your phone, upload it to YouTube, Vimeo or Loom, and paste the link here.</p>
            <div style={{ background:C.panel, color:"#E4EDF5", padding:"16px 18px", margin:"0 0 16px" }}>
              <div style={{ font:`700 11px ${SANS}`, letterSpacing:".18em", textTransform:"uppercase", color:"#9DB4CC" }}>What to say</div>
              <p style={{ font:`500 18px/1.5 ${SERIF}`, margin:"8px 0 0" }}>1. Who you are and where you work.<br/>2. <b>Why you're different.</b> What do you do for <b>buyers</b> that other agents don't? What do you do for <b>sellers</b> to net them more?<br/>3. Finish with: "Answer a few quick questions below and we'll take it from there."</p>
            </div>
            <label><span style={lab}>Video link</span><input style={inp} value={f.video_url} onChange={set("video_url")} placeholder="https://youtu.be/..."/></label>
            {vid && vid.kind === "iframe" && <div style={{ position:"relative", paddingTop:"56.25%", marginTop:16, background:C.panel }}><iframe src={vid.src} title="Your intro" allowFullScreen style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:0 }}/></div>}
          </Block>

          {err && <p style={{ color:C.red, font:`700 14px ${SANS}`, marginTop:22 }}>{err}</p>}
          <div style={{ marginTop:26, display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
            <button style={btn} type="submit" disabled={busy}>{busy ? "Saving…" : "Save my page"}</button>
            {saved && <span style={{ font:`italic 600 20px ${SERIF}`, color:C.ink }}>Saved. <a href={link} target="_blank" rel="noreferrer" style={{ color:C.red }}>See your page</a></span>}
          </div>
        </form>

        <Block title="Get your lead alerts">
          <p style={{ font:`500 18px/1.5 ${SERIF}`, margin:0 }}>Install the free app <b>ntfy</b>. Tap the + button and type this code:</p>
          <div style={{ font:`700 20px ${SANS}`, letterSpacing:".04em", background:"#fff", padding:"14px 16px", margin:"12px 0", wordBreak:"break-all" }}>{f.ntfy_topic}</div>
          <p style={{ font:`500 18px/1.5 ${SERIF}`, margin:0 }}>Every new lead buzzes your phone with their name and number. <b>Call them within 5 minutes.</b> That's when they pick up.</p>
        </Block>

        <Block title="Posts you can copy">
          <p style={{ font:`italic 500 18px/1.4 ${SERIF}`, color:C.mute, margin:"0 0 14px" }}>Paste one on Facebook or Instagram. Use a photo of yourself, not a stock image. On Facebook, tap Boost and put $20 to $50 behind it, aimed at your market.</p>
          {posts.map(([t, body]) => (
            <div key={t} style={{ background:"#fff", padding:"14px 16px", marginBottom:14 }}>
              <div style={lab}>{t}</div>
              <p style={{ font:`500 17px/1.5 ${SERIF}`, whiteSpace:"pre-wrap", margin:"8px 0 12px" }}>{body}</p>
              <button type="button" style={ghost} onClick={() => copy(t, body)}>{copied === t ? "Copied" : "Copy this post"}</button>
            </div>))}
        </Block>

        <Block title="Open house flyer">
          <style>{PRINT_CSS}</style>
          <p style={{ font:`500 18px/1.45 ${SERIF}`, margin:"0 0 14px" }}>Fill in your listing, add a photo, and print it or save it as a PDF. The QR code sends buyers to your page, where they can see where they stand. Your photo, logo and info come from above.</p>
          <div className="ae-g" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px 24px" }}>
            <label style={{ gridColumn:"1 / -1" }}><span style={lab}>Street address</span><input style={inp} value={fl.address} onChange={setL("address")} placeholder="5701 E Melody Way"/></label>
            <label><span style={lab}>City, state</span><input style={inp} value={fl.city} onChange={setL("city")} placeholder="Sarasota, FL"/></label>
            <label><span style={lab}>Price</span><input style={inp} value={fl.price} onChange={setL("price")} inputMode="numeric" placeholder="530000"/></label>
            <label style={{ gridColumn:"1 / -1" }}><span style={lab}>Open house date and time</span><input style={inp} value={fl.openHouse} onChange={setL("openHouse")} placeholder="Sunday, Nov 23 · 12 to 3 PM"/></label>
            <label><span style={lab}>Beds</span><input style={inp} value={fl.beds} onChange={setL("beds")}/></label>
            <label><span style={lab}>Baths</span><input style={inp} value={fl.baths} onChange={setL("baths")}/></label>
            <label><span style={lab}>Sq ft</span><input style={inp} value={fl.sqft} onChange={setL("sqft")} placeholder="2,150"/></label>
            <label><span style={lab}>Seller credit $ (optional)</span><input style={inp} value={fl.credit} onChange={setL("credit")} inputMode="numeric"/></label>
            <label style={{ gridColumn:"1 / -1" }}><span style={lab}>Listing photo</span><input type="file" accept="image/*" onChange={pickL("photo", 1800)} style={{ display:"block", marginTop:8, font:`500 15px ${SANS}` }}/></label>
            <label style={{ gridColumn:"1 / -1" }}><span style={lab}>Link for the QR code (optional)</span><input style={inp} value={fl.listingLink} onChange={setL("listingLink")} placeholder="Leave blank to send buyers to your page"/></label>
            <label style={{ gridColumn:"1 / -1", display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer" }}>
              <input type="checkbox" checked={fl.joshua} onChange={setL("joshua")} style={{ marginTop:3, width:18, height:18, accentColor:C.red, flex:"none" }}/>
              <span style={{ font:`500 17px/1.4 ${SERIF}` }}>Include my lender partner, Joshua Graham, and a monthly payment breakdown on the flyer.</span>
            </label>
            {fl.joshua && !rateOk && <p style={{ gridColumn:"1 / -1", font:`italic 500 16px ${SERIF}`, color:C.red, margin:0 }}>The payment breakdown is paused until Joshua posts today's rate. Your flyer still prints with his contact info.</p>}
            {fl.joshua && rateOk && fl.buydown && <label><span style={lab}>Buydown</span><select style={inp} value={fl.buydown} onChange={setL("buydown")}><option value="2/1">2/1</option><option value="1/0">1/0</option><option value="none">None</option></select></label>}
          </div>
          <div style={{ marginTop:18, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <button type="button" style={{ ...btn, opacity:canPrint ? 1 : 0.4 }} disabled={!canPrint} onClick={() => setTimeout(() => window.print(), 50)}>Print or save as PDF</button>
            {!canPrint && <span style={{ font:`italic 500 16px ${SERIF}`, color:C.mute }}>Add the address, price and listing photo to print.</span>}
          </div>
          <p style={{ font:`italic 500 15px/1.4 ${SERIF}`, color:C.mute, margin:"10px 0 18px" }}>In the print window choose Letter, margins None, and turn on Background graphics.</p>
          <div style={{ width:816 * flScale, height:1056 * flScale, overflow:"hidden", border:`1px solid ${C.soft}`, background:"#fff" }}>
            <div id="gup-flyer-wrap" style={{ transform:`scale(${flScale})`, transformOrigin:"top left", width:816, height:1056 }}><Flyer f={fx} m={fm}/></div>
          </div>
        </Block>

        <Block title="Your scenario desk">
          <p style={{ font:`500 18px/1.5 ${SERIF}`, margin:"0 0 12px" }}>Got a tricky deal? Send it to Joshua here. No client names needed.</p>
          <a href={desk} target="_blank" rel="noreferrer" style={{ color:C.red, font:`700 14px ${SANS}`, wordBreak:"break-all" }}>{desk}</a>
        </Block>
      </div>
    </div>
  );
}
