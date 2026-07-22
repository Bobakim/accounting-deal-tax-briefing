// Vercel Serverless Function: proxies Naver's official News Search API.
// Requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET to be set as Vercel project
// environment variables (Settings > Environment Variables). Keys never reach
// the browser — this function is the only thing that calls Naver directly.

function stripHtml(text) {
  return String(text || "")
    .replace(/<\/?b>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

module.exports = async (req, res) => {
  const query = (req.query.q || "").toString().trim();

  if (!query) {
    res.status(400).json({ error: "검색어를 입력해주세요." });
    return;
  }
  if (query.length > 100) {
    res.status(400).json({ error: "검색어가 너무 깁니다." });
    return;
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).json({
      error:
        "네이버 API 키가 설정되지 않았습니다. Vercel 프로젝트의 Environment Variables에서 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET을 등록해주세요.",
    });
    return;
  }

  const url =
    "https://openapi.naver.com/v1/search/news.json?display=10&sort=date&query=" +
    encodeURIComponent(query);

  try {
    const naverRes = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!naverRes.ok) {
      res.status(naverRes.status).json({
        error: "네이버 검색 API 호출에 실패했습니다 (status " + naverRes.status + ").",
      });
      return;
    }

    const data = await naverRes.json();
    const items = (data.items || []).map((item) => ({
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      link: item.originallink || item.link,
      pubDate: item.pubDate || "",
    }));

    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: "검색 중 오류가 발생했습니다." });
  }
};
