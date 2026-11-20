// Referral partners (financial planners, divorce attorneys). MOCK: demo partners live here until the partner table exists.
// /p/<slug> shows the partner page; its Register button opens the Scenario Desk in partner mode (ref PTR-<slug>).
// Preview the other audience on any slug with ?as=attorney or ?as=planner.

export const DEMO_PARTNERS = {
  phil:       { slug: "phil",       first: "Phil", firm: "Demo Wealth Partners", type: "planner" },
  "phil-law": { slug: "phil-law",   first: "Phil", firm: "Demo Family Law",      type: "attorney" },
};

import { supabase } from "../supabase.js";

const asOverride = (p) => { let as = ""; try { as = new URLSearchParams(location.search).get("as") || ""; } catch {} return p && (as === "planner" || as === "attorney") ? { ...p, type: as } : p; };

// Real partners come from partner_pages (supabase/partner_pages_v1.sql); the demo Phil pages stay as a fallback.
export async function loadPartner(slug) {
  const s = String(slug || "").toLowerCase().trim(); if (!s) return null;
  try {
    const { data } = await supabase.rpc("get_partner_page", { p_slug: s });
    const r = data && data[0];
    if (r) return asOverride({ slug: r.slug, first: r.first_name, firm: r.firm || "", type: r.kind });
  } catch {}
  return findPartner(s);
}

export function findPartner(slug) {
  return asOverride(DEMO_PARTNERS[String(slug || "").toLowerCase()] || null);
}

export const PARTNER_COPY = {
  planner: {
    eyebrow: "FOR FINANCIAL ADVISORS",
    headline: "Your client's mortgage, handled.",
    sub: "25 years of complex files. Hand me the mortgage nobody wants to touch. I hand it back to you perfected, and your client back to you at closing.",
    pains: "What a bad mortgage costs you: assets lured to a bank, documents asked for three times, a denial the week of closing, and a client who blames the referral.",
    rows: [
      ["A bank offers a rate perk if your client moves assets", "No asset requirements. The portfolio stays where you put it"],
      ["Your client gets pitched investments, insurance, a new account", "Mortgage only, in writing"],
      ["The same documents requested again and again", "One list up front. Asked once"],
      ["Your client hears \"denied\" the week of closing", "Fully underwritten before your client hears a number. If I tell you it closes, it closes. The only thing that changes that is your client's ability to repay, like a job change"],
      ["Business owner, commission or portfolio income, and the bank says it doesn't fit", "Bank statements, P&L only, written VOE only. I read any tax return, and I've trained whole teams to do it"],
      ["You find out where the file stands from your client", "One name, every client. Updates on your schedule, the way you prefer"],
      ["Your client takes the first quote they get", "Options side by side, in dollars, before they decide. Not shopping costs households over $3,300 on average*"],
      ["The mortgage gets bolted on after the plan", "You see the structure first: payment, payoff date and cash-flow impact, ready to drop into your plan"],
      ["After closing, the lender keeps the relationship", "Your client goes back to you at closing"],
    ],
    steps: [
      ["Send a name and number", "Or put the situation on my desk in plain words. No forms for your client, no lending terms for you."],
      ["I take it from there", "Lenders, documents, underwriting, timing. You get updates the way you want them, and nothing reaches your client before you've seen it."],
      ["It comes back to you finished", "Closed, on plan, and your client is back with you."],
    ],
    deskTitle: "Throw any scenario past me.",
    deskSub: "Plain words are perfect. \"Client retiring next year wants to downsize\" is plenty. I'll tell you what's possible, usually the same day.",
    footnote: "*Bankrate estimate via Financial Planning, Sept 29, 2026: about $65 billion a year in excess interest, over $3,300 per household.",
  },
  attorney: {
    eyebrow: "FOR FAMILY LAW ATTORNEYS",
    headline: "One text. House handled.",
    sub: "25 years of complex files. Send me the draft before it's signed. I make sure the house terms can actually close, then I run the loan and hand it back to you done.",
    pains: "Where the house breaks a settlement: wording a lender reads differently, a deadline nobody can hit, support income that doesn't count, and a servicer that stalls for months. Then the client calls you.",
    rows: [
      ["\"Refinance\" in the decree means something different to the lender", "I check the draft against lender rules before it's signed. Green, yellow or red in 2 hours or less, with the exact words a lender needs"],
      ["A refinance deadline nobody checked with a lender", "A deadline your client can actually hit, set by how the loan will really close"],
      ["Support income that doesn't count when it's time to qualify", "I tell you up front what payment history and term the loan needs, so the order can be written for it"],
      ["A buyout priced like a cash-out", "Structured as a buyout where the rules allow it"],
      ["A 3% rate traded for 7% because refinance was the only option anyone looked at", "A free review before anyone says refinance: keep the low first mortgage and fund the buyout with a second mortgage or HELOC where it fits"],
      ["Your client can't qualify on paper: self-employed, commission, support just starting", "Bank statements, P&L only, written VOE only. I read any tax return, and I've trained whole teams to do it"],
      ["A lien or title problem surfaces at the refinance", "Title and liens checked before the settlement is final"],
      ["Six months later: \"Why didn't my lawyer tell me?\"", "The decree gets carried out. The file comes back to you finished"],
    ],
    steps: [
      ["Text me the draft terms", "Who keeps the house, the loan, the deadline. A name and number for your client if they've said yes."],
      ["I check it and run it", "A green, yellow or red answer in 2 hours or less, with the wording lenders need. Then the loan, title and closing."],
      ["It comes back to you finished", "If I say it closes, it closes. The house terms get carried out the way the decree says, and nothing lands back on your desk."],
    ],
    deskTitle: "Send me the house terms.",
    deskSub: "Who keeps the home, what's owed, the rate, the deadline, any support. Initials only for your client. I'll come back with what can close in 2 hours or less.",
    footnote: "",
  },
};

// Scenario Desk in partner mode: plain-language tags, no lending terms.
export const PARTNER_TAGS = {
  planner: ["Buying a home", "Refinancing", "Wants cash from the home", "Retiring or recently retired", "Business owner / self-employed", "Income is mostly investments", "Inheritance or estate", "Divorce", "Not sure yet"],
  attorney: ["Client wants to keep the house", "Buying out the spouse", "Selling the house", "Decree says refinance", "Low rate they want to keep", "Relies on support income", "Deadline coming up", "Not sure yet"],
};
export const PARTNER_PLACEHOLDER = {
  planner: "Client retiring in 8 months, wants to buy a smaller place before selling. Most income is from the portfolio. Wants to keep the payment under $3,000.",
  attorney: "Wife keeps the house. Joint FHA loan at 3.1%, about $310K owed. Buyout to husband around $90K. Draft says refinance within 90 days. She gets $2,400/mo maintenance starting next month.",
};
