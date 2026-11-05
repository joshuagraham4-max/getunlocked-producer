// Shared top bar for public pages: Graham Financial logo + Joshua's headshot and name.
export default function BrandBar({ max = 1120 }) {
  return (
    <div style={{ background:"#fff", borderBottom:"1px solid #DCE3EB" }}>
      <div style={{ maxWidth:max, margin:"0 auto", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <img src="/brand/gf-logo.png" alt="Graham Financial" style={{ height:46, width:"auto" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ textAlign:"right", fontFamily:"'Public Sans', system-ui, sans-serif", lineHeight:1.25 }}>
            <div style={{ fontFamily:"'Montserrat', Arial, sans-serif", fontWeight:700, fontSize:14, color:"#0E1B2A" }}>Joshua Graham</div>
            <div style={{ fontSize:12, color:"#51647A" }}>AVP · NMLS #169809</div>
          </div>
          <img src="/brand/joshua-headshot.jpg" alt="Joshua Graham" style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", border:"2px solid #DCE3EB" }}/>
        </div>
      </div>
    </div>
  );
}
// The promise under the consent checkbox.
export function NoSpam() {
  return <p style={{ margin:"6px 0 0", fontSize:14, fontWeight:700, color:"#0E1B2A", lineHeight:1.45 }}>You will NOT be spammed. You'll only be contacted by me, Joshua Graham, a real live person.</p>;
}
