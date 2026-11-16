# Flyer generators (1080x1080, Smart Money template)

Python writes one HTML per card; headless Chrome screenshots it to PNG. PNGs go in public/smart-money/flyers/<REF>.png and the card's `flyer` field in src/smart-money/data.js points at them.

Setup (fonts are not in the repo):
    mkdir -p /tmp/fonts && cd /tmp/fonts && npm pack @fontsource/montserrat --silent && tar xzf fontsource-montserrat-*.tgz

Render:
    cd tools/flyers && python3 gen3.py   # writes <REF>.html in the current folder
    google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars --allow-file-access-from-files \
      --window-size=1080,1080 --virtual-time-budget=3000 --screenshot=EQP-02.png file://$PWD/EQP-02.html

- gen.py: base template + EQP-01 (forest green) and EQP-P1 (navy).
- gen2.py: HEL-01, PORT-01 (forest green, mortgage business-purpose footer).
- gen3.py: EQP-02..06 (green), EQP-P2, EQP-P3 (navy); Section 179 tax line on 05 / P3.
- checklist.html: equipment application checklist; print with --print-to-pdf.
Palettes: G (green #12291C, tiles #1C3B29, gold accent #F2B84B), N (navy #0E1B2A, tiles #16283C, gold accent).
Signature card: public/smart-money/signature.png (mortgage card, used for equipment too for now).
Fit rule: if anything wraps, shorten words; never shrink the template. Check REF line visible.

## Elite look (Nov 16, 2026): gen_elite.py
"Smooth. Precise. Elite." template: bone ground, Bodoni headline, hairline ledger, name + credentials as type, ink logos, right quarter panel.
- Run from repo root: `python3 tools/flyers/gen_elite.py [REF ...]` (writes public/smart-money/flyers/<REF>.png). Setup and fonts: see the docstring at the top of the script.
- Palettes: scarlet (buyers/renters), peacock (agents/partners). Add more in PALETTES; copy a CARDS entry for a new flyer.
- Cards so far: BUY-01 (approved base), BUY-02 (rent builds their equity), AGT-02 (agents). Not yet wired into src/smart-money/data.js.
- Logos: public/brand/gf-logo-ink.png and zpm-logo-ink.png (single-color, for light grounds), gf-logo-silver.png (for dark grounds). Mockups in public/brand/originals/mockups/. Photos in public/brand/photos/.
- Consumer ads: no payment amounts or down payment percentages (Reg Z trigger terms) unless fully disclosed. Keep the footer.
- VA seals are parked in tools/flyers/assets/va-parked/ (not public). Do not use until ZPM compliance approves.
