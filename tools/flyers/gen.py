import sys
FONT="/tmp/fonts/package/files/montserrat-latin-{w}-normal.woff2"
SIG="/home/claude/getunlocked-producer/public/smart-money/signature.png"
FOOT="Graham Financial | Commercial equipment financing for business purposes only. Financing provided by participating lenders, subject to credit approval and lender terms. No upfront fees. Not available in California."
def page(c):
    ff="".join(f"@font-face{{font-family:M;font-weight:{w};src:url(file://{FONT.format(w=w)})}}" for w in (500,600,700,800))
    chips="".join(f'<p style="margin:0;font-size:19px;font-weight:700;border:1.5px solid {c["accent"] if i==0 else c["chipb"]};border-radius:999px;padding:8px 16px;color:{c["accent"] if i==0 else "#FFFFFF"};white-space:nowrap">{t}</p>' for i,t in enumerate(c["chips"]))
    tiles="".join(f'<div style="background:{c["tile"]};border-radius:14px;padding:22px 20px"><p style="margin:0;font-size:44px;font-weight:800;white-space:nowrap">{v}</p><p style="margin:6px 0 0;font-size:17px;font-weight:600;color:{c["sub"]}">{l}</p></div>' for v,l in c["tiles"])
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{ff}body{{margin:0}}</style></head><body>
<div style="width:1080px;height:1080px;box-sizing:border-box;background:{c["bg"]};font-family:M,Arial,sans-serif;color:#FFFFFF;display:flex;flex-direction:column;overflow:hidden">
<div style="padding:72px 72px 0 72px;display:flex;flex-direction:column;gap:22px">
<div style="display:flex;align-items:center;gap:14px"><div style="width:44px;height:4px;background:{c["accent"]}"></div>
<p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.18em;color:{c["accent"]};white-space:nowrap"><span style="color:#FFFFFF;font-weight:800">{c["aud"]}</span> · {c["prod"]}</p></div>
<h1 style="margin:0;font-size:84px;line-height:1.04;font-weight:800;letter-spacing:-0.02em">{c["h1"]}</h1>
<p style="margin:0;font-size:30px;line-height:1.35;font-weight:500;color:{c["sub"]};max-width:900px">{c["subhead"]}</p>
<p style="margin:0;font-size:26px;font-weight:700;color:{c["accent"]}">{c["acc"]}</p></div>
<div style="padding:30px 72px 0 72px;display:flex;gap:10px;align-items:center"><p style="margin:0;font-size:19px;font-weight:600;color:{c["mute"]};white-space:nowrap">{c["rowlbl"]}</p>{chips}</div>
<div style="padding:32px 72px 0 72px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">{tiles}</div>
<div style="margin-top:32px;background:#FFFFFF;height:236px;padding:0 72px 0 52px;display:flex;align-items:center;gap:28px">
<img src="file://{SIG}" style="height:220px;width:440px;object-fit:contain">
<div style="flex:1;border-left:2px solid #E3E8EE;padding-left:28px"><p style="margin:0;font-size:28px;line-height:1.2;font-weight:800;color:{c["bg"]}">{c["band"]}</p></div></div>
<div style="flex:1;padding:0 72px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">
<p style="margin:0;font-size:13px;line-height:1.45;font-weight:500;color:{c["mute"]};text-align:center">{FOOT}</p>
<p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.08em;color:{c["mute"]};text-align:center">REF {c["ref"]}</p></div></div></body></html>'''
G=dict(bg="#12291C",tile="#1C3B29",chipb="#3E6B4E",sub="#CFE0D4",mute="#A8C2B0",accent="#F2B84B")
N=dict(bg="#0E1B2A",tile="#16283C",chipb="#3A5674",sub="#C9D6E3",mute="#A9B8C8",accent="#F2B84B")
cards={
"EQP-01":{**G,"ref":"EQP-01","aud":"BUSINESS OWNERS","prod":"EQUIPMENT FINANCING","h1":"The bank said no.<br>That's not the end.",
 "subhead":"I take your equipment deal to lenders who look past what the bank turned down.","acc":"One application. Many lenders. You pick.",
 "rowlbl":"Works for:","chips":["Mowers","Skid steers","Kitchen gear","Food trucks"],
 "tiles":[("5 min","To find out"),("$0","Upfront fees"),("Soft","Credit pull to start"),("1 app","Many lenders")],"band":"Turned down by your bank? Talk to me first."},
"EQP-P1":{**N,"ref":"EQP-P1","aud":"BANKERS · CREDIT UNIONS","prod":"EQUIPMENT REFERRALS","h1":"Your turn-downs<br>aren't dead ends.",
 "subhead":"I place the equipment deals that don't fit your credit box. Your client stays yours.","acc":"Send me the no's. I'll work on the yes.",
 "rowlbl":"How it works:","chips":["1 Send the deal","2 I shop lenders","3 Client stays yours"],
 "tiles":[("$0","Cost to you"),("1 call","To send a deal"),("Yours","Client relationship"),("5 min","Intro call")],"band":"Too new or bruised credit? Send it over."},
}
for k,c in cards.items(): open(f"{k}.html","w").write(page(c))
