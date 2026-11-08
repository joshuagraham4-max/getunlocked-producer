// Investor playbook card (Calls card and Contacts detail): questions, pain to fix, pushback, close.
import { useState } from "react";
const C = { ink:"#1c1a17", light:"#a89e92", rule:"#e0d8cc", amber:"#b05e0d" };
const F = { cond:"'Barlow Condensed',sans-serif" };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light };

// Investor playbook on the call card: questions, pain to fix, pushback, close.
export default function Playbook({ pb }) {
  const [open, setOpen] = useState("pains");
  const Sec = ({ k, t, children }) => (
    <div style={{borderTop:`1px solid ${C.rule}`}}>
      <button onClick={() => setOpen(open === k ? null : k)} style={{all:"unset", cursor:"pointer", display:"flex", justifyContent:"space-between", width:"100%", padding:"9px 0", fontFamily:F.cond, fontWeight:800, fontSize:16, color:C.ink}}>
        <span>{t}</span><span style={{color:C.light}}>{open === k ? "-" : "+"}</span></button>
      {open === k && <div style={{paddingBottom:10}}>{children}</div>}
    </div>);
  return (
    <div style={{background:"#fff", border:`1px solid ${C.rule}`, borderRadius:9, padding:"10px 14px", margin:"0 0 14px"}}>
      <div style={lbl}>Playbook: {pb.label}</div>
      <div style={{fontSize:14, color:C.ink, margin:"4px 0 8px"}}>{pb.goal}</div>
      <Sec k="ask" t="Ask">{pb.ask.map((q) => <div key={q} style={{fontSize:14, lineHeight:1.45, padding:"3px 0"}}>{q}</div>)}</Sec>
      <Sec k="pains" t="Pain → fix">{pb.pains.map(([p, f]) => <div key={p} style={{padding:"5px 0"}}><div style={{fontFamily:F.cond, fontWeight:700, fontSize:15, color:C.amber}}>{p}</div><div style={{fontSize:14, lineHeight:1.45}}>{f}</div></div>)}</Sec>
      <Sec k="obj" t="Pushback">{pb.objections.map(([o, a]) => <div key={o} style={{padding:"5px 0"}}><div style={{fontFamily:F.cond, fontWeight:700, fontSize:15}}>"{o}"</div><div style={{fontSize:14, lineHeight:1.45}}>{a}</div></div>)}</Sec>
      <Sec k="close" t="Close"><div style={{fontSize:14, lineHeight:1.45}}>{pb.close}</div></Sec>
    </div>);
}

