import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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
const KEY = "gu_v5";
const todayKey = () => new Date().toISOString().slice(0,10);
const loadS = () => { try { return JSON.parse(localStorage.getItem(KEY)||"{}"); } catch { return {}; } };
const saveS = (d) => { try { localStorage.setItem(KEY,JSON.stringify(d)); } catch {} };

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
      // Meeting is at or before day start — it leads the day
      cur=meetingMins;
      push({id:"meeting",label:"In-Person Meeting",tag:"Scheduled",type:"meeting",dur:meetingDurMins+tb,scoreLabel:"Meeting completed",desc:`Meeting at ${fmt(meetingMins)} + ${tb} min travel buffer.`});
      push({id:"warmup",label:"Warm-Up Call · 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Warm-up call after re-entry. Now into phone mode."});
      push({id:"deals",label:`Deal Pipeline Review · ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:"Post-meeting deal review."});
    } else if(meetingMins<warmupEnd) {
      // Meeting is early — compress deal review and warm-up to fit before it
      const space=meetingMins-dayStart;
      if(space>=30) {
        const compDeal=space-15;
        push({id:"deals",label:`Deal Pipeline Review · ${compDeal} min`,tag:"Compressed",type:"deals",dur:compDeal,scoreLabel:"Deal pipeline reviewed",desc:`Compressed to fit your ${fmt(meetingMins)} meeting. Triage only.`});
        push({id:"warmup",label:"Warm-Up Call · 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Quick warm call right before your meeting."});
      } else if(space>=15) {
        push({id:"warmup",label:"Warm-Up Call · 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Warm-up call before meeting. Deal review moves to after."});
      }
      cur=meetingMins;
      push({id:"meeting",label:"In-Person Meeting",tag:"Scheduled",type:"meeting",dur:meetingDurMins+tb,scoreLabel:"Meeting completed",desc:`Meeting at ${fmt(meetingMins)} + ${tb} min travel buffer.`});
      if(!blocks.find(b=>b.id==="deals")) {
        push({id:"deals",label:`Deal Pipeline Review · ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:"Post-meeting deal review."});
      }
    } else {
      // Meeting is after deal review + warm-up — normal flow
      push({id:"deals",label:`Deal Pipeline Review · ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:mode==="on"?"8-10 min per deal. One action, move.":"10-15 min per deal, soonest close first."});
      push({id:"warmup",label:"Warm-Up Call · 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Easiest warm call in your list. Bridges desk work into phone mode."});
      const gap=meetingMins-cur;
      if(gap>=20) push({id:"calls1a",label:`Calls · ${gap} min`,tag:"Pre-Meeting",type:"calls",dur:gap,scoreLabel:"Pre-meeting calls logged",desc:"Dial window before meeting."});
      else cur=meetingMins;
      push({id:"meeting",label:"In-Person Meeting",tag:"Scheduled",type:"meeting",dur:meetingDurMins+tb,scoreLabel:"Meeting completed",desc:`Meeting at ${fmt(meetingMins)} + ${tb} min travel buffer.`});
    }
    push({id:"calls1b",label:"Calls · 45 min",tag:"Post-Meeting",type:"calls",dur:45,scoreLabel:"Post-meeting calls logged",desc:"Resume outbound after re-entry."});
    if(meeting2Mins) {
      const tb2=(meeting2DurMins||60)>=60?20:10;
      if(meeting2Mins>cur) {
        const gap=meeting2Mins-cur;
        if(gap>=20) push({id:"calls1c",label:`Calls · ${gap} min`,tag:"Pre-Meeting 2",type:"calls",dur:gap,scoreLabel:null,desc:"Calling window before second meeting."});
        else cur=meeting2Mins;
      }
      // if meeting2Mins <= cur, just place it at cur — never rewind
      push({id:"meeting2",label:"2nd In-Person Meeting",tag:"Scheduled",type:"meeting",dur:(meeting2DurMins||60)+tb2,scoreLabel:"2nd meeting completed",desc:`Second meeting + ${tb2} min travel buffer.`});
      push({id:"calls1d",label:"Calls · 30 min",tag:"Post-Meeting 2",type:"calls",dur:30,scoreLabel:null,desc:"Back to outbound after second meeting."});
    }
  } else {
    push({id:"deals",label:`Deal Pipeline Review · ${dd} min`,tag:mode==="on"?"Tight Cap":"Full Review",type:"deals",dur:dd,scoreLabel:"Deal pipeline reviewed",desc:mode==="on"?"8-10 min per deal. One action, move.":"10-15 min per deal, soonest close first."});
    push({id:"warmup",label:"Warm-Up Call · 15 min",tag:"Non-Negotiable",type:"warmup",dur:15,scoreLabel:"Warm-up call made",desc:"Easiest warm call in your list. Bridges desk work into phone mode."});
    const cb1=mode==="on"?90:75;
    push({id:"calls1",label:`Prospecting Calls — Block 1 · ${cb1} min`,tag:mode==="on"?"Primary":"Non-Neg Targets",type:"calls",dur:cb1,scoreLabel:"Call Block 1 hit",desc:"Agent outreach, buyer follow-up, referral touches."});
  }
  push({id:"lunch",label:`Lunch · ${lunchMins} min`,tag:"Screen Closed",type:"break",dur:lunchMins,scoreLabel:null,desc:"Laptop closed. Actual food."});
  push({id:"react1",label:"Reactivity Window #1 · 45 min",tag:"Email Unlocked",type:"reactive",dur:45,scoreLabel:null,desc:"First email open. Triage inbox."});
  const dbMins=DM[dealLoad]||0, cb2=Math.max(20,120-dbMins);
  if(dbMins>0) {
    const lbls={light:"Deal Build · 40 min",medium:"Deal Build · 70 min",heavy:"Deal Build · 100 min"};
    push({id:"dealwork",label:lbls[dealLoad],tag:"Protected",type:"dealwork",dur:dbMins,scoreLabel:"Deal build done",desc:"One file at a time. No calls, no email."});
  }
  push({id:"calls2",label:`Prospecting Calls — Block 2 · ${cb2} min`,tag:dbMins>0?"Compressed":"Heaviest",type:"calls",dur:cb2,scoreLabel:"Call Block 2 hit",desc:"Heaviest call block."});
  push({id:"react2",label:"Reactivity Window #2 · 45 min",tag:"Email Unlocked",type:"reactive",dur:45,scoreLabel:null,desc:"Second and final email open."});
  push({id:"calls3",label:"Evening Call Block · 60 min",tag:"W-2 Window",type:"calls",dur:60,scoreLabel:"Evening calls done",desc:"Peak window for W-2 buyers."});
  push({id:"study",label:mode==="on"?"System Building · 30 min":"Training & Development · 30 min",tag:"Get Unlocked",type:"study",dur:30,scoreLabel:mode==="on"?"System output done":"Training done",desc:mode==="on"?"Build a system, write a post, document a process. Also your window to watch Get Unlocked training videos, work on outbound call approach, or develop IOI content.":"Watch a Get Unlocked training video, work on outbound call scripts, review loan products, or develop your prospecting approach. One topic. Write one insight down."});
  push({id:"close",label:"Day Close · 15 min",tag:"",type:"buffer",dur:15,scoreLabel:"Scorecard logged",desc:"Log scorecard. Send daily report. Done."});
  if(hardStopMins&&cur>hardStopMins) {
    const drop=["study","calls3","react2","calls2","dealwork","react1","calls1d","calls1c"], dropped=[];
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
    // Catch-all: drop any block that starts at or after the hard stop (except close)
    const overBlocks=blocks.filter(b=>b.start>=hardStopMins&&b.id!=="close");
    for(const ob of overBlocks){const idx=blocks.findIndex(b=>b.id===ob.id);if(idx!==-1){dropped.push(blocks[idx].label);blocks.splice(idx,1);}}
    if(overBlocks.length>0&&blocks.length>0){let s=blocks[0].end;for(let i=1;i<blocks.length;i++){blocks[i].start=s;blocks[i].end=s+blocks[i].dur;s=blocks[i].end;}cur=blocks[blocks.length-1].end;}
    if(dropped.length) warnings.push(`Hard stop: removed ${dropped.join(", ")}.`);
  }
  return {blocks,warnings,endTime:cur};
}
const PRIMARY = {id:"conversations",label:"Phone Conversations (2+ min)",goal:5,sub:"The money metric. Everything else exists to create this."};
const APPS_ACT = {id:"apps",label:"Applications Taken",goal:1,sub:"Direct outcome of conversations"};
const ACTS = [
  {id:"database",   label:"Database / Reconnect Outreach", goal:10, sub:"Past clients, sphere — calls, texts, reach-outs",           section:"feed", wGoal:50},
  {id:"realtor",    label:"Realtor Outreach",               goal:5,  sub:"Agent calls, texts, value-drops",                           section:"feed", wGoal:25},
  {id:"socialPost", label:"IOI Post Published",             goal:1,  sub:"Facebook or Instagram — curiosity, no offer",               section:"feed", wGoal:5},
  {id:"dms",        label:"DMs Sent",                       goal:5,  sub:"Follow-up DMs to post engagers",                            section:"feed", wGoal:25},
  {id:"linkedin",   label:"LinkedIn Agent Adds",            goal:20, sub:"Connect with 20 agents daily",                             section:"feed", wGoal:100, special:"linkedin"},
  {id:"notes",      label:"Handwritten Notes Mailed",       goal:3,  sub:"One per phone call — highest open rate",                    section:"feed", wGoal:15},
  {id:"preapprovals",label:"Pre-Approvals Issued",          goal:0,  sub:"Issued today",                                              section:"outcome"},
  {id:"closings",   label:"Closings",                       goal:0,  sub:"Files funded today",                                       section:"outcome"},
];

const btnP = {padding:"13px 24px",borderRadius:7,border:`1.5px solid ${C.green}`,background:C.green,color:"#fff",fontFamily:F.cond,fontSize:15,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",width:"100%"};
const btnS = {padding:"13px 24px",borderRadius:7,border:`1.5px solid ${C.rule}`,background:C.card,color:C.mid,fontFamily:F.cond,fontSize:15,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"};

function Label({ children, color = C.light }) {
  return (
    <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color,marginBottom:8}}>
      {children}
    </div>
  );
}

function Chip({ children, selected, onClick, color = C.green }) {
  return (
    <button onClick={onClick} style={{padding:"9px 14px",borderRadius:6,border:`1.5px solid ${selected?color:C.rule}`,background:selected?color:C.card,color:selected?"#fff":C.mid,fontFamily:F.mono,fontSize:11,cursor:"pointer"}}>
      {children}
    </button>
  );
}

function TSel({ value, onChange }) {
  const [h,m,ap] = value;
  const ss = {padding:"8px",borderRadius:5,border:`1px solid ${C.rule}`,background:C.card,color:C.ink,fontFamily:F.mono,fontSize:12,cursor:"pointer",outline:"none"};
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <select value={h} onChange={e=>onChange([e.target.value,m,ap])} style={ss}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(v=><option key={v}>{v}</option>)}
      </select>
      <span style={{color:C.light,fontWeight:700}}>:</span>
      <select value={m} onChange={e=>onChange([h,e.target.value,ap])} style={ss}>
        {["00","15","30","45"].map(v=><option key={v}>{v}</option>)}
      </select>
      <select value={ap} onChange={e=>onChange([h,m,e.target.value])} style={ss}>
        {["AM","PM"].map(v=><option key={v}>{v}</option>)}
      </select>
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
      <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:14,fontStyle:"italic",lineHeight:1.5}}>
        Pick your scenario. Read it once. Put the phone down and talk like a human.
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {Object.entries(SCRIPTS_DATA).map(([id,sc2]) => (
          <button key={id} onClick={()=>{setActive(id);setScenario(0);setCopied(false);}} style={{padding:"8px 10px",borderRadius:6,border:`1.5px solid ${active===id?sc2.color:C.rule}`,background:active===id?sc2.color:C.card,color:active===id?"#fff":C.mid,fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>
            {sc2.label}
          </button>
        ))}
      </div>
      {s.scenarios.length > 1 && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {s.scenarios.map((sc2,i) => (
            <button key={i} onClick={()=>{setScenario(i);setCopied(false);}} style={{padding:"5px 9px",borderRadius:5,border:`1px solid ${scenario===i?s.color:C.rule}`,background:scenario===i?s.color+"22":C.card,color:scenario===i?s.color:C.mid,fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>
              {sc2.label}
            </button>
          ))}
        </div>
      )}
      <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:16}}>
        <div style={{fontFamily:F.cond,fontSize:15,fontWeight:800,color:s.color,marginBottom:2}}>{s.label}</div>
        <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:12}}>{sc.label}</div>
        <pre style={{fontFamily:F.mono,fontSize:11,color:C.mid,lineHeight:1.75,whiteSpace:"pre-wrap",background:C.bg,borderRadius:6,padding:12,border:`1px solid ${C.rule}`,marginBottom:12}}>{sc.content}</pre>
        <button onClick={()=>navigator.clipboard.writeText(sc.content).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})} style={{...btnP,background:copied?C.green:C.blue,borderColor:copied?C.green:C.blue}}>
          {copied?"Copied":"Copy Script"}
        </button>
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
      <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:14,fontStyle:"italic",lineHeight:1.5}}>
        No offer, no pitch, no yes/no choice. Curiosity, emotion, self-interest only.
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {Object.entries(IOI_DATA).map(([id,ps]) => (
          <button key={id} onClick={()=>{setActive(id);setPost(0);setCopied(false);}} style={{padding:"8px 10px",borderRadius:6,border:`1.5px solid ${active===id?ps.color:C.rule}`,background:active===id?ps.color:C.card,color:active===id?"#fff":C.mid,fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer"}}>
            {ps.label}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {p.items.map((it,i) => (
          <button key={i} onClick={()=>{setPost(i);setCopied(false);}} style={{padding:"5px 9px",borderRadius:5,border:`1px solid ${post===i?p.color:C.rule}`,background:post===i?p.color+"22":C.card,color:post===i?p.color:C.mid,fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>
            {it.title}
          </button>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:16}}>
        <div style={{fontFamily:F.cond,fontSize:15,fontWeight:800,color:p.color,marginBottom:12}}>{item.title}</div>
        <pre style={{fontFamily:F.mono,fontSize:11,color:C.mid,lineHeight:1.8,whiteSpace:"pre-wrap",background:C.bg,borderRadius:6,padding:12,border:`1px solid ${C.rule}`,marginBottom:12}}>{item.content}</pre>
        <button onClick={()=>navigator.clipboard.writeText(item.content).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})} style={{...btnP,background:copied?C.green:C.blue,borderColor:copied?C.green:C.blue}}>
          {copied?"Copied":"Copy Post"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("boot");
  const [tab, setTab] = useState("today");
  const [profile, setProfile] = useState({name:"",pin:"",partnerName:"To be determined",partnerPhone:"",avgCommission:4000,baselineClosings:2});
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState(false);
  const [setupStep, setSetupStep] = useState(0);

  const [sqStep, setSqStep] = useState(0);
  const [startHour, setStartHour] = useState(10);
  const [mode, setMode] = useState(null);
  const [hasMeeting, setHasMeeting] = useState(null);
  const [meetingTime, setMeetingTime] = useState(["11","00","AM"]);
  const [meetingDur, setMeetingDur] = useState(60);
  const [hasSecondMeeting, setHasSecondMeeting] = useState(null);
  const [meeting2Time, setMeeting2Time] = useState(["2","00","PM"]);
  const [meeting2Dur, setMeeting2Dur] = useState(60);
  const [meeting2WarnAcked, setMeeting2WarnAcked] = useState(false);
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
  const [cLog, setCLog] = useState({});
  const fRef = useRef();

  const today = todayKey();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  useEffect(() => {
    const s = loadS();
    if (s.profile?.name && s.profile?.pin) { setProfile(s.profile); setScreen("login"); }
    else setScreen("setup");
    if (s.contacts) setContacts(s.contacts);
    if (s.cLog) setCLog(s.cLog);
  }, []);

  function initDay() {
    const s = loadS();
    setStreak(s.streak||0);
    setHistory(s.history||[]);
    if (s.date === today) {
      setCounts(s.counts||{});
      setPb(s.pb||false);
      setTomorrow(s.tomorrow||["","",""]);
      setSchedChecked(s.schedChecked||{});
      if (s.sched) {
        setSched(s.sched);
        setSchedWarn(s.schedWarn||[]);
        if (s.accepted) { setAccepted(true); setSubTab(s.subTab||"scorecard"); }
      }
    } else {
      if (s.date && s.counts) {
        const hist = s.history||[];
        const entry = {date:s.date,counts:s.counts,pb:s.pb||false};
        const newHist = [entry,...hist].slice(0,365);
        const yp = (s.tomorrow||[]).filter(p=>p&&p.trim());
        if (yp.length) setYdayP(yp);
        const prev = new Date(s.date), curr = new Date(today);
        const diff = Math.round((curr-prev)/86400000);
        const hit = [PRIMARY,APPS_ACT,...ACTS.filter(a=>a.goal>0)].every(a=>(s.counts?.[a.id]||0)>=a.goal) && s.pb;
        const ns = (hit && diff===1) ? (s.streak||0)+1 : 0;
        setStreak(ns); setHistory(newHist);
        saveS({...s,history:newHist,streak:ns});
      }
      setCounts({}); setPb(false); setTomorrow(["","",""]); setSchedChecked({});
      setSched(null); setAccepted(false); setSubTab("schedule"); setSqStep(0);
      setMode(null); setHasMeeting(null); setDealLoad(null); setHasHardStop(null);
      setHasSecondMeeting(null); setMeeting2Time(["2","00","PM"]); setMeeting2Dur(60);
    }
  }

  const setCount = useCallback((id,val) => {
    setCounts(prev => {
      const next = {...prev,[id]:Math.max(0,val)};
      saveS({...loadS(),date:today,counts:next});
      return next;
    });
  }, [today]);

  const togglePB = useCallback(() => {
    setPb(prev => {
      const next = !prev;
      saveS({...loadS(),date:today,pb:next});
      return next;
    });
  }, [today]);

  const toggleSchedCheck = useCallback((id) => {
    setSchedChecked(prev => {
      const next = {...prev,[id]:!prev[id]};
      saveS({...loadS(),schedChecked:next});
      return next;
    });
  }, []);

  const setTom = useCallback((i,val) => {
    setTomorrow(prev => {
      const next = prev.map((v,j) => j===i?val:v);
      saveS({...loadS(),tomorrow:next});
      return next;
    });
  }, []);

  function buildAndSet() {
    const mm = hasMeeting ? parse12(...meetingTime) : null;
    const mm2 = hasSecondMeeting ? parse12(...meeting2Time) : null;
    const hm = hasHardStop ? parse12(...hardStopTime) : null;
    const result = buildSched({startHour,mode,hasMeeting,meetingMins:mm,meetingDurMins:meetingDur,meeting2Mins:mm2,meeting2DurMins:meeting2Dur,lunchMins:lunchDur,hardStopMins:hm,dealLoad});
    setSched(result); setSchedWarn(result.warnings); setSchedChecked({});
    setAccepted(false); setSubTab("schedule");
    saveS({...loadS(),date:today,sched:result,schedWarn:result.warnings,schedChecked:{},accepted:false,subTab:"schedule"});
  }

  function acceptSched() {
    setAccepted(true); setSubTab("scorecard");
    saveS({...loadS(),accepted:true,subTab:"scorecard"});
  }

  function switchSub(t) {
    setSubTab(t);
    saveS({...loadS(),subTab:t});
  }

  function doRebuild() {
    setSqStep(0); setSched(null); setAccepted(false); setSubTab("schedule");
    setMode(null); setHasMeeting(null); setDealLoad(null); setHasHardStop(null);
    setHasSecondMeeting(null); setRebuildOk(false);
    saveS({...loadS(),sched:null,accepted:false,subTab:"schedule"});
  }

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
      "",
      "--- Feeding Activities ---",
      `Database Outreach:      ${String(counts.database||0).padStart(2)} / 10  ${(counts.database||0)>=10?"✓":""}`,
      `Realtor Outreach:       ${String(counts.realtor||0).padStart(2)} / 5   ${(counts.realtor||0)>=5?"✓":""}`,
      `IOI Post:               ${String(counts.socialPost||0).padStart(2)} / 1   ${(counts.socialPost||0)>=1?"✓":""}`,
      `DMs Sent:               ${String(counts.dms||0).padStart(2)} / 5   ${(counts.dms||0)>=5?"✓":""}`,
      `LinkedIn Agent Adds:    ${String(counts.linkedin||0).padStart(2)} / 20  ${(counts.linkedin||0)>=20?"✓":""}`,
      `Handwritten Notes:      ${String(counts.notes||0).padStart(2)} / 3   ${(counts.notes||0)>=3?"✓":""}`,
      "",
      `Power Block:            ${pb?"Complete":"Incomplete"}`,
      "",
      `Call Value Today:       $${todayVal.toLocaleString()}`,
      "",
      `Day ${streak} — ${allDone?"Non-negotiables hit":`${totalDone}/${totalGoals} complete`}`,
    ].join("\n");
  }

  function copyReport() {
    navigator.clipboard.writeText(genReport()).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2500); });
  }

  const phoneOk = (v) => /^\d{3}-\d{3}-\d{4}$/.test((v||"").trim());

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g,"").slice(0,10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
    return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  const setupSteps = [
    {label:"Your name",field:"name",placeholder:"First name",type:"text"},
    {label:"4-digit PIN",field:"pin",placeholder:"0000",type:"number"},
    {label:"Accountability partner name",field:"partnerName",placeholder:"Partner's first name",type:"text"},
    {label:"Accountability partner phone",field:"partnerPhone",placeholder:"303-555-1234",type:"tel",validate:(v)=>phoneOk(v)?null:"Enter 10 digits — dashes fill in automatically"},
    {label:"Average commission per closing ($)",field:"avgCommission",placeholder:"4000",type:"number"},
    {label:"Baseline closings per month (before Get Unlocked)",field:"baselineClosings",placeholder:"2",type:"number",sub:"Your honest average before this program"},
  ];

  if (screen==="setup") {
    const step = setupSteps[setupStep], isLast = setupStep===setupSteps.length-1;
    const fv = String(profile[step.field]||""), err = step.validate?step.validate(fv):null, ok = fv.trim().length>0&&!err;
    return (
      <div style={{background:C.bg,minHeight:"100vh",padding:"40px 20px",fontFamily:F.body}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>
        <div style={{maxWidth:400,margin:"0 auto"}}>
          <div style={{fontFamily:F.cond,fontSize:11,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,marginBottom:6}}>Get Unlocked Producer</div>
          <div style={{fontFamily:F.cond,fontSize:28,fontWeight:800,color:C.ink,marginBottom:28,lineHeight:1}}>PRODUCER <span style={{color:C.green}}>SETUP</span></div>
          <div style={{background:C.card,borderRadius:10,border:`1px solid ${C.rule}`,padding:"24px 20px"}}>
            <Label>{step.label}</Label>
            {step.sub && <div style={{fontFamily:F.mono,fontSize:10,color:C.light,marginBottom:8}}>{step.sub}</div>}
            <input type={step.type} placeholder={step.placeholder} value={fv}
              onChange={e => {
                const val = step.field==="partnerPhone" ? formatPhone(e.target.value) : e.target.value;
                setProfile(p=>({...p,[step.field]:val}));
              }}
              style={{width:"100%",padding:"12px 14px",borderRadius:7,border:`1px solid ${fv&&err?C.red:C.rule}`,background:C.bg,fontFamily:F.body,fontSize:14,color:C.ink,outline:"none",marginBottom:fv&&err?6:20,boxSizing:"border-box"}}/>
            {fv&&err && <div style={{fontFamily:F.mono,fontSize:10,color:C.red,marginBottom:14}}>{err}</div>}
            <div style={{display:"flex",gap:10}}>
              {setupStep>0 && <button style={{...btnS,flex:1,width:"auto"}} onClick={()=>setSetupStep(s=>s-1)}>← Back</button>}
              <button style={{...btnP,flex:2,opacity:ok?1:0.35,pointerEvents:ok?"auto":"none"}}
                onClick={()=>{ if(isLast){saveS({...loadS(),profile});initDay();setScreen("app");}else setSetupStep(s=>s+1); }}>
                {isLast?"Start →":"Next →"}
              </button>
            </div>
            <div style={{fontFamily:F.mono,fontSize:10,color:C.light,textAlign:"center",marginTop:14}}>{setupStep+1} of {setupSteps.length}</div>
          </div>
        </div>
      </div>
    );
  }

  if (screen==="login") {
    return (
      <div style={{background:C.bg,minHeight:"100vh",padding:"40px 20px",fontFamily:F.body}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>
        <div style={{maxWidth:400,margin:"0 auto"}}>
          <div style={{fontFamily:F.cond,fontSize:11,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,marginBottom:6}}>Get Unlocked Producer</div>
          <div style={{fontFamily:F.cond,fontSize:28,fontWeight:800,color:C.ink,marginBottom:8,lineHeight:1}}>WELCOME <span style={{color:C.green}}>BACK</span></div>
          <div style={{fontFamily:F.mono,fontSize:11,color:C.mid,marginBottom:28}}>{profile.name}</div>
          <div style={{background:C.card,borderRadius:10,border:`1px solid ${C.rule}`,padding:"24px 20px"}}>
            <Label>Enter your PIN</Label>
            <input type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pinEntry}
              onChange={e=>{setPinEntry(e.target.value);setPinError(false);}}
              style={{width:"100%",padding:14,borderRadius:7,border:`1px solid ${pinError?C.red:C.rule}`,background:C.bg,fontFamily:F.mono,fontSize:22,letterSpacing:"0.3em",textAlign:"center",color:C.ink,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
            {pinError && <div style={{fontFamily:F.mono,fontSize:10,color:C.red,marginBottom:12}}>Incorrect PIN.</div>}
            <button style={{...btnP,marginTop:8}}
              onClick={()=>{ if(pinEntry===String(profile.pin)){initDay();setScreen("app");}else{setPinError(true);setPinEntry("");} }}>
              Unlock →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen!=="app") return null;

  const view = !sched ? "build" : !accepted ? "preview" : subTab==="scorecard" ? "scorecard" : "schedule";
  const secSt = {display:"flex",alignItems:"center",gap:10,margin:"16px 0 7px"};
  const secLn = {flex:1,height:1,background:C.rule};
  const secTx = {fontFamily:F.mono,fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.light,whiteSpace:"nowrap"};

  function renderBlocks() {
    let ls = null;
    return sched.blocks.map(b => {
      const sec = SM[b.id] ?? null;
      const show = sec && sec!==ls;
      if (sec) ls = sec;
      return (
        <div key={b.id}>
          {show && <div style={secSt}><span style={secTx}>{sec}</span><div style={secLn}/></div>}
          <BlockRow block={b} checked={!!schedChecked[b.id]} onCheck={toggleSchedCheck}/>
        </div>
      );
    });
  }

  function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split("\t").map(h=>h.trim());
    return lines.slice(1).map(line => {
      const vals = line.split("\t"), obj = {};
      headers.forEach((h,i) => { obj[h]=(vals[i]||"").trim(); });
      return obj;
    });
  }
  function handleFile(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const parsed=parseCSV(ev.target.result); setContacts(parsed); saveS({...loadS(),contacts:parsed}); };
    reader.readAsText(file);
  }
  function logC(c) { const k=`${c["First Name"]}_${c["Phone"]}`; const next={...cLog,[k]:{date:today}}; setCLog(next); saveS({...loadS(),cLog:next}); }
  function cStatus(c) {
    const k=`${c["First Name"]}_${c["Phone"]}`;
    const lg=cLog[k];
    if(!lg||!lg.date) return "never";
    const days=Math.round((new Date(today)-new Date(lg.date))/86400000);
    if(isNaN(days)) return "never";
    return days<=30?"recent":days<=90?"warm":"cold";
  }
  function rFlag(c) { const r=parseFloat(c["Note Rate"]); if(!r) return null; return r>=6.5?"high":r>=5.5?"mid":"low"; }
  const filtC = contacts.filter(c => {
    const search=cSearch.toLowerCase(), name=`${c["First Name"]} ${c["Last Name"]}`.toLowerCase();
    const ms=!search||name.includes(search)||(c["Phone"]||"").includes(search);
    if(!ms) return false;
    if(cFilter==="never") return cStatus(c)==="never";
    if(cFilter==="cold") return cStatus(c)==="cold";
    if(cFilter==="highrate") return rFlag(c)==="high";
    return true;
  });
  const sColors = {never:C.red,cold:C.amber,warm:C.mid,recent:C.green};
  const sLabels = {never:"Never",cold:"90+ days",warm:"Warm",recent:"Recent"};

  function buildChart() {
    const months = {};
    history.forEach(e => { const mo=e.date.slice(0,7); if(!months[mo]) months[mo]={month:mo,closings:0}; months[mo].closings+=e.counts?.closings||0; });
    return Object.values(months).sort((a,b)=>a.month.localeCompare(b.month)).map(m => ({...m,label:new Date(m.month+"-01").toLocaleDateString("en-US",{month:"short",year:"2-digit"})}));
  }
  const chartData = buildChart();
  const totDays = history.length;
  const compDays = history.filter(e=>ACTS.filter(a=>a.goal>0).every(a=>(e.counts?.[a.id]||0)>=a.goal)&&e.pb).length;
  const compRate = totDays>0 ? Math.round((compDays/totDays)*100) : 0;

  return (
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 16px 80px",fontFamily:F.body,maxWidth:520,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet"/>

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

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr",gap:3,marginBottom:20,background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:4}}>
        {[["today","Today"],["contacts","Contacts"],["scripts","Scripts"],["ioi","IOI"],["history","History"],["team","Team"]].map(([id,lbl]) => (
          <button key={id} onClick={()=>{setTab(id);setRebuildOk(false);}} style={{padding:"8px 2px",borderRadius:6,border:"none",background:tab===id?C.green:"transparent",color:tab===id?"#fff":C.mid,fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.03em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
            {lbl}
          </button>
        ))}
      </div>

      {tab==="today" && (
        <div>
          {ydayP.length>0 && (
            <div style={{background:C.amberBg,border:`1px solid ${C.amberBd}`,borderRadius:8,padding:"12px 16px",marginBottom:16}}>
              <div style={{fontFamily:F.cond,fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:C.amber,marginBottom:8}}>From yesterday</div>
              {ydayP.map((p,i) => (
                <div key={i} style={{display:"flex",gap:8,marginBottom:4,fontSize:13,color:C.ink}}>
                  <span style={{fontFamily:F.mono,fontSize:10,color:C.amber,marginTop:2}}>{i+1}.</span><span>{p}</span>
                </div>
              ))}
            </div>
          )}

          {(view==="schedule"||view==="scorecard") && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:16,background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:4}}>
              {[["schedule","Schedule"],["scorecard","Scorecard"]].map(([id,lbl]) => (
                <button key={id} onClick={()=>switchSub(id)} style={{padding:"10px",borderRadius:6,border:"none",background:subTab===id?C.green:"transparent",color:subTab===id?"#fff":C.mid,fontFamily:F.cond,fontSize:14,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
                  {lbl}
                </button>
              ))}
            </div>
          )}

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
                    ].map(opt => (
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
                        {[["30 min",30],["45 min",45],["1 hour",60],["1.5 hrs",90]].map(([l,v]) => (
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
                            {[["30 min",30],["45 min",45],["1 hour",60],["1.5 hrs",90]].map(([l,v]) => (
                              <Chip key={v} selected={meeting2Dur===v} onClick={()=>setMeeting2Dur(v)} color={C.olive}>{l}</Chip>
                            ))}
                          </div>
                          {parse12(...meeting2Time)<480&&!meeting2WarnAcked&&(
                            <div style={{marginTop:10,background:C.amberBg,border:`1px solid ${C.amberBd}`,borderRadius:6,padding:"8px 12px",fontSize:12,color:C.amber}}>
                              ⚠ 2nd meeting is set to {fmt(parse12(...meeting2Time))} — is that right?
                              <button onClick={()=>setMeeting2WarnAcked(true)} style={{marginLeft:10,fontSize:11,padding:"2px 8px",background:C.amber,color:"#fff",border:"none",borderRadius:4,cursor:"pointer"}}>Yes, confirm</button>
                            </div>
                          )}
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
                    <button style={{...btnP,flex:2,opacity:(hasMeeting!==null&&(hasMeeting===false||hasSecondMeeting!==null)&&!(hasSecondMeeting&&parse12(...meeting2Time)<480&&!meeting2WarnAcked))?1:0.35,pointerEvents:(hasMeeting!==null&&(hasMeeting===false||hasSecondMeeting!==null)&&!(hasSecondMeeting&&parse12(...meeting2Time)<480&&!meeting2WarnAcked))?"auto":"none"}} onClick={()=>setSqStep(3)}>Next →</button>
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
                    ].map(opt => (
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
                      <Label>Leave by</Label>
                      <TSel value={hardStopTime} onChange={setHardStopTime}/>
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

          {view==="preview" && (
            <div>
              <div style={{background:C.greenBg,border:`1px solid ${C.greenBd}`,borderRadius:8,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontFamily:F.cond,fontSize:15,fontWeight:700,color:C.green,marginBottom:4}}>Your day is built — done by {fmt(sched.endTime)}</div>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:14}}>Review your schedule below, then tap Accept. You won't be asked these questions again today.</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={acceptSched} style={{...btnP,flex:2}}>Accept Schedule</button>
                  {rebuildOk ? (
                    <div style={{flex:1,display:"flex",gap:4}}>
                      <button onClick={doRebuild} style={{...btnS,flex:1,fontSize:11,padding:"10px 4px",borderColor:C.red,color:C.red,width:"auto"}}>Yes</button>
                      <button onClick={()=>setRebuildOk(false)} style={{...btnS,flex:1,fontSize:11,padding:"10px 4px",width:"auto"}}>No</button>
                    </div>
                  ) : (
                    <button onClick={()=>setRebuildOk(true)} style={{...btnS,flex:1,width:"auto"}}>Rebuild</button>
                  )}
                </div>
              </div>
              {schedWarn.map((w,i) => <div key={i} style={{background:C.redBg,border:`1px solid ${C.redBd}`,borderRadius:6,padding:"8px 12px",marginBottom:8,fontSize:11,color:C.red}}>⚠ {w}</div>)}
              {renderBlocks()}
            </div>
          )}

          {view==="schedule" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.mid}}>Done by {fmt(sched.endTime)}</div>
                {rebuildOk ? (
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontFamily:F.mono,fontSize:9,color:C.red}}>Clears scorecard.</span>
                    <button onClick={doRebuild} style={{fontFamily:F.mono,fontSize:9,padding:"5px 8px",borderRadius:4,border:`1.5px solid ${C.red}`,background:C.redBg,color:C.red,cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setRebuildOk(false)} style={{fontFamily:F.mono,fontSize:9,padding:"5px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.card,color:C.mid,cursor:"pointer"}}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={()=>setRebuildOk(true)} style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.card,color:C.mid,cursor:"pointer"}}>Rebuild Day</button>
                )}
              </div>
              {schedWarn.map((w,i) => <div key={i} style={{background:C.redBg,border:`1px solid ${C.redBd}`,borderRadius:6,padding:"8px 12px",marginBottom:8,fontSize:11,color:C.red}}>⚠ {w}</div>)}
              {renderBlocks()}
            </div>
          )}

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
              {ACTS.filter(a=>a.section==="feed").map(act => (
                <ActRow key={act.id} act={act} val={counts[act.id]||0} onSet={v=>setCount(act.id,v)}/>
              ))}

              <div style={secSt}><span style={secTx}>Outcomes</span><div style={secLn}/></div>
              {ACTS.filter(a=>a.section==="outcome").map(act => (
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
                {tomorrow.map((val,i) => (
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
                <button onClick={copyReport} style={{...btnP,background:copied?C.green:C.blue,borderColor:copied?C.green:C.blue}}>
                  {copied?"Copied to Clipboard":"Copy Report"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="contacts" && (
        <div>
          <div style={{marginBottom:14}}>
            <input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search by name or phone..."
              style={{width:"100%",padding:"11px 14px",borderRadius:7,border:`1px solid ${C.rule}`,background:C.card,fontFamily:F.body,fontSize:13,color:C.ink,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["all","All"],["never","Never Contacted"],["cold","90+ Days"],["highrate","High Rate"]].map(([id,lbl]) => (
                <Chip key={id} selected={cFilter===id} onClick={()=>setCFilter(id)} color={C.blue}>{lbl}</Chip>
              ))}
            </div>
          </div>
          {contacts.length===0 ? (
            <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"32px 20px",textAlign:"center"}}>
              <div style={{fontFamily:F.cond,fontSize:16,fontWeight:700,color:C.mid,marginBottom:8}}>No Contacts Loaded</div>
              <div style={{fontFamily:F.mono,fontSize:10,color:C.light,marginBottom:20}}>Upload your tab-delimited export to get started.</div>
              <input ref={fRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFile} style={{display:"none"}}/>
              <button onClick={()=>fRef.current?.click()} style={{...btnP,maxWidth:240,margin:"0 auto"}}>Upload Contact File</button>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontFamily:F.mono,fontSize:10,color:C.mid}}>{filtC.length} contacts</span>
                <button onClick={()=>fRef.current?.click()} style={{fontFamily:F.mono,fontSize:9,padding:"4px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.card,color:C.mid,cursor:"pointer"}}>Replace</button>
                <input ref={fRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFile} style={{display:"none"}}/>
              </div>
              {selC ? (
                <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:10,padding:"18px 16px"}}>
                  <button onClick={()=>setSelC(null)} style={{fontFamily:F.mono,fontSize:9,padding:"4px 8px",borderRadius:4,border:`1px solid ${C.rule}`,background:C.bg,color:C.mid,cursor:"pointer",marginBottom:14}}>← Back</button>
                  <div style={{fontFamily:F.cond,fontSize:22,fontWeight:800,color:C.ink,marginBottom:4}}>{selC["First Name"]} {selC["Last Name"]}</div>
                  {selC["Co-Borrower First"] && <div style={{fontFamily:F.mono,fontSize:10,color:C.mid,marginBottom:12}}>Co-borrower: {selC["Co-Borrower First"]} {selC["Co-Borrower Last"]}</div>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                    {[
                      ["Note Rate", selC["Note Rate"]?`${selC["Note Rate"]}%`:"—"],
                      ["Loan Amount", selC["Loan Amount"]?`$${Number(selC["Loan Amount"]).toLocaleString()}`:"—"],
                      ["Appraised Value", selC["Appraised Value"]?`$${Number(selC["Appraised Value"]).toLocaleString()}`:"—"],
                      ["Birthday", selC["Birthday"]||"—"],
                      ["Source", selC["Source Category"]||"—"],
                      ["Last Contact", sLabels[cStatus(selC)]],
                    ].map(([k,v]) => (
                      <div key={k} style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:6,padding:"8px 10px"}}>
                        <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:2}}>{k}</div>
                        <div style={{fontFamily:F.cond,fontSize:14,fontWeight:700,color:C.ink}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginBottom:12}}>{selC["Property Address"]}, {selC["Property City"]}, {selC["Property State"]}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                    {[
                      ["Call", `tel:${selC["Phone"]}`],
                      ["Text", `sms:${selC["Phone"]}?body=Hi ${selC["First Name"]}, this is ${profile.name}. Just checking in.`],
                      ["Email", `mailto:${selC["Email"]}?subject=Checking in&body=Hi ${selC["First Name"]},\n\n${profile.name} here.\n\nBest,\n${profile.name}`],
                    ].map(([lbl,href]) => (
                      <a key={lbl} href={href} style={{display:"block",padding:"10px 0",textAlign:"center",borderRadius:6,border:`1.5px solid ${C.green}`,background:C.greenBg,color:C.green,fontFamily:F.cond,fontSize:13,fontWeight:700,textDecoration:"none"}}>{lbl}</a>
                    ))}
                  </div>
                  <button onClick={()=>{logC(selC);setSelC(null);}} style={{...btnP,background:C.green}}>Mark as Contacted Today</button>
                </div>
              ) : (
                <div>
                  {filtC.slice(0,50).map((c,i) => {
                    const st=cStatus(c), rf=rFlag(c);
                    return (
                      <div key={i} onClick={()=>setSelC(c)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"11px 14px",marginBottom:5,cursor:"pointer"}}>
                        <div>
                          <div style={{fontFamily:F.cond,fontSize:14,fontWeight:700,color:C.ink}}>{c["First Name"]} {c["Last Name"]}</div>
                          <div style={{fontFamily:F.mono,fontSize:9,color:C.light,marginTop:2}}>{c["Phone"]} · {c["Source Category"]||"—"}</div>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {c["Note Rate"] && <span style={{fontFamily:F.mono,fontSize:10,padding:"2px 6px",borderRadius:3,background:rf==="high"?C.redBg:C.stoneBg,color:rf==="high"?C.red:C.stone}}>{c["Note Rate"]}%</span>}
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

      {tab==="history" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[["Streak",`${streak}d`],["Total",totDays],["Complete",compDays],["Rate",`${compRate}%`]].map(([lbl,val]) => (
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
            <div style={{background:C.card,border:`1px solid ${C.rule}`,borderRadius:8,padding:"24px 16px",textAlign:"center",fontFamily:F.mono,fontSize:11,color:C.light}}>
              No history yet. Complete your first day to start the log.
            </div>
          ) : history.slice(0,30).map((entry,i) => {
            const hit = ACTS.filter(a=>a.goal>0).every(a=>(entry.counts?.[a.id]||0)>=a.goal) && entry.pb;
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

      {tab==="team" && (
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
            ].map(([k,v]) => (
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.rule}`}}>
                <span style={{fontFamily:F.mono,fontSize:11,color:C.light}}>{k}</span>
                <span style={{fontFamily:F.cond,fontSize:13,fontWeight:700,color:C.ink}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:28,paddingTop:14,borderTop:`1px solid ${C.rule}`,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.light,letterSpacing:"0.1em"}}>GET UNLOCKED PRODUCER</span>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.mid,letterSpacing:"0.1em"}}>GRAHAM FINANCIAL</span>
      </div>
    </div>
  );
}
