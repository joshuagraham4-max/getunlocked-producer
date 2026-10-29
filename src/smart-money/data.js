// Smart Money posting module — card bank, pain points, lead magnets, schedule.
// One card per program. "lender" is INTERNAL ONLY (where to send the file) — never shown in copy.

export const BRAND = {
  motto: "How SMART money finances real estate.",
  sub: "Learn to build wealth and create the strategies you need to deploy.",
  tag: "Smooth. Precise. Elite.",
  email: "jgraham@grahamfinancial.us",
  phone: "720-468-6872",
  site: "approvedbyjoshua.com",
  booking: "https://calendar.app.google/khAdKK7Dx4HqGBWF6",
  bookingCta: "Book your 15 min with me. NOT a sales call. It's free to find out 👉 https://calendar.app.google/khAdKK7Dx4HqGBWF6",
};

// Where every post sends people. `path` = landing page in this app; null = not built yet.
export const MAGNETS = {
  "rental-calc": { name: "Rental Property Calculator", path: "/rental-calculator", live: true },
  "income-qualifier": { name: "How Lenders See Your Income (quick qualifier)", path: null, live: false },
  "medical-power": { name: "Medical Pro Buying-Power Check", path: null, live: false },
  "dpa-calc": { name: "Down Payment Assistance Calculator", path: null, live: false },
  "equity-unlock": { name: "Equity Unlock Estimator", path: null, live: false },
  "portfolio-review": { name: "Portfolio Strategy Review (Show me how)", path: null, live: false },
  "fthb-class": { name: "First-Time Homebuyer Class", path: null, live: false },
  "agent-strategy": { name: "Free Agent Deal Strategies (then Skool: Agents)", path: null, live: false },
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
  { id: "stuck", label: "Investor sitting on the sidelines — afraid of rates and prices" },
  { id: "renting", label: "Renting and wants to own, but doesn't know where to start" },
  { id: "move-up", label: "Found the next home, but the current one hasn't sold" },
  { id: "equity-trapped", label: "Equity sitting in their rentals — needs a down payment for the next deal" },
  { id: "priced-out", label: "Wants to buy or move, but the monthly payment doesn't make sense at today's prices" },
  { id: "portfolio-audit", label: "Owns rentals that could be cash flowing with a better loan structure" },
];

export const FOOTERS = {
  business:
    "Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Business-purpose loans on non-owner-occupied investment property only. Not available in AZ, CA, ID, MI, MN, NV, NJ, ND, OR, SD, UT, VT, VA. Rates subject to change; actual rate depends on credit, LTV and property type. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.",
  consumer:
    "Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.",
  market:
    "Hypothetical example for illustration only; not an offer of credit or a prediction of home values. Assumes a $747,073 estimated value, 20% down payment, 30-year fixed loan at 6.50% interest, $414/mo taxes and $200/mo insurance; excludes HOA, mortgage insurance and closing costs. APR would be higher than the interest rate. Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado.",
  intro:
    "Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity.",
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

First-time investor? You can qualify with 12 months of documented rental history. An answer on your money in about a day, close in as little as 20 days, and appraisal transfers are accepted.

Plug your numbers in and see exactly where it lands 👇`,
    video: {
      title: "Rent doesn't cover the payment — now what?",
      hook: "A 0.9 ratio isn't a dead deal. It's a different loan.",
      points: ["What a sub-1.0 ratio actually means to a lender", "No-seasoning cash-out: how BRRRR investors get their capital back fast", "Why a first-time investor can still qualify"],
      cta: "Check your ratio in the Rental Property Calculator — link in the post.",
    },
  },
  {
    ref: "CASH-01A", bank: "nonqm", name: "Rental Cash Out (A: next down payment)", lender: "RISE TPO",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/CASH-01A.png", footer: "business",
    painPoints: ["equity-trapped", "fast-cash", "self-employed"], magnet: "rental-calc", skool: "Investors",
    highlights: ["Cash out up to 80% LTV (720+ FICO, loans to $1M)", "Qualify on the property's rent, not income", "15, 30 & 40-yr fixed + interest-only", "1–4 unit rentals (single family to fourplex)", "Short-term rentals OK (max 70% LTV cash out)"],
    notes: "Split test with CASH-01A/B/C: same copy body, headline differs. 80% LTV cash out needs 720+ FICO; keep that next to the 80%. STR: 5% LTV reduction, max 70% cash out. No rates on this flyer. Cash in hand max $500K above 75% LTV; 6 mos ownership for cash-out.",
    short: `Real estate investors: Your rentals are sitting on your next down payment.

Pull equity out of the rentals you already own and put it to work on your next deal. You qualify on the property's rent, not your tax returns.

✔ Cash out up to 80% LTV (720+ FICO, loans to $1M)
✔ No employment or income docs
✔ 15, 30 & 40-year fixed, plus interest-only
✔ 1–4 unit rentals, single family to fourplex
✔ Short-term rentals OK (up to 70% cash out)

Your equity, deployed. Your portfolio, expanded 👇`,
    long: `Your rentals are sitting on your next down payment.

Most investors have more buying power than they think. It's just sitting in the properties they already own.

A rental cash-out loan lets you pull that equity without showing a W-2 or a tax return. The property's rent does the qualifying. If the rent covers the payment, you're in the conversation.

Up to 80% LTV with a 720+ FICO on loans to $1M (cash in hand up to $500K above 75% LTV). 15, 30 and 40-year fixed terms, plus interest-only options to keep cash flow strong. 1–4 unit rentals. Short-term rentals count too, up to 70% cash out.

Use it for the down payment on the next one, a rehab, or reserves.

Your equity, deployed. Your portfolio, expanded. Run the REAL numbers on your property 👇`,
    video: {
      title: "The down payment you already own",
      hook: "Your next down payment might already be sitting in a rental you own.",
      points: ["How a rental cash-out loan qualifies on the rent, not your tax returns", "What 80% LTV really means in dollars (and why 720+ FICO matters)", "Interest-only and 40-year terms: protecting cash flow after you pull cash"],
      cta: "Run your rental through the calculator — link in the post.",
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
    ref: "CASH-01B", bank: "nonqm", name: "Rental Cash Out (B: no tax returns)", lender: "RISE TPO",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/CASH-01B.png", footer: "business",
    painPoints: ["equity-trapped", "fast-cash", "self-employed"], magnet: "rental-calc", skool: "Investors",
    highlights: ["Cash out up to 80% LTV (720+ FICO, loans to $1M)", "Qualify on the property's rent, not income", "15, 30 & 40-yr fixed + interest-only", "1–4 unit rentals (single family to fourplex)", "Short-term rentals OK (max 70% LTV cash out)"],
    notes: "Split test with CASH-01A/B/C: same copy body, headline differs. 80% LTV cash out needs 720+ FICO; keep that next to the 80%. STR: 5% LTV reduction, max 70% cash out. No rates on this flyer. Cash in hand max $500K above 75% LTV; 6 mos ownership for cash-out.",
    short: `Real estate investors: Pull cash out of your rentals. No tax returns.

Pull equity out of the rentals you already own and put it to work on your next deal. You qualify on the property's rent, not your tax returns.

✔ Cash out up to 80% LTV (720+ FICO, loans to $1M)
✔ No employment or income docs
✔ 15, 30 & 40-year fixed, plus interest-only
✔ 1–4 unit rentals, single family to fourplex
✔ Short-term rentals OK (up to 70% cash out)

Your equity, deployed. Your portfolio, expanded 👇`,
    long: `Pull cash out of your rentals. No tax returns.

Most investors have more buying power than they think. It's just sitting in the properties they already own.

A rental cash-out loan lets you pull that equity without showing a W-2 or a tax return. The property's rent does the qualifying. If the rent covers the payment, you're in the conversation.

Up to 80% LTV with a 720+ FICO on loans to $1M (cash in hand up to $500K above 75% LTV). 15, 30 and 40-year fixed terms, plus interest-only options to keep cash flow strong. 1–4 unit rentals. Short-term rentals count too, up to 70% cash out.

Use it for the down payment on the next one, a rehab, or reserves.

Your equity, deployed. Your portfolio, expanded. Run the REAL numbers on your property 👇`,
    video: {
      title: "The down payment you already own",
      hook: "Your next down payment might already be sitting in a rental you own.",
      points: ["How a rental cash-out loan qualifies on the rent, not your tax returns", "What 80% LTV really means in dollars (and why 720+ FICO matters)", "Interest-only and 40-year terms: protecting cash flow after you pull cash"],
      cta: "Run your rental through the calculator — link in the post.",
    },
  },
  {
    ref: "NQ-01", bank: "nonqm", name: "Self-Employed — 12/24-Month P&L Only", lender: "TBD",
    audience: "consumer", license: "required", flyer: "/smart-money/flyers/NQ-01.png", footer: "consumer",
    painPoints: ["self-employed"], magnet: "income-qualifier", skool: "Homebuyers",
    highlights: ["Qualify on a CPA-prepared P&L", "No bank statements", "Up to $2.5M", "660 FICO"],
    notes: "P&L must be prepared by the same licensed preparer who filed the latest business return. Investment-property use = business purpose.",
    short: `Self-employed and your tax returns make you look broke? You're not the problem — the paperwork is.

Qualify with a 12- or 24-month P&L prepared by your tax preparer.

✔ No bank statements
✔ Loan amounts up to $2.5M
✔ 660 minimum FICO

Let's see what lenders would actually count 👇`,
    long: `Business owners write off everything — that's smart tax planning. It's also why your tax return makes your income look a fraction of what it really is.

This program qualifies you on a 12- or 24-month profit & loss statement prepared by the same licensed preparer who filed your latest business return. No bank statements required. Loan amounts to $2.5M, 660 FICO minimum.

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
    audience: "consumer", license: "required", flyer: "/smart-money/flyers/NQ-02.png", footer: "consumer",
    painPoints: ["credit"], magnet: "income-qualifier", skool: "Homebuyers",
    highlights: ["Credit scores down to 500", "Purchase, rate/term & cash-out", "Up to $1.25M", "1–4 units, PUD & condo", "First-time buyers OK at 580+"],
    notes: "Don't put '30-Year Fixed' in ads (Reg Z repayment-term trigger).",
    short: `Bank told you no because of your credit score? That might not be the final word.

✔ Credit scores down to 500
✔ Purchase, refinance or cash-out
✔ Loan amounts up to $1.25M
✔ First-time buyers OK at 580+
✔ A real person reviews your whole story, not just the score

Let's see where you stand 👇`,
    long: `A credit score is a snapshot, not a verdict.

If a bank turned you down over your score, this program was built for exactly that situation. Scores down to 500, a real person who reviews your whole picture, and purchase, rate/term, or cash-out options. Single family, 2–4 units, PUDs and condos. First-time buyers welcome at 580+.

Let's look at your full picture, not just the number 👇`,
    video: {
      title: "Turned down for your credit score? Here's what most people don't know",
      hook: "The bank's 'no' and the market's 'no' are two different things.",
      points: ["Why banks stop at a number", "What a real person looks at besides the number", "Realistic expectations: what changes at 580 vs 500"],
      cta: "Message me 'SCORE' and let's look at your full picture.",
    },
  },
  {
    ref: "NQ-03", bank: "nonqm", name: "WVOE Only — No Tax Returns", lender: "TBD",
    audience: "consumer", license: "required", flyer: "/smart-money/flyers/NQ-03.png", footer: "consumer",
    painPoints: ["salaried-no-returns"], magnet: "income-qualifier", skool: "Homebuyers",
    highlights: ["Qualify with only a WVOE", "No W-2s, pay stubs or tax returns", "Up to $4M", "620 FICO", "First-time buyers OK"],
    short: `Qualify with ONE form from your employer. No W-2s, no pay stubs, no tax returns.

✔ Written verification of employment only
✔ Loan amounts up to $4M
✔ 620 minimum FICO
✔ First-time buyers OK

Two-year job history + two months of bank statements. That's it 👇`,
    long: `Some borrowers have great jobs and messy taxes. Others just don't want to hand over years of returns.

This program qualifies you on a written verification of employment completed by your company. No W-2s, no pay stubs, no tax returns. Two-year employment history and two months of bank statements to support your income.

Loan amounts to $4M, 620 FICO minimum, and first-time buyers are welcome.

Let's see if it fits your situation 👇`,
    video: {
      title: "Getting a mortgage without tax returns — the WVOE loan",
      hook: "Your employer's signature can replace a stack of paperwork.",
      points: ["What a WVOE is and who fills it out", "Why tax returns sink some salaried borrowers", "What you still need: 2 years on the job + 2 months of statements"],
      cta: "Message me 'WVOE' to see if you fit.",
    },
  },
  {
    ref: "SM-01", bank: "strategy", name: "Portfolio Strategy Review", lender: "Any business-purpose lender — match to the strategy",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/SM-01.png", footer: "business",
    painPoints: ["stuck", "portfolio-audit", "capped"], magnet: "portfolio-review", skool: "Investors",
    highlights: ["Prepay buy-down strategy", "40-year term", "Interest-only options", "Qualify on the property", "Less paperwork", "Business-purpose loans in most states"],
    notes: "Brand/strategy card, not one program. Avoid 'better rates than agency' as a blanket claim and 'nationwide' (13 states excluded).",
    short: `Investors don't get stuck like everybody else.

High rates and high prices stall most people. The only reason an investor stays stuck is not knowing the strategy, or not having someone to show them.

Let me show you how, and get you the money to do it.

✔ Prepay strategies that buy down your rate
✔ 40-year and interest-only options for cash flow
✔ Qualify on the property, not your tax returns
✔ Less paperwork with business-purpose loans

Want to know what you left on the table? Comment or tap "Show me how" 👇`,
    long: `Here's a question for every investor holding rentals right now:

How many of your properties would be cash flowing today if your loans had been structured differently?

A prepayment penalty you've already outlasted could have bought you a lower rate. A 40-year or interest-only structure could have turned a break-even rental into a cash-flowing one, on long-term and short-term rentals alike.

That's what a portfolio review is for. We go property by property and find the strategies that were left on the table.

I'm a wholesale broker with access to business-purpose lenders in most states. Qualify on the property, not your tax returns, with less paperwork and often lower payments.

The only thing stopping most investors is not knowing who to call. Tap "Show me how" and let's start your portfolio review 👇`,
    video: {
      title: "The prepay strategy most investors skip (and what it costs them)",
      hook: "If your prepay period already ran out, you paid a higher rate for protection you never used.",
      points: ["How a prepayment penalty buys down a rate, and when it's worth it", "40-year and interest-only: turning break-even into cash flow", "What a property-by-property portfolio review looks like"],
      cta: "Tap 'Show me how' and send me your properties — I'll run the review.",
    },
  },
  {
    ref: "FLOW-01", bank: "strategy", name: "The Name of the Game Is Cash Flow", lender: "Any business-purpose rental lender — RISE Core DSCR fits most",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/FLOW-01.png", footer: "business",
    painPoints: ["self-employed", "portfolio-audit", "rent-short"], magnet: "rental-calc", skool: "Investors",
    highlights: ["Qualify on the rent, not your income", "30 & 40-year fixed", "Interest-only to protect cash flow", "1–4 units and 5–8 unit buildings", "Short-term rentals OK (1–4 units)"],
    notes: "Brand/strategy card. Flyer example: $300K loan at 7.00%, rent $2,600, taxes+insurance $450 → 30-yr P&I $1,996 (+$154/mo), 40-yr $1,864 (+$286), IO $1,750 (+$400). Illustrative only; IO is 10 yrs then payment rises. 5–8 units: experienced investors, no STR income, no 40-yr.",
    short: `Real estate investors: the name of the game is cash flow.

Not your W-2. Not your tax returns. If the property's rent covers the payment, you're in the conversation.

✔ Qualify on the rent, not your income
✔ 30 & 40-year fixed, plus interest-only to protect monthly cash flow
✔ 1–4 units, and 5–8 unit buildings
✔ Short-term rentals OK

Let's run the REAL numbers on your next one 👇`,
    long: `The name of the game is cash flow.

Appreciation is a bonus. Cash flow is what keeps you in the game and lets you buy the next one.

So why let a lender judge you on your tax returns? A rental cash-flow loan looks at the property: does the rent cover the payment? Structure it right with a 40-year term or interest-only, and the same property cash flows more every month.

That's the difference between owning rentals and building a portfolio.

Let's run the REAL numbers on your next one 👇`,
    video: {
      title: "Same property, more cash flow: it's the loan structure",
      hook: "Two investors buy the same rental. One makes $154 a month, the other makes $400. The only difference is the loan.",
      points: ["Why rental loans qualify on the rent, not your tax return", "30-year vs 40-year vs interest-only: what each does to monthly cash flow", "When interest-only makes sense, and what happens when the IO period ends"],
      cta: "Run your rental through the calculator, or book 15 minutes with me — links in the post.",
    },
  },
  {
    ref: "CASH-01C", bank: "nonqm", name: "Rental Cash Out (C: up to 80%)", lender: "RISE TPO",
    audience: "investor", license: "none", flyer: "/smart-money/flyers/CASH-01C.png", footer: "business",
    painPoints: ["equity-trapped", "fast-cash", "self-employed"], magnet: "rental-calc", skool: "Investors",
    highlights: ["Cash out up to 80% LTV (720+ FICO, loans to $1M)", "Qualify on the property's rent, not income", "15, 30 & 40-yr fixed + interest-only", "1–4 unit rentals (single family to fourplex)", "Short-term rentals OK (max 70% LTV cash out)"],
    notes: "Split test with CASH-01A/B/C: same copy body, headline differs. 80% LTV cash out needs 720+ FICO; keep that next to the 80%. STR: 5% LTV reduction, max 70% cash out. No rates on this flyer. Cash in hand max $500K above 75% LTV; 6 mos ownership for cash-out.",
    short: `Real estate investors: Cash out up to 80%. Qualify on the rent.

Pull equity out of the rentals you already own and put it to work on your next deal. You qualify on the property's rent, not your tax returns.

✔ Cash out up to 80% LTV (720+ FICO, loans to $1M)
✔ No employment or income docs
✔ 15, 30 & 40-year fixed, plus interest-only
✔ 1–4 unit rentals, single family to fourplex
✔ Short-term rentals OK (up to 70% cash out)

Your equity, deployed. Your portfolio, expanded 👇`,
    long: `Cash out up to 80%. Qualify on the rent.

Most investors have more buying power than they think. It's just sitting in the properties they already own.

A rental cash-out loan lets you pull that equity without showing a W-2 or a tax return. The property's rent does the qualifying. If the rent covers the payment, you're in the conversation.

Up to 80% LTV with a 720+ FICO on loans to $1M (cash in hand up to $500K above 75% LTV). 15, 30 and 40-year fixed terms, plus interest-only options to keep cash flow strong. 1–4 unit rentals. Short-term rentals count too, up to 70% cash out.

Use it for the down payment on the next one, a rehab, or reserves.

Your equity, deployed. Your portfolio, expanded. Run the REAL numbers on your property 👇`,
    video: {
      title: "The down payment you already own",
      hook: "Your next down payment might already be sitting in a rental you own.",
      points: ["How a rental cash-out loan qualifies on the rent, not your tax returns", "What 80% LTV really means in dollars (and why 720+ FICO matters)", "Interest-only and 40-year terms: protecting cash flow after you pull cash"],
      cta: "Run your rental through the calculator — link in the post.",
    },
  },
  {
    ref: "MKT-01", bank: "strategy", name: "A Home Is Worth What Someone Can Pay Monthly", lender: "N/A — market education",
    audience: "consumer", license: "required", flyer: "/smart-money/flyers/MKT-01.png", footer: "market",
    painPoints: ["priced-out", "move-up", "renting"], magnet: null, skool: "Homebuyers",
    highlights: ["Rent $3,580 vs. own $4,392 on the same home", "Owning = renting at about $587K vs. a $747K value", "Why buyers are sitting still", "Free home value + comps look-up"],
    notes: "Teaching post, not a prediction. States a rate and down payment, so keep the full 'market' footer with it (example terms + APR note) and have ZPMS compliance review before posting. Don't name the street. Check the latest MBA weekly survey before claiming applications are at multi-decade lows.",
    short: `A home is worth what someone can pay monthly.

Same 4-bed Denver-area home:
🏠 Rent it: $3,580/mo
🏠 Own it: $4,392/mo (payment, taxes, insurance)

At today's rates, owning only costs the same as renting at about $587K. The value estimate is $747K.

That gap is why so many buyers are sitting still. It doesn't mean prices have to fall. It means the math has to line up, through rents, rates or prices.

Want to see what YOUR home's numbers say? 👇`,
    long: `A home is worth what someone can pay monthly.

I ran the numbers on a 4-bed home in the Denver area. It rents for about $3,580 a month. To buy it at today's value with 20% down, the payment plus taxes and insurance comes to about $4,392.

That's an $800-a-month premium to own.

For owning to cost the same as renting, the price would need to be around $587K. The value estimate is $747K.

This is why buyers are stuck and so many people are staying put. It's not panic. It's math. That gap closes one of three ways: rents rise, rates come down, or prices flatten for a while.

Thinking about buying, selling, or moving up? Let's look at what YOUR home's numbers actually say. I'll run a real value and rent estimate for you, free 👇`,
    video: {
      title: "Why buyers are stuck: the rent vs. own math",
      hook: "This house rents for $3,580 a month. Buying it costs $4,392. Here's what that gap tells us.",
      points: ["Price is set by what buyers can pay monthly", "Where owning and renting break even on this house ($587K vs. $747K)", "Three ways the gap closes: rents, rates or prices (no doom predictions)"],
      cta: "Want your own home's value and rent estimate? Book 15 minutes with me — link in the post.",
    },
  },
  {
    ref: "ED-01", bank: "dpa", name: "First-Time Homebuyer Class", lender: "N/A — education; route to DPA / first-time programs after the class",
    audience: "consumer", license: "required", flyer: "/smart-money/flyers/ED-01.png", footer: "consumer",
    painPoints: ["renting"], magnet: "fthb-class", skool: "Homebuyers",
    highlights: ["Take a class with us", "43x owner vs. renter net worth", "Know your numbers before you shop", "Assistance programs explained"],
    notes: "Cite Fed SCF 2025 for 43x. Don't attach down payment, rate or payment figures (Reg Z triggers).",
    short: `Tired of paying your landlord's mortgage?

Homeowners have about 43 times the net worth of renters (Federal Reserve, 2025). Educated buyers are smart money, and that starts with a class.

In our first-time homebuyer class you'll learn:
✔ How owning builds wealth
✔ What you actually need to get started
✔ How assistance programs can help with the upfront cost

Jump in a class with us. Tap "Show me how" 👇`,
    long: `Here's the number that changed how I talk to renters: homeowners have about 43 times the net worth of renters, according to the Federal Reserve's 2025 Survey of Consumer Finances.

That's not because homeowners are lucky. It's because they learned how real estate builds wealth, and they made a plan.

That's what our first-time homebuyer class is for. You'll learn how owning builds wealth over time, what you actually need to get started, how assistance programs work, and how to build a plan around your money, not someone else's.

Educated buyers are smart money. Jump in a class with us and let us show you how 👇`,
    video: {
      title: "Why homeowners have 43x the net worth of renters",
      hook: "Renting isn't free. You're building wealth either way, just not always your own.",
      points: ["Where the 43x number comes from (and what it really means)", "How your money works harder in a home than in a savings account", "What the class covers and how to join"],
      cta: "Tap 'Show me how' and save your seat in the next class.",
    },
  },
  {
    ref: "EQ-01", bank: "equity", name: "Buy Before You Sell", lender: "HomeLight BBYS (internal)",
    audience: "consumer", license: "required", flyer: "/smart-money/flyers/EQ-01.png", footer: "consumer",
    painPoints: ["move-up"], magnet: "equity-unlock", skool: "Homebuyers",
    highlights: ["Unlock equity before you sell", "Pay off debt, fund the next home, or both", "Old mortgage comes off your debt load", "No home-sale contingency", "Backstop: purchased if unsold in 120 days", "Move once"],
    notes: "HomeLight: list within 21 days; if unsold by day 120 HomeLight buys at LOAN PAYOFF VALUE (not market). Fee 2.4% of sale (2.9% FL). Never say 'no risk'; never name partner or fee in public copy. Equity unlock is a no-payment advance (per Joshua) usable to pay off debt and/or fund the purchase; confirm terms in the partner agreement. Don't advertise 'no payments' in public copy (payment = Reg Z trigger term).",
    short: `Found the one, but your house hasn't sold yet?

Smart money moves first. Unlock your current home's equity before you sell: pay off debt, fund your next purchase, or both, and make an offer with no home-sale contingency.

✔ Use your equity to pay off debt, buy next, or both
✔ Your old mortgage comes off your debt load
✔ Built-in backstop: if it hasn't sold in 120 days, it's purchased
✔ Move once, and skip the temporary rental

Want the move-up playbook? Tap "Show me how" 👇`,
    long: `Most move-up buyers get stuck in the same spot: they find the right home, but their money is tied up in the one they're living in.

So they make a contingent offer that loses to a cleaner one, or they sell first and end up in a short-term rental with their stuff in storage.

There's a smarter order of operations. Buy-before-you-sell unlocks the equity in your current home before it sells. Use it to pay off debt, fund your next purchase, or both, and that old mortgage comes off your debt load so you qualify the way you should. No home-sale contingency, and you sell on your schedule.

And there's a built-in backstop: if your home hasn't sold within 120 days, it's purchased, so you're not stuck carrying two homes.

Educated buyers are smart money. Let me walk you through the move-up playbook 👇`,
    video: {
      title: "Buy your next home before you sell: the smart order of operations",
      hook: "You don't have to choose between losing the house and moving twice.",
      points: ["Why contingent offers lose in competitive situations", "How your current equity funds the next purchase", "What to know before you start (timing, costs, eligibility)"],
      cta: "Tap 'Show me how' and I'll estimate what equity you could unlock.",
    },
  },
  {
    ref: "ID-01", bank: "intro", name: "Meet Joshua — Group Introduction (carousel)", lender: "N/A",
    audience: "intro", license: "none", flyer: "/smart-money/flyers/ID-01.png", footer: "intro",
    slides: ["/smart-money/flyers/ID-01-1.png", "/smart-money/flyers/ID-01-2.png", "/smart-money/flyers/ID-01-3.png", "/smart-money/flyers/ID-01-4.png"],
    painPoints: [], magnet: null, skool: "All",
    highlights: ["Real estate-aholic", "25+ years", "The call for stuck deals at the 2-yard line", "Hundreds of real estate pros trained", "Live rates on request"],
    notes: "Post once when joining a new group (carousel: all 4 slides). Each slide also works alone as a follow-up post. Not in the daily rotation.",
    short: `Hi guys, I'm Joshua Graham, new to the group and a confessed real estate-aholic.

I'm not here to sell you anything. I'm here to get to know people, build relationships, and help you all build.

25+ years in the mortgage business. When a deal is stuck at the 2-yard line, think of me. I'm strong at communication and quarterbacking deals across the goal line, and I can help get you paid faster.

I've also taught hundreds of real estate professionals how to finance homes intelligently. Smart investors work with smart money.

Details on a scenario or just live rates? I'm a call, text or email away.

📞 720-468-6872
✉️ jgraham@grahamfinancial.us`,
    long: `Hi everyone, I'm Joshua Graham. I'm new to the group, and I'll admit it up front: I'm a real estate-aholic.

There's nothing to buy from me. I'm here to get to know people, build real relationships, and help the people in this group build.

A little about me: I've been in the mortgage business for over 25 years as a wholesale broker, shopping a wide range of lenders. What I'm best at is communication and quarterbacking a deal all the way to closing. So when you've got a deal stuck at the 2-yard line, think of me. I'm known industry-wide as the call for stuck deals, and for agents that means getting paid faster.

I also teach. I've taught hundreds of real estate professionals how to finance homes intelligently, because educated people are smart money, and smart investors work with smart money.

If you ever want details on a scenario, or just live rates, I'm a phone call, text or email away. Looking forward to getting to know you all.

📞 720-468-6872
✉️ jgraham@grahamfinancial.us`,
    video: {
      title: "Hi, I'm Joshua — who I am and how I help",
      hook: "I'm not here to sell you anything. I'm here to help you build.",
      points: ["25 years, and what 'quarterbacking a deal' really means", "Why I'm the call when a deal gets stuck", "How to reach me for live rates or a quick scenario check"],
      cta: "Comment 'hi' and introduce yourself — I'd like to meet you.",
    },
  },
  {
    ref: "AG-01A", bank: "agents", name: "Agent Playbook — 71% Closed Zero (A: solve your lead problem)", lender: "N/A",
    audience: "agent", license: "none", flyer: "/smart-money/flyers/AG-01A.png", footer: "intro",
    painPoints: [], magnet: "agent-strategy", skool: "Agents",
    highlights: ["71% of agents closed zero deals", "5 deals = top 14%", "10 deals = top 7%", "Playbook + database partnership", "A real person, not automation"],
    notes: "split test: same copy, flyer line differs — A 'Let me solve your lead problem.' vs B 'Let me help you unlock the leads you already have.' Track leads by ref. Chart: NAR member count Dec 1, 2024–Nov 30, 2025, MLS resales only, includes non-practicing members — confirm original source before heavy use. Database/lead partnership offer: Joshua sending through ZPMS compliance.",
    short: `Real estate agents: take a good hard look at this chart.

71% of agents closed ZERO deals last year. Close just one and you're ahead of them. Close five and you're in the top 14% nationwide. Ten puts you in the top 7%.

Let me dial in your playbook. I'll partner with you, help work your database, and build a game plan to double, triple, even quadruple your business.

Not just access to smart money and intelligent financing. A real, live partner alongside you, not another automated drip.

Let me help you add some deals. Find out my strategies for free 👇`,
    long: `Agents, take a good hard look at this chart.

71% of real estate agents closed zero deals last year. That means closing just one puts you ahead of most of the industry. Five deals and you're in the top 14% nationwide. Ten, and you're in the top 7%.

The gap between where most agents are and the top tier isn't talent. It's a playbook and a partner.

That's what I bring. Let me help you work your database, keep your relationships warm, and build a game plan to double, triple or quadruple your business. I'm not just your access to smart money and intelligent financing. I'm a partner alongside you making sure your deals close and your pipeline keeps moving.

And it's a real, live person, not an automated drip campaign.

Let me help you add some deals. Find out my strategies for free, then join the community where I teach all of it 👇`,
    video: {
      title: "71% of agents closed zero deals. Here's how you get out of that group",
      hook: "One deal puts you ahead of 71% of agents. Five puts you in the top 14%.",
      points: ["What the deals-per-agent numbers actually show", "Why most agents stall: no playbook, no follow-up system", "How a lender partnership keeps your database warm and your deals closing"],
      cta: "Grab my deal strategies free — link in the post.",
    },
  },
  {
    ref: "AG-01B", bank: "agents", name: "Agent Playbook — 71% Closed Zero (B: unlock the leads you have)", lender: "N/A",
    audience: "agent", license: "none", flyer: "/smart-money/flyers/AG-01B.png", footer: "intro",
    painPoints: [], magnet: "agent-strategy", skool: "Agents",
    highlights: ["71% of agents closed zero deals", "5 deals = top 14%", "10 deals = top 7%", "Playbook + database partnership", "A real person, not automation"],
    notes: "split test: same copy, flyer line differs — A 'Let me solve your lead problem.' vs B 'Let me help you unlock the leads you already have.' Track leads by ref. Chart: NAR member count Dec 1, 2024–Nov 30, 2025, MLS resales only, includes non-practicing members — confirm original source before heavy use. Database/lead partnership offer: Joshua sending through ZPMS compliance.",
    short: `Real estate agents: take a good hard look at this chart.

71% of agents closed ZERO deals last year. Close just one and you're ahead of them. Close five and you're in the top 14% nationwide. Ten puts you in the top 7%.

Let me dial in your playbook. I'll partner with you, help work your database, and build a game plan to double, triple, even quadruple your business.

Not just access to smart money and intelligent financing. A real, live partner alongside you, not another automated drip.

Let me help you add some deals. Find out my strategies for free 👇`,
    long: `Agents, take a good hard look at this chart.

71% of real estate agents closed zero deals last year. That means closing just one puts you ahead of most of the industry. Five deals and you're in the top 14% nationwide. Ten, and you're in the top 7%.

The gap between where most agents are and the top tier isn't talent. It's a playbook and a partner.

That's what I bring. Let me help you work your database, keep your relationships warm, and build a game plan to double, triple or quadruple your business. I'm not just your access to smart money and intelligent financing. I'm a partner alongside you making sure your deals close and your pipeline keeps moving.

And it's a real, live person, not an automated drip campaign.

Let me help you add some deals. Find out my strategies for free, then join the community where I teach all of it 👇`,
    video: {
      title: "71% of agents closed zero deals. Here's how you get out of that group",
      hook: "One deal puts you ahead of 71% of agents. Five puts you in the top 14%.",
      points: ["What the deals-per-agent numbers actually show", "Why most agents stall: no playbook, no follow-up system", "How a lender partnership keeps your database warm and your deals closing"],
      cta: "Grab my deal strategies free — link in the post.",
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

// ---- Message bank: core Smart Money messages in Joshua's voice. Use as hooks, captions, video openers.
export const MESSAGES = [
  { id: "M1", theme: "Not stuck", audience: "investor",
    text: "Investors don't get stuck like everybody else, afraid of high rates and high prices. The only reason you're stuck is not knowing how to build wealth with real estate, or not having someone to show you. Let me show you how, and let me get you the money to do it." },
  { id: "M2", theme: "Portfolio deep dive", audience: "investor",
    text: "Let's take a deep dive into your real estate portfolio and make sure you didn't leave any strategies on the table." },
  { id: "M3", theme: "Prepay analysis", audience: "investor",
    text: "How many of your properties would be cash flowing right now if you'd taken a simple prepayment penalty — one you've already outlasted — in exchange for a lower rate?" },
  { id: "M4", theme: "40-year / interest-only", audience: "investor",
    text: "A 40-year or interest-only structure can be the difference between a break-even rental and one that cash flows, on short-term and long-term rentals alike." },
  { id: "M5", theme: "Get qualified", audience: "investor",
    text: "I can get you qualified. Business-purpose loans save you the hassle: less paperwork, qualifying on the property instead of your tax returns, and often lower payments.",
    caution: "Avoid 'better rates than agency' as a blanket claim unless you can back it up on that scenario." },
  { id: "M6", theme: "The guy to call", audience: "investor",
    text: "The only thing stopping most investors is not knowing who to call. I'm a wholesale broker with access to business-purpose lenders in most states. Call me.",
    caution: "Say 'most states,' not 'nationwide' — 13 states require a license even for business purpose." },
  { id: "M7", theme: "Owners vs renters", audience: "consumer",
    text: "Homeowners have about 43 times the net worth of renters. Owning real estate is one of the most proven ways regular people build wealth, and we're here to teach you how.",
    caution: "Cite the source when posting: Federal Reserve Survey of Consumer Finances, 2025 (median $458,900 owners vs $10,600 renters). The '44x' figure is from older 2016 data." },
  { id: "M8", theme: "We teach", audience: "investor",
    text: "Our job isn't just to get you a loan. It's to teach you how to build wealth with real estate: how the strategies work, when to use them, and how to deploy them." },
  { id: "M9", theme: "Your money works harder in a home", audience: "consumer",
    text: "Say the market earns you 10% — that's 10% on the money you invested. $40,000 at 10% is about $4,000 a year. A home that appreciates 3–5% grows on its whole value: a $400,000 home at 4% is about $16,000 a year. Same idea, much bigger number working for you. Jump in a class with us and let us show you how.",
    caution: "Illustration only: appreciation isn't guaranteed and prices can fall (Denver is down about 9% from its 2022 peak). Don't attach a down payment, rate or payment to this example in a consumer post, which can trigger Reg Z disclosures." },
  { id: "M10", theme: "Take a class with us", audience: "consumer",
    text: "Before you buy your first home, take a class with us. We'll show you how homeownership builds wealth, what you actually need to get started, and how to do it the smart way. Jump in a class with us. Let us show you how." },
  { id: "M11", theme: "Educated = smart money", audience: "consumer",
    text: "Educated people are smart money. That's why we teach first. Whether it's your first home, your next home or your next rental, we'll help you become a smarter, savvier buyer, even the very first time." },
];

// ---- Content rules applied to every card and message
export const CONTENT_RULES = [
  "Lead with their pain point, then the strategy that solves it.",
  "Plain words over lender jargon (no 'manual underwriting', 'WVOE', 'DTI' in public copy).",
  "Teach first: position Joshua as the person who shows them how to build wealth with real estate.",
  "Every post ends with a clear next step to the landing page ('Show me how').",
  "Say 'your money' or 'your situation', never 'your file'.",
  "First-time buyer posts lean on education: 'Take a class with us' and the 43x wealth gap.",
];

// ---- The funnel every post feeds (step 1 is the lead magnet; Skool + class come after the lead is captured)
export const FUNNEL = [
  { step: 1, name: "Post", detail: "Flyer + copy, ends with 'Show me how'." },
  { step: 2, name: "Landing page + lead magnet", detail: "Calculator, class signup or review request. Lead form first: name, phone, email. Saves to Supabase with the ref code." },
  { step: 3, name: "Join Skool + take a class", detail: "Invite shown only after the lead is captured." },
  { step: 4, name: "Free credit review", detail: "Bonus for joining and taking a class." },
  { step: 5, name: "Application", detail: "The credit review links straight into the full application." },
];
