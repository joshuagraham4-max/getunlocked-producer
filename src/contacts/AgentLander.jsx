// Free "mini lead machine" for an agent contact: creates their own buyer lander at /a/<slug>, shows the link, the instant-alert
// setup, and a ready-to-post kit. Leads reach the agent by push (and email once Resend is on) and land in Joshua's Contacts too.
import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";

const C = { mid:"#6b6358", rule:"#e0d8cc", ink:"#1c1a17", green:"#1e6e4a" };
const F = { mono:"'DM Mono',monospace", body:"'Barlow',sans-serif" };
const SITE = "https://getunlocked-producer.vercel.app";
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const inp = { width:"100%", boxSizing:"border-box", border:`1px solid ${C.rule}`, borderRadius:6, padding:"7px 9px", fontFamily:F.body, fontSize:14 };
const btn = { border:`1px solid ${C.ink}`, background:C.ink, color:"#fff", borderRadius:6, padding:"7px 12px", fontFamily:F.mono, fontSize:11, letterSpacing:".08em", cursor:"pointer" };
const ghost = { ...btn, background:"transparent", color:C.ink };

export default function AgentLander({ contact: c }) {
  const nm = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const [page, setPage] = useState(undefined);
  const [form, setForm] = useState({ slug: slugify(nm), market: [c.city, c.state].filter(Boolean).join(", "), photo_url: "", lead_pref: "both" });
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState("");

  useEffect(() => {
    let live = true;
    supabase.from("agent_pages").select("*").eq("contact_id", c.id).maybeSingle().then(({ data, error }) => {
      if (!live) return; if (error) { setMsg("Run supabase/agent_pages_v1.sql in Supabase first."); setPage(null); } else setPage(data || null);
    });
    return () => { live = false; };
  }, [c.id]);

  const create = async () => {
    setBusy(true); setMsg("");
    const slug = slugify(form.slug);
    if (!slug) { setBusy(false); return setMsg("Add a page name for the link."); }
    const { data, error } = await supabase.from("agent_pages").insert({
      slug, name: nm || "Your agent", brokerage: c.company || null, market: form.market || null, phone: c.phone || null, email: c.email || null,
      photo_url: form.photo_url.trim() || null, lead_pref: form.lead_pref, contact_id: c.id }).select().single();
    setBusy(false);
    if (error) return setMsg(/duplicate|unique/i.test(error.message) ? "That link name is taken. Try another." : error.message);
    setPage(data);
  };
  const toggle = async () => { const { data } = await supabase.from("agent_pages").update({ active: !page.active }).eq("id", page.id).select().single(); if (data) setPage(data); };
  const copy = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); } catch {} };

  const url = page ? `${SITE}/a/${page.slug}` : "";
  const first = (c.first_name || "").trim() || "there";
  const mk = page && page.market ? page.market : "your area";
  const edit = page ? `${SITE}/e/${page.edit_token}` : "";
  const desk = page ? `${SITE}/scenario-desk?ref=AGT-${page.slug}` : "";
  const post = page ? `Thinking about buying or selling${page.market ? " in " + page.market : ""}? Answer a few quick questions and see where you stand. Free credit report review, appraisal credits and access to wholesale rates through my lender partner, Joshua Graham.\n\n${url}` : "";
  const setup = page ? `Hi ${first}, your free buyer and seller page is live: ${url}\n\nTurn it on in 4 steps:\n\n1. MAKE IT YOURS. Tap your private link, add your photo, and check your info. You can also add a short intro video (optional, tips are on the page): ${edit}\nPlease keep that link to yourself. It also has a free open house flyer maker with your QR code.\n\n2. POST IT. Your edit page has ready-made posts. Copy one, paste it on Facebook or Instagram with your link, and on Facebook tap Boost and put $20 to $50 behind it. Aim it at ${mk}.\n\n3. TURN ON YOUR LEAD ALERTS. Install the free app called ntfy. Tap the + button and type this code: ${page.ntfy_topic}\nNow every new lead buzzes your phone with their name and number.\n\n4. CALL THEM WITHIN 5 MINUTES. That's the whole trick. Five minutes from the alert is when they pick up.\n\nThat's it. You don't pay me anything. I'm the lender on the page, and I'll keep you posted.\n\nIf a lead has a home to sell, the alert tells you. That's your listing lead too.\n\nGot a tricky deal? Send it to my scenario desk, no client names needed: ${desk}\n\n- Joshua` : "";

  const box = { marginTop:14, border:`1px solid ${C.rule}`, borderRadius:8, background:"#fff", padding:"10px 12px" };
  const lab = { fontFamily:F.mono, fontSize:10, letterSpacing:".12em", color:C.mid, textTransform:"uppercase" };
  if (page === undefined) return null;
  return (
    <div style={box}>
      <div style={lab}>Free buyer lander for this agent</div>
      {!page ? (<div style={{ marginTop:8 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <label style={{ fontSize:12 }}>Link name<input style={inp} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}/></label>
          <label style={{ fontSize:12 }}>Market<input style={inp} value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })}/></label>
          <label style={{ fontSize:12 }}>Photo link (optional)<input style={inp} value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })}/></label>
          <label style={{ fontSize:12 }}>Send leads by<select style={inp} value={form.lead_pref} onChange={(e) => setForm({ ...form, lead_pref: e.target.value })}><option value="both">Alert + email (default)</option><option value="push">Alert only</option><option value="email">Email only</option></select></label>
        </div>
        <button style={{ ...btn, marginTop:10 }} disabled={busy} onClick={create}>{busy ? "Creating…" : "Create their lander"}</button>
      </div>) : (<div style={{ marginTop:8, fontFamily:F.body, fontSize:13 }}>
        <div><a href={url} target="_blank" rel="noreferrer" style={{ color:C.green, fontWeight:600 }}>{url}</a> {!page.active && <b style={{ color:"#a33" }}>(off)</b>}</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
          <button style={ghost} onClick={() => copy("setup", setup)}>{copied === "setup" ? "Copied" : "Copy welcome + setup text"}</button>
          <button style={ghost} onClick={() => copy("edit", edit)}>{copied === "edit" ? "Copied" : "Copy their edit link"}</button>
          <button style={ghost} onClick={() => copy("post", post)}>{copied === "post" ? "Copied" : "Copy their post copy"}</button>
          <button style={ghost} onClick={toggle}>{page.active ? "Turn page off" : "Turn page on"}</button>
        </div>
        <div style={{ marginTop:8, color:C.mid, fontSize:12 }}>Their private edit link lets them add a photo, info and video. Leads (buyers and sellers) land in your Contacts and go to them by {page.lead_pref === "push" ? "alert" : page.lead_pref === "email" ? "email" : "alert and email"}. Remind them: call within 5 minutes.</div>
      </div>)}
      {msg && <div style={{ marginTop:8, color:"#a33", fontSize:12 }}>{msg}</div>}
    </div>
  );
}
