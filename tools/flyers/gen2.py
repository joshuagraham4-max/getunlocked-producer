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
<p style="margin:0;font-size:13px;line-height:1.45;font-weight:500;color:{c["mute"]};text-align:center">{c.get("foot",FOOT)}</p>
<p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.08em;color:{c["mute"]};text-align:center">REF {c["ref"]}</p></div></div></body></html>'''
G=dict(bg="#12291C",tile="#1C3B29",chipb="#3E6B4E",sub="#CFE0D4",mute="#A8C2B0",accent="#F2B84B")
N=dict(bg="#0E1B2A",tile="#16283C",chipb="#3A5674",sub="#C9D6E3",mute="#A9B8C8",accent="#F2B84B")
BUS="Joshua Graham NMLS #169809 | Graham Financial, powered by Zero Point Mortgage Services NMLS #1216108 | Equal Housing Opportunity. Business-purpose loans on non-owner-occupied investment property only. Not available in AZ, CA, ID, MI, MN, NV, NJ, ND, OR, SD, UT, VT, VA. Rates subject to change; actual rate depends on credit, LTV and property type. Not a commitment to lend; subject to credit approval, underwriting guidelines and change without notice."
cards={
"HEL-01":{**G,"foot":BUS,"ref":"HEL-01","aud":"INVESTORS","prod":"RENTAL EQUITY SECOND","h1":"Keep the 3%.<br>Take the equity.",
 "subhead":"A second loan behind your first mortgage, qualified on the property's rent.","acc":"Your equity, unlocked. Your rate, untouched.",
 "rowlbl":"Works for:","chips":["Long-term rentals","Airbnb / VRBO","First-time investors"],
 "tiles":[("90%","Combined LTV"),("$750K","Max loan"),("660","Min FICO"),("1.00","Rent ratio")],"band":"Don't refinance your 3% to get your equity out."},
"PORT-01":{**G,"foot":BUS,"ref":"PORT-01","aud":"INVESTORS","prod":"FREE PORTFOLIO SNAPSHOT","h1":"No credit pull.<br>No application.",
 "subhead":"Send the spreadsheet you already keep. I'll show you what your portfolio can do.","acc":"Messy is fine. Back to you within 24 hours.",
 "rowlbl":"You'll see:","chips":["Equity to use","Dead money","Cash flow fixes"],
 "tiles":[("$0","Cost to you"),("0","Credit pulls"),("24 hrs","Turnaround"),("1 file","Your spreadsheet")],"band":"Stop handing out your credit just to see your options."},
}
for k,c in cards.items(): open(f"{k}.html","w").write(page(c))
