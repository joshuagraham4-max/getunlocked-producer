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
    lines: ["Your client's", "mortgage,", "handled."],
    rows: [
      ["The bank says the rate gets better if your client moves $500K over", "No asset requirements. Not a dollar moves. The portfolio stays where you put it"],
      ["A week after closing, the bank's wealth team calls your client", "Mortgage only, in writing. Nobody pitches your client anything"],
      ["The third request for the same bank statements, two weeks before closing", "One document list on day one. Asked once"],
      ["\"Denied\" the week of closing", "Fully underwritten before your client hears a number. If I say it closes, it closes"],
      ["Self-employed client, two years of write-offs, and the bank says no", "Bank statements, P&L only, written VOE. I read any tax return"],
      ["You hear the closing slipped from your client", "You hear it from me first, by text, email or call"],
      ["Your client signs the first quote they get", "Options side by side, in dollars, before they decide. Not shopping costs households over $3,300 on average*"],
      ["The payment shows up after the plan is built", "Payment, payoff date and cash-flow impact before anything is signed"],
      ["After closing, the lender keeps your client", "Your client comes back to you at closing"],
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
    lines: ["One text.", "House", "handled."],
    rows: [
      ["The decree says \"refinance within 90 days,\" the lender reads it differently, and it stalls", "I read the draft first and give you wording a lender accepts, in 2 hours or less"],
      ["Your client agrees to a 60-day deadline, but the lender needs the final decree first", "A deadline that matches how the loan will actually close"],
      ["Her $2,400 maintenance can't count yet: no 6-month history", "I tell you the payment history and term the order needs so the income counts"],
      ["The buyout gets priced as a cash-out, at a higher rate", "Structured as a buyout where the rules allow it"],
      ["A 3% loan becomes 7% because refinance was the only option on the table", "A free review: keep the 3% and fund the buyout with a second mortgage or HELOC"],
      ["Self-employed spouse can't qualify on tax returns", "Bank statements, P&L only, written VOE. I read any tax return"],
      ["A $200K lien surfaces at the refinance", "Title and liens checked before the settlement is final"],
      ["Six months later: \"Why didn't my lawyer tell me?\"", "It closes. Nothing lands back on your desk"],
    ],
    steps: [
      ["Text me the draft terms", "Who keeps the house, the loan, the deadline. A name and number for your client if they've said yes."],
      ["I check it and run it", "In 2 hours or less: will the house terms close, and what to change if not. Then the loan, title and closing."],
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
