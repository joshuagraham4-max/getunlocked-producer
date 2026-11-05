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
