// PropStream full-detail import ("propstream-detail-v1" JSON, pulled from the PropStream tab by Claude).
// Each record = { list: saved-list row (skip-traced phones/emails), detail: trimmed property detail (loans, owner, mailing, MLS) }.
// The whole record is kept in investor_leads.ps_detail; the fields the app uses are promoted to regular columns.

// PropStream sends dates as epoch ms. Format as a LOCAL calendar date (never toISOString: it flips to UTC).
export const psDate = (ms) => { if (ms == null || ms === "") return null; const d = new Date(/^\d+$/.test(String(ms)) ? Number(ms) : String(ms).slice(0, 10) + "T12:00:00"); if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

const num = (v) => (v == null || v === "" || !isFinite(Number(v)) ? null : Number(v));

// Open loans, newest first. activeLoans is PropStream's list of open liens. When it's empty, fall back to the
// recorded mortgages, but only the current one (the newest first lien since the last sale) plus any later juniors:
// older recorded mortgages were paid off by refinances and must not show as open.
const mortToLoan = (m) => ({ lender:m.lenderName, amount:num(m.amount), rate:num(m.interestRate), recorded:psDate(m.recordingDate), due:psDate(m.maturityDate),
  termMonths:/mon/i.test(m.termType || "") ? num(m.term) : /year/i.test(m.termType || "") ? num(m.term) * 12 : null, balance:null, payment:null,
  loanType:m.loanType, financing:m.financingType || m.adjustableRateType, detail:m.riders, position:m.position });
export function loanHistory(detail) {
  return (detail?.mortgages || []).map(mortToLoan).filter((l) => l.recorded).sort((a, b) => a.recorded.localeCompare(b.recorded));
}
export function openLoans(detail) {
  const d = detail || {};
  if (d.activeLoans && d.activeLoans.length) return d.activeLoans.map((a) => ({
    lender:a.lenderName, amount:num(a.amount), rate:num(a.loanInterestRate), recorded:psDate(a.loanRecordingDate || a.recordingDate),
    due:psDate(a.loanDueDate), termMonths:num(a.loanTerm), balance:num(a.estimatedLoanBalance), payment:num(a.estimatedLoanPayment),
    loanType:a.loanType, financing:a.financingType, detail:a.loanDetail,
  })).sort((a, b) => String(b.recorded || "").localeCompare(String(a.recorded || "")));
  if (!(num(d.openLienAmount) > 0)) return [];
  const sale = psDate(d.lastSaleDate) || "0000";
  const hist = loanHistory(d).filter((l) => l.recorded >= sale).reverse();
  const first = hist.find((l) => !/2nd|3rd|second/i.test(l.position || "")) || hist[0];
  if (!first) return [];
  return [first, ...hist.filter((l) => l !== first && l.recorded > first.recorded)];
}

// Equity: PropStream reports equity = value when it has no current balance (it treats the loan as paid off).
export function equityOf(d) {
  const v = num(d?.estimatedValue), e = num(d?.estimatedEquity), lien = num(d?.openLienAmount);
  if (v != null && lien > 0 && (e == null || e === v)) return v - lien;
  return e;
}

// MLS listing: rental listings (a unit for rent) mean the owner is holding the property; only SALE listings mean selling.
export function listingOf(d) {
  const m = d?.mlsListing || {};
  const status = String(d?.mlsListingStatus || m.status || "").toUpperCase(); if (!status) return null;
  const rental = m.rental === true || m.rental === "true";
  return { status, rental, amount:num(m.amount ?? d.mlsListingAmount), date:psDate(d.mlsListingDate || m.listingDate),
    agent:{ name:(m.agentName || d.mlsAgentName || "").trim() || null, phone:m.agentPhone || d.mlsAgentPhone || null, email:(m.agentEmail || d.mlsAgentEmail || "").trim().toLowerCase() || null, office:m.officeName || d.mlsOfficeName || null } };
}
const SELLING = /^(ACTIVE|PENDING|ACTIVE UNDER CONTRACT|UNDER CONTRACT|CONTINGENT)$/;
const FAILED = /^(FAIL|EXPIRED|WITHDRAWN|CANCELLED|CANCELED)$/;
export const statusWord = (l) => (FAILED.test(l.status) ? (l.rental ? "expired" : "didn't sell") : l.status === "SOLD" ? (l.rental ? "rented" : "sold") : l.status.toLowerCase());
export const isSaleListed = (d) => { const l = listingOf(d); return !!l && !l.rental && SELLING.test(l.status); };
export const isFailedSale = (d) => { const l = listingOf(d); return !!l && !l.rental && FAILED.test(l.status); };
export const isRentalListing = (d) => !!listingOf(d)?.rental;

// "What happened": the property's story from the record, why it's a lead, and what to watch.
const $k = (n) => (n == null ? "?" : "$" + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M" : Math.round(n / 1000) + "K"));
const mo = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month:"short", year:"numeric" }) : "");
const day = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "");
const monthsUntil = (d) => { if (!d) return null; const a = new Date(), b = new Date(d + "T12:00:00"); return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); };
const short = (l) => l.termMonths != null ? l.termMonths <= 36 : !!(l.due && l.recorded && (new Date(l.due) - new Date(l.recorded)) / 864e5 < 1100);
const pct = (r) => (r == null ? "" : ` at ${(r * 100).toFixed(2).replace(/\.?0+$/, "")}%`);
export function leadStory(detail) {
  const d = detail || {}; if (!d.estimatedValue && !(d.mortgages || []).length) return null;
  const units = num(d.residentialUnits) || 1, value = num(d.estimatedValue), eq = equityOf(d), loans = openLoans(d), cur = loans[0];
  const lien = loans.reduce((t, l) => t + (l.balance ?? l.amount ?? 0), 0) || num(d.openLienAmount) || 0;
  const ltv = value ? Math.round((lien / value) * 100) : null;
  const sale = psDate(d.lastSaleDate), list = listingOf(d);
  const since = loanHistory(d).filter((l) => !sale || l.recorded >= sale);
  const bridges = since.filter(short);
  const facts = [];
  facts.push(`${units > 1 ? `${units}-unit` : (d.landUse || "Single family").replace(/ \(.*\)/, "")}${d.yearBuilt ? `, built ${d.yearBuilt}` : ""}${d.propertiesOwned > 1 ? `. Owner has ${d.propertiesOwned} properties` : ""}.`);
  if (sale) facts.push(`Bought ${mo(sale)}${d.lastSaleAmount ? ` for ${$k(num(d.lastSaleAmount))}` : ""}.`);
  for (const l of since) facts.push(`${mo(l.recorded)}: ${$k(l.amount)} ${short(l) ? `${l.termMonths ? l.termMonths + "-month " : "short-term "}loan` : `${l.termMonths ? Math.round(l.termMonths / 12) + "-year " : ""}loan`} from ${l.lender || "unknown lender"}${pct(l.rate)}${l.due ? `, due ${day(l.due)}` : ""}.`);
  const mu = cur?.due ? monthsUntil(cur.due) : null;
  const pastDue = cur?.due && new Date(cur.due + "T23:59:59") < new Date();
  if (cur?.due) facts.push(`Current loan ${pastDue ? `was due ${day(cur.due)}: past due` : mu === 0 ? `is due ${day(cur.due)}: this month` : `is due ${day(cur.due)}: ${mu} month${mu === 1 ? "" : "s"} out`}.`);
  if (value) facts.push(`Est. value ${$k(value)} vs. about ${$k(lien)} owed: ${ltv}% LTV, about ${$k(eq)} equity.`);
  if (list) facts.push(list.rental ? `A unit was listed for rent at $${Math.round(list.amount || 0).toLocaleString()}/mo (${statusWord(list)}): they're renting it out.`
    : `Listed for sale at ${$k(list.amount)} (${statusWord(list)}).`);
  if (/PRE_FORECLOSURE|AUCTION/.test(d.foreclosureStatus || "")) facts.push(`In ${String(d.foreclosureStatus).replace("_", "-").toLowerCase()}.`);
  const dueSoon = cur && short(cur) && mu != null && mu <= 6;
  const holding = list?.rental || isFailedSale(d) || !list;
  const why = isSaleListed(d) ? "Listed for sale: likely paying off at closing. Low priority."
    : dueSoon && holding ? `Short-term loan ${pastDue ? "past due" : "due within 6 months"} on a property they're ${list?.rental ? "renting out" : isFailedSale(d) ? "holding after a failed sale" : "holding"}: long-term rental refinance.`
    : isFailedSale(d) ? "Couldn't sell and still carrying the loan: rent it and refinance long term."
    : cur && short(cur) ? "On a short-term loan: refinance into long-term financing before it comes due."
    : list?.rental ? "Holding it as a rental: cash-out or rate/term refinance conversation."
    : "Investor-owned: portfolio review conversation.";
  const watch = [];
  if (units > 8) watch.push(`${units} units: needs a commercial multifamily lender (above 1-4 and 5-8 unit programs).`);
  else if (units >= 5) watch.push(`${units} units: 5-8 unit program.`);
  if (ltv != null && ltv > 80) watch.push(`${ltv}% LTV: above most refinance limits; may need a higher appraisal or a paydown.`);
  else if (ltv != null && ltv > 75) watch.push(`${ltv}% LTV: tight for cash-out; rate/term likely.`);
  if (eq != null && eq < 0) watch.push("Owes more than the estimated value.");
  if (bridges.length >= 2) watch.push(`Re-bridged ${bridges.length} times since buying: they've had trouble getting out.`);
  if (loans.some(isArm)) watch.push("ARM on the current loan.");
  if (cur?.due && mu > 36) watch.push("Current loan isn't due for 3+ years: may already be long-term.");
  if (num(d.estimatedEquity) === value && num(d.openLienAmount) > 0) watch.push("PropStream had no current balance; equity here uses the original loan amount.");
  return { facts, why, watch, ltv, equity:eq, units, list };
}

export const isArm = (loan) => /adjust|arm|variable/i.test(`${loan?.financing || ""} ${loan?.loanType || ""}`);

// Phones in PropStream's skip-trace order (best score first), DNC numbers left out.
export function cleanPhones(list) {
  const all = [...(list?.mobilePhone || []), ...(list?.landlinePhone || []), ...(list?.otherPhone || [])]
    .filter((p) => p && p.number && !p.publicDnc && !p.dnc).sort((a, b) => (b.score || 0) - (a.score || 0));
  const fmt = (n) => { const d = String(n).replace(/\D/g, "").replace(/^1(\d{10})$/, "$1"); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : n; };
  return [...new Set(all.map((p) => fmt(p.number)))];
}

// Turn one record into the investor_leads columns it fills.
export function leadFieldsFromDetail(rec) {
  const d = rec.detail || {}, list = rec.list || {}, a = d.address || {}, m = d.mailAddress || {};
  const loans = openLoans(d), main = loans[0] || {};
  const phones = cleanPhones(list);
  const corp = d.owner1Corporate === true || /CORPORATE|TRUST/.test(d.ownerType || "");
  const bal = loans.reduce((s, l) => s + (l.balance || 0), 0) || num(d.openLienAmount);
  return {
    ps_property_id: num(d.id) || num(list.propertyId),
    first_name: corp ? null : (list.owner1FirstName || null), last_name: corp ? null : (list.owner1LastName || null),
    company: corp ? (d.owner1FullName || list.owner1LastName || null) : null,
    phone: phones[0] || null, phone_2: phones[1] || null, email: (list.emails || [])[0]?.toLowerCase() || null,
    mailing_address: m.streetAddress || list.mailStreetAddress || null, mailing_city: m.cityName || list.mailCityName || null,
    mailing_state: m.stateCode || list.mailStateCode || null, mailing_zip: m.zip || list.mailZip || null,
    property_address: a.streetAddress || list.streetAddress || null, property_city: a.cityName || list.cityName || null,
    property_state: a.stateCode || list.stateCode || null, property_zip: a.zip || list.zip || null, county: a.countyName || list.countyName || null,
    property_type: d.landUse || list.landUse || null, units: num(d.residentialUnits), properties_owned: num(d.propertiesOwned),
    est_value: num(d.estimatedValue), est_equity: equityOf(d), loan_balance: bal,
    lender: main.lender || null, loan_amount: main.amount, recording_date: main.recorded || null, est_maturity: main.due || null,
    ps_detail: { pulled: rec.pulled || null, list, detail: d },
  };
}

// Extra score points from the full record (added on top of scoreLead's base).
export function detailScore(ps) {
  const d = ps?.detail; if (!d) return 0;
  const loans = openLoans(d); let s = 0;
  if (loans.some(isArm)) s += 15;                                   // ARM: refi-into-fixed conversation
  if (loans.length >= 2) s += 5;                                    // second lien: consolidation
  if (/PRE_FORECLOSURE|AUCTION/.test(d.foreclosureStatus || "")) s += 20;
  if (isFailedSale(d)) s += 10;   // listing didn't sell: rent it / refi out
  if (isRentalListing(d)) s += 10;   // renting units out: holding long term
  return s;
}
