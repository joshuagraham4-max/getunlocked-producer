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
import os, sys, subprocess, tempfile
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
    "peacock": dict(bg="#EFEAE0", ink="#101820", accent="#0C5A63", panel="#0A363D", panel_text="#EFEAE0", panel_mute="#9DC0C0", muted="#5A5F66"),
}

FOOT_CONSUMER = ("Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. "
    "Licensed in Colorado. Down payment assistance and seller concessions depend on program eligibility, lender and seller agreement and are not available to all borrowers. "
    "First payment timing varies by closing date. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.")
FOOT_AGENT = ("Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. "
    "Licensed in Colorado. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice.")

STAT_30_45 = dict(kind="stat", top="30", bottom="45", label="DAYS TO YOUR<br>FIRST PAYMENT")
TAGLINE = dict(kind="tagline", words=["Smooth.", "Precise.", "Elite."], label="GRAHAM FINANCIAL")

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
}

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
    else:
        words = "".join(f'<p style="font:500 italic 50px/1.12 B;color:{p["panel_text"]}">{w}</p>' for w in pb["words"])
        bottom = (f'<div style="width:44px;height:1px;background:{p["panel_mute"]};margin-bottom:20px"></div>{words}'
                  f'<p style="margin-top:18px;font:600 12px/1.6 M;letter-spacing:.26em;color:{p["panel_mute"]}">{pb["label"]}</p>')
    gf = os.path.join(BRAND, "gf-logo-ink.png"); zp = os.path.join(BRAND, "zpm-logo-ink.png")
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{ff}body{{margin:0}}p,h1{{margin:0}}*{{font-variant-numeric:lining-nums !important;font-feature-settings:"lnum" 1 !important}}</style></head><body>
<div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:M">
<div style="position:absolute;inset:0;background:{p["bg"]}"></div>{grain(.16)}
<div style="position:absolute;right:0;top:0;bottom:0;width:270px;background:{p["panel"]}"></div><div style="position:absolute;right:0;top:0;bottom:0;width:270px">{grain(.3)}</div>
<div style="position:absolute;right:0;top:0;width:270px;padding:84px 34px 0 36px;box-sizing:border-box"><div style="width:44px;height:3px;background:{p["accent"] if c["palette"]=="scarlet" else p["panel_mute"]}"></div>
<p style="margin-top:26px;font:600 12px M;letter-spacing:.3em;color:{p["panel_mute"]}">A CONSULTATION,</p>
<p style="margin-top:12px;font:500 italic 64px/1.0 B;color:{p["panel_text"]}">not a<br>sales<br>call.</p></div>
<div style="position:absolute;right:0;bottom:104px;width:270px;padding:0 34px 0 36px;box-sizing:border-box">{bottom}</div>
<p style="position:absolute;right:34px;bottom:62px;font:600 12px M;letter-spacing:.2em;color:{p["panel_mute"]}">REF {ref}</p>
<div style="position:absolute;left:74px;top:74px;display:flex;align-items:center;gap:14px"><div style="width:12px;height:12px;background:{p["accent"]}"></div><p style="font:700 14px M;letter-spacing:.34em;color:{p["ink"]};white-space:nowrap">{c["kicker"]}</p></div>
<h1 style="position:absolute;left:74px;top:132px;font:500 104px/0.97 B;color:{p["ink"]};letter-spacing:-0.02em">{h1}</h1>
<div style="position:absolute;left:74px;width:690px;top:540px;border-top:2px solid {p["ink"]}"></div>
<div style="position:absolute;left:74px;width:690px;top:556px;display:grid;grid-template-columns:1fr 1fr">
<div style="padding-right:26px;border-right:1px solid {p["ink"]}33"><p style="font:700 13px M;letter-spacing:.32em;color:{p["ink"]}">{c["left"][0]}</p><p style="margin-top:10px;font:500 {lpx}px/1.12 B;color:{p["ink"]}">{c["left"][1]}</p></div>
<div style="padding-left:26px"><p style="font:700 13px M;letter-spacing:.32em;color:{p["accent"]}">{c["right"][0]}</p><p style="margin-top:10px;font:700 {lpx}px/1.12 B;color:{p["ink"]}">{c["right"][1]}</p></div></div>
<div style="position:absolute;left:74px;width:690px;top:726px;border-top:1px solid {p["ink"]}33"></div>
<p style="position:absolute;left:74px;top:746px;font:500 italic 29px B;color:{p["ink"]};white-space:nowrap">{c["cta"]}</p>
<div style="position:absolute;left:74px;width:690px;top:804px;display:flex;align-items:flex-end;justify-content:space-between">
<div><p style="font:600 46px/1 B;color:{p["ink"]};letter-spacing:-0.01em;white-space:nowrap">Joshua Graham</p>
<p style="margin-top:12px;font:700 12.5px M;letter-spacing:.28em;color:{p["accent"]};white-space:nowrap">REGIONAL LOAN ORIGINATOR</p>
<p style="margin-top:7px;font:600 12px M;letter-spacing:.14em;color:{p["ink"]};white-space:nowrap">NMLS #169809 &nbsp;&middot;&nbsp; LICENSED IN COLORADO</p></div>
<div style="display:flex;align-items:center;gap:18px;padding-bottom:2px;flex:none"><img src="file://{gf}" style="height:56px;display:block;opacity:.9"><div style="width:1px;height:46px;background:{p["ink"]}33"></div><img src="file://{zp}" style="height:40px;display:block;opacity:.9"></div></div>
<p style="position:absolute;left:74px;width:690px;bottom:56px;font:500 10.5px/1.5 M;color:{p["muted"]}">{c["foot"]}</p>
</div></body></html>'''

def render(ref, c, outdir):
    tmp = tempfile.mkdtemp()
    html = os.path.join(tmp, ref + ".html")
    open(html, "w").write(page(ref, c))
    png = os.path.join(outdir, ref + ".png")
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
