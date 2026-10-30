// All in-app how-to guides in one place (used on each screen + the Team tab "How-to guides" page).
export const GUIDES = {
  radar: { title: "How to use Radar & Today's Calls", steps: [
        <><b>Every morning:</b> on the Radar tab, enter today's Conventional, FHA and VA rates and tap <b>Save today's rates</b>, then tap <b>Rebuild today's list</b> once so rate opportunities rank first.</>,
        <><b>Today's Calls</b> = 10 past clients + 10 agents, each with the reason they're on the list (rate gap, birthday, loan anniversary, equity, closed deals together, follow-up due).</>,
        <>Use <b>Call / Text / Email</b> — the text and email are pre-written. Add a quick note or a follow-up date if you want.</>,
        <>Tap an outcome: <b>Talked</b> (follow up in 30 days), <b>Voicemail</b> (3), <b>No answer</b> (2), <b>Booked</b>, <b>Not interested</b> (180), <b>Wrong #</b>. It logs a dated note and sets the follow-up. Done cards get a ✓; the list stays the same all day.</>,
        <><b>Rate & Equity Radar</b>: tap a tile — Conventional R&T, FHA Streamline, VA IRRRL, Equity, Watchlist — to see who qualifies. Tap a name to open the full contact.</>,
        <><b>Settings</b>: refi threshold (0.50% over market), home appreciation (4%/yr), equity line (est. LTV ≤ 70%), FHA/VA seasoning (7 months). "est." means the loan type or equity is estimated until real data is on file.</>,
  ] },
  contacts: { title: "How to use Contacts", steps: [
        <><b>Search</b> finds name, phone, email, company, address and linked people (search a co-borrower's name to find the borrower).</>,
        <><b>Tabs</b> split Past Clients, Agents, Leads, Referral Partners and Rolodex; the blue chips filter inside each tab (rate band, loan type, closed deals together, has phone…). Purple chips work everywhere: never contacted, 90+ days, follow-up due, needs review.</>,
        <>Tap a contact to open it. Every field has <b>Edit</b> and <b>Copy</b>. Use the <b>Category</b> chips to move someone (Rolodex = never called or emailed).</>,
        <><b>Loans</b>: add or edit loans; "Make current" picks the one the Radar uses. Typing a real loan type marks it verified (drops the "est.").</>,
        <><b>Linked people</b>: link a co-borrower, spouse, their agent or who referred them — or add a new person right there.</>,
        <><b>Possible duplicates</b> (top right) reviews look-alike records — merge, link, or mark "not the same".</>,
  ] },
  dupes: { title: "How to review duplicates", steps: [
        <>Each card shows two records that look like the same person (same name, email or phone), side by side. Tap a name to open that record first if you need to check.</>,
        <><b>← Keep left</b> or <b>Keep right →</b> merges them into the one you keep. The other's phone and email become Phone 2 / Email 2; loans, linked people, notes and call history all move over; the extra record is removed.</>,
        <><b>They're co-borrowers</b> links the two people instead of merging (spouses, co-borrowers on the same loan).</>,
        <><b>Not the same</b> hides that pair for good (e.g., two different people named Jose Perez).</>,
        <>Tip: start with Holly Romero — keep either side and you'll see one Holly with both phones and both loans.</>,
  ] },
};
