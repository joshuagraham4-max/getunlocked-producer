// Match a buyer lead to agents by market (city, then zip area, then state). Options only: Joshua picks.
// Logging a match writes a touch on both records, so each history shows who was matched to whom.
import { useState, useMemo } from "react";
import { supabase } from "../supabase.js";

const C = { mid:"#6b6358", rule:"#e0d8cc", ink:"#1c1a17", green:"#1e6e4a", card:"#faf7f2" };
const F = { mono:"'DM Mono',monospace", body:"'Barlow',sans-serif" };
const norm = (s) => String(s || "").trim().toLowerCase();
const marketOf = (c) => ({ city:norm(c.property_city || c.city), state:norm(c.property_state || c.state), zip:String(c.property_zip || c.zip || "").slice(0, 5) });
const name = (c) => [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";

export function scoreAgent(lead, agent) {
  const a = marketOf(lead), b = marketOf(agent); let s = 0, why = "";
  if (a.city && a.city === b.city && (!a.state || !b.state || a.state === b.state)) { s = 3; why = "same city"; }
  else if (a.zip.length >= 3 && a.zip.slice(0, 3) === b.zip.slice(0, 3)) { s = 2; why = "same zip area"; }
  else if (a.state && a.state === b.state) { s = 1; why = "same state"; }
  return { s, why };
}

export default function AgentMatch({ contact, contacts, userId, onLogged }) {
  const [done, setDone] = useState({});
  const m = marketOf(contact);
  const list = useMemo(() => (contacts || [])
    .filter((a) => (a.contact_type === "agent") && !a.do_not_contact && a.id !== contact.id)
    .map((a) => ({ a, ...scoreAgent(contact, a) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || name(x.a).localeCompare(name(y.a)))
    .slice(0, 5), [contacts, contact]);
  const label = [m.city, m.state].filter(Boolean).join(", ");
  const log = async (a) => {
    const note = `Matched ${name(contact)} to ${name(a)}${a.company ? " (" + a.company + ")" : ""}${label ? ", market: " + label : ""}`;
    await supabase.from("contact_touches").insert([
      { user_id:userId, contact_id:contact.id, channel:"card", outcome:"matched to agent", note },
      { user_id:userId, contact_id:a.id, channel:"card", outcome:"lead matched", note: `Matched lead ${name(contact)}${label ? " in " + label : ""} to this agent` },
    ]);
    setDone((d) => ({ ...d, [a.id]: true })); onLogged && onLogged();
  };
  return (
    <div style={{marginTop:14, border:`1px solid ${C.rule}`, borderRadius:8, background:"#fff", padding:"10px 12px"}}>
      <div style={{fontFamily:F.mono, fontSize:10, letterSpacing:".12em", color:C.mid, textTransform:"uppercase"}}>Match to an agent{label ? ` · ${label}` : ""}</div>
      {!label && !m.zip && <div style={{fontFamily:F.body, fontSize:13, color:C.mid, marginTop:6}}>Add this lead's city, state or zip to see agents in their market.</div>}
      {(label || m.zip) && !list.length && <div style={{fontFamily:F.body, fontSize:13, color:C.mid, marginTop:6}}>No agents in your contacts cover this market yet.</div>}
      {list.map(({ a, why }) => (
        <div key={a.id} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderTop:`1px solid ${C.rule}`, marginTop:8}}>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontFamily:F.body, fontSize:14, fontWeight:600, color:C.ink}}>{name(a)}{a.company ? ` · ${a.company}` : ""}</div>
            <div style={{fontFamily:F.mono, fontSize:10, color:C.mid}}>{why.toUpperCase()}{[a.city, a.state].filter(Boolean).length ? " · " + [a.city, a.state].filter(Boolean).join(", ") : ""}</div>
          </div>
          {a.phone && <a href={`tel:${String(a.phone).replace(/\D/g, "")}`} style={{fontFamily:F.mono, fontSize:10, padding:"6px 10px", borderRadius:5, border:`1px solid ${C.rule}`, color:C.mid, textDecoration:"none"}}>Call</a>}
          <button disabled={done[a.id]} onClick={() => log(a)} style={{fontFamily:F.mono, fontSize:10, padding:"6px 10px", borderRadius:5, border:`1px solid ${C.green}`, background:done[a.id] ? C.card : C.green, color:done[a.id] ? C.green : "#fff", cursor:"pointer"}}>{done[a.id] ? "Logged" : "Matched"}</button>
        </div>
      ))}
    </div>
  );
}
