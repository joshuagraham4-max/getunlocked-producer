// Radar (Version C): scoreboard tiles + grouped sections. Your own clients rank ahead of past LO files.
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase.js";
import HowTo from "../HowTo.jsx";
import { GUIDES } from "../howto/guides.jsx";
import { today, digits, fullName, fmtMo, money, loadRadarData, computeRadar, reasonFor, DEFAULT_SETTINGS } from "./engine.js";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020", purple:"#5b3fa6", teal:"#1a6570", blue:"#1a4f8a" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const inp = { width:"100%", padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box" };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const year = (d) => (d ? String(d).slice(0, 4) : "");
const mineFirst = (a, b) => (a.book === "past LO" ? 1 : 0) - (b.book === "past LO" ? 1 : 0);

function Section({ title, color, note, items, onOpen, whyFor }) {
  const [n, setN] = useState(5);
  if (!items.length) return null;
  const wide = typeof window !== "undefined" && window.innerWidth >= 900;
  return (
    <div style={{...card, marginBottom:14, overflow:"hidden"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderBottom:`1px solid ${C.rule}`, borderLeft:`5px solid ${color}`}}>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize:19}}>{title} <span style={{fontFamily:F.mono, fontSize:12, fontWeight:400, color:C.mid}}>{n < items.length ? `top ${n} of ${items.length}` : `${items.length}`}{note ? ` · ${note}` : ""}</span></div>
        {items.length > 5 && <button onClick={() => setN(n > 5 ? 5 : 50)} style={{...btn, padding:"3px 9px", fontSize:12}}>{n > 5 ? "Show fewer" : "See more"}</button>}
      </div>
      {items.slice(0, n).map((c) => {
        const w = whyFor(c);
        return (
          <div key={c.id} onClick={() => onOpen(c)} style={{display:"grid", gridTemplateColumns: wide ? "230px 1fr 150px 120px 90px" : "1fr auto", gap:10, alignItems:"center", padding:"10px 18px", borderBottom:"1px solid #ece5d9", cursor:"pointer"}}>
            <div>
              <div style={{fontFamily:F.cond, fontWeight:700, fontSize:16}}>{fullName(c)}</div>
              <div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{[c.contact_type === "agent" ? "AGENT" : c.contact_type === "lead" ? "LEAD" : c.book === "past LO" ? "PAST LO" : "MY CLIENT", c.loan_type && (c.loan_type === "Conventional" ? "CONV" : c.loan_type.toUpperCase()), year(c.funded_date)].filter(Boolean).join(" · ")}</div>
              {!wide && <div style={{fontSize:13, marginTop:3, fontWeight:600}}>{w}</div>}
            </div>
            {wide && <div style={{fontSize:14, fontWeight:600}}>{w}</div>}
            {wide && <div style={{fontSize:14}}>{c.phone || <span style={{color:C.light}}>no phone</span>}</div>}
            {wide && <div style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{c.last_contacted ? `called ${c.last_contacted.slice(5)}` : "never called"}</div>}
            <div>{c.phone && <a href={`tel:${digits(c.phone)}`} onClick={(e) => e.stopPropagation()} style={btnG}>Call</a>}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function RadarTab({ userId, contacts, onOpen, onGoCalls }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [rates, setRates] = useState({ conventional:"", fha:"", va:"" });
  const [ratesDay, setRatesDay] = useState(null);
  const [loans, setLoans] = useState(null);
  const [book, setBook] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await loadRadarData(userId);
    setSettings(d.settings); setRates(d.rates); setRatesDay(d.ratesDay); setLoans(d.loans);
  }, [userId]);
  useEffect(() => { if (userId) load(); }, [userId, load]);

  const saveRates = async () => {
    const row = { user_id:userId, day:today(), conventional:Number(rates.conventional) || null, fha:Number(rates.fha) || null, va:Number(rates.va) || null };
    const { error } = await supabase.from("market_rates").upsert(row);
    setMsg(error ? "Save failed: " + error.message : "Today's rates saved. Rebuild the list on the Calls tab to rank rate opportunities first."); if (!error) setRatesDay(today());
  };
  const saveSettings = async () => {
    const row = { user_id:userId, refi_threshold:Number(settings.refi_threshold), appreciation_pct:Number(settings.appreciation_pct), equity_ltv_max:Number(settings.equity_ltv_max), seasoning_months:Number(settings.seasoning_months), updated_at:new Date().toISOString() };
    const { error } = await supabase.from("radar_settings").upsert(row);
    setMsg(error ? "Save failed: " + error.message : "Settings saved."); setShowSettings(false);
  };

  const radar = useMemo(() => loans ? computeRadar(contacts, loans, rates, settings) : null, [contacts, loans, rates, settings]);
  const inBook = useCallback((c) => book === "all" || c.contact_type !== "past_client" || (book === "mine" ? c.book !== "past LO" : c.book === "past LO"), [book]);
  const t = today();

  const S = useMemo(() => {
    if (!radar) return null;
    const { out, info } = radar;
    const rate = [...out.conv, ...out.fha, ...out.va].filter(inBook).sort((a, b) => mineFirst(a, b) || info[b.id].gap - info[a.id].gap);
    const follow = contacts.filter((c) => !c.do_not_contact && c.follow_up_date && c.follow_up_date <= t && inBook(c)).sort((a, b) => mineFirst(a, b) || a.follow_up_date.localeCompare(b.follow_up_date));
    const life = contacts.filter((c) => !c.do_not_contact && c.contact_type !== "rolodex" && inBook(c)).map((c) => [c, reasonFor(c, info[c.id], t)]).filter(([, r]) => r && (r.key === "bday" || r.key === "anniv" || (r.also || []).some((x) => /Birthday|anniversary/.test(x)))).map(([c]) => c).sort(mineFirst);
    const equity = out.equity.filter(inBook).sort((a, b) => mineFirst(a, b) || info[a.id].estLtv - info[b.id].estLtv);
    const watch = out.watch.filter(inBook).sort((a, b) => mineFirst(a, b) || info[b.id].gap - info[a.id].gap);
    return { rate, follow, life, equity, watch, info };
  }, [radar, contacts, inBook, t]);

  let calls = null; try { calls = JSON.parse(localStorage.getItem(`gupCalls:${userId}:${t}`) || "null"); } catch {}
  const made = calls?.items ? calls.items.filter((x) => contacts.find((c) => c.id === x.id)?.last_contacted === t).length : 0;
  const ratesOk = rates.conventional || rates.fha || rates.va;
  const stale = ratesDay !== t;

  const tile = (v, k, color, onClick) => (
    <div onClick={onClick} style={{...card, padding:"16px 18px", cursor:onClick ? "pointer" : "default"}}>
      <div style={{fontFamily:F.cond, fontWeight:800, fontSize:34, lineHeight:1, color}}>{v}</div>
      <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, marginTop:4}}>{k}</div>
    </div>
  );
  const why = {
    rate: (c) => { const i = S.info[c.id]; return `${i.rate}% vs ${Number(i.market).toFixed(2)}% ${i.prog === "Conventional" ? "market" : i.prog} · +${i.gap.toFixed(2)}% · ${i.bucket === "fha" ? "FHA Streamline" : i.bucket === "va" ? "VA IRRRL" : "Conventional R&T"}${i.save > 0 ? ` · ~${money(i.save)}/mo` : ""}`; },
    follow: (c) => `${c.follow_up_date === t ? "Due today" : `Due ${c.follow_up_date.slice(5)}`}${c.outcome ? ` · last: ${c.outcome}` : ""}${c.contact_type === "lead" && c.subtype ? ` · ${c.subtype}` : ""}`,
    life: (c) => { const r = reasonFor(c, S.info[c.id], t); return [r.key === "bday" || r.key === "anniv" ? r.title : (r.also || []).find((x) => /Birthday|anniversary/.test(x)), r.key === "anniv" ? r.detail : null].filter(Boolean).join(" · "); },
    equity: (c) => { const i = S.info[c.id]; return `Est. ${Math.round(i.estLtv)}% LTV · ${i.pmi ? "PMI removal likely" : "cash-out / HELOC"} · funded ${fmtMo(i.funded)}`; },
    watch: (c) => { const i = S.info[c.id]; return `+${i.gap.toFixed(2)}% over market${i.seasoning ? " · not seasoned yet" : " · one more drop"}`; },
  };

  return (
    <div>
      <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap"}}>
        {[["all","Everyone"],["mine","My clients"],["pastlo","Past LO fundings"]].map(([k, l]) => <button key={k} onClick={() => setBook(k)} style={book === k ? btnG : btn}>{l}</button>)}
        <button onClick={() => setShowSettings((s) => !s)} style={{...btn, marginLeft:"auto"}}>Rates & settings</button>
        <button onClick={() => setShowHelp((s) => !s)} style={{...btn, padding:"7px 11px"}}>?</button>
      </div>
      {showHelp && <HowTo id="radar-help" {...GUIDES.radar}/>}

      {(showSettings || stale || !ratesOk) && (
        <div style={{...card, padding:"14px 16px", marginBottom:14, borderColor: stale ? C.amber : C.rule}}>
          <div style={{fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color: stale ? C.amber : C.light, marginBottom:8}}>Today's market rates{ratesDay ? ` · last saved ${ratesDay}` : ""}{stale ? " · enter today's" : ""}</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end"}}>
            {[["conventional","Conventional"],["fha","FHA"],["va","VA"]].map(([k, l]) => (
              <label key={k} style={{flex:"1 1 100px"}}><div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{l} %</div><input type="number" step="0.001" value={rates[k]} onChange={(e) => setRates((r) => ({ ...r, [k]:e.target.value }))} style={inp}/></label>
            ))}
            <button onClick={saveRates} style={{...btnG, padding:"9px 14px"}}>Save today's rates</button>
          </div>
          {showSettings && (
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, marginTop:12}}>
              {[["refi_threshold","Refi threshold (% over market)"],["appreciation_pct","Home appreciation % / yr"],["equity_ltv_max","Equity: est. LTV at or below"],["seasoning_months","FHA/VA seasoning (months)"]].map(([k, l]) => (
                <label key={k}><div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{l}</div><input type="number" step="0.01" value={settings[k]} onChange={(e) => setSettings((s) => ({ ...s, [k]:e.target.value }))} style={inp}/></label>
              ))}
              <button onClick={saveSettings} style={{...btnG, alignSelf:"end", padding:"9px"}}>Save settings</button>
            </div>
          )}
          {msg && <div style={{fontFamily:F.mono, fontSize:11, color:C.green, marginTop:8}}>{msg}</div>}
        </div>
      )}

      {!S ? <div style={{fontFamily:F.mono, fontSize:12, color:C.light}}>Loading…</div> : (
        <>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:18}}>
            <div onClick={onGoCalls} style={{...card, padding:"16px 18px", cursor:"pointer"}}>
              <div style={{fontFamily:F.cond, fontWeight:800, fontSize:34, lineHeight:1}}>{made} / {calls?.items?.length || 0}</div>
              <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, marginTop:4}}>CALLS TODAY</div>
              <div style={{height:8, borderRadius:4, background:C.rule, overflow:"hidden", marginTop:10}}><div style={{height:"100%", width:`${calls?.items?.length ? (made / calls.items.length) * 100 : 0}%`, background:C.green}}/></div>
            </div>
            {tile(S.rate.length, "RATE OPPORTUNITIES", C.red)}
            {tile(S.equity.length, "EQUITY CONVERSATIONS", C.green)}
            {tile(S.follow.length, "FOLLOW-UPS DUE", C.amber)}
          </div>
          {!ratesOk && <div style={{...card, padding:"10px 14px", marginBottom:14, background:C.amberBg, color:C.amber, fontFamily:F.mono, fontSize:12}}>Enter today's market rates above to fill Rate opportunities and Watchlist.</div>}
          <Section title="Follow-ups due" color={C.amber} items={S.follow} onOpen={onOpen} whyFor={why.follow}/>
          <Section title="Rate opportunities" color={C.red} note={`threshold ${settings.refi_threshold}%`} items={S.rate} onOpen={onOpen} whyFor={why.rate}/>
          <Section title="Birthdays & anniversaries" color={C.purple} note="this week / this month" items={S.life} onOpen={onOpen} whyFor={why.life}/>
          <Section title="Equity conversations" color={C.green} note={`est. LTV at or below ${settings.equity_ltv_max}%`} items={S.equity} onOpen={onOpen} whyFor={why.equity}/>
          <Section title="Watchlist" color={C.teal} note="above market, not yet past threshold" items={S.watch} onOpen={onOpen} whyFor={why.watch}/>
        </>
      )}
    </div>
  );
}
