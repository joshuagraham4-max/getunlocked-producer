// Smart Money posting module — card bank, pain points, lead magnets, schedule.
// One card per program. "lender" is INTERNAL ONLY (where to send the file) — never shown in copy.

export const BRAND = {
  motto: "How SMART money finances real estate.",
  sub: "Learn to build wealth and create the strategies you need to deploy.",
  tag: "Smooth. Precise. Elite.",
  email: "jgraham@grahamfinancial.us",
  phone: "720-468-6872",
  site: "approvedbyjoshua.com",
};

// Where every post sends people. `path` = landing page in this app; null = not built yet.
export const MAGNETS = {
  "rental-calc": { name: "Rental Property Calculator", path: "/rental-calculator", live: true },
  "income-qualifier": { name: "How Lenders See Your Income (quick qualifier)", path: null, live: false },
  "medical-power": { name: "Medical Pro Buying-Power Check", path: null, live: false },
  "dpa-calc": { name: "Down Payment Assistance Calculator", path: null, live: false },
  "equity-unlock": { name: "Equity Unlock Estimator", path: null, live: false },
};

export const SITE_BASE = "https://getunlocked-producer.vercel.app";
export const magnetLink = (card) => {
  const m = MAGNETS[card.magnet];
  return m && m.path ? `${SITE_BASE}${m.path}?ref=${card.ref}` : null;
};

export const PAIN_POINTS = [
  { id: "capped", label: "Investor capped by their lender on financed properties" },
  { id: "rent-short", label: "Rent doesn't quite cover the payment" },
  { id: "str", label: "Buying or refinancing an Airbnb / VRBO" },
  { id: "fast-cash", label: "Needs cash-out fast after buying or rehabbing" },
  { id: "self-employed", label: "Self-employed — tax returns make income look small" },
  { id: "credit", label: "Credit got dinged — bank said no" },
  { id: "salaried-no-returns", label: "Salaried, but doesn't want to (or can't) use tax returns" },
  { id: "new-doctor", label: "New doctor / NP stuck in short-term rentals" },
  { id: "asset-rich", label: "Strong savings or retirement assets, thin rental income" },
];

export const FOOTERS = {
  business:
    "Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Business-purpose loans on non-owner-occupied investment property only. Not available in AZ, CA, ID, MI, MN, NV, NJ, ND, OR, SD, UT, VT, VA. Rates subject to change; actual rate depends on credit, LTV and property type. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.",
  consumer:
    "Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.",
  medical:
    "Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. Primary residence only, for eligible medical professionals. Maximum loan amount and terms vary by credit score and loan-to-value. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.",
};

// audience: "investor" | "consumer"   license: "none" (business purpose) | "required" (CO only)
export const CARDS = [
  {
    ref: "NQ-04", bank: "nonqm", name: "Rental Loan — No Limit on Financed Properties", lender: "RISE TPO",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/NQ-04.png", footer: "business",
    painPoints: ["capped", "str"], magnet: "rental-calc", skool: "Investors",
    highlights: ["No limit on financed properties", "Up to 85% LTV purchase", "Up to $3.5M", "620 FICO", "Short-term rentals OK", "Gift funds allowed"],
    short: `Investors — how many financed properties is your lender capping you at?

This rental loan has NO limit on financed properties. Qualify on the property's rental income, not your tax returns.

✔ Up to 85% LTV purchase & rate/term
✔ Loans up to $3.5M
✔ FICOs down to 620
✔ Airbnb & VRBO eligible
✔ Rates from the mid-6s to mid-7s

Run the REAL numbers on your next rental 👇`,
    long: `Most investors don't run out of deals. They run out of lender.

Conventional financing tops out on financed properties, and tax returns full of write-offs make your income look smaller than it is. This loan looks at one thing: does the property's rent cover the payment?

Scaling a portfolio? There's no cap on how many properties you have financed. Short-term rentals count. Gift funds are allowed. Condos, 1–4 units, even leasehold properties are eligible.

Up to 85% LTV on purchase and rate/term, up to 80% on cash-out, loans to $3.5M, 620 FICO minimum.

Run the REAL numbers on your next rental — taxes and insurance included 👇`,
    video: {
      title: "Why your lender capped you — and how investors get past it",
      hook: "If your bank told you you've 'maxed out' on rentals, you didn't max out. Your loan type did.",
      points: ["Why conventional caps financed properties (and why it isn't about you)", "How a rental-income loan qualifies on the property, not your tax return", "The one number that decides it: does the rent cover the full payment?"],
      cta: "Run your property through the Rental Property Calculator — link in the post.",
    },
  },
  {
    ref: "NQ-05", bank: "nonqm", name: "Rental Loan — Sub-1.0 Ratio / No-Seasoning Cash-Out", lender: "Champions Funding",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/NQ-05.png", footer: "business",
    painPoints: ["rent-short", "fast-cash"], magnet: "rental-calc", skool: "Investors",
    highlights: ["Up to 80% LTV even when rent is under the payment", "Cash-out with no seasoning", "First-time investors OK (12-mo VOR)", "Close in as little as 20 days", "24-hour underwriting", "Appraisal transfers accepted"],
    short: `Rent doesn't fully cover the payment? That's not an automatic no.

✔ Up to 80% LTV even when the rent comes in under the payment
✔ Cash-out with NO seasoning — buy, fix, pull equity
✔ First-time investors OK with 12 months of rental history
✔ Close in as little as 20 days
✔ Already paid for an appraisal elsewhere? We may be able to use it

See where your property lands 👇`,
    long: `Here's where most investors get told no: the rent is close to the payment, but not over it.

This program goes up to 80% LTV even when the ratio is under 1.0. And if you just bought or rehabbed, cash-out has no seasoning requirement — you don't have to wait 6–12 months to pull your equity back out.

First-time investor? You can qualify with 12 months of documented rental history. 24-hour underwriting, close in as little as 20 days, and appraisal transfers are accepted.

Plug your numbers in and see exactly where it lands 👇`,
    video: {
      title: "Rent doesn't cover the payment — now what?",
      hook: "A 0.9 ratio isn't a dead deal. It's a different loan.",
      points: ["What a sub-1.0 ratio actually means to a lender", "No-seasoning cash-out: how BRRRR investors get their capital back fast", "Why a first-time investor can still qualify"],
      cta: "Check your ratio in the Rental Property Calculator — link in the post.",
    },
  },
  {
    ref: "NQ-06", bank: "nonqm", name: "Rental Income + Assets to Qualify", lender: "RISE TPO",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/NQ-06.png", footer: "business",
    painPoints: ["asset-rich", "rent-short", "capped"], magnet: "rental-calc", skool: "Investors",
    highlights: ["Rent + assets to qualify", "401(k), IRA, stocks, cash all count", "Up to $2.5M", "80% LTV purchase", "680 FICO", "No limit on financed properties"],
    notes: "2–4 units and condos only (no SFR listed). One borrower must be an experienced investor.",
    short: `Rent doesn't quite cover it? Your 401(k) can close the gap.

This rental loan qualifies on rental income PLUS your assets — 401(k), IRA, stocks, bonds, mutual funds, cash.

✔ Up to 80% LTV purchase
✔ Loans up to $2.5M
✔ No limit on financed properties
✔ Cash-out can be used as reserves

2–4 units and condos. Run your numbers 👇`,
    long: `High-price markets have a math problem: great properties, thin rents.

This program solves it. It qualifies on the property's rental income plus the assets you already have — retirement accounts, brokerage, cash — divided against the payment. Your savings do the work your rent can't.

Up to 80% LTV on purchase, 75% rate/term, 70% cash-out. Loans to $2.5M, 680 FICO, no limit on financed properties. 2–4 units and condos.

Start with the rent-vs-payment math, then let's talk assets 👇`,
    video: {
      title: "Using your 401(k) to qualify for a rental — without cashing it out",
      hook: "Your retirement account can help you qualify for a rental without you touching a dollar of it.",
      points: ["Why rent alone fails in high-price markets", "How assets get counted against the payment", "Who it fits: experienced investors with strong balance sheets"],
      cta: "Run the rent side first in the Rental Property Calculator — link in the post.",
    },
  },
  {
    ref: "NQ-07", bank: "nonqm", name: "Medical Professional Loan", lender: "FCM / AMB",
    audience: "consumer", license: "required", flyer: "/smart-money/flyers/NQ-07.png", footer: "medical",
    painPoints: ["new-doctor"], magnet: "medical-power", skool: "Homebuyers",
    highlights: ["No mortgage insurance", "Up to $2M", "Signed contract — start date up to 150 days out", "Student loan exclusion available", "NPs now eligible", "680 FICO"],
    notes: "100% LTV to $2M needs 720+; 680 caps 100% at $1.5M. Min LTV 90.01%. Don't advertise 100%/no-down without full disclosure.",
    short: `Sick of scrolling short-term rentals in a city you haven't even started working in yet?

Residents, fellows, new attendings and NPs — you can buy before your first day on the job. Qualify on your signed employment contract with a start date up to 150 days out.

✔ No mortgage insurance
✔ Loan amounts up to $2M
✔ Student loan exclusion available
✔ Nurse practitioners now eligible

Moving to Colorado for a new position? Let's line up your home before you sign another lease.`,
    long: `Your first year as an attending shouldn't start in a month-to-month Airbnb.

This medical professional loan lets you qualify on your signed employment contract — even with a start date up to 150 days out. No mortgage insurance, loan amounts up to $2M, and a student loan exclusion is available.

Eligible: MD, DO, DDS, DMD, PharmD, DVM, DPM, CRNA, and now Nurse Practitioners (MSN or DNP), plus residents and fellows.

Relocating to Colorado for a new position? Let's map it out before you sign a lease.`,
    video: {
      title: "Buying a home before your first day as an attending",
      hook: "You have a signed contract and six figures of student loans. Here's why that can still be enough.",
      points: ["How a future start date counts as income", "What 'no mortgage insurance' saves you every month", "How the student loan exclusion changes your debt ratio"],
      cta: "Message me your start date and city — I'll map out your timeline.",
    },
  },
  {
    ref: "NQ-01", bank: "nonqm", name: "Self-Employed — 12/24-Month P&L Only", lender: "TBD",
    audience: "consumer", license: "required", flyer: null, footer: "consumer",
    painPoints: ["self-employed"], magnet: "income-qualifier", skool: "Homebuyers",
    highlights: ["Qualify on a CPA-prepared P&L", "No bank statements", "Up to $2.5M", "80% max LTV", "660 FICO"],
    notes: "P&L must be prepared by the same licensed preparer who filed the latest business return. Investment-property use = business purpose.",
    short: `Self-employed and your tax returns make you look broke? You're not the problem — the paperwork is.

Qualify with a 12- or 24-month P&L prepared by your tax preparer.

✔ No bank statements
✔ Loan amounts up to $2.5M
✔ Up to 80% LTV
✔ 660 minimum FICO

Let's see what lenders would actually count 👇`,
    long: `Business owners write off everything — that's smart tax planning. It's also why your tax return makes your income look a fraction of what it really is.

This program qualifies you on a 12- or 24-month profit & loss statement prepared by the same licensed preparer who filed your latest business return. No bank statements required. Up to 80% LTV, loan amounts to $2.5M, 660 FICO minimum.

Let's look at what a lender would really count 👇`,
    video: {
      title: "Why your write-offs are killing your mortgage approval",
      hook: "The same deductions that save you taxes are the reason the bank said no.",
      points: ["How lenders read a self-employed tax return", "What a P&L-only loan counts instead", "Who prepares it and why that matters"],
      cta: "Message me 'INCOME' and I'll walk you through it.",
    },
  },
  {
    ref: "NQ-02", bank: "nonqm", name: "Core Flex — Credit Down to 500", lender: "TBD",
    audience: "consumer", license: "required", flyer: null, footer: "consumer",
    painPoints: ["credit"], magnet: "income-qualifier", skool: "Homebuyers",
    highlights: ["Credit scores down to 500", "Purchase, rate/term & cash-out", "Up to $1.25M", "1–4 units, PUD & condo", "First-time buyers OK at 580+"],
    notes: "Don't put '30-Year Fixed' in ads (Reg Z repayment-term trigger).",
    short: `Bank told you no because of your credit score? That might not be the final word.

✔ Credit scores down to 500
✔ Purchase, refinance or cash-out
✔ Loan amounts up to $1.25M
✔ First-time buyers OK at 580+
✔ Manual underwriting — a real person looks at your file

Let's see where you stand 👇`,
    long: `A credit score is a snapshot, not a verdict.

If a bank turned you down over your score, this program was built for exactly that file. Scores down to 500, manual underwriting where a real person reviews the whole picture, and purchase, rate/term, or cash-out options. Single family, 2–4 units, PUDs and condos. First-time buyers welcome at 580+.

Let's look at your full picture, not just the number 👇`,
    video: {
      title: "Turned down for your credit score? Here's what most people don't know",
      hook: "The bank's 'no' and the market's 'no' are two different things.",
      points: ["Why banks stop at a number", "What manual underwriting looks at instead", "Realistic expectations: what changes at 580 vs 500"],
      cta: "Message me 'SCORE' and let's look at your full picture.",
    },
  },
  {
    ref: "NQ-03", bank: "nonqm", name: "WVOE Only — No Tax Returns", lender: "TBD",
    audience: "consumer", license: "required", flyer: null, footer: "consumer",
    painPoints: ["salaried-no-returns"], magnet: "income-qualifier", skool: "Homebuyers",
    highlights: ["Qualify with only a WVOE", "No W-2s, pay stubs or tax returns", "Up to $4M", "80% LTV purchase", "620 FICO"],
    short: `Qualify with ONE form from your employer. No W-2s, no pay stubs, no tax returns.

✔ Written verification of employment only
✔ Loan amounts up to $4M
✔ Up to 80% LTV purchase & rate/term
✔ 620 minimum FICO
✔ First-time buyers OK

Two-year job history + two months of bank statements. That's it 👇`,
    long: `Some borrowers have great jobs and messy taxes. Others just don't want to hand over years of returns.

This program qualifies you on a written verification of employment completed by your company. No W-2s, no pay stubs, no tax returns. Two-year employment history and two months of bank statements to support your income.

Up to 80% LTV on purchase and rate/term, 70% cash-out, loans to $4M, 620 FICO. First-time buyers OK up to 70% LTV.

Let's see if it fits your situation 👇`,
    video: {
      title: "Getting a mortgage without tax returns — the WVOE loan",
      hook: "Your employer's signature can replace a stack of paperwork.",
      points: ["What a WVOE is and who fills it out", "Why tax returns sink some salaried borrowers", "What you still need: 2 years on the job + 2 months of statements"],
      cta: "Message me 'WVOE' to see if you fit.",
    },
  },
];

// ---- Schedule: 7 days × 2 slots (8:30 AM / 12:30 PM ET). 8 investor / 6 consumer per week.
// Mon..Sun as JS getDay(): 1..6, 0
export const SLOTS = [
  { id: "am", time: "8:30 AM ET", mtn: "6:30 AM MT" },
  { id: "pm", time: "12:30 PM ET", mtn: "10:30 AM MT" },
];
export const WEEK_PLAN = {
  1: ["investor", "consumer"], 2: ["investor", "investor"], 3: ["investor", "consumer"],
  4: ["investor", "consumer"], 5: ["investor", "consumer"], 6: ["investor", "consumer"], 0: ["investor", "consumer"],
};
export const CHANNELS = {
  investor: ["Facebook page", "Facebook groups — Investors", "Instagram (cross-post)"],
  consumer: ["Facebook page", "Facebook groups — Direct-to-consumer (CO audiences)", "Instagram (cross-post)"],
};

const dayIndex = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

// Deterministic rotation: each audience cycles through its pool in order across days.
// Cards with a flyer rotate first-class; flyer-less cards still schedule (flagged "flyer needed").
export function planFor(date) {
  const di = dayIndex(date);
  const pools = {
    investor: CARDS.filter((c) => c.audience === "investor"),
    consumer: CARDS.filter((c) => c.audience === "consumer"),
  };
  // count investor/consumer slots used before this day (from a fixed epoch) to advance the rotation
  const epoch = dayIndex(new Date(2026, 9, 26)); // Mon Oct 26, 2026
  let inv = 0, con = 0;
  for (let i = epoch; i < di; i++) {
    const wd = new Date(i * 86400000).getUTCDay();
    WEEK_PLAN[wd].forEach((a) => (a === "investor" ? inv++ : con++));
  }
  const wd = date.getDay();
  const out = WEEK_PLAN[wd].map((aud, i) => {
    const pool = pools[aud];
    const n = aud === "investor" ? inv++ : con++;
    const card = pool[((n % pool.length) + pool.length) % pool.length];
    const weekend = wd === 0 || wd === 6;
    return { slot: SLOTS[i], audience: aud, card, copy: weekend ? "long" : i === 0 ? "short" : "long", style: weekend ? "Educational" : "Program" };
  });
  const morningInvestor = out.find((s) => s.audience === "investor") || out[0];
  return { slots: out, video: morningInvestor.card };
}
