// PropStream full-detail import ("propstream-detail-v1" JSON, pulled from the PropStream tab by Claude).
// Each record = { list: saved-list row (skip-traced phones/emails), detail: trimmed property detail (loans, owner, mailing, MLS) }.
// The whole record is kept in investor_leads.ps_detail; the fields the app uses are promoted to regular columns.

// PropStream sends dates as epoch ms. Format as a LOCAL calendar date (never toISOString: it flips to UTC).
export const psDate = (ms) => { if (ms == null || ms === "") return null; const d = new Date(Number(ms)); if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

const num = (v) => (v == null || v === "" || !isFinite(Number(v)) ? null : Number(v));

// Open loans, newest first. activeLoans is PropStream's list of open liens; fall back to recorded mortgages.
export function openLoans(detail) {
  const d = detail || {};
  const src = (d.activeLoans && d.activeLoans.length) ? d.activeLoans.map((a) => ({
    lender:a.lenderName, amount:num(a.amount), rate:num(a.loanInterestRate), recorded:psDate(a.loanRecordingDate || a.recordingDate),
    due:psDate(a.loanDueDate), termMonths:num(a.loanTerm), balance:num(a.estimatedLoanBalance), payment:num(a.estimatedLoanPayment),
    loanType:a.loanType, financing:a.financingType, detail:a.loanDetail,
  })) : (d.mortgages || []).map((m) => ({
    lender:m.lenderName, amount:num(m.amount), rate:num(m.interestRate), recorded:psDate(m.recordingDate), due:psDate(m.maturityDate),
    termMonths:m.termType && /mon/i.test(m.termType) ? num(m.term) : null, balance:null, payment:null,
    loanType:m.loanType, financing:m.financingType || m.adjustableRateType, detail:m.riders, position:m.position,
  }));
  return src.sort((a, b) => String(b.recorded || "").localeCompare(String(a.recorded || "")));
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
    est_value: num(d.estimatedValue), est_equity: num(d.estimatedEquity), loan_balance: bal,
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
  if (/FAIL|EXPIRED|WITHDRAWN|CANCEL/.test(d.mlsListingStatus || "")) s += 10;   // listing didn't sell: rent it / refi out
  return s;
}
