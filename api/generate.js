export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: { message: 'API Key가 설정되지 않았습니다.' } });

    const { articleUrl, system } = req.body;

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
        articleText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000);
      } catch(crawlErr) {
        articleText = '크롤링 실패: ' + crawlErr.message;
      }
    }

    // 2. 프롬프트 직접 구성 (post 필드 포함)
    const { tone, style, extra } = req.body;

    const finalPrompt = `다음은 기사 본문입니다:

${articleText}

---

위 기사 본문을 바탕으로 이든에듀 브랜드 카드뉴스용 JSON을 만들어주세요.
톤: ${tone}
스타일: ${style}
${extra ? '추가 지시사항: ' + extra : ''}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 없이 순수 JSON만 출력하세요:
{
  "tag": "카테고리 태그 (10자 이내)",
  "title": "메인 제목 (임팩트 있게, 30자 이내)",
  "subtitle": "부제목 (50자 이내)",
  "date": "YYYY.MM.DD",
  "source": "출처 기관/매체명",
  "stats": [
    {"value": "숫자", "unit": "단위", "label": "설명"},
    {"value": "숫자", "unit": "단위", "label": "설명"},
    {"value": "숫자", "unit": "단위", "label": "설명"}
  ],
  "points": [
    {"title": "핵심포인트1", "body": "설명"},
    {"title": "핵심포인트2", "body": "설명"},
    {"title": "핵심포인트3", "body": "설명"},
    {"title": "핵심포인트4", "body": "설명"}
  ],
  "timeline": [
    {"label": "단계1", "text": "설명"},
    {"label": "단계2", "text": "설명"},
    {"label": "단계3", "text": "설명"}
  ],
  "quote": {"text": "핵심 메시지 (70자 이내)", "source": "출처"},
  "summary": "전체 요약 및 시사점 (100자 이내)",
  "post": "SNS 게시물용 텍스트. 5문장. 각 문장은 줄바꿈(\\n)으로 구분. 이모지 포함. 핵심 내용을 쉽고 친근하게. 마지막 줄은 해시태그 3~5개."
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
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
