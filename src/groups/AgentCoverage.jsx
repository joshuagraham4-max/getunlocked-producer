// Coverage grid: every agent who replied, laid out by the areas they cover, so you can look down one column
// (e.g. Denver Metro) and see everyone who can take a lead there, with email and phone under each name.
// It rebuilds itself from agent_outreach.area (the daily run and the Replied tab keep that current), so there is
// nothing to maintain here. Fix an area in the Replied tab (or tell Claude) and the grid moves them.
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase.js";
import { agentRating, RATING_ORDER } from "./outreachScripts.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", greenBg:"#e8f4ee", amber:"#b05e0d", amberBg:"#fdf0e0" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };

// Region -> words that put an agent in that column. An agent can sit in several columns.
export const REGIONS = [
  { k:"denver", l:"Denver Metro", st:"CO", re:/denver|\bmetro\b|aurora|lakewood|arvada|westminster|thornton|centennial|littleton|englewood|cherry creek|greenwood|wheat ridge|broomfield|northglenn|commerce city|front range|five points|capitol hill|highlands\b(?! ranch)/i },
  { k:"south", l:"South Metro / Douglas", st:"CO", re:/castle rock|parker|highlands ranch|lone tree|douglas|castle pines|south metro|centennial|littleton|sedalia|larkspur/i },
  { k:"north", l:"Boulder / North Metro", st:"CO", re:/boulder|niwot|longmont|louisville|lafayette|erie\b|superior|broomfield|north metro|firestone|frederick|dacono/i },
  { k:"nco", l:"Northern Colorado", st:"CO", re:/fort collins|loveland|greeley|windsor|larimer|weld\b|northern colorado|berthoud|johnstown|timnath/i },
  { k:"foot", l:"Foothills / Evergreen", st:"CO", re:/evergreen|conifer|morrison|golden|foothills|idaho springs|clear creek|jefferson county|jeffco|indian hills|bailey|pine\b/i },
  { k:"east", l:"Eastern Plains", st:"CO", re:/kiowa|elbert|elizabeth|eastern|plains|byers|bennett|strasburg|watkins/i },
  { k:"springs", l:"Colorado Springs / Pueblo", st:"CO", re:/colorado springs|pueblo|monument|el paso|pikes peak|fountain|woodland park|manitou|falcon|peyton|teller/i },
  { k:"mtn", l:"Eagle / Summit / Vail", st:"CO", re:/\beagle\b|eagle count|summit count|summit\b|vail|breckenridge|frisco|dillon|avon|edwards|beaver creek|silverthorne|keystone|gypsum|minturn|leadville|lake county|high country/i },
  { k:"west", l:"Western Slope / Aspen", st:"CO", re:/aspen|pitkin|glenwood|garfield|grand junction|mesa county|western slope|steamboat|routt|telluride|durango|montrose|crested butte|gunnison|fruita|palisade|carbondale|basalt/i },
  { k:"sarasota", l:"Sarasota / Manatee", st:"FL", re:/sarasota|bradenton|manatee|lakewood ranch|venice|north port|osprey|siesta|longboat|parrish|palmetto|englewood.*fl/i },
  { k:"tampa", l:"Tampa Bay", st:"FL", re:/tampa|st\.? pete|saint pete|clearwater|pinellas|hillsborough|brandon|wesley chapel|pasco|riverview|lutz|largo|dunedin|apollo beach|ruskin/i },
  { k:"swfl", l:"Southwest Florida", st:"FL", re:/fort myers|ft\.? myers|naples|cape coral|charlotte|port charlotte|punta gorda|lee county|collier|bonita|estero|lehigh|marco island|sw florida|southwest florida/i },
  { k:"orlando", l:"Orlando / Central FL", st:"FL", re:/orlando|kissimmee|winter (park|garden|haven)|lakeland|polk|central florida|clermont|oviedo|sanford|lake mary|davenport/i },
];
const OTHER = { k:"other", l:"Other / not placed yet", st:"" };

const digits = (s) => String(s || "").replace(/\D/g, "");
const fmtPhone = (s) => { const d = digits(s).replace(/^1(\d{10})$/, "$1"); return d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}` : (s || ""); };

export function placeAgent(r) {
  const hay = [r.area, r.hook].filter(Boolean).join(" ");
  const hits = REGIONS.filter((g) => g.re.test(hay)).map((g) => g.k);
  if (hits.length) return hits;
  return ["other"];
}

export default function AgentCoverage({ rows, onContact }) {
  const [info, setInfo] = useState({}); const [st, setSt] = useState("ALL"); const [showEmpty, setShowEmpty] = useState(true);
  const replied = useMemo(() => rows.filter((r) => r.status === "replied")
    .sort((a, b) => RATING_ORDER[agentRating(a).grade] - RATING_ORDER[agentRating(b).grade] || (a.full_name || "").localeCompare(b.full_name || "")), [rows]);
  const ids = useMemo(() => replied.map((r) => r.contact_id).filter(Boolean).join(","), [replied]);
  useEffect(() => {
    const list = ids ? ids.split(",") : []; if (!list.length) { setInfo({}); return; }
    supabase.from("contacts").select("id,phone,phone_2,email,email_2").in("id", list).then(({ data }) => {
      const m = {}; (data || []).forEach((c) => { m[c.id] = c; }); setInfo(m);
    });
  }, [ids]);

  const contactOf = (r) => {
    const c = info[r.contact_id] || {};
    const pv = r.pref_value || "";
    const phone = c.phone || c.phone_2 || (/\d{7}/.test(pv.replace(/\D/g, "")) && !pv.includes("@") ? pv : "");
    const email = c.email || c.email_2 || (pv.includes("@") ? pv : "");
    return { phone, email };
  };
  // Placement goes by the area words only (the state field is ignored, since it defaults to FL for new rows).
  // The Other column catches areas the word list does not know.
  const cols = (st === "ALL" ? REGIONS : REGIONS.filter((g) => g.st === st)).concat([OTHER]);
  const mine = replied;
  const byCol = {}; cols.forEach((g) => { byCol[g.k] = []; });
  mine.forEach((r) => { const keys = placeAgent(r).filter((k) => byCol[k]); (keys.length ? keys : ["other"]).forEach((k) => byCol[k].push(r)); });
  const shown = cols.filter((g) => showEmpty || byCol[g.k].length);

  const Btn = ({ k, l }) => <button onClick={() => setSt(k)} style={{ fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"6px 14px", borderRadius:7, border:`1px solid ${st === k ? C.green : C.rule}`, background: st === k ? C.green : C.card, color: st === k ? "#fff" : C.mid, cursor:"pointer" }}>{l}</button>;

  return (
    <div>
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:10 }}>
        <Btn k="ALL" l="All areas"/><Btn k="CO" l="Colorado"/><Btn k="FL" l="Florida"/>
        <label style={{ fontFamily:F.mono, fontSize:11, color:C.mid, display:"flex", gap:6, alignItems:"center", marginLeft:8 }}>
          <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)}/> show empty areas (the gaps)
        </label>
        <span style={{ fontFamily:F.mono, fontSize:11, color:C.light }}>{mine.length} agents who replied · updates itself from their areas</span>
      </div>
      <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:10, alignItems:"flex-start" }}>
        {shown.map((g) => { const list = byCol[g.k]; return (
          <div key={g.k} style={{ minWidth:210, maxWidth:240, flex:"0 0 auto", background: list.length ? C.card : "#f3efe8", border:`1px solid ${list.length ? C.rule : "#ebe4d8"}`, borderTop:`3px solid ${list.length ? C.green : C.rule}`, borderRadius:8, padding:"10px 10px 8px" }}>
            <div style={{ fontFamily:F.cond, fontWeight:700, fontSize:16, color:C.ink, lineHeight:1.15 }}>{g.l}</div>
            <div style={{ fontFamily:F.mono, fontSize:10, color: list.length ? C.green : C.light, marginBottom:8 }}>{list.length ? `${list.length} AGENT${list.length > 1 ? "S" : ""}` : "NO COVERAGE YET"}</div>
            {list.map((r) => { const ct = contactOf(r); const gr = agentRating(r).grade; return (
              <div key={r.id} style={{ borderTop:`1px solid ${C.rule}`, padding:"7px 0" }}>
                <div style={{ fontFamily:F.body, fontWeight:600, fontSize:14, color:C.ink, cursor: onContact && r.contact_id ? "pointer" : "default" }}
                  onClick={async () => { if (onContact && r.contact_id) { const { data } = await supabase.from("contacts").select("*").eq("id", r.contact_id).single(); if (data) onContact(data); } }}>
                  {r.full_name}{gr && gr !== "?" ? <span style={{ fontFamily:F.mono, fontSize:9, color:"#fff", background:C.green, borderRadius:3, padding:"0 5px", marginLeft:6 }}>{gr}</span> : null}
                </div>
                <div style={{ fontFamily:F.mono, fontSize:10, color:C.mid }}>{r.brokerage || ""}</div>
                {ct.phone ? <a href={`tel:${digits(ct.phone)}`} style={{ display:"block", fontFamily:F.mono, fontSize:12, color:C.ink, textDecoration:"none", marginTop:2 }}>{fmtPhone(ct.phone)}</a> : null}
                {ct.email ? <a href={`mailto:${ct.email}`} style={{ display:"block", fontFamily:F.mono, fontSize:11, color:C.green, textDecoration:"none", wordBreak:"break-all" }}>{ct.email}</a> : null}
                {!ct.phone && !ct.email ? <div style={{ fontFamily:F.mono, fontSize:10, color:C.amber }}>no contact info yet</div> : null}
                {g.k === "other" ? <div style={{ fontFamily:F.mono, fontSize:10, color:C.light, marginTop:2 }}>{r.area ? `area: ${r.area}` : "area not given yet"}</div> : null}
              </div>); })}
          </div>); })}
      </div>
    </div>);
}
