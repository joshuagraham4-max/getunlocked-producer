// Groups: investor Facebook group posting kit. Tools and links, a rotating post bank (each post once per day),
// the group list, and a log of where each post went.
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase.js";
import { today, BOOKING } from "../radar/engine.js";
import ProfilePosts from "./ProfilePosts.jsx";
import AgentOutreach from "./AgentOutreach.jsx";
import { buildAssignments, buildJob, sendToClaude, DAILY_MAX } from "./askClaude.js";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box", width:"100%" };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light };
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://getunlocked-producer.vercel.app";
const CALC = `${ORIGIN}/rental-calculator`;
// Tools and links. Add new tools here as they go live.
const TOOLS = [
  { name:"Rental Property Calculator", url:CALC, note:"Cash flow and whether the rent qualifies the loan. Saves the lead to Contacts." },
  { name:"Book a call with Joshua", url:BOOKING, note:"Google booking page." },
];
const COMING = ["Equity Unlock Estimator", "Income Qualifier", "DPA estimator", "Medical Pro Buying-Power Check"];
const IMAGES = [ { name:"Plum suit", src:"/groups/JG-SaveDeals-plum.png" }, { name:"Plaid suit", src:"/groups/JG-SaveDeals-plaid.png" } ];
import { SIGN_BLOCK } from "./askClaude.js";
const fill = (t) => t.replaceAll("{CALC}", CALC).replaceAll("{BOOK}", BOOKING).replaceAll("{SIGN}", SIGN_BLOCK);
const copy = (t) => navigator.clipboard?.writeText(t);

export default function GroupsTab({ userId, onContact }) {
  const [posts, setPosts] = useState([]); const [groups, setGroups] = useState([]); const [log, setLog] = useState([]);
  const [view, setView] = useState("today");
  const [edit, setEdit] = useState(null); const [newG, setNewG] = useState({ name:"", url:"", members:"", rules:"", promo_day:"" });
  const [pick, setPick] = useState({}); const [msg, setMsg] = useState("");
  const [showJob, setShowJob] = useState(false); const [sent, setSent] = useState(false);
  const t = today();

  const load = useCallback(async () => {
    const [p, g, l] = await Promise.all([
      supabase.from("group_posts").select("*").order("sort"),
      supabase.from("fb_groups").select("*").order("created_at"),
      supabase.from("group_post_log").select("*").order("created_at", { ascending:false }).limit(500),
    ]);
    setPosts(p.data || []); setGroups(g.data || []); setLog(l.data || []);
  }, []);
  useEffect(() => { if (userId) load(); }, [userId, load]);

  const usedToday = useMemo(() => Object.fromEntries(log.filter((x) => x.day === t).map((x) => [x.post_id, x])), [log, t]);
  const lastIn = useMemo(() => { const m = {}; for (const x of log) if (!m[x.group_id]) m[x.group_id] = x.day; return m; }, [log]);
  const gName = (id) => groups.find((g) => g.id === id)?.name || "a group";
  const active = posts.filter((p) => p.active);
  const postedToday = active.filter((p) => usedToday[p.id]).length;
  const joined = groups.filter((g) => g.status === "joined");
  const plan = useMemo(() => buildAssignments({ posts, groups, log, day:t }), [posts, groups, log, t]);
  const job = useMemo(() => buildJob({ assignments:plan.assignments, userId, day:t }), [plan, userId, t]);
  const askClaude = async () => { await sendToClaude(job); setSent(true); };

  const markPosted = async (p) => {
    const gid = pick[p.id]; if (!gid) { setMsg("Pick the group first."); return; }
    const { error } = await supabase.from("group_post_log").insert({ user_id:userId, post_id:p.id, group_id:gid, day:t });
    setMsg(error ? "Save failed: " + error.message : ""); load();
  };
  const unPost = async (p) => { const x = usedToday[p.id]; if (x) { await supabase.from("group_post_log").delete().eq("id", x.id); load(); } };
  const savePost = async () => {
    const row = { title:edit.title.trim() || "Untitled", body:edit.body, image:edit.image || null, active:edit.active !== false };
    const q = edit.id ? supabase.from("group_posts").update(row).eq("id", edit.id) : supabase.from("group_posts").insert({ ...row, user_id:userId, sort:posts.length });
    const { error } = await q; if (error) setMsg("Save failed: " + error.message); else { setEdit(null); load(); }
  };
  const addGroup = async () => {
    if (!newG.name.trim()) return;
    const { error } = await supabase.from("fb_groups").insert({ ...newG, user_id:userId });
    if (error) setMsg("Save failed: " + error.message); else { setNewG({ name:"", url:"", members:"", rules:"", promo_day:"" }); load(); }
  };
  const setStatus = async (g, status) => { await supabase.from("fb_groups").update({ status }).eq("id", g.id); load(); };

  const Tab = ({ k, l }) => <button onClick={() => setView(k)} style={{...(view === k ? btnG : btn), padding:"9px 18px", fontSize:15}}>{l}</button>;

  return (
    <div>
      <div style={{display:"flex", gap:8, marginBottom:14, flexWrap:"wrap"}}>
        <Tab k="profile" l="Profile posts"/><Tab k="today" l={`Group posts ${postedToday}/${active.length}`}/><Tab k="groups" l={`Groups ${joined.length}/${groups.length}`}/><Tab k="outreach" l="Agent outreach"/><Tab k="tools" l="Tools & links"/><Tab k="bank" l="Post bank"/>
      </div>
      {msg && <div style={{fontFamily:F.mono, fontSize:12, color:C.red, marginBottom:10}}>{msg}</div>}

      {view === "profile" && <ProfilePosts userId={userId}/>}
      {view === "outreach" && <AgentOutreach userId={userId} onContact={onContact}/>}

      {view === "today" && (
        <>
          <div style={{...card, padding:"14px 16px", marginBottom:14, borderColor:C.green}}>
            <div style={{display:"flex", gap:12, alignItems:"center", flexWrap:"wrap"}}>
              <div style={{flex:"1 1 260px"}}>
                <div style={{fontFamily:F.cond, fontWeight:800, fontSize:19}}>Ask Claude to post</div>
                <div style={{fontSize:13, color:C.mid}}>{plan.assignments.length
                  ? `${plan.assignments.length} post${plan.assignments.length > 1 ? "s" : ""} lined up for today. Claude posts them from your desktop Chrome, about 20 minutes apart, and checks with you before each one.`
                  : plan.slots === 0 ? `Today's ${DAILY_MAX} group posts are done.` : "Nothing to post right now. Every group that allows promo posts is either done today or has seen all the posts recently."}</div>
              </div>
              {plan.assignments.length > 0 && <button onClick={askClaude} style={{...btnG, padding:"10px 18px", fontSize:16}}>Ask Claude to post</button>}
              {plan.assignments.length > 0 && <button onClick={() => setShowJob((x) => !x)} style={btn}>{showJob ? "Hide job" : "See job"}</button>}
            </div>
            {plan.assignments.length > 0 && <div style={{marginTop:10, display:"grid", gap:4}}>
              {plan.assignments.map((a) => <div key={a.group.id} style={{fontFamily:F.mono, fontSize:12, color:C.ink}}>{a.group.name} <span style={{color:C.light}}>gets</span> {a.post.title} <span style={{color:C.light}}>with {a.image.includes("plaid") ? "plaid" : a.image.includes("plum") ? "plum" : "post"} image</span></div>)}
            </div>}
            {plan.skipped.length > 0 && <div style={{marginTop:8, fontFamily:F.mono, fontSize:11, color:C.amber}}>Skipped: {plan.skipped.join(" · ")}</div>}
            {sent && <div style={{marginTop:8, fontFamily:F.mono, fontSize:12, color:C.green}}>The job is copied and Claude is opening. If the message box is empty, paste it in. Posts show here as Posted once Claude logs them.</div>}
            {showJob && <textarea readOnly value={job} rows={14} onFocus={(e) => e.target.select()} style={{...inp, marginTop:10, fontFamily:F.mono, fontSize:12, lineHeight:1.45}}/>}
          </div>
          <div style={{...card, padding:"12px 16px", marginBottom:14, fontFamily:F.mono, fontSize:12, color:C.mid}}>
            One post per group, and each post only once a day, so every group sees something different. Copy the text, save the image, post it, then pick the group and hit Posted.
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14}}>
            {active.map((p) => { const u = usedToday[p.id]; return (
              <div key={p.id} style={{...card, padding:14, opacity:u ? 0.55 : 1}}>
                <div style={{display:"flex", gap:12}}>
                  {p.image && <a href={p.image} download><img src={p.image} alt="" style={{width:92, height:92, borderRadius:6, objectFit:"cover"}}/></a>}
                  <div style={{minWidth:0}}>
                    <div style={{fontFamily:F.cond, fontWeight:800, fontSize:19}}>{p.title}</div>
                    {u ? <div style={{fontFamily:F.mono, fontSize:11, color:C.green, marginTop:4}}>Posted today in {gName(u.group_id)} <button onClick={() => unPost(p)} style={{...btn, padding:"1px 8px", fontSize:11, marginLeft:6}}>Undo</button></div>
                       : <div style={{fontFamily:F.mono, fontSize:11, color:C.light, marginTop:4}}>Not posted yet today</div>}
                  </div>
                </div>
                <div style={{fontSize:14, lineHeight:1.5, whiteSpace:"pre-wrap", margin:"10px 0"}}>{fill(p.body)}</div>
                <div style={{display:"flex", gap:6, flexWrap:"wrap", alignItems:"center"}}>
                  <button onClick={() => copy(fill(p.body))} style={btnG}>Copy text</button>
                  {p.image && <a href={p.image} download style={btn}>Save image</a>}
                  {!u && <>
                    <select value={pick[p.id] || ""} onChange={(e) => setPick((x) => ({ ...x, [p.id]:e.target.value }))} style={{...inp, width:"auto", flex:"1 1 140px"}}>
                      <option value="">Posted in which group?</option>
                      {groups.filter((g) => g.status !== "removed").map((g) => <option key={g.id} value={g.id}>{g.name}{lastIn[g.id] === t ? " (posted today)" : ""}</option>)}
                    </select>
                    <button onClick={() => markPosted(p)} style={btn}>Posted</button>
                  </>}
                </div>
              </div>); })}
          </div>
          {groups.length === 0 && <div style={{fontFamily:F.mono, fontSize:12, color:C.amber, marginTop:12}}>No groups yet. Add them on the Groups tab so you can log where each post went.</div>}
        </>
      )}

      {view === "groups" && (
        <div style={{...card, overflow:"hidden"}}>
          <div style={{padding:"14px 16px", borderBottom:`1px solid ${C.rule}`, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8}}>
            {[["name","Group name"],["url","Link"],["members","Members"],["rules","Rules on lender posts"],["promo_day","Promo day"]].map(([k, l]) => <input key={k} placeholder={l} value={newG[k]} onChange={(e) => setNewG((g) => ({ ...g, [k]:e.target.value }))} style={inp}/>)}
            <button onClick={addGroup} style={btnG}>Add group</button>
          </div>
          {groups.map((g) => (
            <div key={g.id} style={{display:"grid", gridTemplateColumns:"1.6fr 1fr 1.6fr 110px 130px", gap:10, alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #ece5d9", fontSize:14}}>
              <div><div style={{fontFamily:F.cond, fontWeight:700, fontSize:16}}>{g.url ? <a href={g.url} target="_blank" rel="noreferrer" style={{color:C.ink}}>{g.name}</a> : g.name}</div><div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{g.members ? `${g.members} members` : ""}</div></div>
              <div style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{g.promo_day ? `Promo: ${g.promo_day}` : ""}</div>
              <div style={{fontSize:13, color:C.mid}}>{g.rules}</div>
              <div style={{fontFamily:F.mono, fontSize:11}}>{lastIn[g.id] ? `last ${lastIn[g.id].slice(5)}` : "never posted"}</div>
              <select value={g.status} onChange={(e) => setStatus(g, e.target.value)} style={{...inp, padding:"5px"}}>{["to join","requested","joined","removed"].map((s) => <option key={s}>{s}</option>)}</select>
            </div>))}
          {groups.length === 0 && <div style={{padding:16, fontFamily:F.mono, fontSize:12, color:C.light}}>No groups yet.</div>}
        </div>
      )}

      {view === "tools" && (
        <div style={{display:"grid", gap:14}}>
          {TOOLS.map((x) => (
            <div key={x.name} style={{...card, padding:"14px 16px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap"}}>
              <div style={{flex:"1 1 260px"}}><div style={{fontFamily:F.cond, fontWeight:800, fontSize:18}}>{x.name}</div><div style={{fontSize:13, color:C.mid}}>{x.note}</div><div style={{fontFamily:F.mono, fontSize:11, color:C.light, wordBreak:"break-all"}}>{x.url}</div></div>
              <button onClick={() => copy(x.url)} style={btnG}>Copy link</button><a href={x.url} target="_blank" rel="noreferrer" style={btn}>Open</a>
            </div>))}
          <div style={{...card, padding:"14px 16px"}}>
            <div style={lbl}>Images</div>
            <div style={{display:"flex", gap:12, marginTop:8, flexWrap:"wrap"}}>{IMAGES.map((im) => <a key={im.src} href={im.src} download style={{textAlign:"center", color:C.ink, textDecoration:"none", fontFamily:F.mono, fontSize:11}}><img src={im.src} alt={im.name} style={{width:160, height:160, borderRadius:8, display:"block", marginBottom:4}}/>{im.name}</a>)}</div>
          </div>
          <div style={{...card, padding:"14px 16px"}}><div style={lbl}>Coming next</div><div style={{fontSize:14, color:C.mid, marginTop:6}}>{COMING.join(" · ")}</div></div>
        </div>
      )}

      {view === "bank" && (
        <div style={{display:"grid", gap:12}}>
          <div><button onClick={() => setEdit({ title:"", body:"", image:"", active:true })} style={btnG}>+ New post</button>
            <span style={{fontFamily:F.mono, fontSize:11, color:C.light, marginLeft:10}}>Use {"{CALC}"} for the calculator link, {"{BOOK}"} for your booking link, and {"{SIGN}"} for your phone + NMLS (soft offers only).</span></div>
          {edit && (
            <div style={{...card, padding:14, display:"grid", gap:8}}>
              <input value={edit.title} onChange={(e) => setEdit((x) => ({ ...x, title:e.target.value }))} placeholder="Short name" style={inp}/>
              <textarea value={edit.body} onChange={(e) => setEdit((x) => ({ ...x, body:e.target.value }))} rows={8} style={{...inp, lineHeight:1.5, fontFamily:F.body}}/>
              <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
                <select value={edit.image || ""} onChange={(e) => setEdit((x) => ({ ...x, image:e.target.value }))} style={{...inp, width:"auto"}}><option value="">No image</option>{IMAGES.map((im) => <option key={im.src} value={im.src}>{im.name}</option>)}</select>
                <label style={{fontFamily:F.mono, fontSize:12}}><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit((x) => ({ ...x, active:e.target.checked }))}/> In rotation</label>
                <button onClick={savePost} style={{...btnG, marginLeft:"auto"}}>Save</button><button onClick={() => setEdit(null)} style={btn}>Cancel</button>
              </div>
            </div>)}
          {posts.map((p) => (
            <div key={p.id} style={{...card, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", opacity:p.active ? 1 : 0.5}}>
              <div style={{flex:1, minWidth:0}}><div style={{fontFamily:F.cond, fontWeight:700, fontSize:16}}>{p.title}{p.active ? "" : " (paused)"}</div><div style={{fontSize:13, color:C.mid, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{p.body}</div></div>
              <button onClick={() => setEdit(p)} style={btn}>Edit</button>
            </div>))}
        </div>
      )}
    </div>
  );
}
