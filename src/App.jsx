import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { supabase } from "./supabase.js";

const C = {
  bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc",
  green:"#1e6e4a", greenBg:"#e8f4ee", greenBd:"#b8dece",
  amber:"#b05e0d", amberBg:"#fdf0e0", amberBd:"#ecd4a8",
  red:"#9e3020", redBg:"#fbeae7", redBd:"#ecc4bc",
  blue:"#1a4f8a", blueBg:"#e6eef9", blueBd:"#b8d0ec",
  purple:"#5b3fa6", purpleBg:"#eeebf8", purpleBd:"#c8c0ec",
  teal:"#1a6570", tealBg:"#e4f2f4", tealBd:"#a8d8de",
  stone:"#8a8077", stoneBg:"#f0ece5", stoneBd:"#d4cec6",
  olive:"#7a6a1e", oliveBg:"#f8f4e3", oliveBd:"#dcd890",
};
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const todayKey = () => new Date().toISOString().slice(0,10);
const toMins = (h,m=0) => h*60+m;
const fmt = (mins) => {
  const h=Math.floor(mins/60)%24, m=mins%60, ap=h>=12?"PM":"AM", h12=h>12?h-12:h===0?12:h;
  return `${h12}:${String(m).padStart(2,"0")} ${ap}`;
};
const parse12 = (h,m,ap) => {
  let hh=parseInt(h);
  if(ap==="PM"&&hh!==12) hh+=12;
  if(ap==="AM"&&hh===12) hh=0;
  return toMins(hh,parseInt(m)||0);
};

const DM = {none:0,light:40,medium:70,heavy:100};
const BS = {
  buffer:{bar:"#d4cec6",bg:"#f0ece5",bd:"#d4cec6",lbl:"#8a8077",tag:{bg:"#e8e2da",txt:"#8a8077"}},
  warmup:{bar:"#1a4f8a",bg:"#e6eef9",bd:"#b8d0ec",lbl:"#1a4f8a",tag:{bg:"#ccdff5",txt:"#1a4f8a"}},
  deals:{bar:"#b05e0d",bg:"#fdf0e0",bd:"#ecd4a8",lbl:"#b05e0d",tag:{bg:"#f5e0bc",txt:"#b05e0d"}},
  calls:{bar:"#1e6e4a",bg:"#e8f4ee",bd:"#b8dece",lbl:"#1e6e4a",tag:{bg:"#c4e8d4",txt:"#1e6e4a"}},
  reactive:{bar:"#9e3020",bg:"#fbeae7",bd:"#ecc4bc",lbl:"#9e3020",tag:{bg:"#f0ccbc",txt:"#9e3020"}},
  break:{bar:"#d4cec6",bg:"#f0ece5",bd:"#d4cec6",lbl:"#8a8077",tag:{bg:"#e8e2da",txt:"#8a8077"}},
  study:{bar:"#5b3fa6",bg:"#eeebf8",bd:"#c8c0ec",lbl:"#5b3fa6",tag:{bg:"#d4ccec",txt:"#5b3fa6"}},
  meeting:{bar:"#7a6a1e",bg:"#f8f4e3",bd:"#dcd890",lbl:"#7a6a1e",tag:{bg:"#ece8bc",txt:"#7a6a1e"},dashed:true},
  dealwork:{bar:"#1a6570",bg:"#e4f2f4",bd:"#a8d8de",lbl:"#1a6570",tag:{bg:"#c4e8ec",txt:"#1a6570"}},
};
const SM = {
  buffer:null, deals:"Morning", warmup:"Morning",
  calls1a:"Morning", calls1:"Morning", meeting:"Morning", calls1b:"Morning",
  calls1c:"Morning", meeting2:"Morning", calls1d:"Morning",
  lunch:"Midday", react1:"Midday",
  dealwork:"Afternoon", calls2:"Afternoon", react2:"Afternoon",
  calls3:"Evening", study:"Evening", close:"Evening",
};

function buildSched({startHour,mode,hasMeeting,meetingMins,meetingDurMins,meeting2Mins,meeting2DurMins,lunchMins,hardStopMins,dealLoad}) {
  const bufStart=toMins(startHour), dayStart=bufStart+30;
  let cur=dayStart;
  const blocks=[], warnings=[];
  const push=(b)=>{ const bl={...b,start:cur,end:cur+b.dur}; blocks.push(bl); cur+=b.dur; };
  blocks.push({id:"buffer",label:"Arrival Buffer",tag:"Optional",type:"buffer",start:bufStart,end:dayStart,dur:30,scoreLabel:null,desc:"30-min buffer built in."});
  const dd=mode==="on"?60:90;
  if(hasMeeting&&meetingMins!==null) {
    const tb=meetingDurMins>=60?20:10;
    const dealEnd=dayStart+dd, warmupEnd=dealEnd+15;
    if(meetingMins<=dayStart) {
      cur=meetingMins;
      push({id:"meeting",label:"In-Person Meeting",tag:"Scheduled",type:"meeting",dur:meetingDurMins+tb,scoreLabel:"Meeting completed",desc:`Meeting at ${fmt(meetingMins)} + ${tb} min travel buffer.`});
      push({id:"warmup",label:"Warm-Up Call \xb7 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Warm-up call after re-entry. Now into phone mode."});
      push({id:"deals",label:`Deal Pipeline Review \xb7 ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:"Post-meeting deal review."});
    } else if(meetingMins<warmupEnd) {
      const space=meetingMins-dayStart;
      if(space>=30) {
        const compDeal=space-15;
        push({id:"deals",label:`Deal Pipeline Review \xb7 ${compDeal} min`,tag:"Compressed",type:"deals",dur:compDeal,scoreLabel:"Deal pipeline reviewed",desc:`Compressed to fit your ${fmt(meetingMins)} meeting. Triage only.`});
        push({id:"warmup",label:"Warm-Up Call \xb7 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Quick warm call right before your meeting."});
      } else if(space>=15) {
        push({id:"warmup",label:"Warm-Up Call \xb7 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Warm-up call before meeting. Deal review moves to after."});
      }
      cur=meetingMins;
      push({id:"meeting",label:"In-Person Meeting",tag:"Scheduled",type:"meeting",dur:meetingDurMins+tb,scoreLabel:"Meeting completed",desc:`Meeting at ${fmt(meetingMins)} + ${tb} min travel buffer.`});
      if(!blocks.find(b=>b.id==="deals")) {
        push({id:"deals",label:`Deal Pipeline Review \xb7 ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:"Post-meeting deal review."});
      }
    } else {
      push({id:"deals",label:`Deal Pipeline Review \xb7 ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:mode==="on"?"8-10 min per deal. One action, move.":"10-15 min per deal, soonest close first."});
      push({id:"warmup",label:"Warm-Up Call \xb7 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Easiest warm call in your list. Bridges desk work into phone mode."});
      const gap=meetingMins-cur;
      if(gap>=20) push({id:"calls1a",label:`Calls \xb7 ${gap} min`,tag:"Pre-Meeting",type:"calls",dur:gap,scoreLabel:"Pre-meeting calls logged",desc:"Dial window before meeting."});
      else cur=meetingMins;
      push({id:"meeting",label:"In-Person Meeting",tag:"Scheduled",type:"meeting",dur:meetingDurMins+tb,scoreLabel:"Meeting completed",desc:`Meeting at ${fmt(meetingMins)} + ${tb} min travel buffer.`});
    }
    push({id:"calls1b",label:"Calls \xb7 45 min",tag:"Post-Meeting",type:"calls",dur:45,scoreLabel:"Post-meeting calls logged",desc:"Resume outbound after re-entry."});
    if(meeting2Mins) {
      const tb2=(meeting2DurMins||60)>=60?20:10;
      if(meeting2Mins>cur) {
        const gap=meeting2Mins-cur;
        if(gap>=20) push({id:"calls1c",label:`Calls \xb7 ${gap} min`,tag:"Pre-Meeting 2",type:"calls",dur:gap,scoreLabel:null,desc:"Calling window before second meeting."});
        else cur=meeting2Mins;
      }
      push({id:"meeting2",label:"2nd In-Person Meeting",tag:"Scheduled",type:"meeting",dur:(meeting2DurMins||60)+tb2,scoreLabel:"2nd meeting completed",desc:`Second meeting + ${tb2} min travel buffer.`});
      push({id:"calls1d",label:"Calls \xb7 30 min",tag:"Post-Meeting 2",type:"calls",dur:30,scoreLabel:null,desc:"Back to outbound after second meeting."});
    }
  } else {
    push({id:"deals",label:`Deal Pipeline Review \xb7 ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:mode==="on"?"8-10 min per deal. One action, move.":"10-15 min per deal, soonest close first."});
    push({id:"warmup",label:"Warm-Up Call \xb7 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Easiest warm call in your list. Bridges desk work into phone mode."});
    const cb1=mode==="on"?90:75;
    push({id:"calls1",label:`Prospecting Calls — Block 1 \xb7 ${cb1} min`,tag:mode==="on"?"Primary":"Non-Neg Targets",type:"calls",dur:cb1,scoreLabel:"Call Block 1 hit",desc:"Agent outreach, buyer follow-up, referral touches."});
  }
  push({id:"lunch",label:`Lunch \xb7 ${lunchMins} min`,tag:"Screen Closed",type:"break",dur:lunchMins,scoreLabel:null,desc:"Laptop closed. Actual food."});
  push({id:"react1",label:"Reactivity Window #1 \xb7 45 min",tag:"Email Unlocked",type:"reactive",dur:45,scoreLabel:null,desc:"First email open. Triage inbox."});
  const dbMins=DM[dealLoad]||0, cb2=Math.max(20,120-dbMins);
  if(dbMins>0) {
    const lbls={light:"Deal Build \xb7 40 min",medium:"Deal Build \xb7 70 min",heavy:"Deal Build \xb7 100 min"};
    push({id:"dealwork",label:lbls[dealLoad],tag:"Protected",type:"dealwork",dur:dbMins,scoreLabel:"Deal build done",desc:"One file at a time. No calls, no email."});
  }
  push({id:"calls2",label:`Prospecting Calls — Block 2 \xb7 ${cb2} min`,tag:dbMins>0?"Compressed":"Heaviest",type:"calls",dur:cb2,scoreLabel:"Call Block 2 hit",desc:"Heaviest call block."});
  push({id:"react2",label:"Reactivity Window #2 \xb7 45 min",tag:"Email Unlocked",type:"reactive",dur:45,scoreLabel:null,desc:"Second and final email open."});
  push({id:"calls3",label:"Evening Call Block \xb7 60 min",tag:"W-2 Window",type:"calls",dur:60,scoreLabel:"Evening calls done",desc:"Peak window for W-2 buyers."});
  push({id:"study",label:mode==="on"?"System Building \xb7 30 min":"Training & Development \xb7 30 min",tag:"Get Unlocked",type:"study",dur:30,scoreLabel:mode==="on"?"System output done":"Training done",desc:mode==="on"?"Build a system, write a post, document a process. Also your window to watch Get Unlocked training videos, work on outbound call approach, or develop IOI content.":"Watch a Get Unlocked training video, work on outbound call scripts, review loan products, or develop your prospecting approach. One topic. Write one insight down."});
  push({id:"close",label:"Day Close \xb7 15 min",tag:"",type:"buffer",dur:15,scoreLabel:"Scorecard logged",desc:"Log scorecard. Send daily report. Done."});
  if(hardStopMins&&cur>hardStopMins) {
    const drop=["study","calls3","react2","calls2","dealwork","react1"], dropped=[];
    for(const id of drop) {
      if(cur<=hardStopMins) break;
      const idx=blocks.findIndex(b=>b.id===id);
      if(idx!==-1) {
        dropped.push(blocks[idx].label); cur-=blocks[idx].dur; blocks.splice(idx,1);
        if(blocks.length>0) {
          let s=blocks[0].end; for(let i=1;i<blocks.length;i++){ blocks[i].start=s; blocks[i].end=s+blocks[i].dur; s=blocks[i].end; }
          cur=blocks[blocks.length-1].end;
        }
      }
    }
    if(dropped.length) warnings.push(`Hard stop: removed ${dropped.join(", ")}.`);
  }
  return {blocks,warnings,endTime:cur};
}

const PRIMARY = {id:"conversations",label:"Phone Conversations (2+ min)",goal:5,sub:"The money metric. Everything else exists to create this."};
const APPS_ACT = {id:"apps",label:"Applications Taken",goal:1,sub:"Direct outcome of conversations"};
const ACTS = [
  {id:"database",   label:"Database / Reconnect Outreach", goal:10, sub:"Past clients, sphere — calls, texts, reach-outs",           section:"feed"},
  {id:"realtor",    label:"Realtor Outreach",               goal:5,  sub:"Agent calls, texts, value-drops",                           section:"feed"},
  {id:"socialPost", label:"IOI Post Published",             goal:1,  sub:"Facebook or Instagram — curiosity, no offer",               section:"feed"},
  {id:"dms",        label:"DMs Sent",                       goal:5,  sub:"Follow-up DMs to post engagers",                            section:"feed"},
  {id:"linkedin",   label:"LinkedIn Agent Adds",            goal:20, sub:"Connect with 20 agents daily",                             section:"feed", special:"linkedin"},
  {id:"notes",      label:"Handwritten Notes Mailed",       goal:3,  sub:"One per phone call — highest open rate",                    section:"feed"},
  {id:"preapprovals",label:"Pre-Approvals Issued",          goal:0,  sub:"Issued today",                                              section:"outcome"},
  {id:"closings",   label:"Closings",                       goal:0,  sub:"Files funded today",                                       section:"outcome"},
];

const btnP = {padding:"13px 24px",borderRadius:7,border:`1.5px solid ${C.green}`,background:C.green,color:"#fff",fontFamily:F.cond,fontSize:15,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",width:"100%"};
const btnS = {padding:"13px 24px",borderRadius:7,border:`1.5px solid ${C.rule}`,background:C.card,color:C.mid,fontFamily:F.cond,fontSize:15,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"};

function Label({ children, color = C.light }) {
  return <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color,marginBottom:8}}>{children}</div>;
}
function Chip({ children, selected, onClick, color = C.green }) {
  return <button onClick={onClick} style={{padding:"9px 14px",borderRadius:6,border:`1.5px solid ${selected?color:C.rule}`,background:selected?color:C.card,color:selected?"#fff":C.mid,fontFamily:F.mono,fontSize:11,cursor:"pointer"}}>{children}</button>;
}
function TSel({ value, onChange }) {
  const [h,m,ap] = value;
  const ss = {padding:"8px",borderRadius:5,border:`1px solid ${C.rule}`,background:C.card,color:C.ink,fontFamily:F.mono,fontSize:12,cursor:"pointer",outline:"none"};
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <select value={h} onChange={e=>onChange([e.target.value,m,ap])} style={ss}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(v=><option key={v}>{v}</option>)}</select>
      <span style={{color:C.light,fontWeight:700}}>:</span>
      <select value={m} onChange={e=>onChange([h,e.target.value,ap])} style={ss}>{["00","15","30","45"].map(v=><option key={v}>{v}</option>)}</select>
      <select value={ap} onChange={e=>onChange([h,m,e.target.value])} style={ss}>{["AM","PM"].map(v=><option key={v}>{v}</option>)}</select>
    </div>
  );
}
function BlockRow({ block, checked, onCheck }) {
  const s = BS[block.type] || BS.buffer;
  const [open, setOpen] = useState(false);
  return (
    <div style={{display:"grid",gridTemplateColumns:"80px 4px 1fr",gap:"0 10px",alignItems:"stretch",marginBottom:3}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",paddingTop:11}}>
        <span style={{fontFamily:F.mono,fontSize:11,fontWeight:500,color:C.ink}}>{fmt(block.start)}</span>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.light,marginTop:2}}>→ {fmt(block.end)}</span>
      </div>
      <div style={{background:s.bar,borderRadius:3,alignSelf:"stretch",minHeight:44}} />
      <div onClick={()=>setOpen(o=>!o)} style={{background:s.bg,border:`1px ${s.dashed?"dashed":"solid"} ${s.bd}`,borderRadius:6,padding:"9px 12px",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontFamily:F.cond,fontSize:13,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",color:s.lbl}}>{block.label}</span>
              {block.tag && <span style={{fontFamily:F.mono,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",padding:"2px 5px",borderRadius:3,background:s.tag.bg,color:s.tag.txt,whiteSpace:"nowrap"}}>{block.tag}</span>}
            </div>
            {!open && <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginTop:2}}>tap to expand</div>}
          </div>
          {block.scoreLabel && (
            <div onClick={e=>{e.stopPropagation();onCheck(block.id);}} style={{width:20,height:20,borderRadius:4,border:`2px solid ${checked?s.bar:C.rule}`,background:checked?s.bar:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}>
              {checked && <span style={{color:"#fff",fontSize:11,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
          )}
        </div>
        {open && <div style={{marginTop:8,fontFamily:F.body,fontSize:12,color:C.mid,lineHeight:1.6,borderTop:`1px solid ${s.bd}`,paddingTop:8}}>{block.desc}</div>}
      </div>
    </div>
  );
}
function ActRow({ act, val, onSet }) {
  const done = act.goal > 0 && val >= act.goal;
  const isLI = act.special === "linkedin";
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:10,background:done?C.greenBg:isLI?C.blueBg:C.card,border:`1px solid ${done?C.greenBd:isLI?C.blueBd:C.rule}`,borderRadius:8,padding:"11px 14px",marginBottom:5,transition:"all 0.15s"}}>
      <div>
        <div style={{fontFamily:F.cond,fontSize:13,fontWeight:700,letterSpacing:"0.03em",textTransform:"uppercase",color:done?C.green:isLI?C.blue:C.ink}}>{act.label}</div>
        <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginTop:2}}>{act.sub}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <button onClick={()=>onSet(Math.max(0,val-1))} style={{width:30,height:30,borderRadius:6,border:`1.5px solid ${C.rule}`,background:C.bg,color:C.mid,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <span style={{fontFamily:F.mono,fontSize:16,fontWeight:500,color:C.ink,minWidth:28,textAlign:"center"}}>{val}</span>
          <button onClick={()=>onSet(val+1)} style={{width:30,height:30,borderRadius:6,border:`1.5px solid ${C.rule}`,background:C.bg,color:C.mid,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>
        {act.goal > 0 && <span style={{fontFamily:F.mono,fontSize:10,color:C.light}}>/ {act.goal}</span>}
      </div>
    </div>
  );
}

const SCRIPTS_DATA = {
  reconnect: {
    label:"Database Reconnect", sub:"Past client or sphere", color:C.green,
    scenarios:[
      {label:"Number update opener", content:"Hey [name] — been a minute. Just updated my number and wanted to make sure you still had it.\n\n[If they respond] — How's everything going with the house?\n\n[Natural] — Are you or anyone you know thinking about buying, selling, or doing anything with real estate in the next little while?\n\nNOTES: Lead with the number update — nobody screens that. Don't pitch."},
      {label:"Rate / equity check-in", content:"Hey [name] — [your name] here. Quick question — do you remember what rate you locked in on your loan?\n\nI'm checking in with a few past clients whose situations have changed. Not a pitch — just a 5-minute numbers conversation.\n\nNOTES: You have their file. This is genuine value."},
    ]
  },
  agentStuck: {
    label:"Agent — Stuck Loan", sub:"Deal in trouble or fell apart", color:C.amber,
    scenarios:[
      {label:"Cold opener", content:"Hey [agent name] — [your name]. Heard you had a deal fall apart recently. That's brutal.\n\nQuick question — was it a lender problem or a borrower problem?\n\n[Lender] — That's my specialty. Complex files, self-employed income, VA loans, credit challenges — the stuff most lenders send back. What happened?\n\n[Borrower] — Is the buyer still motivated? There might be a path.\n\nNOTES: Don't pitch. Ask what happened. Let them vent."},
      {label:"Active deal in trouble", content:"Hey [agent name] — [your name]. I specialize in rescuing files that other lenders can't close.\n\nDo you have a file right now that's in trouble?\n\nBecause that's exactly what I do.\n\nNOTES: Be direct. You're offering a lifeline."},
    ]
  },
  agentNew: {
    label:"Agent — New Partner", sub:"Cold or warm outreach", color:C.blue,
    scenarios:[
      {label:"Cold outreach", content:"Hey [agent name] — [your name] here. I've been in Colorado mortgages 25 years. I specialize in the files most lenders won't touch.\n\nI'm looking for two or three agents who want a consistent pipeline of pre-qualified buyers sent their direction.\n\nAre you mostly working with buyers right now, or listings?\n\nNOTES: One question, then stop."},
      {label:"LinkedIn follow-up", content:"Hey [name] — thanks for connecting.\n\nI send pre-qualified buyers to agent partners. No leads to chase — just buyers who are ready.\n\nWorth a 10-minute call?\n\nNOTES: Short. Specific. One ask."},
    ]
  },
  va: {
    label:"VA Buyer", sub:"Veteran thinking about buying", color:C.purple,
    scenarios:[
      {label:"First-time benefit", content:"Hey [name] — [your name], I specialize in VA loans here in Colorado.\n\nHave you ever used your VA home loan benefit before?\n\n[No] — Most veterans don't realize what they have. Zero down, no PMI, competitive rates. What's been holding you back from buying?\n\nNOTES: Ask what's in the way. Usually it's the down payment myth."},
      {label:"Re-use benefit", content:"Hey [name] — quick question — did you use your VA benefit on your current home?\n\n[Yes] — A lot of veterans don't realize the benefit can be used again. Takes me five minutes to look up what you've got available. Want me to pull that up?\n\nNOTES: Most vets think it's one-time. Busting that myth is genuine value."},
    ]
  },
};
function ScriptsTab() {
  const [active, setActive] = useState("reconnect");
  const [scenario, setScenario] = useState(0);
  const [copied, setCopied] = useState(false);
  const s = SCRIPTS_DATA[active];
  const sc = s.scenarios[scenario] || s.scenarios[0];
  return (
    <div>
      <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:14,fontStyle:"italic",lineHeight:1.5}}>Pick your scenario. Read it once. Put the phone down and talk like a human.</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {Object.entries(SCRIPTS_DATA).map(([id,sc2]) => (
          <button key={id} onClick={()=>{setActive(id);setScenario(0);setCopied(false);}} style={{padding:"8px 10px",borderRadius:6,border:`1.5px solid ${active===id?sc2.color:C.rule}`,background:active===id?sc2.color:C.card,color:active===id?"#fff":C.mid,fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>{sc2.label}</button>
        ))}
      </div>
      {s.scenarios.length > 1 && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {s.scenarios.map((sc2,i) => (
            <button key={i} onClick={()=>{setScenario(i);setCopied(false);}} style={{padding:"5px 9px",borderRadius:5,border:`1px solid ${scenario===i?s.color:C.rule}`,background:scenario===i?s.color+"22":C.card,color:scenario===i?s.color:C.mid,fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>{sc2.label}</button>
          ))}
        </div>
      )}
      <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:16}}>
        <div style={{fontFamily:F.cond,fontSize:15,fontWeight:800,color:s.color,marginBottom:2}}>{s.label}</div>
        <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:12}}>{sc.label}</div>
        <pre style={{fontFamily:F.mono,fontSize:11,color:C.mid,lineHeight:1.75,whiteSpace:"pre-wrap",background:C.bg,borderRadius:6,padding:12,border:`1px solid ${C.rule}`,marginBottom:12}}>{sc.content}</pre>
        <button onClick={()=>navigator.clipboard.writeText(sc.content).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})} style={{...btnP,background:copied?C.green:C.blue,borderColor:copied?C.green:C.blue}}>{copied?"Copied":"Copy Script"}</button>
      </div>
    </div>
  );
}

const IOI_DATA = {
  buyers: {
    label:"Buyers", color:C.green,
    items:[
      {title:"The Waiting Trap", content:"She called me last week and said she was going to wait another two years to buy.\n\nI asked her one question.\n\nShe called me back the next day ready to go.\n\nWhat's the one thing that keeps people from buying when they're actually ready?\n\n(It's not what you think.)"},
      {title:"The Payment Surprise", content:"Couple in [city]. Combined income $95K. Paying $2,200 in rent.\n\nThey thought buying was years away.\n\nIt wasn't.\n\nTheir mortgage payment ended up being less than their rent.\n\nHow many people are renting right now and don't know this?"},
      {title:"The 20% Myth", content:"Most people think they need 20% down to buy a house.\n\nThat number hasn't been required for decades.\n\nThere are programs in Colorado right now that require less than you probably spend on groceries in a month.\n\nAre you one of the people waiting on 20%?"},
    ]
  },
  agents: {
    label:"Agents", color:C.amber,
    items:[
      {title:"47 Days", content:"Agent called me Friday afternoon. Deal was supposed to close Monday.\n\nTheir lender had been \"working on it\" for 47 days.\n\nWe closed it in 9.\n\nWhat's a deal worth to an agent when it actually closes on time?"},
      {title:"71% Close Zero", content:"71% of real estate agents close zero deals in a year.\n\nThat's not a skill problem.\n\nThat's a pipeline problem.\n\nWhat would one pre-qualified buyer per month change for an agent who closed zero last year?"},
      {title:"The File Nobody Wants", content:"Self-employed. 1099 income. Just changed jobs. Credit not perfect.\n\nMost lenders see that and send them away.\n\nI see that and call them back.\n\nDo you have buyers who got turned down somewhere else?"},
    ]
  },
  homeowners: {
    label:"Homeowners", color:C.blue,
    items:[
      {title:"The Rate Trap", content:"Woman called me last week. 2.75% mortgage.\n\nAlso paying $1,100/month in credit card interest.\n\nShe thought protecting her rate was the smart move.\n\nI showed her the math.\n\nAre you protecting a low rate while losing more somewhere else every month?"},
      {title:"Sitting On It", content:"Colorado home values are significantly higher than they were a few years ago.\n\nMost homeowners have no idea how much equity they're sitting on.\n\nThat equity is either working for you or it's just sitting there.\n\nDo you know what your home is worth today?"},
    ]
  },
};
function IOITab() {
  const [active, setActive] = useState("buyers");
  const [post, setPost] = useState(0);
  const [copied, setCopied] = useState(false);
  const p = IOI_DATA[active];
  const item = p.items[post] || p.items[0];
  return (
    <div>
      <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:14,fontStyle:"italic",lineHeight:1.5}}>No offer, no pitch, no yes/no choice. Curiosity, emotion, self-interest only.</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {Object.entries(IOI_DATA).map(([id,ps]) => (
          <button key={id} onClick={()=>{setActive(id);setPost(0);setCopied(false);}} style={{padding:"8px 10px",borderRadius:6,border:`1.5px solid ${active===id?ps.color:C.rule}`,background:active===id?ps.color:C.card,color:active===id?"#fff":C.mid,fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>{ps.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {p.items.map((it,i) => (
          <button key={i} onClick={()=>{setPost(i);setCopied(false);}} style={{padding:"5px 9px",borderRadius:5,border:`1px solid ${post===i?p.color:C.rule}`,background:post===i?p.color+"22":C.card,color:post===i?p.color:C.mid,fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>{it.title}</button>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:16}}>
        <div style={{fontFamily:F.cond,fontSize:15,fontWeight:800,color:p.color,marginBottom:12}}>{item.title}</div>
        <pre style={{fontFamily:F.mono,fontSize:11,color:C.mid,lineHeight:1.8,whiteSpace:"pre-wrap",background:C.bg,borderRadius:6,padding:12,border:`1px solid ${C.rule}`,marginBottom:12}}>{item.content}</pre>
        <button onClick={()=>navigator.clipboard.writeText(item.content).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})} style={{...btnP,background:copied?C.green:C.blue,borderColor:copied?C.green:C.blue}}>{copied?"Copied":"Copy Post"}</button>
      </div>
    </div>
  );
}

// CSV/TSV header → DB column mapping (supports legacy exports)
const HEADER_MAP = {
  "First Name":"first_name","Last Name":"last_name","Phone":"phone","Phone 2":"phone_2",
  "Email":"email","Email 2":"email_2","Address":"address","City":"city","State":"state","Zip":"zip",
  "Co-Borrower First":"co_borrower_first","Co-Borrower Last":"co_borrower_last",
  "Co-Borrower Phone":"co_borrower_phone","Co-Borrower Email":"co_borrower_email",
  "Source Category":"source_category","Source File":"source_file","Birthday":"birthday",
  "Loan Amount":"loan_amount","Note Rate":"note_rate","Appraised Value":"appraised_value",
  "Property Address":"property_address","Property City":"property_city",
  "Property State":"property_state","Property Zip":"property_zip",
  "Last Contacted":"last_contacted","Contact Note":"contact_note",
};

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authNewPassword, setAuthNewPassword] = useState("");
  const [authResetSent, setAuthResetSent] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const userRef = useRef(null);

  // ── Onboarding ───────────────────────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [obName, setObName] = useState("");
  const [obPartner, setObPartner] = useState("");
  const [obPartnerPhone, setObPartnerPhone] = useState("");
  const [obCommission, setObCommission] = useState("4000");
  const [obClosings, setObClosings] = useState("2");
  const [obSaving, setObSaving] = useState(false);

  // ── App state ─────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("today");
  const [profile, setProfile] = useState({name:"",partnerName:"",partnerPhone:"",avgCommission:4000,baselineClosings:2});
  const [sqStep, setSqStep] = useState(0);
  const [startHour, setStartHour] = useState(10);
  const [mode, setMode] = useState(null);
  const [hasMeeting, setHasMeeting] = useState(null);
  const [meetingTime, setMeetingTime] = useState(["11","00","AM"]);
  const [meetingDur, setMeetingDur] = useState(60);
  const [hasSecondMeeting, setHasSecondMeeting] = useState(null);
  const [meeting2Time, setMeeting2Time] = useState(["2","00","PM"]);
  const [meeting2Dur, setMeeting2Dur] = useState(60);
  const [lunchDur, setLunchDur] = useState(30);
  const [dealLoad, setDealLoad] = useState(null);
  const [hasHardStop, setHasHardStop] = useState(null);
  const [hardStopTime, setHardStopTime] = useState(["5","30","PM"]);
  const [sched, setSched] = useState(null);
  const [schedWarn, setSchedWarn] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [subTab, setSubTab] = useState("schedule");
  const [schedChecked, setSchedChecked] = useState({});
  const [rebuildOk, setRebuildOk] = useState(false);
  const [counts, setCounts] = useState({});
  const [pb, setPb] = useState(false);
  const [tomorrow, setTomorrow] = useState(["","",""]);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [ydayP, setYdayP] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [cFilter, setCFilter] = useState("all");
  const [cSearch, setCSearch] = useState("");
  const [selC, setSelC] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fRef = useRef();
  const [teamData, setTeamData] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loTabs, setLoTabs] = useState({});       // per-card Today/MTD/YTD tab
  const [loExpanded, setLoExpanded] = useState({}); // per-card expand/collapse

  // ── PWA install ───────────────────────────────────────────────────────────────
  const installPromptRef = useRef(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const today = todayKey();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  // ── Auth listener ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null;
      setUser(u); userRef.current = u;
      if (u) loadUserData(u.id); else setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null;
      setUser(u); userRef.current = u;
      if (event === "PASSWORD_RECOVERY") { setIsRecovering(true); setDataLoading(false); setAuthReady(true); return; }
      if (event === "SIGNED_IN") loadUserData(u.id);
      if (event === "SIGNED_OUT") { setAuthReady(true); setDataLoading(false); setIsRecovering(false); }
    });
    const handler = (e) => { e.preventDefault(); installPromptRef.current = e; };
    window.addEventListener("beforeinstallprompt", handler);
    return () => { subscription.unsubscribe(); window.removeEventListener("beforeinstallprompt", handler); };
  }, []);

  // ── Load all user data ────────────────────────────────────────────────────────
  async function loadUserData(userId) {
    setDataLoading(true);
    try {
      const { data: pData } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (pData) {
        setProfile({ name:pData.name||"", partnerName:pData.partner_name||"", partnerPhone:pData.partner_phone||"", avgCommission:pData.avg_commission||4000, baselineClosings:pData.baseline_closings||2 });
        setIsAdmin(pData.is_admin||false);
        setStreak(pData.streak||0);
        if (!pData.name) setShowOnboarding(true);
        if (!pData.install_dismissed) {
          if (installPromptRef.current) setShowInstallBanner(true);
          // also show banner on iOS where beforeinstallprompt doesn't fire
          const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
          if (isIOS && !navigator.standalone) setShowInstallBanner(true);
        }
      }
      // Yesterday's priorities
      const yd = new Date(); yd.setDate(yd.getDate()-1);
      const ydStr = yd.toISOString().slice(0,10);
      const { data: ydData } = await supabase.from("daily_logs").select("tomorrow").eq("user_id",userId).eq("date",ydStr).maybeSingle();
      if (ydData?.tomorrow) {
        const yp = Array.isArray(ydData.tomorrow) ? ydData.tomorrow.filter(p=>p&&p.trim()) : [];
        if (yp.length) setYdayP(yp);
      }
      // Today's log
      const { data: logData } = await supabase.from("daily_logs").select("*").eq("user_id",userId).eq("date",today).maybeSingle();
      if (logData) {
        setCounts(logData.counts||{});
        setPb(logData.pb||false);
        setTomorrow(Array.isArray(logData.tomorrow) ? logData.tomorrow : ["","",""]);
        if (logData.sched && logData.sched.blocks) {
          const { _checked, ...actualSched } = logData.sched;
          setSched(actualSched); setSchedWarn(actualSched.warnings||[]);
          setSchedChecked(_checked||{});
          if (logData.accepted) { setAccepted(true); setSubTab(logData.sub_tab||"scorecard"); }
        }
      }
      // History (past days)
      const { data: histData } = await supabase.from("daily_logs").select("date,counts,pb").eq("user_id",userId).neq("date",today).order("date",{ascending:false}).limit(90);
      if (histData) setHistory(histData);
      // Contacts
      const { data: ctData } = await supabase.from("contacts").select("*").eq("user_id",userId).order("last_name");
      if (ctData) setContacts(ctData);
    } catch(e) { console.error("loadUserData:",e); }
    finally { setDataLoading(false); setAuthReady(true); }
  }

  // ── Supabase save helpers ─────────────────────────────────────────────────────
  const saveTimer = useRef(null);
  function saveDailyLog(updates, immediate=false) {
    if (!userRef.current) return;
    const doSave = async () => {
      try {
        await supabase.from("daily_logs").upsert({ user_id:userRef.current.id, date:todayKey(), ...updates }, {onConflict:"user_id,date"});
      } catch(e) { console.error("saveDailyLog:",e); }
    };
    if (immediate) { doSave(); return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 500);
  }

  // ── Scoreboard callbacks ──────────────────────────────────────────────────────
  const setCount = useCallback((id, val) => {
    setCounts(prev => {
      const next = {...prev,[id]:Math.max(0,val)};
      if (userRef.current) supabase.from("daily_logs").upsert({user_id:userRef.current.id,date:todayKey(),counts:next},{onConflict:"user_id,date"}).then();
      return next;
    });
  }, []);

  const togglePB = useCallback(() => {
    setPb(prev => {
      const next = !prev;
      if (userRef.current) supabase.from("daily_logs").upsert({user_id:userRef.current.id,date:todayKey(),pb:next},{onConflict:"user_id,date"}).then();
      return next;
    });
  }, []);

  const toggleSchedCheck = useCallback((id) => {
    setSchedChecked(prev => { const next={...prev,[id]:!prev[id]}; return next; });
  }, []);

  // Save schedChecked into sched column whenever it changes
  useEffect(() => {
    if (!userRef.current || !sched) return;
    const t = setTimeout(() => {
      supabase.from("daily_logs").upsert({user_id:userRef.current.id,date:todayKey(),sched:{...sched,_checked:schedChecked}},{onConflict:"user_id,date"}).then();
    }, 400);
    return () => clearTimeout(t);
  }, [schedChecked]);

  async function loadTeamData() {
    if (!isAdmin) return;
    setTeamLoading(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("*").order("name");
      const { data: logs } = await supabase.from("daily_logs").select("user_id,date,counts,pb");
      const todayStr = todayKey();
      const monthStart = todayStr.slice(0,7) + "-01";
      const yearStart  = todayStr.slice(0,4) + "-01-01";
      const METRICS = ["conversations","apps","closings","preapprovals","database","realtor","ioi_posts","dms","linkedin","handwritten_notes"];
      const sumMetrics = (logsArr) => Object.fromEntries(METRICS.map(k => [k, logsArr.reduce((s,l) => s + (l.counts?.[k]||0), 0)]));
      const team = (profiles||[]).map(p => {
        const userLogs = (logs||[]).filter(l => l.user_id === p.id);
        const todayLog = userLogs.find(l => l.date === todayStr) || {};
        const mtd = sumMetrics(userLogs.filter(l => l.date >= monthStart));
        const ytd = sumMetrics(userLogs.filter(l => l.date >= yearStart));
        return { ...p, todayLog, mtd, ytd };
      });
      setTeamData(team);
    } finally {
      setTeamLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab==="team" && isAdmin) loadTeamData(); }, [tab, isAdmin]);

  const tomTimer = useRef(null);
  const setTom = useCallback((i, val) => {
    setTomorrow(prev => {
      const next = prev.map((v,j)=>j===i?val:v);
      clearTimeout(tomTimer.current);
      tomTimer.current = setTimeout(() => {
        if (userRef.current) supabase.from("daily_logs").upsert({user_id:userRef.current.id,date:todayKey(),tomorrow:next},{onConflict:"user_id,date"}).then();
      }, 800);
      return next;
    });
  }, []);

  // ── Schedule actions ──────────────────────────────────────────────────────────
  function buildAndSet() {
    const mm=hasMeeting?parse12(...meetingTime):null;
    const mm2=hasSecondMeeting?parse12(...meeting2Time):null;
    const hm=hasHardStop?parse12(...hardStopTime):null;
    const result=buildSched({startHour,mode,hasMeeting,meetingMins:mm,meetingDurMins:meetingDur,meeting2Mins:mm2,meeting2DurMins:meeting2Dur,lunchMins:lunchDur,hardStopMins:hm,dealLoad});
    setSched(result); setSchedWarn(result.warnings); setSchedChecked({});
    setAccepted(false); setSubTab("schedule");
    saveDailyLog({sched:result,accepted:false,sub_tab:"schedule"},true);
  }
  function acceptSched() { setAccepted(true); setSubTab("scorecard"); saveDailyLog({accepted:true,sub_tab:"scorecard"},true); }
  function switchSub(t) { setSubTab(t); saveDailyLog({sub_tab:t}); }
  function doRebuild() {
    setSqStep(0); setSched(null); setAccepted(false); setSubTab("schedule");
    setMode(null); setHasMeeting(null); setDealLoad(null); setHasHardStop(null);
    setHasSecondMeeting(null); setRebuildOk(false);
    saveDailyLog({sched:null,accepted:false,sub_tab:"schedule"},true);
  }

  // ── ICS Calendar export ───────────────────────────────────────────────────────
  function downloadICS() {
    if (!sched?.blocks) return;
    const d = today.replace(/-/g,"");
    const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Get Unlocked Producer//EN"];
    sched.blocks.filter(b=>b.type!=="buffer"&&b.type!=="break").forEach(b=>{
      const sh=String(Math.floor(b.start/60)).padStart(2,"0"), sm=String(b.start%60).padStart(2,"0");
      const eh=String(Math.floor(b.end/60)).padStart(2,"0"),   em=String(b.end%60).padStart(2,"0");
      lines.push("BEGIN:VEVENT",
        `UID:${b.id}-${today}@getunlocked`,
        `SUMMARY:${b.label}`,
        `DTSTART;TZID=America/Denver:${d}T${sh}${sm}00`,
        `DTEND;TZID=America/Denver:${d}T${eh}${em}00`,
        `DESCRIPTION:${(b.desc||b.tag||"").replace(/\n/g,"\\n")}`,
        "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")],{type:"text/calendar"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`GetUnlocked_${today}.ics`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── PWA install ───────────────────────────────────────────────────────────────
  async function dismissInstall() {
    setShowInstallBanner(false);
    if (userRef.current) await supabase.from("profiles").update({install_dismissed:true}).eq("id",userRef.current.id);
  }
  async function triggerInstall() {
    if (installPromptRef.current) {
      installPromptRef.current.prompt();
      const { outcome } = await installPromptRef.current.userChoice;
      installPromptRef.current = null;
      if (outcome==="accepted") dismissInstall();
    } else {
      alert("To install: tap the Share button in your browser, then tap 'Add to Home Screen'.");
    }
  }

  // ── Report / scorecard ────────────────────────────────────────────────────────
  const convos = counts.conversations||0;
  const dpc = profile.avgCommission ? Math.round(profile.avgCommission/20) : 0;
  const todayVal = convos*dpc;
  const allActs = [PRIMARY,APPS_ACT,...ACTS.filter(a=>a.goal>0)];
  const actsDone = allActs.filter(a=>(counts[a.id]||0)>=a.goal).length;
  const totalGoals = allActs.length+1;
  const totalDone = actsDone+(pb?1:0);
  const allDone = totalDone===totalGoals;
  const pct = Math.round((totalDone/totalGoals)*100);

  function genReport() {
    return [
      "Get Unlocked Producer — Daily Report",
      now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}),
      "",
      `PHONE CONVERSATIONS:    ${String(convos).padStart(2)} / 5  ${convos>=5?"✓":""}`,
      `Apps Taken:             ${String(counts.apps||0).padStart(2)} / 1  ${(counts.apps||0)>=1?"✓":""}`,
      "","--- Feeding Activities ---",
      `Database Outreach:      ${String(counts.database||0).padStart(2)} / 10  ${(counts.database||0)>=10?"✓":""}`,
      `Realtor Outreach:       ${String(counts.realtor||0).padStart(2)} / 5   ${(counts.realtor||0)>=5?"✓":""}`,
      `IOI Post:               ${String(counts.socialPost||0).padStart(2)} / 1   ${(counts.socialPost||0)>=1?"✓":""}`,
      `DMs Sent:               ${String(counts.dms||0).padStart(2)} / 5   ${(counts.dms||0)>=5?"✓":""}`,
      `LinkedIn Agent Adds:    ${String(counts.linkedin||0).padStart(2)} / 20  ${(counts.linkedin||0)>=20?"✓":""}`,
      `Handwritten Notes:      ${String(counts.notes||0).padStart(2)} / 3   ${(counts.notes||0)>=3?"✓":""}`,
      "",`Power Block:            ${pb?"Complete":"Incomplete"}`,
      "",`Call Value Today:       $${todayVal.toLocaleString()}`,
      "",`Day ${streak} — ${allDone?"Non-negotiables hit":`${totalDone}/${totalGoals} complete`}`,
    ].join("\n");
  }
  function copyReport() { navigator.clipboard.writeText(genReport()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);}); }

  const phoneOk = (v) => /^\d{3}-\d{3}-\d{4}$/.test((v||"").trim());
  function formatPhone(raw) {
    const d=raw.replace(/\D/g,"").slice(0,10);
    if(d.length<=3) return d; if(d.length<=6) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  }

  // ── Contacts helpers ──────────────────────────────────────────────────────────
  function parseCSVLine(line) {
    const result=[]; let cur="", inQ=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'&&!inQ){inQ=true;}
      else if(c==='"'&&inQ&&line[i+1]==='"'){cur+='"';i++;}
      else if(c==='"'&&inQ){inQ=false;}
      else if(c===','&&!inQ){result.push(cur);cur="";}
      else cur+=c;
    }
    result.push(cur); return result;
  }
  function parseFile(text, filename) {
    const isCSV=(filename||"").toLowerCase().endsWith(".csv");
    const sep=isCSV?",":"\t";
    const lines=text.trim().split("\n").map(l=>l.replace(/\r$/,""));
    const rawH=lines[0].split(sep).map(h=>h.trim().replace(/^"|"$/g,""));
    const headers=rawH.map(h=>HEADER_MAP[h]||(h.toLowerCase().replace(/\s+/g,"_")));
    return lines.slice(1).filter(l=>l.trim()).map(line=>{
      const vals=isCSV?parseCSVLine(line):line.split("\t");
      const obj={};
      headers.forEach((h,i)=>{ if(h) obj[h]=(vals[i]||"").trim().replace(/^"|"$/g,""); });
      return obj;
    });
  }
  async function handleFile(e) {
    const file=e.target.files[0]; if(!file||!userRef.current) return;
    const text=await file.text();
    const rows=parseFile(text,file.name).slice(0,5000);
    const batchSize=100, totalBatches=Math.ceil(rows.length/batchSize);
    setUploadProgress({current:0,total:totalBatches,done:false,errors:0});
    let errors=0;
    await supabase.from("contacts").delete().eq("user_id",userRef.current.id);
    for(let i=0;i<totalBatches;i++){
      const batch=rows.slice(i*batchSize,(i+1)*batchSize).map(r=>({...r,user_id:userRef.current.id}));
      const {error}=await supabase.from("contacts").insert(batch);
      if(error) errors++;
      setUploadProgress({current:i+1,total:totalBatches,done:false,errors});
    }
    const {data:ctData}=await supabase.from("contacts").select("*").eq("user_id",userRef.current.id).order("last_name");
    if(ctData) setContacts(ctData);
    setUploadProgress({current:totalBatches,total:totalBatches,done:true,errors});
    setTimeout(()=>setUploadProgress(null),3000);
    e.target.value="";
  }
  async function logC(c) {
    if(!userRef.current||!c.id) return;
    const {error}=await supabase.from("contacts").update({last_contacted:today}).eq("id",c.id);
    if(!error) setContacts(prev=>prev.map(ct=>ct.id===c.id?{...ct,last_contacted:today}:ct));
  }
  function cStatus(c) {
    const d=c.last_contacted; if(!d) return "never";
    const days=Math.round((new Date(today)-new Date(d))/86400000);
    if(isNaN(days)) return "never";
    return days<=30?"recent":days<=90?"warm":"cold";
  }
  function rFlag(c) { const r=parseFloat(c.note_rate); if(!r) return null; return r>=6.5?"high":r>=5.5?"mid":"low"; }
  const filtC=contacts.filter(c=>{
    const search=cSearch.toLowerCase(), name=`${c.first_name||""} ${c.last_name||""}`.toLowerCase();
    const ms=!search||name.includes(search)||(c.phone||"").includes(search);
    if(!ms) return false;
    if(cFilter==="never") return cStatus(c)==="never";
    if(cFilter==="cold") return cStatus(c)==="cold";
    if(cFilter==="highrate") return rFlag(c)==="high";
    return true;
  });
  const sColors={never:C.red,cold:C.amber,warm:C.mid,recent:C.green};
  const sLabels={never:"Never",cold:"90+ days",warm:"Warm",recent:"Recent"};

  // ── Chart ─────────────────────────────────────────────────────────────────────
  function buildChart() {
    const months={};
    history.forEach(e=>{const mo=e.date.slice(0,7);if(!months[mo])months[mo]={month:mo,closings:0};months[mo].closings+=e.counts?.closings||0;});
    return Object.values(months).sort((a,b)=>a.month.localeCompare(b.month)).map(m=>({...m,label:new Date(m.month+"-01").toLocaleDateString("en-US",{month:"short",year:"2-digit"})}));
  }
  const chartData=buildChart();
  const totDays=history.length;
  const compDays=history.filter(e=>ACTS.filter(a=>a.goal>0).every(a=>(e.counts?.[a.id]||0)>=a.goal)&&e.pb).length;
  const compRate=totDays>0?Math.round((compDays/totDays)*100):0;

  // ── Onboarding save ───────────────────────────────────────────────────────────
  async function saveOnboarding() {
    if(!obName.trim()||!userRef.current) return;
    setObSaving(true);
    try {
      await supabase.from("profiles").update({
        name:obName.trim(), partner_name:obPartner.trim(),
        partner_phone:obPartnerPhone.trim(), avg_commission:parseInt(obCommission)||4000,
        baseline_closings:parseInt(obClosings)||2,
      }).eq("id",userRef.current.id);
      setProfile({name:obName.trim(),partnerName:obPartner.trim(),partnerPhone:obPartnerPhone.trim(),avgCommission:parseInt(obCommission)||4000,baselineClosings:parseInt(obClosings)||2});
      setShowOnboarding(false);
    } catch(e){console.error(e);}
    finally{setObSaving(false);}
  }

  // ── Auth action ───────────────────────────────────────────────────────────────
  async function handleResetRequest() {
    setAuthLoading(true); setAuthError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: "https://getunlocked-producer.vercel.app" });
      if (error) throw error;
      setAuthResetSent(true);
    } catch(e) { setAuthError(e.message || "Failed to send reset email"); }
    finally { setAuthLoading(false); }
  }
  async function handleSetNewPassword() {
    if (authNewPassword.length < 6) { setAuthError("Password must be at least 6 characters"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: authNewPassword });
      if (error) throw error;
      setIsRecovering(false); setAuthNewPassword(""); setAuthError("");
      if (userRef.current) loadUserData(userRef.current.id);
    } catch(e) { setAuthError(e.message || "Failed to update password"); }
    finally { setAuthLoading(false); }
  }
  async function handleAuth() {
    setAuthLoading(true); setAuthError("");
    try {
      if(authMode==="signup") {
        const {error}=await supabase.auth.signUp({email:authEmail,password:authPassword});
        if(error) throw error;
      } else {
        const {error}=await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});
        if(error) throw error;
      }
    } catch(e) { setAuthError(e.message||"Authentication failed"); }
    finally { setAuthLoading(false); }
  }
  async function signOut() { await supabase.auth.signOut(); setContacts([]); setHistory([]); setProfile({name:"",partnerName:"",partnerPhone:"",avgCommission:4000,baselineClosings:2}); setIsAdmin(false); setCounts({}); setPb(false); setSched(null); setAccepted(false); setLoTabs({}); setLoExpanded({}); setIsRecovering(false); }


  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  // Loading spinner
  if (!authReady || dataLoading) {
    return (
      <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.mono,color:C.mid,fontSize:12}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>
        Loading...
      </div>
    );
  }

  // ── Recover screen (password reset link clicked) ─────────────────────────────
  if (isRecovering) {
    return (
      <div style={{background:C.bg,minHeight:"100vh",padding:"40px 20px",fontFamily:F.body}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>
        <div style={{maxWidth:400,margin:"0 auto"}}>
          <div style={{fontFamily:F.cond,fontSize:11,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,marginBottom:6}}>Get Unlocked Producer</div>
          <div style={{fontFamily:F.cond,fontSize:28,fontWeight:800,color:C.ink,marginBottom:28,lineHeight:1}}>
            SET <span style={{color:C.green}}>PASSWORD</span>
          </div>
          <div style={{background:C.card,borderRadius:10,border:`1px solid ${C.rule}`,padding:"24px 20px"}}>
            <Label>New Password</Label>
            <input type="password" placeholder="6+ characters" value={authNewPassword} onChange={e=>{setAuthNewPassword(e.target.value);setAuthError("");}}
              style={{width:"100%",padding:"12px 14px",borderRadius:7,border:`1px solid ${authError?C.red:C.rule}`,background:C.bg,fontFamily:F.body,fontSize:14,color:C.ink,outline:"none",marginBottom:authError?8:20,boxSizing:"border-box"}}/>
            {authError && <div style={{fontFamily:F.mono,fontSize:10,color:C.red,marginBottom:14}}>{authError}</div>}
            <button onClick={handleSetNewPassword} disabled={authLoading||authNewPassword.length<6}
              style={{...btnP,opacity:(authLoading||authNewPassword.length<6)?0.4:1}}>
              {authLoading?"...":"Set Password →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth screen ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{background:C.bg,minHeight:"100vh",padding:"40px 20px",fontFamily:F.body}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>
        <div style={{maxWidth:400,margin:"0 auto"}}>
          <div style={{fontFamily:F.cond,fontSize:11,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,marginBottom:6}}>Get Unlocked Producer</div>
          <div style={{fontFamily:F.cond,fontSize:28,fontWeight:800,color:C.ink,marginBottom:28,lineHeight:1}}>
            {authMode==="reset"?"FORGOT":(authMode==="signin"?"WELCOME":"CREATE")} <span style={{color:C.green}}>{authMode==="reset"?"PASSWORD":(authMode==="signin"?"BACK":"ACCOUNT")}</span>
          </div>
          <div style={{background:C.card,borderRadius:10,border:`1px solid ${C.rule}`,padding:"24px 20px"}}>
            {authMode==="reset" ? (
              authResetSent ? (
                <div>
                  <div style={{fontFamily:F.mono,fontSize:11,color:C.green,marginBottom:10}}>✓ Reset email sent!</div>
                  <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:20}}>Check your inbox and click the link to set a new password.</div>
                  <span onClick={()=>{setAuthMode("signin");setAuthResetSent(false);setAuthError("");}} style={{fontFamily:F.mono,fontSize:10,color:C.green,cursor:"pointer",textDecoration:"underline"}}>← Back to Sign In</span>
                </div>
              ) : (
                <div>
                  <Label>Email</Label>
                  <input type="email" placeholder="you@email.com" value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError("");}}
                    style={{width:"100%",padding:"12px 14px",borderRadius:7,border:`1px solid ${authError?C.red:C.rule}`,background:C.bg,fontFamily:F.body,fontSize:14,color:C.ink,outline:"none",marginBottom:authError?8:20,boxSizing:"border-box"}}/>
                  {authError && <div style={{fontFamily:F.mono,fontSize:10,color:C.red,marginBottom:14}}>{authError}</div>}
                  <button onClick={handleResetRequest} disabled={authLoading||!authEmail}
                    style={{...btnP,opacity:(authLoading||!authEmail)?0.4:1}}>
                    {authLoading?"...":"Send Reset Email →"}
                  </button>
                  <div style={{textAlign:"center",marginTop:16,fontFamily:F.mono,fontSize:10,color:C.light}}>
                    <span onClick={()=>{setAuthMode("signin");setAuthError("");}} style={{color:C.green,cursor:"pointer",textDecoration:"underline"}}>← Back to Sign In</span>
                  </div>
                </div>
              )
            ) : (
              <div>
                <Label>Email</Label>
                <input type="email" placeholder="you@email.com" value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError("");}}
                  style={{width:"100%",padding:"12px 14px",borderRadius:7,border:`1px solid ${C.rule}`,background:C.bg,fontFamily:F.body,fontSize:14,color:C.ink,outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
                <Label>Password</Label>
                <input type="password" placeholder={authMode==="signup"?"6+ characters":"••••••••"} value={authPassword} onChange={e=>{setAuthPassword(e.target.value);setAuthError("");}}
                  style={{width:"100%",padding:"12px 14px",borderRadius:7,border:`1px solid ${authError?C.red:C.rule}`,background:C.bg,fontFamily:F.body,fontSize:14,color:C.ink,outline:"none",marginBottom:authError?8:20,boxSizing:"border-box"}}/>
                {authError && <div style={{fontFamily:F.mono,fontSize:10,color:C.red,marginBottom:14}}>{authError}</div>}
                <button onClick={handleAuth} disabled={authLoading||!authEmail||!authPassword}
                  style={{...btnP,opacity:(authLoading||!authEmail||!authPassword)?0.4:1}}>
                  {authLoading?"...":(authMode==="signin"?"Sign In →":"Create Account →")}
                </button>
                {authMode==="signin" && (
                  <div style={{textAlign:"center",marginTop:12,fontFamily:F.mono,fontSize:10}}>
                    <span onClick={()=>{setAuthMode("reset");setAuthError("");}} style={{color:C.light,cursor:"pointer",textDecoration:"underline"}}>Forgot password?</span>
                  </div>
                )}
                <div style={{textAlign:"center",marginTop:12,fontFamily:F.mono,fontSize:10,color:C.light}}>
                  {authMode==="signin"?"Don't have an account?":"Already have an account?"}{" "}
                  <span onClick={()=>{setAuthMode(authMode==="signin"?"signup":"signin");setAuthError("");}} style={{color:C.green,cursor:"pointer",textDecoration:"underline"}}>
                    {authMode==="signin"?"Create one":"Sign in"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Onboarding screen ─────────────────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <div style={{background:C.bg,minHeight:"100vh",padding:"40px 20px",fontFamily:F.body}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>
        <div style={{maxWidth:400,margin:"0 auto"}}>
          <div style={{fontFamily:F.cond,fontSize:11,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,marginBottom:6}}>Get Unlocked Producer</div>
          <div style={{fontFamily:F.cond,fontSize:28,fontWeight:800,color:C.ink,marginBottom:28,lineHeight:1}}>PRODUCER <span style={{color:C.green}}>SETUP</span></div>
          <div style={{background:C.card,borderRadius:10,border:`1px solid ${C.rule}`,padding:"24px 20px"}}>
            {[
              {label:"Your first name",val:obName,set:setObName,placeholder:"Joshua",type:"text"},
              {label:"Accountability partner name",val:obPartner,set:setObPartner,placeholder:"Partner's first name",type:"text"},
              {label:"Accountability partner phone",val:obPartnerPhone,set:v=>setObPartnerPhone(formatPhone(v)),placeholder:"303-555-1234",type:"tel"},
              {label:"Average commission per closing ($)",val:obCommission,set:setObCommission,placeholder:"4000",type:"number"},
              {label:"Baseline closings / month (before Get Unlocked)",val:obClosings,set:setObClosings,placeholder:"2",type:"number"},
            ].map(({label,val,set,placeholder,type})=>(
              <div key={label} style={{marginBottom:16}}>
                <Label>{label}</Label>
                <input type={type} placeholder={placeholder} value={val} onChange={e=>set(e.target.value)}
                  style={{width:"100%",padding:"12px 14px",borderRadius:7,border:`1px solid ${C.rule}`,background:C.bg,fontFamily:F.body,fontSize:14,color:C.ink,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            <button onClick={saveOnboarding} disabled={!obName.trim()||obSaving}
              style={{...btnP,opacity:(!obName.trim()||obSaving)?0.4:1}}>
              {obSaving?"Saving...":"Get Started →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────────
  const view = !sched?"build":!accepted?"preview":subTab==="scorecard"?"scorecard":"schedule";
  const secSt = {display:"flex",alignItems:"center",gap:10,margin:"16px 0 7px"};
  const secLn = {flex:1,height:1,background:C.rule};
  const secTx = {fontFamily:F.mono,fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,whiteSpace:"nowrap"};

  function renderBlocks() {
    let ls=null;
    if (!Array.isArray(sched?.blocks)) return null;
    return sched.blocks.map(b=>{
      const sec=SM[b.id]??null, show=sec&&sec!==ls;
      if(sec) ls=sec;
      return (
        <div key={b.id}>
          {show && <div style={secSt}><span style={secTx}>{sec}</span><div style={secLn}/></div>}
          <BlockRow block={b} checked={!!schedChecked[b.id]} onCheck={toggleSchedCheck}/>
        </div>
      );
    });
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 16px 80px",fontFamily:F.body,maxWidth:520,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.green,color:"#fff",padding:"14px 16px",display:"flex",alignItems:"center",gap:10,zIndex:999,boxShadow:"0 -2px 12px rgba(0,0,0,0.15)"}}>
          <div style={{flex:1,fontFamily:F.body,fontSize:13,lineHeight:1.4}}>📲 Add Get Unlocked to your home screen for the best experience</div>
          <button onClick={triggerInstall} style={{background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.5)",color:"#fff",fontFamily:F.cond,fontSize:12,fontWeight:700,padding:"6px 10px",borderRadius:6,cursor:"pointer",whiteSpace:"nowrap"}}>Add</button>
          <button onClick={dismissInstall} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.7)",fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1}}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{borderBottom:`2px solid ${C.ink}`,paddingBottom:12,marginBottom:20}}>
        <div style={{fontFamily:F.cond,fontSize:10,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,marginBottom:3}}>Get Unlocked Producer</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div style={{fontFamily:F.cond,fontSize:22,fontWeight:800,color:C.ink,lineHeight:1}}>
            {profile.name?.toUpperCase()} <span style={{color:C.green}}>— {tab==="today"?"TODAY":tab==="contacts"?"CONTACTS":tab==="scripts"?"SCRIPTS":tab==="ioi"?"IOI":tab==="history"?"HISTORY":"TEAM"}</span>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:F.mono,fontSize:10,color:C.mid}}>{dateStr}</div>
            {streak>0 && <div style={{fontFamily:F.mono,fontSize:10,color:C.green,fontWeight:600,marginTop:2}}>Day {streak}</div>}
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr",gap:3,marginBottom:20,background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:4}}>
        {[["today","Today"],["contacts","Contacts"],["scripts","Scripts"],["ioi","IOI"],["history","History"],["team","Team"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>{setTab(id);setRebuildOk(false);}} style={{padding:"8px 2px",borderRadius:6,border:"none",background:tab===id?C.green:"transparent",color:tab===id?"#fff":C.mid,fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.03em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>{lbl}</button>
        ))}
      </div>

      {/* TODAY tab */}
      {tab==="today" && (
        <div>
          {ydayP.length>0 && (
            <div style={{background:C.amberBg,border:`1px solid ${C.amberBd}`,borderRadius:8,padding:"12px 16px",marginBottom:16}}>
              <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:C.amber,marginBottom:8}}>From yesterday</div>
              {ydayP.map((p,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:4,fontSize:13,color:C.ink}}>
                  <span style={{fontFamily:F.mono,fontSize:10,color:C.amber,marginTop:2}}>{i+1}.</span><span>{p}</span>
                </div>
              ))}
            </div>
          )}
          {(view==="schedule"||view==="scorecard") && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:16,background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:4}}>
              {[["schedule","Schedule"],["scorecard","Scorecard"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>switchSub(id)} style={{padding:"10px",borderRadius:6,border:"none",background:subTab===id?C.green:"transparent",color:subTab===id?"#fff":C.mid,fontFamily:F.cond,fontSize:14,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>{lbl}</button>
              ))}
            </div>
          )}

          {/* BUILD view */}
          {view==="build" && (
            <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"20px 16px"}}>
              {sqStep===0 && (
                <div>
                  <Label>1 of 5 — Start time</Label>
                  <div style={{fontFamily:F.cond,fontSize:18,fontWeight:800,color:C.ink,marginBottom:14}}>When are you starting today?</div>
                  <div style={{display:"flex",gap:10,marginBottom:16}}>
                    <Chip selected={startHour===9} onClick={()=>setStartHour(9)} color={C.green}>Early · 9 AM</Chip>
                    <Chip selected={startHour===10} onClick={()=>setStartHour(10)} color={C.green}>Standard · 10 AM</Chip>
                  </div>
                  <button style={btnP} onClick={()=>setSqStep(1)}>Next →</button>
                </div>
              )}
              {sqStep===1 && (
                <div>
                  <Label>2 of 5 — Day mode</Label>
                  <div style={{fontFamily:F.cond,fontSize:18,fontWeight:800,color:C.ink,marginBottom:14}}>What kind of day?</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                    {[
                      {val:"in",title:"IN the Business",color:C.amber,bg:C.amberBg,desc:"Deals, quotes, applications. Full 90-min deal review."},
                      {val:"on",title:"ON the Business",color:C.green,bg:C.greenBg,desc:"Prospecting, systems, lead gen. Deal review capped tight."},
                    ].map(opt=>(
                      <button key={opt.val} onClick={()=>setMode(opt.val)} style={{padding:"12px 14px",borderRadius:8,textAlign:"left",cursor:"pointer",border:`2px solid ${mode===opt.val?opt.color:C.rule}`,background:mode===opt.val?opt.bg:C.card}}>
                        <div style={{fontFamily:F.cond,fontSize:14,fontWeight:700,color:mode===opt.val?opt.color:C.ink,marginBottom:2}}>{opt.title}</div>
                        <div style={{fontSize:12,color:C.mid}}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...btnS,flex:1,width:"auto"}} onClick={()=>setSqStep(0)}>← Back</button>
                    <button style={{...btnP,flex:2,opacity:mode?1:0.35,pointerEvents:mode?"auto":"none"}} onClick={()=>setSqStep(2)}>Next →</button>
                  </div>
                </div>
              )}
              {sqStep===2 && (
                <div>
                  <Label>3 of 5 — Meeting + Lunch</Label>
                  <div style={{fontFamily:F.cond,fontSize:18,fontWeight:800,color:C.ink,marginBottom:14}}>In-person meeting today?</div>
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    <Chip selected={hasMeeting===false} onClick={()=>setHasMeeting(false)} color={C.stone}>No meeting</Chip>
                    <Chip selected={hasMeeting===true} onClick={()=>setHasMeeting(true)} color={C.olive}>Yes</Chip>
                  </div>
                  {hasMeeting && (
                    <div style={{background:C.oliveBg,border:`1px solid ${C.oliveBd}`,borderRadius:8,padding:14,marginBottom:14}}>
                      <div style={{marginBottom:12}}><Label>Meeting time</Label><TSel value={meetingTime} onChange={setMeetingTime}/></div>
                      <Label>Duration</Label>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                        {[["30 min",30],["45 min",45],["1 hour",60],["1.5 hrs",90]].map(([l,v])=>(
                          <Chip key={v} selected={meetingDur===v} onClick={()=>setMeetingDur(v)} color={C.olive}>{l}</Chip>
                        ))}
                      </div>
                      <Label>Second meeting today?</Label>
                      <div style={{display:"flex",gap:8,marginBottom:hasSecondMeeting?12:0}}>
                        <Chip selected={hasSecondMeeting===false} onClick={()=>setHasSecondMeeting(false)} color={C.stone}>No</Chip>
                        <Chip selected={hasSecondMeeting===true} onClick={()=>setHasSecondMeeting(true)} color={C.olive}>Yes, add another</Chip>
                      </div>
                      {hasSecondMeeting && (
                        <div style={{marginTop:12}}>
                          <div style={{marginBottom:12}}><Label>2nd meeting time</Label><TSel value={meeting2Time} onChange={setMeeting2Time}/></div>
                          <Label>Duration</Label>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {[["30 min",30],["45 min",45],["1 hour",60],["1.5 hrs",90]].map(([l,v])=>(
                              <Chip key={v} selected={meeting2Dur===v} onClick={()=>setMeeting2Dur(v)} color={C.olive}>{l}</Chip>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{marginBottom:14}}>
                    <Label>Lunch</Label>
                    <div style={{display:"flex",gap:8}}>
                      <Chip selected={lunchDur===30} onClick={()=>setLunchDur(30)} color={C.stone}>30 min</Chip>
                      <Chip selected={lunchDur===60} onClick={()=>setLunchDur(60)} color={C.stone}>1 hour</Chip>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...btnS,flex:1,width:"auto"}} onClick={()=>setSqStep(1)}>← Back</button>
                    <button style={{...btnP,flex:2,opacity:(hasMeeting!==null&&(hasMeeting===false||hasSecondMeeting!==null))?1:0.35,pointerEvents:(hasMeeting!==null&&(hasMeeting===false||hasSecondMeeting!==null))?"auto":"none"}} onClick={()=>setSqStep(3)}>Next →</button>
                  </div>
                </div>
              )}
              {sqStep===3 && (
                <div>
                  <Label>4 of 5 — Deal build</Label>
                  <div style={{fontFamily:F.cond,fontSize:18,fontWeight:800,color:C.ink,marginBottom:14}}>New deals to build today?</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                    {[
                      {val:"none",label:"No new deals",sub:"Call Block 2 runs full 2 hours",color:C.stone,bg:C.stoneBg},
                      {val:"light",label:"1-2 deals · 40 min",sub:"40 min carved from CB2",color:C.teal,bg:C.tealBg},
                      {val:"medium",label:"3-4 deals · 70 min",sub:"70 min carved from CB2",color:C.amber,bg:C.amberBg},
                      {val:"heavy",label:"4+ deals · 100 min",sub:"100 min carved, 20 min calling kept",color:C.red,bg:C.redBg},
                    ].map(opt=>(
                      <button key={opt.val} onClick={()=>setDealLoad(opt.val)} style={{padding:"10px 14px",borderRadius:8,textAlign:"left",cursor:"pointer",border:`2px solid ${dealLoad===opt.val?opt.color:C.rule}`,background:dealLoad===opt.val?opt.bg:C.card}}>
                        <div style={{fontFamily:F.cond,fontSize:14,fontWeight:700,color:dealLoad===opt.val?opt.color:C.ink,marginBottom:1}}>{opt.label}</div>
                        <div style={{fontSize:11,color:C.mid}}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...btnS,flex:1,width:"auto"}} onClick={()=>setSqStep(2)}>← Back</button>
                    <button style={{...btnP,flex:2,opacity:dealLoad?1:0.35,pointerEvents:dealLoad?"auto":"none"}} onClick={()=>setSqStep(4)}>Next →</button>
                  </div>
                </div>
              )}
              {sqStep===4 && (
                <div>
                  <Label>5 of 5 — Hard stop</Label>
                  <div style={{fontFamily:F.cond,fontSize:18,fontWeight:800,color:C.ink,marginBottom:14}}>Need to leave by a certain time?</div>
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    <Chip selected={hasHardStop===false} onClick={()=>setHasHardStop(false)} color={C.stone}>No hard stop</Chip>
                    <Chip selected={hasHardStop===true} onClick={()=>setHasHardStop(true)} color={C.red}>Yes, leaving by…</Chip>
                  </div>
                  {hasHardStop && (
                    <div style={{background:C.redBg,border:`1px solid ${C.redBd}`,borderRadius:8,padding:14,marginBottom:14}}>
                      <Label>Leave by</Label><TSel value={hardStopTime} onChange={setHardStopTime}/>
                    </div>
                  )}
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...btnS,flex:1,width:"auto"}} onClick={()=>setSqStep(3)}>← Back</button>
                    <button style={{...btnP,flex:2,opacity:hasHardStop!==null?1:0.35,pointerEvents:hasHardStop!==null?"auto":"none"}} onClick={buildAndSet}>Build My Day →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW view */}
          {view==="preview" && (
            <div>
              <div style={{background:C.greenBg,border:`1px solid ${C.greenBd}`,borderRadius:8,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontFamily:F.cond,fontSize:15,fontWeight:700,color:C.green,marginBottom:4}}>Your day is built — done by {fmt(sched.endTime)}</div>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:14}}>Review your schedule below, then tap Accept. You won't be asked these questions again today.</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={acceptSched} style={{...btnP,flex:2}}>Accept Schedule</button>
                  {rebuildOk?(
                    <div style={{flex:1,display:"flex",gap:4}}>
                      <button onClick={doRebuild} style={{...btnS,flex:1,fontSize:11,padding:"10px 4px",borderColor:C.red,color:C.red,width:"auto"}}>Yes</button>
                      <button onClick={()=>setRebuildOk(false)} style={{...btnS,flex:1,fontSize:11,padding:"10px 4px",width:"auto"}}>No</button>
                    </div>
                  ):(
                    <button onClick={()=>setRebuildOk(true)} style={{...btnS,flex:1,width:"auto"}}>Rebuild</button>
                  )}
                </div>
              </div>
              {schedWarn.map((w,i)=><div key={i} style={{background:C.redBg,border:`1px solid ${C.redBd}`,borderRadius:6,padding:"8px 12px",marginBottom:8,fontSize:11,color:C.red}}>⚠ {w}</div>)}
              {renderBlocks()}
            </div>
          )}

          {/* SCHEDULE view (after acceptance) */}
          {view==="schedule" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontFamily:F.mono,fontSize:10,color:C.mid}}>Done by {fmt(sched.endTime)}</div>
                  <button onClick={downloadICS} style={{fontFamily:F.mono,fontSize:9,padding:"4px 8px",borderRadius:4,border:`1px solid ${C.greenBd}`,background:C.greenBg,color:C.green,cursor:"pointer"}}>📅 Calendar</button>
                </div>
                {rebuildOk?(
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontFamily:F.mono,fontSize:9,color:C.red}}>Clears scorecard.</span>
                    <button onClick={doRebuild} style={{fontFamily:F.mono,fontSize:9,padding:"5px 8px",borderRadius:4,border:`1.5px solid ${C.red}`,background:C.redBg,color:C.red,cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setRebuildOk(false)} style={{fontFamily:F.mono,fontSize:9,padding:"5px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.card,color:C.mid,cursor:"pointer"}}>Cancel</button>
                  </div>
                ):(
                  <button onClick={()=>setRebuildOk(true)} style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.card,color:C.mid,cursor:"pointer"}}>Rebuild Day</button>
                )}
              </div>
              {schedWarn.map((w,i)=><div key={i} style={{background:C.redBg,border:`1px solid ${C.redBd}`,borderRadius:6,padding:"8px 12px",marginBottom:8,fontSize:11,color:C.red}}>⚠ {w}</div>)}
              {renderBlocks()}
            </div>
          )}

          {/* SCORECARD view */}
          {view==="scorecard" && (
            <div>
              <div style={{background:C.card,border:`1px solid ${allDone?C.greenBd:C.rule}`,borderRadius:8,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontFamily:F.cond,fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.mid,whiteSpace:"nowrap"}}>Scorecard</span>
                <div style={{flex:1,height:6,borderRadius:3,background:C.rule,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:3,background:C.green,width:`${pct}%`,transition:"width 0.3s"}}/>
                </div>
                <span style={{fontFamily:F.mono,fontSize:11,color:allDone?C.green:C.mid,whiteSpace:"nowrap",fontWeight:allDone?600:400}}>{allDone?"All done":`${totalDone} / ${totalGoals}`}</span>
              </div>
              {dpc>0 && (
                <div style={{background:C.greenBg,border:`1px solid ${C.greenBd}`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.green}}>Today's Conversation Value</div>
                    <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginTop:1}}>{convos} convos × ${dpc.toLocaleString()} each</div>
                  </div>
                  <div style={{fontFamily:F.cond,fontSize:24,fontWeight:800,color:C.green}}>${todayVal.toLocaleString()}</div>
                </div>
              )}
              <div style={secSt}><span style={secTx}>Primary Metric</span><div style={secLn}/></div>
              <div style={{background:C.blueBg,border:`1px solid ${C.blueBd}`,borderRadius:8,padding:"10px 12px",marginBottom:5}}>
                <div style={{fontFamily:F.mono,fontSize:9,color:C.blue,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>The money metric — everything else exists to create this</div>
                <ActRow act={PRIMARY} val={counts[PRIMARY.id]||0} onSet={v=>setCount(PRIMARY.id,v)}/>
                <ActRow act={APPS_ACT} val={counts[APPS_ACT.id]||0} onSet={v=>setCount(APPS_ACT.id,v)}/>
              </div>
              <div style={secSt}><span style={secTx}>Feeding Activities</span><div style={secLn}/></div>
              <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:8,fontStyle:"italic"}}>These exist to create phone conversations. They don't pay you — conversations do.</div>
              {ACTS.filter(a=>a.section==="feed").map(act=>(
                <ActRow key={act.id} act={act} val={counts[act.id]||0} onSet={v=>setCount(act.id,v)}/>
              ))}
              <div style={secSt}><span style={secTx}>Outcomes</span><div style={secLn}/></div>
              {ACTS.filter(a=>a.section==="outcome").map(act=>(
                <ActRow key={act.id} act={act} val={counts[act.id]||0} onSet={v=>setCount(act.id,v)}/>
              ))}
              <div style={secSt}><span style={secTx}>Power Block</span><div style={secLn}/></div>
              <div onClick={togglePB} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:pb?C.greenBg:C.purpleBg,border:`1px solid ${pb?C.greenBd:C.purpleBd}`,borderRadius:8,padding:"12px 14px",marginBottom:5,cursor:"pointer"}}>
                <div>
                  <div style={{fontFamily:F.cond,fontSize:13,fontWeight:700,letterSpacing:"0.03em",textTransform:"uppercase",color:pb?C.green:C.purple}}>Power Block Completed</div>
                  <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginTop:2}}>60-min focused block — all non-negotiables in one uninterrupted session</div>
                </div>
                <div style={{width:24,height:24,borderRadius:6,border:`2px solid ${pb?C.green:C.purpleBd}`,background:pb?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",flexShrink:0}}>
                  {pb && <span style={{color:"#fff",fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
                </div>
              </div>
              <div style={secSt}><span style={secTx}>Tomorrow</span><div style={secLn}/></div>
              <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"14px 16px",marginBottom:16}}>
                <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:12}}>These appear when you open the app tomorrow morning.</div>
                {tomorrow.map((val,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontFamily:F.mono,fontSize:10,color:C.light,width:16,textAlign:"right",flexShrink:0}}>{i+1}.</span>
                    <input value={val} onChange={e=>setTom(i,e.target.value)}
                      placeholder={["Most important call or follow-up","Deal or task that must move","Prospecting or system priority"][i]}
                      style={{flex:1,padding:"9px 11px",borderRadius:6,border:`1px solid ${C.rule}`,background:C.bg,fontFamily:F.body,fontSize:12,color:C.ink,outline:"none"}}/>
                  </div>
                ))}
              </div>
              <div style={secSt}><span style={secTx}>Daily Report</span><div style={secLn}/></div>
              <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"14px 16px",marginBottom:8}}>
                <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:12}}>Send to {profile.partnerName||"your accountability partner"} before you close out.</div>
                <pre style={{fontFamily:F.mono,fontSize:10,color:C.mid,lineHeight:1.7,whiteSpace:"pre-wrap",background:C.bg,borderRadius:6,padding:12,border:`1px solid ${C.rule}`,marginBottom:12,overflowX:"auto"}}>{genReport()}</pre>
                <button onClick={copyReport} style={{...btnP,background:copied?C.green:C.blue,borderColor:copied?C.green:C.blue}}>{copied?"Copied to Clipboard":"Copy Report"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTACTS tab */}
      {tab==="contacts" && (
        <div>
          <div style={{marginBottom:14}}>
            <input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search by name or phone..."
              style={{width:"100%",padding:"11px 14px",borderRadius:7,border:`1px solid ${C.rule}`,background:C.card,fontFamily:F.body,fontSize:13,color:C.ink,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["all","All"],["never","Never Contacted"],["cold","90+ Days"],["highrate","High Rate"]].map(([id,lbl])=>(
                <Chip key={id} selected={cFilter===id} onClick={()=>setCFilter(id)} color={C.blue}>{lbl}</Chip>
              ))}
            </div>
          </div>
          {/* Upload progress bar */}
          {uploadProgress && (
            <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
              <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,color:uploadProgress.done?C.green:C.ink,marginBottom:8}}>
                {uploadProgress.done?`Upload complete — ${contacts.length} contacts loaded`:`Uploading… batch ${uploadProgress.current} of ${uploadProgress.total}`}
              </div>
              <div style={{height:6,borderRadius:3,background:C.rule,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,background:uploadProgress.done?C.green:C.blue,width:`${Math.round((uploadProgress.current/uploadProgress.total)*100)}%`,transition:"width 0.2s"}}/>
              </div>
              {uploadProgress.errors>0 && <div style={{fontFamily:F.mono,fontSize:9,color:C.red,marginTop:6}}>{uploadProgress.errors} batch{uploadProgress.errors>1?"es":""} had errors</div>}
            </div>
          )}
          {contacts.length===0 ? (
            <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"32px 20px",textAlign:"center"}}>
              <div style={{fontFamily:F.cond,fontSize:16,fontWeight:700,color:C.mid,marginBottom:8}}>No Contacts Loaded</div>
              <div style={{fontFamily:F.mono,fontSize:10,color:C.light,marginBottom:20}}>Upload a CSV or tab-delimited file. Headers map to: first_name, last_name, phone, email, note_rate, etc. Legacy headers (First Name, Last Name…) also supported. Up to 5,000 rows.</div>
              <input ref={fRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFile} style={{display:"none"}}/>
              <button onClick={()=>fRef.current?.click()} style={{...btnP,maxWidth:240,margin:"0 auto"}}>Upload Contact File</button>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontFamily:F.mono,fontSize:10,color:C.mid}}>{filtC.length} of {contacts.length} contacts</span>
                <button onClick={()=>fRef.current?.click()} style={{fontFamily:F.mono,fontSize:9,padding:"4px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.card,color:C.mid,cursor:"pointer"}}>Replace</button>
                <input ref={fRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFile} style={{display:"none"}}/>
              </div>
              {selC ? (
                <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"18px 16px"}}>
                  <button onClick={()=>setSelC(null)} style={{fontFamily:F.mono,fontSize:9,padding:"4px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.bg,color:C.mid,cursor:"pointer",marginBottom:14}}>← Back</button>
                  <div style={{fontFamily:F.cond,fontSize:22,fontWeight:800,color:C.ink,marginBottom:4}}>{selC.first_name} {selC.last_name}</div>
                  {selC.co_borrower_first && <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:12}}>Co-borrower: {selC.co_borrower_first} {selC.co_borrower_last}</div>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                    {[
                      ["Note Rate", selC.note_rate?`${selC.note_rate}%`:"—"],
                      ["Loan Amount", selC.loan_amount?`$${Number(selC.loan_amount).toLocaleString()}`:"—"],
                      ["Appraised Value", selC.appraised_value?`$${Number(selC.appraised_value).toLocaleString()}`:"—"],
                      ["Birthday", selC.birthday||"—"],
                      ["Source", selC.source_category||"—"],
                      ["Last Contact", sLabels[cStatus(selC)]],
                    ].map(([k,v])=>(
                      <div key={k} style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:6,padding:"8px 10px"}}>
                        <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:2}}>{k}</div>
                        <div style={{fontFamily:F.cond,fontSize:14,fontWeight:700,color:C.ink}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:12}}>{selC.property_address}{selC.property_city?`, ${selC.property_city}`:""}{selC.property_state?`, ${selC.property_state}`:""}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                    {[
                      ["Call", `tel:${selC.phone}`],
                      ["Text", `sms:${selC.phone}?body=Hi ${selC.first_name}, this is ${profile.name}. Just checking in.`],
                      ["Email", `mailto:${selC.email}?subject=Checking in`],
                    ].map(([lbl,href])=>(
                      <a key={lbl} href={href} style={{display:"block",padding:"10px 0",textAlign:"center",borderRadius:6,border:`1.5px solid ${C.green}`,background:C.greenBg,color:C.green,fontFamily:F.cond,fontSize:13,fontWeight:700,textDecoration:"none"}}>{lbl}</a>
                    ))}
                  </div>
                  <button onClick={()=>{logC(selC);setSelC(null);}} style={{...btnP,background:C.green}}>Mark as Contacted Today</button>
                </div>
              ) : (
                <div>
                  {filtC.slice(0,50).map((c,i)=>{
                    const st=cStatus(c), rf=rFlag(c);
                    return (
                      <div key={c.id||i} onClick={()=>setSelC(c)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"11px 14px",marginBottom:5,cursor:"pointer"}}>
                        <div>
                          <div style={{fontFamily:F.cond,fontSize:14,fontWeight:700,color:C.ink}}>{c.first_name} {c.last_name}</div>
                          <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginTop:2}}>{c.phone} · {c.source_category||"—"}</div>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {c.note_rate && <span style={{fontFamily:F.mono,fontSize:10,padding:"2px 6px",borderRadius:3,background:rf==="high"?C.redBg:C.stoneBg,color:rf==="high"?C.red:C.stone}}>{c.note_rate}%</span>}
                          <span style={{fontFamily:F.mono,fontSize:9,padding:"2px 6px",borderRadius:3,background:C.stoneBg,color:sColors[st]}}>{sLabels[st]}</span>
                        </div>
                      </div>
                    );
                  })}
                  {filtC.length>50 && <div style={{fontFamily:F.mono,fontSize:10,color:C.light,textAlign:"center",marginTop:10}}>Showing 50 of {filtC.length} — use search to narrow</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab==="scripts" && <ScriptsTab/>}
      {tab==="ioi" && <IOITab/>}

      {/* HISTORY tab */}
      {tab==="history" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[["Streak",`${streak}d`],["Total",totDays],["Complete",compDays],["Rate",`${compRate}%`]].map(([lbl,val])=>(
              <div key={lbl} style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontFamily:F.mono,fontSize:8,color:C.light,marginBottom:4,letterSpacing:"0.08em",textTransform:"uppercase"}}>{lbl}</div>
                <div style={{fontFamily:F.cond,fontSize:20,fontWeight:800,color:C.green}}>{val}</div>
              </div>
            ))}
          </div>
          {chartData.length>0 && (
            <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"16px 12px",marginBottom:16}}>
              <div style={{fontFamily:F.cond,fontSize:12,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:C.mid,marginBottom:14}}>Closings vs Baseline</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{top:5,right:10,left:-20,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.rule}/>
                  <XAxis dataKey="label" tick={{fontFamily:F.mono,fontSize:9,fill:C.light}}/>
                  <YAxis tick={{fontFamily:F.mono,fontSize:9,fill:C.light}}/>
                  <Tooltip contentStyle={{fontFamily:F.mono,fontSize:10,background:C.card,border:`1px solid ${C.rule}`,borderRadius:6}}/>
                  <ReferenceLine y={profile.baselineClosings} stroke={C.amber} strokeDasharray="4 4" label={{value:"Baseline",position:"right",fontFamily:F.mono,fontSize:9,fill:C.amber}}/>
                  <Line type="monotone" dataKey="closings" stroke={C.green} strokeWidth={2} dot={{fill:C.green,r:3}} name="Closings"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:C.mid,marginBottom:10}}>Daily Log</div>
          {history.length===0 ? (
            <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"24px 16px",textAlign:"center",fontFamily:F.mono,fontSize:11,color:C.light}}>No history yet. Complete your first day to start the log.</div>
          ) : history.slice(0,30).map((entry,i)=>{
            const hit=ACTS.filter(a=>a.goal>0).every(a=>(entry.counts?.[a.id]||0)>=a.goal)&&entry.pb;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:hit?C.greenBg:C.card,border:`1px solid ${hit?C.greenBd:C.rule}`,borderRadius:8,padding:"10px 14px",marginBottom:5}}>
                <div>
                  <div style={{fontFamily:F.cond,fontSize:13,fontWeight:700,color:hit?C.green:C.ink}}>{new Date(entry.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                  <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginTop:2}}>Convos:{entry.counts?.conversations||0} DB:{entry.counts?.database||0} R:{entry.counts?.realtor||0}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:F.cond,fontSize:13,fontWeight:700,color:hit?C.green:C.mid}}>{hit?"Complete":`${entry.counts?.conversations||0}/5`}</div>
                  {(entry.counts?.closings||0)>0 && <div style={{fontFamily:F.mono,fontSize:9,color:C.amber}}>{entry.counts.closings} closing{entry.counts.closings>1?"s":""}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TEAM tab */}
      {tab==="team" && (
        <div>
          {isAdmin ? (
            /* ── ADMIN VIEW ── */
            <div>
              {/* Invite banner */}
              <div style={{background:C.greenBg||"#eef6f1",border:`1px solid ${C.green}`,borderRadius:8,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:C.green,marginBottom:3}}>Invite a Loan Officer</div>
                  <div style={{fontFamily:F.mono,fontSize:10,color:C.mid}}>Share this link — they self-sign-up and appear here automatically</div>
                  <div style={{fontFamily:F.mono,fontSize:11,color:C.ink,marginTop:4,wordBreak:"break-all"}}>getunlocked-producer.vercel.app</div>
                </div>
                <button onClick={()=>{navigator.clipboard.writeText("https://getunlocked-producer.vercel.app");setInviteCopied(true);setTimeout(()=>setInviteCopied(false),2000);}}
                  style={{...btnP,width:"auto",padding:"8px 14px",fontSize:11,flexShrink:0}}>
                  {inviteCopied?"Copied!":"Copy Link"}
                </button>
              </div>

              {/* Team cards */}
              {teamLoading ? (
                <div style={{textAlign:"center",padding:32,fontFamily:F.mono,fontSize:11,color:C.light}}>Loading team data…</div>
              ) : teamData.length === 0 ? (
                <div style={{textAlign:"center",padding:32,fontFamily:F.mono,fontSize:11,color:C.light}}>No LO accounts yet. Share the invite link above.</div>
              ) : (
                teamData.map(lo => {
                  const activeLoTab = loTabs[lo.id] || "today";
                  const isExpanded  = loExpanded[lo.id] || false;
                  const setLoTab    = (t) => setLoTabs(prev => ({...prev, [lo.id]: t}));
                  const toggleExp   = () => setLoExpanded(prev => ({...prev, [lo.id]: !prev[lo.id]}));

                  // Pick data source based on active tab
                  const c = activeLoTab === "today"
                    ? (lo.todayLog?.counts || {})
                    : activeLoTab === "mtd" ? (lo.mtd || {}) : (lo.ytd || {});
                  const hasPB = lo.todayLog?.pb;

                  // Metric definitions: [label, key, goal (today only)]
                  const CORE = [
                    ["Phone Conversations", "conversations", 5],
                    ["Applications Taken",  "apps",          1],
                    ["Closings",            "closings",      0],
                    ["Pre-Approvals",       "preapprovals",  0],
                  ];
                  const MORE = [
                    ["Database Outreach",   "database",         10],
                    ["Realtor Outreach",    "realtor",          5],
                    ["IOI Posts",           "ioi_posts",        0],
                    ["DMs",                 "dms",              0],
                    ["LinkedIn",            "linkedin",         0],
                    ["Handwritten Notes",   "handwritten_notes",0],
                  ];

                  const statRow = (label, key, goal) => {
                    const val = c[key] || 0;
                    const showGoal = activeLoTab === "today" && goal > 0;
                    return (
                      <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.rule}`}}>
                        <span style={{fontFamily:F.mono,fontSize:10,color:C.light}}>{label}</span>
                        <span style={{fontFamily:F.cond,fontSize:13,fontWeight:700,color:showGoal&&val>=goal?C.green:C.ink}}>{val}{showGoal?` / ${goal}`:""}</span>
                      </div>
                    );
                  };

                  const tabBtn = (label, key) => (
                    <button key={key} onClick={()=>setLoTab(key)} style={{fontFamily:F.mono,fontSize:10,letterSpacing:"0.06em",padding:"4px 10px",borderRadius:4,border:`1px solid ${activeLoTab===key?C.green:C.rule}`,background:activeLoTab===key?C.greenBg||"#eef6f1":"transparent",color:activeLoTab===key?C.green:C.light,cursor:"pointer"}}>
                      {label}
                    </button>
                  );

                  return (
                    <div key={lo.id} style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"16px",marginBottom:14}}>
                      {/* LO header */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10,paddingBottom:10,borderBottom:`2px solid ${C.rule}`}}>
                        <div style={{fontFamily:F.cond,fontSize:16,fontWeight:700,color:C.ink,letterSpacing:"0.05em",textTransform:"uppercase"}}>{lo.name||lo.email}</div>
                        {lo.is_admin && <span style={{fontFamily:F.mono,fontSize:9,color:C.green,background:C.greenBg||"#eef6f1",padding:"2px 6px",borderRadius:4}}>ADMIN</span>}
                      </div>

                      {/* Period tabs */}
                      <div style={{display:"flex",gap:6,marginBottom:12}}>
                        {tabBtn("Today","today")}
                        {tabBtn("MTD","mtd")}
                        {tabBtn("YTD","ytd")}
                      </div>

                      {/* Core 4 metrics */}
                      {CORE.map(([label, key, goal]) => statRow(label, key, goal))}

                      {/* Power Blocks (Today only) */}
                      {activeLoTab === "today" && (
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.rule}`}}>
                          <span style={{fontFamily:F.mono,fontSize:10,color:C.light}}>Power Blocks Done</span>
                          <span style={{fontFamily:F.cond,fontSize:13,fontWeight:700,color:hasPB?C.green:C.ink}}>{hasPB?"✓ Yes":"—"}</span>
                        </div>
                      )}

                      {/* Expanded metrics */}
                      {isExpanded && MORE.map(([label, key, goal]) => statRow(label, key, goal))}

                      {/* More / Less toggle */}
                      <button onClick={toggleExp} style={{marginTop:8,fontFamily:F.mono,fontSize:10,color:C.light,background:"transparent",border:"none",cursor:"pointer",padding:"4px 0",letterSpacing:"0.05em"}}>
                        {isExpanded ? "▲ Less" : "▼ More metrics"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ── LO VIEW: own profile only ── */
            <div>
              <div style={{background:C.amberBg,border:`1px solid ${C.amberBd}`,borderRadius:8,padding:"12px 14px",marginBottom:16}}>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.amber}}>Team view connects when LO accounts are live. Your stats are in History.</div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"18px 16px"}}>
                <div style={{fontFamily:F.cond,fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.mid,marginBottom:14}}>Your Profile</div>
                {[
                  ["Name",profile.name],
                  ["Accountability Partner",profile.partnerName||"—"],
                  ["Partner Phone",profile.partnerPhone||"—"],
                  ["Avg Commission",`$${Number(profile.avgCommission||0).toLocaleString()}`],
                  ["Baseline Closings/Mo",profile.baselineClosings],
                  ["Dollar Per Conversation",`$${dpc.toLocaleString()}`],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.rule}`}}>
                    <span style={{fontFamily:F.mono,fontSize:11,color:C.light}}>{k}</span>
                    <span style={{fontFamily:F.cond,fontSize:13,fontWeight:700,color:C.ink}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{marginTop:28,paddingTop:14,borderTop:`1px solid ${C.rule}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.light,letterSpacing:"0.1em"}}>GET UNLOCKED PRODUCER</span>
        <button onClick={signOut} style={{fontFamily:F.mono,fontSize:9,color:C.light,background:"transparent",border:"none",cursor:"pointer",letterSpacing:"0.05em",padding:0}}>Sign Out</button>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.mid,letterSpacing:"0.1em"}}>GRAHAM FINANCIAL</span>
      </div>
    </div>
  );
}
