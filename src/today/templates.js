// Day templates for the Game Plan. Blocks: [start, end, name, kind, note, flags]
// kind: money | build | rest | fixed | family. flags: { personal:true } hides it when "My routine" is off,
// { lock:true } is the call block (its time comes from settings.callBlock), { check:true } shows a checkbox.

const P = { personal:true }, PC = { personal:true, check:true }, C = { check:true }, LOCK = { lock:true, check:true };

// Joshua: his Daily Game Plan, with calls moved to the locked 1-3 PM ET block.
export const JOSHUA = {
  morning: {
    default: [
      ["06:45","07:30","Alarm, hot tub at 7:00, coffee, shower","fixed","In the hot tub by 7:00.",P],
      ["07:30","07:50","Meditation and prayer","rest","Use the timer.",P],
      ["07:50","08:30","Son time + light work","family","Group posts if he's busy.",P],
    ],
    am: [
      ["05:00","05:15","Alarm, wake up","fixed","Early gym day.",P],
      ["05:15","07:00","Gym","rest","Drive there, 90 min training, drive back.",PC],
      ["07:00","07:30","Hot tub, shower","fixed","In the hot tub by 7:00.",P],
      ["07:30","07:50","Meditation and prayer","rest","Use the timer.",P],
      ["07:50","08:30","Son time + light work","family","",P],
    ],
  },
  day: [
    ["08:30","09:00","School run + wife to the gym","fixed","Drop-off.",P],
    ["09:00","09:45","Dog walk","rest","The real walk. No phone.",P],
    ["09:45","11:30","Emails + group posts","money","Today's 10 reconnect emails and the group posts.",C],
    ["11:30","12:00","Lunch","rest","First 5 min: X and Facebook on the timer. Then phone down.",null],
    ["12:00","13:30","Prep: rates in, call list, deal follow-ups","money","Enter today's rates on Radar so rate opportunities rank first.",C],
    ["13:30","13:50","Pick up wife","fixed","Back by 1:50.",P],
    ["14:00","15:25","Call block","money","",LOCK],
    ["15:25","16:15","Leave for school pickup + home buffer","fixed","Hard stop at 3:25.",P],
  ],
  evening: {
    "630": [
      ["16:15","17:45","Follow-ups, deal work + callbacks","money","Texts and emails from today's voicemails, files, quotes, returned calls.",C],
      ["18:00","18:30","Dinner with family","family","",P],
      ["18:30","20:30","Gym","rest","Drive there, 90 min training, drive back.",PC],
      ["20:30","21:30","Family time","family","No work.",P],
      ["21:30","22:15","Deep build","build","Content and systems. Quiet house.",C],
      ["22:15","22:45","Prep + wind down","rest","Clothes out. Phone charging outside the bedroom.",P],
      ["22:45","06:45","Lights out","rest","8 hours before the 6:45 alarm.",PC],
    ],
    am: [
      ["16:15","17:45","Follow-ups, deal work + callbacks","money","Texts and emails from today's voicemails, files, quotes, returned calls.",C],
      ["18:00","20:30","Dinner, family, free time","family","Not on X or Facebook.",P],
      ["20:30","20:45","Prep tomorrow","fixed","Clothes out, food prepped.",P],
      ["20:45","21:15","Wind down","rest","Phone charging outside the bedroom.",P],
      ["21:15","05:00","Lights out","rest","7.75 hours before the 5:00 alarm.",PC],
    ],
    "830": [
      ["16:15","17:45","Follow-ups, deal work + callbacks","money","Texts and emails from today's voicemails, files, quotes, returned calls.",C],
      ["18:00","20:15","Dinner, family, free time","family","Obligations first. Then you're clear to go.",P],
      ["20:15","20:30","Leave buffer","fixed","Keys, out the door.",P],
      ["20:30","22:30","Gym","rest","Replaces the evening build.",PC],
      ["22:30","22:45","Prep + wind down","rest","Shower, phone charging outside the bedroom.",P],
      ["22:45","06:45","Lights out","rest","8 hours before the alarm.",PC],
    ],
    "415": [
      ["16:15","18:15","Gym","rest","Takes the follow-up and deal-work block.",PC],
      ["18:15","20:30","Dinner, family, free time","family","Not on X or Facebook.",P],
      ["20:30","21:30","Deep build","build","Quiet house.",C],
      ["21:30","22:15","Prep + wind down","rest","Phone charging outside the bedroom.",P],
      ["22:15","06:45","Lights out","rest","8.5 hours before the alarm.",PC],
    ],
  },
  gymTiers: [["630","Tier 1 · 6:30 PM","Loses nothing: the call block, deal work, build and family time all stay."],["am","Tier 2 · Early AM","5:00 alarm. Costs the evening build so you're in bed by 9:15."],["830","Tier 3 · 8:30 PM","Gym takes the evening build slot."],["415","Tier 4 · 4:15 PM","Gym takes deal work. Breaks the perfect-day streak."]],
};

// Everyone else: a clean work day around their call block. They can add their own routine later.
export const DEFAULT = {
  morning: { default: [["08:30","09:00","Plan the day","fixed","Rates in, review today's call list.",null]] },
  day: [
    ["09:00","10:30","Emails + group posts","money","Today's reconnect emails and group posts.",C],
    ["10:30","12:00","Deal work","money","Files, quotes, returned calls.",C],
    ["12:00","13:00","Lunch","rest","",null],
    ["13:00","15:00","Call block","money","",LOCK],
    ["15:00","15:30","Follow-ups from today's calls","money","Texts and emails from today's voicemails.",C],
    ["15:30","17:00","Deal work + callbacks","money","",C],
  ],
  evening: { default: [] },
  gymTiers: [],
};

export const JOSHUA_ID = "f43a0121-3b76-4d1e-92b5-73e685b81c52";

export function defaultSettings(userId, avgCommission = 4000) {
  const me = userId === JOSHUA_ID;
  const c = Number(avgCommission) || 4000;
  return {
    callBlock: me ? { start:"14:00", end:"15:25", tz:"America/New_York" } : { start:"13:00", end:"15:00", tz:"America/New_York" },
    routine: me,                       // "My routine" (personal blocks, timers, gym tiers)
    messages: me ? "mine" : "standard",// off | standard | mine
    myMessages: [],
    targets: { conv:5, posts:7 },
    // Dollar value of each activity, from average commission: app 25%, conversation 8.75%, post 3.5%, dial/email 1.75%.
    values: { dial:Math.round(c * 0.0175), email:Math.round(c * 0.0175), conv:Math.round(c * 0.0875), booked:Math.round(c * 0.0875), post:Math.round(c * 0.035), app:Math.round(c * 0.25), video:Math.round(c * 0.035), dm:10 },
    extraCounters: me ? ["apps","videos","proposals","sold"] : ["apps"],
    template: me ? "joshua" : "default",
    customDay: null,                   // optional edited day blocks
  };
}

export const STANDARD_LINES = [
  "That's one more conversation that could be a closing.",
  "Every dial is a deposit.",
  "Consistency beats talent. You just proved it.",
  "That call is somebody's next home.",
  "The pipeline doesn't build itself. You just built it.",
  "Momentum. Keep it moving.",
  "Your future clients thank you.",
  "One more rep. That's how producers are made.",
];
export const JOSHUA_LINES = [
  "Mr. Graham, shall I bring the Bentley around?",
  "Mr. Graham, your ocean suite is ready for you and the lady.",
  "The black Ferrari or the red one this morning, sir?",
  "Would you like that in thousand-dollar bills, sir?",
  "This one's for the Ferrari. That's what's on the other side of this fake fear.",
  "Sir, your jet is fueled for Montenegro. Your guests are already aboard.",
  "Mr. Graham, the castle's new gates arrived from Florence.",
  "The surveyor finished walking all hundred acres, sir. It's even more beautiful than the photos.",
  "Your wooden sailboat is varnished and ready in Portofino.",
  "Captain says the Amalfi coast is glass this morning, sir.",
  "Sir, the palace staff in Greece has opened the terrace for sunset.",
  "Mr. Graham, the Santorini villa's infinity pool has been heated for you.",
  "Your table on the terrace in Capri is ready, sir.",
  "Sir, the mooring in Monaco is confirmed for the weekend.",
  "Your tailor in Milan called. The new suits are ready.",
  "Mr. Graham, Lake Como is calm. Shall I ready the launch?",
  "Your account manager is on line one. It's good news, sir.",
  "Mr. Graham, the guest wing is ready for the whole family this summer.",
  "Another brick in the castle, Mr. Graham.",
  "Your wife just told you she loves you more than ever.",
  "Your son just said, 'Dad, I'm so proud of you.'",
  "Your whole bloodline is cheering for you right now.",
  "Your family is so grateful for the beautiful life you're building.",
  "Generations from now, your family will still feel this decision.",
];
export const MILESTONES = { 1000:"$1,000 today. The first of many.", 2500:"$2,500. Keep stacking.", 5000:"$5,000 day. Your family is celebrating you tonight.", 10000:"$10,000. That's a producer's day." };
export const JOSHUA_MILESTONES = { 1000:"$1,000 today. Mr. Graham, the first of many.", 2500:"$2,500. The yacht broker is calling you back personally, sir.", 5000:"$5,000 day. Your family is celebrating you tonight.", 10000:"$10,000. The castle is officially yours, Mr. Graham." };
