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
};

export function investorFollowUps(c, kind, me, phone, booking) {
  const first = c.first_name || "there";
  const where = c.property_address ? ` on ${c.property_address}` : "";
  if (kind === "maturing_hard_money") return {
    short: `I'm reaching out about the short-term loan${where}. If it's coming due, I can roll it into a long-term loan where the rent qualifies it, no tax returns`,
    vmText: `Hi ${first}, it's ${me} with Zero Point Mortgage Services. I tried you about the short-term loan${where}. If it's coming due, I can roll it into a long-term loan where the rent qualifies it, no tax returns. Worth a quick call? ${phone}`,
    emailSubject: c.property_address ? `Your loan on ${c.property_address}` : "Your short-term loan",
    emailBody: `Hi ${first},\n\nI tried giving you a call. Public records show a short-term loan${where} that's likely coming due soon.\n\nIf you want a clean exit, I can refinance it into a long-term loan where the rent qualifies it. No tax returns. Send me the payoff and what it rents for, and I'll have numbers back the same day.\n\nCall or text: ${phone}\nOr grab a time: ${booking}\n\n${SIGN(me, phone)}`,
  };
  return {
    short: `I do free portfolio reviews for rental owners, showing where your equity could be working harder`,
    vmText: `Hi ${first}, it's ${me} with Zero Point Mortgage Services. I tried you about the equity in your rental${where}. I do free portfolio reviews for owners: approvedbyjoshua.com/review. Or call me, ${phone}.`,
    emailSubject: "The equity in your rentals",
    emailBody: `Hi ${first},\n\nI tried giving you a call. I work with rental owners, and it looks like you have real equity${where} that isn't earning you anything.\n\nI do free portfolio reviews: what you own, where the cash is stuck, and how to pull it out for the next property without your tax returns. It takes two minutes: approvedbyjoshua.com/review\n\nCall or text: ${phone}\nOr grab a time: ${booking}\n\n${SIGN(me, phone)}`,
  };
}
