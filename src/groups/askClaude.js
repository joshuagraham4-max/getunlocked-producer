// "Ask Claude to post": the app builds today's group-posting job, Claude does it in Joshua's desktop browser.
// Facebook has no API for group posts, so the work happens through the browser, with Joshua's OK on each post.
import { BOOKING, MY_PHONE } from "../radar/engine.js";

export const DAILY_MAX = 5;
const SITE = "https://getunlocked-producer.vercel.app";
const CALC_SHORT = "approvedbyjoshua.com/rental";
const SIGN = "Joshua Graham, NMLS 169809 | Zero Point Mortgage Services, NMLS 1216108";
const PROJECT = "timgdgqyfbrpnpcojmmy";

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const allowsPromo = (g) => /^ok/i.test((g.promo_day || "").trim());
const tenDay = (g) => /10/.test(g.promo_day || "");
const SEQ = ["hook", "qualify", "presell", "presell", "offer"];
const STAGES = ["hook", "qualify", "presell", "offer"];

// Value posts carry no contact info. Only posts with {SIGN} (soft offers) get the phone + NMLS block.
export const SIGN_BLOCK = `Call or text: ${MY_PHONE}\n\n${SIGN}`;
export const postText = (body) => body.replaceAll("{CALC}", CALC_SHORT).replaceAll("{BOOK}", BOOKING).replaceAll("{SIGN}", SIGN_BLOCK)
  .replace(/\bZPM\b/g, "Zero Point Mortgage Services").trim();

// Pick today's assignments: oldest-posted groups first, a different post in each, never a post twice in one day.
export function buildAssignments({ posts, groups, log, day }) {
  const usedToday = new Set(log.filter((x) => x.day === day).map((x) => x.post_id));
  const groupsToday = new Set(log.filter((x) => x.day === day).map((x) => x.group_id));
  const slots = Math.max(0, DAILY_MAX - groupsToday.size);
  const last = {}; for (const x of log) if (!last[x.group_id] || x.day > last[x.group_id]) last[x.group_id] = x.day;
  const skipped = [];
  const eligible = groups.filter((g) => {
    if (g.status !== "joined") return false;
    if (!g.promo_day) { skipped.push(`${g.name}: rules not checked yet`); return false; }
    if (/comment/i.test(g.promo_day)) return false;   // comments-only groups: reply to questions, never post
    return !groupsToday.has(g.id);
  }).sort((a, b) => (last[a.id] || "0000").localeCompare(last[b.id] || "0000"));

  const free = posts.filter((p) => p.active && !usedToday.has(p.id));
  const byId = Object.fromEntries(posts.map((p) => [p.id, p]));
  // Least-recently-used first, so the bank rotates evenly.
  const lastUsed = {}; for (const x of log) if (!lastUsed[x.post_id] || x.day > lastUsed[x.post_id]) lastUsed[x.post_id] = x.day;
  const lru = (a, b) => (lastUsed[a.id] || "0000").localeCompare(lastUsed[b.id] || "0000") || (a.sort || 0) - (b.sort || 0);
  const out = [];
  for (const g of eligible) {
    if (out.length >= slots) break;
    const taken = new Set(out.map((a) => a.post.id));
    const recentHere = new Set(log.filter((x) => x.group_id === g.id && daysBetween(x.day, day) < (tenDay(g) ? 10 : 30)).map((x) => x.post_id));
    // Each group walks the sequence: hook, qualify, presell, presell, offer. Old pre-sequence posts don't count.
    const steps = log.filter((x) => x.group_id === g.id && STAGES.includes(byId[x.post_id]?.kind)).length;
    let stage = SEQ[steps % SEQ.length];
    if (stage === "offer" && !allowsPromo(g)) stage = "presell";
    const ok = (p) => !taken.has(p.id) && !recentHere.has(p.id);
    const pick = (k) => free.filter((p) => p.kind === k && ok(p)).sort(lru)[0];
    const post = pick(stage) || (stage === "offer" ? null : pick("presell")) || pick("hook");
    if (!post) { skipped.push(`${g.name}: no ${stage} post it hasn't seen recently`); continue; }
    out.push({ group:g, post, stage, image: post.image ? SITE + post.image : null });
  }
  return { assignments: out, skipped, slots };
}

// Short label for a queued post: its stage and whether it carries an image. Posts can be text only (image null).
export function assignmentLabel(a) {
  const img = a?.image || a?.post?.image || "";
  const kind = !img ? "text only" : `${img.includes("plaid") ? "plaid" : img.includes("plum") ? "plum" : "post"} image`;
  return [a?.stage, kind].filter(Boolean).join(", ");
}

export function buildJob({ assignments, userId, day }) {
  const lines = [
    `Group-posting job from the Get Unlocked Producer app, ${day}. You are posting for Joshua Graham in Facebook groups.`,
    "",
    "Rules:",
    "- Use Claude in Chrome, in Joshua's own Chrome where he's signed into Facebook. Never type a password. If Facebook is signed out, stop and ask him to sign in.",
    "- Before EACH post, show Joshua the group, the text and the image, and wait for his OK. Skip any he says no to.",
    "- Pace it: at least 20 minutes between posts. If Facebook shows any warning, restriction or \"slow down\" notice, stop and tell him.",
    "- Post the text exactly as written below. No emojis. If a link preview card appears, remove it before adding the image.",
    "- Value posts are text only: no image, no link. If a post lists an image, attach it: open the image URL in a new tab, fit it to the window (img height 100vh, body margin 0), take a screenshot, then upload_image it into the post's file input. Close that tab after.",
    "- Some groups hold posts for admin approval. That's fine; note it.",
    "",
    `After each post goes up (or is pending approval), log it. Open https://supabase.com/dashboard/project/${PROJECT}/sql/new in the desktop browser pane, wait 4 seconds, define this helper with javascript, then run the insert shown under that post:`,
    `window.__q = async (sql) => { const t = JSON.parse(localStorage['supabase.dashboard.auth.token']).access_token; const r = await fetch('https://api.supabase.com/v1/projects/${PROJECT}/database/query',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({query:sql})}); return r.json(); };`,
    "If it says \"JWT failed verification\", reload that page and define the helper again.",
    "",
    `Today's posts (${assignments.length}):`,
  ];
  assignments.forEach((a, i) => {
    lines.push("", `=== ${i + 1}. ${a.group.name} ===`);
    if (a.group.url) lines.push(`Group: ${a.group.url}`);
    if (a.group.rules) lines.push(`Group rules: ${a.group.rules}`);
    lines.push(`Stage: ${a.stage}`, `Post: ${a.post.title}`, `Image: ${a.image || "none (text only)"}`, "Text:", "---", postText(a.post.body), "---",
      `Log: insert into group_post_log (user_id, post_id, group_id, day) values ('${userId}', '${a.post.id}', '${a.group.id}', '${day}');`);
  });
  lines.push("", "When you're done, give Joshua a short report: what went out, what's pending admin approval, and anything skipped and why.");
  return lines.join("\n");
}

// Copies the job and opens Claude. The prefill only fits short jobs in the link, so the clipboard is the sure path.
export async function sendToClaude(job) {
  try { await navigator.clipboard?.writeText(job); } catch { /* clipboard blocked; the job is still shown on screen */ }
  const q = encodeURIComponent(job);
  window.open(q.length < 7000 ? `https://claude.ai/new?q=${q}` : "https://claude.ai/new", "_blank", "noopener");
}
