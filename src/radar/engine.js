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
export async function loadRadarData(userId) {
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
    if ((c.contact_type || "past_client") !== "past_client" || c.do_not_contact) continue;
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

// One "why now" reason per contact: { key, title, detail, score }
export function reasonFor(c, i, t = today()) {
  const ty = c.contact_type || "past_client"; const tags = c.tags || [];
  const due = c.follow_up_date && c.follow_up_date <= t;
  const b = bdaySoon(c.birthday);
  const r = [];
  if (ty === "lead" && due) r.push({ key:"newlead", score:1300, title: tags.includes("calculator lead") ? "New calculator lead" : "Lead follow-up due", detail: (c.contact_note || "").split("\n").slice(-1)[0] || c.subtype || "" });
  else if (due) r.push({ key:"followup", score:1200, title:"Follow-up due", detail: c.outcome ? `last outcome: ${c.outcome}` : (c.contact_note || "").split("\n").slice(-1)[0] || "" });
  if (ty === "past_client" && i) {
    if (["conv","fha","va"].includes(i.bucket)) r.push({ key:"rate", score:600 + i.gap * 100, title:`Rate gap +${i.gap.toFixed(2)}%`,
      detail:`${i.rate}% vs ${Number(i.market).toFixed(2)}% ${i.prog === "Conventional" ? "market" : i.prog} today${i.bucket === "fha" ? " · FHA Streamline eligible" : i.bucket === "va" ? " · VA IRRRL eligible" : " · Conventional R&T"}${i.save > 0 ? ` · ~${money(i.save)}/mo` : ""}` });
    if (i.funded && i.funded.slice(5, 7) === t.slice(5, 7) && i.months >= 11) r.push({ key:"anniv", score:320, title:`${Math.round(i.months / 12)}-year loan anniversary`, detail:`closed ${fmtMo(i.funded)}` });
    if (i.equity) r.push({ key:"equity", score:250 + (70 - i.estLtv), title:`Est. ${Math.round(i.estLtv)}% LTV`, detail: i.pmi ? "PMI removal likely" : "cash-out / HELOC conversation" });
    if (i.bucket === "watch") r.push({ key:"watch", score:150 + i.gap * 100, title:`Watchlist +${i.gap.toFixed(2)}%`, detail: i.seasoning ? "not seasoned yet" : "one more rate drop and they qualify" });
  }
  if (b != null) r.push({ key:"bday", score:450 - b * 10, title:`Birthday ${dayName(b)}`, detail: ty === "agent" ? (c.company || "") : c.book === "mine" ? "your client" : "" });
  if (ty === "past_client" && c.book === "past LO" && !c.last_contacted) r.push({ key:"inherited", score:200, title:"Inherited file", detail:"past LO funding · never contacted" });
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
  const pool = { clients:[], agents:[] };
  for (const c of contacts) {
    const ty = c.contact_type || "past_client";
    if (c.do_not_contact || !c.phone) continue;                       // calls first: needs a phone number
    if (!["past_client","lead","agent"].includes(ty)) continue;
    const due = c.follow_up_date && c.follow_up_date <= t;
    if (c.follow_up_date && c.follow_up_date > t) continue;
    if (ty === "lead" && !due) continue;
    if (!due && daysSince(c.last_contacted) < (ty === "agent" ? 30 : 21)) continue;
    const reason = reasonFor(c, radar.info[c.id], t); if (!reason) continue;
    // Priority tiers: commitments (follow-ups due / new leads) > Joshua's own closings > past LO files.
    const tier = ["followup","newlead"].includes(reason.key) ? 5000 : (ty === "past_client" && c.book === "mine") ? 2000 : 0;
    const s = tier + reason.score + (reason.also.length * 15) + Math.random();
    (ty === "agent" ? pool.agents : pool.clients).push({ id:c.id, reason, s });
  }
  pool.clients.sort((a, b) => b.s - a.s); pool.agents.sort((a, b) => b.s - a.s);
  const picked = [...pool.clients.slice(0, nClients), ...pool.agents.slice(0, nAgents)];
  if (picked.length < target) picked.push(...pool.clients.slice(nClients, nClients + target - picked.length));
  picked.sort((a, b) => b.s - a.s);
  return picked.map(({ id, reason }) => ({ id, reason }));
}

// Call script + voicemail follow-ups for a contact and reason.
export function scriptsFor(c, i, reason, me = "Joshua Graham") {
  const first = c.first_name || "there"; const yr = i?.funded ? i.funded.slice(0, 4) : "";
  const inherited = c.book === "past LO"; const intro = inherited ? `this is ${me} with Graham Financial. I'm the loan officer now handling your file from your ${yr ? yr + " " : ""}${i?.purpose === "refinance" ? "refinance" : "home loan"}` : `it's ${me}`;
  let say, short;
  switch (reason?.key) {
    case "rate":
      say = `Hi ${first}, ${intro}. Rates have come down since you closed${i.bucket === "fha" ? ", and on FHA loans there's a streamline option with no appraisal" : i.bucket === "va" ? ", and VA has a streamline refinance with very little paperwork" : ""}. Do you have two minutes so I can see if it would lower your payment?`;
      short = `Rates have moved since your ${yr} loan, and I'd like to run quick numbers for you`; break;
    case "bday":
      say = `Hi ${first}, it's ${me}. Just calling to say happy birthday! No business, I just wanted to reach out. How's everything with you and the family?`;
      short = `Happy birthday! Hope it's a great one`; break;
    case "anniv":
      say = `Hi ${first}, ${intro}. Believe it or not, it's been ${Math.round((i?.months || 12) / 12)} years since you closed on your home. Just checking in: how's the house treating you? Anything coming up, like a remodel, a move, or a rental?`;
      short = `Happy home anniversary, ${Math.round((i?.months || 12) / 12)} years! Just checking in`; break;
    case "equity":
      say = `Hi ${first}, ${intro}. Your home has likely gained real value since ${yr || "you bought it"}. A lot of my clients are using that equity to pay off higher-interest debt or fund a project${i?.pmi ? ", and you may be able to drop your mortgage insurance" : ""}. Want me to pull a free home value and show you what's available? No obligation.`;
      short = `Your home has likely gained real equity, and I can pull a free home value for you`; break;
    case "watch":
      say = `Hi ${first}, ${intro}. Rates are getting close to where a refinance could make sense for you. I'm watching it for you. Want me to text you the moment it hits?`;
      short = `Rates are getting close to refi territory for you, and I'm watching it`; break;
    case "inherited":
      say = `Hi ${first}, ${intro}. No sales pitch. I just want to introduce myself, make sure I have your current info, and be your go-to if anything comes up with the home. Is this still the best number for you?`;
      short = `I'm the loan officer now handling your file and wanted to introduce myself`; break;
    case "newlead":
      say = `Hi ${first}, this is ${me} with Graham Financial. I saw you ran the numbers on our calculator. I'd love to walk through what you're looking at. What property are you thinking about?`;
      short = `Thanks for running the numbers on our calculator. I'd love to walk through it with you`; break;
    case "followup":
      say = `Hi ${first}, it's ${me} following up from our last conversation. ${c.outcome === "talked" ? "I wanted to get you those numbers we talked about." : "Is now a better time?"}`;
      short = `Following up from our last conversation`; break;
    case "agent":
      say = (c.tags || []).includes("closed deal together") || c.subtype === "active partner"
        ? `Hi ${first}, it's ${me}. It's been a bit since we talked. What are you working on right now, and is anyone in your pipeline I can help get approved or find creative financing for?`
        : `Hi ${first}, this is ${me} with Graham Financial. I work with a handful of agents on getting buyers approved and on creative financing: DSCR for investors, non-QM, and down payment help. Who in your pipeline is stuck right now?`;
      short = `Checking in to see who in your pipeline I can help`; break;
    default:
      say = `Hi ${first}, ${intro}. Quick check-in, and a heads up that my info changed. I'm with Graham Financial now. Anything new on your end, like a new email or number?`;
      short = `Quick check-in, and my info changed`;
  }
  const vmText = `Hi ${first}, it's ${me}. Just tried you. ${short}. Call or text me back at ${MY_PHONE} when you have a minute, or grab a time here: ${BOOKING}`;
  const emailSubject = reason?.key === "bday" ? "Happy birthday!" : reason?.key === "rate" ? "Quick rate check" : "Checking in";
  const emailBody = `Hi ${first},\n\nI just tried giving you a call. ${short}.\n\nGive me a call or text at ${MY_PHONE}, or pick a time that works for you: ${BOOKING}\n\n${me}\nGraham Financial`;
  return { say, vmText, emailSubject, emailBody };
}

export const REASON_COLOR = { rate:"#9e3020", bday:"#5b3fa6", equity:"#1e6e4a", inherited:"#1a4f8a", followup:"#b05e0d", newlead:"#b05e0d", anniv:"#1a6570", watch:"#b05e0d", agent:"#7a6a1e", checkin:"#6b6358" };
export const REASON_BG = { rate:"#fbeae7", bday:"#eeebf8", equity:"#e8f4ee", inherited:"#e6eef9", followup:"#fdf0e0", newlead:"#fdf0e0", anniv:"#e4f2f4", watch:"#fdf0e0", agent:"#f8f4e3", checkin:"#f0ece5" };

// Log an outcome: touch row + contact fields. Returns the updated contact.
export async function logOutcome(userId, c, result, note, followUp, channel = "call") {
  await supabase.from("contact_touches").insert({ user_id:userId, contact_id:c.id, channel, outcome:result, note:note || null });
  const line = `${today()}: ${channel === "call" ? "" : channel + " · "}${result}${note ? ` — ${note}` : ""}`;
  const fields = { last_contacted:today(), outcome:result, contact_note:[c.contact_note, line].filter(Boolean).join("\n") };
  if (followUp !== undefined) fields.follow_up_date = followUp;
  const { data } = await supabase.from("contacts").update(fields).eq("id", c.id).select().single();
  return data;
}
