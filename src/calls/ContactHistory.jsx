// Contact history: every logged attempt for one contact (calls, emails, texts, notes), newest first.
// Also exports emailsSent(): the shared count of emails already sent, read from the same history.
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

const C = { mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", ink:"#1c1a17", green:"#1e6e4a", card:"#faf7f2" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const CH = { call:"CALL", email:"EMAIL", text:"TEXT", sms:"TEXT", card:"NOTE", update:"UPDATE" };

// An email touch counts as a sent email unless it was a bounce, a reply or a stop request.
export const isEmailSent = (t) => t.channel === "email" && !/bounce|repl|stop|undo/i.test(t.outcome || "");

export default function ContactHistory({ userId, contactId, bump = 0, startOpen = false }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(startOpen);
  useEffect(() => {
    if (!contactId || !userId) return; let live = true; setRows(null);
    supabase.from("contact_touches").select("id, channel, outcome, note, touched_at").eq("user_id", userId).eq("contact_id", contactId)
      .order("touched_at", { ascending:false }).limit(100).then(({ data }) => { if (live) setRows(data || []); });
    return () => { live = false; };
  }, [userId, contactId, bump]);
  const real = (rows || []).filter((r) => r.channel !== "update");
  const emails = (rows || []).filter(isEmailSent).length;
  const fmt = (s) => new Date(s).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
  return (
    <div style={{marginTop:14, border:`1px solid ${C.rule}`, borderRadius:8, background:"#fff"}}>
      <button onClick={() => setOpen((o) => !o)} style={{all:"unset", boxSizing:"border-box", width:"100%", padding:"9px 12px", cursor:"pointer", display:"flex", justifyContent:"space-between", fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.mid}}>
        <span>Contact history{rows ? ` · ${real.length} attempt${real.length === 1 ? "" : "s"}${emails ? ` · ${emails} email${emails === 1 ? "" : "s"}` : ""}` : ""}</span><span>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{padding:"0 12px 10px"}}>
        {rows === null && <div style={{fontFamily:F.mono, fontSize:11, color:C.light}}>Loading…</div>}
        {rows && !real.length && <div style={{fontFamily:F.mono, fontSize:11, color:C.light}}>No attempts logged yet.</div>}
        {real.map((r) => { const first = (r.note || "").split("\n")[0];
          return (<details key={r.id} style={{borderTop:`1px solid ${C.rule}`, padding:"6px 0"}}>
            <summary style={{cursor:r.note ? "pointer" : "default", listStyle:"none", display:"flex", gap:10, alignItems:"baseline", fontFamily:F.mono, fontSize:12, color:C.ink}}>
              <span style={{color:C.light, minWidth:104}}>{fmt(r.touched_at)}</span>
              <span style={{color:C.green, fontWeight:700, minWidth:52}}>{CH[r.channel] || String(r.channel || "").toUpperCase()}</span>
              <span>{r.outcome}{first && r.channel === "email" ? ` · ${first}` : ""}</span>
            </summary>
            {r.note && <pre style={{whiteSpace:"pre-wrap", fontFamily:F.body, fontSize:13, color:C.mid, margin:"6px 0 0 0"}}>{r.note}</pre>}
          </details>); })}
      </div>}
    </div>
  );
}
