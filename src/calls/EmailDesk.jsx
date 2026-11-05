// Reconnect emails: 3 personal emails per contact, about 10 a day, sent by hand from Joshua's own mail app.
// Priority: agents and clients he has worked with, then his other clients, then other agents, leads, past LO fundings last.
import { useState, useMemo, useEffect } from "react";
import { supabase } from "../supabase.js";
import { today, addDays, fullName, BOOKING, MY_PHONE } from "../radar/engine.js";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"8px 14px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box", width:"100%" };
const TARGETS = [5, 10, 15, 20];
const GAP = { 1:4, 2:7 };   // days to wait after email 1 and email 2

const SIG = `Joshua Graham
AVP | Regional Loan Originator
Graham Financial, powered by Zero Point Mortgage Services
${MY_PHONE} | approvedbyjoshua.com
NMLS 169809 | Company NMLS 1216108`;
const STOP = `If you'd rather I not reach out, just reply "stop" and I won't.`;

const workedWith = (c) => (c.tags || []).includes("closed deal together") || (c.buckets || []).some((b) => /Closed/.test(b) && !/Never Closed/.test(b));
const kind = (c) => (c.contact_type === "agent" ? "agent" : c.contact_type === "lead" ? "lead" : c.book === "past LO" ? "pastlo" : "client");
function priority(c) {
  const k = kind(c), w = workedWith(c);
  if ((k === "agent" || k === "client") && w) return 4000;
  if (k === "client") return 3000;
  if (k === "agent") return 2000 + (c.subtype === "active partner" ? 500 : 0);
  if (k === "lead") return 1000;
  return 100;                                    // past LO fundings: lowest
}

export function emailFor(c) {
  const first = c.first_name || "there"; const k = kind(c); const step = (c.email_step || 0) + 1; const w = workedWith(c);
  const yr = c.funded_date ? String(c.funded_date).slice(0, 4) : "";
  if (k === "agent") {
    if (step === 1) return { subject:"Catching up", body:`Hi ${first},

${w ? "It's been too long since our last closing together." : "It's been a while since we've connected."} How's business treating you?

I'm updating my partner list and want to make sure I have you right. ${c.company ? `Still with ${c.company}? ` : ""}Best cell for you?

${SIG}` };
    if (step === 2) return { subject:"One more closing this year", body:`Hi ${first},

Quick thought. A lot of the buyers I talk to think they can't buy yet: they think they need more saved, they're self-employed, or they need to sell before they can buy. Most of them are closer than they think.

I'd like to send some of those buyers your way and make sure the ones you already have get to the closing table. Worth a quick conversation?

${SIG}` };
    return { subject:"15 minutes?", body:`Hi ${first},

I'd love 15 minutes to hear what you're working on and show you how I take care of the buyers you send me. No pitch, just two people who should be doing more business together.

Grab any time that works for you here: ${BOOKING}

${SIG}

${STOP}` };
  }
  if (step === 1) {
    const open = k === "pastlo"
      ? `I'm Joshua Graham, AVP at Zero Point Mortgage Services. I'm the loan originator now taking care of your ${yr ? yr + " " : ""}home loan, and I wanted to introduce myself personally.`
      : k === "lead" ? `It's Joshua Graham. We talked a while back about your home plans, and I wanted to check in.`
      : `It's been a while since we closed! How are you and the family, and how's the house treating you?`;
    return { subject: k === "pastlo" ? "Introducing myself" : "Been thinking about you", body:`Hi ${first},

${open}

I'm also updating my info on you. Did anything change? New number, new email, a move?

No agenda, just checking in.

${SIG}` };
  }
  if (step === 2) return { subject:"Want to see what your home is worth now?", body:`Hi ${first},

As a mortgage broker I have access to the property value tool lenders use, which most people can't get. I can run your home and pull recent nearby sales so you can see where your equity stands today. It's an estimate, not an appraisal, and it's free.

Want me to run it? Just reply "yes."

${SIG}` };
  return { subject:"What's next for you?", body:`Hi ${first},

Whatever is next, whether that's moving up, downsizing, using your equity, buying a rental, or helping your kids buy their first home, I'd love to help you build the plan.

I'm a real person, not an automated email, and it's free advice. No pressure.

Book 15 minutes with me here: ${BOOKING}

${SIG}

${STOP}` };
}

export default function EmailDesk({ userId, contacts, setContacts, callIds, wide }) {
  const t = today();
  const [target, setTarget] = useState(() => { try { return Number(localStorage.getItem(`gupEmailTarget:${userId}`)) || 10; } catch { return 10; } });
  const [nonce, setNonce] = useState(0);
  const [selId, setSelId] = useState(null);
  const [draft, setDraft] = useState({ subject:"", body:"" });
  const byId = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);
  const [sentToday, setSentToday] = useState({});   // contact id -> { outcome, note } logged today
  useEffect(() => {
    if (!userId) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    supabase.from("contact_touches").select("contact_id, outcome, note, touched_at").eq("user_id", userId).eq("channel", "email")
      .gte("touched_at", start.toISOString()).order("touched_at").then(({ data }) => {
        const m = {}; (data || []).forEach((r) => { m[r.contact_id] = r; }); setSentToday(m);
      });
  }, [userId]);
  const key = `gupEmails:${userId}:${t}`;

  const queue = useMemo(() => {
    let saved = null; try { saved = JSON.parse(localStorage.getItem(key) || "null"); } catch {}
    if (saved && saved.target === target) return saved.ids.filter((id) => byId[id]);
    const skip = new Set(callIds || []);
    const due = contacts.filter((c) => !c.do_not_contact && !c.email_bad && c.email && /@/.test(c.email)
      && ["past_client","agent","lead"].includes(c.contact_type || "past_client")
      && (c.email_step || 0) < 3 && (!c.email_next || c.email_next <= t) && !skip.has(c.id) && c.last_contacted !== t);
    due.sort((a, b) => (priority(b) - priority(a)) || ((b.email_step || 0) - (a.email_step || 0)) || String(b.funded_date || "").localeCompare(String(a.funded_date || "")));
    const ids = due.slice(0, target).map((c) => c.id);
    try { localStorage.setItem(key, JSON.stringify({ target, ids })); } catch {}
    return ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, key, nonce, contacts.length]);

  const done = (id) => { const c = byId[id]; return !!c && (!!sentToday[id] || c.__emailedToday || c.email_bad || (c.email_next && c.email_next > t) || c.email_step >= 3); };
  useEffect(() => { if (!selId || !queue.includes(selId)) { const n = queue.find((id) => !done(id)); setSelId(n || queue[0] || null); } }, [queue]); // eslint-disable-line react-hooks/exhaustive-deps
  const sel = selId ? byId[selId] : null;
  useEffect(() => { if (sel) setDraft(emailFor(sel)); }, [selId]); // eslint-disable-line react-hooks/exhaustive-deps

  const undoKey = `gupEmailUndo:${userId}:${t}`;
  const save = async (fields, label, note = null) => {
    const prev = { email_step:sel.email_step || 0, email_next:sel.email_next || null, follow_up_date:sel.follow_up_date || null, do_not_contact:!!sel.do_not_contact, outcome:sel.outcome || null };
    const { data:touch } = await supabase.from("contact_touches").insert({ user_id:userId, contact_id:sel.id, channel:"email", outcome:label, note }).select("id").single();
    setSentToday((m) => ({ ...m, [sel.id]: { outcome:label, note } }));
    const { data } = await supabase.from("contacts").update(fields).eq("id", sel.id).select().single();
    if (data) setContacts((p) => p.map((x) => (x.id === data.id ? { ...data, __emailedToday:true } : x)));
    try { const u = JSON.parse(localStorage.getItem(undoKey) || "{}"); u[sel.id] = { prev, touchId:touch?.id }; localStorage.setItem(undoKey, JSON.stringify(u)); } catch {}
  };
  const goNext = () => { const idx = queue.indexOf(selId); const n = queue.slice(idx + 1).find((id) => !done(id)) || queue.find((id) => !done(id)); if (n) setSelId(n); };
  const undo = async (id) => {
    let u = {}; try { u = JSON.parse(localStorage.getItem(undoKey) || "{}"); } catch {}
    const s = u[id]; if (!s) return;
    if (s.touchId) await supabase.from("contact_touches").delete().eq("id", s.touchId);
    const { data } = await supabase.from("contacts").update(s.prev).eq("id", id).select().single();
    if (data) setContacts((p) => p.map((x) => (x.id === data.id ? data : x)));
    delete u[id]; try { localStorage.setItem(undoKey, JSON.stringify(u)); } catch {}
    setSentToday((m) => { const x = { ...m }; delete x[id]; return x; });
    setSelId(id);
  };
  const canUndo = (id) => { try { return !!JSON.parse(localStorage.getItem(undoKey) || "{}")[id]; } catch { return false; } };

  const step = sel ? (sel.email_step || 0) + 1 : 1;
  const markSent = () => { const ns = (sel.email_step || 0) + 1; save({ email_step:ns, email_next: ns < 3 ? addDays(GAP[ns]) : null }, `email ${ns} sent`, `${draft.subject}\n\n${draft.body}`); };
  const bounced = () => save({ email_bad:true, email_step:0, email_next:null, follow_up_date:t, outcome:"email bounced",
    contact_note:[sel.contact_note, `${t} · email bounced: ${sel.email}`].filter(Boolean).join("\n") }, "bounced");
  const replied = () => save({ email_step:99, email_next:null, follow_up_date:t, outcome:"replied to email" }, "replied");
  const stop = () => save({ email_step:99, email_next:null, do_not_contact:true, outcome:"asked to stop" }, "asked to stop");
  const label = (c) => ({ agent: workedWith(c) ? "AGENT · WORKED TOGETHER" : "AGENT", client: workedWith(c) ? "MY CLIENT · CLOSED" : "MY CLIENT", lead:"LEAD", pastlo:"PAST LO FUNDING" })[kind(c)];
  const doneCount = queue.filter(done).length;
  const [find, setFind] = useState("");
  const found = find.trim().length < 3 ? [] : contacts.filter((c) => c.email && !c.email_bad && ((c.email_step || 0) > 0 || sentToday[c.id])
    && `${c.first_name || ""} ${c.last_name || ""} ${c.email}`.toLowerCase().includes(find.trim().toLowerCase())).slice(0, 6);
  const bounceOther = async (c) => {
    const fields = { email_bad:true, email_step:0, email_next:null, follow_up_date:t, outcome:"email bounced",
      contact_note:[c.contact_note, `${t} · email bounced: ${c.email}`].filter(Boolean).join("\n") };
    await supabase.from("contact_touches").insert({ user_id:userId, contact_id:c.id, channel:"email", outcome:"bounced" });
    const { data } = await supabase.from("contacts").update(fields).eq("id", c.id).select().single();
    if (data) setContacts((p) => p.map((x) => (x.id === data.id ? data : x)));
    setFind("");
  };

  const List = (
    <div style={{...card, overflow:"hidden", alignSelf:"start"}}>
      <div style={{padding:"14px 18px", borderBottom:`1px solid ${C.rule}`}}>
        <div style={{display:"flex", justifyContent:"space-between", fontFamily:F.mono, fontSize:11}}><span>{doneCount} of {queue.length} emails sent</span>
          <span>Daily <select value={target} onChange={(e) => { const v = Number(e.target.value); setTarget(v); try { localStorage.setItem(`gupEmailTarget:${userId}`, String(v)); localStorage.removeItem(key); } catch {} }} style={{...inp, width:"auto", padding:"2px 4px", fontSize:12}}>{TARGETS.map((x) => <option key={x}>{x}</option>)}</select></span></div>
        <div style={{height:8, borderRadius:4, background:C.rule, overflow:"hidden", marginTop:8}}><div style={{height:"100%", width:`${queue.length ? doneCount / queue.length * 100 : 0}%`, background:C.green}}/></div>
        <button onClick={() => { try { localStorage.removeItem(key); } catch {} setSelId(null); setNonce((n) => n + 1); }} style={{...btn, padding:"3px 9px", fontSize:12, marginTop:10}}>Rebuild list</button>
        <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Got a bounce? Type their name or email" style={{...inp, marginTop:10, fontSize:13}}/>
        {found.map((c) => <div key={c.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginTop:6, fontSize:13}}>
          <span>{fullName(c)} <span style={{color:C.light}}>{c.email}</span></span>
          <button onClick={() => bounceOther(c)} style={{...btn, padding:"3px 9px", fontSize:12}}>Bounced</button></div>)}
      </div>
      {queue.map((id, n) => { const c = byId[id]; const d = done(id); const on = id === selId; return (
        <div key={id} onClick={() => setSelId(id)} style={{display:"flex", gap:12, padding:"10px 18px", borderBottom:`1px solid ${C.rule}`, cursor:"pointer", background:on ? "#fff" : "transparent", borderLeft:on ? `4px solid ${C.green}` : "4px solid transparent", opacity:d && !on ? 0.45 : 1}}>
          <div style={{fontFamily:F.mono, fontSize:11, color:C.light, width:18, paddingTop:3}}>{n + 1}</div>
          <div><div style={{fontFamily:F.cond, fontWeight:700, fontSize:17, textDecoration:d ? "line-through" : "none"}}>{fullName(c)}</div>
            <div style={{fontFamily:F.mono, fontSize:10, color:C.mid}}>{label(c)} · EMAIL {Math.min((c.email_step || 0) + (d ? 0 : 1), 3)} OF 3</div></div>
        </div>); })}
      {queue.length === 0 && <div style={{padding:18, fontFamily:F.mono, fontSize:12, color:C.light}}>Nobody due today.</div>}
    </div>
  );

  const Focus = !sel ? <div style={{...card, padding:30, fontFamily:F.mono, color:C.light}}>Pick someone from the list.</div> : (
    <div style={{...card, padding: wide ? "24px 28px" : 18}}>
      <div style={{fontFamily:F.cond, fontWeight:800, fontSize:30, lineHeight:1}}>{fullName(sel)}</div>
      <div style={{fontFamily:F.mono, fontSize:12, color:C.mid, margin:"6px 0 14px"}}>{label(sel)}{sel.company ? ` · ${sel.company}` : ""} · {sel.email}</div>
      {done(sel.id) ? (<>
        <div style={{display:"flex", gap:8, alignItems:"center", padding:"10px 12px", borderRadius:8, background:"#fff", border:`1px solid ${C.rule}`}}>
          <span style={{fontFamily:F.mono, fontSize:12}}>{sentToday[sel.id] ? "Today" : "Logged"}: <b>{sel.email_bad ? "email bounced, on today's call list to get a new email" : sel.outcome === "replied to email" ? "replied" : sel.outcome === "asked to stop" ? "asked to stop" : `email ${sel.email_step} sent`}</b>{sel.email_next ? ` · next email ${sel.email_next.slice(5)}` : ""}</span>
          {canUndo(sel.id) && <button onClick={() => undo(sel.id)} style={{...btn, padding:"4px 12px", marginLeft:"auto"}}>Undo</button>}
          {!sel.email_bad && <button onClick={bounced} style={{...btn, padding:"4px 12px", marginLeft: canUndo(sel.id) ? 0 : "auto"}}>Bounced</button>}
          <button onClick={goNext} style={{...btnG, padding:"4px 12px", marginLeft: canUndo(sel.id) || !sel.email_bad ? 0 : "auto"}}>Next person</button>
        </div>
        {sentToday[sel.id]?.note && <>
          <div style={{fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginTop:14}}>What you sent</div>
          <textarea readOnly value={sentToday[sel.id].note} rows={12} style={{...inp, marginTop:6, lineHeight:1.5, background:"#f7f4ee", fontFamily:F.body}}/>
          <div style={{display:"flex", gap:8, marginTop:8}}>
            <button onClick={() => navigator.clipboard?.writeText(sentToday[sel.id].note.split("\n\n").slice(1).join("\n\n"))} style={btn}>Copy text</button>
            <button onClick={() => navigator.clipboard?.writeText(sentToday[sel.id].note.split("\n\n")[0])} style={btn}>Copy subject</button>
          </div></>}
      </>) : (
        <>
          <div style={{fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light}}>Email {step} of 3</div>
          <input value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject:e.target.value }))} style={{...inp, marginTop:6, fontWeight:600}}/>
          <textarea value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body:e.target.value }))} rows={14} style={{...inp, marginTop:8, lineHeight:1.5, resize:"vertical", fontFamily:F.body}}/>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:12}}>
            <a href={`mailto:${sel.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`} style={btnG}>Open in email</a>
            <button onClick={() => navigator.clipboard?.writeText(draft.body)} style={btn}>Copy text</button>
            <button onClick={markSent} style={btnG}>Mark sent</button>
            <button onClick={replied} style={{...btn, marginLeft:"auto"}}>They replied</button>
            <button onClick={bounced} style={btn}>Bounced</button>
            <button onClick={stop} style={btn}>Asked to stop</button>
          </div>
          <div style={{fontFamily:F.mono, fontSize:11, color:C.light, marginTop:10}}>Mark sent schedules the next email ({step === 1 ? "in 4 days" : step === 2 ? "in 7 days" : "none, this is the last one"}). They replied: ends the emails and puts a follow-up call on today's call list. Bounced: takes them off emails and puts them on today's call list to get a new email; entering it restarts the sequence. Asked to stop: marks them do-not-contact.</div>
        </>
      )}
    </div>
  );

  return <div style={{display:"grid", gridTemplateColumns: wide ? "400px 1fr" : "1fr", gap:18}}>{wide ? <>{List}{Focus}</> : <>{Focus}{List}</>}</div>;
}
