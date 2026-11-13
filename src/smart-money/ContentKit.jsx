// Videos + scripts checklist. Checkmarks save to smart_money_posts (fixed day 2000-01-01, slot "kit:<item>:<step>"), so they sync across devices.
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { KIT } from "./contentKit.js";

const C = { navy:"#0E1B2A", ink:"#0E1B2A", muted:"#51647A", line:"#DCE3EB", card:"#FFFFFF", bg:"#F3F6F9", blue:"#1F6FA8", good:"#2E8B3E", goodBg:"#E7F4EA" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };
const DAY = "2000-01-01";
const btn = { font:"inherit", fontFamily:F.display, fontWeight:700, fontSize:13, padding:"7px 12px", borderRadius:8, border:`1.5px solid ${C.line}`, background:"#fff", color:C.ink, cursor:"pointer" };
const store = { get:(k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set:(k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

function Copy({ text, label }) {
  const [ok, setOk] = useState(false);
  return <button style={btn} onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); }}>{ok ? "Copied" : label}</button>;
}

export default function ContentKit({ userId }) {
  const [done, setDone] = useState(() => store.get("sm_kit") || {});
  const [open, setOpen] = useState({}); const [err, setErr] = useState("");
  useEffect(() => { if (!userId) return;
    supabase.from("smart_money_posts").select("slot,done").eq("user_id", userId).eq("day", DAY).like("slot", "kit:%")
      .then(({ data, error }) => { if (error) return; const m = Object.fromEntries((data || []).map((r) => [r.slot, r.done])); setDone((d) => ({ ...d, ...m })); store.set("sm_kit", { ...store.get("sm_kit"), ...m }); });
  }, [userId]);
  const toggle = async (key) => {
    const v = !done[key]; const next = { ...done, [key]:v }; setDone(next); store.set("sm_kit", next);
    if (!userId) return;
    const { error } = await supabase.from("smart_money_posts").upsert({ user_id:userId, day:DAY, slot:key, done:v, updated_at:new Date().toISOString() });
    setErr(error ? "Saved on this device only; the database didn't accept it." : "");
  };
  const keys = (it) => it.steps.map((s, i) => `kit:${it.id}:${i}`);
  const all = KIT.flatMap((s) => s.items.flatMap(keys)); const nDone = all.filter((k) => done[k]).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div><div style={{ fontFamily:F.display, fontWeight:800, fontSize:20 }}>Videos + scripts</div>
          <div style={{ fontSize:14, color:C.muted }}>Record it, send it, post it, check it off. Open any item for the script and copy buttons.</div></div>
        <div style={{ fontFamily:F.display, fontWeight:800, fontSize:18, color: nDone === all.length ? C.good : C.ink }}>{nDone} / {all.length} done</div>
        {err && <div style={{ width:"100%", fontSize:13, color:"#B05E0D" }}>{err}</div>}
      </div>
      {KIT.map((sec) => {
        const sk = sec.items.flatMap(keys), sd = sk.filter((k) => done[k]).length;
        return (
          <section key={sec.id} style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
              <div style={{ fontFamily:F.display, fontWeight:800, fontSize:17 }}>{sec.title}</div>
              <div style={{ fontSize:13, fontWeight:700, color: sd === sk.length ? C.good : C.muted }}>{sd}/{sk.length}</div>
            </div>
            {sec.note && <div style={{ fontSize:13, color:C.muted, margin:"2px 0 8px" }}>{sec.note}</div>}
            {sec.items.map((it) => {
              const ks = keys(it), finished = ks.every((k) => done[k]);
              return (
                <div key={it.id} style={{ borderTop:`1px solid ${C.line}`, padding:"10px 0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", background: finished ? C.goodBg : C.bg, color: finished ? C.good : C.muted, borderRadius:6, padding:"3px 7px" }}>{it.kind}</span>
                    <button onClick={() => setOpen({ ...open, [it.id]:!open[it.id] })} style={{ font:"inherit", fontWeight:700, fontSize:15, color:C.ink, background:"none", border:0, padding:0, cursor:"pointer", textAlign:"left", textDecoration: finished ? "line-through" : "none" }}>{it.title}</button>
                    <span style={{ marginLeft:"auto", display:"flex", gap:12, flexWrap:"wrap" }}>
                      {it.steps.map((s, i) => (
                        <label key={s} style={{ display:"flex", alignItems:"center", gap:6, fontSize:14, cursor:"pointer" }}>
                          <input type="checkbox" checked={!!done[ks[i]]} onChange={() => toggle(ks[i])} style={{ width:18, height:18 }}/>{s}</label>))}
                    </span>
                  </div>
                  {open[it.id] && <div style={{ marginTop:10 }}>
                    <pre style={{ whiteSpace:"pre-wrap", fontFamily:F.body, fontSize:14, lineHeight:1.55, margin:0, background:C.bg, border:`1px solid ${C.line}`, borderRadius:10, padding:12 }}>{it.text}</pre>
                    {it.caption && <div style={{ fontSize:13, color:C.muted, margin:"8px 0 0" }}><b>{/^Hi \[Name\]/.test(it.caption) ? "Send with it:" : "Caption:"}</b> {it.caption}</div>}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
                      <Copy text={it.text} label={it.kind === "Video" ? "Copy script" : "Copy"}/>
                      {it.caption && <Copy text={it.caption} label={/^Hi \[Name\]/.test(it.caption) ? "Copy message" : "Copy caption"}/>}
                    </div>
                  </div>}
                </div>);
            })}
          </section>);
      })}
    </div>
  );
}
