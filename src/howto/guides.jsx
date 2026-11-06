// All in-app how-to guides in one place (used on each screen + the Team tab "How-to guides" page).
export const GUIDES = {
  calls: { title: "How to use Calls", steps: [
        <>Your call block is <b>1-3 PM Eastern</b> every day; the bar at the top shows when it's live. Pick a <b>Daily target</b> (10 to 50).</>,
        <>Two lists: <b>Customers</b> (your clients first, then past LO files and leads) and <b>Agents</b>. Flip between them with the toggle; each shows calls made out of the total.</>,
        <><b>Birthdays are never missed:</b> they go to the top of the list on the day, on Friday for Saturday and Sunday birthdays, and as "missed" catch-ups on Monday if one slipped. They are added on top of your target.</>,
        <>Click a name, read the <b>Why now</b> box and the <b>Say this</b> talking point, hit <b>CALL</b>, then tap the outcome. Voicemail and No answer pop up a ready follow-up text and email.</>,
        <><b>Emails</b>: about 10 reconnect emails a day, 3 per person (check in and update info, free home value, book a call). Agents and clients you've closed with come first; past LO fundings come last. Edit the draft if you want, hit <b>Open in email</b>, send it, then <b>Mark sent</b>. <b>They replied</b> ends the emails and puts them on your call list.</>,
        <><b>Quick update</b> (bottom of the call screen): new phone or email (the old one is kept as a backup), correct their rate, refinanced elsewhere (new rate, date, loan type), sold the home (off the rate and equity lists), or do not contact (off every list).</>,
        <>Clicked the wrong outcome? <b>Undo</b> puts everything back exactly as it was (works all day). <b>Skip for today</b> sets someone aside; <b>Unskip</b> brings them back.</>,
      ] },
  radar: { title: "How to use Radar & Today's Calls", steps: [
        <><b>Every morning:</b> on the Radar tab, enter today's Conventional, FHA and VA rates and tap <b>Save today's rates</b>, then tap <b>Rebuild today's list</b> once so rate opportunities rank first.</>,
        <><b>Today's Calls</b> = 10 past clients (new calculator leads jump to the top) + 10 agents, each with the reason they're on the list (rate gap, birthday, loan anniversary, equity, closed deals together, follow-up due).</>,
        <>Use <b>Call / Text / Email</b> — the text and email are pre-written. Add a quick note or a follow-up date if you want.</>,
        <>Tap an outcome: <b>Talked</b> (follow up in 30 days), <b>Voicemail</b> (3), <b>No answer</b> (2), <b>Booked</b>, <b>Not interested</b> (180), <b>Wrong #</b>. It logs a dated note and sets the follow-up. Done names are crossed out; the list stays the same all day.</>,
        <><b>Rate & Equity Radar</b>: tap a tile — Conventional R&T, FHA Streamline, VA IRRRL, Equity, Watchlist — to see who qualifies. Tap a name to open the full contact.</>,
        <><b>Settings</b>: refi threshold (0.50% over market), home appreciation (4%/yr), equity line (est. LTV ≤ 70%), FHA/VA seasoning (7 months). "est." means the loan type or equity is estimated until real data is on file.</>,
  ] },
  contacts: { title: "How to use Contacts", steps: [
        <><b>Search</b> finds name, phone, email, company, address and linked people (search a co-borrower's name to find the borrower).</>,
        <>The <b>category</b> dropdown picks My Clients, Past LO Fundings, Agents, Leads, Referral Partners, Rolodex or Everyone. <b>Filters</b> opens rate, loan, funded year, agent, contact and <b>bucket</b> (your old Contactually buckets) filters; active filters show as tags you can click to remove. <b>Sort</b> defaults to Hottest first (your own clients ahead of past LO files).</>,
        <>Tap a contact to open it. Every field has <b>Edit</b> and <b>Copy</b>. Use the <b>Category</b> chips to move someone (Rolodex = never called or emailed).</>,
        <><b>Loans</b>: add or edit loans; "Make current" picks the one the Radar uses. Typing a real loan type marks it verified (drops the "est.").</>,
        <><b>Linked people</b>: link a co-borrower, spouse, their agent or who referred them — or add a new person right there.</>,
        <>Each row has a <b>Why now</b> pill (rate gap, birthday, anniversary, equity, inherited file, follow-up). Edit a contact's <b>Book</b> (My client / Past LO) and <b>Buckets</b> inside the contact.</>,
        <><b>Duplicates</b> (above the table) reviews look-alike records — merge, link, or mark "not the same".</>,
  ] },
  pullLeads: { title: "How to pull leads (PropStream)", steps: [
        <><b>Every search:</b> Residential (single family, duplex, 2-4 units), Owner Occupied = No. Save it as <b>Angle - County</b> (e.g., "Cash buyer - Sarasota") with weekly email alerts.</>,
        <><b>The angles:</b> Cash buyer (Lead Lists: Cash Buyers, last sale 12 months) · Stuck flipper (Flippers + MLS Failed) · Failed listing · Out of state (Absentee: Out of State, owns 3+) · Tired landlord · ARM (Mortgage: Adjustable Rate) · Pre-foreclosure. Plus Hard money due and Dead money.</>,
        <><b>Order:</b> Sarasota, then Manatee. Add Hillsborough and Pinellas once you see which angles work.</>,
        <><b>Into GUP:</b> select the properties, Save them to a list with the same name, skip trace the list, export the CSV, then Import it here. The file name sets the angle, so each call card opens with the right playbook.</>,
        <>PropStream allows one login at a time. Close it on your phone before Claude works in it.</>,
  ] },
  dupes: { title: "How to review duplicates", steps: [
        <>Each card shows two records that look like the same person (same name, email or phone), side by side. Tap a name to open that record first if you need to check.</>,
        <><b>Merge into one</b> combines both records and keeps everything: phones, emails, loans, notes, tags, call history and links. Extra phones or emails that don't fit go into the note. Do Not Contact carries over if either had it.</>,
        <>The side marked <b>MAIN</b> (most recent loan) supplies the first phone and email. To flip that, use "merge, but make the other one main." Every merge is logged and can be undone.</>,
        <><b>They're co-borrowers</b> links the two people instead of merging (spouses, co-borrowers on the same loan).</>,
        <><b>Not the same</b> hides that pair for good (e.g., two different people named Jose Perez).</>,
  ] },
};
