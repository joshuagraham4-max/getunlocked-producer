// Equity ask: when a past client answers ("we're doing good, thanks"), go one level deeper.
// Shows on past clients in Today's Calls and on the contact page. Big and amber right after a reply or a talk;
// a quiet one-liner when the question was asked recently. Answers are saved as a tag
// ("equity asked YYYY-MM-DD: interested|not now|no") plus a note in the contact's history.
import { supabase } from "../supabase.js";
import { today, addDays, digits } from "../radar/engine.js";
import { personFirst } from "../radar/investorPlaybook.js";

const C = { ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0" };
const F = { cond:"'Barlow Condensed',sans-serif", mono:"'DM Mono',monospace" };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, letterSpacing:"0.04em", padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:"#fff", color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };

const RE = /^equity asked (\d{4}-\d{2}-\d{2}): (.+)$/;
export function lastEquityAsk(c) {
  let best = null;
  for (const t of c?.tags || []) { const m = RE.exec(t); if (m && (!best || m[1] > best.date)) best = { date:m[1], result:m[2], tag:t }; }
  return best;
}
// Ask again after 90 days for "not now", 180 days for "no", never while "interested" is being worked (30 days).
const QUIET = { "interested":30, "not now":90, "no":180 };
export const isPastClient = (c) => (c?.contact_type || "past_client") === "past_client";

export default function EquityAsk({ userId, c, setContacts, onLogged, compact }) {
  if (!c || !isPastClient(c) || c.do_not_contact) return null;
  const last = lastEquityAsk(c);
  const fmt = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" });
  if (last && last.date > addDays(-(QUIET[last.result] || 90))) {
    return <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, margin:"8px 0"}}>Equity asked {fmt(last.date)}: <b>{last.result}</b></div>;
  }
  const first = personFirst(c) || c.first_name || "";
  const justReplied = c.outcome === "replied to email" || (c.last_contacted === today() && c.outcome === "talked");
  const line = `Hey${first ? " " + first : ""}, glad to hear things are good. Quick one while I have you: do you want me to run any numbers on your equity? Or are you considering using any of it to put it to work for you?`;

  const answer = async (result) => {
    const tags = [...(c.tags || []).filter((t) => !RE.test(t)), `equity asked ${today()}: ${result}`];
    const fields = { tags };
    if (result === "interested") fields.follow_up_date = addDays(2);
    const { data, error } = await supabase.from("contacts").update(fields).eq("id", c.id).select().single();
    if (error) { alert("Save failed: " + error.message); return; }
    await supabase.from("contact_touches").insert({ user_id:userId, contact_id:c.id, channel:"note", outcome:"note", note:`Equity question asked: ${result}` });
    setContacts((p) => p.map((x) => (x.id === data.id ? data : x)));
    onLogged && onLogged();
  };

  return (
    <div style={{margin:"12px 0", padding:compact ? "10px 12px" : "14px 16px", borderRadius:8, background:justReplied ? C.amberBg : "#fff", border:`1px solid ${justReplied ? C.amber : C.rule}`, borderLeft:`4px solid ${C.amber}`}}>
      <div style={{fontFamily:F.cond, fontWeight:800, fontSize:justReplied ? 20 : 17, color:C.amber}}>{justReplied ? "They answered. Go one deeper: equity" : "Ask about equity"}</div>
      <div style={{fontSize:14, lineHeight:1.5, color:C.ink, margin:"6px 0 10px"}}>{line}</div>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
        {c.phone && <a href={`sms:${digits(c.phone)}?body=${encodeURIComponent(line)}`} style={btn}>Text it</a>}
        {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent("Quick one")}&body=${encodeURIComponent(line + "\n\nJoshua")}`} style={btn}>Email it</a>}
        <span style={{fontFamily:F.mono, fontSize:11, color:C.light, marginLeft:4}}>Their answer:</span>
        <button onClick={() => answer("interested")} style={btnG}>Interested</button>
        <button onClick={() => answer("not now")} style={btn}>Not now</button>
        <button onClick={() => answer("no")} style={btn}>No</button>
      </div>
      <div style={{fontFamily:F.mono, fontSize:10, color:C.light, marginTop:8}}>Interested: follow-up in 2 days to run the numbers. Not now: asks again in 90 days. No: 180 days.</div>
    </div>
  );
}
