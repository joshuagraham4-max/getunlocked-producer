#!/usr/bin/env python3
"""Color-block ad tests: one hook on a solid block, nothing else. Overnight $5-per-hook tests, then scale the winner.
Usage (repo root):  python3 tools/flyers/gen_blocks.py          # all hooks -> public/smart-money/blocks/<ID>-<theme>.png (1080x1350 and -sq 1080x1080)
Each hook has a test ref (T-...). Send the ad to https://getunlocked-producer.vercel.app/save?ref=<test ref> so Contacts shows which hook made leads.
"""
import os, subprocess, tempfile, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONT_DIR = os.environ.get("FONT_DIR", "/tmp/fonts")
MONT = FONT_DIR + "/package/files/montserrat-latin-{w}-normal.woff2"
BOD = FONT_DIR + "/bod/package/files/bodoni-moda-latin-{w}-{s}.woff2"
THEMES = {  # bg, text, red accent (lifted so it reads on dark)
    "navy":   ("#0E1B2A", "#EAF2F9", "#FF4B5C"),
    "maroon": ("#4A111C", "#F6ECE9", "#FF5A6B"),
    "teal":   ("#0A3A42", "#E9F3F4", "#FF5A6B"),
}
# id, test ref, line 1 (and 2), italic red last line, theme, audience
HOOKS = [
    ("PAY-01", "T-PAY01", ["Rent went", "up again."], ["What would", "owning cost?"], "navy", "buyers"),
    ("DWN-01", "T-DWN01", ["What if you only", "needed 3% down,"], ["and I could get", "you 5%?"], "maroon", "buyers"),
    ("WLT-01", "T-WLT01", ["Who gets the", "$12,000 your"], ["home earns?"], "teal", "buyers"),
    ("WHY-01", "T-WHY01", ["Buyers leave", "$65 billion a year"], ["on the table."], "navy", "buyers"),
    ("CRD-01", "T-CRD01", ["Who do you call", "when it has to"], ["go right?"], "maroon", "all"),
    ("AGT-06", "T-AGT06", ["Your buyer loves", "the house."], ["The payment", "doesn't reach."], "teal", "agents"),
]
def page(lines, accent, theme, h):
    bg, tx, red = THEMES[theme]
    longest = max(len(x) for x in lines + accent)
    px = int(min(124, 920 / (0.54 * longest)))
    ff = "".join(f"@font-face{{font-family:M;font-weight:{w};src:url(file://{MONT.format(w=w)})}}" for w in (600, 700))
    ff += "".join(f"@font-face{{font-family:B;font-weight:{w};font-style:{s};src:url(file://{BOD.format(w=w, s=s)})}}" for w in (500, 600) for s in ("normal", "italic"))
    body = "<br>".join(lines)
    return f"""<!doctype html><meta charset=utf-8><style>{ff}
html,body{{margin:0;width:1080px;height:{h}px;background:{bg};overflow:hidden}}
.w{{box-sizing:border-box;width:1080px;height:{h}px;padding:90px 80px 70px;display:flex;flex-direction:column;justify-content:center;position:relative;color:{tx}}}
.bar{{width:70px;height:6px;background:{red};margin-bottom:46px}}
h1{{white-space:nowrap;margin:0;font:600 {px}px/1.08 B,serif;letter-spacing:-.01em}}
h1 i{{display:block;font-style:italic;font-weight:500;color:{red}}}
.f{{position:absolute;left:80px;right:80px;bottom:62px;font:600 20px M,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:{tx};opacity:.75;display:flex;justify-content:space-between}}
</style><div class=w><div class=bar></div><h1>{body}<i>{"<br>".join(accent)}</i></h1><div class=f><span>Joshua Graham</span><span>NMLS #169809</span></div></div>"""
def shot(html, png, h):
    tmp = tempfile.mkdtemp(); p = os.path.join(tmp, "b.html"); open(p, "w").write(html)
    subprocess.run(["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    f"--window-size=1080,{h}", "--virtual-time-budget=3000", f"--screenshot={png}", "file://" + p], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if __name__ == "__main__":
    out = os.path.join(ROOT, "public", "smart-money", "blocks"); os.makedirs(out, exist_ok=True)
    sheet = []
    for id_, ref, lines, acc, theme, aud in HOOKS:
        for h, suf in ((1350, ""), (1080, "-sq")):
            shot(page(lines, acc, theme, h), os.path.join(out, f"{id_}-{theme}{suf}.png"), h)
        sheet.append(dict(id=id_, ref=ref, hook=" ".join(lines + acc), theme=theme, audience=aud,
                          link=f"https://getunlocked-producer.vercel.app/save?ref={ref}"))
        print(id_, theme)
    json.dump(sheet, open(os.path.join(out, "test-sheet.json"), "w"), indent=2)
