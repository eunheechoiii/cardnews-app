export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // API Key 확인
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'API Key가 설정되지 않았습니다.' } });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(), // 공백 제거
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text(); // JSON 파싱 전에 텍스트로 먼저 받기

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return res.status(500).json({ 
        error: { message: 'API 응답 파싱 실패: ' + text.slice(0, 300) }
      });
    }

    // 오류 응답이면 그대로 전달
    if (data.error) {
      return res.status(response.status).json(data);
    }

    // content 없으면 상세 내용 반환
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      return res.status(500).json({ 
        error: { message: '응답 구조 오류: ' + JSON.stringify(data).slice(0, 300) }
      });
    }

    return res.status(200).json(data);

  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
