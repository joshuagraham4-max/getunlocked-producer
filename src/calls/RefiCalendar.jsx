// Refi calendar (DSCR builds): investor leads with a reason to call now. Prepay likely ending, BRRRR refi window, Florida insurance squeeze.
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase.js";
import { refiSignals } from "../investors/psDetail.js";
import { today, fullName } from "../radar/engine.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0" };
const F = { cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif", mono:"'DM Mono',monospace" };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"6px 11px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const KINDS = [["all","All"],["prepay","Prepay ending"],["brrrr","BRRRR window"],["insurance","FL insurance"]];
const COLOR = { prepay:"#1f5f8b", brrrr:C.green, insurance:C.amber };

export default function RefiCalendar({ contacts, onOpen }) {
  const [leads, setLeads] = useState(null); const [open, setOpen] = useState(false); const [kind, setKind] = useState("all");
  useEffect(() => { let on = true;
    supabase.from("investor_leads").select("contact_id,ps_detail,property_address,property_city").not("contact_id", "is", null)
      .then(({ data }) => { if (on) setLeads(data || []); });
    return () => { on = false; }; }, []);
  const rows = useMemo(() => {
    if (!leads) return [];
    const byId = new Map((contacts || []).map((c) => [c.id, c])); const t = today(); const out = [];
    for (const l of leads) {
      const c = byId.get(l.contact_id); if (!c || c.do_not_contact) continue;
      for (const s of refiSignals(l.ps_detail?.detail)) out.push({ ...s, c, addr:[l.property_address, l.property_city].filter(Boolean).join(", ") });
    }
    // Open now first (date passed or no date), then soonest upcoming.
    return out.sort((a, b) => ((a.date && a.date > t) - (b.date && b.date > t)) || String(a.date || "").localeCompare(String(b.date || "")));
  }, [leads, contacts]);
  if (!leads || !rows.length) return null;
  const n = (k) => rows.filter((r) => k === "all" || r.key === k).length;
  const shown = rows.filter((r) => kind === "all" || r.key === kind);
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.rule}`, borderRadius:10, padding:12, marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <div style={{ fontFamily:F.cond, fontWeight:800, fontSize:18, color:C.ink }}>Refi calendar <span style={{ color:C.light, fontWeight:600 }}>({rows.length})</span></div>
        <button style={open ? btnG : btn} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"}</button>
      </div>
      <div style={{ fontFamily:F.body, fontSize:13, color:C.mid, marginTop:2 }}>Investors with a reason to call now. Prepay dates are estimates from the loan date.</div>
      {open && <>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", margin:"10px 0" }}>
          {KINDS.map(([k, l]) => n(k) > 0 && <button key={k} style={kind === k ? btnG : btn} onClick={() => setKind(k)}>{l} ({n(k)})</button>)}
        </div>
        {shown.map((r, i) => (
          <div key={i} style={{ borderTop:`1px solid ${C.rule}`, padding:"9px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
              <div style={{ fontFamily:F.cond, fontWeight:800, fontSize:16, color:C.ink }}>{fullName(r.c) || r.c.company}<span style={{ fontWeight:500, color:C.mid }}>{r.addr ? ` · ${r.addr}` : ""}</span></div>
              <div style={{ fontFamily:F.mono, fontSize:11, color:COLOR[r.key] }}>{r.title.toUpperCase()}</div>
            </div>
            <div style={{ fontFamily:F.body, fontSize:14, color:C.ink, margin:"3px 0 6px" }}>{r.line}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {r.c.phone && <a href={`tel:${String(r.c.phone).replace(/\D/g, "")}`} style={btnG}>Call {r.c.phone}</a>}
              {onOpen && <button style={btn} onClick={() => onOpen(r.c)}>Open</button>}
              <button style={btn} onClick={() => navigator.clipboard?.writeText(r.line)}>Copy talking point</button>
            </div>
          </div>))}
      </>}
    </div>
  );
}
