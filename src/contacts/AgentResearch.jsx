// Agent research: one-tap searches (license, production, company change) + an automatic email-vs-brokerage check.
// Colorado or Florida license lookup is picked from the agent's state, or their area code when the state is blank.

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", amber:"#b05e0d", amberBg:"#fdf0e0" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif" };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 12px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer", textDecoration:"none", display:"inline-block" };

// Email domain → brokerage brand (domain fragment, name test on the company field, display name).
const BROKERAGES = [
  ["kw.com", /keller|\bkw\b/i, "Keller Williams"], ["kwrealty", /keller|\bkw\b/i, "Keller Williams"],
  ["exprealty", /\bexp\b/i, "eXp Realty"], ["compass.com", /compass/i, "Compass"],
  ["coldwellbanker", /coldwell/i, "Coldwell Banker"], ["cbrealty", /coldwell/i, "Coldwell Banker"], ["cbhomes", /coldwell/i, "Coldwell Banker"],
  ["remax", /re\s*\/?\s*max/i, "RE/MAX"], ["century21", /century\s*21|c21/i, "Century 21"], ["c21", /century\s*21|c21/i, "Century 21"],
  ["bhhs", /berkshire|bhhs/i, "Berkshire Hathaway"], ["sothebys", /sotheby/i, "Sotheby's"], ["premiersir", /sotheby|premier/i, "Premier Sotheby's"],
  ["livsothebys", /sotheby|\bliv\b/i, "LIV Sotheby's"], ["redfin", /redfin/i, "Redfin"], ["realtyonegroup", /realty one/i, "Realty ONE Group"],
  ["fathomrealty", /fathom/i, "Fathom"], ["lpt.com", /lpt/i, "LPT Realty"], ["lptrealty", /lpt/i, "LPT Realty"], ["homesmart", /homesmart/i, "HomeSmart"],
  ["corcoran", /corcoran/i, "Corcoran"], ["elliman", /elliman/i, "Douglas Elliman"], ["michaelsaunders", /saunders/i, "Michael Saunders"],
  ["kentwood", /kentwood/i, "Kentwood"], ["8z.com", /\b8z\b/i, "8z"], ["howardhanna", /hanna/i, "Howard Hanna"], ["epique", /epique/i, "Epique"],
];
const CO_AREA = ["303", "720", "719", "970", "983"];
const digits = (s) => String(s || "").replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");

export function agentState(c) {
  const st = String(c.state || c.property_state || "").trim().toUpperCase();
  if (st === "CO" || st === "COLORADO") return "CO";
  if (st === "FL" || st === "FLORIDA") return "FL";
  return CO_AREA.includes(digits(c.phone).slice(0, 3)) ? "CO" : "FL";
}

// Brokerage the email points to, and whether it disagrees with the company on file.
export function emailBrokerage(c) {
  for (const e of [c.email, c.email_2]) {
    const dom = String(e || "").toLowerCase().split("@")[1]; if (!dom) continue;
    const hit = BROKERAGES.find(([frag]) => dom.includes(frag)); if (hit) return { email:e, brand:hit[2], test:hit[1] };
  }
  return null;
}
export function emailMismatch(c) {
  if ((c.contact_type || "") !== "agent") return null;
  const b = emailBrokerage(c); if (!b || !c.company) return null;
  return b.test.test(c.company) ? null : b;
}

const g = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export default function AgentResearch({ c, compact }) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim(); if (!name) return null;
  const st = agentState(c), city = c.city || "", mm = emailMismatch(c);
  const license = st === "CO" ? "https://apps2.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx" : "https://www.myfloridalicense.com/wl11.asp?mode=0&SID=&brd=&typ=";
  const links = [
    [`${st} license`, license, "Current brokerage on record and license status. Search the name on the page."],
    ["Zillow", g(`"${name}" site:zillow.com/profile`), "Sales in the last 12 months, price range, brokerage"],
    ["Realtor.com", g(`"${name}" site:realtor.com/realestateagents`), "Listings and recent sales"],
    ["Google", g(`"${name}" realtor ${city} ${st === "CO" ? "Colorado" : "Florida"}`), "News, team pages, 'joins' announcements"],
    ...(c.email ? [["Email check", g(`"${c.email}"`), "Does this email still show up with them?"]] : []),
    ["LinkedIn", g(`"${name}" realtor site:linkedin.com/in`), "Job history: when they moved and where"],
  ];
  return (
    <div style={{ background:C.card, border:`1px solid ${C.rule}`, borderRadius:10, padding: compact ? "8px 10px" : "12px 14px", marginBottom:12 }}>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginRight:4 }}>Research</span>
        {links.map(([l, u, t]) => <a key={l} href={u} target="_blank" rel="noreferrer" title={t} style={btn}>{l}</a>)}
      </div>
      {mm && <div style={{ marginTop:8, background:C.amberBg, color:C.amber, fontFamily:F.mono, fontSize:11, padding:"6px 8px", borderRadius:5 }}>
        Check this agent: email {mm.email} looks like {mm.brand}, but the company on file is {c.company}. Old email or a company change.</div>}
    </div>
  );
}
