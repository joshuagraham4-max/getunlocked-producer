// Shared Radar math + daily call queue + call scripts (used by the Calls and Radar tabs).
import { supabase } from "../supabase.js";

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const digits = (s) => String(s || "").replace(/\D/g, "");
export const fullName = (c) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || c.email || "(no name)";
export const monthsSince = (d) => { if (!d) return null; const a = new Date(d), b = new Date(); return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); };
export const pmt = (amt, rate, n = 360) => { const i = rate / 1200; return i ? (amt * i) / (1 - Math.pow(1 + i, -n)) : amt / n; };
export const balFactor = (rate, n, k) => { const i = rate / 1200; if (!i) return 1 - k / n; const g = Math.pow(1 + i, n); return (g - Math.pow(1 + i, Math.min(k, n))) / (g - 1); };
export const fmtMo = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month:"short", year:"numeric" }) : "";
export const money = (v) => `$${Math.round(v).toLocaleString()}`;
export const BOOKING = "https://calendar.app.google/nz1sdrnBGK1D4LXh7";
export const MY_PHONE = "720-468-6872";
export const DEFAULT_SETTINGS = { refi_threshold:0.5, appreciation_pct:4, equity_ltv_max:70, seasoning_months:7 };

// Load settings, latest market rates and current loans for a user.
import { PLAYBOOKS, investorFollowUps } from "./investorPlaybook.js";
// Radar data is kept in memory so switching tabs doesn't re-download every loan. Screens show the saved copy
// right away (peekRadarData) and refresh it quietly in the background (loadRadarData).
let radarCache = null;
export const peekRadarData = (userId) => (radarCache && radarCache.userId === userId ? radarCache.data : null);
export async function loadRadarData(userId) {
  const data = await fetchRadarData(userId);
  radarCache = { userId, data };
  return data;
}
async function fetchRadarData(userId) {
  const { data: s } = await supabase.from("radar_settings").select("*").eq("user_id", userId).maybeSingle();
  const { data: r } = await supabase.from("market_rates").select("*").eq("user_id", userId).order("day", { ascending:false }).limit(1);
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from("loans").select("contact_id,note_rate,loan_amount,ltv_orig,funded_date,loan_type,loan_type_source,loan_term_months,appraised_value,loan_purpose").eq("is_current", true).range(from, from + 999);
    all.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  return {
    settings: s || DEFAULT_SETTINGS,
    rates: r && r[0] ? { conventional:r[0].conventional ?? "", fha:r[0].fha ?? "", va:r[0].va ?? "" } : { conventional:"", fha:"", va:"" },
    ratesDay: r && r[0] ? r[0].day : null,
    loans: Object.fromEntries(all.map((l) => [l.contact_id, l])),
  };
}

// Rate & equity buckets for past clients.
export function computeRadar(contacts, loans, rates, settings) {
  const out = { conv:[], fha:[], va:[], equity:[], watch:[] }; const info = {};
  if (!loans) return { out, info };
  const thr = Number(settings.refi_threshold) || 0.5, appr = (Number(settings.appreciation_pct) || 0) / 100, eqMax = Number(settings.equity_ltv_max) || 70, season = Number(settings.seasoning_months) || 7;
  const mkt = { Conventional:Number(rates.conventional) || null, FHA:Number(rates.fha) || null, VA:Number(rates.va) || null };
  for (const c of contacts) {
    if ((c.contact_type || "past_client") !== "past_client" || c.do_not_contact || (c.tags || []).includes("sold home")) continue;
    const l = loans[c.id] || {};
    const rate = Number(l.note_rate ?? c.note_rate); if (!rate) continue;
    const type = l.loan_type || c.loan_type || null;
    const prog = type === "FHA" || type === "VA" ? type : "Conventional";
    const est = (l.loan_type_source || c.loan_type_source) !== "verified";
    const funded = l.funded_date || c.funded_date; const months = monthsSince(funded);
    const market = mkt[prog]; const gap = market ? rate - market : null;
    let estLtv = null; const n = l.loan_term_months || 360;
    if (months != null) {
      const grow = Math.pow(1 + appr, months / 12), bf = balFactor(rate, n, months);
      const amt = Number(l.loan_amount || c.loan_amount), val = Number(l.appraised_value || c.home_value || c.appraised_value);
      if (amt && val) estLtv = (amt * bf) / (val * grow) * 100;
      else if (Number(l.ltv_orig || c.ltv_orig)) estLtv = Number(l.ltv_orig || c.ltv_orig) * bf / grow;
    }
    const amt = Number(l.loan_amount || c.loan_amount);
    const save = amt && market && gap > 0 && months != null ? pmt(amt * balFactor(rate, n, months), rate, n - Math.min(months, n - 1)) - pmt(amt * balFactor(rate, n, months), market, 360) : null;
    const i = { rate, type, prog, est, funded, months, market, gap, estLtv, save, purpose:l.loan_purpose || c.loan_purpose };
    info[c.id] = i;
    if (gap != null && gap >= thr) {
      if (prog === "Conventional") { out.conv.push(c); i.bucket = "conv"; }
      else if (months == null || months >= season) { out[prog === "FHA" ? "fha" : "va"].push(c); i.bucket = prog === "FHA" ? "fha" : "va"; }
      else { i.seasoning = true; out.watch.push(c); i.bucket = "watch"; }
    } else if (gap != null && gap > 0) { out.watch.push(c); i.bucket = "watch"; }
    if (estLtv != null && estLtv <= eqMax) { i.pmi = prog === "Conventional" && Number(l.ltv_orig || c.ltv_orig) > 80 && estLtv <= 78; i.equity = true; out.equity.push(c); }
  }
  for (const k of ["conv","fha","va","watch"]) out[k].sort((a, b) => info[b.id].gap - info[a.id].gap);
  out.equity.sort((a, b) => info[a.id].estLtv - info[b.id].estLtv);
  return { out, info };
}

const bdaySoon = (b) => { if (!b) return null; const s = String(b); const mmdd = s.length > 5 ? s.slice(5) : s; for (let k = 0; k < 7; k++) { const d = addDays(k); if (d.slice(5) === mmdd) return k; } return null; };
const dayName = (k) => k === 0 ? "today" : k === 1 ? "tomorrow" : new Date(addDays(k) + "T12:00:00").toLocaleDateString("en-US", { weekday:"long" });
const daysSince = (d) => d ? (Date.now() - new Date(d)) / 864e5 : 9999;

// Birthdays are never missed: due on the day, on Friday for Sat/Sun birthdays, and caught up on
// Saturday-Monday if a weekend birthday was missed and nobody has been contacted since.
const mmddOf = (b) => { if (!b) return null; const s = String(b); return s.length > 5 ? s.slice(5, 10) : s; };
export function bdayDue(c, t = today()) {
  const mmdd = mmddOf(c.birthday); if (!mmdd) return null;
  const dow = new Date(t + "T12:00:00").getDay();       // 0 Sun ... 5 Fri, 6 Sat
  const shift = (n) => { const d = new Date(t + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  if (t.slice(5) === mmdd) return { when:"today", date:t };
  if (dow === 5) for (const n of [1, 2]) if (shift(n).slice(5) === mmdd) return { when: n === 1 ? "Saturday" : "Sunday", date:shift(n) };
  for (const n of [1, 2, 3]) {                          // missed catch-up (up to 3 days back)
    const d = shift(-n); if (d.slice(5) !== mmdd) continue;
    if (!c.last_contacted || c.last_contacted < shift(-n - 2)) return { when:`missed ${new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday:"long" })}`, date:d, missed:true };
  }
  return null;
}
export const segmentOf = (c) => ((c.contact_type || "past_client") === "agent" ? "agents" : "customers");

// One "why now" reason per contact: { key, title, detail, score }
export function reasonFor(c, i, t = today()) {
  const ty = c.contact_type || "past_client"; const tags = c.tags || [];
  const due = c.follow_up_date && c.follow_up_date <= t;
  const b = bdaySoon(c.birthday);
  const r = [];
  const inv = tags.includes("investor lead");
  const invTitle = tags.includes("maturing_hard_money") ? "Investor: hard money coming due" : tags.includes("dead_money") ? "Investor: dead money in equity" : "Investor: portfolio review";
  if (ty === "lead" && due) r.push({ key:"newlead", score: inv ? 1350 : 1300, title: c.email_bad ? "Email bounced: get a new email" : inv ? invTitle : tags.includes("calculator lead") ? "New calculator lead" : "Lead follow-up due", detail: (c.contact_note || "").split("\n").slice(-1)[0] || c.subtype || "" });
  else if (due) r.push({ key:"followup", score:1200, title: c.email_bad ? "Email bounced: get a new email" : (c.tags || []).includes("messenger reply") ? "Agent replied on messenger" : "Follow-up due", detail: c.outcome ? `last outcome: ${c.outcome}` : (c.contact_note || "").split("\n").slice(-1)[0] || "" });
  if (ty === "past_client" && i) {
    if (["conv","fha","va"].includes(i.bucket)) r.push({ key:"rate", score:600 + i.gap * 100, title:`Rate gap +${i.gap.toFixed(2)}%`,
      detail:`${i.rate}% vs ${Number(i.market).toFixed(2)}% ${i.prog === "Conventional" ? "market" : i.prog} today${i.bucket === "fha" ? " · FHA Streamline eligible" : i.bucket === "va" ? " · VA IRRRL eligible" : " · Conventional R&T"}${i.save > 0 ? ` · ~${money(i.save)}/mo` : ""}` });
    if (i.funded && i.funded.slice(5, 7) === t.slice(5, 7) && i.months >= 11) r.push({ key:"anniv", score:320, title:`${Math.round(i.months / 12)}-year loan anniversary`, detail:`closed ${fmtMo(i.funded)}` });
    if (i.equity) r.push({ key:"equity", score:250 + (70 - i.estLtv), title:`Est. ${Math.round(i.estLtv)}% LTV`, detail: i.pmi ? "PMI removal likely" : "cash-out / HELOC conversation" });
    if (i.bucket === "watch") r.push({ key:"watch", score:150 + i.gap * 100, title:`Watchlist +${i.gap.toFixed(2)}%`, detail: i.seasoning ? "not seasoned yet" : "one more rate drop and they qualify" });
  }
  const bd = bdayDue(c, t);
  if (bd) r.push({ key:"bday", score:2000, title: bd.missed ? `Birthday ${bd.when}` : `Birthday ${bd.when}`, detail: ty === "agent" ? (c.company || "") : c.book === "mine" ? "your client" : "" });
  else if (b != null) r.push({ key:"bday", score:450 - b * 10, title:`Birthday ${dayName(b)}`, detail: ty === "agent" ? (c.company || "") : c.book === "mine" ? "your client" : "" });
  if (ty === "past_client" && c.book === "past LO" && !c.last_contacted) r.push({ key:"inherited", score:200, title:"Inherited client", detail:"past LO funding · never contacted" });
  if (ty === "agent") {
    if (c.subtype === "active partner") r.push({ key:"agent", score:700, title:"Active partner", detail: c.company || "" });
    else if (tags.includes("closed deal together")) r.push({ key:"agent", score:500, title:"Closed deals together", detail:`${c.company || ""}${c.last_contacted ? ` · ${Math.round(daysSince(c.last_contacted))} days quiet` : " · never called"}` });
    else r.push({ key:"agent", score:120, title: c.agent_role ? `${c.agent_role[0].toUpperCase() + c.agent_role.slice(1)} agent` : "Agent", detail: c.company || "" });
  }
  if (!r.length && ty === "past_client") r.push({ key:"checkin", score: c.last_contacted ? 40 : 60, title: c.last_contacted ? "Check-in" : "Never contacted", detail: c.book === "mine" ? "your client" : "past LO funding" });
  r.sort((a, b) => b.score - a.score);
  const top = r[0]; if (!top) return null;
  return { ...top, also: r.slice(1).map((x) => x.title) };
}

// Daily queue: target N calls, ~30% agents. Returns [{ id, reason }].
export const priorityScore = (c, reason) => {
  if (!reason) return 0; const ty = c.contact_type || "past_client";
  const tier = ["followup","newlead"].includes(reason.key) ? 5000 : (ty === "past_client" && c.book === "mine") ? 2000 : 0;
  return tier + reason.score + (reason.also?.length || 0) * 15;
};
export function buildQueue(contacts, radar, target = 20) {
  const t = today(); const nAgents = Math.round(target * 0.3), nClients = target - nAgents;
  const pool = { clients:[], agents:[] }; const bdays = [];
  for (const c of contacts) {
    const ty = c.contact_type || "past_client";
    if (c.do_not_contact) continue;
    if (!["past_client","lead","agent","referral_partner"].includes(ty)) continue;
    // Birthdays: always on the list, on top of the target, even if called recently or no phone.
    if (bdayDue(c, t)) { const reason = reasonFor(c, radar.info[c.id], t); bdays.push({ id:c.id, reason, group:segmentOf(c), bday:true, s:9000 + (c.book === "mine" ? 100 : 0) }); continue; }
    if (!c.phone || ty === "referral_partner") continue;              // calls first: needs a phone number
    const due = c.follow_up_date && c.follow_up_date <= t;
    if (c.follow_up_date && c.follow_up_date > t) continue;
    if (ty === "lead" && !due) continue;
    if (!due && daysSince(c.last_contacted) < (ty === "agent" ? 30 : 21)) continue;
    const reason = reasonFor(c, radar.info[c.id], t); if (!reason) continue;
    // Priority tiers: commitments (follow-ups due / new leads) > Joshua's own closings > past LO files.
    const tier = ["followup","newlead"].includes(reason.key) ? 5000 : (ty === "past_client" && c.book === "mine") ? 2000 : 0;
    const s = tier + reason.score + (reason.also.length * 15) + Math.random();
    (ty === "agent" ? pool.agents : pool.clients).push({ id:c.id, reason, group:segmentOf(c), s });
  }
  pool.clients.sort((a, b) => b.s - a.s); pool.agents.sort((a, b) => b.s - a.s);
  const picked = [...pool.clients.slice(0, nClients), ...pool.agents.slice(0, nAgents)];
  if (picked.length < target) picked.push(...pool.clients.slice(nClients, nClients + target - picked.length));
  picked.push(...bdays);
  picked.sort((a, b) => b.s - a.s);
  return picked.map(({ id, reason, group, bday }) => ({ id, reason, group, bday: !!bday }));
}

// Call script + voicemail follow-ups for a contact and reason.
export function scriptsFor(c, i, reason, me = "Joshua Graham") {
  const first = c.first_name || "there"; const yr = i?.funded ? i.funded.slice(0, 4) : "";
  const inherited = c.book === "past LO";
  const hi = inherited ? `Hi ${first}, this is ${me}, AVP at Zero Point Mortgage Services. I'm the loan originator now taking care of your home loan.` : `Hey ${first}, ${me}.`;
  const years = Math.max(1, Math.round((i?.months || 12) / 12));
  const tags = c.tags || [];
  const worked = tags.includes("closed deal together") || c.subtype === "active partner";
  let say, short;
  switch (reason?.key) {
    case "rate":
      say = i?.bucket === "fha" || i?.bucket === "va"
        ? `${hi} I keep an eye on my clients' loans, and yours just came up on my radar. Rates have moved, and on your ${i.bucket === "fha" ? "FHA" : "VA"} loan there's a streamline option. Less paperwork, usually no appraisal. Worth five minutes to see if it pays?`
        : `${hi} I keep an eye on my clients' loans, and yours just came up on my radar. Rates have moved enough that there may be real money on the table for you. Got two minutes so I can tell you what I'm seeing?`;
      short = `Rates have moved since your ${yr} loan, and I'd like to run quick numbers for you`; break;
    case "bday": {
      const bd = bdayDue(c);
      say = bd?.missed
        ? `${first}! ${me}. I'm late, and I'm owning it. Happy birthday. How was it?`
        : `${first}! ${me}. Not calling about anything except to say happy birthday. How are you celebrating?`;
      short = `Happy birthday! Hope it's a great one`; break; }
    case "anniv":
      say = inherited
        ? `${hi} ${years} years ago this month you got the keys. Wanted to check in. How's the house treating you? Still the right fit, or has life changed since?`
        : `Hey ${first}, ${me}. ${years} years ago this month we got you the keys. Wanted to check in. How's the house treating you? Still the right fit, or has life changed since?`;
      short = `Happy home anniversary, ${years} years! Just checking in`; break;
    case "equity":
      say = `${hi} Your home has done some quiet work for you since ${yr || "you bought it"}. There's likely real equity sitting there${i?.pmi ? ", maybe even enough to drop your mortgage insurance" : ""}. Most people don't know what theirs is worth or what it can do. Want me to run the numbers? Free, and you'll know exactly where you stand.`;
      short = `Your home has likely gained real equity, and I can pull a free home value for you`; break;
    case "watch":
      say = `${hi} Heads up: rates are getting close to where it makes sense to look at your loan again. I'm watching it for you. When it hits, I'll call you first. Best number still this one?`;
      short = `Rates are getting close to refi territory for you, and I'm watching it`; break;
    case "inherited":
      say = `Hi ${first}, this is ${me}, AVP at Zero Point Mortgage Services. I'm the loan originator now taking care of your home loan, and I wanted to introduce myself personally. No pitch. If anything ever comes up with your home or your money, I'm your guy. Is this still the best number for you?`;
      short = `I'm the loan originator now taking care of your loan and wanted to introduce myself`; break;
    case "newlead": if ((c.tags || []).includes("investor lead")) {
      const t = c.tags || []; const rev = /Portfolio Review/.test(c.contact_note || "");
      if (t.includes("maturing_hard_money") && !rev) say = `Hey ${first}, ${me}, AVP at Zero Point Mortgage Services. I work with investors, and public records show a short-term loan on one of your properties that's probably coming due soon. When it does, I can roll you into a long-term loan where the rent qualifies it, no tax returns. Rates are in the high sixes right now. What's your plan for that one?`;
      else if (t.includes("dead_money") && !rev) say = `Hey ${first}, ${me}, AVP at Zero Point Mortgage Services. I work with rental owners. Quick question: you've got real equity sitting in your rentals that isn't earning you anything. I do free portfolio reviews: what you own, where the cash is stuck, and how to pull it out for the next one without your tax returns. Got two minutes?`;
      else say = `Hey ${first}, ${me}. You filled out my portfolio review. Thanks. I looked at what you sent${t.includes("maturing_hard_money") ? ", and that hard money loan is the first thing I want to solve" : ""}. Walk me through your properties for a minute: what's the one you'd most like to pull cash out of?`;
      short = `I'd like to walk you through your free portfolio review and where your equity could be working harder`; break;
    } else {
      const rental = tags.some((x) => /rtl|rental|cash|flow/i.test(x)) || /rental/i.test(c.subtype || "");
      say = `Hey ${first}, ${me}. You ran the numbers on our ${rental ? "rental" : "home"} calculator. Smart move. What's the property you're looking at?`;
      short = `Thanks for running the numbers on our calculator. I'd love to walk through it with you`; break; }
    case "followup":
      say = c.outcome === "talked" || c.outcome === "replied to email"
        ? `Hey ${first}, ${me}. I've got those numbers we talked about. Got a minute?`
        : `Hey ${first}, ${me} again. Wanted to catch you live this time. Quick question for you: how's everything with the house?`;
      short = `Following up from our last conversation`; break;
    case "agent":
      say = worked
        ? `Hey ${first}, ${me}. It's been too long since our last closing together. What are you working on right now? Anybody stuck I can help get to the table?`
        : `Hey ${first}, ${me} with Graham Financial. Quick one: when your buyers think they can't buy yet (self-employed, need to sell first, think they need more saved), who do you send them to? Most of them are closer than they think. I'd like to be that call for you.`;
      short = `Checking in to see who in your pipeline I can help`; break;
    default:
      say = inherited
        ? `${hi} Just checking in. How's life, and anything going on with the house?`
        : `Hey ${first}, ${me}. You were on my mind and I hadn't heard from you in a while. How's life? Anything going on with the house?`;
      short = `Quick check-in, you were on my mind`;
  }
  const vmText = `Hi ${first}, it's ${me}. Just tried you. ${short}. Call or text me back at ${MY_PHONE} when you have a minute, or grab a time here: ${BOOKING}`;
  const emailSubject = reason?.key === "bday" ? "Happy birthday!" : reason?.key === "rate" ? "Quick rate check" : "Checking in";
  const emailBody = `Hi ${first},\n\nI just tried giving you a call. ${short}.\n\nGive me a call or text at ${MY_PHONE}, or pick a time that works for you: ${BOOKING}\n\n${me}\nGraham Financial`;
  const invKind = reason?.key === "newlead" && tags.includes("investor lead") ? (tags.includes("maturing_hard_money") ? "maturing_hard_money" : tags.includes("dead_money") ? "dead_money" : null) : null;
  if (invKind) { const f = investorFollowUps(c, invKind, me, MY_PHONE, BOOKING); return { say, vmText:f.vmText, emailSubject:f.emailSubject, emailBody:f.emailBody, playbook:PLAYBOOKS[invKind] }; }
  return { say, vmText, emailSubject, emailBody };
}

export const REASON_COLOR = { rate:"#9e3020", bday:"#5b3fa6", equity:"#1e6e4a", inherited:"#1a4f8a", followup:"#b05e0d", newlead:"#b05e0d", anniv:"#1a6570", watch:"#b05e0d", agent:"#7a6a1e", checkin:"#6b6358" };
export const REASON_BG = { rate:"#fbeae7", bday:"#eeebf8", equity:"#e8f4ee", inherited:"#e6eef9", followup:"#fdf0e0", newlead:"#fdf0e0", anniv:"#e4f2f4", watch:"#fdf0e0", agent:"#f8f4e3", checkin:"#f0ece5" };

// Log an outcome: touch row + contact fields. Returns the updated contact.
export async function logOutcome(userId, c, result, note, followUp, channel = "call") {
  const prev = { last_contacted:c.last_contacted ?? null, outcome:c.outcome ?? null, follow_up_date:c.follow_up_date ?? null, contact_note:c.contact_note ?? null };
  const { data:touch } = await supabase.from("contact_touches").insert({ user_id:userId, contact_id:c.id, channel, outcome:result, note:note || null }).select("id").single();
  const line = `${today()}: ${channel === "call" ? "" : channel + " · "}${result}${note ? ` — ${note}` : ""}`;
  const fields = { last_contacted:today(), outcome:result, contact_note:[c.contact_note, line].filter(Boolean).join("\n") };
  if (followUp !== undefined) fields.follow_up_date = followUp;
  const { data } = await supabase.from("contacts").update(fields).eq("id", c.id).select().single();
  saveUndo(userId, c.id, { prev, touchId:touch?.id || null });
  return data;
}

// Undo: every logged outcome keeps a same-day snapshot so it can be reversed exactly.
const undoKey = (userId) => `gupUndo:${userId}:${today()}`;
const readUndo = (userId) => { try { return JSON.parse(localStorage.getItem(undoKey(userId)) || "{}"); } catch { return {}; } };
function saveUndo(userId, id, snap) { const u = readUndo(userId); (u[id] = u[id] || []).push(snap); try { localStorage.setItem(undoKey(userId), JSON.stringify(u)); } catch {} }
export const canUndo = (userId, id) => !!(readUndo(userId)[id] || []).length;
export async function undoOutcome(userId, id) {
  const u = readUndo(userId); const stack = u[id] || []; const snap = stack.pop(); if (!snap) return null;
  if (snap.touchId) await supabase.from("contact_touches").delete().eq("id", snap.touchId);
  const { data, error } = await supabase.from("contacts").update(snap.prev).eq("id", id).select().single();
  if (error) return null;
  u[id] = stack; try { localStorage.setItem(undoKey(userId), JSON.stringify(u)); } catch {}
  return data;
}

// Wrong number: ask for the new number by email.
export function wrongNumberEmail(c, me = "Joshua Graham") {
  const first = c.first_name || "there";
  return {
    subject: "Trying to reach you",
    body: `Hi ${first},\n\nI tried calling you at ${c.phone || "the number I have on file"}, and it looks like that number isn't yours anymore. What's the best number to reach you?\n\nThanks,\n${me}\nAVP / Regional Loan Originator\nGraham Financial powered by Zero Point Mortgage Services\nNMLS 169809 | ${MY_PHONE}`,
  };
}
