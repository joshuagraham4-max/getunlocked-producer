// Ready-made posts for agents. Used by the agent's edit page and by Contacts ("Copy their post copy").
// Voice: pain or curiosity first, then how the lender is different, then the link. Plain words, no stats.
export const WHY_ME = "The lender I work with is a wholesale broker, so he shops several lenders for you. Get a quote from anyone. Then get his.";

// link = the agent's lander. mk = " in Sarasota, FL" style text (may be empty).
export function agentPosts(link, mk = "") {
  const m = mk || "";
  return [
    ["Buyers · The Zillow guess", `Zillow just told you what you can "afford." It doesn't know your credit, your taxes, or what a different lender would quote. That number is a guess with a payment attached.\n\n${WHY_ME}\n\nTwo minutes to see where you stand: ${link}`],
    ["Buyers · One quote", `Most buyers get one lender's quote and call it a day. They never find out what a second opinion would have shown them.\n\n${WHY_ME}\n\nSee where you stand${m}: a free credit report review, appraisal credits and access to wholesale rates. ${link}`],
    ["Buyers · Curiosity", `Two buyers. Same house. Same price. Different lenders. Their monthly payments weren't the same.\n\nWant to know what yours could look like with a few lenders competing for you?\n\n${link}`],
    ["Buyers · Waiting on rates", `Waiting for rates to drop before you start looking${m}?\n\nYou can find out today what you'd actually pay and what it would take to qualify, so you're ready the moment the right house shows up.\n\n${WHY_ME}\n\n${link}`],
    ["Buyers · Comment INFO", `Thinking about buying${m} this year?\n\nComment INFO and I'll send you a free way to see where you stand: a credit report review, appraisal credits and access to wholesale rates. No pressure.`],
    ["Reply to INFO comments (send as a message)", `Hey! Here's the link. It takes about two minutes and you'll see where you stand: ${link}\n\nIf anything comes up, text me.`],
    ["Sell, then buy", `Selling and buying in the same move is the part that keeps people up at night. What will I net? When do I list? Can I afford the next one?\n\nAnswer a few quick questions. I'll run the real numbers on your home, not a Zillow guess, while my lender partner looks at the buy side.\n\n${link}`],
    ["Sellers · The Zillow number", `Zillow's number for your home is a guess. What you'd actually walk away with depends on your payoff, your timing and what you're buying next.\n\nBefore you list${m}, let me run the real numbers. Two minutes, no pressure: ${link}`],
    ["Debate post", `Agree or disagree: a payment based on a Zestimate is a guess with a number on it.\n\nIf you're serious about buying${m}, get a real payment from a real lender. Better yet, from one who shops several.\n\n${link}`],
    ["Video post (60 seconds)", `60 seconds on why I do this differently. Then take two minutes and see where you stand${m}: ${link}`],
    ["Instagram caption (short)", `Buying${m}? Get a second opinion on your numbers before you fall in love with a house. Link in bio.`],
    ["Boost this one ($20 to $50)", `Buying${m}? See where you stand in two minutes. Free credit report review, appraisal credits and wholesale rates. ${link}`],
  ];
}
