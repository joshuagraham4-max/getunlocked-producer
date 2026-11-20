// Contact history: every logged attempt for one contact (calls, emails, texts, notes), newest first.
// Also exports emailsSent(): the shared count of emails already sent, read from the same history.
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";

const C = { mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", ink:"#1c1a17", green:"#1e6e4a", card:"#faf7f2" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const CH = { call:"CALL", email:"EMAIL", text:"TEXT", sms:"TEXT", card:"CARD", note:"NOTE", meeting:"MEETING", update:"UPDATE" };

// An email touch counts as a sent email unless it was a bounce, a reply or a stop request.
// "back-and-forth" = a side conversation logged by hand: it scores on Today but does not advance the email sequence.
export const isEmailSent = (t) => t.channel === "email" && !/bounce|repl|stop|undo|back-and-forth/i.test(t.outcome || "");

export default function ContactHistory({ userId, contactId, bump = 0, startOpen = false, preview = 0 }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(startOpen);
  const [all, setAll] = useState(false);
  useEffect(() => {
    if (!contactId || !userId) return; let live = true; setRows(null);
    supabase.from("contact_touches").select("id, channel, outcome, note, touched_at").eq("user_id", userId).eq("contact_id", contactId)
      .order("touched_at", { ascending:false }).limit(100).then(({ data }) => { if (live) setRows(data || []); });
    return () => { live = false; };
  }, [userId, contactId, bump]);
  const real = (rows || []).filter((r) => r.channel !== "update");
  const emails = (rows || []).filter(isEmailSent).length;
  const fmt = (s) => new Date(s).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
  if (preview) {
    const shown = all ? real : real.slice(0, preview);
    return (
      <div style={{marginTop:6, fontFamily:F.mono, fontSize:12}}>
        {rows === null && <div style={{color:C.light, fontSize:11}}>Loading history…</div>}
        {rows && !real.length && <div style={{color:C.light, fontSize:11}}>No history yet.</div>}
        {shown.map((r) => (
          <div key={r.id} style={{display:"flex", gap:10, alignItems:"baseline", padding:"4px 0", borderTop:`1px solid ${C.rule}`}}>
            <span style={{color:C.light, minWidth:104}}>{fmt(r.touched_at)}</span>
            <span style={{color:C.green, fontWeight:700, minWidth:52}}>{CH[r.channel] || String(r.channel || "").toUpperCase()}</span>
            <span style={{whiteSpace:"pre-wrap", fontFamily:r.note ? F.body : F.mono, fontSize:r.note ? 13 : 12}}>{r.note ? `${r.outcome} · ${r.note}` : r.outcome}</span>
          </div>))}
        {real.length > preview && <button onClick={() => setAll((a) => !a)} style={{all:"unset", cursor:"pointer", color:C.green, fontWeight:700, fontSize:11, marginTop:4}}>
          {all ? "Show less" : `Show all (${real.length})${emails ? ` · ${emails} email${emails === 1 ? "" : "s"} sent` : ""}`}</button>}
      </div>
    );
  }
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
              <span>{r.outcome}{first ? ` · ${first.slice(0, 90)}${first.length > 90 ? "…" : ""}` : ""}</span>
            </summary>
            {r.note && <pre style={{whiteSpace:"pre-wrap", fontFamily:F.body, fontSize:13, color:C.mid, margin:"6px 0 0 0"}}>{r.note}</pre>}
          </details>); })}
      </div>}
    </div>
  );
}

// Log a note: a running dialogue per contact. Call and Email score on Today (call = dial + conversation, email = $70 email).
const KINDS = [
  ["call", "talked", "Call"], ["email", "back-and-forth", "Email"], ["text", "texted", "Text"],
  ["meeting", "met", "Meeting"], ["note", "note", "Note"],
];
export function LogNote({ userId, contactId, onSaved, defaultKind = "note" }) {
  const [text, setText] = useState(""); const [kind, setKind] = useState(defaultKind); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [focus, setFocus] = useState(false); const ref = useRef(null);
  const save = async () => {
    const note = text.trim(); if (!note || busy) return; setBusy(true); setErr("");
    const [channel, outcome] = KINDS.find((k) => k[0] === kind);
    const { error } = await supabase.from("contact_touches").insert({ user_id:userId, contact_id:contactId, channel, outcome, note });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setText(""); setKind(defaultKind); ref.current?.focus(); onSaved && onSaved(kind);
  };
  const b = (on) => ({ fontFamily:F.cond, fontWeight:700, fontSize:13, padding:"4px 10px", borderRadius:14, border:`1px solid ${on ? C.green : C.rule}`, background:on ? C.green : "#fff", color:on ? "#fff" : C.mid, cursor:"pointer" });
  const openUp = focus || !!text;
  return (
    <div style={{marginTop:14, borderTop:`1px solid ${C.rule}`, paddingTop:10}}>
      <div style={{display:"flex", gap:8, alignItems:"flex-start"}}>
        <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } }}
          placeholder="Log a note… (Enter saves, Shift+Enter for a new line)" rows={openUp ? 2 : 1}
          style={{flex:1, boxSizing:"border-box", padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, fontFamily:F.body, fontSize:14, resize:"vertical", background:"#fff"}}/>
        {openUp && <button onMouseDown={(e) => e.preventDefault()} onClick={save} disabled={!text.trim() || busy} style={{...b(true), padding:"8px 12px", opacity: !text.trim() || busy ? 0.5 : 1}}>{busy ? "Saving…" : "Save"}</button>}
      </div>
      {openUp && <div style={{display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginTop:6}}>
        {KINDS.map(([k, , l]) => <button key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => setKind(k)} style={b(kind === k)}>{l}</button>)}
        <span style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{kind === "call" ? "Counts as a dial + conversation on Today." : kind === "email" ? "Counts as an email ($70) on Today." : kind === "note" ? "Saved to the timeline." : "Saved to the timeline. Marks contacted today."}</span>
      </div>}
      {err && <div style={{fontFamily:F.mono, fontSize:11, color:"#9e3020", marginTop:4}}>{err}</div>}
    </div>
  );
}
