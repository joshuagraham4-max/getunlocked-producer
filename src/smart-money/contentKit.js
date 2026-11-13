// Videos + scripts checklist (Nov 12, 2026): record, send and post, checked off in the app.
// Each item: id (stable: checkmarks key off it), kind, title, text (what you say or send), steps (checkboxes).
import { BRAND } from "./data.js";
const BOOK = BRAND.booking;
const SNAP = "https://getunlocked-producer.vercel.app/portfolio-snapshot?ref=PORT-01";
const APPLY = "https://getunlocked-producer.vercel.app/equipment-apply";
// Webinar: Thursdays 1 PM ET on Google Meet. Sign-ups through a Google Form (Meet link in the form's confirmation message).
// When the form exists, replace the placeholder below with its link: every video, email and post picks it up.
const WEB = "[registration form link]";
const WHEN = "Thursdays at 1 PM ET";
const vid = (hook, pain, twist, solve, cta) =>
  `HOOK: ${hook}\n\nPAIN: ${pain}\n\nTWIST: ${twist}\n\nSOLVE:\n${solve.map((s) => "- " + s).join("\n")}\n\nCTA: ${cta}`;

export const KIT = [
  { id:"webinar-setup", title:"Webinar setup (do once)", note:"Thursdays 1 PM ET on Google Meet, sign-ups through a Google Form. Then send the form link to Claude to swap in everywhere.", items:[
    { id:"s-meet", kind:"Setup", title:"Create the recurring Google Meet", steps:["Done"],
      text:`Google Calendar → new event "Agent Prospecting Training (live)" → Thursdays, 1:00-1:45 PM ET → Repeat: Weekly on Thursday → Add Google Meet video conferencing → Save.\n\nCopy the Meet link. You'll paste it into the form's confirmation message.` },
    { id:"s-form", kind:"Setup", title:"Create the Google Form", steps:["Built","Confirmation + alerts on"],
      text:`Title: Free Agent Prospecting Training (Thursdays 1 PM ET)\nDescription: The 30-minute daily prospecting routine: who to call, what to say, and scripts that don't sound like a pitch. Live on Google Meet with Joshua Graham.\n\nQuestions (all required except brokerage):\n1. First name (short answer)\n2. Last name (short answer)\n3. Email (short answer, response validation: email)\n4. Mobile phone (short answer)\n5. Brokerage (short answer, optional)\n6. Do you have a team? (multiple choice: Yes, I lead a team / Yes, I'm on a team / No)\n7. Do you work with investors? (multiple choice: Yes / Some / Not yet)\n\nSettings → Presentation → Confirmation message:\n"You're in. We meet live Thursdays at 1 PM ET on Google Meet: [paste Meet link]. Add it to your calendar now. See you there! Joshua Graham, ${BRAND.phone}"\n\nResponses tab → three dots → Get email notifications for new responses: ON.\nResponses tab → Link to Sheets (keeps a running list).` },
    { id:"s-link", kind:"Setup", title:"Send the form link to Claude", steps:["Sent"],
      text:`Copy the form's link (Send → link icon → shorten URL) and paste it to Claude. It replaces [registration form link] in the course video caption, all 3 emails and the post.` },
  ]},
  { id:"eqp-own", title:"Equipment: business owners", note:"Caption link: booking or application page. Hook as on-screen text.", items:[
    { id:"v-eqp-bankno", kind:"Video", title:"The bank said no", steps:["Recorded","Posted"],
      text: vid("Your bank said no on the equipment. Here's what most owners don't know.",
        "You've got work lined up and you need the machine. The bank wants two years of tax returns and perfect credit, then turns you down anyway.",
        "That's one bank's checklist, not the whole market.",
        ["I take your deal to lenders who specialize in equipment.", "The equipment helps secure the deal.", "On most smaller deals it's a one-page application and 3 months of bank statements.", "No credit pull to start, and no upfront fees."],
        "Before you give up on it, book 5 minutes with me. Link's below."), caption:`Bank said no on equipment? Book 5 minutes and find out what's possible 👉 ${BOOK}` },
    { id:"v-eqp-broke", kind:"Video", title:"It broke down again", steps:["Recorded","Posted"],
      text: vid("How much did your last breakdown actually cost you?",
        "You paid for the repair, the job you lost and the crew standing around. Patching it again just pushes the bill down the road.",
        "A new machine can pay for itself out of the work it keeps you from losing.",
        ["Finance the replacement and keep your cash in the business.", "New or used equipment.", "Decisions are fast, often same day on smaller deals."],
        "Patch it again or replace it? Five minutes and I'll run it with you."), caption:`Patch it again or replace it? Quick application 👉 ${APPLY}` },
  ]},
  { id:"eqp-partner", title:"Equipment: partners (send for turn-downs)", note:"Send by text or DM. Not a post. Peer-to-peer tone, seated.", items:[
    { id:"v-p-bank", kind:"Video", title:"Bankers and credit unions", steps:["Recorded","Sent to 5"],
      text: vid("What happens to the equipment deals you turn down?",
        "A good client needs a truck or a machine and doesn't fit your credit box: too new, a credit ding, or the wrong collateral. You say no, they walk, and sometimes the whole relationship goes with them.",
        "Your no doesn't have to be their dead end.",
        ["Send me the turn-down.", "I shop it with equipment lenders who take the deals banks can't.", "Their deposits and relationship stay with you. I only do the equipment.", "No cost to you."],
        "Next time you have to say no, send them my way. 5 minutes, and I'll show you how it works."),
      caption:`Hi [Name], quick 40-second video on what I do with the equipment deals banks have to pass on. Your client stays yours. Worth a 5-minute call? ${BOOK}` },
    { id:"v-p-dealer", kind:"Video", title:"Equipment dealers", steps:["Recorded","Sent to 5"],
      text: vid("How many sales did you lose this month because the buyer's bank said no?",
        "You did the work and they want the machine, then financing falls through and they walk off the lot.",
        "Most dealers have one lender for their A-credit buyers. The rest fall through the cracks.",
        ["I catch those deals: startups, credit dings, and buyers who want attachments and delivery bundled into one payment.", "Fast approvals.", "You get paid in full before the equipment leaves your lot."],
        "Got a stalled quote on your desk right now? Send it over and I'll show you how fast we move."),
      caption:`Hi [Name], 40-second video on how I help dealers save sales when the buyer's bank says no. Got one stalled quote I can run for you? ${BOOK}` },
    { id:"v-p-cpa", kind:"Video", title:"CPAs and bookkeepers (year-end)", steps:["Recorded","Sent to 5"],
      text: vid("Your clients are buying equipment before December 31st. Are they paying cash?",
        "They want the write-off but don't want to drain their cash at year-end.",
        "They can finance it and still put it in service this year.",
        ["You handle the tax side.", "I handle the financing, so they keep their cash.", "A short application on most deals, and fast decisions before the deadline."],
        "Have a client buying gear before year-end? Send them my way."),
      caption:`Hi [Name], short video for your clients buying equipment before Dec 31. You handle the tax side, I handle the financing. Happy to be a resource. ${BOOK}` },
  ]},
  { id:"dscr", title:"DSCR investors", note:"Caption links: booking (Keep the 3%) and Portfolio Snapshot (credit).", items:[
    { id:"v-dscr-3", kind:"Video", title:"Keep the 3%", steps:["Recorded","Posted"],
      text: vid("You have a 3% rate and a lot of equity. Don't refinance it away.",
        "You want to buy the next rental, but the money is locked in a property with a rate you'll never see again.",
        "You don't have to touch the first mortgage.",
        ["A second loan behind your first, qualified on the property's rent, not your tax returns.", "Your low rate stays where it is.", "Your equity goes to work on the next deal."],
        "Want to see how much you could pull out? Book 5 minutes with me."), caption:`Keep the 3%. Take the equity. 5 minutes 👉 ${BOOK}` },
    { id:"v-dscr-credit", kind:"Video", title:"Stop handing out your credit", steps:["Recorded","Posted"],
      text: vid("Every lender wants to pull your credit just to tell you what's possible.",
        "Investors hate it: more inquiries, more paperwork, and still no clear answer.",
        "You already have what I need: the spreadsheet you keep on your rentals.",
        ["Send it to me. Messy is fine.", "No credit pull and no application.", "Within 24 hours I'll show you where the equity is, where money is sitting dead and where cash flow can improve."],
        "Free portfolio snapshot. Link's below."), caption:`Free portfolio snapshot. No credit pull. No application 👉 ${SNAP}` },
  ]},
  { id:"agents", title:"Agents: the Silent Deal Shrinker", note:"Send to agents directly. Wholesale pricing, bigger approvals.", items:[
    { id:"v-a-shrink", kind:"Video", title:"The Silent Deal Shrinker", steps:["Recorded","Sent to 10 agents"],
      text: vid("Your buyer's lender might be shrinking their budget, and neither of you knows it.",
        "Your buyer gets approved for $450K, so they're shopping $450K houses. They lose the one they loved by $20K, and nobody questions the approval.",
        "Approval amount comes down to rate and payment. Most retail lenders are pricing with retail margins built in.",
        ["I'm a wholesale broker, so I shop dozens of lenders at wholesale pricing.", "A lower rate means more house on the same payment. For example, on a $3,000 payment a half-point lower rate is about $20-25K more purchase price.", "Same buyer and same income, just a bigger budget."],
        "Send me one buyer you're working with now. I'll run a second opinion on the approval, and you stay in the driver's seat."),
      caption:`Hi [Name], 40-second video on why some of your buyers may be approved for less than they could be. Got one I can run a quick second look on? ${BOOK}` },
  ]},
  { id:"teams", title:"Team leaders: I train your team", note:"Send to team leads and brokers.", items:[
    { id:"v-t-train", kind:"Video", title:"Your team has a prospecting problem", steps:["Recorded","Sent to 5 team leads"],
      text: vid("Your team doesn't have a lead problem. They have a prospecting problem.",
        "New agents sit and wait for leads. Their database goes cold, and you're carrying the production.",
        "Prospecting works when it's a daily system, not a mood.",
        ["I come in and train your team on the system I use: daily call queues, past-client follow-up, birthday and anniversary touches, and the scripts.", "I bring the lending side too: approvals, pre-approval strategy and what makes offers win.", "No cost to your team."],
        "Let me run one training for your team this month. 5 minutes to set it up."),
      caption:`Hi [Name], I train agent teams on daily prospecting systems, plus the lending side that helps them win offers. Open to one free session for your team this month? ${BOOK}` },
  ]},
  { id:"course", title:"Agent Prospecting Course → webinar", note:"Live on Google Meet, Thursdays at 1 PM ET. [registration form link] is a placeholder until the Google Form is made (see Webinar setup).", items:[
    { id:"v-c-video", kind:"Video", title:"Most agents quit in week two", steps:["Recorded","Posted"],
      text: vid("Most agents quit prospecting in week two. Here's why.",
        "You call 20 people, nobody picks up, it feels awkward, and you stop. Then the pipeline dries up 90 days later.",
        "The fix isn't more willpower. It's a short list, the right reason to call and a daily target you can actually hit.",
        ["The free webinar covers who to call today and why.", "It includes scripts that don't sound like a pitch.", "And a 30-minute daily routine that builds a pipeline."],
        "Free live training, " + WHEN + ". Save your seat, link's below."), caption:`Free live training for agents, ${WHEN}: the 30-minute daily prospecting routine 👉 ${WEB}` },
    { id:"e-c-1", kind:"Email 1", title:"Send right away", steps:["Sent"],
      text:`Subject: Why prospecting stops working in week two\n\nMost agents don't fail at prospecting; they quit before it works. The calls feel awkward, nobody answers, and it's easy to stop.\n\n${WHEN} I'm teaching the daily system I use, live on Google Meet: who to call, what to say and how to make it take 30 minutes a day. It's free, and you'll get the scripts.\n\nSave your seat: ${WEB}\n\nJoshua Graham\n${BRAND.phone}` },
    { id:"e-c-2", kind:"Email 2", title:"2 days later", steps:["Sent"],
      text:`Subject: The one reason to call that always works\n\nCold calls feel bad because there's no reason behind them. "Just checking in" is not a reason. A home value update, a rate change or a neighbor's sale is.\n\nOn the webinar I'll show you how to find a real reason for every call on your list.\n\n${WEB}\n\nJoshua Graham\n${BRAND.phone}` },
    { id:"e-c-3", kind:"Email 3", title:"Day before", steps:["Sent"],
      text:`Subject: Tomorrow: your 30-minute prospecting routine\n\nQuick reminder: tomorrow at 1 PM ET I'm walking through the full daily routine, including the call list, the scripts and how to track it so you actually stick with it.\n\nBring your questions.\n\n${WEB}\n\nJoshua Graham\n${BRAND.phone}` },
    { id:"p-c-a", kind:"Post", title:"Prospecting stops in week two", steps:["Posted"],
      text:`AGENTS · FREE TRAINING\nProspecting stops in week two. Here's the fix.\nA 30-minute daily routine with real reasons to call.\nFree live training. Scripts included.\n\nMost agents don't fail at prospecting. They quit before it works. I'm teaching the daily system I use, live and free, ${WHEN}. Save your seat 👉 ${WEB}` },
    { id:"p-c-b", kind:"Post", title:"Your buyer's budget might be too small", steps:["Posted"],
      text:`AGENTS · BUYER APPROVALS\nYour buyer's budget might be too small.\nRetail pricing can shrink approvals, and nobody notices.\nWholesale pricing. Same buyer, bigger budget.\n\nBefore your buyer loses another house by $20K, let me run a second look on their approval. 5 minutes 👉 ${BOOK}` },
    { id:"p-c-c", kind:"Post", title:"Your team needs a system", steps:["Posted"],
      text:`TEAM LEADERS · TRAINING\nYour team needs a system, not more leads.\nI train agent teams on daily prospecting and the lending side of winning offers.\nOne free session for your team.\n\nWant your agents prospecting every day without you chasing them? Let me run a training. 👉 ${BOOK}` },
  ]},
];
