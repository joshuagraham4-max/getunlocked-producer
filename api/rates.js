// GET /api/rates: Freddie Mac PMMS national averages (30-yr and 15-yr fixed), weekly, via FRED's public CSV.
// Market statistics only, not Joshua's offered rates. Cached at the edge for 6 hours. Returns {} if the source is down.
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
  try {
    const r = await fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US,MORTGAGE15US", { headers: { "User-Agent": "getunlocked-producer" } });
    if (!r.ok) throw new Error("status " + r.status);
    const rows = (await r.text()).trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
    for (let i = rows.length - 1; i >= 0; i--) {
      const [date, r30, r15] = rows[i];
      const a = parseFloat(r30), b = parseFloat(r15);
      if (isFinite(a) && isFinite(b)) return res.status(200).json({ date, r30: a, r15: b, source: "Freddie Mac PMMS" });
    }
    throw new Error("no data");
  } catch (e) {
    res.setHeader("Cache-Control", "s-maxage=600");
    return res.status(200).json({});
  }
};
