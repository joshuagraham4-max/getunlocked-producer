import { LogoLink, TopButtons } from "./SiteBits.jsx";
// Shared top bar for public pages: Graham Financial logo + Joshua's headshot and name.
export default function BrandBar({ max = 1120, noApply = false }) {
  return (
    <div style={{ background:"#fff", borderBottom:"4px solid #7E4B6F" }}>
      <style>{`@media(max-width:640px){.bb-name,.bb-photo{display:none !important}.bb-r{display:contents !important}}`}</style>
      <div style={{ maxWidth:max, margin:"0 auto", padding:"10px 16px", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"8px 12px" }}>
        <LogoLink src="/brand/gf-logo.png" height={58}/>
        <div className="bb-r" style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="bb-name" style={{ textAlign:"right", fontFamily:"'Public Sans', system-ui, sans-serif", lineHeight:1.25 }}>
            <div style={{ fontFamily:"'Montserrat', Arial, sans-serif", fontWeight:700, fontSize:14, color:"#0E1B2A" }}>Joshua Graham</div>
            <div style={{ fontSize:12, color:"#51647A" }}>AVP · NMLS #169809</div>
          </div>
          <img className="bb-photo" src="/brand/joshua-headshot.jpg" alt="Joshua Graham" style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", border:"2px solid #DCE3EB" }}/>
          <TopButtons hideAgent={noApply} noApply={noApply}/>
        </div>
      </div>
    </div>
  );
}
// The promise under the consent checkbox.
export function NoSpam() {
  return <p style={{ margin:"6px 0 0", fontSize:14, fontWeight:700, color:"#0E1B2A", lineHeight:1.45 }}>You will NOT be spammed. You'll only be contacted by me, Joshua Graham, a real live person.</p>;
}
