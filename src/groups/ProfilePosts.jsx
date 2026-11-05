// This week's personal-profile posts: today's on top, copy text and story, save the photo, mark posted.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", greenBg:"#e8f4ee", amber:"#b05e0d" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const localDay = () => { const x = new Date(); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const label = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" });

export default function ProfilePosts({ userId }) {
  const [posts, setPosts] = useState([]); const [edit, setEdit] = useState(null);
  const t = localDay();
  const load = useCallback(async () => {
    const start = new Date(); start.setDate(start.getDate() - 7);
    const { data } = await supabase.from("profile_posts").select("*").gte("day", start.toISOString().slice(0, 10)).order("day");
    setPosts(data || []);
  }, []);
  useEffect(() => { if (userId) load(); }, [userId, load]);
  const mark = async (p, posted) => { await supabase.from("profile_posts").update({ status: posted ? "posted" : "approved", posted_at: posted ? new Date().toISOString() : null }).eq("id", p.id); load(); };
  const save = async () => { await supabase.from("profile_posts").update({ hook:edit.hook, body:edit.body, story_text:edit.story_text }).eq("id", edit.id); setEdit(null); load(); };
  const todayP = posts.find((p) => p.day === t);
  const rest = posts.filter((p) => p !== todayP && p.day >= t);
  const Card = ({ p, big }) => (
    <div style={{...card, padding:14, borderColor: big ? C.green : C.rule, opacity: p.status === "posted" ? 0.6 : 1}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8}}>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize: big ? 22 : 17}}>{big ? "Today · " : ""}{label(p.day)}</div>
        <span style={{fontFamily:F.mono, fontSize:10, color:C.mid}}>{(p.category || "").replace("_", " ").toUpperCase()} · {p.scope}{p.status === "posted" ? " · POSTED" : ""}</span>
      </div>
      <div style={{display:"flex", gap:12, marginTop:8}}>
        {p.image && <a href={p.image} download><img src={p.image} alt="" style={{width: big ? 130 : 80, height: big ? 130 : 80, objectFit:"cover", borderRadius:8}}/></a>}
        <div style={{fontSize:14, lineHeight:1.5, whiteSpace:"pre-wrap", minWidth:0}}><b>{p.hook}</b>{big ? "\n\n" + p.body : ""}</div>
      </div>
      {big && <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, marginTop:8}}>Story: {p.story_visual}. Text: "{p.story_text}"</div>}
      <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:10}}>
        <button onClick={() => navigator.clipboard?.writeText(`${p.hook}\n\n${p.body}`)} style={btnG}>Copy post</button>
        {p.image && <a href={p.image} download style={btn}>Save photo</a>}
        <button onClick={() => navigator.clipboard?.writeText(p.story_text || "")} style={btn}>Copy story text</button>
        <button onClick={() => setEdit(p)} style={btn}>Edit</button>
        <button onClick={() => mark(p, p.status !== "posted")} style={p.status === "posted" ? btnG : btn}>{p.status === "posted" ? "Posted (undo)" : "Posted"}</button>
      </div>
      {edit && edit.id === p.id && (
        <div style={{display:"grid", gap:6, marginTop:10}}>
          <input value={edit.hook} onChange={(e) => setEdit({ ...edit, hook:e.target.value })} style={{padding:8, border:`1px solid ${C.rule}`, borderRadius:6, fontFamily:F.body, fontSize:14}}/>
          <textarea rows={7} value={edit.body} onChange={(e) => setEdit({ ...edit, body:e.target.value })} style={{padding:8, border:`1px solid ${C.rule}`, borderRadius:6, fontFamily:F.body, fontSize:14}}/>
          <input value={edit.story_text || ""} onChange={(e) => setEdit({ ...edit, story_text:e.target.value })} style={{padding:8, border:`1px solid ${C.rule}`, borderRadius:6, fontFamily:F.body, fontSize:14}}/>
          <div style={{display:"flex", gap:6}}><button onClick={save} style={btnG}>Save</button><button onClick={() => setEdit(null)} style={btn}>Cancel</button></div>
        </div>)}
    </div>
  );
  return (
    <div style={{display:"grid", gap:12}}>
      <div style={{...card, padding:"10px 14px", fontFamily:F.mono, fontSize:12, color:C.mid}}>Your personal profile post for each day, posted 9:45 AM ET. Post it with the photo, then do the Story. Anyone who comments gets a DM, not a pitch: "Saw your comment. What's going on with your situation?"</div>
      {todayP ? <Card p={todayP} big/> : <div style={{fontFamily:F.mono, fontSize:12, color:C.amber}}>No profile post scheduled for today.{rest.length ? ` Next one: ${label(rest[0].day)}.` : ""}</div>}
      {rest.map((p) => <Card key={p.id} p={p}/>)}
    </div>
  );
}
