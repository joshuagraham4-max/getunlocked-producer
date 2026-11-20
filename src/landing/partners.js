// Referral partners (financial planners, divorce attorneys, CPAs). MOCK: demo partners live here until the partner table exists.
// /p/<slug> shows the partner page; its Register button opens the Scenario Desk in partner mode (ref PTR-<slug>).
// Preview another audience on any slug with ?as=attorney, ?as=planner or ?as=cpa.

export const DEMO_PARTNERS = {
  phil:       { slug: "phil",       first: "Phil", firm: "Demo Wealth Partners", type: "planner" },
  "phil-law": { slug: "phil-law",   first: "Phil", firm: "Demo Family Law",      type: "attorney" },
  "phil-cpa": { slug: "phil-cpa",   first: "Phil", firm: "Demo CPA Group",       type: "cpa" },
};

import { supabase } from "../supabase.js";

export const PARTNER_TYPES = ["planner", "attorney", "cpa"];
export const PARTNER_LABEL = { planner: "Financial planner", attorney: "Family law attorney", cpa: "CPA" };

const asOverride = (p) => { let as = ""; try { as = new URLSearchParams(location.search).get("as") || ""; } catch {} return p && PARTNER_TYPES.includes(as) ? { ...p, type: as } : p; };

// Real partners come from partner_pages (supabase/partner_pages_v1.sql); the demo Phil pages stay as a fallback.
export async function loadPartner(slug) {
  const s = String(slug || "").toLowerCase().trim(); if (!s) return null;
  try {
    const { data } = await supabase.rpc("get_partner_page", { p_slug: s });
    const r = data && data[0];
    if (r) return asOverride({ slug: r.slug, first: r.first_name, last: r.last_name || "", firm: r.firm || "", type: r.kind, photo: r.photo_url || "", logo: r.logo_url || "" });
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
    sub: "25 years of complex files. Hand me the mortgage and debt piece of your client's plan. I handle it start to finish, you keep the relationship, and your client comes back to you with it done.",
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
    sub: "25 years of complex files. Hand me the house and mortgage piece of the divorce you're working through. I get it solved start to finish, so you can focus on the rest of the case.",
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
  cpa: {
    eyebrow: "FOR CPAs",
    headline: "No letters. No calls. Approved.",
    sub: "25 years of complex files. When a client wants to buy, refinance or pull equity, hand them to me. I read the returns myself, I never ask you for a CPA letter, and I have lenders that approve self-employed clients on bank statements or a P&L alone.",
    pains: "What a lender usually costs you: a comfort letter you can't sign, a processor calling you to explain a return, a client panicking three days before closing, and a denial that gets blamed on the return.",
    lines: ["No letters.", "No calls.", "Approved."],
    rows: [
      ["A lender asks you for a comfort letter or a self-employment verification", "I never ask you for a CPA letter. Not a comfort letter, not a verification"],
      ["A processor calls you to explain the Schedule C, the K-1s and the depreciation", "I read any tax return myself. Your phone stays quiet"],
      ["The return is right, and the bank still says the income is too low", "Bank statements, P&L only, written VOE, and DSCR for rentals. Simple approvals"],
      ["Your client calls you in a panic 72 hours before closing", "Fully underwritten before your client hears a number. If I say it closes, it closes"],
      ["You hear about the purchase after the return is already filed", "Tell me who's buying this year, and we get ahead of it before you do their returns"],
      ["An investor client gets stuck at the bank's limit on properties", "DSCR and portfolio lenders that qualify the rental on its rent"],
      ["Cash-out and HELOC questions land on your desk in busy season", "Seconds and HELOCs handled start to finish, without pulling you in"],
      ["The lender keeps your client and pitches them everything", "Mortgage only. Your client stays your client"],
      ["Mortgage people only call when they need something", "I send business both ways: investors and business owners who need a real CPA"],
    ],
    steps: [
      ["Send a name and number", "Or put the situation on my desk in plain words. Any time of year, and best before you file."],
      ["I take it from there", "Returns, bank statements, lenders, underwriting and closing. No letters, and no calls asking you to explain a return."],
      ["It comes back to you finished", "Closed, and your client thanks you for the introduction."],
    ],
    deskTitle: "Who's buying this year?",
    deskSub: "Plain words are fine. \"S-corp owner wants a rental in March\" is plenty. I'll tell you what's possible, usually the same day, before you file.",
    footnote: "",
  },
};

// Scenario Desk in partner mode: plain-language tags, no lending terms.
export const PARTNER_TAGS = {
  planner: ["Buying a home", "Refinancing", "Wants cash from the home", "Retiring or recently retired", "Business owner / self-employed", "Income is mostly investments", "Inheritance or estate", "Divorce", "Not sure yet"],
  cpa: ["Buying a home", "Buying a rental", "Refinancing", "Wants cash from the home", "Self-employed / business owner", "Real estate investor", "Not sure yet"],
  attorney: ["Client wants to keep the house", "Buying out the spouse", "Selling the house", "Decree says refinance", "Low rate they want to keep", "Relies on support income", "Deadline coming up", "Not sure yet"],
};
export const PARTNER_PLACEHOLDER = {
  planner: "Anything the questions didn't cover: a liquidity event, a property to sell first, a payment ceiling.",
  attorney: "Anything the questions didn't cover: a second property, a HELOC, a date that can't move.",
  cpa: "Anything the questions didn't cover: the entity type, a 1031, a property to sell first.",
};

// Tailored desk questions per profession. opts = tap one; ph = short typed answer.
export const PARTNER_DESK = {
  attorney: {
    title: "Send me the house terms.",
    promise: "In 2 hours or less: will the house terms close, and what to change if not.",
    qs: [
      { id:"case", label:"Where's the case?", opts:["Filed", "In mediation", "Draft agreement", "Decree entered"] },
      { id:"keep", label:"Who's keeping the home?", opts:["Your client", "The spouse", "Selling it", "Undecided"] },
      { id:"loan", label:"Loan type, if known", opts:["FHA", "VA", "Conventional", "Not sure"] },
      { id:"owed", label:"What's owed and the rate, roughly", ph:"About $310K at 3.1%" },
      { id:"buyout", label:"Buyout to the other spouse, if any", ph:"About $90K" },
      { id:"support", label:"Support in the agreement: amount, and when it started", ph:"$2,400/mo maintenance, starts next month" },
      { id:"income", label:"Your client's income", opts:["W-2", "Self-employed", "Commission", "Retired"] },
      { id:"deadline", label:"Deadline in the draft", ph:"Refinance within 90 days of decree" },
    ],
    notes: "Anything else (optional)",
  },
  cpa: {
    title: "Who's buying this year?",
    promise: "Usually same day: what your client qualifies for and the simplest way to document it, before you file.",
    qs: [
      { id:"goal", label:"Your client wants to", opts:["Buy a home", "Buy a rental", "Refinance", "Cash out or HELOC", "Not sure yet"] },
      { id:"income", label:"How they earn", opts:["Schedule C", "S-corp or partnership (K-1)", "W-2 plus rentals", "Mostly rentals"] },
      { id:"years", label:"Self-employed for", opts:["Under 2 years", "2 years or more"] },
      { id:"filed", label:"This year's return", opts:["Not filed yet", "On extension", "Filed"] },
      { id:"numbers", label:"Rough price or value, and down payment or balance", ph:"Rental around $450K, 25% down" },
      { id:"timeline", label:"Timeline", ph:"Closing by spring" },
    ],
    notes: "Anything else (optional)",
  },
  planner: {
    title: "Throw any scenario past me.",
    promise: "Usually same day: options with payment and cash-flow impact, ready for the plan.",
    qs: [
      { id:"goal", label:"Your client wants to", opts:["Buy", "Refinance", "Use equity", "Downsize", "Pay off debt", "Second home or rental"] },
      { id:"stage", label:"Stage", opts:["Working", "Retiring within 2 years", "Retired"] },
      { id:"income", label:"Income", opts:["W-2", "Business owner", "Portfolio or retirement income", "Commission"] },
      { id:"matters", label:"What matters most", opts:["Lowest payment", "Keep assets invested", "Pay off faster", "Cash flow"] },
      { id:"numbers", label:"Rough home value, balance and rate", ph:"Worth $850K, owes $300K at 6.9%" },
      { id:"timeline", label:"Timeline", ph:"Next 6 months" },
    ],
    notes: "Anything else (optional)",
  },
};

// Outreach scripts (the sale is three moves: opener, ask, their page). [brackets] = fill in.
// Shown in Contacts → Referral Partner → Partner page box, with copy buttons. Metric: scenarios submitted, not replies.
export function partnerScripts(kind, first, url) {
  const f = first || "[Name]", link = url || "[their page link]";
  if (kind === "cpa") return [
    ["1. Opener (DM): examples of the voice, never send as-is", `Write it fresh every time, like Joshua walking up to them. Something specific from their page, one easy question, no title, no pitch. Never the same line twice.\n\nHey ${f}, saw [the thing you did over the weekend]. That's great, man. I'm looking for CPAs I can take some work off their plate. Sound like you?\n\nHey ${f}, super cool that you're in [city]. How long you been doing business there?\n\n${f}, saw you work with a lot of [real estate investors / contractors / business owners]. Love that. I do the lending side for a bunch of them. You taking on new clients right now?\n\nCongrats on [10 years / the new office / the award], ${f}. That's a big deal. How'd you end up doing taxes for [their niche]?`],
    ["2. When they reply: the ask", `Thanks, ${f}. One thing I hear from CPAs a lot: lenders asking you for CPA letters and calling you to explain your clients' returns. I take all of that off your desk. Could I send you a quick tool for it?`],
    ["3. When they say yes", `Here it is: ${link}\n\nWhen a client mentions buying, refinancing or pulling equity, put it on my desk from there, or just text me a name and number. I read the returns myself and I never ask you for a CPA letter. And if anyone's talking about buying this year, I'd love to get ahead of it before you do their returns.`],
    ["4. When they reply (go deeper)", `Glad it's useful. Quick question so I'm useful to you: what kind of clients do you want more of? I work with a lot of investors and business owners who need a good CPA.\n\nAnd do you send your clients a newsletter? If not, I can help you get one going.`],
    ["Call version (30 seconds)", `Hi ${f}, Joshua Graham, Graham Financial. I'll be quick. I take the mortgage side off CPAs' desks: I read the returns myself, I never ask you for a CPA letter, and I have lenders that approve self-employed clients on bank statements or a P&L. 25 years of complex files. Can I text you a link to my desk, so the next time a client mentions buying you have it?\n\n(If yes) What kind of clients do you want more of? And do you send your clients a newsletter?`],
  ];
  if (kind === "attorney") return [
    ["1. Opener (DM)", `Hi ${f}, your post on [topic] was sharp, especially [the specific point]. Most people skip that part.`],
    ["2. The ask (DM)", `I'm building a small close circle of family law attorneys. Could I send you a quick tool for one pain point: the house and mortgage piece of a settlement?`],
    ["3. When they say yes", `Here it is: ${link}\n\nWhen a client is keeping the house, text me the draft terms or just a name and number. In 2 hours or less I'll tell you if the house terms will close, and what to change if not. Then I take it from there.`],
    ["4. When they reply (go deeper)", `Glad it's useful. Quick question so I'm useful to you: when the house is in play, who do you lean on today for the mortgage side?\n\nAnd do you put out a newsletter? Who's sponsoring it right now?`],
    ["Call version (30 seconds)", `Hi ${f}, Joshua Graham, Graham Financial. I'll be quick. I help family law attorneys with the house and mortgage piece of a settlement: I read the draft before it's signed and tell you in 2 hours or less if the house terms will close. 25 years of complex files. Can I text you a link to my desk so you have it the next time a client wants to keep the house?\n\n(If yes) Who do you use today for the mortgage side? And do you run a newsletter, who's sponsoring it right now?`],
  ];
  return [
    ["1. Opener (DM)", `Hi ${f}, your post on [topic] was sharp, especially [the specific point]. Most people skip that part.`],
    ["2. The ask (DM)", `I'm building a small close circle of advisors I trust. Could I send you a quick tool for one pain point: the mortgage piece of a client's plan?`],
    ["3. When they say yes", `Here it is: ${link}\n\nWhen a client's mortgage comes up, put it on my desk from there, or just text me a name and number. Mortgage only, you see everything first, and your client comes back to you at closing.`],
    ["4. When they reply (go deeper)", `Glad it's useful. Quick question so I'm useful to you: when a client's mortgage comes up, who handles it today?\n\nAnd do you put out a newsletter? Who's sponsoring it right now?`],
    ["Call version (30 seconds)", `Hi ${f}, Joshua Graham, Graham Financial. I'll be quick. I take the mortgage and debt piece of a client's plan off advisors' plates: mortgage only, no asset requirements, and the client comes back to you at closing. 25 years of complex files. Can I text you a link to my desk so you have it the next time a client's mortgage comes up?\n\n(If yes) Who handles the mortgage side for your clients today? And do you run a newsletter, who's sponsoring it right now?`],
  ];
}
