const url = process.argv[2] || "https://www.plytic.com/authors/arelies/sourceips";
const html = await fetch(url, {
  headers: {
    "user-agent": "Mozilla/5.0",
    accept: "text/html",
  },
}).then((response) => response.text());

console.log({ length: html.length, sourceipsIndex: html.indexOf("sourceips") });
console.log([...html.matchAll(/<script[^>]+src="([^"]+)/g)].map((match) => match[1]).join("\n"));
