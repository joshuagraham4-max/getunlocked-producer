// Collapsible "How to use" guide shown at the top of a screen. Open/closed state is remembered per browser.
import { useState } from "react";

export default function HowTo({ id, title = "How to use this", steps, defaultOpen = true }) {
  const key = `howto:${id}`;
  const [open, setOpen] = useState(() => { try { const v = localStorage.getItem(key); return v ? v === "open" : defaultOpen; } catch { return defaultOpen; } });
  const toggle = () => { const n = !open; setOpen(n); try { localStorage.setItem(key, n ? "open" : "closed"); } catch {} };
  return (
    <div style={{background:"#e6eef9", border:"1px solid #b8d0ec", borderRadius:10, padding:"10px 14px", marginBottom:12}}>
      <button onClick={toggle} style={{all:"unset", cursor:"pointer", display:"flex", justifyContent:"space-between", width:"100%", fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:"#1a4f8a"}}>
        <span>ⓘ {title}</span><span>{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ol style={{margin:"8px 0 2px", paddingLeft:20, fontFamily:"'Barlow',sans-serif", fontSize:13, color:"#1c1a17", lineHeight:1.55}}>
          {steps.map((s, i) => <li key={i} style={{marginBottom:4}}>{s}</li>)}
        </ol>
      )}
    </div>
  );
}
