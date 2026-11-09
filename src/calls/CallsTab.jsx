// Calls — the daily call desk: queue on the left, one person at a time on the right.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import HowTo from "../HowTo.jsx";
import { GUIDES } from "../howto/guides.jsx";
import { today, addDays, digits, fullName, fmtMo, loadRadarData, peekRadarData, wrongNumberEmail, computeRadar, buildQueue, investorQueue, APPLY, isInvestor, bdayCallable, reasonFor, scriptsFor, logOutcome, undoOutcome, canUndo, segmentOf, REASON_COLOR, REASON_BG } from "../radar/engine.js";
import { supabase } from "../supabase.js";
import EmailDesk from "./EmailDesk.jsx";
import QuickUpdate from "./QuickUpdate.jsx";
import Playbook from "./Playbook.jsx";
import { personFirst, sunbizUrl, isEntity } from "../radar/investorPlaybook.js";
import { LeadStory, useLead } from "../contacts/InvestorPanel.jsx";
import AgentResearch from "../contacts/AgentResearch.jsx";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0", greenBg:"#e6f2ea" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, letterSpacing:"0.04em", padding:"8px 14px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:13, color:C.ink, boxSizing:"border-box" };
const TARGETS = [10, 15, 20, 30, 40, 50];
const OUTCOMES = [["talked","Talked",30],["voicemail","Voicemail",3],["no answer","No answer",2],["booked","Booked",null],["not interested","Not interested",180],["wrong number","Wrong number",null]];

// Daily call block: 1:00-3:00 PM Eastern.
function callBlock() {
  const et = new Date(new Date().toLocaleString("en-US", { timeZone:"America/New_York" }));
  const m = et.getHours() * 60 + et.getMinutes(), start = 13 * 60, end = 15 * 60;
  if (m >= start && m < end) return { live:true, text:`Call block live: ${end - m} min left` };
  if (m < start) { const d = start - m; return { live:false, text:`Call block 1-3 PM ET starts in ${d >= 60 ? `${Math.floor(d / 60)}h ${d % 60}m` : `${d} min`}` }; }
  return { live:false, text:"Call block 1-3 PM ET done for today" };
}

function useWide() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return w >= 900;
}

export default function CallsTab({ userId, contacts, setContacts, profileName, onOpen, onGoRadar }) {
  const wide = useWide();
  const [data, setData] = useState(() => peekRadarData(userId));
  const [pinned, setPinned] = useState(null);      // a contact opened from the callback finder or Called today, even if not on today's list
  const [find, setFind] = useState("");
  const [calledToday, setCalledToday] = useState([]);
  const listRef = useRef(null); const focusRef = useRef(null);
  const [target, setTarget] = useState(() => { try { return Number(localStorage.getItem(`gupTarget:${userId}`)) || 20; } catch { return 20; } });
  const [selId, setSelId] = useState(null);
  const [note, setNote] = useState(""); const [fu, setFu] = useState("");
  const [follow, setFollow] = useState(null);      // after voicemail / no answer: show text + email follow-up
  const [say, setSay] = useState("");
  const [nonce, setNonce] = useState(0);
  const [seg, setSeg] = useState("customers");
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(i); }, []);

  useEffect(() => { if (userId) loadRadarData(userId).then(setData); }, [userId]);
  // Everyone dialed today, newest first, from the call log.
  const loadCalled = useCallback(async () => {
    if (!userId) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data: t } = await supabase.from("contact_touches").select("contact_id,touched_at,outcome").eq("user_id", userId).eq("channel", "call").gte("touched_at", start.toISOString()).order("touched_at", { ascending:false }).limit(300);
    const seen = new Set(); setCalledToday((t || []).filter((x) => !seen.has(x.contact_id) && seen.add(x.contact_id)));
  }, [userId]);
  useEffect(() => { loadCalled(); }, [loadCalled]);
  const radar = useMemo(() => data ? computeRadar(contacts, data.loans, data.rates, data.settings) : null, [contacts, data]);
  const byId = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);

  const qKey = `gupCalls:${userId}:${today()}`;
  const skipKey = `gupSkip:${userId}:${today()}`;
  const queue = useMemo(() => {
    if (!radar) return null;
    let saved = null; try { saved = JSON.parse(localStorage.getItem(qKey) || "null"); } catch {}
    if (saved && saved.target === target && Array.isArray(saved.items)) return saved.items.filter((x) => byId[x.id] && (!x.bday || byId[x.id].last_contacted === today() || bdayCallable(byId[x.id]))).map((x) => ({ ...x, group: x.group || segmentOf(byId[x.id]) }));
    const items = buildQueue(contacts, radar, target);
    try { localStorage.setItem(qKey, JSON.stringify({ target, items })); } catch {}
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radar, target, qKey, nonce]);
  const skipped = useMemo(() => { try { return JSON.parse(localStorage.getItem(skipKey) || "[]"); } catch { return []; } }, [skipKey, nonce]);

  // Investors are live (not cached): new imports and follow-ups show up right away.
  const invQ = useMemo(() => investorQueue(contacts), [contacts]);
  const all = useMemo(() => queue ? [...queue.filter((x) => !isInvestor(byId[x.id])), ...invQ] : null, [queue, invQ, byId]);
  const segQ = useMemo(() => all ? all.filter((x) => x.group === seg) : null, [all, seg]);
  const isDone = useCallback((id) => byId[id]?.last_contacted === today() || skipped.includes(id), [byId, skipped]);
  const segDone = (g) => all ? all.filter((x) => x.group === g && byId[x.id]?.last_contacted === today()).length : 0;
  const segN = (g) => all ? all.filter((x) => x.group === g).length : 0;
  const made = all ? all.filter((x) => byId[x.id]?.last_contacted === today()).length : 0;
  const talked = all ? all.filter((x) => byId[x.id]?.last_contacted === today() && byId[x.id]?.outcome === "talked").length : 0;
  const booked = all ? all.filter((x) => byId[x.id]?.last_contacted === today() && byId[x.id]?.outcome === "booked").length : 0;

  useEffect(() => { if (segQ && selId !== pinned && (!selId || !segQ.find((x) => x.id === selId))) { const n = segQ.find((x) => !isDone(x.id)); setSelId(n ? n.id : segQ[0]?.id || null); } }, [segQ, selId, isDone, pinned]);
  const sel = selId ? byId[selId] : null;
  const invLead = useLead(sel && isInvestor(sel) ? sel.id : null);
  const item = all?.find((x) => x.id === selId);
  const info = sel ? radar?.info[sel.id] : null;
  const reason = sel ? (reasonFor(sel, info) || item?.reason) : null;
  const scripts = sel ? scriptsFor(sel, info, item?.reason || reason, profileName || "Joshua Graham") : null;
  useEffect(() => { setSay(scripts?.say || ""); setNote(""); setFu(""); setFollow(null); }, [selId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPerson = (id) => {
    const inQ = all?.find((x) => x.id === id);
    if (inQ && inQ.group !== seg) setSeg(inQ.group);
    if (!inQ && seg === "emails") setSeg("customers");
    setPinned(inQ ? null : id); setSelId(id); setFind("");
    setTimeout(() => focusRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  };
  const findDigits = digits(find); const findText = find.trim().toLowerCase();
  const found = useMemo(() => {
    if (findDigits.length >= 3) return contacts.filter((c) => [c.phone, c.phone_2, c.co_borrower_phone].some((ph) => digits(ph).includes(findDigits))).slice(0, 8);
    if (findText.length >= 2 && !findDigits) return contacts.filter((c) => `${fullName(c)} ${c.co_borrower_first || ""} ${c.co_borrower_last || ""}`.toLowerCase().includes(findText)).slice(0, 8);
    return [];
  }, [contacts, findDigits, findText]);
  const next = () => { const q = segQ; const idx = q.findIndex((x) => x.id === selId); const n = q.slice(idx + 1).find((x) => !isDone(x.id)) || q.find((x) => !isDone(x.id) && x.id !== selId); if (n) setSelId(n.id); };
  const undo = async () => {
    const upd = await undoOutcome(userId, sel.id);
    if (upd) setContacts((p) => p.map((x) => (x.id === upd.id ? upd : x)));
    setFollow(null); loadCalled();
  };
  const unskip = () => { try { localStorage.setItem(skipKey, JSON.stringify(skipped.filter((x) => x !== selId))); } catch {} setNonce((n) => n + 1); };
  const record = async (result, days) => {
    const followUp = fu || (days ? addDays(days) : null);
    const upd = await logOutcome(userId, sel, result, note, followUp);
    if (upd) setContacts((p) => p.map((x) => (x.id === upd.id ? upd : x)));
    loadCalled();
    if (result === "voicemail" || result === "no answer" || result === "wrong number") setFollow(result); else next();
  };
  const sentFollow = async (channel) => {
    await supabase.from("contact_touches").insert({ user_id:userId, contact_id:sel.id, channel, outcome:"sent follow-up" });
    setDepBump((n) => n + 1);
  };
  // Deposits: every contact attempt (calls, voicemails, texts, emails, handwritten notes) before asking for business.
  const [deposits, setDeposits] = useState(null); const [depBump, setDepBump] = useState(0);
  useEffect(() => { if (!sel?.id) return; let live = true;
    supabase.from("contact_touches").select("id", { count:"exact", head:true }).eq("contact_id", sel.id).neq("channel", "update")
      .then(({ count }) => { if (live) setDeposits({ id:sel.id, n:count || 0 }); });
    return () => { live = false; };
  }, [sel?.id, depBump, calledToday]); // eslint-disable-line react-hooks/exhaustive-deps
  const logCard = async () => {
    await supabase.from("contact_touches").insert({ user_id:userId, contact_id:sel.id, channel:"card", outcome:"handwritten note" });
    setDepBump((n) => n + 1);
  };
  const skip = () => { try { localStorage.setItem(skipKey, JSON.stringify([...skipped, selId])); } catch {} setNonce((n) => n + 1); next(); };
  const rebuild = () => { try { localStorage.removeItem(qKey); } catch {} setSelId(null); setNonce((n) => n + 1); };
  const changeTarget = (t) => { setTarget(t); try { localStorage.setItem(`gupTarget:${userId}`, String(t)); localStorage.removeItem(qKey); } catch {} setSelId(null); };

  const ratesStale = data && data.ratesDay !== today();
  if (!queue) return <div style={{fontFamily:F.mono, fontSize:12, color:C.light}}>Building today's calls…</div>;

  const List = (
    <div ref={listRef} style={{...card, overflow:"hidden", alignSelf:"start", scrollMarginTop:10}}>
      <div style={{padding:"16px 18px", borderBottom:`1px solid ${C.rule}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:24}}>Today's Calls</div>
          <div style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}</div>
        </div>
        {(() => { const b = callBlock(); return <div style={{marginTop:8, fontFamily:F.mono, fontSize:11, padding:"5px 8px", borderRadius:6, background: b.live ? C.green : C.bg, color: b.live ? "#fff" : C.mid}}>{b.text}</div>; })()}
        <div style={{display:"flex", justifyContent:"space-between", margin:"10px 0 6px", fontFamily:F.mono, fontSize:11, color:C.ink}}>
          <span>{made} of {all.length} calls made</span><span>{talked} talked · {booked} booked</span>
        </div>
        <div style={{height:8, borderRadius:4, background:C.rule, overflow:"hidden"}}><div style={{height:"100%", width:`${all.length ? (made / all.length) * 100 : 0}%`, background:C.green}}/></div>
        <div style={{display:"flex", gap:8, alignItems:"center", marginTop:12}}>
          <span style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>Daily target</span>
          <select value={target} onChange={(e) => changeTarget(Number(e.target.value))} style={{...inp, padding:"4px 6px"}}>{TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <button onClick={rebuild} style={{...btn, padding:"4px 10px", fontSize:12, marginLeft:"auto"}}>Rebuild list</button>
        </div>
        {ratesStale && (
          <div style={{marginTop:10, background:C.amberBg, color:C.amber, fontFamily:F.mono, fontSize:11, padding:"7px 9px", borderRadius:6, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
            <span>Enter today's market rates so rate opportunities rank first.</span>
            <button onClick={onGoRadar} style={{...btn, padding:"3px 8px", fontSize:12}}>Radar</button>
          </div>
        )}
      </div>
      <div style={{maxHeight: wide ? "calc(100vh - 290px)" : "none", overflowY:"auto"}}>
        {segQ.map((x, n) => {
          const c = byId[x.id]; if (!c) return null; const d = isDone(x.id); const on = x.id === selId;
          return (
            <div key={x.id} onClick={() => { setPinned(null); setSelId(x.id); }} style={{display:"flex", gap:12, padding:"11px 18px", borderBottom:`1px solid ${C.rule}`, cursor:"pointer", background:on ? "#fff" : "transparent", borderLeft:on ? `4px solid ${C.green}` : "4px solid transparent", opacity:d && !on ? 0.45 : 1}}>
              <div style={{fontFamily:F.mono, fontSize:11, color:C.light, width:18, paddingTop:3}}>{n + 1}</div>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:F.cond, fontWeight:700, fontSize:17, textDecoration:d ? "line-through" : "none"}}>{fullName(c)}</div>
                <div style={{fontSize:13, color:C.ink, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                  <span style={{display:"inline-block", width:8, height:8, borderRadius:"50%", background:REASON_COLOR[x.reason.key] || C.mid, marginRight:8}}/>
                  {x.reason.title}{x.reason.detail ? ` · ${x.reason.detail}` : ""}{!c.phone ? " · no phone" : ""}
                </div>
              </div>
            </div>
          );
        })}
        {segQ.length === 0 && <div style={{padding:18, fontFamily:F.mono, fontSize:12, color:C.light}}>Nobody due today. Rebuild after entering rates, or raise the target.</div>}
      </div>
    </div>
  );

  const facts = !sel ? [] : (sel.contact_type === "agent"
    ? [["BROKERAGE", sel.company || "—"], ["ROLE", sel.agent_role || "—"], ["CLOSED DEALS", (sel.tags || []).includes("closed deal together") ? "Yes" : "—"], ["LAST CALL", sel.last_contacted || "Never"]]
    : [["NOTE RATE", info?.rate ? `${info.rate}%` : "—"], ["LOAN TYPE", info?.type ? `${info.type}${info.est ? " (est.)" : ""}` : "—"], ["FUNDED", info?.funded ? fmtMo(info.funded) : "—"], ["LAST CALL", sel.last_contacted || "Never"]]);

  const Focus = !sel ? <div style={{...card, padding:30, fontFamily:F.mono, color:C.light}}>Pick someone from the list.</div> : (
    <div ref={focusRef} style={{...card, padding: wide ? "26px 30px" : "18px", scrollMarginTop:10}}>
      {!wide && <button onClick={() => listRef.current?.scrollIntoView({ behavior:"smooth", block:"start" })} style={{...btn, padding:"5px 12px", fontSize:13, marginBottom:12}}>Back to list</button>}
      {deposits?.id === sel.id && (() => { const n = deposits.n; const [txt, col, bg] = n < 3 ? [`Deposit ${n} of 3-7. Keep giving.`, C.amber, C.amberBg] : n <= 7 ? [`Deposit ${n} of 3-7. Ready to ask.`, C.green, C.greenBg] : [`Deposit ${n}. Make the ask.`, C.green, C.greenBg]; return (
        <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:10}}>
          <span style={{fontFamily:F.mono, fontSize:12, fontWeight:700, color:col, background:bg, padding:"4px 10px", borderRadius:12}}>{txt}</span>
          <button onClick={logCard} style={{...btn, padding:"3px 10px", fontSize:12}}>+ Handwritten note</button>
        </div>); })()}
      {pinned === sel.id && <div style={{fontFamily:F.mono, fontSize:11, color:C.amber, marginBottom:8}}>Not on today's call list. Opened from search.</div>}
      <div style={{display:"flex", justifyContent:"space-between", gap:16, flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:34, lineHeight:1}}>{fullName(sel)}</div>
          <div style={{fontFamily:F.mono, fontSize:12, color:C.mid, marginTop:6}}>
            {[sel.contact_type === "agent" ? "Agent" : sel.contact_type === "lead" ? "Lead" : sel.book === "past LO" ? "Past LO funding" : "Your client",
              sel.co_borrower_first && `co-borrower ${sel.co_borrower_first} ${sel.co_borrower_last || ""}`.trim(), [sel.city, sel.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{fontFamily:F.mono, fontSize:13, textAlign:"right", lineHeight:1.6}}>
          <a href={`tel:${digits(sel.phone)}`} style={{color:C.ink, textDecoration:"none"}}>{sel.phone}</a><br/>
          <span style={{color:C.mid}}>{sel.email || ""}</span>
        </div>
      </div>
      {reason && (
        <div style={{margin:"16px 0", padding:"14px 16px", borderRadius:8, background:REASON_BG[reason.key], borderLeft:`4px solid ${REASON_COLOR[reason.key]}`}}>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:21, color:REASON_COLOR[reason.key]}}>Why now: {reason.title}</div>
          <div style={{fontSize:14, marginTop:2}}>{reason.detail}{reason.also?.length ? <span style={{color:C.mid}}> · also: {reason.also.join(", ")}</span> : null}</div>
        </div>
      )}
      <div style={{display:"grid", gridTemplateColumns: wide ? "repeat(4,1fr)" : "repeat(2,1fr)", gap:10, margin:"14px 0"}}>
        {facts.map(([k, v]) => <div key={k} style={{background:C.bg, borderRadius:8, padding:"10px 12px"}}><div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{k}</div><div style={{fontFamily:F.cond, fontWeight:700, fontSize:20}}>{v}</div></div>)}
      </div>
      <div style={lbl}>Say this</div>
      <textarea value={say} onChange={(e) => setSay(e.target.value)} rows={4} style={{...inp, width:"100%", marginTop:6, fontSize:15, lineHeight:1.55, resize:"vertical", fontFamily:F.body}}/>
      {sel.phone ? <a href={`tel:${digits(sel.phone)}`} style={{display:"block", textAlign:"center", fontFamily:F.cond, fontWeight:800, fontSize:22, letterSpacing:"0.06em", background:C.green, color:"#fff", borderRadius:9, padding:14, margin:"16px 0 12px", textDecoration:"none"}}>
        CALL {(personFirst(sel) || "").toUpperCase()}
      </a> : (
        <div style={{margin:"16px 0 12px", padding:"12px 14px", borderRadius:9, background:C.amberBg, color:C.amber, fontFamily:F.mono, fontSize:12, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
          <span>No phone on file.</span>
          {sel.email && <a href={`mailto:${sel.email}?subject=${encodeURIComponent(scripts.emailSubject)}&body=${encodeURIComponent(scripts.emailBody)}`} onClick={() => logOutcome(userId, sel, "emailed", "", undefined, "email").then((u) => u && setContacts((p) => p.map((x) => (x.id === u.id ? u : x))))} style={btnG}>Send email</a>}
          <button onClick={() => onOpen(sel)} style={btn}>Add a phone number</button>
        </div>
      )}
      <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:12}}>
        <span style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>Ready? Apply link:</span>
        {sel.phone && <a href={`sms:${digits(sel.phone)}?body=${encodeURIComponent(`Here's the link to get started: https://${APPLY} . It takes about 10 minutes, and I'm right here if you get stuck. - Joshua`)}`} style={btnG}>Text apply link</a>}
        {sel.email && <a href={`mailto:${sel.email}?subject=${encodeURIComponent("Your application link")}&body=${encodeURIComponent(`Hi ${personFirst(sel) || "there"},\n\nHere's the link to get started: https://${APPLY}\n\nIt takes about 10 minutes, and I'm right here if you get stuck.\n\nJoshua Graham\n${"720-468-6872"}`)}`} style={btn}>Email apply link</a>}
        <button onClick={() => navigator.clipboard?.writeText(`https://${APPLY}`)} style={btn}>Copy</button>
      </div>
      {isInvestor(sel) && (
        <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:12}}>
          {sel.email && <a href={`mailto:${sel.email}?subject=${encodeURIComponent(scripts.emailSubject)}&body=${encodeURIComponent(scripts.emailBody)}`} onClick={() => logOutcome(userId, sel, "emailed", "", undefined, "email").then((u) => u && setContacts((p) => p.map((x) => (x.id === u.id ? u : x))))} style={btnG}>Send email</a>}
          <button onClick={() => navigator.clipboard?.writeText(`Subject: ${scripts.emailSubject}\n\n${scripts.emailBody}`)} style={btn}>Copy email</button>
          {(sel.company || isEntity(sel.first_name)) && <a href={sunbizUrl(sel.company || sel.first_name)} target="_blank" rel="noreferrer" style={btn}>Look up owner (Sunbiz)</a>}
          {!personFirst(sel) && <span style={{fontFamily:F.mono, fontSize:11, color:C.amber}}>No owner name yet: add it in Open full contact</span>}
        </div>
      )}
      {(sel.contact_type || "") === "agent" && <AgentResearch c={sel} compact/>}
      {isInvestor(sel) && <LeadStory c={sel} lead={invLead} contacts={contacts} onOpen={onOpen}/>}
      {scripts?.playbook && <Playbook pb={scripts.playbook}/>}
      {sel.last_contacted === today() && !follow && (
        <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:10, padding:"9px 12px", borderRadius:8, background:"#fff", border:`1px solid ${C.rule}`}}>
          <span style={{fontFamily:F.mono, fontSize:12}}>Logged today: <b>{sel.outcome}</b></span>
          {canUndo(userId, sel.id) && <button onClick={undo} style={{...btn, padding:"4px 12px", marginLeft:"auto"}}>Undo</button>}
        </div>
      )}
      {skipped.includes(sel.id) && <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:10, fontFamily:F.mono, fontSize:12}}>Skipped for today. <button onClick={unskip} style={{...btn, padding:"4px 12px"}}>Unskip</button></div>}
      {follow ? (
        <div style={{background:"#fff", border:`1px solid ${C.rule}`, borderRadius:8, padding:"14px 16px"}}>
          {follow === "wrong number" ? (() => { const w = wrongNumberEmail(sel, profileName || "Joshua Graham"); return (<>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:18, marginBottom:6}}>Logged: wrong number. Ask for the new one?</div>
          {sel.email ? <div style={{fontSize:14, lineHeight:1.5, color:C.ink, marginBottom:10, whiteSpace:"pre-wrap"}}>{w.body}</div>
            : <div style={{fontFamily:F.mono, fontSize:12, color:C.amber, marginBottom:10}}>No email on file, so there's no way to ask. Add one if you find it.</div>}
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {sel.email && <a href={`mailto:${sel.email}?subject=${encodeURIComponent(w.subject)}&body=${encodeURIComponent(w.body)}`} onClick={() => sentFollow("email")} style={btnG}>Send email</a>}
            {sel.email && <button onClick={() => navigator.clipboard?.writeText(w.body)} style={btn}>Copy email</button>}
            {!sel.email && <button onClick={() => onOpen(sel)} style={btn}>Open full contact</button>}
            <button onClick={undo} style={{...btn, marginLeft:"auto"}}>Undo</button>
            <button onClick={next} style={btn}>Next call</button>
          </div></>); })() : <>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:18, marginBottom:6}}>Logged: {follow}. Send a quick follow-up?</div>
          <div style={{fontSize:14, lineHeight:1.5, color:C.ink, marginBottom:10}}>{scripts.vmText}</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <a href={`sms:${digits(sel.phone)}?body=${encodeURIComponent(scripts.vmText)}`} onClick={() => sentFollow("text")} style={btnG}>Send text</a>
            {sel.email && <a href={`mailto:${sel.email}?subject=${encodeURIComponent(scripts.emailSubject)}&body=${encodeURIComponent(scripts.emailBody)}`} onClick={() => sentFollow("email")} style={btnG}>Send email</a>}
            <button onClick={() => navigator.clipboard?.writeText(scripts.vmText)} style={btn}>Copy text</button>
            <button onClick={undo} style={{...btn, marginLeft:"auto"}}>Undo</button>
            <button onClick={next} style={btn}>Next call</button>
          </div></>}
        </div>
      ) : (
        <>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {OUTCOMES.map(([k, l, d]) => <button key={k} onClick={() => record(k, d)} style={k === "booked" ? btnG : btn}>{k === "voicemail" ? "Voicemail + follow-up" : l}</button>)}
            <button onClick={skip} style={{...btn, marginLeft:"auto"}}>Skip for today</button>
          </div>
          <div style={{display:"flex", gap:8, marginTop:10, flexWrap:"wrap"}}>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" style={{...inp, flex:"1 1 220px"}}/>
            <input type="date" value={fu} onChange={(e) => setFu(e.target.value)} title="Custom follow-up date (optional)" style={{...inp, width:160}}/>
            <button onClick={() => onOpen(sel)} style={btn}>Open full contact</button>
          </div>
        </>
      )}
      <QuickUpdate key={sel.id} userId={userId} c={sel} setContacts={setContacts} onLoansChanged={() => loadRadarData(userId).then(setData)}/>
    </div>
  );

  return (
    <div>
      <HowTo id="calls" {...GUIDES.calls} defaultOpen={false}/>
      <div style={{...card, padding:"10px 12px", marginBottom:12}}>
        <input value={find} onChange={(e) => setFind(e.target.value)} inputMode="search" placeholder="Who called? Last 4 digits or a name" style={{...inp, width:"100%", fontSize:16}}/>
        {found.length > 0 && <div style={{marginTop:8, display:"grid", gap:4}}>
          {found.map((c) => <button key={c.id} onClick={() => openPerson(c.id)} style={{...btn, textAlign:"left", display:"flex", justifyContent:"space-between", gap:8, color:C.ink}}>
            <span>{fullName(c)}</span><span style={{fontFamily:F.mono, fontSize:12, color:C.mid}}>{c.phone || ""}</span></button>)}
        </div>}
        {(findDigits.length >= 3 || (findText.length >= 2 && !findDigits)) && found.length === 0 && <div style={{marginTop:6, fontFamily:F.mono, fontSize:12, color:C.light}}>No match in your contacts.</div>}
        {calledToday.length > 0 && <>
          <div style={{...lbl, marginTop:10, marginBottom:6}}>Called today</div>
          <div style={{display:"flex", gap:6, overflowX:"auto", paddingBottom:4}}>
            {calledToday.map((x) => { const c = byId[x.contact_id]; if (!c) return null; return (
              <button key={x.contact_id} onClick={() => openPerson(c.id)} style={{...(selId === c.id ? btnG : btn), whiteSpace:"nowrap", flex:"0 0 auto", padding:"6px 11px", fontSize:13}}>
                {fullName(c)} <span style={{opacity:0.7, fontWeight:400}}>{new Date(x.touched_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" })}</span>
              </button>); })}
          </div></>}
      </div>
      <div style={{display:"flex", gap:8, marginBottom:14, flexWrap:"wrap"}}>
        {[["customers",`Customers ${segDone("customers")}/${segN("customers")}`],["agents",`Agents ${segDone("agents")}/${segN("agents")}`],["investors",`Investors ${segDone("investors")}/${segN("investors")}`],["emails","Emails"]].map(([k, l]) => (
          <button key={k} onClick={() => { setSeg(k); setSelId(null); }} style={{...(seg === k ? btnG : btn), padding:"9px 18px", fontSize:15}}>{l}</button>
        ))}
      </div>
      {seg === "emails" ? <EmailDesk userId={userId} contacts={contacts} setContacts={setContacts} callIds={(all || []).map((x) => x.id)} wide={wide} onOpen={onOpen}/> : (
      <div style={{display:"grid", gridTemplateColumns: wide ? "400px 1fr" : "1fr", gap:18}}>
        {wide ? <>{List}{Focus}</> : <>{Focus}{List}</>}
      </div>)}
    </div>
  );
}
