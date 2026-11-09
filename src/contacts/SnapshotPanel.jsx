// Portfolio Snapshot (PORT-01) inside a contact: reads the spreadsheet the investor sent, maps the columns
// (fixable by hand), runs the DSCR math per property, flags opportunities, and prints a branded one-page snapshot.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase.js";

const C = { card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc", green:"#1e6e4a", amber:"#b05e0d", red:"#a33" };
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif" };
const box = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10, padding:"14px 16px", marginBottom:12 };
const lbl = { fontFamily:F.cond, fontWeight:700, fontSize:12, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginBottom:4 };
const btn = { fontFamily:F.cond, fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer" };
const inp = { fontFamily:F.mono, fontSize:12, padding:"3px 5px", border:`1px solid ${C.rule}`, borderRadius:4, background:"#fff" };

export const isSnapshotLead = (c) => (c.tags || []).includes("portfolio snapshot lead");

// Which column holds what. Order matters: first match wins, and a column is used once.
const FIELDS = [
  ["address", "Address", /address|street|addr/i],
  ["value", "Value", /value|arv|worth|market|zestimate|appraised|est\.?\s*val/i],
  ["balance", "Loan balance", /balance|owed|principal|loan\s*(amt|amount|bal)|mortgage\s*bal|debt/i],
  ["rate", "Rate", /rate|interest|apr/i],
  ["payment", "Payment", /payment|p\s*&\s*i|piti|pmt|mortgage\s*\$|monthly\s*mortgage/i],
  ["rent", "Rent", /rent|income|revenue|gross/i],
  ["taxes", "Taxes (yr)", /tax/i],
  ["insurance", "Insurance (yr)", /insur/i],
  ["hoa", "HOA (mo)", /hoa|assoc/i],
  ["due", "Due / maturity", /matur|due|balloon|term\s*end/i],
  ["lender", "Lender", /lender|bank|servicer|note\s*holder/i],
];
const num = (v) => { const s = String(v ?? "").replace(/[$,\s]/g, ""); if (!s) return null; const n = parseFloat(s.replace(/%$/, "")); return isFinite(n) ? n : null; };
const usd = (n) => (n == null ? "" : (n < 0 ? "-$" : "$") + Math.round(Math.abs(n)).toLocaleString());
const k$ = (n) => (n == null ? "" : "$" + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + "M" : Math.round(n / 1000) + "K"));

function headerIndex(rows) {   // first row with 3+ text cells that aren't numbers
  for (let i = 0; i < Math.min(rows.length, 8); i++) if (rows[i].filter((v) => v && num(v) == null).length >= 3) return i;
  return 0;
}
function guessMap(head) {
  const used = new Set(), m = {};
  for (const [k, , re] of FIELDS) { const i = head.findIndex((h, j) => !used.has(j) && re.test(h)); if (i >= 0) { m[k] = i; used.add(i); } }
  if (m.address == null) { const i = head.findIndex((h, j) => !used.has(j) && /property|location|name|unit/i.test(h)); if (i >= 0) m.address = i; }
  return m;
}

export function analyze(row, map, a) {
  const g = (k) => (map[k] == null ? null : row[map[k]]);
  const value = num(g("value")), balance = num(g("balance")) || 0, rent = num(g("rent"));
  let rate = num(g("rate")); if (rate != null && rate > 1) rate = rate / 100;
  const escrow = ((num(g("taxes")) || 0) + (num(g("insurance")) || 0)) / 12 + (num(g("hoa")) || 0);
  const payment = num(g("payment"));
  const housing = payment != null ? payment + (map.taxes != null || map.insurance != null ? escrow : 0) : null;
  const equity = value != null ? value - balance : null;
  const maxLoan = value != null ? value * a.ltv / 100 : null;
  const cashOut = maxLoan != null ? Math.max(0, maxLoan - balance) : null;
  const ioHousing = maxLoan != null ? maxLoan * a.rate / 100 / 12 + escrow : null;
  const dscr = rent && housing ? rent / housing : null;
  const newDscr = rent && ioHousing ? rent / ioHousing : null;
  const dueStr = g("due"); const dueD = dueStr ? new Date(dueStr) : null;
  const dueMonths = dueD && !isNaN(dueD) ? (dueD.getFullYear() - new Date().getFullYear()) * 12 + dueD.getMonth() - new Date().getMonth() : null;
  const flags = [];
  if (cashOut != null && cashOut >= 25000 && (newDscr == null || newDscr >= 1)) flags.push(["Cash-out ready", C.green]);
  if (equity != null && value && equity / value >= 0.4) flags.push(["Dead money", C.green]);
  if (dueMonths != null && dueMonths <= 12) flags.push([dueMonths < 0 ? "Past due" : `Due in ${dueMonths} mo`, C.red]);
  if (rate != null && rate >= a.rate / 100) flags.push(["Rate above market", C.amber]);
  if (dscr != null && dscr < 1) flags.push(["Ratio under 1.0", C.amber]);
  if (cashOut != null && cashOut >= 25000 && newDscr != null && newDscr < 1) flags.push(["Cash-out tight on cash flow", C.amber]);
  return { address:g("address") || "", lender:g("lender") || "", value, balance, rate, rent, payment, housing, equity, maxLoan, cashOut, dscr, newDscr, flags };
}

function printSnapshot(c, list, totals, a) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || "Investor";
  const rowsHtml = list.map((p) => `<tr><td>${p.address || "Property"}</td><td>${k$(p.value)}</td><td>${k$(p.balance)}</td><td><b>${k$(p.equity)}</b></td><td><b>${k$(p.cashOut)}</b></td><td>${p.dscr ? p.dscr.toFixed(2) : ""}</td><td>${p.flags.map((f) => f[0]).join(", ")}</td></tr>`).join("");
  const w = window.open("", "_blank"); if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Portfolio Snapshot · ${name}</title><style>
  body{font-family:Montserrat,Arial,sans-serif;color:#0E1B2A;margin:32px}h1{margin:0;font-size:26px}.sub{color:#51647A;margin:4px 0 20px}
  .tiles{display:flex;gap:12px;margin-bottom:20px}.t{flex:1;background:#0E1B2A;color:#fff;border-radius:10px;padding:12px 14px}.t b{display:block;font-size:22px;color:#D4A83F}
  table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #DCE3EB;padding:6px 5px;text-align:left}th{background:#F3F6F9}
  .foot{margin-top:22px;font-size:10px;color:#51647A}.cta{margin-top:16px;font-size:14px}</style></head><body>
  <h1>Portfolio Snapshot</h1><div class="sub">Prepared for ${name} · ${new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })} · No credit pulled</div>
  <div class="tiles"><div class="t">Total value<b>${k$(totals.value)}</b></div><div class="t">Total owed<b>${k$(totals.balance)}</b></div><div class="t">Equity<b>${k$(totals.equity)}</b></div><div class="t">Could put to work*<b>${k$(totals.cashOut)}</b></div></div>
  <table><thead><tr><th>Property</th><th>Value</th><th>Owed</th><th>Equity</th><th>Available*</th><th>Rent ratio</th><th>Notes</th></tr></thead><tbody>${rowsHtml}</tbody></table>
  <div class="cta"><b>Next step:</b> a 15-minute call to pick the best one or two moves. Call me: 720-468-6872 · Book me: calendar.app.google/nz1sdrnBGK1D4LXh7 · Apply here: approvedbyjoshua.com</div>
  <div class="foot">*Estimated at ${a.ltv}% of value, before closing costs, using the values and balances you provided. Rent ratio = rent ÷ payment. Investment (business-purpose) properties. Estimates only, not an offer to lend or a commitment; subject to appraisal, underwriting and lender approval.<br/>Joshua Graham · AVP / Regional Loan Originator · NMLS 169809 · Graham Financial powered by Zero Point Mortgage Services, NMLS 1216108</div>
  <script>setTimeout(()=>print(),300)</script></body></html>`);
  w.document.close();
}

export default function SnapshotPanel({ c }) {
  const [lead, setLead] = useState(undefined);
  const [map, setMap] = useState(null);
  const [a, setA] = useState({ ltv:75, rate:7.5 });
  useEffect(() => { let on = true; setLead(undefined);
    const ors = [c.email && `email.eq.${c.email}`, c.phone && `phone.eq.${String(c.phone).replace(/\D/g, "")}`].filter(Boolean).join(",");
    if (!ors) { setLead(null); return; }
    supabase.from("calculator_leads").select("id,answers,created_at").eq("source", "portfolio-snapshot").or(ors).order("created_at", { ascending:false }).limit(1)
      .then(({ data }) => { if (on) setLead(data?.[0] || null); });
    return () => { on = false; }; }, [c.id, c.email, c.phone]);
  const rows = lead?.answers?.rows || null;
  const hi = rows ? headerIndex(rows) : 0, head = rows ? rows[hi] : [];
  useEffect(() => { if (rows) setMap(guessMap(head)); }, [lead]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = useMemo(() => (rows && map ? rows.slice(hi + 1).map((r) => analyze(r, map, a)).filter((p) => p.address || p.value) : []), [rows, map, a, hi]);
  const totals = useMemo(() => list.reduce((t, p) => ({ value:t.value + (p.value || 0), balance:t.balance + (p.balance || 0), equity:t.equity + (p.equity || 0), cashOut:t.cashOut + (p.cashOut || 0) }), { value:0, balance:0, equity:0, cashOut:0 }), [list]);

  if (lead === undefined) return null;
  if (!lead) return <div style={box}><div style={lbl}>Portfolio Snapshot</div><div style={{fontFamily:F.mono, fontSize:12, color:C.light}}>No snapshot upload found for this contact's email or phone.</div></div>;
  const ans = lead.answers || {};
  return (
    <div style={{...box, borderColor:"#c9b98f"}}>
      <div style={lbl}>Portfolio Snapshot (sent {new Date(lead.created_at).toLocaleDateString()})</div>
      {ans.note && <div style={{fontSize:14, marginBottom:6}}><b>Their note:</b> {ans.note}</div>}
      {ans.link && <div style={{fontSize:14, marginBottom:6}}><b>Sheet link:</b> <a href={ans.link} target="_blank" rel="noreferrer">{ans.link}</a></div>}
      {!rows ? <div style={{fontFamily:F.mono, fontSize:12, color:C.mid}}>No file uploaded{ans.link ? ": open the link above" : ""}.</div> : <>
        <div style={{fontFamily:F.mono, fontSize:11, color:C.mid, margin:"6px 0"}}>File: {ans.file} · columns matched below (fix any that are wrong)</div>
        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:8}}>
          {FIELDS.map(([k, l]) => (
            <label key={k} style={{fontFamily:F.mono, fontSize:11, color:C.mid}}>{l}{" "}
              <select value={map?.[k] ?? ""} onChange={(e) => setMap({ ...map, [k]: e.target.value === "" ? undefined : Number(e.target.value) })} style={inp}>
                <option value="">none</option>{head.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}</select></label>))}
        </div>
        <div style={{display:"flex", gap:12, alignItems:"center", fontFamily:F.mono, fontSize:11, color:C.mid, marginBottom:8}}>
          <label>Cash-out LTV <input type="number" value={a.ltv} onChange={(e) => setA({ ...a, ltv:Number(e.target.value) || 0 })} style={{...inp, width:50}}/>%</label>
          <label>Market rate <input type="number" step="0.125" value={a.rate} onChange={(e) => setA({ ...a, rate:Number(e.target.value) || 0 })} style={{...inp, width:60}}/>%</label>
          <span>(interest-only payment used for the new ratio)</span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:8}}>
          {[["Value", totals.value], ["Owed", totals.balance], ["Equity", totals.equity], ["Could put to work", totals.cashOut]].map(([l, v]) =>
            <div key={l} style={{background:"#fff", border:`1px solid ${C.rule}`, borderRadius:7, padding:"6px 8px"}}><div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>{l}</div><div style={{fontFamily:F.cond, fontWeight:800, fontSize:20}}>{k$(v)}</div></div>)}
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
            <thead><tr>{["Property", "Value", "Owed", "Rate", "Rent", "Equity", "Available", "Ratio now", "Ratio IO", "Flags"].map((h) => <th key={h} style={{textAlign:"left", fontFamily:F.mono, fontSize:10, color:C.light, borderBottom:`1px solid ${C.rule}`, padding:"4px"}}>{h}</th>)}</tr></thead>
            <tbody>{list.map((p, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${C.rule}`}}>
                <td style={{padding:4}}>{p.address}</td><td>{k$(p.value)}</td><td>{k$(p.balance)}</td><td>{p.rate != null ? (p.rate * 100).toFixed(2) + "%" : ""}</td>
                <td>{usd(p.rent)}</td><td><b>{k$(p.equity)}</b></td><td><b>{k$(p.cashOut)}</b></td><td>{p.dscr ? p.dscr.toFixed(2) : ""}</td><td>{p.newDscr ? p.newDscr.toFixed(2) : ""}</td>
                <td>{p.flags.map(([f, col]) => <span key={f} style={{color:col, marginRight:6, whiteSpace:"nowrap"}}>{f}</span>)}</td>
              </tr>))}</tbody>
          </table>
        </div>
        <button onClick={() => printSnapshot(c, list, totals, a)} style={{...btn, marginTop:10, background:C.green, borderColor:C.green, color:"#fff"}}>Print / save snapshot (PDF)</button>
      </>}
    </div>
  );
}
