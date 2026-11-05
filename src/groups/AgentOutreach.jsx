// Agent outreach on Facebook / Instagram / LinkedIn messenger.
// Daily: about 10 messages to agents already in your friends, about 10 new friend requests.
// Claude fills the batch (name, area, a hook from their posts). Replies come to you and go on today's call list.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";
import { STEPS, TAKEOVER, CHANNELS, messageFor, linkedInNote } from "./outreachScripts.js";

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

export default function AgentOutreach({ userId, onContact }) {
  const [rows, setRows] = useState([]); const [view, setView] = useState("today"); const [chan, setChan] = useState("all");
  const [drafts, setDrafts] = useState({}); const [add, setAdd] = useState(null); const [msg, setMsg] = useState("");
  const t = localDay();
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("agent_outreach").select("*").order("created_at");
    if (error) setMsg(error.message); setRows(data || []);
  }, []);
  useEffect(() => { if (userId) load(); }, [userId, load]);

  const mine = rows.filter((r) => chan === "all" || r.channel === chan);
  const replied = mine.filter((r) => r.status === "replied");
  const due = mine.filter((r) => ["ready", "messaging"].includes(r.status) && (!r.next_date || r.next_date <= t));
  const requested = mine.filter((r) => r.status === "requested");
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
  const Meta = ({ r }) => <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, marginTop:2}}>{[chName(r.channel).toUpperCase(), r.area, r.brokerage, r.source].filter(Boolean).join(" · ")}</div>;
  const Profile = ({ r }) => r.profile_url ? <a href={r.profile_url} target="_blank" rel="noreferrer" style={btn}>Open profile</a> : null;

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
        <Tab k="today" l={`To message ${due.length}`}/><Tab k="requested" l={`Requests out ${requested.length}`}/><Tab k="replied" l={`Replied ${replied.length}`}/>
        <Tab k="later" l={`Waiting ${later.length}`}/><Tab k="closed" l={`Done ${closed.length}`}/><Tab k="scripts" l="Scripts"/>
        <select value={chan} onChange={(e) => setChan(e.target.value)} style={{...inp, width:"auto"}}><option value="all">All channels</option>{CHANNELS.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}</select>
        <button onClick={() => setAdd(add ? null : { ...EMPTY })} style={btn}>{add ? "Cancel" : "Add agent"}</button>
      </div>
      {msg && <div style={{fontFamily:F.mono, fontSize:12, color:C.red, marginBottom:10}}>{msg}</div>}

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

      {view === "replied" && <div style={{display:"grid", gap:10}}>
        <div style={{fontFamily:F.mono, fontSize:12, color:C.mid}}>These are yours now. Pick up the conversation in Messenger. They're tagged "outreach: replied" in Contacts.</div>
        {replied.map((r) => (
          <div key={r.id} style={{...card, padding:12, borderColor:C.amber}}>
            <div style={{fontFamily:F.cond, fontWeight:800, fontSize:17}}>{r.full_name}</div><Meta r={r}/>
            {r.last_message && <div style={{fontSize:13, color:C.mid, marginTop:6, whiteSpace:"pre-wrap"}}>Last sent: {r.last_message.slice(0, 160)}{r.last_message.length > 160 ? "..." : ""}</div>}
            <div style={{display:"flex", gap:8, marginTop:8}}><Profile r={r}/></div>
          </div>))}
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
          {TAKEOVER.map((g) => (
            <div key={g.title} style={{marginTop:10}}>
              <div style={{fontFamily:F.cond, fontWeight:800, fontSize:16}}>{g.title}</div>
              {g.lines.map((l) => <div key={l} style={{display:"flex", gap:8, alignItems:"center", marginTop:4}}><div style={{fontSize:14, flex:1}}>{l}</div><button onClick={() => copy(l)} style={{...btn, padding:"3px 9px", fontSize:12}}>Copy</button></div>)}
            </div>))}
          <div style={{fontFamily:F.mono, fontSize:11, color:C.light, marginTop:12}}>Leads you send agents are never tied to loans coming back to you (RESPA).</div>
        </div>
      </div>}
    </div>
  );
}
