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
TAX=FOOT+" Not tax advice; consult your tax advisor about Section 179."
O=lambda **k:{**G,"aud":"BUSINESS OWNERS",**k}
P=lambda **k:{**N,**k}
cards={
"EQP-02":O(ref="EQP-02",prod="STARTUP EQUIPMENT FINANCING",h1="Too new<br>for the bank?",subhead="Banks want 2 years in business. There are lenders who don't.",acc="Year one shouldn't stop your growth.",rowlbl="Works for:",chips=["First location","New trucking authority","Startups"],tiles=[("Year 1","Businesses welcome"),("$0","Upfront fees"),("Soft","Credit pull to start"),("5 min","To find out")],band="New business? Talk to me before you give up."),
"EQP-03":O(ref="EQP-03",prod="EQUIPMENT FINANCING",h1="Credit took a hit.<br>Business didn't.",subhead="The bank saw your score. These lenders also look at your cash flow and the equipment.",acc="One bad year shouldn't freeze your business.",rowlbl="They look at:",chips=["Cash flow","Time in business","The equipment"],tiles=[("5 min","To find out"),("$0","Upfront fees"),("Soft","Credit pull to start"),("1 app","Many lenders")],band="Turned down over credit? Let's look again."),
"EQP-04":O(ref="EQP-04",prod="EQUIPMENT FINANCING",h1="6 weeks for<br>one machine?",subhead="The bank's process is slow. Most smaller deals need just a short application.",acc="Stop losing jobs to slow approvals.",rowlbl="You'll need:",chips=["1-page app","Equipment quote","Bank statements"],tiles=[("1 page","Application"),("3 mo","Bank statements"),("$0","Upfront fees"),("5 min","To find out")],band="The job starts Monday. Let's move."),
"EQP-05":O(ref="EQP-05",prod="YEAR-END EQUIPMENT",foot=TAX,h1="Buying before<br>Dec 31?",subhead="Finance the equipment, keep your cash, and ask your CPA about Section 179.",acc="Year-end gear without draining your cash.",rowlbl="Steps:",chips=["1 Pick the equipment","2 Ask your CPA","3 Call me"],tiles=[("Dec 31","In service by"),("$0","Upfront fees"),("Soft","Credit pull to start"),("5 min","To find out")],band="Year-end gear, without the year-end cash crunch."),
"EQP-06":O(ref="EQP-06",prod="EQUIPMENT FINANCING",h1="It broke<br>down again.",subhead="Every breakdown costs twice: the repair and the job you couldn't do.",acc="Replace it without a big cash hit.",rowlbl="Works for:",chips=["New equipment","Used equipment","Upgrades"],tiles=[("5 min","To find out"),("$0","Upfront fees"),("Used","Equipment OK too"),("1 app","Many lenders")],band="Patch it again, or replace it? Let's run it."),
"EQP-P2":P(ref="EQP-P2",aud="DEALERS · VENDORS",prod="EQUIPMENT FINANCING",h1="Their bank said no.<br>Save the sale.",subhead="I finance the buyers your bank won't take, so the sale doesn't walk off the lot.",acc="You get paid. Your customer gets the equipment.",rowlbl="How it works:",chips=["1 Send the buyer","2 I shop lenders","3 You get paid"],tiles=[("$0","Cost to you"),("1 call","To send a buyer"),("Direct","Funding to you"),("5 min","Intro call")],band="Lost a sale to a bank no? Not anymore."),
"EQP-P3":P(ref="EQP-P3",aud="CPAS · BOOKKEEPERS",prod="YEAR-END EQUIPMENT",foot=TAX,h1="Clients buying<br>before Dec 31?",subhead="You handle the tax side. I handle the financing, so they keep their cash.",acc="Keep your client's cash. Finance the equipment.",rowlbl="How it works:",chips=["1 Send the client","2 I shop lenders","3 You advise on taxes"],tiles=[("$0","Upfront fees"),("1 call","To refer"),("Dec 31","Year-end deadline"),("5 min","Intro call")],band="Section 179 season is here. Let's team up."),
}
for k,c in cards.items(): open(f"{k}.html","w").write(page(c))
