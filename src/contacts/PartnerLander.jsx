// Referral partner (planner or divorce attorney): one click makes their page at /p/<slug> ("Welcome, Phil.").
// Their Register button opens the Scenario Desk in partner mode; every scenario files here and pings Joshua.
// Same pattern as AgentLander.jsx. Needs supabase/partner_pages_v1.sql.
import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { partnerScripts } from "../landing/partners.js";

const C = { mid:"#6b6358", rule:"#e0d8cc", ink:"#1c1a17", green:"#1e6e4a" };
const F = { mono:"'DM Mono',monospace", body:"'Barlow',sans-serif" };
const SITE = "https://getunlocked-producer.vercel.app";
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const inp = { width:"100%", boxSizing:"border-box", border:`1px solid ${C.rule}`, borderRadius:6, padding:"7px 9px", fontFamily:F.body, fontSize:14 };
const btn = { border:`1px solid ${C.ink}`, background:C.ink, color:"#fff", borderRadius:6, padding:"7px 12px", fontFamily:F.mono, fontSize:11, letterSpacing:".08em", cursor:"pointer" };
const ghost = { ...btn, background:"transparent", color:C.ink };
const guessKind = (c) => /attorney|law|legal|esq|divorce/i.test([c.subtype, c.company, c.title, (c.tags || []).join(" ")].join(" ")) ? "attorney" : "planner";

export default function PartnerLander({ contact: c }) {
  const nm = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const [page, setPage] = useState(undefined);
  const [form, setForm] = useState({ slug: slugify(nm), firm: c.company || "", kind: guessKind(c) });
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState("");

  useEffect(() => {
    let live = true;
    supabase.from("partner_pages").select("*").eq("contact_id", c.id).maybeSingle().then(({ data, error }) => {
      if (!live) return; if (error) { setMsg("Run supabase/partner_pages_v1.sql in Supabase first."); setPage(null); } else setPage(data || null);
    });
    return () => { live = false; };
  }, [c.id]);

  const create = async () => {
    setBusy(true); setMsg("");
    const slug = slugify(form.slug);
    if (!slug) { setBusy(false); return setMsg("Add a link name."); }
    const { data, error } = await supabase.from("partner_pages").insert({
      slug, first_name: (c.first_name || "").trim() || "there", last_name: c.last_name || null, firm: form.firm.trim() || null,
      kind: form.kind, phone: c.phone || null, email: c.email || null, contact_id: c.id }).select().single();
    setBusy(false);
    if (error) return setMsg(/duplicate|unique/i.test(error.message) ? "That link name is taken. Try another." : error.message);
    setPage(data);
  };
  const toggle = async () => { const { data } = await supabase.from("partner_pages").update({ active: !page.active }).eq("id", page.id).select().single(); if (data) setPage(data); };
  const setKind = async (k) => { const { data } = await supabase.from("partner_pages").update({ kind: k }).eq("id", page.id).select().single(); if (data) setPage(data); };
  const copy = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); } catch {} };

  const url = page ? `${SITE}/p/${page.slug}` : "";
  const editUrl = page && page.edit_token ? `${SITE}/pe/${page.edit_token}` : "";
  const client = page ? `${SITE}/pl/${page.slug}` : "";
  const setup = !page ? "" : `Hi ${page.first_name}, two quick things so your pages carry your name:\n\n1. Your private link (keep it to yourself). Add your photo, firm logo and contact info: ${editUrl}\n\n2. Turn on lead alerts: install the free app ntfy, tap +, and type ${page.ntfy_topic}. Every lead from your client page buzzes your phone, and I get it too.\n\nYour client page, to share or boost: ${client}\n\n- Joshua`;
  const desk = page ? `${SITE}/scenario-desk?ref=PTR-${page.slug}&for=${page.kind}` : "";
  const first = page ? page.first_name : "";
  const welcome = !page ? "" : page.kind === "attorney"
    ? `Hi ${first}, here's the tool I mentioned: ${url}\n\nWhen a client is keeping the house, text me the draft terms or just a name and number. I'll tell you in 2 hours or less whether the house terms can close, and what the decree needs to say. Then I take it from there.\n\n- Joshua`
    : `Hi ${first}, here's the tool I mentioned: ${url}\n\nWhen a client's mortgage gets complicated, put it on my desk from there, or just text me a name and number. Mortgage only, you see everything first, and your client comes back to you at closing.\n\n- Joshua`;

  const box = { marginTop:14, border:`1px solid ${C.rule}`, borderRadius:8, background:"#fff", padding:"10px 12px" };
  const lab = { fontFamily:F.mono, fontSize:10, letterSpacing:".12em", color:C.mid, textTransform:"uppercase" };
  if (page === undefined) return null;
  const scripts = partnerScripts(page ? page.kind : form.kind, (c.first_name || "").trim(), url);
  return (
    <div style={box}>
      <div style={lab}>Partner page (planner or attorney)</div>
      {!page ? (<div style={{ marginTop:8 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <label style={{ fontSize:12 }}>Link name<input style={inp} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}/></label>
          <label style={{ fontSize:12 }}>Firm<input style={inp} value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })}/></label>
          <label style={{ fontSize:12 }}>They are a<select style={inp} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="planner">Financial planner</option><option value="attorney">Divorce attorney</option></select></label>
        </div>
        <button style={{ ...btn, marginTop:10 }} disabled={busy} onClick={create}>{busy ? "Creating…" : "Create their partner page"}</button>
      </div>) : (<div style={{ marginTop:8, fontFamily:F.body, fontSize:13 }}>
        <div><a href={url} target="_blank" rel="noreferrer" style={{ color:C.green, fontWeight:600 }}>{url}</a> {!page.active && <b style={{ color:"#a33" }}>(off)</b>}
          <span style={{ marginLeft:8, color:C.mid }}>{page.kind === "attorney" ? "Attorney" : "Planner"} · <button onClick={() => setKind(page.kind === "attorney" ? "planner" : "attorney")} style={{ background:"none", border:0, padding:0, color:C.ink, textDecoration:"underline", cursor:"pointer", fontSize:12 }}>switch</button></span></div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
          <button style={ghost} onClick={() => copy("welcome", welcome)}>{copied === "welcome" ? "Copied" : "Copy welcome text"}</button>
          <button style={ghost} onClick={() => copy("link", url)}>{copied === "link" ? "Copied" : "Copy their page link"}</button>
          {editUrl && <button style={ghost} onClick={() => copy("setup", setup)}>{copied === "setup" ? "Copied" : "Copy setup text (edit link + alerts)"}</button>}
          {editUrl && <button style={ghost} onClick={() => copy("edit", editUrl)}>{copied === "edit" ? "Copied" : "Copy their edit link"}</button>}
          <button style={ghost} onClick={() => copy("client", client)}>{copied === "client" ? "Copied" : "Copy their client page"}</button>
          <button style={ghost} onClick={() => copy("desk", desk)}>{copied === "desk" ? "Copied" : "Copy their desk link"}</button>
          <button style={ghost} onClick={toggle}>{page.active ? "Turn page off" : "Turn page on"}</button>
        </div>
        <div style={{ marginTop:8, color:C.mid, fontSize:12 }}>Scenarios they send land here on their timeline and buzz your phone as "Partner scenario". Their lead-alert code for later: {page.ntfy_topic}</div>
      </div>)}
      {msg && <div style={{ marginTop:8, color:"#a33", fontSize:12 }}>{msg}</div>}
      <details style={{ marginTop:12 }}>
        <summary style={{ ...lab, cursor:"pointer" }}>Outreach script ({(page ? page.kind : form.kind) === "attorney" ? "attorney" : "planner"})</summary>
        {scripts.map(([title, text], i) => (
          <div key={i} style={{ marginTop:10, borderTop:`1px solid ${C.rule}`, paddingTop:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
              <b style={{ fontFamily:F.body, fontSize:13 }}>{title}</b>
              <button style={{ ...ghost, padding:"4px 9px" }} onClick={() => copy("s" + i, text)}>{copied === "s" + i ? "Copied" : "Copy"}</button>
            </div>
            <div style={{ whiteSpace:"pre-wrap", fontFamily:F.body, fontSize:13, color:C.ink, marginTop:4, lineHeight:1.45 }}>{text}</div>
          </div>
        ))}
        <div style={{ marginTop:8, color:C.mid, fontSize:12 }}>Swap the [brackets] for a real compliment on their post. Win = a scenario on your desk, not a reply.</div>
      </details>
    </div>
  );
}
