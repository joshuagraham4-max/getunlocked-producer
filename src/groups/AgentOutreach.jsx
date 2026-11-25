// Agent outreach on Facebook / Instagram / LinkedIn messenger.
// Daily: about 10 messages to agents already in your friends, about 10 new friend requests.
// Claude fills the batch (name, area, a hook from their posts). Replies come to you and go on today's call list.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";
import AgentCoverage from "./AgentCoverage.jsx";
import { STEPS, TAKEOVER, CHANNELS, REPLY_FRAMEWORK, messageFor, linkedInNote, replySuggestions, agentRating, RATING_ORDER, WEEKLY_TOUCH, warmupReady, PREF_CHANNELS, prefLabel } from "./outreachScripts.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", greenBg:"#e8f4ee", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box", width:"100%" };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light };
const DAILY = 10;
const localDay = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localDay(d); };
const copy = (t) => navigator.clipboard?.writeText(t);
const chName = (k) => (CHANNELS.find((c) => c.k === k) || {}).l || k;
const EMPTY = { full_name:"", area:"", state:"FL", brokerage:"", profile_url:"", hook:"", channel:"facebook", source:"existing friend" };

function AgentList({ userId, onContact, onOpen }) {
  const [rows, setRows] = useState([]); const [view, setView] = useState("today"); const [chan, setChan] = useState("all");
  const [drafts, setDrafts] = useState({}); const [news, setNews] = useState({}); const [add, setAdd] = useState(null); const [msg, setMsg] = useState(""); const [q, setQ] = useState(""); const [lastQ, setLastQ] = useState("");
  const t = localDay();
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("agent_outreach").select("*").order("created_at");
    if (error) setMsg(error.message); setRows((data || []).filter((r) => !r.audience || r.audience === "agent"));
  }, []);
  useEffect(() => { if (userId) load(); }, [userId, load]);
  // Phone / email live on the GUP contact (Nov 25): pull them so search hits and Replied cards can show and copy them.
  const [cmap, setCmap] = useState({});
  useEffect(() => { const ids = [...new Set(rows.map((r) => r.contact_id).filter(Boolean))]; if (!ids.length) return;
    (async () => { const m = {}; for (let i = 0; i < ids.length; i += 80) {
      const { data } = await supabase.from("contacts").select("*").in("id", ids.slice(i, i + 80)); (data || []).forEach((c) => { m[c.id] = c; }); }
      setCmap(m); })(); }, [rows]);
  const openFull = (r) => { const c = cmap[r.contact_id]; if (!c) return; onContact && onContact(c); onOpen && onOpen(c); };

  const mine = rows.filter((r) => chan === "all" || r.channel === chan);
  const replied = mine.filter((r) => r.status === "replied").sort((a, b) => RATING_ORDER[agentRating(a).grade] - RATING_ORDER[agentRating(b).grade]);
  const due = mine.filter((r) => ["ready", "messaging"].includes(r.status) && (!r.next_date || r.next_date <= t));
  const requested = mine.filter((r) => r.status === "requested");
  const warming = mine.filter((r) => r.status === "warming").sort((a, b) => (b.warm_last_at || "").localeCompare(a.warm_last_at || ""));
  const later = mine.filter((r) => r.status === "messaging" && r.next_date > t);
  const closed = mine.filter((r) => ["no reply", "skipped"].includes(r.status));
  const sentToday = rows.filter((r) => r.sent_at && localDay(new Date(r.sent_at)) === t).length;
  const reqToday = rows.filter((r) => r.source === "new request" && localDay(new Date(r.created_at)) === t).length;

  const upd = async (r, f) => { const { error } = await supabase.from("agent_outreach").update(f).eq("id", r.id); if (error) setMsg(error.message); load(); };
  const textOf = (r) => drafts[r.id] ?? messageFor(r).text;
  const sent = (r) => { const m = messageFor(r); const ns = (r.step || 0) + 1;
    upd(r, { step:ns, status: ns >= 3 ? "no reply" : "messaging", next_date: ns >= 3 ? null : addDays(m.wait), last_message:textOf(r), sent_at:new Date().toISOString() });
    setDrafts((d) => { const x = { ...d }; delete x[r.id]; return x; }); };
  // The database trigger tags the contact "outreach: replied". Joshua takes over in Messenger; no call list entry.
  const gotReply = async (r) => {
    await upd(r, { status:"replied", replied_at:new Date().toISOString(), next_date:null });
    if (onContact && r.contact_id) { const { data } = await supabase.from("contacts").select("*").eq("id", r.contact_id).single(); if (data) onContact(data); }
  };
  const saveNew = async () => {
    if (!add.full_name.trim()) { setMsg("Name is required."); return; }
    const first = add.full_name.trim().split(/\s+/)[0];
    const { error } = await supabase.from("agent_outreach").insert({ ...add, user_id:userId, first_name:first, profile_url:add.profile_url.trim() || null,
      status: add.source === "new request" ? "requested" : "ready", next_date:t });
    if (error) { setMsg(error.message); return; } setAdd(null); setMsg(""); load();
  };

  const Tab = ({ k, l }) => <button onClick={() => setView(k)} style={{...(view === k ? btnG : btn), padding:"6px 14px"}}>{l}</button>;
  const Badge = ({ r }) => { const x = agentRating(r); const col = { A:C.green, B:C.amber, C:C.mid, "?":C.light }[x.grade];
    return <span title={x.label} style={{fontFamily:F.mono, fontSize:10, fontWeight:700, color:"#fff", background:col, borderRadius:4, padding:"1px 6px", marginRight:6}}>{x.grade}</span>; };
  const Meta = ({ r }) => <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, marginTop:2}}><Badge r={r}/>{[chName(r.channel).toUpperCase(), r.area, r.brokerage, r.source, agentRating(r).label, prefLabel(r)].filter(Boolean).join(" · ")}</div>;
  const num = (v) => { const x = String(v).replace(/[$,\s]/g, ""); if (!x) return null; const m = x.match(/^([\d.]+)([mk])?$/i); if (!m) return null; return Math.round(parseFloat(m[1]) * (m[2]?.toLowerCase() === "m" ? 1e6 : m[2]?.toLowerCase() === "k" ? 1e3 : 1)); };
  const PrefRow = ({ r }) => (
    <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:8}}>
      <div style={lbl}>Reach them by</div>
      <select value={r.pref_channel || ""} onChange={(e) => upd(r, { pref_channel:e.target.value || null })} style={{...inp, width:"auto"}}>
        <option value="">Not said yet</option>{PREF_CHANNELS.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
      </select>
      <input defaultValue={r.pref_value || ""} placeholder="Number or email" onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (r.pref_value || null)) upd(r, { pref_value:v }); }} style={{...inp, width:220}}/>
    </div>);
  const RateRow = ({ r }) => (
    <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginTop:8}}>
      <div style={lbl}>Last 12 months</div>
      <input defaultValue={r.sales_12m ?? ""} placeholder="Sales" onBlur={(e) => { const n = num(e.target.value); if (n !== (r.sales_12m ?? null)) upd(r, { sales_12m:n, volume_checked:t }); }} style={{...inp, width:80}}/>
      <input defaultValue={r.volume_12m ?? ""} placeholder="$ volume, e.g. 6.5M" onBlur={(e) => { const n = num(e.target.value); if (n !== (r.volume_12m === null ? null : Number(r.volume_12m))) upd(r, { volume_12m:n, volume_checked:t }); }} style={{...inp, width:150}}/>
      {r.volume_checked && <span style={{fontFamily:F.mono, fontSize:10, color:C.light}}>checked {r.volume_checked.slice(5)}{r.volume_source ? ` · ${r.volume_source}` : ""}</span>}
    </div>);
  const Profile = ({ r }) => r.profile_url ? <a href={r.profile_url} target="_blank" rel="noreferrer" style={btn}>Open profile</a> : null;
  const Name = ({ r, size = 18 }) => { const can = !!(r.contact_id && cmap[r.contact_id] && onOpen);
    return <div onClick={() => can && openFull(r)} title={can ? "Open full contact" : ""} style={{fontFamily:F.cond, fontWeight:800, fontSize:size, cursor: can ? "pointer" : "default", color: can ? C.green : "inherit", textDecoration: can ? "underline" : "none", textUnderlineOffset:3}}>{r.full_name}</div>; };
  const Reach = ({ r }) => { const c = cmap[r.contact_id]; if (!c) return r.contact_id ? null : <div style={{fontFamily:F.mono, fontSize:11, color:C.light, marginTop:6}}>Not linked to a GUP contact yet.</div>;
    const items = [["Phone", c.phone], ["Phone 2", c.phone_2], ["Email", c.email], ["Email 2", c.email_2]].filter(([, v]) => v);
    if (!items.length) return <div style={{fontFamily:F.mono, fontSize:11, color:C.amber, marginTop:6}}>No phone or email on file yet.</div>;
    return <div style={{display:"flex", gap:12, flexWrap:"wrap", marginTop:6}}>
      {items.map(([k, v]) => <span key={k} style={{display:"inline-flex", alignItems:"center", gap:6, fontFamily:F.mono, fontSize:12}}>
        <span style={{color:C.light}}>{k}</span>
        <a href={k.startsWith("Phone") ? `tel:${String(v).replace(/[^\d+]/g, "")}` : `mailto:${v}`} style={{color:C.ink}}>{v}</a>
        <button onClick={() => copy(v)} style={{...btn, padding:"2px 8px", fontSize:11}}>Copy</button></span>)}
    </div>; };
  const OpenBtn = ({ r }) => r.contact_id && cmap[r.contact_id] && onOpen ? <button onClick={() => openFull(r)} style={btn}>Open full contact</button> : null;

  const DueCard = ({ r }) => { const m = messageFor(r); return (
    <div style={{...card, padding:14}}>
      <div style={{display:"flex", justifyContent:"space-between", gap:8, alignItems:"baseline"}}>
        <div><div style={{fontFamily:F.cond, fontWeight:800, fontSize:19}}>{r.full_name}</div><Meta r={r}/></div>
        <span style={{fontFamily:F.mono, fontSize:10, color:C.green}}>MESSAGE {(r.step || 0) + 1} OF 3 · {m.stepName.toUpperCase()}</span>
      </div>
      <div style={{marginTop:8}}><div style={lbl}>Hook from their posts</div>
        <input defaultValue={r.hook || ""} placeholder="e.g. Congrats on the Cheval sale" onBlur={(e) => e.target.value !== (r.hook || "") && upd(r, { hook:e.target.value })} style={{...inp, marginTop:4}}/></div>
      <textarea value={textOf(r)} onChange={(e) => setDrafts((d) => ({ ...d, [r.id]:e.target.value }))} rows={(r.step || 0) === 0 ? 9 : 4} style={{...inp, marginTop:8, lineHeight:1.5, resize:"vertical"}}/>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:10}}>
        <Profile r={r}/><button onClick={() => copy(textOf(r))} style={btn}>Copy message</button>
        <button onClick={() => sent(r)} style={btnG}>Sent</button>
        <button onClick={() => gotReply(r)} style={btn}>They replied</button>
        <button onClick={() => upd(r, { status:"skipped", next_date:null })} style={{...btn, color:C.red}}>Skip</button>
      </div>
    </div>); };

  return (
    <div>
      <div style={{display:"flex", gap:16, flexWrap:"wrap", alignItems:"center", marginBottom:12}}>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize:20}}>Messaged today {sentToday}/{DAILY}</div>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize:20}}>Friend requests today {reqToday}/{DAILY}</div>
        {replied.length > 0 && <div style={{fontFamily:F.cond, fontWeight:800, fontSize:20, color:C.amber}}>{replied.length} replied</div>}
      </div>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
        <Tab k="today" l={`To message ${due.length}`}/><Tab k="warming" l={`Warming up ${warming.length}`}/><Tab k="requested" l={`Requests out ${requested.length}`}/><Tab k="replied" l={`Replied ${replied.length}`}/>
        <Tab k="later" l={`Waiting ${later.length}`}/><Tab k="closed" l={`Done ${closed.length}`}/><Tab k="coverage" l="Coverage"/><Tab k="scripts" l="Scripts"/>
        <select value={chan} onChange={(e) => setChan(e.target.value)} style={{...inp, width:"auto"}}><option value="all">All channels</option>{CHANNELS.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}</select>
        <button onClick={() => setAdd(add ? null : { ...EMPTY })} style={btn}>{add ? "Cancel" : "Add agent"}</button>
      </div>
      {msg && <div style={{fontFamily:F.mono, fontSize:12, color:C.red, marginBottom:10}}>{msg}</div>}
      {lastQ && !q && <button onClick={() => { setQ(lastQ); setLastQ(""); }} style={{...btn, marginBottom:10}}>← Back to search "{lastQ}"</button>}
      <input placeholder="Quick find: name, brokerage or area (when someone calls or messages back)" value={q} onChange={(e) => { setQ(e.target.value); setLastQ(""); }} style={{...inp, marginBottom:12, fontSize:15}}/>
      {q.trim().length >= 2 && (() => {
        const words = q.toLowerCase().trim().split(/\s+/);
        const hits = rows.filter((r) => { const hay = [r.full_name, r.brokerage, r.area, r.state, r.hook].filter(Boolean).join(" ").toLowerCase(); return words.every((w) => hay.includes(w)); }).slice(0, 12);
        return <div style={{display:"grid", gap:8, marginBottom:16}}>
          {!hits.length && <div style={{...card, padding:12, color:C.mid}}>No partner matches "{q}". Check Contacts, or add them with Add agent.</div>}
          {hits.map((r) => (
            <div key={r.id} style={{...card, padding:12, borderColor:C.green}}>
              <div style={{display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap"}}>
                <Name r={r}/>
                <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, textTransform:"uppercase"}}>{r.status}{r.step ? ` · message ${r.step} of 3` : ""}{r.sent_at ? ` · last sent ${localDay(new Date(r.sent_at))}` : ""}</div>
              </div>
              <Meta r={r}/>
              <Reach r={r}/>
              {prefLabel(r) && <div style={{fontFamily:F.cond, fontWeight:800, fontSize:15, color:C.green, marginTop:4}}>{prefLabel(r)}</div>}
              {r.hook && <div style={{fontSize:13, color:C.mid, marginTop:4}}>Hook: {r.hook}</div>}
              {r.last_message && <div style={{fontSize:13, color:C.mid, marginTop:6, whiteSpace:"pre-wrap"}}>Last sent: {r.last_message.slice(0, 220)}{r.last_message.length > 220 ? "..." : ""}</div>}
              <div style={{display:"flex", gap:8, marginTop:8, flexWrap:"wrap"}}>
                <Profile r={r}/><OpenBtn r={r}/>
                {r.status !== "replied" && <button onClick={() => { gotReply(r); setLastQ(q); setQ(""); setView("replied"); }} style={btnG}>They replied</button>}
                {r.status === "replied" && <button onClick={() => { setLastQ(q); setQ(""); setView("replied"); }} style={btn}>Open in Replied</button>}
              </div>
            </div>))}
        </div>;
      })()}

      {add && (
        <div style={{...card, padding:14, marginBottom:14, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10}}>
          {[["full_name","Name"],["area","Area (city or county)"],["brokerage","Brokerage"],["profile_url","Profile link"],["hook","Hook from their posts"]].map(([k, l]) =>
            <label key={k}><div style={lbl}>{l}</div><input value={add[k]} onChange={(e) => setAdd({ ...add, [k]:e.target.value })} style={{...inp, marginTop:4}}/></label>)}
          <label><div style={lbl}>State</div><select value={add.state} onChange={(e) => setAdd({ ...add, state:e.target.value })} style={{...inp, marginTop:4}}><option>FL</option><option>CO</option><option>Other</option></select></label>
          <label><div style={lbl}>Channel</div><select value={add.channel} onChange={(e) => setAdd({ ...add, channel:e.target.value })} style={{...inp, marginTop:4}}>{CHANNELS.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}</select></label>
          <label><div style={lbl}>Already connected?</div><select value={add.source} onChange={(e) => setAdd({ ...add, source:e.target.value })} style={{...inp, marginTop:4}}><option value="existing friend">Yes, already connected</option><option value="new request">No, request sent</option></select></label>
          <div style={{display:"flex", alignItems:"end"}}><button onClick={saveNew} style={btnG}>Save</button></div>
        </div>)}

      {view === "today" && <div style={{display:"grid", gap:12}}>
        {due.length === 0 && <div style={{...card, padding:14, color:C.mid}}>Nobody due. Claude loads the next batch in your 9:45 block.</div>}
        {due.map((r) => <div key={r.id}>{DueCard({ r })}</div>)}
      </div>}

      {view === "requested" && <div style={{display:"grid", gap:10}}>
        {requested.map((r) => (
          <div key={r.id} style={{...card, padding:12}}>
            <div style={{display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap", alignItems:"center"}}>
              <div><div style={{fontFamily:F.cond, fontWeight:800, fontSize:17}}>{r.full_name}</div><Meta r={r}/></div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}><Profile r={r}/>
                {r.channel === "linkedin" && <button onClick={() => copy(linkedInNote({ first:r.first_name || r.full_name.split(" ")[0], area:r.area, hook:r.hook }))} style={btn}>Copy connect note</button>}
                <button onClick={() => upd(r, { status:"ready", next_date:t })} style={btnG}>Accepted</button>
                <button onClick={() => upd(r, { status:"skipped", next_date:null })} style={{...btn, color:C.red}}>Drop</button></div>
            </div>
          </div>))}
        {requested.length === 0 && <div style={{...card, padding:14, color:C.mid}}>No requests waiting.</div>}
      </div>}

      {view === "warming" && <div style={{display:"grid", gap:8}}>
        <div style={{fontFamily:F.mono, fontSize:12, color:C.mid}}>Agents whose listings you've commented on. Claude picks these up from your Facebook activity on Mondays and Thursdays. They move into outreach after 2+ comment days over a week (or 2 weeks with any comment).</div>
        {warming.map((r) => { const ready = warmupReady(r); return (
          <div key={r.id} style={{...card, padding:10, display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap", alignItems:"center", borderColor: ready ? C.green : C.rule}}>
            <div><b>{r.full_name}</b><Meta r={r}/></div>
            <span style={{fontFamily:F.mono, fontSize:11, color: ready ? C.green : C.mid}}>{r.warm_comments || 0} comment day{(r.warm_comments || 0) === 1 ? "" : "s"} · since {(r.warm_first_at || "").slice(5)}{ready ? " · ready" : ""}</span>
            <div style={{display:"flex", gap:6}}><Profile r={r}/>
              <button onClick={() => upd(r, { status:"ready", next_date:t })} style={ready ? btnG : btn}>Start outreach</button>
              <button onClick={() => upd(r, { status:"skipped", next_date:null })} style={{...btn, color:C.red}}>Skip</button></div>
          </div>); })}
        {warming.length === 0 && <div style={{...card, padding:14, color:C.mid}}>Nobody warming up. Comment on a few agents' listings and they'll show here after the next Monday or Thursday run.</div>}
      </div>}

      {view === "coverage" && <AgentCoverage rows={rows} onContact={onContact}/>}
      {view === "replied" && <div style={{display:"grid", gap:10}}>
        <div style={{fontFamily:F.mono, fontSize:12, color:C.mid}}>These are yours now. Pick up the conversation in Messenger. They're tagged "outreach: replied" in Contacts. Best-rated first: A is 24+ sales or $10M+ in the last 12 months, B is 10+ or $4M+, C is less.</div>
        {replied.map((r) => (
          <div key={r.id} style={{...card, padding:12, borderColor:C.amber}}>
            <Name r={r} size={17}/><Meta r={r}/>
            <Reach r={r}/>
            <div style={{fontFamily:F.cond, fontWeight:800, fontSize:15, color: r.pref_channel ? C.green : C.amber, marginTop:4}}>{prefLabel(r) || "How they want to hear from you: not noted yet"}</div>
            {r.last_message && <div style={{fontSize:13, color:C.mid, marginTop:6, whiteSpace:"pre-wrap"}}>Last sent: {r.last_message.slice(0, 160)}{r.last_message.length > 160 ? "..." : ""}</div>}
            <div style={{display:"flex", gap:8, marginTop:8}}><Profile r={r}/><OpenBtn r={r}/></div>
            <PrefRow r={r}/>
            <RateRow r={r}/>
            <div style={{marginTop:10}}>
              <div style={lbl}>Reply suggestions</div>
              <input placeholder="What did they mention? e.g. the Brighton and Castle Rock listings" value={news[r.id] || ""} onChange={(e) => setNews((x) => ({ ...x, [r.id]:e.target.value }))} style={{...inp, marginTop:4}}/>
              {replySuggestions({ first:r.first_name || (r.full_name || "").split(" ")[0], area:r.area, news:news[r.id] }).map((s) => (
                <div key={s.title} style={{marginTop:8}}>
                  <div style={{fontFamily:F.cond, fontWeight:700, fontSize:14, color:C.mid}}>{s.title}</div>
                  <div style={{display:"flex", gap:8, alignItems:"flex-start", marginTop:3}}>
                    <div style={{fontSize:14, flex:1, whiteSpace:"pre-wrap", lineHeight:1.45, padding:8, background:"#fff", borderRadius:6, border:`1px solid ${C.rule}`}}>{s.text}</div>
                    <button onClick={() => copy(s.text)} style={{...btn, padding:"3px 9px", fontSize:12}}>Copy</button>
                  </div>
                </div>))}
            </div>
          </div>))}
        {replied.length > 0 && <div style={{fontFamily:F.mono, fontSize:11, color:C.light}}>Leads you send agents are never tied to loans coming back to you (RESPA).</div>}
      </div>}

      {(view === "later" || view === "closed") && <div style={{display:"grid", gap:8}}>
        {(view === "later" ? later : closed).map((r) => (
          <div key={r.id} style={{...card, padding:10, display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap"}}>
            <div><b>{r.full_name}</b><Meta r={r}/></div>
            <span style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{view === "later" ? `message ${(r.step || 0) + 1} on ${(r.next_date || "").slice(5)}` : r.status}</span>
            {view === "later" && <button onClick={() => gotReply(r)} style={btn}>They replied</button>}
          </div>))}
      </div>}

      {view === "scripts" && <div style={{display:"grid", gap:12}}>
        <div style={{...card, padding:14}}>
          <div style={lbl}>The sequence (Facebook and Instagram; LinkedIn after they accept)</div>
          {STEPS.map((s) => (
            <div key={s.step} style={{marginTop:12}}>
              <div style={{fontFamily:F.cond, fontWeight:800, fontSize:17}}>{s.step}. {s.name}{s.wait ? ` · next in ${s.wait} days if no reply` : " · then stop"}</div>
              {s.variants.map((v, i) => <div key={i} style={{fontSize:14, whiteSpace:"pre-wrap", lineHeight:1.5, marginTop:6, padding:10, background:"#fff", borderRadius:6, border:`1px solid ${C.rule}`}}>{v({ first:"Brett", area:"Tampa", hook:"Congrats on the Cheval sale" })}</div>)}
            </div>))}
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:17, marginTop:14}}>LinkedIn connection note</div>
          <div style={{fontSize:14, marginTop:6, padding:10, background:"#fff", borderRadius:6, border:`1px solid ${C.rule}`}}>{linkedInNote({ first:"Brett", area:"Tampa", hook:"Congrats on the Cheval sale" })}</div>
        </div>
        <div style={{...card, padding:14}}>
          <div style={lbl}>When they reply, you take over</div>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:16, marginTop:10}}>First reply framework</div>
          <ol style={{margin:"4px 0 0 18px", padding:0, fontSize:14, lineHeight:1.5}}>{REPLY_FRAMEWORK.map((x) => <li key={x}>{x}</li>)}</ol>
          <div style={{fontSize:14, whiteSpace:"pre-wrap", lineHeight:1.5, marginTop:6, padding:10, background:"#fff", borderRadius:6, border:`1px solid ${C.rule}`}}>{replySuggestions({ first:"Kayte", area:"Denver metro", news:"the Brighton and Castle Rock listings" })[0].text}</div>
          {TAKEOVER.map((g) => (
            <div key={g.title} style={{marginTop:10}}>
              <div style={{fontFamily:F.cond, fontWeight:800, fontSize:16}}>{g.title}</div>
              {g.lines.map((l) => <div key={l} style={{display:"flex", gap:8, alignItems:"center", marginTop:4}}><div style={{fontSize:14, flex:1}}>{l}</div><button onClick={() => copy(l)} style={{...btn, padding:"3px 9px", fontSize:12}}>Copy</button></div>)}
            </div>))}
          <div style={{fontFamily:F.mono, fontSize:11, color:C.light, marginTop:12}}>Leads you send agents are never tied to loans coming back to you (RESPA).</div>
        </div>
        <div style={{...card, padding:14}}>
          <div style={lbl}>Weekly touch · Thursdays, late day, on Messenger</div>
          <div style={{fontSize:13, color:C.mid, marginTop:4}}>Goes to agents who replied or finished the sequence. Not agents still in the sequence, or anyone messaged in the last 3 days. Wording rotates each week. Claude lines them up Thursday afternoon and sends after your go.</div>
          {WEEKLY_TOUCH.map((v, i) => <div key={i} style={{fontSize:14, whiteSpace:"pre-wrap", lineHeight:1.5, marginTop:6, padding:10, background:"#fff", borderRadius:6, border:`1px solid ${C.rule}`}}>{v({ first:"Paige" })}</div>)}
        </div>
      </div>}
    </div>
  );
}

// Cash → Partners: one switch for the three Facebook DM campaigns. Agents use the full list above;
// planners, attorneys and CPAs (audience column, filled by the partner DM scheduled tasks) get a simple status view.
const CAMPAIGNS = [["agent", "Agents"], ["planner", "Financial planners"], ["attorney", "Family law attorneys"], ["cpa", "CPAs"]];
export default function AgentOutreach(props) {
  const [aud, setAud] = useState(() => { try { return localStorage.getItem("gup-outreach-aud") || "agent"; } catch { return "agent"; } });
  const pick = (k) => { setAud(k); try { localStorage.setItem("gup-outreach-aud", k); } catch {} };
  return (
    <div>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:16}}>
        {CAMPAIGNS.map(([k, l]) => <button key={k} onClick={() => pick(k)} style={aud === k ? btnG : btn}>{l}</button>)}
      </div>
      {aud === "agent" ? <AgentList {...props}/> : <PartnerCampaign key={aud} aud={aud} userId={props.userId}/>}
    </div>
  );
}

function PartnerCampaign({ aud, userId }) {
  const [rows, setRows] = useState(null); const [msg, setMsg] = useState("");
  const t = localDay();
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("agent_outreach").select("*").eq("audience", aud).order("created_at", { ascending:false });
    if (error) { setMsg(/audience/.test(error.message) ? "Run supabase/partner_pages_v2.sql first." : error.message); setRows([]); return; }
    setRows(data || []);
  }, [aud]);
  useEffect(() => { if (userId) load(); }, [userId, load]);
  const upd = async (r, f) => { const { error } = await supabase.from("agent_outreach").update(f).eq("id", r.id); if (error) setMsg(error.message); load(); };
  if (rows === null) return null;
  const sentToday = rows.filter((r) => r.sent_at && localDay(new Date(r.sent_at)) === t).length;
  const groups = [
    ["Replied", rows.filter((r) => r.status === "replied")],
    ["Nudge due", rows.filter((r) => r.status === "messaging" && r.next_date && r.next_date <= t)],
    ["Messaged, waiting", rows.filter((r) => r.status === "messaging" && (!r.next_date || r.next_date > t))],
    ["Ready to message", rows.filter((r) => r.status === "ready")],
    ["No reply / skipped", rows.filter((r) => ["no reply", "skipped"].includes(r.status))],
  ];
  const label = aud === "attorney" ? "family law attorneys" : aud === "cpa" ? "CPAs" : "financial planners";
  return (
    <div>
      <div style={{display:"flex", gap:16, flexWrap:"wrap", alignItems:"center", marginBottom:12}}>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize:20}}>Messaged today {sentToday}/10</div>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize:20, color:C.mid}}>{rows.length} {label} in the campaign</div>
      </div>
      <div style={{fontSize:13, color:C.mid, marginBottom:14}}>Filled by the weekday scheduled task ({aud === "attorney" ? "2:23 PM" : aud === "cpa" ? "11:07 AM" : "12:37 PM"} ET). Nothing sends until you say go in that run's chat. Win = a scenario on your desk.</div>
      {msg && <div style={{color:C.red, marginBottom:10}}>{msg}</div>}
      {rows.length === 0 && <div style={{...card, padding:16, color:C.mid}}>No {label} yet. The first batch lands with the next run.</div>}
      {groups.filter(([, g]) => g.length).map(([title, g]) => (
        <div key={title} style={{marginBottom:18}}>
          <div style={lbl}>{title} · {g.length}</div>
          <div style={{display:"grid", gap:10, marginTop:8}}>
            {g.map((r) => (
              <div key={r.id} style={{...card, padding:"12px 14px"}}>
                <div style={{display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap"}}>
                  <div><b style={{fontFamily:F.cond, fontSize:18}}>{r.full_name}</b> <span style={{color:C.mid, fontSize:13}}>{[r.brokerage, [r.area, r.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</span></div>
                  <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                    {r.profile_url && <a href={r.profile_url} target="_blank" rel="noreferrer" style={btn}>Profile</a>}
                    {r.status !== "replied" && <button style={btn} onClick={() => upd(r, { status:"replied", replied_at:new Date().toISOString(), next_date:null })}>Got a reply</button>}
                    {!["skipped", "no reply"].includes(r.status) && <button style={btn} onClick={() => upd(r, { status:"skipped", next_date:null })}>Skip</button>}
                  </div>
                </div>
                {r.hook && <div style={{fontSize:13, marginTop:6}}><span style={lbl}>Hook </span>{r.hook}</div>}
                {r.last_message && <div style={{fontSize:13, marginTop:6, whiteSpace:"pre-wrap", color:C.ink}}><span style={lbl}>Last sent </span>{r.last_message}</div>}
                {r.notes && <div style={{fontSize:12, marginTop:6, color:C.mid}}>{r.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
