const userId = process.argv[2] || "a22663564";
const urls = [
  `https://www.pttweb.cc/user/${userId}`,
  `https://www.pttweb.cc/user/${userId}?t=article`,
  `https://www.pttweb.cc/user/${userId}?t=recommend`,
  `https://www.pttweb.cc/user/${userId}/articles`,
  `https://www.pttweb.cc/user/${userId}/recommends`,
  `https://www.pttweb.cc/user/${userId}/article`,
  `https://www.pttweb.cc/user/${userId}/recommend`,
];

for (let page = 1; page <= 5; page += 1) {
  urls.push(`https://www.pttweb.cc/user/${userId}?t=article&page=${page}`);
  urls.push(`https://www.pttweb.cc/user/${userId}?t=message&page=${page}`);
}

for (const url of urls) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  const html = await response.text();
  const userLinks = [...html.matchAll(new RegExp(`href="(/user/${userId}[^"]*)"` , "g"))].map((match) => match[1]);
  console.log({
    url,
    status: response.status,
    hasArticlesText: html.includes("最新的發文"),
    hasRepliesText: html.includes("最新的留言"),
    bbsLinks: html.split('href="/bbs/').length - 1,
    userLinks: [...new Set(userLinks)].slice(0, 20),
  });
}
