const base = "https://www.plytic.com";
const entry = `${base}/authors/arelies/sourceips`;

const html = await fetch(entry, {
  headers: { "user-agent": "Mozilla/5.0", accept: "text/html" },
}).then((response) => response.text());

const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((src) => src.startsWith("/static/js/"));

for (const script of scripts) {
  const js = await fetch(`${base}${script}`, {
    headers: { "user-agent": "Mozilla/5.0", accept: "*/*" },
  }).then((response) => response.text());
  const hits = [
    ...js.matchAll(/.{0,80}(authors|sourceips|relations|ip|\/api\/|axios|fetch).{0,160}/gi),
  ].map((match) => match[0]);

  console.log(`\n===== ${script} (${js.length}) =====`);
  console.log(hits.slice(0, 80).join("\n---\n"));
}
