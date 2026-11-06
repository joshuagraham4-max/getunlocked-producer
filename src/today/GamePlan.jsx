// Prospecting day: the Daily Game Plan inside the app. Locked call block, live "now" bar, dollar tracker,
// perfect-day streak, activity counted automatically from Calls / Emails / Groups, optional personal routine.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "../supabase.js";
import { JOSHUA, DEFAULT, defaultSettings, STANDARD_LINES, JOSHUA_LINES, MILESTONES, JOSHUA_MILESTONES, JOSHUA_ID } from "./templates.js";

const C = { bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", greenBg:"#e8f4ee", greenBd:"#b8dece", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020", redBg:"#fbeae7", purple:"#5b3fa6", purpleBg:"#eeebf8" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };
const card = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10 };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"8px 14px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer" };
const btnG = { ...btn, background:C.green, borderColor:C.green, color:"#fff" };
const inp = { padding:"7px 9px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:14, color:C.ink, boxSizing:"border-box" };
const TAG = { money:["Money",C.green,C.greenBg], build:["Build",C.purple,C.purpleBg], rest:["Energy",C.amber,C.amberBg], fixed:["Fixed",C.mid,"#efe9df"], family:["Family",C.purple,C.purpleBg], penalty:["Reset",C.red,C.redBg] };
const PENALTY_MIN = 75;

const toM = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toT = (m) => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const fmt = (t) => { let [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${ap}`; };
const ymd = (x) => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
// The day rolls over at 5:00 AM local (lights out belongs to the day before).
const dayKey = (d = new Date()) => { const x = new Date(d); if (x.getHours() * 60 + x.getMinutes() < 300) x.setDate(x.getDate() - 1); return ymd(x); };
// Minutes the given time zone is ahead of this device right now.
const tzAhead = (tz) => { try { const d = new Date(); return Math.round((new Date(d.toLocaleString("en-US", { timeZone:tz })) - new Date(d.toLocaleString("en-US"))) / 60000 / 15) * 15; } catch { return 0; } };
const TZ = [["America/New_York","Eastern"],["America/Chicago","Central"],["America/Denver","Mountain"],["America/Los_Angeles","Pacific"]];

const BLANK_DAY = { gym:"630", missed:false, pool:false, done:{}, manual:{}, notes:"", med:[] };

export default function GamePlan({ userId, avgCommission, onGoCalls }) {
  const KEY = dayKey();
  const me = userId === JOSHUA_ID;
  const [settings, setSettings] = useState(null);
  const [day, setDay] = useState(BLANK_DAY);
  const [history, setHistory] = useState({});
  const [auto, setAuto] = useState({ dials:0, conv:0, booked:0, emails:0, posts:0, dms:0 });
  const [showSet, setShowSet] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [, tick] = useState(0);
  const loaded = useRef(false); const saveT = useRef(null); const prevEarned = useRef(null); const lastLine = useRef("");

  // ---------- load ----------
  useEffect(() => { if (!userId) return; loaded.current = false; (async () => {
    const [{ data:s }, { data:d }, { data:h }] = await Promise.all([
      supabase.from("game_plan_settings").select("settings").eq("user_id", userId).maybeSingle(),
      supabase.from("game_plan_days").select("data").eq("user_id", userId).eq("day", KEY).maybeSingle(),
      supabase.from("game_plan_days").select("day,data").eq("user_id", userId).order("day", { ascending:false }).limit(120),
    ]);
    setSettings({ ...defaultSettings(userId, avgCommission), ...(s?.settings || {}) });
    // Start each day from a blank slate. Merging onto the old state carried yesterday's checkmarks into today.
    setDay({ ...BLANK_DAY, ...(d?.data || {}) });
    setHistory(Object.fromEntries((h || []).map((r) => [r.day, r.data])));
    loaded.current = true;
  })(); }, [userId, KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAuto = useCallback(async () => {
    if (!userId) return;
    const start = new Date(KEY + "T00:00:00").toISOString();
    const [{ data:t }, { data:g }, { data:pp }, { data:dm }] = await Promise.all([
      supabase.from("contact_touches").select("channel,outcome").eq("user_id", userId).gte("touched_at", start).limit(2000),
      supabase.from("group_post_log").select("id").eq("user_id", userId).gte("created_at", start).limit(500),
      supabase.from("profile_posts").select("id").eq("user_id", userId).gte("posted_at", start).limit(50),
      supabase.from("agent_outreach").select("id").eq("user_id", userId).gte("sent_at", start).limit(500),
    ]);
    const rows = t || [];
    setAuto({
      dials: rows.filter((r) => r.channel === "call").length,
      conv: rows.filter((r) => r.channel === "call" && (r.outcome === "talked" || r.outcome === "booked")).length,
      booked: rows.filter((r) => r.outcome === "booked").length,
      emails: rows.filter((r) => r.channel === "email" && /^email \d sent$/.test(r.outcome || "")).length,
      posts: (g || []).length + (pp || []).length,
      dms: (dm || []).length,
    });
  }, [userId, KEY]);
  useEffect(() => { loadAuto(); const i = setInterval(() => { loadAuto(); tick((n) => n + 1); }, 60000); return () => clearInterval(i); }, [loadAuto]);

  // ---------- plan ----------
  const tpl = settings?.template === "joshua" ? JOSHUA : DEFAULT;
  const routine = !!settings?.routine;
  const plan = useMemo(() => {
    if (!settings) return [];
    const gym = routine && tpl.gymTiers.length ? day.gym : "default";
    const morn = tpl.morning[gym === "am" ? "am" : "default"] || tpl.morning.default;
    const dayBlocks = settings.customDay || tpl.day;
    let eve = tpl.evening[gym] || tpl.evening.default || tpl.evening[Object.keys(tpl.evening)[0]] || [];
    if (routine && day.missed && tpl.gymTiers.length) {   // missed the morning ritual: reset run comes out of dinner and free time
      if (gym === "630") eve = tpl.evening["830"];
      const i = eve.findIndex((r) => /^Dinner, family/.test(r[2]));
      if (i >= 0) { const [a, b] = eve[i]; const s = toM(a); eve = [...eve.slice(0, i), [a, toT(s + PENALTY_MIN), "Reset run: 5 miles + shower", "penalty", "I keep my word to myself. Comes out of free time, never out of selling.", { personal:true }], [toT(s + PENALTY_MIN), b, "Dinner, family", "family", "Shorter tonight.", { personal:true }], ...eve.slice(i + 1)]; }
    }
    const shift = -tzAhead(settings.callBlock.tz);    // call block is set in its own time zone; show it in local time
    return [...morn, ...dayBlocks, ...eve]
      .filter((r) => routine || !(r[5] && r[5].personal))
      .map(([a, b, n, k, d, f]) => {
        if (f && f.lock) { a = toT(toM(settings.callBlock.start) + shift); b = toT(toM(settings.callBlock.end) + shift); }
        let s = toM(a), e = toM(b); if (e <= s) e += 1440;
        return { a, b, n, k, d, f: f || {}, s, e };
      })
      .sort((x, y) => (x.s < 300 ? x.s + 1440 : x.s) - (y.s < 300 ? y.s + 1440 : y.s));
  }, [settings, tpl, routine, day.gym, day.missed]);

  // ---------- numbers ----------
  const callTarget = (() => { try { return Number(localStorage.getItem(`gupTarget:${userId}`)) || 20; } catch { return 20; } })();
  const emailTarget = (() => { try { return Number(localStorage.getItem(`gupEmailTarget:${userId}`)) || 10; } catch { return 10; } })();
  const v = settings?.values || {};
  const m = day.manual || {};
  const earnedParts = settings ? [
    ["dial", auto.dials, "dials"], ["conv", auto.conv, "conversations"], ["email", auto.emails, "emails"], ["post", auto.posts, "group posts"], ["dm", auto.dms, "agent DMs"],
    ["app", m.apps || 0, "apps"], ["video", m.videos || 0, "videos"],
  ] : [];
  const val = (k) => (v[k] ?? (k === "dm" ? 10 : 0));   // agent DMs default to $10 each
  const earned = earnedParts.reduce((s, [k, n]) => s + n * val(k), 0);

  const evaluate = useCallback((rec, a) => {
    const crit = [];
    if (routine) crit.push(["Morning ritual done", !!rec.pool && !rec.missed]);
    if (routine && tpl.gymTiers.length) crit.push(["Gym done", !!(rec.done || {})["Gym"]]);
    crit.push(["Call block worked", !!(rec.done || {})["Call block"]]);
    crit.push([`Calls target (${callTarget})`, a.dials >= callTarget]);
    crit.push([`Conversations (${settings?.targets?.conv || 5})`, a.conv >= (settings?.targets?.conv || 5)]);
    crit.push([`Emails sent (${emailTarget})`, a.emails >= emailTarget]);
    crit.push([`Group posts (${settings?.targets?.posts || 7})`, a.posts >= (settings?.targets?.posts || 7)]);
    if (routine) crit.push(["Lights out on time", !!(rec.done || {})["Lights out"]]);
    return { crit, met:crit.filter((c) => c[1]).length, perfect:crit.every((c) => c[1]) };
  }, [routine, tpl, callTarget, emailTarget, settings]);
  const ev = evaluate(day, auto);

  const streak = useMemo(() => {
    let n = 0; const cur = new Date(KEY + "T12:00:00");
    if (!ev.perfect) cur.setDate(cur.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      const k = ymd(cur), rec = k === KEY ? { perfect:ev.perfect } : history[k], dow = cur.getDay();
      if (!rec) { if (dow === 0 || dow === 6) { cur.setDate(cur.getDate() - 1); continue; } break; }
      if (!rec.perfect) break; n++; cur.setDate(cur.getDate() - 1);
    }
    return n;
  }, [history, ev.perfect, KEY]);

  // ---------- save ----------
  const persist = useCallback((next) => {
    if (!loaded.current) return;
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      const data = { ...next, perfect:evaluate(next, auto).perfect, earned };
      supabase.from("game_plan_days").upsert({ user_id:userId, day:KEY, data, updated_at:new Date().toISOString() }).then();
    }, 500);
  }, [userId, KEY, evaluate, auto, earned]);
  const update = (fn) => setDay((d) => { const n = fn(d); persist(n); return n; });
  useEffect(() => { if (loaded.current) persist(day); }, [auto.dials, auto.conv, auto.emails, auto.posts, auto.dms]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveSettings = async (patch) => {
    const n = { ...settings, ...patch }; setSettings(n);
    await supabase.from("game_plan_settings").upsert({ user_id:userId, settings:n, updated_at:new Date().toISOString() });
  };

  // ---------- messages ----------
  const lines = settings?.messages === "mine" ? ((settings.myMessages || []).length ? settings.myMessages : (me ? JOSHUA_LINES : STANDARD_LINES)) : STANDARD_LINES;
  const toast = (text) => { if (!text || settings?.messages === "off") return; setToastMsg(text); clearTimeout(toast.t); toast.t = setTimeout(() => setToastMsg(null), 4500); };
  const cheer = () => { let s; do { s = lines[Math.floor(Math.random() * lines.length)]; } while (lines.length > 1 && s === lastLine.current); lastLine.current = s; toast(s); };
  useEffect(() => {
    if (prevEarned.current !== null && earned > prevEarned.current) {
      const ms = settings?.messages === "mine" && me ? JOSHUA_MILESTONES : MILESTONES;
      const hit = Object.keys(ms).map(Number).filter((x) => prevEarned.current < x && earned >= x).pop();
      if (hit) toast(ms[hit]); else cheer();
    }
    prevEarned.current = earned;
  }, [earned]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!settings) return <div style={{fontFamily:F.mono, fontSize:12, color:C.light}}>Loading your game plan...</div>;

  // ---------- now ----------
  const d = new Date(); let nowM = d.getHours() * 60 + d.getMinutes(); if (nowM < 300) nowM += 1440;
  const at = (r) => { const s = r.s < 300 ? r.s + 1440 : r.s; const e = r.e - r.s + s; return nowM >= s && nowM < e; };
  const cur = plan.find(at);
  const left = cur ? ((cur.s < 300 ? cur.s + 1440 : cur.s) + (cur.e - cur.s)) - nowM : 0;
  const callLive = cur && cur.f.lock;
  const cbLocal = plan.find((r) => r.f.lock);
  const tzName = (TZ.find(([z]) => z === settings.callBlock.tz) || [, "local"])[1];

  const Count = ({ label, n, goal, autoTag, k }) => (
    <div style={{border:`1px solid ${C.rule}`, borderRadius:8, padding:"10px 12px", background:"#fff"}}>
      <div style={{...lbl, fontSize:11}}>{label}{autoTag && <span style={{fontFamily:F.mono, fontSize:9, letterSpacing:0, color:C.green, background:C.greenBg, padding:"1px 6px", borderRadius:9, marginLeft:6}}>AUTO</span>}</div>
      <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize:26, color: goal && n >= goal ? C.green : C.ink}}>{n}{goal ? <span style={{fontSize:15, color:C.light, fontWeight:600}}> / {goal}</span> : null}</div>
        {k && <div style={{display:"flex", gap:4}}>
          <button onClick={() => update((x) => ({ ...x, manual:{ ...x.manual, [k]:Math.max(0, ((x.manual || {})[k] || 0) - 1) } }))} style={{...btn, padding:"2px 9px"}}>-</button>
          <button onClick={() => update((x) => ({ ...x, manual:{ ...x.manual, [k]:((x.manual || {})[k] || 0) + 1 } }))} style={{...btn, padding:"2px 9px"}}>+</button>
        </div>}
      </div>
      {goal ? <div style={{height:6, borderRadius:3, background:C.rule, overflow:"hidden", marginTop:6}}><div style={{height:"100%", width:`${Math.min(100, n / goal * 100)}%`, background:C.green}}/></div> : null}
    </div>
  );
  const EXTRA = { apps:"Apps taken", videos:"Training videos", proposals:"Website proposals", sold:"Websites sold" };
  const wide = typeof window !== "undefined" && window.innerWidth >= 1000;

  return (
    <div>
      {/* now bar */}
      <div style={{background: callLive ? C.green : C.ink, color:"#fff", borderRadius:10, padding:"13px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap"}}>
        <div style={{fontFamily:F.cond, fontWeight:800, fontSize:22, letterSpacing:"0.03em", textTransform:"uppercase"}}>{callLive ? "Call block · live" : cur ? cur.n : "Between blocks"}</div>
        <div style={{display:"flex", gap:12, alignItems:"center", fontFamily:F.mono, fontSize:12}}>
          {callLive ? <span>{fmt(settings.callBlock.start)}-{fmt(settings.callBlock.end)} {tzName} · {left} min left · {auto.dials} of {callTarget} calls</span>
            : <span>{cur ? `${left} min left` : ""}{cbLocal && !callLive ? ` · call block ${fmt(cbLocal.a)}` : ""}</span>}
          <button onClick={onGoCalls} style={{...btn, padding:"5px 12px", background:"#fff", color:C.ink, borderColor:"#fff"}}>Go to calls</button>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns: wide ? "1.1fr 1fr" : "1fr", gap:16}}>
        <div>
          <div style={{...card, padding:"16px 18px"}}>
            <div style={{display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:14}}>
              <div style={{background:C.greenBg, border:`1px solid ${C.greenBd}`, borderRadius:10, padding:"14px 16px"}}>
                <div style={{...lbl, color:C.green}}>Earned today</div>
                <div style={{fontFamily:F.cond, fontWeight:800, fontSize:54, color:C.green, lineHeight:1}}>${earned.toLocaleString()}</div>
                <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, marginTop:4}}>{earnedParts.filter(([, n]) => n).map(([k, n, l]) => `${n} ${l} x $${val(k).toLocaleString()}`).join(" · ") || "Every call counts. Start the scoreboard."}</div>
              </div>
              <div style={{padding:"4px"}}>
                <div style={lbl}>Perfect-day streak</div>
                <div style={{fontFamily:F.cond, fontWeight:800, fontSize:54, lineHeight:1}}>{streak}</div>
                <div style={{fontFamily:F.mono, fontSize:11, color: ev.perfect ? C.green : C.mid}}>{ev.perfect ? "Perfect day" : `${ev.met} of ${ev.crit.length} today`}</div>
                <div style={{height:6, borderRadius:3, background:C.rule, overflow:"hidden", marginTop:6}}><div style={{height:"100%", width:`${ev.met / ev.crit.length * 100}%`, background:C.green}}/></div>
              </div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginTop:14}}>
              <Count label="Dials" n={auto.dials} goal={callTarget} autoTag/>
              <Count label="Conversations" n={auto.conv} goal={settings.targets.conv} autoTag/>
              <Count label="Emails sent" n={auto.emails} goal={emailTarget} autoTag/>
              <Count label="Posts (profile + groups)" n={auto.posts} goal={settings.targets.posts} autoTag/>
              <Count label="Agent DMs" n={auto.dms} goal={10} autoTag/>
              <Count label="Booked" n={auto.booked} autoTag/>
              {(settings.extraCounters || []).map((k) => <Count key={k} label={EXTRA[k] || k} n={m[k] || 0} k={k}/>)}
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 14px", marginTop:14, fontSize:14}}>
              {ev.crit.map(([t, ok]) => <div key={t} style={{color: ok ? C.ink : C.mid}}><span style={{display:"inline-block", width:11, height:11, borderRadius:"50%", border:`2px solid ${ok ? C.green : C.rule}`, background: ok ? C.green : "transparent", marginRight:8, verticalAlign:-1}}/>{t}</div>)}
            </div>
            <textarea value={day.notes || ""} onChange={(e) => update((x) => ({ ...x, notes:e.target.value }))} placeholder="Field notes: when did real work happen? What got in the way?" rows={2} style={{...inp, width:"100%", marginTop:14, fontFamily:F.body, resize:"vertical"}}/>
          </div>

          {routine && <Routine day={day} update={update} tpl={tpl} cheer={cheer}/>}

          <div style={{marginTop:12, display:"flex", gap:8}}>
            <button onClick={() => setShowSet((s) => !s)} style={btn}>{showSet ? "Close settings" : "Game plan settings"}</button>
          </div>
          {showSet && <Settings settings={settings} save={saveSettings} tpl={tpl}/>}
        </div>

        <div style={{...card, overflow:"hidden", alignSelf:"start"}}>
          <div style={{padding:"14px 16px", ...lbl}}>Schedule · Go hard prospect</div>
          {plan.map((r, i) => {
            const t = TAG[r.k] || TAG.fixed; const on = !!(day.done || {})[r.n]; const now = cur === r;
            return (
              <div key={i} style={{display:"grid", gridTemplateColumns:"92px 1fr 26px", gap:12, padding:"10px 16px", borderTop:"1px solid #ece5d9", alignItems:"center", background: now ? C.greenBg : r.k === "penalty" ? C.redBg : "transparent", borderLeft: now ? `4px solid ${C.green}` : "4px solid transparent"}}>
                <div style={{fontFamily:F.mono, fontSize:12, color: now ? C.green : C.mid}}>{fmt(r.a)}</div>
                <div>
                  <span style={{fontFamily:F.mono, fontSize:9, letterSpacing:"0.08em", textTransform:"uppercase", padding:"2px 7px", borderRadius:9, marginRight:6, background:t[2], color:t[1]}}>{t[0]}</span>
                  <span style={{fontWeight: r.f.lock ? 700 : 400, textDecoration: on ? "line-through" : "none", color: on ? C.mid : C.ink}}>{r.n}</span>
                  {r.f.lock && <span style={{fontFamily:F.mono, fontSize:9, background:C.ink, color:"#fff", padding:"2px 7px", borderRadius:9, marginLeft:8}}>LOCKED DAILY</span>}
                  {r.f.lock && <div style={{fontFamily:F.mono, fontSize:10, color:C.mid}}>Colorado {fmt(toT(toM(settings.callBlock.start) - tzAhead(settings.callBlock.tz) + tzAhead("America/Denver")))}-{fmt(toT(toM(settings.callBlock.end) - tzAhead(settings.callBlock.tz) + tzAhead("America/Denver")))}</div>}
                  {!r.f.lock && r.d && <div style={{fontSize:12, color:C.mid}}>{r.d}</div>}
                </div>
                {r.f.check ? <input type="checkbox" checked={on} onChange={(e) => { const c = e.target.checked; update((x) => ({ ...x, done:{ ...x.done, [r.n]:c } })); if (c) cheer(); }} style={{width:20, height:20, accentColor:C.green, cursor:"pointer"}}/> : <span/>}
              </div>
            );
          })}
        </div>
      </div>

      {toastMsg && <div style={{position:"fixed", left:"50%", bottom:22, transform:"translateX(-50%)", background:C.ink, color:"#fff", borderRadius:10, padding:"13px 20px", fontFamily:F.cond, fontWeight:700, fontSize:19, zIndex:50, maxWidth:"calc(100% - 32px)", boxShadow:"0 10px 30px rgba(0,0,0,.25)"}}>{toastMsg}</div>}
    </div>
  );
}

function Timer({ options, label, onDone }) {
  const [left, setLeft] = useState(null); const total = useRef(0); const id = useRef(null);
  const stop = (log) => { clearInterval(id.current); id.current = null; if (log && onDone) onDone(Math.round((total.current - left) / 60)); setLeft(null); };
  const start = (mins) => { total.current = mins * 60; setLeft(mins * 60); clearInterval(id.current);
    id.current = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(id.current); id.current = null; onDone && onDone(Math.round(total.current / 60)); return 0; } return l - 1; }), 1000); };
  useEffect(() => () => clearInterval(id.current), []);
  return (
    <div style={{display:"flex", gap:6, alignItems:"center", flexWrap:"wrap"}}>
      <span style={{fontFamily:F.cond, fontWeight:700, fontSize:14, minWidth:110}}>{label}</span>
      {left === null ? options.map((x) => <button key={x} onClick={() => start(x)} style={btn}>{x} min</button>)
        : <><span style={{fontFamily:F.mono, fontSize:16, minWidth:52, color: left === 0 ? C.red : C.ink}}>{left === 0 ? "Done" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</span><button onClick={() => stop(left > 0)} style={btn}>{left === 0 ? "Close" : "Stop"}</button></>}
    </div>
  );
}

function Routine({ day, update, tpl, cheer }) {
  const med = day.med || []; const tierNote = (tpl.gymTiers.find(([k]) => k === day.gym) || [])[2];
  return (
    <div style={{...card, padding:"14px 18px", marginTop:16}}>
      <div style={{...lbl, display:"flex", justifyContent:"space-between"}}><span>My routine</span><span style={{fontFamily:F.mono, fontSize:10, letterSpacing:0, textTransform:"none"}}>only you see this</span></div>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:8, alignItems:"center"}}>
        <button onClick={() => { update((x) => ({ ...x, pool:!x.pool, missed: x.pool ? x.missed : false })); if (!day.pool) cheer(); }} style={day.pool ? btnG : btn}>{day.pool ? "Morning ritual done" : "I'm in. Morning ritual done."}</button>
        <label style={{fontFamily:F.mono, fontSize:12, display:"flex", gap:6, alignItems:"center", color: day.missed ? C.red : C.mid}}><input type="checkbox" checked={!!day.missed} onChange={(e) => update((x) => ({ ...x, missed:e.target.checked, pool: e.target.checked ? false : x.pool }))} style={{accentColor:C.red}}/> I missed it today (adds the reset run)</label>
      </div>
      <div style={{display:"grid", gap:8, marginTop:12}}>
        <Timer label="Meditation / prayer" options={[15, 20, 30]} onDone={(mins) => mins > 0 && update((x) => ({ ...x, med:[...(x.med || []), mins] }))}/>
        <Timer label="X + Facebook" options={[5]}/>
        <div style={{fontFamily:F.mono, fontSize:11, color:C.purple}}>{med.length ? `Today: ${med.reduce((a, b) => a + b, 0)} min across ${med.length} session${med.length > 1 ? "s" : ""}` : "No meditation logged yet today."}</div>
      </div>
      {tpl.gymTiers.length > 0 && <>
        <div style={{...lbl, marginTop:12}}>Gym today, ranked by what it costs</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:6}}>{tpl.gymTiers.map(([k, l]) => <button key={k} onClick={() => update((x) => ({ ...x, gym:k }))} style={day.gym === k ? btnG : btn}>{l}</button>)}</div>
        {tierNote && <div style={{fontSize:13, color: day.gym === "415" || day.gym === "830" ? C.amber : C.mid, marginTop:6}}>{tierNote}</div>}
      </>}
    </div>
  );
}

function Settings({ settings, save, tpl }) {
  const [s, setS] = useState(settings);
  const [msgs, setMsgs] = useState((settings.myMessages || []).join("\n"));
  const [blocks, setBlocks] = useState(settings.customDay || tpl.day);
  const field = (label, el) => <label style={{display:"grid", gap:3}}><span style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{label}</span>{el}</label>;
  const setB = (i, j, val) => setBlocks((b) => b.map((r, k) => (k === i ? r.map((x, q) => (q === j ? val : x)) : r)));
  return (
    <div style={{...card, padding:"14px 18px", marginTop:10, display:"grid", gap:14}}>
      <div>
        <div style={lbl}>Call block (locked every day)</div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:6}}>
          {field("Start", <input type="time" value={s.callBlock.start} onChange={(e) => setS({ ...s, callBlock:{ ...s.callBlock, start:e.target.value } })} style={inp}/>)}
          {field("End", <input type="time" value={s.callBlock.end} onChange={(e) => setS({ ...s, callBlock:{ ...s.callBlock, end:e.target.value } })} style={inp}/>)}
          {field("Time zone", <select value={s.callBlock.tz} onChange={(e) => setS({ ...s, callBlock:{ ...s.callBlock, tz:e.target.value } })} style={inp}>{TZ.map(([z, n]) => <option key={z} value={z}>{n}</option>)}</select>)}
        </div>
      </div>
      <div style={{display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end"}}>
        {field("My routine (gym, ritual, timers)", <select value={s.routine ? "on" : "off"} onChange={(e) => setS({ ...s, routine:e.target.value === "on" })} style={inp}><option value="on">On</option><option value="off">Off</option></select>)}
        {field("Messages", <select value={s.messages} onChange={(e) => setS({ ...s, messages:e.target.value })} style={inp}><option value="off">Off</option><option value="standard">Standard</option><option value="mine">My own</option></select>)}
        {field("Conversations target", <input type="number" value={s.targets.conv} onChange={(e) => setS({ ...s, targets:{ ...s.targets, conv:Number(e.target.value) } })} style={{...inp, width:90}}/>)}
        {field("Group posts target", <input type="number" value={s.targets.posts} onChange={(e) => setS({ ...s, targets:{ ...s.targets, posts:Number(e.target.value) } })} style={{...inp, width:90}}/>)}
      </div>
      {s.messages === "mine" && field("My messages, one per line (blank uses the preset list)", <textarea value={msgs} onChange={(e) => setMsgs(e.target.value)} rows={4} style={{...inp, fontFamily:F.body}}/>)}
      <div>
        <div style={lbl}>Dollar value of each activity</div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:6}}>
          {[["dial","Dial"],["conv","Conversation"],["email","Email"],["post","Group post"],["dm","Agent DM"],["app","App"],["video","Video"]].map(([k, l]) => field(l, <input key={k} type="number" value={s.values[k] ?? (k === "dm" ? 10 : 0)} onChange={(e) => setS({ ...s, values:{ ...s.values, [k]:Number(e.target.value) } })} style={{...inp, width:90}}/>))}
        </div>
      </div>
      <div>
        <div style={lbl}>Work day blocks (the call block's time comes from above)</div>
        {blocks.map((r, i) => (
          <div key={i} style={{display:"flex", gap:6, marginTop:6, alignItems:"center", flexWrap:"wrap"}}>
            <input type="time" value={r[0]} onChange={(e) => setB(i, 0, e.target.value)} style={{...inp, width:110}} disabled={r[5] && r[5].lock}/>
            <input type="time" value={r[1]} onChange={(e) => setB(i, 1, e.target.value)} style={{...inp, width:110}} disabled={r[5] && r[5].lock}/>
            <input value={r[2]} onChange={(e) => setB(i, 2, e.target.value)} style={{...inp, flex:"1 1 180px"}} disabled={r[5] && r[5].lock}/>
            <select value={r[3]} onChange={(e) => setB(i, 3, e.target.value)} style={inp}>{Object.keys(TAG).filter((k) => k !== "penalty").map((k) => <option key={k} value={k}>{TAG[k][0]}</option>)}</select>
            {!(r[5] && r[5].lock) && <button onClick={() => setBlocks((b) => b.filter((_, k) => k !== i))} style={{...btn, padding:"4px 9px"}}>Remove</button>}
          </div>))}
        <div style={{display:"flex", gap:8, marginTop:8}}>
          <button onClick={() => setBlocks((b) => [...b, ["17:00","17:30","New block","money","",{ check:true }]])} style={btn}>+ Add block</button>
          <button onClick={() => setBlocks(tpl.day)} style={btn}>Reset to template</button>
        </div>
      </div>
      <div><button onClick={() => save({ ...s, myMessages:msgs.split("\n").map((x) => x.trim()).filter(Boolean), customDay:blocks })} style={btnG}>Save settings</button></div>
    </div>
  );
}
