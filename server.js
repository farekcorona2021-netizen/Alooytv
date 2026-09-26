import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 7000;

// أنت تحط رابط الموقع هنا
const SITE = process.env.SITE_URL || "https://ds.alooytv16.xyz/tv-series.html";

const get = async url => (await fetch(url)).text();

async function scrape(url) {
  const $ = cheerio.load(await get(url));
  const items = [];

  $("a").each((_, e) => {
    const a = $(e), href = a.attr("href");
    const name = a.text().trim();

    if (href && name)
      items.push({
        id: new URL(href, SITE).href,
        name,
        poster: a.find("img").attr("src") || a.attr("data-src")
      });
  });

  return items;
}

app.get("/", (_, res) => res.send(`
<!doctype html>
<html lang="ar" dir="rtl">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Alooy Arabic</title>
<style>
body{margin:0;background:#09090b;color:#fff;font-family:Arial;
display:grid;place-items:center;height:100vh;text-align:center}
.card{width:min(90%,420px);padding:45px 25px;background:#151518;
border-radius:28px;box-shadow:0 20px 60px #000}
h1{font-size:32px;margin:0 0 10px}
p{color:#aaa;margin-bottom:30px}
button{border:0;border-radius:16px;padding:17px 55px;
font-size:19px;font-weight:bold;cursor:pointer}
</style>
<div class="card">
<h1>Alooy Arabic</h1>
<p>محتوى عربي لـ Stremio</p>
<button onclick="location.href='/manifest.json'">تثبيت</button>
</div>
</html>`));

app.get("/manifest.json", (_, res) => res.json({
  id: "com.fares.alooy",
  version: "1.0.0",
  name: "Alooy Arabic",
  description: "Arabic content addon",
  resources: ["catalog", "meta"],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "arabic-movies", name: "أفلام عربية" },
    { type: "series", id: "arabic-series", name: "مسلسلات عربية" }
  ]
}));

app.get("/catalog/:type/:id.json", async (req, res) => {
  try {
    const items = await scrape(SITE);
    res.json({
      metas: items.map(x => ({
        id: x.id,
        type: req.params.type,
        name: x.name,
        poster: x.poster
      }))
    });
  } catch {
    res.json({ metas: [] });
  }
});

app.get("/meta/:type/:id.json", async (req, res) => {
  try {
    const items = await scrape(req.params.id);
    const first = items[0] || {};

    res.json({
      meta: {
        id: req.params.id,
        type: req.params.type,
        name: first.name || "بدون اسم",
        poster: first.poster,
        videos: items.map((x, i) => ({
          id: x.id,
          title: x.name,
          season: 1,
          episode: i + 1
        }))
      }
    });
  } catch {
    res.json({ meta: { id: req.params.id, type: req.params.type } });
  }
});

app.listen(PORT, () =>
  console.log(`Addon: http://localhost:${PORT}`)
);
