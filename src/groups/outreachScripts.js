// Messenger scripts for agent outreach (Facebook, Instagram, LinkedIn).
// Every message is conversational, ends on a question or an open door, and carries no links.
// Two wordings per step so no two agents get an identical message on the same day.

const PHONE = "720-468-6872";

const inArea = (a) => (a ? ` in ${a}` : "");
const hookLine = (h) => (h ? `${h.trim().replace(/[.!]?$/, "!")} ` : "");

export const STEPS = [
  { step:1, name:"Opener", wait:2, variants:[
    (p) => `Hey ${p.first}! ${hookLine(p.hook)}I see you're doing real estate${inArea(p.area)} and I've been noticing your posts. I'm looking for a few agent partners and you stood out.

Joshua Graham here, AVP at Zero Point Mortgage. I'm not a lender, I'm a wholesale broker, so I have access to money where most lenders get stuck. Not selling anything.

I also generate buyer and investor leads, and I'm looking for a few agents to send them to. What's the best way to refer someone to you, and what areas do you cover?`,
    (p) => `Hey ${p.first}! ${hookLine(p.hook)}Your posts keep showing up on my feed and you stood out. I'm putting together a small group of agent partners${inArea(p.area)}.

I'm Joshua Graham, AVP at Zero Point Mortgage. Not a lender, a wholesale broker, so I can get money where most lenders get stuck. Nothing to sell you.

I generate buyer and investor leads and I'm looking for a few good agents to send them to. How do you like to get referrals, and what areas do you work?`,
  ]},
  { step:2, name:"Stuck deal nudge", wait:2, variants:[
    (p) => `No pressure ${p.first}. If you've got a buyer or investor stuck right now, that's exactly what I fix. Even just the scenario, no names needed.`,
    (p) => `Hey ${p.first}, one quick one: anything stuck right now? Self-employed buyer, investor, credit issue, a file another lender bailed on. That's my lane.`,
  ]},
  { step:3, name:"Last touch", wait:null, variants:[
    (p) => `Last one from me ${p.first}. If you want to be on my list for buyer and investor leads${inArea(p.area)}, just reply "in." Either way, if a deal ever gets stuck, I'm the call: ${PHONE}.`,
    (p) => `I'll leave it here ${p.first}. I'm finalizing my agent list for buyer and investor leads${inArea(p.area)}. Reply "in" if you want on it. And if a deal ever gets weird, save my number: ${PHONE}.`,
  ]},
];

// LinkedIn connection request note (300 character limit). The opener follows once they accept.
export const linkedInNote = (p) => {
  const t = `Hi ${p.first}! ${hookLine(p.hook)}Noticed your posts and you stood out. I'm a wholesale mortgage broker (AVP, Zero Point Mortgage) looking for a few agent partners${inArea(p.area)}. I get money where most lenders get stuck. Would love to connect.`;
  return t.length <= 300 ? t : `Hi ${p.first}, I'm a wholesale mortgage broker (AVP, Zero Point Mortgage) looking for a few agent partners${inArea(p.area)}. I get money where most lenders get stuck. Would love to connect.`;
};

const pick = (id, n) => { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };

export function messageFor(row) {
  const s = STEPS[Math.min(row.step || 0, 2)];
  const p = { first: row.first_name || (row.full_name || "").split(" ")[0] || "there", area: row.area || "", hook: row.hook || "" };
  return { stepName: s.name, wait: s.wait, text: s.variants[pick(row.id + s.step, s.variants.length)](p) };
}

// Simple agent rating from the last 12 months of closed business (Zillow / Realtor.com / brokerage profile).
// A: 24+ sales or $10M+. B: 10+ sales or $4M+. C: some activity. "?": not checked yet.
export function agentRating(r) {
  const n = Number(r?.sales_12m); const v = Number(r?.volume_12m);
  const hasN = r?.sales_12m !== null && r?.sales_12m !== undefined && r?.sales_12m !== "" && !Number.isNaN(n);
  const hasV = r?.volume_12m !== null && r?.volume_12m !== undefined && r?.volume_12m !== "" && !Number.isNaN(v);
  if (!hasN && !hasV) return { grade:"?", label:"not rated" };
  const sales = hasN ? n : 0, vol = hasV ? v : 0;
  const parts = [hasN ? `${sales} sales` : "", hasV ? `$${vol >= 1e6 ? (vol / 1e6).toFixed(1) + "M" : Math.round(vol / 1e3) + "K"}` : ""].filter(Boolean).join(" · ");
  if (sales >= 24 || vol >= 10e6) return { grade:"A", label:parts };
  if (sales >= 10 || vol >= 4e6) return { grade:"B", label:parts };
  return { grade:"C", label:parts };
}
export const RATING_ORDER = { A:0, B:1, C:2, "?":3 };

// First reply to an agent who wrote back. The framework that worked with Kayte Foster (Nov 7):
// mirror what they shared, give value right away, end on one easy question. Save the phone ask for their next reply.
export const REPLY_FRAMEWORK = [
  "Mirror what they shared: congrats on the listing, area or news they mentioned.",
  "Give value right away: if a buyer on one of their listings gets stuck on financing, you'll tell them same day if you can close it.",
  "End on one easy question: how do they want referrals (text, call, or email)?",
  "Save the phone ask for their next reply.",
];

// Drafts for the Replied card. news = what they mentioned, e.g. "the Brighton and Castle Rock listings".
export function replySuggestions({ first, area, news } = {}) {
  const f = (first || "").trim() || "there";
  const n = (news || "").trim().replace(/[.!]+$/, "");
  const a = (area || "").trim();
  return [
    { title: "First reply (mirror, value, one question)", text:
`Love that, ${f}!${n ? ` Congrats on ${n}.` : ""} If a buyer on one of your listings gets stuck on financing (self-employed, investor, a lender who said no), send them my way and I'll tell you same day if I can close it.

And when I've got a buyer${a ? ` in ${a}` : ""}, what's the best way to get them to you: text, call, or email?` },
    { title: "Second message, after they answer: invite to a call", text:
`Easier to learn how you work on the phone than over Messenger. Got 10 minutes this week? ${PHONE}` },
    { title: "They have something stuck", text:
`Send me the scenario, no names needed. I'll tell you today if I can close it and how fast.` },
  ];
}

// Thursday late-day weekly touch on Messenger, for agents Joshua met through outreach.
// Who: replied agents and agents who finished the 3-message sequence ("no reply"), weekly_touch not false.
// Not agents still in the sequence, and not anyone messaged in the last 3 days. Rotates wording week to week.
export const WEEKLY_TOUCH = [
  (p) => `Hey ${p.first}! Just making sure you know you can get me on the weekends for preapprovals, open house flyers, etc. I'm here! ${PHONE}`,
  (p) => `Hey ${p.first}, heading into the weekend: if a buyer needs a preapproval Saturday or Sunday, or you want help with an open house flyer, I'm around. Just text ${PHONE}.`,
  (p) => `Happy Thursday ${p.first}! Quick reminder I work weekends. Preapprovals, open house flyers, a file that's stuck, whatever comes up. ${PHONE}`,
  (p) => `Hey ${p.first}! Got open houses this weekend? I can turn a preapproval around same day and I'm happy to help with the flyer. I'm here: ${PHONE}`,
];
const weekNo = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return Math.floor((x - new Date(2026, 0, 5)) / (7 * 86400000)); };
export function weeklyTouchFor(row, date = new Date()) {
  const first = (row?.first_name || (row?.full_name || "").split(" ")[0] || "").trim() || "there";
  const i = ((pick(String(row?.id || ""), WEEKLY_TOUCH.length) + weekNo(date)) % WEEKLY_TOUCH.length + WEEKLY_TOUCH.length) % WEEKLY_TOUCH.length;
  return WEEKLY_TOUCH[i]({ first });
}
export function weeklyTouchDue(row, now = new Date()) {
  if (!row || row.weekly_touch === false || row.channel !== "facebook") return false;
  if (!["replied", "no reply"].includes(row.status)) return false;
  const last = [row.last_touch_at, row.sent_at].filter(Boolean).map((x) => new Date(x).getTime()).sort((a, b) => b - a)[0];
  return !last || now.getTime() - last >= 3 * 86400000;
}

// Joshua's takeover lines once an agent replies. Reference only; he writes the conversation.
// RESPA: qualify partners on how they work leads; never tie leads to loans coming back.
export const TAKEOVER = [
  { title:"They want leads", lines:[
    "Love it. What's the best way to refer someone to you, and what areas do you cover?",
    "So I send you the right people: how fast do you usually get back to a new lead, and what do you do with the ones who aren't ready yet?",
  ]},
  { title:"They have something stuck", lines:[
    "Send me the scenario, no names needed. I'll tell you today if I can close it and how fast.",
    "Who's the borrower: self-employed, investor, credit, or a file another lender already turned down?",
  ]},
  { title:"Move it to the phone", lines:[
    `Easier on the phone. Got 10 minutes this week? ${PHONE}`,
    "What's the best time to catch you? I'll call, not text a novel.",
  ]},
  { title:"Just being friendly", lines:[
    "Appreciate you. What kind of deals are you seeing most right now?",
    "Where do you see the market going in your area this spring?",
  ]},
];

export const CHANNELS = [
  { k:"facebook", l:"Facebook" }, { k:"instagram", l:"Instagram" }, { k:"linkedin", l:"LinkedIn" },
];
