// Calls — the daily call desk: queue on the left, one person at a time on the right.
import { useState, useEffect, useMemo, useCallback } from "react";
import HowTo from "../HowTo.jsx";
import { GUIDES } from "../howto/guides.jsx";
import { today, addDays, digits, fullName, fmtMo, loadRadarData, computeRadar, buildQueue, reasonFor, scriptsFor, logOutcome, REASON_COLOR, REASON_BG } from "../radar/engine.js";
import { supabase } from "../supabase.js";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, letterSpacing:"0.04em", padding:"8px 14px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:13, color:C.ink, boxSizing:"border-box" };
const TARGETS = [10, 15, 20, 30, 40, 50];
const OUTCOMES = [["talked","Talked",30],["voicemail","Voicemail",3],["no answer","No answer",2],["booked","Booked",null],["not interested","Not interested",180],["wrong number","Wrong number",null]];

function useWide() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return w >= 900;
}

export default function CallsTab({ userId, contacts, setContacts, profileName, onOpen, onGoRadar }) {
  const wide = useWide();
  const [data, setData] = useState(null);
  const [target, setTarget] = useState(() => { try { return Number(localStorage.getItem(`gupTarget:${userId}`)) || 20; } catch { return 20; } });
  const [selId, setSelId] = useState(null);
  const [note, setNote] = useState(""); const [fu, setFu] = useState("");
  const [follow, setFollow] = useState(null);      // after voicemail / no answer: show text + email follow-up
  const [say, setSay] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => { if (userId) loadRadarData(userId).then(setData); }, [userId]);
  const radar = useMemo(() => data ? computeRadar(contacts, data.loans, data.rates, data.settings) : null, [contacts, data]);
  const byId = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);

  const qKey = `gupCalls:${userId}:${today()}`;
  const skipKey = `gupSkip:${userId}:${today()}`;
  const queue = useMemo(() => {
    if (!radar) return null;
    let saved = null; try { saved = JSON.parse(localStorage.getItem(qKey) || "null"); } catch {}
    if (saved && saved.target === target && Array.isArray(saved.items)) return saved.items.filter((x) => byId[x.id]);
    const items = buildQueue(contacts, radar, target);
    try { localStorage.setItem(qKey, JSON.stringify({ target, items })); } catch {}
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radar, target, qKey, nonce]);
  const skipped = useMemo(() => { try { return JSON.parse(localStorage.getItem(skipKey) || "[]"); } catch { return []; } }, [skipKey, nonce]);

  const isDone = useCallback((id) => byId[id]?.last_contacted === today() || skipped.includes(id), [byId, skipped]);
  const made = queue ? queue.filter((x) => byId[x.id]?.last_contacted === today()).length : 0;
  const talked = queue ? queue.filter((x) => byId[x.id]?.last_contacted === today() && byId[x.id]?.outcome === "talked").length : 0;
  const booked = queue ? queue.filter((x) => byId[x.id]?.last_contacted === today() && byId[x.id]?.outcome === "booked").length : 0;

  useEffect(() => { if (queue && (!selId || !queue.find((x) => x.id === selId))) { const n = queue.find((x) => !isDone(x.id)); setSelId(n ? n.id : queue[0]?.id || null); } }, [queue, selId, isDone]);
  const sel = selId ? byId[selId] : null;
  const item = queue?.find((x) => x.id === selId);
  const info = sel ? radar?.info[sel.id] : null;
  const reason = sel ? (reasonFor(sel, info) || item?.reason) : null;
  const scripts = sel ? scriptsFor(sel, info, item?.reason || reason, profileName || "Joshua Graham") : null;
  useEffect(() => { setSay(scripts?.say || ""); setNote(""); setFu(""); setFollow(null); }, [selId]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => { const idx = queue.findIndex((x) => x.id === selId); const n = queue.slice(idx + 1).find((x) => !isDone(x.id)) || queue.find((x) => !isDone(x.id) && x.id !== selId); if (n) setSelId(n.id); };
  const record = async (result, days) => {
    const followUp = fu || (days ? addDays(days) : null);
    const upd = await logOutcome(userId, sel, result, note, followUp);
    if (upd) setContacts((p) => p.map((x) => (x.id === upd.id ? upd : x)));
    if (result === "voicemail" || result === "no answer") setFollow(result); else next();
  };
  const sentFollow = async (channel) => {
    await supabase.from("contact_touches").insert({ user_id:userId, contact_id:sel.id, channel, outcome:"sent follow-up" });
  };
  const skip = () => { try { localStorage.setItem(skipKey, JSON.stringify([...skipped, selId])); } catch {} setNonce((n) => n + 1); next(); };
  const rebuild = () => { try { localStorage.removeItem(qKey); } catch {} setSelId(null); setNonce((n) => n + 1); };
  const changeTarget = (t) => { setTarget(t); try { localStorage.setItem(`gupTarget:${userId}`, String(t)); localStorage.removeItem(qKey); } catch {} setSelId(null); };

  const ratesStale = data && data.ratesDay !== today();
  if (!queue) return <div style={{fontFamily:F.mono, fontSize:12, color:C.light}}>Building today's calls…</div>;

  const List = (
    <div style={{...card, overflow:"hidden", alignSelf:"start"}}>
      <div style={{padding:"16px 18px", borderBottom:`1px solid ${C.rule}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:24}}>Today's Calls</div>
          <div style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}</div>
        </div>
        <div style={{display:"flex", justifyContent:"space-between", margin:"10px 0 6px", fontFamily:F.mono, fontSize:11, color:C.ink}}>
          <span>{made} of {queue.length} calls made</span><span>{talked} talked · {booked} booked</span>
        </div>
        <div style={{height:8, borderRadius:4, background:C.rule, overflow:"hidden"}}><div style={{height:"100%", width:`${queue.length ? (made / queue.length) * 100 : 0}%`, background:C.green}}/></div>
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
        {queue.map((x, n) => {
          const c = byId[x.id]; if (!c) return null; const d = isDone(x.id); const on = x.id === selId;
          return (
            <div key={x.id} onClick={() => setSelId(x.id)} style={{display:"flex", gap:12, padding:"11px 18px", borderBottom:`1px solid ${C.rule}`, cursor:"pointer", background:on ? "#fff" : "transparent", borderLeft:on ? `4px solid ${C.green}` : "4px solid transparent", opacity:d && !on ? 0.45 : 1}}>
              <div style={{fontFamily:F.mono, fontSize:11, color:C.light, width:18, paddingTop:3}}>{n + 1}</div>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:F.cond, fontWeight:700, fontSize:17, textDecoration:d ? "line-through" : "none"}}>{fullName(c)}</div>
                <div style={{fontSize:13, color:C.ink, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                  <span style={{display:"inline-block", width:8, height:8, borderRadius:"50%", background:REASON_COLOR[x.reason.key] || C.mid, marginRight:8}}/>
                  {x.reason.title}{x.reason.detail ? ` · ${x.reason.detail}` : ""}
                </div>
              </div>
            </div>
          );
        })}
        {queue.length === 0 && <div style={{padding:18, fontFamily:F.mono, fontSize:12, color:C.light}}>Nobody due today. Rebuild after entering rates, or raise the target.</div>}
      </div>
    </div>
  );

  const facts = !sel ? [] : (sel.contact_type === "agent"
    ? [["BROKERAGE", sel.company || "—"], ["ROLE", sel.agent_role || "—"], ["CLOSED DEALS", (sel.tags || []).includes("closed deal together") ? "Yes" : "—"], ["LAST CALL", sel.last_contacted || "Never"]]
    : [["NOTE RATE", info?.rate ? `${info.rate}%` : "—"], ["LOAN TYPE", info?.type ? `${info.type}${info.est ? " (est.)" : ""}` : "—"], ["FUNDED", info?.funded ? fmtMo(info.funded) : "—"], ["LAST CALL", sel.last_contacted || "Never"]]);

  const Focus = !sel ? <div style={{...card, padding:30, fontFamily:F.mono, color:C.light}}>Pick someone from the list.</div> : (
    <div style={{...card, padding: wide ? "26px 30px" : "18px"}}>
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
      <a href={`tel:${digits(sel.phone)}`} style={{display:"block", textAlign:"center", fontFamily:F.cond, fontWeight:800, fontSize:22, letterSpacing:"0.06em", background:C.green, color:"#fff", borderRadius:9, padding:14, margin:"16px 0 12px", textDecoration:"none"}}>
        CALL {(sel.first_name || "").toUpperCase()}
      </a>
      {follow ? (
        <div style={{background:"#fff", border:`1px solid ${C.rule}`, borderRadius:8, padding:"14px 16px"}}>
          <div style={{fontFamily:F.cond, fontWeight:800, fontSize:18, marginBottom:6}}>Logged: {follow}. Send a quick follow-up?</div>
          <div style={{fontSize:14, lineHeight:1.5, color:C.ink, marginBottom:10}}>{scripts.vmText}</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <a href={`sms:${digits(sel.phone)}?body=${encodeURIComponent(scripts.vmText)}`} onClick={() => sentFollow("text")} style={btnG}>Send text</a>
            {sel.email && <a href={`mailto:${sel.email}?subject=${encodeURIComponent(scripts.emailSubject)}&body=${encodeURIComponent(scripts.emailBody)}`} onClick={() => sentFollow("email")} style={btnG}>Send email</a>}
            <button onClick={() => navigator.clipboard?.writeText(scripts.vmText)} style={btn}>Copy text</button>
            <button onClick={next} style={{...btn, marginLeft:"auto"}}>Next call</button>
          </div>
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
    </div>
  );

  return (
    <div>
      <HowTo id="calls" {...GUIDES.calls} defaultOpen={false}/>
      <div style={{display:"grid", gridTemplateColumns: wide ? "400px 1fr" : "1fr", gap:18}}>
        {wide ? <>{List}{Focus}</> : <>{Focus}{List}</>}
      </div>
    </div>
  );
}
