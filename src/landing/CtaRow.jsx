// Call me · Book me · Apply here: the three ways in, on every public page.
import { BRAND } from "../smart-money/data.js";
const btn = { fontFamily:"'Montserrat', Arial, sans-serif", fontWeight:700, fontSize:16, borderRadius:10, padding:"14px 20px", minHeight:48, textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box" };
export default function CtaRow() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap:10 }}>
      <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} style={{ ...btn, background:"#fff", color:"#1F6FA8", border:"2px solid #1F6FA8" }}>Call me</a>
      <a href={BRAND.booking} target="_blank" rel="noreferrer" style={{ ...btn, background:"#fff", color:"#1F6FA8", border:"2px solid #1F6FA8" }}>Book me</a>
      <a href={BRAND.apply} target="_blank" rel="noreferrer" style={{ ...btn, background:"#1F6FA8", color:"#fff", border:"2px solid #1F6FA8" }}>Apply here</a>
    </div>
  );
}
