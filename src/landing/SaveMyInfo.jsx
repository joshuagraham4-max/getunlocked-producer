// Save my info: the page every Bond flyer and post points to, styled like the flyers (bone ground, Bodoni, hairline ledger, red italic, navy panel).
// Pick what brings you here → talking points for that choice appear → short form → calculator_leads (source "save-my-info", ref from ?ref=)
// → existing triggers drop the lead into Contacts and ping the phone. Intro video comes from saveVideo.js (hidden until a link is set).
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { BRAND } from "../smart-money/data.js";
import { SAVE_VIDEO, SAVE_VIDEO_TITLE, embedFor } from "./saveVideo.js";

const THEMES = {
  sky:    { bone:"#F6EEDF", ink:"#0E1B2A", red:"#4A111C", panel:"#0E1B2A", panelText:"#F6EEDF", panelMute:"#C9D6E3", mute:"#4A5568", rule:"#0E1B2A", soft:"#E3D6BF" },
  maroon: { bone:"#F1ECE6", ink:"#1A1216", red:"#C8102E", panel:"#4A111C", panelText:"#F6ECE9", panelMute:"#D9B3B9", mute:"#5E5358", rule:"#1A1216", soft:"#DDD2C8" },
  teal:   { bone:"#E3EEF0", ink:"#0B1C21", red:"#C8102E", panel:"#0A3A42", panelText:"#E9F3F4", panelMute:"#9CC3C7", mute:"#41585D", rule:"#0B1C21", soft:"#C3D6D9" },
};
const DOOR_THEME = { buyer:"sky", homeowner:"sky", investor:"sky", agent:"sky" };
const C = { ...THEMES.sky, navy:"#0E1B2A", maroon:"#4A111C", mustard:"#D9A94A", gold:"#D9A566", goldDk:"#8A5A24", plum:"#7E4B6F" };
const SERIF = "'Public Sans', system-ui, sans-serif", SANS = "'Montserrat', Arial, sans-serif", ANTON = "'Anton', 'Arial Narrow', Impact, sans-serif";
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

// Four doors. Each is a few tap-answer questions (one per screen) that qualify the visitor and ask what they are trying to accomplish,
// then a handoff: buyers are offered the 15-minute class (wait list until it is recorded), homeowners get a hand-run equity review,
// investors get the Portfolio Review, agents join the lead wait list. Every answer lands in the contact note.
const TIMING = ["No concerns, ready when it's right", "I need to move within 3 months", "I'm 6 months or more out", "Something is forcing the timing"];
const WHO = [
  { id:"buyer", label:"Buying a home", sub:"First home, next home or moving up",
    qs:[
      { id:"goal", short:"Goal", q:"What are we trying to accomplish?", opts:["Buy my first home", "Move up to the next home", "Buy a home to live in and rent a room", "Just see what's possible"] },
      { id:"job", short:"Employed", q:"Are you employed?", opts:["Yes, W-2", "Yes, self-employed", "Retired or other income", "Not right now"] },
      { id:"dp", short:"Down payment concern", q:"Is the down payment a concern for you?", opts:["Yes, a big one", "A little", "No"] },
      { id:"credit", short:"Credit", q:"How's your credit?", opts:["Strong, 700 or higher", "Okay, 640 to 699", "Needs work", "Not sure"] },
      { id:"pmt", short:"Perfect monthly payment", q:"If you could wave a magic wand, what's the perfect monthly payment for you?", money:true, ph:"2,500" },
      { id:"cash", short:"Max cash to close", q:"Best case, what's the most you'd want to spend, all in, to buy a home?", sub:"Down payment, closing costs, everything you'd bring to the table.", money:true, ph:"5,000" },
      { id:"timing", short:"Timing", q:"Any concerns on timing?", opts:TIMING },
      { id:"class", short:"Class", q:"Want in? The free 15-minute class makes you a SMART buyer with SMART money.", sub:"Finish it and you unlock free credit report access and review, appraisal credits and wholesale interest rates.", opts:["Yes, join the wait list", "Not right now"] },
    ],
    thanks:(a) => a.class && /^Yes/.test(a.class) ? "You're on the wait list for the SMART Buyer class. The day it's live, I'll text you, and your free credit report review, appraisal credits and wholesale rate access unlock with it. In the meantime I'll look at your numbers and reach out." : "Got it. I'll look at what you told me and text you what I'd do in your shoes." },
  { id:"homeowner", label:"I own a home", sub:"Equity, a low rate, a second property",
    qs:[
      { id:"goal", short:"Goal", q:"What are we trying to accomplish?", opts:["Buy rentals with my equity", "Optimize the financing I have", "Pull cash out", "Sell and move up", "Just see where I stand"] },
      { id:"years", short:"Owned", q:"How long have you owned the home?", opts:["Less than 2 years", "2 to 5 years", "5 to 10 years", "More than 10 years"] },
      { id:"dead", short:"Dead money", q:"Do you have dead money sitting in it?", opts:["Probably", "Not sure", "No"] },
      { id:"working", short:"Equity working", q:"Is your equity working for you right now?", opts:["Yes", "No", "Not sure"] },
      { id:"timing", short:"Timing", q:"Any concerns on timing?", opts:TIMING },
    ],
    handoff:"Great. I'll run a deep home valuation and equity review, way deeper than an online estimate, and get back to you. I'll need your address.",
    thanks:() => "Got it. I'll run your deep equity review by hand and get back to you with what I find." },
  { id:"investor", label:"Real estate investor", sub:"One property or a whole portfolio",
    qs:[
      { id:"goal", short:"Goal", q:"What are we trying to accomplish?", opts:["Buy my next property", "Optimize what I already have", "Pull equity out", "Reduce my portfolio", "Get a second opinion"] },
      { id:"count", short:"Properties", q:"How many properties do you own?", opts:["None yet", "1 to 4", "5 to 10", "11 or more"] },
      { id:"direction", short:"Direction", q:"Are you expanding or reducing?", opts:["Expanding", "Reducing", "Holding steady", "Not sure"] },
      { id:"focus", short:"Main goal", q:"Is cash flow your main goal, or equity position?", opts:["Cash flow", "Equity position", "Both"] },
      { id:"timing", short:"Timing", q:"Any concerns on timing?", opts:TIMING },
    ],
    handoff:"You probably have dead money sitting in properties that aren't optimized. That's why I do a portfolio review.",
    thanks:() => "Got it. Next, see where your dead money is, and book a call with me when you're ready." },
  { id:"agent", label:"Real estate agent", sub:"Your buyers, your deals, your team",
    qs:[
      { id:"goal", short:"Goal", q:"What are we trying to accomplish?", opts:["More buyer leads", "Bigger approvals for my buyers", "Train my team on lending", "A lender I can count on"] },
      { id:"areas", short:"Areas", q:"What areas do you cover?", sub:"Cities, counties or zip codes.", text:true, ph:"Sarasota, Bradenton, Lakewood Ranch" },
      { id:"side", short:"Prefers", q:"Do you prefer buyers or sellers?", opts:["Buyers", "Sellers", "Both"] },
      { id:"invest", short:"Invests", q:"Are you interested in real estate investing yourself?", opts:["Yes", "No", "I already invest"] },
      { id:"home", short:"Owns a home", q:"Do you own a home?", opts:["Yes", "No"] },
      { id:"timing", short:"Leads wanted", q:"How soon do you want leads?", opts:["Now", "This quarter", "Just exploring"] },
    ],
    handoff:"Here's where we are: we're building out the team and the lead flow now, so this is a wait list. Where should we send leads when they're ready for you?",
    thanks:() => "You're on the lead wait list. I'll reach out as soon as buyers are ready for your market." },
];
const WHY = [["THE NATIONAL TOTAL", "Overpaid on mortgages, every year", "$65 billion", 0], ["YOUR SHARE", "About, per borrower, per year", "$3,300", 0], ["THE CAUSE", "Most buyers take one lender's quote", "1 quote", 0], ["THE FIX", "A wholesale broker shops many banks and gives you options", "Me", 1]];
const PERKS = ["Your credit report, free, reviewed with you", "Appraisal credits toward your purchase", "Access to wholesale interest rates"];
const LEARN = [["VA loans", "Get the most out of the benefit you earned."], ["Down payment assistance", "Programs that can cover your down payment and closing costs."], ["Equity Unlock", "Use your equity to buy before your current home sells."], ["Investment property financing", "Rentals, from your first to a whole portfolio."]];
const getWho = () => { try { const w = new URLSearchParams(location.search).get("who"); return WHO.some((x) => x.id === w) ? w : ""; } catch { return ""; } };
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "SAVE-01"; } catch { return "SAVE-01"; } };
const mkCSS = () => `
.sv{font-family:'Public Sans',system-ui,sans-serif;color:${C.ink};background:${C.bone};min-height:100vh}
.sv *{box-sizing:border-box}
.sv-top{background:#fff;border-bottom:4px solid ${C.plum}}
.sv-top>div{max-width:1000px;margin:0 auto;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.sv-wm{font:400 24px ${ANTON};letter-spacing:.04em;text-transform:uppercase;color:${C.navy};line-height:1}
.sv-hero{max-width:1000px;margin:0 auto;display:flex;align-items:stretch}
.sv-hero-l{flex:1;min-width:0;padding:30px 20px 30px 20px;display:flex;flex-direction:column;gap:14px;justify-content:center}
.sv-k{font:700 11px ${SANS};letter-spacing:.2em;text-transform:uppercase;color:${C.maroon}}
.sv-h1{font:400 clamp(44px,12vw,92px)/1.0 ${ANTON};letter-spacing:.01em;text-transform:uppercase;margin:0;color:${C.navy}}
.sv-h1 i{display:block;font-style:normal;color:${C.maroon}}
.sv-bar{width:40px;height:4px;background:${C.gold}}
.sv-sub{font:400 16px/1.55 'Public Sans',system-ui,sans-serif;color:${C.mute};margin:0}
.sv-photos{width:132px;flex:none;background:${C.maroon};display:flex;flex-direction:column;gap:12px;padding:0 0 14px}
.sv-photos img,.sv-photos .ph{display:block;width:100%;object-fit:cover;object-position:50% 10%}
.sv-photos .a{height:190px;flex:none}
.sv-photos .j{flex:1;min-height:300px}
.sv-photos .ph{display:flex;align-items:center;justify-content:center;background:#6E2A38;color:#E3C9CC;font:400 44px ${ANTON}}
.sv-photos .cap{padding:0 8px;text-align:center;font:700 10px/1.45 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:#fff;margin-top:-4px}
.sv-photos .cap span{color:#E3C9CC;font-weight:600}
.sv-photos .cap a{color:#fff;text-decoration:none;letter-spacing:.04em}
.sv-vidwrap{max-width:1000px;margin:0 auto;padding:0 20px 28px}
.sv-vid{position:relative;aspect-ratio:16/9;background:${C.panel};border:3px solid ${C.plum}}
.sv-vid iframe,.sv-vid video{position:absolute;inset:0;width:100%;height:100%;border:0}
.sv-plum{height:10px;background:${C.plum}}
.sv-ben{background:${C.navy};color:#fff}
.sv-ben-in{max-width:1000px;margin:0 auto;padding:8px 24px 16px}
.sv-st{padding:20px 0;border-top:1px solid rgba(246,238,223,.28);display:flex;gap:16px}
.sv-st:first-child{border-top:0}
.sv-st .n{font:400 44px/.9 ${ANTON};color:#E3C9CC;width:36px;flex:none}
.sv-st .tg{font:700 11px ${SANS};letter-spacing:.2em;text-transform:uppercase;color:#C9D6E3}
.sv-st .tt{font:400 clamp(26px,5vw,34px)/1.08 ${ANTON};letter-spacing:.02em;text-transform:uppercase;color:#fff;margin-top:4px}
.sv-st .tx{font:400 15px/1.5 'Public Sans',system-ui,sans-serif;color:#C9D6E3;margin-top:6px}
.sv-st .li{margin-top:12px}.sv-st .li b{display:block;font:400 20px ${ANTON};letter-spacing:.03em;text-transform:uppercase;color:#fff}
.sv-st .li span{display:block;font:400 14px/1.45 'Public Sans',system-ui,sans-serif;color:#C9D6E3;margin-top:2px}
.sv-st .ck{margin-top:10px;font:600 16px/1.7 'Public Sans',system-ui,sans-serif;color:#fff}
.sv-main{max-width:760px;margin:0 auto;padding:30px 20px 56px}
.sv-q{font:400 clamp(30px,5vw,42px)/1.05 ${ANTON};letter-spacing:.01em;text-transform:uppercase;color:${C.navy}}
.sv-rule{border:0;border-top:3px solid ${C.navy};margin:6px 0 0}
.sv-hair{border:0;border-top:1px solid ${C.soft};margin:0}
.sv-lab{font:800 12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${C.navy}}
.sv-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:14px 0;border-bottom:1px solid ${C.soft}}
.sv-row .sub{font:400 16px 'Public Sans',system-ui,sans-serif;color:${C.ink}}
.sv-row .val{font:400 34px ${ANTON};white-space:nowrap;color:${C.navy}}
.sv-row.hot .lab{color:${C.maroon}} .sv-row.hot .val{color:${C.maroon}}
.sv-choice{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:1.5px solid ${C.soft};border-radius:2px;padding:15px 16px;margin-bottom:9px;cursor:pointer;color:${C.ink};min-height:60px}
.sv-choice .t{font:400 22px/1.15 ${ANTON};letter-spacing:.02em;text-transform:uppercase} .sv-choice .s{font:400 14px 'Public Sans',system-ui,sans-serif;color:${C.mute};display:block;margin-top:3px}
.sv-choice .dot{width:22px;height:22px;border:2px solid ${C.navy};border-radius:50%;flex:none}
.sv-choice.on{background:${C.navy};border-color:${C.navy};color:#fff} .sv-choice.on .t{color:#fff} .sv-choice.on .dot{background:${C.plum};border-color:${C.plum}}
.sv-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:20px 22px;margin-top:6px}
.sv-f{display:flex;flex-direction:column;gap:4px}
.sv-f span{font:700 11px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${C.navy}}
.sv-f em{font:italic 400 13px 'Public Sans',system-ui,sans-serif;color:${C.mute};text-transform:none;letter-spacing:0;font-weight:400}
.sv-in{font:400 18px 'Public Sans',system-ui,sans-serif;color:${C.ink};background:#fff;border:1px solid ${C.soft};border-bottom:2px solid ${C.navy};border-radius:2px;padding:11px 12px;width:100%;outline:none}
.sv-in:focus{border-bottom-color:${C.plum}}
.sv-btn{font:400 20px ${ANTON};letter-spacing:.08em;text-transform:uppercase;background:${C.maroon};color:#fff;border:0;border-bottom:4px solid ${C.plum};border-radius:2px;padding:16px 26px;cursor:pointer;width:100%;min-height:58px}
.sv-btn:disabled{opacity:.6}
.sv-fine{font:400 11.5px/1.5 ${SANS};color:${C.mute}}
@media(min-width:760px){
 .sv-photos{width:300px}.sv-photos .a{height:260px}.sv-photos .j{min-height:420px}.sv-photos .cap{font-size:12px;padding:0 16px}
 .sv-hero-l{padding:48px 36px 48px 20px}
}`;

function Ledger({ rows }) {
  return <div style={{ borderTop:`2px solid ${C.rule}`, marginTop:12 }}>{rows.map(([l, s, v, hot], i) => (
    <div key={i} className={"sv-row" + (hot ? " hot" : "")}><div><div className="sv-lab lab">{l}</div><div className="sub">{s}</div></div><div className="val">{v}</div></div>))}</div>;
}

const money = (v) => String(v || "").replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function Perks({ title }) {
  return (<div style={{ background:C.panel, color:C.panelText, padding:"16px 18px", marginTop:18 }}>
    <div style={{ font:`700 11px ${SANS}`, letterSpacing:".18em", textTransform:"uppercase", color:C.panelMute }}>{title || "Smart Money members get"}</div>
    {PERKS.map((p) => <div key={p} style={{ font:`500 18px/1.35 ${SERIF}`, marginTop:7, display:"flex", gap:10 }}><span style={{ color:"#E3C9CC" }}>✓</span><span>{p}</span></div>)}
  </div>);
}

export default function SaveMyInfo({ agent = null, lockWho = "" }) {
  const [who, setWho] = useState(lockWho || getWho());
  const refCode = agent ? `AGT-${agent.slug}` : getRef();
  Object.assign(C, THEMES[DOOR_THEME[who] || "sky"]);
  useEffect(() => { try { document.body.style.background = C.bone; } catch {} });
  const [step, setStep] = useState(() => { try { return Math.max(0, parseInt(new URLSearchParams(location.search).get("step") || "0", 10) || 0); } catch { return 0; } });            // question index; flow.qs.length = the contact step
  const [a, setA] = useState({});                  // answers by question id
  const [f, setF] = useState({ first:"", last:"", email:"", phone:"", city:"", state:"", zip:"", address:"", sendTo:"", note:"", consent:false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const top = React.useRef(null);
  const base = WHO.find((w) => w.id === who);
  const selling = /^Selling/.test(a.intent || "");
  const sellOnly = a.intent === "Selling my home";
  const flow = base && agent && who === "buyer" ? { ...base, qs:[
    { id:"intent", short:"Here to", q:"What brings you here?", opts:["Buying a home", "Selling my home", "Selling and buying"] },
    { id:"hasagent", short:"Has agent", q:"Are you already working with an agent?", opts:["No, I don't have one", "Not sure yet", "Yes, I'm working with an agent"] },
    ...(selling ? [
      { id:"saddr", short:"Sell address", q:"What's the address of the home you'd sell?", sub:"We'll zero in on what it's actually worth, not a Zillow guess.", text:true, ph:"Street, city" },
      { id:"sworth", short:"Thinks it's worth", q:"What do you think it's worth today?", sub:"Your best guess is fine.", money:true, ph:"450,000" },
      { id:"spayoff", short:"Owes", q:"Roughly what do you still owe on it?", sub:"All loans on the home, a ballpark is fine.", money:true, ph:"250,000" },
      { id:"swhen", short:"Sell by", q:"When do you need it sold?", opts:["As soon as possible", "Within 3 months", "In 6 months or more", "Only after I find the next home"] },
    ] : []),
    ...(sellOnly ? [] : base.qs)] } : base; const vid = embedFor(SAVE_VIDEO);
  const go = (n) => { setStep(n); setErr(""); setTimeout(() => { try { top.current && top.current.scrollIntoView({ behavior:"smooth", block:"start" }); } catch {} }, 30); };
  const pick = (w) => { setWho(w); setA({}); go(0); };
  const answer = (q, v) => { setA({ ...a, [q.id]:v }); go(step + 1); };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const inContact = flow && step >= flow.qs.length;
  const q = flow && !inContact ? flow.qs[step] : null;
  const wantsClass = who === "buyer" && /^Yes/.test(a.class || "");

  const submit = async (ev) => {
    ev.preventDefault(); setErr("");
    const skipped = flow.qs.findIndex((x) => !a[x.id]); if (skipped >= 0) return go(skipped);
    const phone = f.phone.replace(/\D/g, ""); const miss = [];
    if (!f.first.trim()) miss.push("first name");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) miss.push("a valid email");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (who === "homeowner" && !f.address.trim()) miss.push("the home's address");
    if (who !== "agent" && !f.state && !/^\d{5}$/.test(f.zip.trim())) miss.push("your state or zip");
    if (!f.consent) miss.push("your consent to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const place = [f.city.trim(), f.state].filter(Boolean).join(", ");
    const qa = flow.qs.map((x) => `${x.short}: ${x.money && a[x.id] ? "$" + a[x.id] : (a[x.id] || "-")}`).join(" · ");
    const summary = `${agent ? "Agent page: " + agent.name + " · " : "Save my info: "}${flow.label}${wantsClass ? " · CLASS WAIT LIST" : ""}${who === "agent" ? " · LEAD WAIT LIST" : ""} · ${qa}${f.address.trim() ? " · Address: " + f.address.trim() : ""}${f.sendTo.trim() ? " · Send leads to: " + f.sendTo.trim() : ""}${place ? " · " + place : ""}${f.note.trim() ? ` · "${f.note.trim().slice(0, 160)}"` : ""}`.slice(0, 900);
    const { error } = await supabase.from("calculator_leads").insert({
      first_name:f.first.trim(), last_name:f.last.trim() || null, email:f.email.trim(), phone,
      property_state:f.state || null, zip:/^\d{5}$/.test(f.zip.trim()) ? f.zip.trim() : null, consent:true,
      ref:refCode, source:agent ? "agent-page" : "save-my-info", page_url:location.href.slice(0, 500), user_agent:navigator.userAgent.slice(0, 300),
      answers:{ has_agent:a.hasagent || null, summary, agent_slug:agent ? agent.slug : null, agent_name:agent ? agent.name : null, interest:who, qa:a, class_waitlist:wantsClass, address:f.address.trim() || a.saddr || null, sell_first:selling, intent:a.intent || null, send_leads_to:f.sendTo.trim() || null, city:f.city.trim() || null, note:f.note.trim() || null } });
    setBusy(false);
    if (error) return setErr("We couldn't send that just now. Check your connection and try again, or call " + BRAND.phone + ".");
    setDone(true); try { window.scrollTo({ top:0, behavior:"smooth" }); } catch {}
  };
  const btnLink = { textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" };

  return (
    <div className="sv"><style>{mkCSS()}</style>
      <div className="sv-top"><div>
        <img src="/brand/gf-logo-ink.png" alt="Graham Financial" style={{ height:46, width:"auto" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>{agent && agent.logo_url && <img src={agent.logo_url} alt={agent.brokerage || agent.name} style={{ maxHeight:40, maxWidth:110, width:"auto", objectFit:"contain" }}/>}<img src="/brand/zpm-logo-ink.png" alt="Zero Point Mortgage Services" style={{ height:24, width:"auto" }}/></div>
      </div></div>
      <section className="sv-hero">
        <div className="sv-hero-l">
          <div className="sv-k">Real Estate Financing. Smooth. Precise. Elite.</div>
          <h1 className="sv-h1">{done ? <>You're in, {f.first.trim()}.</> : agent ? <>Buying.<br/>Selling.<i>{agent.market ? `In ${agent.market}?` : "Let's talk."}</i></> : <>When it<br/>has to go<i>right.</i></>}</h1>
          <div className="sv-bar"/>
          <p className="sv-sub">{done ? (agent ? (sellOnly ? `${agent.name} will be in touch about your home, and I'm on the lending side if you buy next.` : `${agent.name} and I will both be in touch shortly. ${flow.thanks(a)}`) : `${flow.thanks(a)} It's not a sales call. When it has to go right, I'm your guy.`) : agent ? `${agent.name}${agent.brokerage ? " of " + agent.brokerage : ""} and I will help you buy or sell. As a wholesale broker, I shop many banks and give you options.` : "I'm Joshua Graham. As a wholesale broker, I shop many banks and give you options."}</p>
        </div>
        <aside className="sv-photos">
          {agent && (agent.photo_url ? <img className="a" src={agent.photo_url} alt={agent.name}/> : <div className="ph a">{agent.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}</div>)}
          {agent && <div className="cap">{agent.name}<br/><span>{agent.brokerage || "Real estate"}</span></div>}
          <img className="j" src="/brand/joshua-plum-suit.jpg" alt="Joshua Graham"/>
          <div className="cap">Joshua Graham<br/><span>NMLS #169809</span><br/><a href={`tel:${BRAND.phone.replace(/\D/g, "")}`}>{BRAND.phone}</a></div>
        </aside>
      </section>
      {!done && (() => { const av = agent && agent.video_url && step === 0 ? embedFor(agent.video_url) : null; const v2 = av || (!flow ? vid : null); const ttl = av ? agent.name : SAVE_VIDEO_TITLE;
        return v2 ? <div className="sv-vidwrap"><div className="sv-vid" aria-label={ttl}>{v2.kind === "iframe" ? <iframe src={v2.src} title={ttl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/> : <video src={v2.src} controls playsInline preload="metadata"/>}</div></div> : null; })()}
      <div className="sv-plum"/>
      {!done && (!flow || (who === "buyer" && step === 0)) && <section className="sv-ben"><div className="sv-ben-in">
        <div className="sv-st"><div className="n">1</div><div><div className="tg">Start here</div><div className="tt">Join the free 15-minute SMART Buyer class</div><div className="tx">Answer a few quick questions and you are on the list. I text you the day it is live.</div></div></div>
        <div className="sv-st"><div className="n">2</div><div><div className="tg">What you learn</div><div className="tt">The loans most buyers never hear about</div>{LEARN.map(([t, d]) => <div className="li" key={t}><b>{t}</b><span>{d}</span></div>)}</div></div>
        <div className="sv-st"><div className="n">3</div><div><div className="tg">Finish it and unlock, free</div><div className="tt">Three things that cost you nothing</div><div className="ck">{PERKS.map((p) => <div key={p}>✓ {p}</div>)}</div></div></div>
      </div></section>}
      <main className="sv-main">

          {done ? (
            <div style={{ marginTop:30 }}>
              <hr className="sv-rule"/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,200px),1fr))", gap:12, marginTop:22 }}>
                {who === "investor" && <a href={`/review?ref=${encodeURIComponent(refCode)}`} className="sv-btn" style={btnLink}>See your dead money</a>}
                {agent && agent.phone && <a href={`tel:${String(agent.phone).replace(/\D/g, "")}`} className="sv-btn" style={btnLink}>Call {agent.name.split(" ")[0]}</a>}
                <a href={BRAND.booking} target="_blank" rel="noreferrer" className="sv-btn" style={{ ...btnLink, ...(who === "investor" ? { background:"transparent", color:C.ink, border:`2px solid ${C.ink}` } : {}) }}>Book a call with me</a>
                <a href={`tel:${BRAND.phone.replace(/\D/g, "")}`} className="sv-btn" style={{ ...btnLink, background:"transparent", color:C.ink, border:`2px solid ${C.ink}` }}>Call me</a>
              </div>
            </div>
          ) : (<>
            <hr className="sv-rule"/>
            <div ref={top} style={{ scrollMarginTop:16 }}/>

            {!flow && <>
              <div className="sv-lab" style={{ marginTop:22 }}>What brings you here?</div>
              <div style={{ marginTop:6 }}>{WHO.map((w) => (
                <button key={w.id} type="button" className="sv-choice" onClick={() => pick(w.id)}>
                  <span><span className="t">{w.label}</span><span className="s">{w.sub}</span></span><span className="dot"/>
                </button>))}</div>
              <div style={{ marginTop:44 }}>
                <div className="sv-k">Why me</div>
                <h2 className="sv-q" style={{ margin:"12px 0 0" }}>Buyers leave $65 billion<br/><i style={{ fontStyle:"normal", color:C.red }}>a year on the table.</i></h2>
                <Ledger rows={WHY}/>
                <p style={{ font:`600 18px/1.4 ${SERIF}`, margin:"14px 0 0" }}>One bank gives you a price. I give you options.</p>
              </div>
            </>}

            {flow && q && <div style={{ marginTop:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div className="sv-lab">{agent ? "Your plan" : flow.label} · {step + 1} of {flow.qs.length + 1}</div>
                <button type="button" onClick={() => (step === 0 ? (lockWho ? null : setWho("")) : go(step - 1))} style={{ all:"unset", cursor:"pointer", font:`italic 400 15px ${SERIF}`, color:C.mute }}>← Back</button>
              </div>
              <div style={{ height:3, background:C.soft, marginTop:10 }}><div style={{ height:3, width:`${((step + 1) / (flow.qs.length + 1)) * 100}%`, background:C.red }}/></div>
              {who === "buyer" && !sellOnly && <Perks title="Answer these and unlock"/>}
              <h2 className="sv-q" style={{ margin:"22px 0 0" }}>{q.q}</h2>
              {q.sub && <p className="sv-sub" style={{ marginTop:8 }}>{q.sub}</p>}
              {q.opts ? <div style={{ marginTop:10 }}>{q.opts.map((o) => (
                <button key={o} type="button" className={"sv-choice" + (a[q.id] === o ? " on" : "")} onClick={() => answer(q, o)}><span className="t" style={{ fontSize:22 }}>{o}</span><span className="dot"/></button>))}</div>
              : <form onSubmit={(e) => { e.preventDefault(); if (a[q.id]) go(step + 1); }} style={{ marginTop:18 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                    {q.money && <span style={{ font:`500 30px ${SERIF}` }}>$</span>}
                    <input className="sv-in" autoFocus inputMode={q.money ? "numeric" : "text"} placeholder={q.ph} style={{ fontSize:26 }}
                      value={a[q.id] || ""} onChange={(e) => setA({ ...a, [q.id]: q.money ? money(e.target.value) : e.target.value })}/>
                  </div>
                  <button className="sv-btn" type="submit" disabled={!a[q.id]} style={{ marginTop:20 }}>Continue</button>

                </form>}
            </div>}

            {flow && inContact && <form onSubmit={submit} noValidate style={{ marginTop:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div className="sv-lab">{agent ? "Your plan" : flow.label} · {flow.qs.length + 1} of {flow.qs.length + 1}</div>
                <button type="button" onClick={() => go(step - 1)} style={{ all:"unset", cursor:"pointer", font:`italic 400 15px ${SERIF}`, color:C.mute }}>← Back</button>
              </div>
              <div style={{ height:3, background:C.red, marginTop:10 }}/>
              <h2 className="sv-q" style={{ margin:"22px 0 0" }}>
                {wantsClass ? <>Join the wait list.<br/><i style={{ fontStyle:"normal", color:C.red }}>I'll send the class the day it's live.</i></>
                  : who === "homeowner" ? <>Where's the home?<br/><i style={{ fontStyle:"normal", color:C.red }}>I'll run the deep review by hand.</i></>
                  : who === "investor" ? <>Where do I send your review?<br/><i style={{ fontStyle:"normal", color:C.red }}>Then we'll find the dead money.</i></>
                  : who === "agent" ? <>Join the lead wait list.<br/><i style={{ fontStyle:"normal", color:C.red }}>I'll reach out when buyers are ready.</i></>
                  : <>Where do I reach you?<br/><i style={{ fontStyle:"normal", color:C.red }}>I'll tell you what I'd do.</i></>}
              </h2>
              {flow.handoff && <p className="sv-sub" style={{ marginTop:10 }}>{flow.handoff}</p>}
              {wantsClass && !sellOnly && <Perks title="Joining the wait list unlocks"/>}
              <div className="sv-fields" style={{ marginTop:18 }}>
                <label className="sv-f"><span>First name</span><input className="sv-in" value={f.first} onChange={set("first")} autoComplete="given-name"/></label>
                <label className="sv-f"><span>Last name</span><input className="sv-in" value={f.last} onChange={set("last")} autoComplete="family-name"/></label>
                <label className="sv-f"><span>Email</span><input className="sv-in" type="email" value={f.email} onChange={set("email")} autoComplete="email"/></label>
                <label className="sv-f"><span>Phone</span><input className="sv-in" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel"/></label>
                {who === "homeowner" && <label className="sv-f" style={{ gridColumn:"1/-1" }}><span>Home address</span><input className="sv-in" value={f.address} onChange={set("address")} autoComplete="street-address"/></label>}
                <label className="sv-f"><span>City or area</span><input className="sv-in" value={f.city} onChange={set("city")} autoComplete="address-level2"/></label>
                <label className="sv-f"><span>State {who === "agent" && <em>optional</em>}</span>
                  <select className="sv-in" value={f.state} onChange={set("state")}><option value="">Select…</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label className="sv-f"><span>Zip <em>optional</em></span><input className="sv-in" value={f.zip} onChange={set("zip")} inputMode="numeric" maxLength={5} autoComplete="postal-code"/></label>
                {who === "agent" && <label className="sv-f" style={{ gridColumn:"1/-1" }}><span>Where should I send leads? <em>email, text or your CRM</em></span><input className="sv-in" value={f.sendTo} onChange={set("sendTo")}/></label>}
                <label className="sv-f" style={{ gridColumn:"1/-1" }}><span>Anything else I should know? <em>optional</em></span><textarea className="sv-in" rows={2} value={f.note} onChange={set("note")} style={{ resize:"vertical" }}/></label>
              </div>
              <label style={{ display:"flex", gap:10, alignItems:"flex-start", margin:"22px 0 10px" }} className="sv-fine">
                <input type="checkbox" checked={f.consent} onChange={set("consent")} style={{ marginTop:2, width:18, height:18, accentColor:C.red, flex:"none" }}/>
                <span>I agree that Graham Financial, powered by Zero Point Mortgage Services, may contact me by phone, text or email at the information above{agent ? `, as may ${agent.name}${agent.brokerage ? " of " + agent.brokerage : ""}` : ""}, including by automated means. Consent is not a condition of any purchase or loan. Message and data rates may apply.</span>
              </label>
              <p style={{ font:`600 16px/1.45 ${SERIF}`, margin:"4px 0 16px" }}>{agent ? `You will not be spammed. You'll only hear from ${agent.name} and me, Joshua Graham, real live people. It's not a sales call.` : "You will not be spammed. You'll only hear from me, Joshua Graham, a real live person. It's not a sales call."}</p>
              {err && <p style={{ color:C.red, font:`600 14px ${SANS}`, margin:"0 0 12px" }}>{err}</p>}
              <button className="sv-btn" type="submit" disabled={busy}>{busy ? "Saving…" : wantsClass ? "Join the wait list" : who === "agent" ? "Join the wait list" : "Send it to Joshua"}</button>
            </form>}
          </>)}

          <p className="sv-fine" style={{ marginTop:44 }}>{agent ? `Real estate services provided by ${agent.name}${agent.brokerage ? ", " + agent.brokerage : ""}. ` : ""}Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. Source: Bankrate research, July 2026, based on 2025 mortgage data: about $65 billion a year in mortgage overpayments nationwide; about $3,300 is the national average per borrower per year. Your own savings will vary. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.</p>
        </main>
    </div>
  );
}
