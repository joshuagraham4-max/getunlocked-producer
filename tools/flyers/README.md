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
