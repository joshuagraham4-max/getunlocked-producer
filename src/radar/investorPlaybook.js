// Investor call playbook: what to listen for, the pain under it, and how the financing fixes it fast.
// Shown on the Calls card for investor leads. Education, not a pitch. No rate promises in writing.
const SIGN = (me, phone) => `${me}\nAVP / Regional Loan Originator\nGraham Financial powered by Zero Point Mortgage Services\nNMLS 169809 | ${phone}`;

export const PLAYBOOKS = {
  maturing_hard_money: {
    label: "Hard money coming due",
    goal: "Find the due date and the exit plan. If there's no clean exit, you are the exit.",
    ask: [
      "When is that loan due, and what happens if it isn't paid off by then?",
      "Are they charging you to extend? How many points?",
      "What's the plan for it: sell, refinance, or hold?",
      "Is the work done? Is it rented, or what would it rent for?",
      "What are you paying on it each month right now?",
    ],
    pains: [
      ["Balloon coming due, extension fees stacking up", "Refinance into a long-term loan before the due date. Appraisal plus lease, and you're out of the short-term note."],
      ["High-interest payment eating the cash flow", "Long-term financing where the rent carries the payment. Compare it to what they pay today plus the next extension."],
      ["Tax returns don't show the income", "The rent qualifies the loan. No tax returns, no W-2, no pay stubs."],
      ["Not rented yet", "Many programs can use market rent from the appraisal. Get the address and check it."],
      ["Wants cash back out for the next deal", "Cash-out on the refinance where value allows. Seasoning rules vary by lender, so shop it."],
      ["Owns it in an LLC", "Close in the LLC. That's normal for these loans."],
    ],
    objections: [
      ["I already have a lender lined up", "Good. I'm a wholesale broker, so I'll shop it against them in a day. If they win, you lost nothing."],
      ["Rates are too high right now", "Compared to what you're paying on the hard money plus the next extension? Let me put both side by side."],
      ["I'm just going to sell it", "Smart. Let's set a backup in case the sale runs past the due date, so you're never forced to take a low offer."],
    ],
    close: "Text me the address, the payoff and what it rents for. I'll have numbers back to you today.",
  },
  dead_money: {
    label: "Dead money (equity-rich rentals)",
    goal: "Get them picturing the next property, then show them the cash is already in the one they own.",
    ask: [
      "How many doors do you own right now?",
      "Any of them paid off, or close to it?",
      "Are you looking to buy again this year? What's stopping you?",
      "If you had cash sitting in the bank tomorrow, what would you do with it?",
      "Who's handling your financing now?",
    ],
    pains: [
      ["Equity sitting there earning nothing", "Cash-out on a paid-off rental. The money goes to work on the next door while the rent covers the payment."],
      ["Wants to grow but banks want tax returns", "The rent qualifies the loan. No tax returns."],
      ["Nervous about the market", "Pull cash for reserves while things are steady. It's easier to qualify now than after something changes."],
      ["Several properties, a lot of paperwork", "Loans that look at the property, not your personal income. Portfolio options for multiple doors."],
      ["Holds in an LLC", "Close in the LLC."],
    ],
    objections: [
      ["I like owning it free and clear", "Totally fair. Many owners keep one free and clear and use another to buy. At least know your number."],
      ["I don't want a payment", "The rent covers the payment. That's how it qualifies. The cash buys the next one."],
      ["Not buying right now", "No problem. Let me run a free portfolio review so you know exactly what's available when the right deal shows up."],
    ],
    close: "I'll run a free portfolio review: what you own, where the cash is stuck, and what it can buy. approvedbyjoshua.com/review takes two minutes.",
  },
  cash_buyer: {
    label: "Cash buyer (last 12 months)",
    goal: "They tied up cash to win the deal. Show them how to get most of it back without selling.",
    ask: ["What made you go all cash on this one?", "Is that cash something you'd rather have back working?", "Is it rented, or what will it rent for?", "Got your next deal lined up yet?"],
    pains: [
      ["Cash is stuck in one property", "Refinance after purchase and pull most of it back out. The rent qualifies the loan, so no tax returns."],
      ["Wants to buy again but cash is gone", "That cash becomes the down payment on the next one."],
      ["Worried about rates", "Compare it to what the cash earns sitting in the house right now: nothing."],
    ],
    objections: [["I like owning it free and clear", "Fair. Many keep one free and clear and use the next one to grow. At least know your number."], ["I'll do it later", "Some programs have timing rules after a purchase. Worth knowing your window now."]],
    close: "Send me the address and what it rents for. I'll tell you how much you can pull back out.",
  },
  stuck_flipper: {
    label: "Flip that didn't sell",
    goal: "The sale didn't happen. Rent it and refinance instead of cutting the price.",
    ask: ["What happened with the listing?", "What's the carrying cost costing you each month?", "Have you thought about renting it instead?", "Is there a short-term loan on it?"],
    pains: [
      ["Holding costs eating the profit", "Rent it, refinance into a long-term loan, and stop the bleed. Keep the upside."],
      ["Short-term loan coming due", "Long-term refi as the exit before the next extension."],
      ["Not rented yet", "Some lenders use market rent from the appraisal."],
    ],
    objections: [["I just want to sell", "Totally fine. Let's set a backup so you're never forced to take a low offer."], ["I'm not a landlord", "Property managers handle it. The rent covers the payment."]],
    close: "Send me the address and the payoff. I'll show you the rent-and-hold numbers today.",
  },
  failed_listing: {
    label: "Rental that failed to sell",
    goal: "They tried to sell and couldn't. Give them a way to keep it and pull cash out.",
    ask: ["What made you want to sell?", "What would you do with the money if you had it?", "Is it rented now?", "Are you relisting?"],
    pains: [
      ["Wanted the cash, not the property", "A cash-out refinance gets the money without selling. The rent qualifies the loan."],
      ["Tired of the hassle", "Keep it with a manager, or pair the cash-out with buying something easier."],
    ],
    objections: [["I'll relist in spring", "Could be right. Meanwhile, here's what you could access now."], ["Rates are high", "Compare it to a price cut. Often the refi costs less."]],
    close: "Want me to run what you could pull out without selling? Takes me 15 minutes.",
  },
  out_of_state: {
    label: "Out-of-state owner, 3+ doors",
    goal: "Sophisticated investor with a portfolio. Show them a lender who knows the market and doesn't need tax returns.",
    ask: ["How many doors do you have in Florida?", "Who's financing them now?", "Are you still buying here?", "Any of them paid off or close to it?"],
    pains: [
      ["Bank wants tax returns and personal income", "Loans where the rent qualifies, closed in an LLC."],
      ["Equity sitting across several properties", "Pull from one or several. Portfolio options exist."],
      ["Hard to manage from far away", "One local contact for the financing side."],
    ],
    objections: [["I have a lender", "Good. I'm a wholesale broker, so I'll shop it in a day. If they win, you lost nothing."]],
    close: "Let me run a free portfolio review on your Florida doors: approvedbyjoshua.com/review",
  },
  tired_landlord: {
    label: "Tired landlord",
    goal: "Long-time owner, possibly worn out. Listen first. Either free up equity or connect them with an agent partner to sell.",
    ask: ["How long have you owned it?", "How's the landlord life treating you?", "If you could change one thing about it, what would it be?", "Ever thought about selling?"],
    pains: [
      ["Wants out", "Connect with an agent partner to sell, or a 1031 into something easier."],
      ["Wants money but not to sell", "Cash-out where the rent qualifies the loan."],
      ["Repairs piling up", "Pull equity to fix it up and raise the rent."],
    ],
    objections: [["Not interested", "Totally fine. Mind if I check in once in a while? Things change."]],
    close: "Whatever you decide, I can show you the numbers on keeping it versus selling. Want that?",
  },
  arm: {
    label: "Adjustable-rate loan on a rental",
    goal: "Their payment may be about to change. Find out when, and lock in certainty.",
    ask: ["Do you know when your rate adjusts?", "What happens to the payment when it does?", "How long do you plan to hold it?", "Is it rented, and what for?"],
    pains: [
      ["Payment about to jump", "Refinance into a fixed long-term loan before it adjusts."],
      ["Uncertainty", "Lock it in and stop watching the market."],
    ],
    objections: [["Rates might drop", "Could. A refi now plus a refi later still beats a surprise payment. Let's compare."]],
    close: "Send me the loan statement and I'll show you the before and after.",
  },
  pre_foreclosure: {
    label: "Pre-foreclosure (rental)",
    goal: "Urgent and sensitive. Be calm and helpful, never pushy. Find out if a refinance can save it.",
    ask: ["Is the property rented right now?", "Roughly what's owed, and what's it worth?", "Do you have a date from the lender?", "Do you want to keep it?"],
    pains: [
      ["Behind and running out of time", "If there's enough equity, a refinance can pay it off and reset the loan."],
      ["Not enough equity", "Connect with an agent partner to sell before the sale date."],
    ],
    objections: [["I'm handling it", "Understood. If plan A falls through, call me before the sale date."]],
    close: "If there's equity, there may be a way out. Want me to look at the numbers today?",
  },
};

export function investorFollowUps(c, kind, me, phone, booking) {
  const first = c.first_name || "there";
  const where = c.property_address ? ` on ${c.property_address}` : "";
  if (kind === "maturing_hard_money") return {
    short: `I help investors move short-term loans into stable long-term financing, fast. Are you done getting the property${where} ready?`,
    vmText: `Hi ${first}, it's ${me}. Love the property${where}. I help investors move short-term loans into stable long-term financing, fast, and I'm local here in Florida. If you've got any time crunch on it, call or text me: ${phone}`,
    emailSubject: c.property_address ? `Your property on ${c.property_address}` : "Your property",
    emailBody: `Hi ${first},\n\nLove the property${where}. Are you done getting it ready for market?\n\nI specialize in moving investors out of short-term loans and into stable, long-term financing, fast. I'm who people call when their financing is in a crunch, and I'm the most cost-effective option out there because I'm a wholesale broker. I lend nationwide, but I'm local: I live and work right here in Florida.\n\nAre you running into any challenges or time crunches I can help with on this one? What's the best time to reach you?\n\nCall or text: ${phone}\nOr grab a time: ${booking}\n\n${SIGN(me, phone)}`,
  };
  if (kind !== "dead_money") return {
    short: `I work with rental owners on getting equity working`,
    vmText: `Hi ${first}, it's ${me} with Zero Point Mortgage Services. I tried you about your property${where}. I help rental owners get cash out or lock in long-term financing without tax returns. Worth a quick call? ${phone}`,
    emailSubject: c.property_address ? `Your property on ${c.property_address}` : "Your rental",
    emailBody: `Hi ${first},\n\nI tried giving you a call about your property${where}.\n\nI work with rental owners on getting cash out or locking in long-term financing where the rent qualifies the loan. No tax returns.\n\nIf it's useful, I can run a free portfolio review: approvedbyjoshua.com/review\n\nCall or text: ${phone}\nOr grab a time: ${booking}\n\n${SIGN(me, phone)}`,
  };
  return {
    short: `I do free portfolio reviews for rental owners, showing where your equity could be working harder`,
    vmText: `Hi ${first}, it's ${me} with Zero Point Mortgage Services. I tried you about the equity in your rental${where}. I do free portfolio reviews for owners: approvedbyjoshua.com/review. Or call me, ${phone}.`,
    emailSubject: "The equity in your rentals",
    emailBody: `Hi ${first},\n\nI tried giving you a call. I work with rental owners, and it looks like you have real equity${where} that isn't earning you anything.\n\nI do free portfolio reviews: what you own, where the cash is stuck, and how to pull it out for the next property without your tax returns. It takes two minutes: approvedbyjoshua.com/review\n\nCall or text: ${phone}\nOr grab a time: ${booking}\n\n${SIGN(me, phone)}`,
  };
}

// Angle from a PropStream list or file name ("Cash buyer - Sarasota.csv").
export const ANGLES = [
  ["maturing_hard_money", "Hard money due", /hard|bridge|matur|\bhm\b/i],
  ["dead_money", "Dead money", /dead|free.?clear|equity/i],
  ["cash_buyer", "Cash buyer", /cash/i],
  ["stuck_flipper", "Stuck flipper", /flip/i],
  ["failed_listing", "Failed listing", /fail|expired/i],
  ["out_of_state", "Out of state", /out.?of.?state|absentee/i],
  ["tired_landlord", "Tired landlord", /tired/i],
  ["arm", "ARM", /\barm\b|adjust/i],
  ["pre_foreclosure", "Pre-foreclosure", /fore|default|nod/i],
];
export const angleFromName = (name) => (ANGLES.find(([, , re]) => re.test(name || "")) || ANGLES[1])[0];
