import React, { useMemo, useState } from "react";
import { BRAND, CARDS, PAIN_POINTS, MAGNETS, FOOTERS, CHANNELS, planFor, magnetLink } from "./data.js";

// Self-contained module: drop <SmartMoney /> into the Producer app later.
const C = {
  navy: "#0E1B2A", navy2: "#16283C", ink: "#0E1B2A", muted: "#51647A", line: "#DCE3EB",
  bg: "#F3F6F9", card: "#FFFFFF", blue: "#1F6FA8", sky: "#4FB0EA", teal: "#2E9C7A",
  warn: "#B7791F", warnBg: "#FDF3E1", good: "#2E8B3E", goodBg: "#E6F4E8",
};
const F = { display: "'Montserrat', Arial, sans-serif", body: "'Public Sans', system-ui, sans-serif" };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const dateKey = (d) => d.toISOString().slice(0, 10);

function CopyBtn({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  const go = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {} document.body.removeChild(ta);
    }
    setDone(true); setTimeout(() => setDone(false), 1500);
  };
  return <button onClick={go} style={btn(done ? C.good : C.blue)}>{done ? "Copied" : label}</button>;
}
const btn = (bg) => ({ fontFamily: F.display, fontWeight: 700, fontSize: 13, background: bg, color: "#fff", border: 0, borderRadius: 8, padding: "10px 14px", cursor: "pointer", minHeight: 40 });
const ghost = { ...btn("transparent"), color: C.ink, border: `1.5px solid ${C.line}` };

function Tag({ children, tone = "neutral" }) {
  const t = { neutral: [C.bg, C.muted], investor: ["#E3F0FA", C.blue], consumer: ["#E4F5EE", C.teal], warn: [C.warnBg, C.warn], good: [C.goodBg, C.good] }[tone];
  return <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", background: t[0], color: t[1], borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{children}</span>;
}
const audTag = (c) => <Tag tone={c.audience}>{c.audience === "investor" ? "Investor" : "Consumer"}</Tag>;
const licTag = (c) => c.license === "none" ? <Tag tone="good">No license needed · FL OK</Tag> : <Tag tone="warn">License required · CO only</Tag>;

function Flyer({ card, size = "100%" }) {
  if (card.flyer) return <img src={card.flyer} alt={`${card.ref} flyer`} style={{ width: size, maxWidth: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 10, display: "block", border: `1px solid ${C.line}` }} />;
  return (
    <div style={{ width: size, maxWidth: "100%", aspectRatio: "1/1", borderRadius: 10, background: C.navy, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, padding: 20, boxSizing: "border-box" }}>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 18 }}>{card.ref}</div>
      <div style={{ fontSize: 14, color: "#C9D6E3" }}>{card.name}</div>
      <div style={{ marginTop: 6 }}><Tag tone="warn">Flyer needed</Tag></div>
    </div>
  );
}

function PostKit({ card, copyKind = "short" }) {
  const link = magnetLink(card);
  const m = MAGNETS[card.magnet];
  const body = card[copyKind];
  const footer = FOOTERS[card.footer];
  const full = `${body}${link ? `\n\n${link}` : ""}\n\n${footer}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{audTag(card)}{licTag(card)}<Tag>REF {card.ref}</Tag></div>
      <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Lead magnet</div>
        <div style={{ fontWeight: 700 }}>{m?.name}</div>
        {link ? <div style={{ fontSize: 13, color: C.blue, wordBreak: "break-all", userSelect: "all" }}>{link}</div>
              : <div style={{ fontSize: 13, color: C.warn }}>Not built yet — post without a link, or use "Message me" CTA in the copy.</div>}
      </div>
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: F.body, fontSize: 14, lineHeight: 1.55, margin: 0, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>{body}</pre>
      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{footer}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <CopyBtn text={full} label="Copy full post" />
        <CopyBtn text={body} label="Copy text only" />
        {link && <CopyBtn text={link} label="Copy link" />}
        <CopyBtn text={footer} label="Copy footer" />
        {card.flyer && <a href={card.flyer} download={`${card.ref}.png`} style={{ ...ghost, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Download flyer</a>}
      </div>
    </div>
  );
}

// ---------------- Views
function Today() {
  const [offset, setOffset] = useState(0);
  const date = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + offset); return d; }, [offset]);
  const plan = planFor(date);
  const key = `sm_done_${dateKey(date)}`;
  const [done, setDone] = useState(() => store.get(key) || {});
  const toggle = (id) => { const n = { ...done, [id]: !done[id] }; setDone(n); store.set(key, n); };
  React.useEffect(() => { setDone(store.get(key) || {}); }, [key]);
  const v = plan.video.video;
  const count = ["am", "pm", "video"].filter((k) => done[k]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button style={ghost} onClick={() => setOffset(offset - 1)} aria-label="Previous day">‹</button>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20 }}>{date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
        <button style={ghost} onClick={() => setOffset(offset + 1)} aria-label="Next day">›</button>
        {offset !== 0 && <button style={ghost} onClick={() => setOffset(0)}>Today</button>}
        <span style={{ marginLeft: "auto" }}><Tag tone={count === 3 ? "good" : "neutral"}>{count}/3 done</Tag></span>
      </div>

      {plan.slots.map((s) => (
        <section key={s.slot.id} style={panel}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 18 }}>{s.slot.time}</div>
            <span style={{ fontSize: 13, color: C.muted }}>{s.slot.mtn}</span>
            <Tag>{s.style}</Tag>
            <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, cursor: "pointer" }}>
              <input type="checkbox" checked={!!done[s.slot.id]} onChange={() => toggle(s.slot.id)} style={{ width: 20, height: 20 }} /> Posted
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 18, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Flyer card={s.card} />
              <div style={{ fontSize: 13, color: C.muted }}><b style={{ color: C.ink }}>Post to:</b> {CHANNELS[s.audience].join(" · ")}</div>
            </div>
            <PostKit card={s.card} copyKind={s.copy} />
          </div>
        </section>
      ))}

      <section style={{ ...panel, borderColor: C.sky }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 18 }}>Daily video</div>
          <Tag>Skool · {plan.video.skool}</Tag><Tag>REF {plan.video.ref}</Tag>
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, cursor: "pointer" }}>
            <input type="checkbox" checked={!!done.video} onChange={() => toggle("video")} style={{ width: 20, height: 20 }} /> Filmed
          </label>
        </div>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{v.title}</div>
        <div style={{ fontStyle: "italic", marginBottom: 10 }}>Hook: “{v.hook}”</div>
        <ol style={{ margin: "0 0 10px 18px", padding: 0, lineHeight: 1.6 }}>{v.points.map((p) => <li key={p}>{p}</li>)}</ol>
        <div><b>Close:</b> {v.cta}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>Post to Skool as a lesson; cut a short version for Reels / FB.</div>
      </section>
    </div>
  );
}

function Flyers({ open }) {
  const [aud, setAud] = useState("all"); const [lic, setLic] = useState("all");
  const list = CARDS.filter((c) => (aud === "all" || c.audience === aud) && (lic === "all" || c.license === lic));
  const Pill = ({ v, cur, set, children }) => <button onClick={() => set(v)} style={cur === v ? btn(C.navy) : ghost}>{children}</button>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Pill v="all" cur={aud} set={setAud}>All</Pill><Pill v="investor" cur={aud} set={setAud}>Investor</Pill><Pill v="consumer" cur={aud} set={setAud}>Consumer</Pill>
        <span style={{ width: 12 }} />
        <Pill v="all" cur={lic} set={setLic}>Any license</Pill><Pill v="none" cur={lic} set={setLic}>No license (FL OK)</Pill><Pill v="required" cur={lic} set={setLic}>CO only</Pill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: 16 }}>
        {list.map((c) => (
          <button key={c.ref} onClick={() => open(c.ref)} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, font: "inherit", color: C.ink }}>
            <Flyer card={c} />
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.ref} · {c.name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{audTag(c)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PainPoints({ open }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {PAIN_POINTS.map((p) => {
        const cards = CARDS.filter((c) => c.painPoints.includes(p.id));
        return (
          <section key={p.id} style={panel}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{p.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cards.map((c) => <button key={c.ref} onClick={() => open(c.ref)} style={ghost}>{c.ref} · {c.name}</button>)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Library({ selected, setSelected }) {
  const card = CARDS.find((c) => c.ref === selected) || CARDS[0];
  const [kind, setKind] = useState("short");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <select value={card.ref} onChange={(e) => setSelected(e.target.value)} style={{ font: "inherit", padding: 10, borderRadius: 8, border: `1px solid ${C.line}`, maxWidth: 520 }} aria-label="Choose a program">
        {CARDS.map((c) => <option key={c.ref} value={c.ref}>{c.ref} · {c.name}</option>)}
      </select>
      <section style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Flyer card={card} />
            <div style={{ fontSize: 13 }}><b>Highlights:</b> {card.highlights.join(" · ")}</div>
            <div style={{ fontSize: 13, background: C.warnBg, borderRadius: 8, padding: 10 }}>
              <b>Internal only</b> · Lender: {card.lender}{card.notes ? ` · ${card.notes}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setKind("short")} style={kind === "short" ? btn(C.navy) : ghost}>Short (groups)</button>
              <button onClick={() => setKind("long")} style={kind === "long" ? btn(C.navy) : ghost}>Long (page)</button>
            </div>
            <PostKit card={card} copyKind={kind} />
          </div>
        </div>
      </section>
    </div>
  );
}

const panel = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 };
const TABS = [["today", "Today"], ["flyers", "Flyers"], ["pain", "By Pain Point"], ["library", "Flyer + Copy"]];

export default function SmartMoney() {
  const [tab, setTab] = useState("today");
  const [sel, setSel] = useState(CARDS[0].ref);
  const open = (ref) => { setSel(ref); setTab("library"); };
  return (
    <div style={{ fontFamily: F.body, color: C.ink, background: C.bg, minHeight: "100%" }}>
      <header style={{ background: C.navy, color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 16px 0" }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, letterSpacing: "0.16em", color: C.sky, textTransform: "uppercase" }}>Graham Financial · Smart Money Posting</div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 24, marginTop: 6 }}>{BRAND.motto}</div>
          <div style={{ fontSize: 13, color: "#B9C8D8", marginTop: 2 }}>{BRAND.tag}</div>
          <nav style={{ display: "flex", gap: 4, marginTop: 16, overflowX: "auto" }}>
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ font: "inherit", fontFamily: F.display, fontWeight: 700, fontSize: 14, padding: "12px 14px", border: 0, cursor: "pointer", borderRadius: "10px 10px 0 0", background: tab === id ? C.bg : "transparent", color: tab === id ? C.ink : "#C9D6E3", whiteSpace: "nowrap" }}>{label}</button>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 48px" }}>
        {tab === "today" && <Today />}
        {tab === "flyers" && <Flyers open={open} />}
        {tab === "pain" && <PainPoints open={open} />}
        {tab === "library" && <Library selected={sel} setSelected={setSel} />}
      </main>
    </div>
  );
}
