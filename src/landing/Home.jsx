// grahamfinancial.us home page. Smooth. Precise. Elite.
import { useState } from "react";
import { BRAND } from "../smart-money/data.js";
import { STATS, WINS, TESTIMONIALS } from "./proof.js";

const C = { bg:"#EFEAE0", ink:"#101820", accent:"#A3141C", panel:"#1E252C", mute:"#5A5F66", rule:"rgba(16,24,32,.16)", cream:"#EFEAE0" };
const B = "'Bodoni Moda', 'Playfair Display', Georgia, serif";
const M = "'Montserrat', Arial, sans-serif";
const tel = `tel:${BRAND.phone.replace(/\D/g, "")}`;
const book = BRAND.booking;
const grain = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const wrap = { maxWidth:1120, margin:"0 auto", padding:"0 24px" };
const kicker = { fontFamily:M, fontWeight:700, fontSize:12, letterSpacing:".34em", textTransform:"uppercase", color:C.ink };
const btnBase = { fontFamily:M, fontWeight:700, fontSize:14, letterSpacing:".14em", textTransform:"uppercase", textDecoration:"none", padding:"17px 28px", display:"inline-block", borderRadius:2, textAlign:"center" };
const btnDark = { ...btnBase, background:C.ink, color:C.cream, border:`2px solid ${C.ink}` };
const btnLine = { ...btnBase, background:"transparent", color:C.ink, border:`2px solid ${C.ink}` };

const LANES = [
  { ref:"PAY-01", tag:"The payment", head:"Own it for less than you rent.", body:"Roommates, rooms and real numbers. See how the payment can land near your rent while you build the equity.", img:"/smart-money/flyers/PAY-01.png" },
  { ref:"DWN-01", tag:"The cash", head:"Cash to close can be near $0.", body:"Seller credits and down payment assistance can do most of the lifting, for buyers who qualify.", img:"/smart-money/flyers/DWN-01.png" },
  { ref:"WLT-01", tag:"The wealth", head:"Home prices rose in 45 of 50 years.", body:"Rent builds your landlord's wealth. A home can build yours. The 50-year chart tells the story.", img:"/smart-money/flyers/WLT-01.png" },
  { ref:"EQT-01", tag:"The equity", head:"Your equity is dead money.", body:"Homeowners and investors: put the equity you already have to work as the down payment on your next property.", img:"/smart-money/flyers/EQT-01.png" },
];
const STEPS = [
  ["01", "You tell me your numbers.", "Rent, savings, income, the home you have your eye on. Ten minutes, no paperwork."],
  ["02", "I run them, side by side.", "Your real payment, your real cash to close, and every option I can access for you."],
  ["03", "You decide.", "No pressure, no pitch. It's not a sales call. If it works, we move. If not, you know exactly where you stand."],
];

export default function Home() {
  const [open, setOpen] = useState(null);
  const lane = LANES.find((l) => l.ref === open);
  return (
    <div style={{ background:C.bg, color:C.ink, fontFamily:B, position:"relative", overflowX:"hidden" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:grain, opacity:.14, pointerEvents:"none" }}/>
      <div style={{ position:"relative" }}>

        {/* top bar */}
        <div style={{ ...wrap, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", gap:12, flexWrap:"wrap" }}>
          <img src="/brand/gf-logo-ink.png" alt="Graham Financial" style={{ height:54, width:"auto" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:22, flexWrap:"wrap" }}>
            <a href={tel} style={{ fontFamily:B, fontWeight:600, fontSize:22, color:C.ink, textDecoration:"none" }}>{BRAND.phone}</a>
            <a href={book} target="_blank" rel="noreferrer" style={{ ...btnDark, padding:"12px 20px", fontSize:12 }}>Book a call</a>
          </div>
        </div>

        {/* hero */}
        <div style={{ ...wrap, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap:40, alignItems:"center", padding:"48px 24px 72px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}><div style={{ width:12, height:12, background:C.accent }}/><span style={kicker}>Smart money to finance real estate</span></div>
            <a href={book} target="_blank" rel="noreferrer" style={{ textDecoration:"none", color:C.ink, display:"block" }}>
              <h1 style={{ margin:"22px 0 0", fontFamily:B, fontWeight:500, fontSize:"clamp(48px, 8vw, 96px)", lineHeight:.97, letterSpacing:"-.02em" }}>
                When it has to go right,<br/><i style={{ color:C.accent, fontWeight:400 }}>I&rsquo;m your guy.</i>
              </h1>
            </a>
            <p style={{ margin:"26px 0 0", fontSize:24, lineHeight:1.4, maxWidth:520 }}>Twenty-five years of getting loans closed, for buyers, homeowners and investors. I have access to the money, and I make the process easy.</p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:34 }}>
              <a href={book} target="_blank" rel="noreferrer" style={btnDark}>Book a call</a>
              <a href={tel} style={btnLine}>Call {BRAND.phone}</a>
            </div>
            <p style={{ margin:"14px 0 0", fontFamily:M, fontWeight:700, fontSize:11, letterSpacing:".22em", color:C.accent }}>IT&rsquo;S NOT A SALES CALL</p>
          </div>
          <div style={{ position:"relative", justifySelf:"center", width:"100%", maxWidth:440 }}>
            <img src="/brand/photos/joshua-park-smile.jpg" alt="Joshua Graham" style={{ width:"100%", display:"block", filter:"grayscale(1) contrast(1.08) brightness(.96)", aspectRatio:"4 / 5", objectFit:"cover", objectPosition:"50% 18%" }}/>
            <div style={{ position:"absolute", left:0, right:0, bottom:0, padding:"60px 24px 22px", background:`linear-gradient(to bottom, rgba(30,37,44,0), ${C.panel})`, color:C.cream }}>
              <div style={{ fontFamily:B, fontSize:26, fontWeight:600 }}>Joshua Graham</div>
              <div style={{ fontFamily:M, fontWeight:700, fontSize:11, letterSpacing:".2em", color:"#CDB892", marginTop:6 }}>REGIONAL LOAN ORIGINATOR</div>
              <div style={{ fontFamily:M, fontWeight:600, fontSize:10.5, letterSpacing:".12em", marginTop:4, color:"#B9BEC4" }}>NMLS #169809 &nbsp;&middot;&nbsp; LICENSED IN COLORADO</div>
            </div>
          </div>
        </div>

        {/* lanes */}
        <div style={{ borderTop:`2px solid ${C.ink}` }}>
          <div style={{ ...wrap, padding:"64px 24px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:12, height:12, background:C.accent }}/><span style={kicker}>What&rsquo;s really in the way</span></div>
            <h2 style={{ margin:"16px 0 8px", fontWeight:500, fontSize:"clamp(36px, 5vw, 56px)", lineHeight:1, letterSpacing:"-.02em" }}>Four things stop people from buying.<br/><i style={{ color:C.accent, fontWeight:400 }}>Each one has an answer.</i></h2>
            <p style={{ fontSize:20, color:C.mute, margin:"10px 0 0", maxWidth:640 }}>Tap one to see the math.</p>
          </div>
          <div style={{ ...wrap, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap:20, padding:"24px 24px 72px" }}>
            {LANES.map((l) => (
              <button key={l.ref} onClick={() => setOpen(l.ref)} style={{ textAlign:"left", background:"transparent", border:`1px solid ${C.rule}`, padding:0, cursor:"pointer", color:C.ink, fontFamily:B }}>
                <img src={l.img} alt={l.head} loading="lazy" style={{ width:"100%", display:"block" }}/>
                <div style={{ padding:"16px 18px 20px" }}>
                  <div style={{ fontFamily:M, fontWeight:700, fontSize:11, letterSpacing:".28em", color:C.accent, textTransform:"uppercase" }}>{l.tag}</div>
                  <div style={{ fontSize:24, fontWeight:600, lineHeight:1.12, margin:"8px 0" }}>{l.head}</div>
                  <div style={{ fontSize:17, lineHeight:1.4, color:C.mute }}>{l.body}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* proof */}
        <div style={{ background:C.panel, color:C.cream }}>
          <div style={{ ...wrap, padding:"72px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:12, height:12, background:"#CDB892" }}/><span style={{ ...kicker, color:C.cream }}>The track record</span></div>
            <div style={{ display:"flex", gap:56, flexWrap:"wrap", margin:"26px 0 8px" }}>
              {STATS.map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize:"clamp(64px, 9vw, 112px)", fontWeight:500, lineHeight:.95, letterSpacing:"-.02em" }}>{s.big}</div>
                  <div style={{ fontFamily:M, fontWeight:600, fontSize:12, letterSpacing:".26em", color:"#CDB892", marginTop:10, textTransform:"uppercase" }}>{s.label}</div>
                </div>))}
            </div>
            {WINS.length > 0 && (
              <div style={{ marginTop:40, display:"grid", gap:0 }}>
                {WINS.map((w, i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(110px, 170px) 1fr", gap:20, padding:"16px 0", borderTop:"1px solid rgba(239,234,224,.18)" }}>
                    <div style={{ fontFamily:M, fontWeight:600, fontSize:12, letterSpacing:".16em", color:"#CDB892" }}>{w.when}</div>
                    <div style={{ fontSize:22, lineHeight:1.3 }}>{w.what}</div>
                  </div>))}
              </div>)}
            {TESTIMONIALS.length > 0 && (
              <div style={{ marginTop:48, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap:28 }}>
                {TESTIMONIALS.map((t, i) => (
                  <figure key={i} style={{ margin:0, borderTop:"2px solid #CDB892", paddingTop:18 }}>
                    <blockquote style={{ margin:0, fontSize:22, lineHeight:1.4, fontStyle:"italic" }}>&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption style={{ fontFamily:M, fontWeight:600, fontSize:12, letterSpacing:".16em", color:"#CDB892", marginTop:14, textTransform:"uppercase" }}>{t.name}{t.role ? ` · ${t.role}` : ""}</figcaption>
                  </figure>))}
              </div>)}
          </div>
        </div>

        {/* how a call goes */}
        <div style={{ ...wrap, padding:"72px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:12, height:12, background:C.accent }}/><span style={kicker}>How a call goes</span></div>
          <h2 style={{ margin:"16px 0 36px", fontWeight:500, fontSize:"clamp(36px, 5vw, 56px)", lineHeight:1, letterSpacing:"-.02em" }}>Simple. <i style={{ color:C.accent, fontWeight:400 }}>And it&rsquo;s not a sales call.</i></h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap:32 }}>
            {STEPS.map(([n, h, b]) => (
              <div key={n} style={{ borderTop:`2px solid ${C.ink}`, paddingTop:16 }}>
                <div style={{ fontFamily:M, fontWeight:700, fontSize:12, letterSpacing:".3em", color:C.accent }}>{n}</div>
                <div style={{ fontSize:28, fontWeight:600, lineHeight:1.12, margin:"10px 0 8px" }}>{h}</div>
                <div style={{ fontSize:19, lineHeight:1.45, color:C.mute }}>{b}</div>
              </div>))}
          </div>
        </div>

        {/* final cta */}
        <a href={book} target="_blank" rel="noreferrer" style={{ display:"block", background:C.ink, color:C.cream, textDecoration:"none", textAlign:"center", padding:"72px 24px" }}>
          <div style={{ fontSize:"clamp(40px, 7vw, 80px)", fontWeight:500, lineHeight:1, letterSpacing:"-.02em" }}>When it has to go right,<br/><i style={{ color:"#CDB892", fontWeight:400 }}>I&rsquo;m your guy.</i></div>
          <div style={{ fontFamily:M, fontWeight:700, fontSize:13, letterSpacing:".24em", marginTop:30, display:"inline-block", border:`2px solid ${C.cream}`, padding:"16px 28px" }}>BOOK A CALL</div>
          <div style={{ fontFamily:M, fontWeight:600, fontSize:11, letterSpacing:".22em", marginTop:16, color:"#B9BEC4" }}>SAVE MY NUMBER &nbsp;&middot;&nbsp; {BRAND.phone}</div>
        </a>

        {/* footer */}
        <div style={{ ...wrap, padding:"40px 24px 56px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:24, flexWrap:"wrap", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:26, fontWeight:600 }}>Joshua Graham</div>
              <div style={{ fontFamily:M, fontWeight:700, fontSize:11, letterSpacing:".2em", color:C.accent, marginTop:6 }}>REGIONAL LOAN ORIGINATOR &nbsp;&middot;&nbsp; NMLS #169809</div>
              <div style={{ fontSize:21, marginTop:12 }}><a href={tel} style={{ color:C.ink, textDecoration:"none", fontWeight:600 }}>{BRAND.phone}</a> <span style={{ color:C.accent }}>/</span> <a href={`mailto:${BRAND.email}`} style={{ color:C.ink, textDecoration:"none" }}>{BRAND.email}</a></div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:18 }}>
              <img src="/brand/gf-logo-ink.png" alt="Graham Financial" style={{ height:50, opacity:.9 }}/>
              <div style={{ width:1, height:40, background:C.rule }}/>
              <img src="/brand/zpm-logo-ink.png" alt="Zero Point Mortgage Services" style={{ height:34, opacity:.9 }}/>
            </div>
          </div>
          <p style={{ fontFamily:M, fontWeight:500, fontSize:11, lineHeight:1.6, color:C.mute, margin:"28px 0 0", maxWidth:900 }}>
            Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. Down payment assistance and seller concessions depend on program eligibility, lender and seller agreement and are not available to all borrowers. Examples on this page are illustrations, not offers; rates, payments and cash to close vary by scenario. Home price history is national, from the FHFA House Price Index, is not adjusted for inflation, and does not predict future results. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.
          </p>
        </div>
      </div>

      {/* lightbox */}
      {lane && (
        <div onClick={() => setOpen(null)} style={{ position:"fixed", inset:0, background:"rgba(16,24,32,.88)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth:640, width:"100%", margin:"auto" }}>
            <img src={lane.img} alt={lane.head} style={{ width:"100%", display:"block" }}/>
            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <a href={book} target="_blank" rel="noreferrer" style={{ ...btnBase, flex:1, background:C.accent, color:"#fff", border:`2px solid ${C.accent}` }}>Book a call</a>
              <button onClick={() => setOpen(null)} style={{ ...btnBase, background:C.cream, color:C.ink, border:`2px solid ${C.cream}`, cursor:"pointer" }}>Close</button>
            </div>
          </div>
        </div>)}
    </div>
  );
}
