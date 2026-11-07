// Pre-deploy check. Runs before every build (npm "prebuild"), so Vercel refuses to deploy if it fails.
// Feeds the Groups and agent-outreach logic the kinds of data the app really sees, including text-only posts
// (image null), and fails on any crash. Add a case here whenever a new kind of row shows up in the database.
import { createServer } from "vite";

process.env.VITE_SUPABASE_URL ||= "http://localhost:54321";
process.env.VITE_SUPABASE_ANON_KEY ||= "check-only";

const server = await createServer({ logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.error(`  FAIL ${name}\n       ${e?.stack?.split("\n").slice(0, 3).join("\n       ") || e}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

try {
  const G = await server.ssrLoadModule("/src/groups/askClaude.js");
  const O = await server.ssrLoadModule("/src/groups/outreachScripts.js");
  const day = "2026-11-07";

  // Posts: every stage, text-only and with an image, plus an inactive old ad.
  const posts = [
    { id: "h1", kind: "hook", title: "Hook", body: "Poll?", image: null, active: true, sort: 1 },
    { id: "q1", kind: "qualify", title: "Qualify", body: "Comment below.", image: null, active: true, sort: 2 },
    { id: "p1", kind: "presell", title: "Presell", body: "Story.", image: null, active: true, sort: 3 },
    { id: "p2", kind: "presell", title: "Presell 2", body: "Math. {CALC}", image: undefined, active: true, sort: 4 },
    { id: "o1", kind: "offer", title: "Offer", body: "Run numbers {CALC}\n\n{SIGN}", image: null, active: true, sort: 5 },
    { id: "img", kind: "presell", title: "With image", body: "ZPM saves deals {BOOK}", image: "/groups/JG-SaveDeals-plum.png", active: true, sort: 6 },
    { id: "old", kind: "post", title: "Old ad", body: "Old", image: "/groups/JG-SaveDeals-plaid.png", active: false, sort: 0 },
  ];
  // Groups: every promo rule, including rules not checked yet and comments-only.
  const groups = [
    { id: "g1", name: "Promo OK", status: "joined", promo_day: "ok" },
    { id: "g2", name: "Ten day", status: "joined", promo_day: "ok, 10-day repeat" },
    { id: "g3", name: "No promo", status: "joined", promo_day: "no promo" },
    { id: "g4", name: "Comments only", status: "joined", promo_day: "comments only" },
    { id: "g5", name: "Rules unknown", status: "joined", promo_day: null },
    { id: "g6", name: "Requested", status: "requested", promo_day: "ok" },
    { id: "g7", name: "Deep in sequence", status: "joined", promo_day: "no promo" },
  ];
  const log = [
    { post_id: "old", group_id: "g1", day: "2026-11-05" },
    { post_id: "h1", group_id: "g3", day: "2026-11-06" },
    ...["h1", "q1", "p1", "p2"].map((p, i) => ({ post_id: p, group_id: "g7", day: `2026-10-0${i + 1}` })),
  ];

  let plan;
  check("Groups: builds today's posts from text-only and image posts", () => {
    plan = G.buildAssignments({ posts, groups, log, day });
    assert(plan.assignments.length > 0, "no posts were lined up");
    assert(!plan.assignments.some((a) => a.group.id === "g4"), "a comments-only group got a post");
    assert(plan.skipped.some((s) => s.includes("Rules unknown")), "a group with unchecked rules was not skipped");
    for (const a of plan.assignments) if (a.stage === "offer") assert(/^ok/.test(a.group.promo_day), `offer in ${a.group.name}`);
  });
  check("Groups: every queued post gets a label (the Nov 7 crash)", () => {
    for (const a of plan.assignments) assert(typeof G.assignmentLabel(a) === "string", "no label");
    assert(G.assignmentLabel({ stage: "hook", image: null }) === "hook, text only", "text-only label");
    assert(G.assignmentLabel({ stage: "presell", image: "/groups/JG-SaveDeals-plum.png" }) === "presell, plum image", "image label");
    G.assignmentLabel({}); G.assignmentLabel(undefined);
  });
  check("Groups: the job text builds and fills every placeholder", () => {
    const job = G.buildJob({ assignments: plan.assignments, userId: "u", day });
    assert(job.includes("Today's posts"), "job text missing");
    for (const p of posts) { const t = G.postText(p.body); assert(!/\{(CALC|BOOK|SIGN)\}/.test(t), `placeholder left in ${p.title}`); }
  });
  check("Groups: nothing to post, and empty data", () => {
    G.buildAssignments({ posts: [], groups: [], log: [], day });
    G.buildAssignments({ posts, groups: groups.map((g) => ({ ...g, status: "removed" })), log, day });
  });

  check("Agent outreach: every step builds a message, even with missing fields", () => {
    const rows = [
      { id: "a", step: 0, first_name: "Desiree", area: "Sarasota", hook: "Congrats on NARPM's Rookie of the Year" },
      { id: "b", step: 1, full_name: "Kyle Baseggio" },
      { id: "c", step: 2, first_name: "", full_name: "", area: null, hook: null },
      { id: "d", step: null }, { id: "e", step: 7 },
    ];
    for (const r of rows) { const m = O.messageFor(r); assert(m.text && !m.text.includes("undefined") && !m.text.includes("null"), `bad text for ${r.id}: ${m.text}`); }
    assert(O.linkedInNote({ first: "Ann", area: "", hook: "" }).length <= 300, "LinkedIn note over 300 characters");
  });
} catch (e) {
  failed++; console.error("  FAIL could not load the app code:", e?.message || e);
} finally {
  await server.close();
}

if (failed) { console.error(`\nPre-deploy check: ${failed} failed. Not deploying.`); process.exit(1); }
console.log("\nPre-deploy check passed.");
