// /e/<private key>: an agent edits their own page (photo, contact info, optional intro video) and copies ready-made posts.
// No login: the long secret in the link is the key (see supabase/agent_pages_v2.sql). Anyone holding the link can change the page.
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { embedFor } from "./saveVideo.js";

const C = { bone:"#E4EDF5", ink:"#0E1B2A", red:"#C8102E", panel:"#0E1B2A", mute:"#4A5B70", soft:"#C5D3E0" };
const SERIF = "'Bodoni Moda', 'Didot', 'Playfair Display', Georgia, serif", SANS = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";
const SITE = typeof location !== "undefined" ? location.origin : "";
const inp = { width:"100%", boxSizing:"border-box", border:"none", borderBottom:`2px solid ${C.ink}`, background:"transparent", padding:"10px 2px", font:`500 20px ${SERIF}`, color:C.ink, outline:"none", borderRadius:0 };
const lab = { font:`700 11px ${SANS}`, letterSpacing:".16em", textTransform:"uppercase", color:C.ink };
const btn = { border:"none", background:C.red, color:"#fff", font:`700 13px ${SANS}`, letterSpacing:".12em", textTransform:"uppercase", padding:"15px 24px", cursor:"pointer" };
const ghost = { ...btn, background:"transparent", color:C.ink, border:`2px solid ${C.ink}`, padding:"10px 16px", fontSize:11 };
const h2 = { font:`600 30px/1.1 ${SERIF}`, margin:"0 0 6px" };

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
        if (data && data[0]) setF({ ...data[0], brokerage:data[0].brokerage || "", market:data[0].market || "", phone:data[0].phone || "", email:data[0].email || "", photo_url:data[0].photo_url || "", video_url:data[0].video_url || "" });
        else setBad(true);
      } catch { if (live) setBad(true); }
    })();
    return () => { live = false; };
  }, [token]);
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
      p_email:f.email, p_photo_url:f.photo_url, p_video_url:f.video_url, p_lead_pref:f.lead_pref });
    setBusy(false);
    if (error || !data) return setErr("That didn't save. Check your connection and try again.");
    setSaved(true);
  };
  const copy = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1600); } catch {} };

  if (bad) return <div style={{ minHeight:"100vh", background:C.bone, padding:"60px 24px", font:`500 22px ${SERIF}`, color:C.ink }}>This edit link isn't valid. Please ask Joshua for your link.</div>;
  if (!f) return <div style={{ minHeight:"100vh", background:C.bone }}/>;

  const link = `${SITE}/a/${f.slug}`; const desk = `${SITE}/scenario-desk?ref=AGT-${f.slug}`;
  const mk = f.market ? ` in ${f.market}` : ""; const vid = embedFor(f.video_url);
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

        <Block title="Your scenario desk">
          <p style={{ font:`500 18px/1.5 ${SERIF}`, margin:"0 0 12px" }}>Got a tricky deal? Send it to Joshua here. No client names needed.</p>
          <a href={desk} target="_blank" rel="noreferrer" style={{ color:C.red, font:`700 14px ${SANS}`, wordBreak:"break-all" }}>{desk}</a>
        </Block>
      </div>
    </div>
  );
}
