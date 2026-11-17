#!/usr/bin/env python3
"""Smooth. Precise. Elite. flyer generator (1080x1080).

Layout: bone ground, Bodoni serif headline (last line italic in the accent color),
hairline ledger, italic CTA line, name + credentials, ink logos, right-hand quarter panel.

Usage (from repo root):
    python3 tools/flyers/gen_elite.py                 # all cards -> public/smart-money/flyers/<REF>.png
    python3 tools/flyers/gen_elite.py BUY-01 AGT-02   # just these
    python3 tools/flyers/gen_elite.py --out /tmp/out  # different output folder

Setup (fonts are not in the repo):
    mkdir -p /tmp/fonts && cd /tmp/fonts
    npm pack @fontsource/montserrat @fontsource/bodoni-moda --silent
    mkdir -p bod && tar xzf fontsource-montserrat-*.tgz && tar xzf fontsource-bodoni-moda-*.tgz -C bod
    (Montserrat ends up in /tmp/fonts/package, Bodoni in /tmp/fonts/bod/package; override with FONT_DIR)

Add a card: copy one entry in CARDS, change the copy and the palette key. Fit rule: if anything
wraps badly, shorten the words; never shrink the template. Always look at the PNG before posting.
"""
import os, sys, subprocess, tempfile, json
from urllib.parse import quote

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BRAND = os.path.join(ROOT, "public", "brand")
FONT_DIR = os.environ.get("FONT_DIR", "/tmp/fonts")
MONT = FONT_DIR + "/package/files/montserrat-latin-{w}-normal.woff2"
BOD = FONT_DIR + "/bod/package/files/bodoni-moda-latin-{w}-{s}.woff2"

PALETTES = {
    # buyers / renters
    "scarlet": dict(bg="#EFEAE0", ink="#101820", accent="#A3141C", panel="#1E252C", panel_text="#EFEAE0", panel_mute="#B9BEC4", muted="#5A5F66"),
    # agents / partners
    "burgundy": dict(bg="#EFEAE0", ink="#101820", accent="#7A1E2C", panel="#3E1019", panel_text="#EFEAE0", panel_mute="#CDB0B5", muted="#5A5F66"),
    # Bond sample: light blue ground, navy ink and panel, red accent
    "navyred": dict(bg="#E4EDF5", ink="#0E1B2A", accent="#C8102E", panel="#0E1B2A", panel_text="#E4EDF5", panel_mute="#9DB4CC", muted="#4A5B70"),
    # Bond family: navy, maroon and teal themes, light grounds, red type on every one
    "sky":    dict(bg="#E4EDF5", ink="#0E1B2A", accent="#C8102E", panel="#0E1B2A", panel_text="#E4EDF5", panel_mute="#9DB4CC", muted="#4A5B70"),
    "maroon": dict(bg="#F1ECE6", ink="#1A1216", accent="#C8102E", panel="#4A111C", panel_text="#F6ECE9", panel_mute="#D9B3B9", muted="#5E5358"),
    "teal":   dict(bg="#E3EEF0", ink="#0B1C21", accent="#C8102E", panel="#0A3A42", panel_text="#E9F3F4", panel_mute="#9CC3C7", muted="#41585D"),
    "camel": dict(bg="#EFEAE0", ink="#101820", accent="#9A7440", panel="#15181C", panel_text="#EFEAE0", panel_mute="#CDB892", muted="#5A5F66"),
    "peacock": dict(bg="#EFEAE0", ink="#101820", accent="#0C5A63", panel="#0A363D", panel_text="#EFEAE0", panel_mute="#9DC0C0", muted="#5A5F66"),
}

FOOT_NUMBERS_SUFFIX = " Example only: payment and move-in figures are illustrative and vary by scenario; disclosure text to be supplied by ZPM compliance."
FOOT_CONSUMER = ("Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. "
    "Licensed in Colorado. Down payment assistance and seller concessions depend on program eligibility, lender and seller agreement and are not available to all borrowers. "
    "First payment timing varies by closing date. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.")
FOOT_NUMBERS = FOOT_CONSUMER + FOOT_NUMBERS_SUFFIX
FOOT_AGENT = ("Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. "
    "Licensed in Colorado. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.")

BOOKING = "https://calendar.app.google/nz1sdrnBGK1D4LXh7"
FOOT_PAY = FOOT_CONSUMER + (" Example: $400,000 purchase price, 3% down ($12,000), loan amount $388,000, 30-year fixed rate 7.125%, APR 7.308% (assumes $5,000 lender costs and $2,000 title costs). "
    "Principal and interest $2,614 per month; estimated taxes, homeowners insurance and mortgage insurance add about $640, for a total near $3,250. "
    "Roommate income is illustrative, is not guaranteed and may not count toward qualifying. Rent is an approximate Colorado one-bedroom average. Rates and APR are examples, not an offer, and change daily.")
FOOT_WEALTH = ("Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Licensed in Colorado. "
    "Source: FHFA All-Transactions House Price Index, fourth quarter to fourth quarter, 1976 to 2025, not adjusted for inflation. National figures; local markets vary and prices can fall. "
    "Past performance does not guarantee future results. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.")
FOOT_PAY2 = FOOT_CONSUMER + (" Example: $300,000 purchase price, 3% down ($9,000), loan amount $291,000, 30-year fixed rate 7.125%, APR 7.370% (assumes $5,000 lender costs and $2,000 title costs). "
    "Principal and interest $1,961 per month; estimated taxes, homeowners insurance and mortgage insurance add about $490, for a total near $2,450. Roommate income is illustrative, is not guaranteed and may not count toward qualifying. Rent is illustrative. Rates and APR are examples, not an offer, and change daily.")
FOOT_EQ = FOOT_CONSUMER.split(" Down payment assistance")[0] + (" Example only: home value, balance and equity are illustrative. Equity available depends on value, lien position, credit and program guidelines. "
    "Investment property financing is for business purposes only and is not available in all states. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.")
FOOT_WHY = FOOT_CONSUMER.split(" Down payment assistance")[0] + (" Source: Bankrate research, July 2026, based on 2025 mortgage data: about $65 billion a year in mortgage overpayments nationwide; about $3,300 is the national average per borrower per year. Your own savings will vary. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.")
QR = dict(kind="qr", label="SCAN TO BOOK<br>A CALL WITH ME")
CTA_BOOK = "Book a call with me. It's not a sales call."
STAT_30_45 = dict(kind="stat", top="30", bottom="45", label="DAYS TO YOUR<br>FIRST PAYMENT")
TAGLINE = dict(kind="tagline", words=["Smooth.", "Precise.", "Elite."], label="GRAHAM FINANCIAL")

SMART = "Contact me for smart money to finance real estate."
COMMON = dict(photo=dict(file="joshua-park-smile.jpg", h=500, size=720, x=-440, y=-40), photo_line="When it has<br>to go right,<br>I&#39;m your guy.",
              cta_px=26, cta_note="NOT A SALES CALL", panel_bottom=QR, kicker_sub=SMART)

CARDS = {
    "BUY-01": dict(palette="scarlet", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME",
        h1=["Two months", "and a deposit."], h1_accent="Or a lot less.",
        left=("RENTING", "Two months of rent plus a deposit, at move-in."),
        right=("BUYING", "Often far less, with help and seller credits."),
        cta="Know your real move-in number before you sign.", panel_bottom=STAT_30_45, foot=FOOT_CONSUMER),
    "BUY-02": dict(palette="scarlet", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME",
        h1=["Rent builds", "their equity."], h1_accent="Not yours.",
        left=("RENTING", "Two months plus a deposit up front, then a payment that builds your landlord's equity."),
        right=("BUYING", "Often far less up front. First payment 30 to 45 days out."),
        cta="Know your real move-in number first.", panel_bottom=STAT_30_45, foot=FOOT_CONSUMER, ledger_px=28),
    "AGT-02": dict(palette="peacock", kicker="REAL ESTATE AGENTS &nbsp;/&nbsp; REFERRAL PARTNERS",
        h1=["Clients who", "close without"], h1_accent="the drama.",
        left=("WHERE DEALS SLIP", "Late surprises and a buyer who goes quiet."),
        right=("WHAT CHANGES", "Clear numbers, steady updates, a calm closing."),
        cta="Let's talk about protecting your clients.", panel_bottom=TAGLINE, foot=FOOT_AGENT),
    "AGT-03": dict(palette="peacock", kicker="REAL ESTATE AGENTS &nbsp;/&nbsp; REFERRAL PARTNERS",
        h1=["A closing your", "client thanks"], h1_accent="you for.", h1_px=98,
        left=("THE USUAL", "Surprises, missing documents, a date that slips."),
        right=("THE ALTERNATIVE", "Numbers settled early. Steady updates to the keys."),
        ledger_px=31,
        cta="Let's make your next closing the easy one.", panel_bottom=TAGLINE, foot=FOOT_AGENT,
        photo=dict(file="joshua-park-smile.jpg", h=640, size=800, x=-494, y=-84)),
    "BUY-03": dict(palette="scarlet", side="left", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME",
        h1=["Rent is a bill.", "A mortgage is"], h1_accent="a plan.", h1_px=92,
        left=("THE LEASE", "A place you pay for and never own."),
        right=("THE MORTGAGE", "A payment that builds your equity."),
        cta="See what your move would really take.", panel_bottom=STAT_30_45, foot=FOOT_CONSUMER),
    "NUM-01": dict(palette="burgundy", kicker="THINKING ABOUT BUYING IN COLORADO",
        h1=["Look at"], h1_accent="these numbers.", h1_px=112,
        figures=[dict(label="RENTING", px=76, big="$2,000", small="a month, plus two months and a deposit to move in."),
                 dict(label="BUYING", px=76, big="$2K&ndash;$3K", small="a month, and help can mean little to nothing out of pocket.")],
        panel_line="When it<br>has to go<br>right, I'm<br>your guy.", panel_px=42, rule_top=470,
        cta="Save my number. You'll want it.", panel_bottom=STAT_30_45, foot=FOOT_NUMBERS),
    "NUM-02": dict(palette="camel", kicker="THINKING ABOUT BUYING IN COLORADO",
        h1=["Look at"], h1_accent="these numbers.", h1_px=112,
        figures=[dict(label="RENTING", px=76, big="$2,000", small="a month, plus two months and a deposit to move in."),
                 dict(label="BUYING", px=76, big="$2K&ndash;$3K", small="a month, and help can mean little to nothing out of pocket.")],
        panel_line="When it<br>has to go<br>right, I'm<br>your guy.", panel_px=42, rule_top=470,
        cta="Save my number. You'll want it.", panel_bottom=STAT_30_45, foot=FOOT_NUMBERS),
    "PAY-01": dict(palette="scarlet", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME", **COMMON,
        h1=["Rent went up again."], h1_accent="What would owning cost?", h1_px=60,
        receipt=[("YOU RENT, SOLO", "Builds your landlord&#39;s equity", "$1,850", False),
                 ("OWN A $400K HOME, ON YOUR OWN", "All in, about", "$3,250", False),
                 ("TWO ROOMMATES AT $800 EACH", "Rooms in your home", "&minus;$1,600", False),
                 ("YOUR PAYMENT", "And you build the equity", "$1,650", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=10, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_PAY, foot_px=9),
    "PAY-02": dict(palette="burgundy", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME", **COMMON,
        h1=["How much more is"], h1_accent="owning than renting?", h1_px=70,
        receipt=[("YOU RENT TODAY", "Builds your landlord&#39;s equity", "$2,000", False),
                 ("OWN A $300K HOME", "All in, about", "$2,450", False),
                 ("THE DIFFERENCE", "About $100 a week, and the equity is yours", "$450", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_PAY2, foot_px=9),
    "DWN-01": dict(palette="camel", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME", **COMMON,
        h1=["What if you only needed", "3% down, and I could"], h1_accent="get you 5%?", h1_px=56,
        receipt=[("3% DOWN ON A $400K HOME", "What you bring", "$12,000", False),
                 ("DOWN PAYMENT ASSISTANCE", "3.5% to 5% of the price", "$14K&ndash;$20K", False),
                 ("SELLER CREDITS", "3&ndash;6% of the price, on almost every deal I closed", "$12K&ndash;$24K", False),
                 ("YOUR CASH TO CLOSE", "Can drop close to nothing", "Near $0", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=10, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_PAY, foot_px=9),
    "EQT-01": dict(palette="burgundy", kicker="HOMEOWNERS &nbsp;/&nbsp; INVESTING IN REAL ESTATE", **COMMON,
        h1=["Is your equity doing"], h1_accent="anything right now?", h1_px=66,
        receipt=[("YOUR HOME IS WORTH", "An example, today", "$600,000", False),
                 ("YOU OWE", "On your mortgage", "$300,000", False),
                 ("EQUITY YOU HAVE", "Sitting there, earning nothing", "$300,000", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_EQ, foot_px=9),
    "WLT-01": dict(palette="peacock", kicker="RENTERS &nbsp;/&nbsp; BUILDING WEALTH", **COMMON,
        h1=["Who gets the $12,000"], h1_accent="your home earns?", h1_px=66,
        receipt=[("A $400K HOME", "An example", "$400,000", False),
                 ("GROWING 3% A YEAR", "About, in a year", "$12,000", False),
                 ("WHO KEEPS IT", "The owner. A renter keeps none of it", "You", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_NUMBERS + " A 3% annual increase in value is an assumption, not a prediction.", foot_px=9),
    "PAY-03": dict(palette="peacock", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME", **COMMON,
        h1=["What if your payment"], h1_accent="never went up?", h1_px=68,
        receipt=[("RENT TODAY", "Builds your landlord&#39;s equity. Raises are up to them", "$2,000", False),
                 ("PRINCIPAL AND INTEREST, $300K HOME", "The same for all 30 years of the loan", "$1,961", False),
                 ("YOUR LOAN BALANCE DROPS, IN 5 YEARS", "About, before any appreciation. That&#39;s yours", "$16,700", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_PAY2, foot_px=9),
    "DWN-02": dict(palette="scarlet", kicker="COLORADO RENTERS &nbsp;/&nbsp; BUYING A HOME", **COMMON,
        h1=["Why do sellers keep", "paying buyers&#39;"], h1_accent="closing costs?", h1_px=62,
        receipt=[("CLOSING COSTS, EXAMPLE", "Lender and title on a $400K home", "$7,000", False),
                 ("THE SELLER PAYS", "A 3% credit on that same home", "$12,000", False),
                 ("ALMOST EVERY DEAL I CLOSED", "Seller concessions of 3% to 6% this year", "3&ndash;6%", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_NUMBERS, foot_px=9),
    "WLT-02": dict(palette="burgundy", kicker="HOMEOWNERS &nbsp;/&nbsp; BUILDING WEALTH", **COMMON,
        h1=["Where does $10,000"], h1_accent="work harder?", h1_px=76,
        receipt=[("$10,000 IN SAVINGS", "Earning 6% a year, about", "$600", False),
                 ("A $600,000 HOME", "Growing 3% a year, about", "$18,000", False),
                 ("SAME IDEA, BIGGER BASE", "Interest on savings vs. growth on the whole home", "30x", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_WEALTH.split(" Source:")[0] + " Examples are illustrative: a 6% savings rate and 3% annual growth in value are assumptions, not predictions or offers. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.", foot_px=9.5),
    "EQT-02": dict(palette="camel", kicker="HOMEOWNERS &nbsp;/&nbsp; INVESTING IN REAL ESTATE", **COMMON,
        h1=["What would you do with"], h1_accent="$180,000 of equity?", h1_px=60,
        receipt=[("80% OF YOUR HOME&#39;S VALUE", "On a $600,000 home, up to", "$480,000", False),
                 ("MINUS WHAT YOU OWE", "Your mortgage balance", "&minus;$300,000", False),
                 ("EQUITY YOU MAY BE ABLE TO USE", "The down payment on a rental, no sale", "$180,000", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_EQ, foot_px=9),
    "PAY-04": dict(palette="camel", kicker="RENTERS &nbsp;/&nbsp; BUYING A HOME", **COMMON,
        h1=["Where will your rent"], h1_accent="be in five years?", h1_px=70,
        receipt=[("RENT TODAY", "A month, and it builds their equity", "$2,000", False),
                 ("AFTER 5 YEARLY RAISES OF 5%", "Same apartment, five years on", "$2,553", False),
                 ("A FIXED LOAN, $300K HOME", "Principal and interest, the same every year", "$1,961", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_PAY2 + " Rent growth of 5% a year is an assumption, not a prediction.", foot_px=9),
    "DWN-03": dict(palette="peacock", kicker="FIRST-TIME BUYERS &nbsp;/&nbsp; COLORADO", **COMMON,
        h1=["Did anyone tell you", "down payment help"], h1_accent="exists?", h1_px=60,
        receipt=[("20% DOWN, WHAT PEOPLE ASSUME", "On a $400K home", "$80,000", False),
                 ("3% DOWN ON THAT SAME HOME", "What you actually bring", "$12,000", False),
                 ("ASSISTANCE TOWARD IT", "3.5% to 5% of the price", "$14K&ndash;$20K", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_PAY, foot_px=9),
    "WLT-03": dict(palette="scarlet", kicker="RENTERS &nbsp;/&nbsp; BUILDING WEALTH", **{**COMMON, "photo": dict(file="joshua-plaid.jpg", h=500, size=900, x=-93, y=-20)},
        h1=["Where does your"], h1_accent="rent actually go?", h1_px=76,
        receipt=[("5 YEARS OF RENT, AT $2,000", "Flat, no raises assumed", "$120,000", False),
                 ("EQUITY YOU BUILT WITH IT", "Your landlord builds theirs", "$0", False),
                 ("OWNER, LOAN PAID DOWN IN 5 YEARS", "On a $300K home, before any growth", "$16,700", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_PAY2, foot_px=9),
    "EQT-03": dict(palette="peacock", kicker="PAST CLIENTS &nbsp;/&nbsp; HOMEOWNERS", **COMMON,
        h1=["What if you didn&#39;t have", "to give up your"], h1_accent="low rate?", h1_px=60,
        receipt=[("YOUR FIRST MORTGAGE", "The low rate you already have", "Untouched", False),
                 ("YOUR EQUITY, EXAMPLE", "A $600K home with $300K owed", "$300,000", False),
                 ("WHAT YOU CAN DO", "A separate loan against your equity", "Both", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_EQ, foot_px=9),
    "CRD-01": dict(palette="burgundy", kicker="BUYERS, HOMEOWNERS &nbsp;/&nbsp; INVESTORS", **{**COMMON, "photo": dict(file="joshua-plaid.jpg", h=500, size=900, x=-93, y=-20)},
        h1=["Who do you call when"], h1_accent="it has to go right?", h1_px=62,
        receipt=[("YEARS IN MORTGAGE", "Through every rate cycle", "25", False),
                 ("HOW I SHOP YOUR LOAN", "A wholesale broker with several lenders", "Several", False),
                 ("WHEN IT HAS TO GO RIGHT", "Save my number. You&#39;ll want it", "Call me", True)],
        receipt_note="I shop many banks for the best to win yours.",
        rpad=22, rule_top=330, cta="Save my info. It&#39;s how we start.", foot=FOOT_CONSUMER, foot_px=9.5),
    "CRD-02": dict(palette="peacock", kicker="HOMEOWNERS &nbsp;/&nbsp; KNOW YOUR NUMBERS", **COMMON,
        h1=["What is your home"], h1_accent="really worth?", h1_px=80,
        receipt=[("ONLINE ESTIMATE, EXAMPLE", "A computer&#39;s guess. It hasn&#39;t seen inside", "$480,000", False),
                 ("A REAL NUMBER, EXAMPLE", "Your upgrades and the recent sales near you", "$515,000", False),
                 ("THE GAP IN YOUR EQUITY", "It can run higher or lower", "$35,000", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll find your real number.", foot=FOOT_EQ, foot_px=9.5),
    "AGT-04": dict(palette="burgundy", kicker="REAL ESTATE AGENTS &nbsp;/&nbsp; REFERRAL PARTNERS", **COMMON,
        h1=["What if your lender"], h1_accent="brought you deals?", h1_px=76,
        receipt=[("YOUR LENDER TODAY", "Waits for you to send the buyer", "Waiting", False),
                 ("A PARTNER WHO BUILDS", "Brings buyers, with the numbers already done", "Buyers", False),
                 ("YOUR TEAM", "I train your agents on lending, like I trained LOs", "Trained", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for your buyers.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll train your team too.", foot=FOOT_AGENT, foot_px=10),
    "AGT-05": dict(palette="peacock", kicker="REAL ESTATE AGENTS &nbsp;/&nbsp; REFERRAL PARTNERS", **COMMON,
        h1=["Are your buyers getting"], h1_accent="the most they qualify for?", h1_px=62,
        receipt=[("MOST LENDERS", "One bank, one set of guidelines, one rate sheet", "1", False),
                 ("A WHOLESALE BROKER", "Several lenders, the best fit for each buyer", "Several", False),
                 ("THE RESULT", "More buyer, a lower rate and a deal that closes", "More", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for your buyers.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll train your team too.", foot=FOOT_AGENT, foot_px=10),
    "AGT-06": dict(palette="scarlet", kicker="REAL ESTATE AGENTS &nbsp;/&nbsp; REFERRAL PARTNERS", **COMMON,
        h1=["Your buyer loves the house."], h1_accent="The payment doesn&#39;t reach.", h1_px=52,
        receipt=[("THE PAYMENT YOUR BUYER CAN HOLD", "Example, all in", "$3,000", False),
                 ("A HALF-POINT LOWER RATE", "What a wholesale broker can often find", "&minus;0.5%", False),
                 ("THE HOUSE THEY CAN NOW REACH", "More purchase price, same payment", "+$20K&ndash;25K", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for your buyers.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll train your team too.", foot=FOOT_AGENT + " Example only: a $3,000 payment, a half-point lower rate and the added purchase price are illustrative and vary by scenario.", foot_px=9.5),
    "WHY-01": dict(palette="scarlet", kicker="HOMEBUYERS &nbsp;/&nbsp; EVERYWHERE", **COMMON,
        h1=["Buyers leave $65 billion"], h1_accent="a year on the table.", h1_px=58,
        receipt=[("THE NATIONAL TOTAL", "Overpaid on mortgages, every year", "$65 billion", False),
                 ("YOUR SHARE", "About, per borrower, per year", "$3,300", False),
                 ("THE CAUSE", "Most buyers take one lender&#39;s quote", "1 quote", False),
                 ("THE FIX", "A wholesale broker shops several lenders for you", "Me", True)],
        receipt_note="I shop many banks for the best to win yours.",
        rpad=10, rule_top=330, cta="Save my info. I&#39;ll show you your number.", foot=FOOT_WHY, foot_px=9),
    "SMART-01": dict(palette="peacock", kicker="FIRST-TIME BUYERS &nbsp;/&nbsp; SMART MONEY", **COMMON,
        h1=["Become a SMART buyer"], h1_accent="with SMART money.", h1_px=58,
        receipt=[("THE CLASS", "Free, short and built from real buyer questions", "15 min", False),
                 ("WHAT YOU LEARN", "How to shop lenders, and what to ask them", "The edge", False),
                 ("YOUR NEXT STEP", "Your numbers, run on your real info", "Your plan", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll send you the class.", foot=FOOT_CONSUMER, foot_px=9.5),
    "INVB-01": dict(palette="camel", kicker="REAL ESTATE INVESTORS &nbsp;/&nbsp; PORTFOLIO REVIEW", **COMMON,
        h1=["Is your portfolio financed"], h1_accent="as well as it was bought?", h1_px=60,
        receipt=[("YOUR LOANS TODAY", "Placed one at a time, with whoever was there", "Scattered", False),
                 ("A PORTFOLIO REVIEW", "Every loan, rate and maturity on one page", "One page", False),
                 ("THE EDGE", "Several lenders, for every property you hold", "Options", True)],
        receipt_note="I&#39;m a wholesale broker. I shop several lenders for you.",
        rpad=22, rule_top=330, cta="Save my info. I&#39;ll review your portfolio.", foot=FOOT_AGENT, foot_px=10),
}

# ---- Photo toggle. Every Bond flyer is rendered five ways: REF.png (the default), REF-tie, REF-plum, REF-check, REF-text.
BOND_REFS = ["PAY-01","PAY-02","PAY-03","PAY-04","DWN-01","DWN-02","DWN-03","WLT-01","WLT-02","WLT-03","EQT-01","EQT-02","EQT-03","CRD-01","CRD-02","AGT-04","AGT-05","AGT-06","INVB-01","SMART-01","WHY-01"]
PHOTO_DEFAULT = {"PAY-01": "tie", "CRD-01": "check", "DWN-02": "plum", "EQT-02": "tie", "AGT-05": "plum"}   # everything else defaults to text-only
PHOTOS = {
    "tie":   dict(file="joshua-park-smile.jpg", h=500, size=720, x=-440, y=-40),
    "plum":  dict(file="joshua-plum-suit.jpg", h=500, size=1000, x=-116, y=0),
    "check": dict(file="joshua-check-suit.jpg", h=500, size=880, x=-70, y=0),
}
TEXT_PANEL = "When it<br>has to go<br>right,<br>I&#39;m your<br>guy."
def _variant(c, mode):
    c = dict(c)
    if mode in PHOTOS:
        c["photo"] = dict(PHOTOS[mode]); c["photo_line"] = COMMON["photo_line"]; c.pop("panel_line", None); c.pop("panel_px", None)
    else:
        c.pop("photo", None); c.pop("photo_line", None); c["panel_line"] = TEXT_PANEL; c["panel_px"] = 50
    return c
BOND_PAL = {r: ("sky", "maroon", "teal")[i % 3] for i, r in enumerate(BOND_REFS)}
BOND_PAL.update({"CRD-01": "sky", "WHY-01": "sky", "SMART-01": "teal"})
VARIANTS = {}
for _ref in BOND_REFS:
    CARDS[_ref]["palette"] = BOND_PAL[_ref]
    for _m in ("tie", "plum", "check", "text"):
        VARIANTS[_ref + "-" + _m] = _variant(CARDS[_ref], _m)
    CARDS[_ref] = VARIANTS[_ref + "-" + PHOTO_DEFAULT.get(_ref, "text")]

def qr_svg(url, px, dark, light):
    import segno
    m = segno.make(url, error="m").matrix
    n = len(m); q = 2; tot = n + 2 * q; u = px / tot
    rects = "".join(f'<rect x="{(x+q)*u:.2f}" y="{(y+q)*u:.2f}" width="{u+.4:.2f}" height="{u+.4:.2f}"/>' for y, row in enumerate(m) for x, v in enumerate(row) if v)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{px}" height="{px}" viewBox="0 0 {px} {px}"><rect width="{px}" height="{px}" fill="{light}"/><g fill="{dark}">{rects}</g></svg>'

def chart_html(p, top, width=690, height=250):
    data = json.load(open(os.path.join(os.path.dirname(__file__), "data", "hpi_annual.json")))
    n = len(data); step = width / n; bw = step * 0.76
    hi = max(v for _, v in data); lo = min(v for _, v in data)
    sc = (height - 40) / (hi - lo); base = 12 + hi * sc
    down = "#9B1C24"
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" style="position:absolute;left:74px;top:{top}px;overflow:visible">']
    out.append(f'<line x1="0" x2="{width}" y1="{base:.1f}" y2="{base:.1f}" stroke="{p["ink"]}" stroke-opacity=".5" stroke-width="1"/>')
    for i, (yr, v) in enumerate(data):
        x = i * step + (step - bw) / 2; h = abs(v) * sc
        y = base - h if v >= 0 else base
        col = p["ink"] if v >= 0 else down
        out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{max(h,1):.1f}" fill="{col}" fill-opacity="{.82 if v>=0 else 1}"/>')
    def lab(x, y, t, anchor="start", col=None, w=700):
        out.append(f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" style="font:{w} 11px M;letter-spacing:.14em" fill="{col or p["ink"]}">{t}</text>')
    iy = {yr: i for i, (yr, _) in enumerate(data)}
    lab(0, base + 62 + 10 if False else height - 2, "1976"); lab(width, height - 2, "2025", "end")
    lab(iy[2021] * step + step / 2, base - 18 * sc - 8, "+18% IN 2021", "end")
    lab(iy[2008] * step + step * 2.6, base + 7.2 * sc + 6, "-7.2% IN 2008", "start", down)
    lab(iy[1979] * step, base + 16, "1977 +14.7%", "start", p["muted"], 600) if False else None
    out.append("</svg>")
    return "".join(out)

def grain_url():
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/>"
           "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")
    return "url(data:image/svg+xml," + quote(svg, safe="") + ")"

def page(ref, c):
    p = PALETTES[c["palette"]]
    gr = grain_url()
    def grain(op): return f'<div style="position:absolute;inset:0;background-image:{gr};opacity:{op};pointer-events:none"></div>'
    ff = "".join(f"@font-face{{font-family:M;font-weight:{w};src:url(file://{MONT.format(w=w)})}}" for w in (500, 600, 700))
    ff += "".join(f"@font-face{{font-family:B;font-weight:{w};font-style:{s};src:url(file://{BOD.format(w=w, s=s)})}}" for w in (400, 500, 600, 700) for s in ("normal", "italic"))
    lpx = c.get("ledger_px", 34)
    h1 = "<br>".join(c["h1"]) + f'<br><i style="color:{p["accent"]};font-weight:400">{c["h1_accent"]}</i>'
    pb = c["panel_bottom"]
    if pb["kind"] == "stat":
        bottom = (f'<div style="width:44px;height:1px;background:{p["panel_mute"]};margin-bottom:22px"></div>'
                  f'<p style="font:500 92px/0.92 B;color:{p["panel_text"]}">{pb["top"]}</p>'
                  f'<div style="width:44px;height:3px;background:{p["accent"] if c["palette"]=="scarlet" else p["panel_mute"]};margin:10px 0"></div>'
                  f'<p style="font:500 92px/0.92 B;color:{p["panel_text"]}">{pb["bottom"]}</p>'
                  f'<p style="margin-top:16px;font:600 12px/1.6 M;letter-spacing:.26em;color:{p["panel_mute"]}">{pb["label"]}</p>')
    elif pb["kind"] == "qr":
        bottom = (f'<div style="width:44px;height:1px;background:{p["panel_mute"]};margin-bottom:18px"></div>'
                  f'<div style="width:164px;height:164px;line-height:0">{qr_svg(BOOKING, 164, p["ink"], p["panel_text"])}</div>'
                  f'<p style="margin-top:14px;font:600 11px/1.6 M;letter-spacing:.26em;color:{p["panel_mute"]}">{pb["label"]}</p>')
    else:
        words = "".join(f'<p style="font:500 italic 50px/1.12 B;color:{p["panel_text"]}">{w}</p>' for w in pb["words"])
        bottom = (f'<div style="width:44px;height:1px;background:{p["panel_mute"]};margin-bottom:20px"></div>{words}'
                  f'<p style="margin-top:18px;font:600 12px/1.6 M;letter-spacing:.26em;color:{p["panel_mute"]}">{pb["label"]}</p>')
    rule = p["accent"] if c["palette"] == "scarlet" else p["panel_mute"]
    ph = c.get("photo")
    if ph:
        img = os.path.join(BRAND, "photos", ph["file"])
        pline = c.get("photo_line", "Think of me<br>when it has<br>to go right.")
        panel_body = (f'<div style="position:absolute;right:0;top:0;width:270px;height:{ph["h"]}px;background-image:url(file://{img});background-size:auto {ph["size"]}px;background-position:{ph["x"]}px {ph["y"]}px;filter:grayscale(1) contrast(1.08) brightness(.96)"></div>'
                      f'<div style="position:absolute;right:0;top:{ph["h"]-150}px;width:270px;height:150px;background:linear-gradient(to bottom,rgba(0,0,0,0),{p["panel"]})"></div>'
                      f'<div style="position:absolute;right:0;top:{ph["h"]+12}px;width:270px;padding:0 34px 0 36px;box-sizing:border-box"><div style="width:44px;height:3px;background:{rule}"></div>'
                      f'<p style="margin-top:22px;font:500 italic 35px/1.1 B;color:{p["panel_text"]};white-space:nowrap">{pline}</p></div>')
        if pb["kind"] == "qr":
            panel_body += f'<div style="position:absolute;right:0;bottom:104px;width:270px;padding:0 34px 0 36px;box-sizing:border-box">{bottom}</div>'
        else:
            panel_body += f'<p style="position:absolute;right:34px;bottom:104px;font:600 11px/1.6 M;letter-spacing:.26em;color:{p["panel_mute"]}">SMOOTH. PRECISE. ELITE.</p>'
    else:
        panel_body = (f'<div style="position:absolute;right:0;top:0;width:270px;padding:84px 34px 0 36px;box-sizing:border-box"><div style="width:44px;height:3px;background:{rule}"></div>'
                      f'<p style="margin-top:26px;font:500 italic {c.get("panel_px",50)}px/1.08 B;color:{p["panel_text"]};white-space:nowrap">{c.get("panel_line","Think of<br>me when<br>it has to<br>go right.")}</p></div>'
                      f'<div style="position:absolute;right:0;bottom:104px;width:270px;padding:0 34px 0 36px;box-sizing:border-box">{bottom}</div>')
    gf = os.path.join(BRAND, "gf-logo-ink.png"); zp = os.path.join(BRAND, "zpm-logo-ink.png")
    ledger_html = "" if (c.get("figures") or c.get("chart") or c.get("receipt")) else f'''<div style="position:absolute;left:74px;width:690px;top:556px;display:grid;grid-template-columns:1fr 1fr">
<div style="padding-right:26px;border-right:1px solid {p["ink"]}33"><p style="font:700 13px M;letter-spacing:.32em;color:{p["ink"]}">{c["left"][0]}</p><p style="margin-top:10px;font:500 {lpx}px/1.12 B;color:{p["ink"]}">{c["left"][1]}</p></div>
<div style="padding-left:26px"><p style="font:700 13px M;letter-spacing:.32em;color:{p["accent"]}">{c["right"][0]}</p><p style="margin-top:10px;font:700 {lpx}px/1.12 B;color:{p["ink"]}">{c["right"][1]}</p></div></div>
'''
    if c.get("figures"):
        cols = []
        for k, fg in enumerate(c["figures"]):
            colr = p["accent"] if k else p["ink"]
            pad = "padding-left:26px" if k else "padding-right:26px;border-right:1px solid " + p["ink"] + "33"
            cols.append(f'<div style="{pad}"><p style="font:700 13px M;letter-spacing:.32em;color:{colr}">{fg["label"]}</p>'
                        f'<p style="margin-top:6px;font:500 {fg.get("px",70)}px/1 B;color:{p["ink"]};letter-spacing:-0.02em;white-space:nowrap">{fg["big"]}</p>'
                        f'<p style="margin-top:8px;font:500 21px/1.25 B;color:{p["ink"]}">{fg["small"]}</p></div>')
        ledger_html = '<div style="position:absolute;left:74px;width:690px;top:' + str(c.get("rule_top",540)+16) + 'px;display:grid;grid-template-columns:1fr 1fr">' + "".join(cols) + '</div>'
    if c.get("receipt"):
        top0 = c.get("rule_top", 540) + 14; rows = []
        for k, (lab, sub, amt, hot) in enumerate(c["receipt"]):
            col = p["accent"] if hot else p["ink"]
            bt = f'border-top:2px solid {p["ink"]};' if hot else (f'border-top:1px solid {p["ink"]}33;' if k else "")
            rows.append(f'<div style="display:flex;justify-content:space-between;align-items:center;{bt}padding:{c.get('rpad',9)+3 if hot else c.get('rpad',9)}px 0">'
                        f'<div><p style="font:700 12px M;letter-spacing:.28em;color:{col}">{lab}</p><p style="margin-top:4px;font:500 19px/1.2 B;color:{p["ink"]}">{sub}</p></div>'
                        f'<p style="font:{600 if hot else 500} {58 if hot else 44}px/1 B;color:{col};letter-spacing:-0.02em;white-space:nowrap">{amt}</p></div>')
        note = f'<p style="margin-top:12px;font:500 italic 22px/1.3 B;color:{p["ink"]}">{c["receipt_note"]}</p>' if c.get("receipt_note") else ""
        ledger_html = f'<div style="position:absolute;left:74px;width:690px;top:{top0}px">' + "".join(rows) + note + '</div>'
    if c.get("chart"):
        ledger_html = chart_html(p, c.get("rule_top", 540) + 18, height=c.get("chart_h", 250))
        if c.get("chart_note"):
            ledger_html += f'<p style="position:absolute;left:74px;width:690px;top:{c.get("rule_top",540)+18+c.get("chart_h",250)+8}px;font:500 italic 22px/1.3 B;color:{p["ink"]}">{c["chart_note"]}</p>'
    html_out = f'''<!doctype html><html><head><meta charset="utf-8"><style>{ff}body{{margin:0}}p,h1{{margin:0}}*{{font-variant-numeric:lining-nums !important;font-feature-settings:"lnum" 1 !important}}</style></head><body>
<div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:M">
<div style="position:absolute;inset:0;background:{p["bg"]}"></div>{grain(.16)}
<div style="position:absolute;right:0;top:0;bottom:0;width:270px;background:{p["panel"]}"></div><div style="position:absolute;right:0;top:0;bottom:0;width:270px">{grain(.3)}</div>
{panel_body}
<div style="position:absolute;left:74px;top:74px;display:flex;align-items:center;gap:14px"><div style="width:12px;height:12px;background:{p["accent"]}"></div><p style="font:700 14px M;letter-spacing:.34em;color:{p["ink"]};white-space:nowrap">{c["kicker"]}</p></div>
{('<p style="position:absolute;left:100px;top:98px;font:500 italic 15px B;color:' + p["muted"] + ';white-space:nowrap">' + c["kicker_sub"] + '</p>') if c.get("kicker_sub") else ""}
<h1 style="position:absolute;left:74px;top:132px;font:500 {c.get("h1_px",104)}px/0.97 B;color:{p["ink"]};letter-spacing:-0.02em">{h1}</h1>
<div style="position:absolute;left:74px;width:690px;top:{c.get("rule_top",540)}px;border-top:2px solid {p["ink"]}"></div>
{ledger_html}
<div style="position:absolute;left:74px;width:690px;top:726px;border-top:1px solid {p["ink"]}33"></div>
<p style="position:absolute;left:74px;top:738px;font:500 italic {c.get("cta_px",29)}px B;color:{p["ink"]};white-space:nowrap">{c["cta"]}</p>
{('<p style="position:absolute;left:74px;width:690px;top:748px;text-align:right;font:700 10.5px M;letter-spacing:.2em;color:' + p["accent"] + '">' + c["cta_note"] + '</p>') if c.get("cta_note") else ""}
<div style="position:absolute;left:74px;width:690px;top:792px;display:flex;align-items:center;justify-content:space-between">
<div><p style="font:600 34px/1 B;color:{p["ink"]};letter-spacing:-0.01em;white-space:nowrap">Joshua Graham</p>
<p style="margin-top:10px;font:700 11px M;letter-spacing:.2em;color:{p["accent"]};white-space:nowrap">REGIONAL LOAN ORIGINATOR</p>
<p style="margin-top:5px;font:600 10.5px M;letter-spacing:.12em;color:{p["ink"]};white-space:nowrap">NMLS #169809 &nbsp;&middot;&nbsp; LICENSED IN COLORADO</p></div>
<div style="display:flex;align-items:center;gap:16px;flex:none"><img src="file://{gf}" style="height:52px;display:block;opacity:.9"><div style="width:1px;height:42px;background:{p["ink"]}33"></div><img src="file://{zp}" style="height:36px;display:block;opacity:.9"></div></div>
<div style="position:absolute;left:74px;width:690px;top:886px;border-top:1px solid {p["ink"]}33"></div>
<div style="position:absolute;left:74px;width:690px;top:898px;display:flex;align-items:baseline;gap:14px;white-space:nowrap"><p style="font:600 24px/1 B;color:{p["ink"]}">720-468-6872</p><span style="color:{p["accent"]};font:500 18px/1 B">&nbsp;/&nbsp;</span><p style="font:500 24px/1 B;color:{p["ink"]}">jgraham@grahamfinancial.us</p></div>
<p style="position:absolute;left:74px;width:690px;bottom:40px;font:500 {c.get("foot_px",10)}px/1.45 M;color:{p["muted"]}">{c["foot"]}<span style="display:block;margin-top:5px;font:700 9px M;letter-spacing:.18em;color:#000">REF {ref}</span></p>
</div></body></html>'''
    if c.get("side") == "left":
        html_out = html_out.replace("right:0;", "left:0;").replace("left:74px", "left:344px")
    return html_out

def render(ref, c, outdir, name=None):
    tmp = tempfile.mkdtemp()
    html = os.path.join(tmp, ref + ".html")
    open(html, "w").write(page(ref, c))
    png = os.path.join(outdir, (name or ref) + ".png")
    os.makedirs(outdir, exist_ok=True)
    subprocess.run(["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--window-size=1080,1080", "--virtual-time-budget=3000", f"--screenshot={png}", "file://" + html],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return png

if __name__ == "__main__":
    args = sys.argv[1:]
    out = os.path.join(ROOT, "public", "smart-money", "flyers")
    if "--out" in args:
        i = args.index("--out"); out = args[i + 1]; args = args[:i] + args[i + 2:]
    for ref in (args or list(CARDS)):
        print(render(ref, CARDS[ref], out))
        if ref in BOND_REFS:
            for v in ("tie", "plum", "check", "text"):
                print(render(ref, VARIANTS[ref + "-" + v], out, name=ref + "-" + v))
