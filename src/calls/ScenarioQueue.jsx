// Scenario Desk queue: agent scenarios from /scenario-desk. Answer by text, email or call, then Mark answered
// (logs the reply on the agent's timeline; email replies score as an email on Today, call replies as a dial + conversation).
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase.js";
import { BOOKING } from "../radar/engine.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0" };
const F = { cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif", mono:"'DM Mono',monospace" };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 12px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const digits = (p) => String(p || "").replace(/\D/g, "").slice(-10);
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://getunlocked-producer.vercel.app";
export const DESK_URL = `${ORIGIN}/scenario-desk`;

// Starting points only: Joshua edits before sending. General guidance, never a promise.
const STARTERS = {
  "Self-employed / 1099": "Good news: there are programs built for self-employed buyers, including bank statement and 1099 loans that don't lean on tax returns. Time in business and the deposits matter most. Can I grab 5 minutes with them?",
  "Credit issues": "Past credit issues don't automatically mean no. What matters is what happened and how long ago. There are options at different credit levels. Happy to take a quick look with them.",
  "Divorce": "Very doable. The decree and how support is paid (or received) drive a lot of it. If they can share the basics, I'll map out what they can qualify for on their own.",
  "Sell and buy (timing)": "There are a few ways to handle the timing, including buying before selling. Depends on equity and income. Let me run both paths so they can choose.",
  "Low down payment": "There are low-down and down payment assistance options, and the seller can often help with costs. Let me see what fits them.",
  "Investor / rental": "For investors I can qualify on the property's rent (DSCR) instead of their tax returns. Send me the property details and I'll run it.",
  "Recently changed jobs": "A job change is usually fine, especially in the same line of work. An offer letter and first pay stub go a long way. Happy to look.",
  "Non-US citizen": "There are options depending on their status and documents. Let me ask a couple of quick questions and I'll point them the right way.",
  "Big debts / DTI": "Debt-to-income can often be solved: different loan types allow higher ratios, and paying off or restructuring a debt can open it up. Let me run the numbers.",
  "Other": "Thanks for sending this. I've seen versions of this before. Let me ask a couple of quick questions and I'll get you a clear answer.",
};
const starter = (a, first) => `Hi ${first || ""}, Joshua here on the scenario you sent. ${STARTERS[(a?.tags || [])[0]] || STARTERS.Other}\n\n5 minutes with them: ${BOOKING}`;

export default function ScenarioQueue({ userId, contacts, onOpen }) {
  const [rows, setRows] = useState(null); const [draft, setDraft] = useState({}); const [msg, setMsg] = useState(""); const [showDone, setShowDone] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("calculator_leads").select("id,first_name,last_name,phone,email,property_state,answers,created_at,handled_at,reply_note")
      .eq("source", "scenario-desk").order("created_at", { ascending:false }).limit(100);
    if (error) { setMsg(/handled_at/.test(error.message) ? "Run supabase/scenario_desk_v1.sql once so answered scenarios can be tracked." : error.message); setRows([]); return; }
    setMsg(""); setRows(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const contactFor = (r) => (contacts || []).find((c) => (r.phone && (digits(c.phone) === digits(r.phone) || digits(c.phone_2) === digits(r.phone))) || (r.email && c.email && c.email.toLowerCase() === r.email.toLowerCase()));
  const answer = async (r) => {
    const text = (draft[r.id] ?? starter(r.answers, r.first_name)).trim(); const reach = r.answers?.reach || "Text";
    const { error } = await supabase.from("calculator_leads").update({ handled_at:new Date().toISOString(), reply_note:text }).eq("id", r.id);
    if (error) { setMsg(error.message); return; }
    const c = contactFor(r);
    if (c) {
      const [channel, outcome] = reach === "Email" ? ["email", "back-and-forth"] : reach === "Call" ? ["call", "talked"] : ["text", "scenario reply"];
      await supabase.from("contact_touches").insert({ user_id:userId, contact_id:c.id, channel, outcome, note:`Scenario reply: ${text}` });
    }
    load();
  };
  if (rows === null) return <div style={{ fontFamily:F.mono, fontSize:12, color:C.light }}>Loading scenarios…</div>;
  const open = rows.filter((r) => !r.handled_at), done = rows.filter((r) => r.handled_at);
  const Card = (r) => {
    const a = r.answers || {}, c = contactFor(r), text = draft[r.id] ?? starter(a, r.first_name), when = new Date(r.created_at).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
    return (
      <div key={r.id} style={{ background:C.card, border:`1px solid ${r.handled_at ? C.rule : C.amber}`, borderRadius:10, padding:14, marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
          <div style={{ fontFamily:F.cond, fontWeight:800, fontSize:18, color:C.ink }}>{[r.first_name, r.last_name].filter(Boolean).join(" ")}{a.brokerage ? <span style={{ fontWeight:500, color:C.mid }}> · {a.brokerage}</span> : null}</div>
          <div style={{ fontFamily:F.mono, fontSize:11, color:r.handled_at ? C.green : C.amber }}>{r.handled_at ? "ANSWERED" : "NEW"} · {when} · REPLY BY {(a.reach || "text").toUpperCase()}</div>
        </div>
        <div style={{ fontFamily:F.mono, fontSize:11, color:C.mid, margin:"4px 0 6px" }}>{[a.stage, r.property_state, ...(a.tags || [])].filter(Boolean).join(" · ")}</div>
        <div style={{ fontFamily:F.body, fontSize:15, color:C.ink, whiteSpace:"pre-wrap", background:"#fff", border:`1px solid ${C.rule}`, borderRadius:6, padding:10 }}>{a.scenario}</div>
        {r.handled_at ? <div style={{ fontFamily:F.body, fontSize:13, color:C.mid, marginTop:8, whiteSpace:"pre-wrap" }}><b>Your reply:</b> {r.reply_note}</div> : <>
          <textarea value={text} onChange={(e) => setDraft((d) => ({ ...d, [r.id]:e.target.value }))} rows={5} style={{ width:"100%", boxSizing:"border-box", marginTop:8, padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, fontFamily:F.body, fontSize:14 }}/>
          <div style={{ fontFamily:F.mono, fontSize:10, color:C.light, margin:"2px 0 8px" }}>Starting point from the first tag. Edit before you send; general guidance, not an approval.</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {r.phone && <a href={`sms:${digits(r.phone)}?body=${encodeURIComponent(text)}`} style={a.reach === "Text" || !a.reach ? btnG : btn}>Text reply</a>}
            {r.email && <a href={`mailto:${r.email}?subject=${encodeURIComponent("Your scenario")}&body=${encodeURIComponent(text)}`} style={a.reach === "Email" ? btnG : btn}>Email reply</a>}
            {r.phone && <a href={`tel:${digits(r.phone)}`} style={a.reach === "Call" ? btnG : btn}>Call {r.phone}</a>}
            <button style={btn} onClick={() => navigator.clipboard?.writeText(text)}>Copy</button>
            {c && onOpen && <button style={btn} onClick={() => onOpen(c)}>Open contact</button>}
            <button style={btnG} onClick={() => answer(r)}>Mark answered</button>
          </div></>}
      </div>);
  };
  return (
    <div>
      <div style={{ background:"#fff", border:`1px solid ${C.rule}`, borderRadius:10, padding:14, marginBottom:14 }}>
        <div style={{ fontFamily:F.cond, fontWeight:800, fontSize:20, color:C.ink }}>Scenario desk <span style={{ color:open.length ? C.amber : C.light }}>({open.length} new)</span></div>
        <div style={{ fontFamily:F.body, fontSize:14, color:C.mid, marginTop:2 }}>Agents send tricky scenarios from your link, no login. Each one lands here, in the agent's timeline in Contacts, and as a phone alert.</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
          <button style={btnG} onClick={() => navigator.clipboard?.writeText(DESK_URL)}>Copy desk link</button>
          <a href="/scenario-desk" target="_blank" rel="noreferrer" style={btn}>Open the page</a>
          <button style={btn} onClick={() => navigator.clipboard?.writeText(`If a buyer or seller ever has a weird scenario (self-employed, credit stuff, sell-and-buy timing), send it here and I'll get you a straight answer, usually same day. No lead needed: ${DESK_URL}`)}>Copy agent message</button>
        </div>
        {msg && <div style={{ fontFamily:F.body, fontSize:14, color:C.amber, background:C.amberBg, borderRadius:6, padding:8, marginTop:8 }}>{msg}</div>}
      </div>
      {!open.length && <div style={{ fontFamily:F.body, color:C.light, marginBottom:10 }}>No new scenarios. Share the link with your agents.</div>}
      {open.map(Card)}
      {done.length > 0 && <button style={btn} onClick={() => setShowDone(!showDone)}>{showDone ? "Hide answered" : `Answered (${done.length})`}</button>}
      {showDone && <div style={{ marginTop:10 }}>{done.map(Card)}</div>}
    </div>
  );
}
