// Rate & Equity Radar + Today's Calls (10 past clients + 10 agents)
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase.js";

const C = {
  bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc",
  green:"#1e6e4a", greenBg:"#e8f4ee", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020", redBg:"#fbeae7",
  blue:"#1a4f8a", blueBg:"#e6eef9", purple:"#5b3fa6", purpleBg:"#eeebf8", teal:"#1a6570", tealBg:"#e4f2f4", stoneBg:"#f0ece5",
};
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const box = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10, padding:"14px", marginBottom:12 };
const lbl = { fontFamily:F.cond, fontSize:11, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginBottom:8 };
const inp = { width:"100%", padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box" };
const ghost = { fontFamily:F.mono, fontSize:10, padding:"6px 10px", borderRadius:5, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const primary = { ...ghost, background:C.green, borderColor:C.green, color:"#fff" };

const today = () => new Date().toISOString().slice(0, 10);
const digits = (s) => String(s || "").replace(/\D/g, "");
const fullName = (c) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || c.email || "(no name)";
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const monthsSince = (d) => { if (!d) return null; const a = new Date(d), b = new Date(); return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); };
const pmt = (amt, rate, n = 360) => { const i = rate / 1200; return i ? (amt * i) / (1 - Math.pow(1 + i, -n)) : amt / n; };
const balFactor = (rate, n, k) => { const i = rate / 1200; if (!i) return 1 - k / n; const g = Math.pow(1 + i, n); return (g - Math.pow(1 + i, Math.min(k, n))) / (g - 1); };
const fmtMo = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month:"short", year:"numeric" }) : "";
const money = (v) => `$${Math.round(v).toLocaleString()}`;

const BUCKETS = [
  ["conv", "Conventional R&T", C.blue, C.blueBg, "Rate beats today's conventional market by your threshold — a refi could lower the payment."],
  ["fha", "FHA Streamline", C.purple, C.purpleBg, "FHA loan, above the FHA market, seasoned — no appraisal needed."],
  ["va", "VA IRRRL", C.teal, C.tealBg, "VA loan with a rate worth lowering — fastest refi path for vets."],
  ["equity", "Equity", C.green, C.greenBg, "Estimated LTV at or below your equity line — cash-out, HELOC or PMI removal."],
  ["watch", "Watchlist", C.amber, C.amberBg, "Above market, but not yet past your threshold. One more rate drop and they're in."],
];
const OUTCOMES = [["talked","Talked",30],["voicemail","Voicemail",3],["no answer","No answer",2],["booked","Booked",null],["not interested","Not interested",180],["wrong number","Wrong #",null]];

function Tile({ k, label, n, color, bg, active, onClick }) {
  return (
    <button onClick={onClick} style={{flex:"1 1 110px", textAlign:"left", padding:"10px 12px", borderRadius:8, border:`1.5px solid ${active ? color : C.rule}`, background: active ? bg : C.card, cursor:"pointer"}}>
      <div style={{fontFamily:F.cond, fontSize:26, fontWeight:800, color}}>{n}</div>
      <div style={{fontFamily:F.mono, fontSize:10, color:C.mid}}>{label}</div>
    </button>
  );
}

function CallCard({ c, info, onOutcome, onOpen, done, profileName, tag }) {
  const [note, setNote] = useState(""); const [fu, setFu] = useState("");
  const first = c.first_name || "";
  const rateText = info?.rate ? `Hi ${first}, it's ${profileName || "Joshua"}. Rates have moved since you got your ${info.rate}% loan — want me to run quick numbers to see if it's worth a look? No pressure either way.` : `Hi ${first}, it's ${profileName || "Joshua"} — just checking in. Anything new on your end?`;
  return (
    <div style={{...box, opacity: done ? 0.55 : 1, borderColor: done ? C.green : C.rule}}>
      <div style={{display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start"}}>
        <div style={{minWidth:0}}>
          <div onClick={() => onOpen(c)} style={{fontFamily:F.cond, fontSize:18, fontWeight:800, color:C.blue, cursor:"pointer"}}>{done ? "✓ " : ""}{fullName(c)}</div>
          <div style={{fontFamily:F.body, fontSize:13, display:"flex", gap:12, flexWrap:"wrap", marginTop:2}}>
            {c.phone ? <a href={`tel:${digits(c.phone)}`} style={{color:C.blue, textDecoration:"none"}}>{c.phone}</a> : <span style={{color:C.light}}>no phone</span>}
            <span style={{color:C.mid, wordBreak:"break-all"}}>{c.email || "no email"}</span>
          </div>
          <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, marginTop:4}}>{tag}</div>
        </div>
        {info?.gap != null && info.gap > 0 && <span style={{fontFamily:F.mono, fontSize:10, padding:"3px 7px", borderRadius:4, background:C.redBg, color:C.red, whiteSpace:"nowrap"}}>+{info.gap.toFixed(2)}%</span>}
      </div>
      {!done && (
        <>
          <div style={{display:"flex", gap:6, marginTop:10, flexWrap:"wrap"}}>
            {c.phone && <a href={`tel:${digits(c.phone)}`} style={primary}>Call</a>}
            {c.phone && <a href={`sms:${digits(c.phone)}?body=${encodeURIComponent(rateText)}`} style={primary}>Text</a>}
            {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent("Quick check-in")}&body=${encodeURIComponent(rateText)}`} style={primary}>Email</a>}
            <button onClick={() => onOpen(c)} style={ghost}>Open</button>
          </div>
          <div style={{display:"flex", gap:6, marginTop:8, flexWrap:"wrap", alignItems:"center"}}>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Quick note (optional)" style={{...inp, flex:"1 1 180px", fontSize:12, padding:"6px 8px"}}/>
            <input type="date" value={fu} onChange={(e) => setFu(e.target.value)} title="Follow-up date (optional)" style={{...inp, width:150, fontSize:12, padding:"6px 8px"}}/>
          </div>
          <div style={{display:"flex", gap:5, marginTop:6, flexWrap:"wrap"}}>
            {OUTCOMES.map(([k, l, days]) => <button key={k} onClick={() => onOutcome(c, k, note, fu || (days ? addDays(days) : null))} style={ghost}>{l}</button>)}
          </div>
        </>
      )}
    </div>
  );
}

export default function RadarTab({ userId, contacts, setContacts, profileName, onOpen }) {
  const [view, setView] = useState("calls");
  const [settings, setSettings] = useState({ refi_threshold:0.5, appreciation_pct:4, equity_ltv_max:70, seasoning_months:7 });
  const [rates, setRates] = useState({ conventional:"", fha:"", va:"" });
  const [ratesDay, setRatesDay] = useState(null);
  const [loans, setLoans] = useState(null);
  const [bucket, setBucket] = useState("conv");
  const [showSettings, setShowSettings] = useState(false);
  const [msg, setMsg] = useState("");
  const [shown, setShown] = useState(50);

  const load = useCallback(async () => {
    const { data: s } = await supabase.from("radar_settings").select("*").eq("user_id", userId).maybeSingle();
    if (s) setSettings(s);
    const { data: r } = await supabase.from("market_rates").select("*").eq("user_id", userId).order("day", { ascending:false }).limit(1);
    if (r && r[0]) { setRates({ conventional:r[0].conventional ?? "", fha:r[0].fha ?? "", va:r[0].va ?? "" }); setRatesDay(r[0].day); }
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase.from("loans").select("contact_id,note_rate,loan_amount,ltv_orig,funded_date,loan_type,loan_type_source,loan_term_months,appraised_value").eq("is_current", true).range(from, from + 999);
      all.push(...(data || [])); if (!data || data.length < 1000) break;
    }
    setLoans(Object.fromEntries(all.map((l) => [l.contact_id, l])));
  }, [userId]);
  useEffect(() => { if (userId) load(); }, [userId, load]);

  const saveRates = async () => {
    const row = { user_id:userId, day:today(), conventional:Number(rates.conventional) || null, fha:Number(rates.fha) || null, va:Number(rates.va) || null };
    const { error } = await supabase.from("market_rates").upsert(row);
    setMsg(error ? "Save failed: " + error.message : "Today's rates saved."); if (!error) setRatesDay(today());
  };
  const saveSettings = async () => {
    const row = { user_id:userId, refi_threshold:Number(settings.refi_threshold), appreciation_pct:Number(settings.appreciation_pct), equity_ltv_max:Number(settings.equity_ltv_max), seasoning_months:Number(settings.seasoning_months), updated_at:new Date().toISOString() };
    const { error } = await supabase.from("radar_settings").upsert(row);
    setMsg(error ? "Save failed: " + error.message : "Settings saved."); setShowSettings(false);
  };

  // ── Radar math ───────────────────────────────────────────────────────────────
  const radar = useMemo(() => {
    const out = { conv:[], fha:[], va:[], equity:[], watch:[] }; const info = {};
    if (!loans) return { out, info };
    const thr = Number(settings.refi_threshold) || 0.5, appr = (Number(settings.appreciation_pct) || 0) / 100, eqMax = Number(settings.equity_ltv_max) || 70, season = Number(settings.seasoning_months) || 7;
    const mkt = { Conventional:Number(rates.conventional) || null, FHA:Number(rates.fha) || null, VA:Number(rates.va) || null };
    for (const c of contacts) {
      if ((c.contact_type || "past_client") !== "past_client" || c.do_not_contact) continue;
      const l = loans[c.id] || {};
      const rate = Number(l.note_rate ?? c.note_rate); if (!rate) continue;
      const type = l.loan_type || c.loan_type || null;
      const prog = type === "FHA" || type === "VA" ? type : "Conventional";
      const est = (l.loan_type_source || c.loan_type_source) !== "verified";
      const funded = l.funded_date || c.funded_date; const months = monthsSince(funded);
      const market = mkt[prog]; const gap = market ? rate - market : null;
      // estimated current LTV
      let estLtv = null; const n = l.loan_term_months || 360;
      if (months != null) {
        const grow = Math.pow(1 + appr, months / 12), bf = balFactor(rate, n, months);
        const amt = Number(l.loan_amount || c.loan_amount), val = Number(l.appraised_value || c.home_value || c.appraised_value);
        if (amt && val) estLtv = (amt * bf) / (val * grow) * 100;
        else if (Number(l.ltv_orig || c.ltv_orig)) estLtv = Number(l.ltv_orig || c.ltv_orig) * bf / grow;
      }
      const amt = Number(l.loan_amount || c.loan_amount);
      const save = amt && market && gap > 0 && months != null ? pmt(amt * balFactor(rate, n, months), rate, n - Math.min(months, n - 1)) - pmt(amt * balFactor(rate, n, months), market, 360) : null;
      const i = { rate, type, prog, est, funded, months, market, gap, estLtv, save };
      info[c.id] = i;
      if (gap != null && gap >= thr) {
        if (prog === "Conventional") out.conv.push(c);
        else if (months == null || months >= season) out[prog === "FHA" ? "fha" : "va"].push(c);
        else { i.seasoning = true; out.watch.push(c); }
      } else if (gap != null && gap > 0) out.watch.push(c);
      if (estLtv != null && estLtv <= eqMax) { i.pmi = prog === "Conventional" && Number(l.ltv_orig || c.ltv_orig) > 80 && estLtv <= 78; out.equity.push(c); }
    }
    for (const k of ["conv","fha","va","watch"]) out[k].sort((a, b) => info[b.id].gap - info[a.id].gap);
    out.equity.sort((a, b) => info[a.id].estLtv - info[b.id].estLtv);
    return { out, info };
  }, [contacts, loans, rates, settings]);

  // ── Today's calls ─────────────────────────────────────────────────────────────
  const qKey = `gupQueue:${userId}:${today()}`;
  const queue = useMemo(() => {
    let saved = null; try { saved = JSON.parse(localStorage.getItem(qKey) || "null"); } catch {}
    const byId = Object.fromEntries(contacts.map((c) => [c.id, c]));
    if (saved && saved.clients && saved.agents) return { clients:saved.clients.map((x) => [byId[x[0]], x[1]]).filter((x) => x[0]), agents:saved.agents.map((x) => [byId[x[0]], x[1]]).filter((x) => x[0]) };
    if (!loans) return null;
    const t = today(), md = t.slice(5), mo = t.slice(5, 7);
    const daysSince = (d) => d ? (Date.now() - new Date(d)) / 864e5 : 9999;
    const bdaySoon = (b) => { if (!b) return false; const mmdd = String(b).length > 5 ? String(b).slice(5) : String(b); for (let k = 0; k < 7; k++) { if (addDays(k).slice(5) === mmdd) return true; } return false; };
    const inB = Object.fromEntries(Object.entries(radar.out).flatMap(([k, arr]) => arr.map((c) => [c.id + ":" + k, true])));
    const pc = [];
    for (const c of contacts) {
      if ((c.contact_type || "past_client") !== "past_client" || c.do_not_contact || !(c.phone || c.email)) continue;
      const due = c.follow_up_date && c.follow_up_date <= t;
      if (c.follow_up_date && c.follow_up_date > t) continue;
      if (!due && daysSince(c.last_contacted) < 21) continue;
      const i = radar.info[c.id] || {}; let s = 0, why = [];
      if (due) { s += 1000; why.push("follow-up due"); }
      const rb = ["conv","fha","va"].find((k) => inB[c.id + ":" + k]);
      if (rb) { s += 500 + i.gap * 100; why.push(`${rb === "conv" ? "Conv R&T" : rb === "fha" ? "FHA Streamline" : "VA IRRRL"} +${i.gap.toFixed(2)}%`); }
      if (bdaySoon(c.birthday)) { s += 300; why.push("birthday this week"); }
      if (i.funded && i.funded.slice(5, 7) === mo && i.months >= 11) { s += 200; why.push(`${Math.round(i.months / 12)}-yr loan anniversary`); }
      if (inB[c.id + ":equity"]) { s += 150 + (70 - i.estLtv); why.push(`equity ~${Math.round(i.estLtv)}% LTV${i.pmi ? " (PMI removal?)" : ""}`); }
      if (!rb && inB[c.id + ":watch"]) { s += 100 + i.gap * 100; why.push(`watchlist +${i.gap.toFixed(2)}%`); }
      if (!c.last_contacted) { s += 40; why.push("never contacted"); }
      if (c.phone) s += 20;
      if (s >= 60) pc.push([c, s, why.join(" · ")]);
    }
    pc.sort((a, b) => b[1] - a[1]);
    const ag = [];
    for (const c of contacts) {
      if (c.contact_type !== "agent" || c.do_not_contact || !(c.phone || c.email)) continue;
      const due = c.follow_up_date && c.follow_up_date <= t;
      if (c.follow_up_date && c.follow_up_date > t) continue;
      if (!due && daysSince(c.last_contacted) < 30) continue;
      const tags = c.tags || []; let s = 0, why = [];
      if (due) { s += 1000; why.push("follow-up due"); }
      if (c.subtype === "active partner") { s += 600; why.push("active partner"); }
      if (tags.includes("closed deal together")) { s += 400; why.push("closed deals together"); }
      if (bdaySoon(c.birthday)) { s += 300; why.push("birthday this week"); }
      if (c.phone) { s += 100; } else why.push("email only");
      if (!c.last_contacted) { s += 50; why.push("never contacted"); }
      if (c.agent_role) { s += 20; why.push(`${c.agent_role} agent`); }
      if (c.company) why.push(c.company);
      ag.push([c, s + Math.random(), why.join(" · ")]);
    }
    ag.sort((a, b) => b[1] - a[1]);
    const q = { clients:pc.slice(0, 10).map(([c, , w]) => [c.id, w]), agents:ag.slice(0, 10).map(([c, , w]) => [c.id, w]) };
    try { localStorage.setItem(qKey, JSON.stringify(q)); } catch {}
    return { clients:q.clients.map((x) => [byId[x[0]], x[1]]), agents:q.agents.map((x) => [byId[x[0]], x[1]]) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, radar, qKey]);

  const outcome = async (c, result, note, followUp) => {
    await supabase.from("contact_touches").insert({ user_id:userId, contact_id:c.id, channel:"call", outcome:result, note:note || null });
    const fields = { last_contacted:today(), outcome:result, follow_up_date:followUp };
    if (note) fields.contact_note = [c.contact_note, `${today()}: ${result} — ${note}`].filter(Boolean).join("\n");
    else fields.contact_note = [c.contact_note, `${today()}: ${result}`].filter(Boolean).join("\n");
    const { data } = await supabase.from("contacts").update(fields).eq("id", c.id).select().single();
    if (data) setContacts((p) => p.map((x) => (x.id === c.id ? data : x)));
  };
  const rebuild = () => { try { localStorage.removeItem(qKey); } catch {} setMsg("Queue rebuilt."); setContacts((p) => [...p]); };

  const ratesOk = rates.conventional || rates.fha || rates.va;
  const stale = ratesDay && ratesDay !== today();
  const done = (c) => c && c.last_contacted === today();
  const doneCount = queue ? [...queue.clients, ...queue.agents].filter(([c]) => done(c)).length : 0;

  return (
    <div>
      <div style={{display:"flex", gap:6, marginBottom:12}}>
        <button onClick={() => setView("calls")} style={view === "calls" ? primary : ghost}>Today's Calls{queue ? ` (${doneCount}/${queue.clients.length + queue.agents.length})` : ""}</button>
        <button onClick={() => setView("radar")} style={view === "radar" ? primary : ghost}>Rate & Equity Radar</button>
      </div>

      <div style={{...box, borderColor: !ratesOk || stale ? C.amber : C.rule}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={lbl}>Today's market rates {ratesDay ? `· last saved ${ratesDay}` : ""}{stale ? " · update for today" : ""}</div>
          <button onClick={() => setShowSettings((s) => !s)} style={ghost}>{showSettings ? "Close settings" : "Settings"}</button>
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end"}}>
          {[["conventional","Conventional"],["fha","FHA"],["va","VA"]].map(([k, l]) => (
            <label key={k} style={{flex:"1 1 90px"}}><div style={{fontFamily:F.mono, fontSize:9, color:C.light}}>{l} %</div>
              <input type="number" step="0.001" value={rates[k]} onChange={(e) => setRates((r) => ({ ...r, [k]:e.target.value }))} style={inp}/></label>
          ))}
          <button onClick={saveRates} style={{...primary, padding:"10px 14px"}}>Save today's rates</button>
        </div>
        {showSettings && (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8, marginTop:12}}>
            {[["refi_threshold","Refi threshold (% over market)"],["appreciation_pct","Home appreciation % / yr"],["equity_ltv_max","Equity: est. LTV at or below"],["seasoning_months","FHA/VA seasoning (months)"]].map(([k, l]) => (
              <label key={k}><div style={{fontFamily:F.mono, fontSize:9, color:C.light}}>{l}</div><input type="number" step="0.01" value={settings[k]} onChange={(e) => setSettings((s) => ({ ...s, [k]:e.target.value }))} style={inp}/></label>
            ))}
            <button onClick={saveSettings} style={{...primary, alignSelf:"end", padding:"10px"}}>Save settings</button>
          </div>
        )}
        {msg && <div style={{fontFamily:F.mono, fontSize:10, color:C.green, marginTop:6}}>{msg}</div>}
      </div>

      {!loans && <div style={{fontFamily:F.mono, fontSize:11, color:C.light}}>Loading loans…</div>}

      {view === "calls" && queue && (
        <div>
          {!ratesOk && <div style={{...box, background:C.amberBg, color:C.amber, fontFamily:F.mono, fontSize:11}}>Enter today's market rates above so rate opportunities rank first, then tap "Rebuild today's list".</div>}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div style={lbl}>Past clients · top {queue.clients.length}</div>
            <button onClick={rebuild} style={ghost}>Rebuild today's list</button>
          </div>
          {queue.clients.map(([c, why]) => <CallCard key={c.id} c={c} info={radar.info[c.id]} tag={why} done={done(c)} onOutcome={outcome} onOpen={onOpen} profileName={profileName}/>)}
          <div style={{...lbl, marginTop:16}}>Agents · top {queue.agents.length}</div>
          {queue.agents.map(([c, why]) => <CallCard key={c.id} c={c} tag={why} done={done(c)} onOutcome={outcome} onOpen={onOpen} profileName={profileName}/>)}
        </div>
      )}

      {view === "radar" && loans && (
        <div>
          <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:12}}>
            {BUCKETS.map(([k, l, col, bg]) => <Tile key={k} label={l} n={radar.out[k].length} color={col} bg={bg} active={bucket === k} onClick={() => { setBucket(k); setShown(50); }}/>)}
          </div>
          {!ratesOk && bucket !== "equity" && <div style={{...box, background:C.amberBg, color:C.amber, fontFamily:F.mono, fontSize:11}}>Enter today's market rates to fill the rate buckets.</div>}
          {BUCKETS.filter(([k]) => k === bucket).map(([k, l, col, bg, why]) => (
            <div key={k}>
              <div style={{...box, background:bg, borderColor:col}}>
                <div style={{fontFamily:F.cond, fontSize:18, fontWeight:800, color:col}}>{l} · {radar.out[k].length} contacts</div>
                <div style={{fontFamily:F.body, fontSize:13, color:C.mid}}>{why}{k === "equity" ? ` Estimated from original LTV + paydown + ${settings.appreciation_pct}%/yr appreciation (real value where on file).` : ""}</div>
              </div>
              {radar.out[k].slice(0, shown).map((c) => {
                const i = radar.info[c.id];
                return (
                  <div key={c.id} onClick={() => onOpen(c)} style={{...box, cursor:"pointer", padding:"10px 12px", marginBottom:6}}>
                    <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontFamily:F.cond, fontSize:16, fontWeight:700}}>{fullName(c)}</div>
                        <div style={{fontFamily:F.body, fontSize:13, display:"flex", gap:12, flexWrap:"wrap"}}>
                          {c.phone ? <a href={`tel:${digits(c.phone)}`} onClick={(e) => e.stopPropagation()} style={{color:C.blue, textDecoration:"none"}}>{c.phone}</a> : <span style={{color:C.light}}>no phone</span>}
                          <span style={{color:C.mid, wordBreak:"break-all"}}>{c.email || ""}</span>
                        </div>
                        <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, marginTop:3}}>
                          {[`${i.rate}%`, `${i.type || "type?"}${i.est ? " (est.)" : ""}`, i.funded && `funded ${fmtMo(i.funded)}`, i.estLtv != null && `est. LTV ${Math.round(i.estLtv)}%`, i.save && i.save > 0 && `~${money(i.save)}/mo savings`, i.seasoning && "not seasoned yet", i.pmi && "PMI removal?"].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {i.gap != null && i.gap > 0 && <span style={{fontFamily:F.mono, fontSize:10, padding:"3px 7px", borderRadius:4, background:C.redBg, color:C.red, height:"fit-content", whiteSpace:"nowrap"}}>+{i.gap.toFixed(2)}%</span>}
                    </div>
                  </div>
                );
              })}
              {radar.out[k].length > shown && <button onClick={() => setShown((s) => s + 100)} style={{...ghost, width:"100%", padding:"10px"}}>Load more ({radar.out[k].length - shown} more)</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
