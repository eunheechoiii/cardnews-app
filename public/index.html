export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: { message: 'API Key가 설정되지 않았습니다.' } });

    const { articleUrl, prompt, system } = req.body;

    // 1. 기사 URL 크롤링
    let articleText = '';
    if (articleUrl) {
      try {
        const pageRes = await fetch(articleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          }
        });
        const html = await pageRes.text();

        // 태그 제거해서 텍스트만 추출
        articleText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000); // 너무 길면 앞 3000자만

      } catch(crawlErr) {
        articleText = '크롤링 실패: ' + crawlErr.message;
      }
    }

    // 2. Claude에게 기사 본문 포함해서 요청
    const finalPrompt = articleText
      ? `다음은 기사 본문입니다:\n\n${articleText}\n\n---\n\n${prompt}`
      : prompt;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: system,
        messages: [{ role: 'user', content: finalPrompt }]
      })
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(500).json({ error: { message: 'API 응답 파싱 실패: ' + text.slice(0, 200) } }); }

    if (data.error) return res.status(response.status).json(data);
    if (!data.content || !data.content[0]) return res.status(500).json({ error: { message: '응답 오류: ' + JSON.stringify(data).slice(0, 200) } });

    return res.status(200).json(data);

  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
