// Portfolio Snapshot (PORT-01): investors send the spreadsheet they already keep. No credit pull, no application.
// Contact info → upload (xlsx/xls/csv, read in the visitor's browser) or a sheet link → saved to calculator_leads
// (source "portfolio-snapshot", rows in answers) → the trigger drops the lead into Contacts + phone alert.
import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { BRAND, FOOTERS } from "../smart-money/data.js";
import BrandBar, { NoSpam } from "./BrandBar.jsx";
import CtaRow from "./CtaRow.jsx";

const C = { navy:"#0E1B2A", sky:"#4FB0EA", ink:"#0E1B2A", muted:"#51647A", line:"#DCE3EB", bg:"#F3F6F9", card:"#FFFFFF", blue:"#1F6FA8", good:"#2E8B3E", bad:"#C0392B" };
const F = { display:"'Montserrat', Arial, sans-serif", body:"'Public Sans', system-ui, sans-serif" };
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const MAX_ROWS = 80, MAX_COLS = 30;
// Optional template for investors who don't keep a sheet yet (downloads as CSV; opens in Excel or Google Sheets).
const TEMPLATE = [
  ["Address", "Est. Value", "Loan Balance", "Rate", "Monthly Payment (P&I)", "Monthly Rent", "Taxes (yr)", "Insurance (yr)", "HOA (mo)", "Loan Due / Maturity", "Lender", "Prepay Ends"],
  ["123 Example St, Sarasota FL", "450000", "210000", "3.25%", "1450", "2600", "5200", "3100", "0", "", "Example Bank", "2027-06-01"],
];
const downloadTemplate = () => {
  const csv = TEMPLATE.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
  a.download = "Rental-Portfolio-Template.csv"; document.body.appendChild(a); a.click(); a.remove();
};
const getRef = () => { try { return new URLSearchParams(location.search).get("ref") || "PORT-01"; } catch { return "PORT-01"; } };

const input = { font:"inherit", fontSize:16, color:C.ink, background:"#fff", border:`1px solid ${C.line}`, borderRadius:8, padding:"10px 12px", width:"100%", boxSizing:"border-box" };
const labelS = { display:"flex", flexDirection:"column", gap:6, fontWeight:600, fontSize:14 };
const panel = { background:C.card, border:`1px solid ${C.line}`, borderRadius:14, padding:22 };
const btnS = { fontFamily:F.display, fontWeight:700, fontSize:16, background:C.blue, color:"#fff", border:0, borderRadius:10, padding:"14px 20px", cursor:"pointer", minHeight:48 };

// Read the first sheet into a small grid of strings (the visitor's own file, parsed in their browser).
async function readSheet(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type:"array", cellDates:true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, blankrows:false, defval:"" });
  return grid.slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS).map((v) => String(v ?? "").trim().slice(0, 120)))
    .filter((r) => r.some((v) => v));
}

export default function PortfolioSnapshot() {
  const [f, setF] = useState({ first:"", last:"", email:"", phone:"", state:"", link:"", note:"", consent:false });
  const [rows, setRows] = useState(null); const [fileName, setFileName] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const onFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setErr("");
    if (file.size > 5e6) return setErr("That file is over 5 MB. Try saving just the property tab, or email it to me.");
    try { const g = await readSheet(file); if (!g.length) throw new Error("empty"); setRows(g); setFileName(file.name); }
    catch { setRows(null); setFileName(""); setErr("Couldn't read that file. Excel (.xlsx, .xls) or CSV work best, or paste a Google Sheets link below."); }
  };

  const submit = async (ev) => {
    ev.preventDefault(); setErr("");
    const phone = f.phone.replace(/\D/g, ""); const miss = [];
    if (!f.first.trim()) miss.push("first name");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) miss.push("a valid email");
    if (phone.length < 10) miss.push("a 10-digit phone number");
    if (!f.state) miss.push("the state your rentals are in");
    if (!rows && !f.link.trim() && !f.note.trim()) miss.push("your spreadsheet, a link to it, or a quick note on your properties");
    if (!f.consent) miss.push("your consent to be contacted");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    setBusy(true);
    const props = rows ? Math.max(0, rows.length - 1) : 0;
    const summary = `Portfolio Snapshot: ${rows ? `${fileName} (${props} rows)` : f.link.trim() ? "sheet link sent" : "note only"}${f.note.trim() ? ` · "${f.note.trim().slice(0, 140)}"` : ""}`;
    const { error } = await supabase.from("calculator_leads").insert({
      first_name:f.first.trim(), last_name:f.last.trim() || null, email:f.email.trim(), phone, property_state:f.state, consent:true,
      ref:getRef(), source:"portfolio-snapshot", page_url:location.href.slice(0, 500), user_agent:navigator.userAgent.slice(0, 300),
      answers:{ summary, file:fileName || null, rows:rows || null, link:f.link.trim() || null, note:f.note.trim() || null } });
    setBusy(false);
    if (error) return setErr("We couldn't send that just now. Check your connection and try again, or call " + BRAND.phone + ".");
    setDone(true);
  };

  return (
    <div style={{ fontFamily:F.body, color:C.ink, background:C.bg, minHeight:"100vh", fontSize:16, lineHeight:1.5 }}>
      <BrandBar/>
      <header style={{ background:C.navy, color:"#fff" }}>
        <div style={{ maxWidth:960, margin:"0 auto", padding:"40px 16px 44px", display:"flex", flexDirection:"column", gap:10 }}>
          <p style={{ margin:0, fontFamily:F.display, fontWeight:700, fontSize:13, letterSpacing:"0.16em", textTransform:"uppercase", color:C.sky }}>Free Portfolio Snapshot</p>
          <h1 style={{ margin:0, fontFamily:F.display, fontWeight:800, fontSize:"clamp(30px, 5vw, 46px)", lineHeight:1.08 }}>No credit pull. No application. Just your spreadsheet.</h1>
          <p style={{ margin:0, color:"#B9C8D8", fontSize:18, maxWidth:"62ch" }}>Send me the property list you already keep. I'll show you the equity you could put to work, where your cash flow could improve, and which loans are worth a second look. Same day or within 24 hours.</p>
        </div>
      </header>
      <main style={{ maxWidth:960, margin:"0 auto", padding:"32px 16px 48px" }}>
        {done ? (
          <div style={{ ...panel, display:"flex", flexDirection:"column", gap:14 }}>
            <h2 style={{ fontFamily:F.display, margin:0, fontSize:24 }}>Got it, {f.first.trim()}. Your snapshot is in the works.</h2>
            <p style={{ margin:0 }}>I'll review your properties and reach out with your snapshot, same day or within 24 hours. No credit pull, nothing to sign. If anything's unclear in the sheet, I'll text you a quick question.</p>
            <p style={{ margin:0, color:C.muted }}>Want to talk sooner?</p>
            <CtaRow/>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ ...panel, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap:16 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <h2 style={{ fontFamily:F.display, margin:0, fontSize:22 }}>Send your properties</h2>
              <p style={{ margin:"6px 0 0", color:C.muted }}>Whatever you track is fine: address, value, loan balance, rate, rent, payment. Messy is OK. I'll sort it out.</p>
            </div>
            <label style={labelS}>First name<input value={f.first} onChange={set("first")} autoComplete="given-name" style={input}/></label>
            <label style={labelS}>Last name<input value={f.last} onChange={set("last")} autoComplete="family-name" style={input}/></label>
            <label style={labelS}>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" style={input}/></label>
            <label style={labelS}>Phone<input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" style={input}/></label>
            <label style={labelS}>State your rentals are in
              <select value={f.state} onChange={set("state")} style={input}><option value="">Select…</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <div style={{ gridColumn:"1/-1", border:`2px dashed ${C.line}`, borderRadius:12, padding:18, background:"#FAFCFE" }}>
              <label style={{ ...labelS, cursor:"pointer" }}>Upload your spreadsheet <span style={{ fontWeight:400, color:C.muted, fontSize:13 }}>Excel or CSV</span>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} style={{ fontSize:15 }}/></label>
              <p style={{ margin:"8px 0 0", fontSize:14, color:C.muted }}>Don't keep one yet? <button type="button" onClick={downloadTemplate} style={{ background:"none", border:0, padding:0, color:C.blue, fontWeight:700, cursor:"pointer", textDecoration:"underline", font:"inherit" }}>Download my simple template</button>. Fill in what you know; blanks are fine.</p>
              {rows && <p style={{ margin:"10px 0 0", color:C.good, fontWeight:600 }}>Read {fileName}: {Math.max(0, rows.length - 1)} rows found.</p>}
              <label style={{ ...labelS, marginTop:14 }}>Or paste a Google Sheets / Dropbox link <span style={{ fontWeight:400, color:C.muted, fontSize:13 }}>Optional</span>
                <input value={f.link} onChange={set("link")} placeholder="https://" style={input}/></label>
              <label style={{ ...labelS, marginTop:14 }}>Anything I should know? <span style={{ fontWeight:400, color:C.muted, fontSize:13 }}>Optional: goals, a loan coming due, what you'd do with cash</span>
                <textarea value={f.note} onChange={set("note")} rows={3} style={{ ...input, resize:"vertical" }}/></label>
            </div>
            <label style={{ gridColumn:"1/-1", display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:C.muted }}>
              <input type="checkbox" checked={f.consent} onChange={set("consent")} style={{ marginTop:3, width:18, height:18 }}/>
              <span>I agree that Graham Financial, powered by Zero Point Mortgage Services, may contact me by phone, text or email at the information above, including by automated means. Consent is not a condition of any loan. Message and data rates may apply.<NoSpam/></span>
            </label>
            {err && <p style={{ gridColumn:"1/-1", color:C.bad, margin:0 }}>{err}</p>}
            <button type="submit" disabled={busy} style={{ ...btnS, gridColumn:"1/-1" }}>{busy ? "Sending…" : "Send for my free snapshot"}</button>
            <p style={{ gridColumn:"1/-1", margin:0, fontSize:13, color:C.muted }}>Your file is only used to prepare your snapshot. No credit is pulled.</p>
          </form>
        )}
      </main>
      <footer style={{ maxWidth:960, margin:"0 auto", padding:"0 16px 40px" }}>
        <p style={{ fontSize:12, color:C.muted, textAlign:"center", maxWidth:"90ch", margin:"0 auto" }}>Snapshots are estimates for investment (business-purpose) properties based on the information you provide. Not an offer to lend or a commitment. {FOOTERS.business || FOOTERS.consumer}</p>
      </footer>
    </div>
  );
}
