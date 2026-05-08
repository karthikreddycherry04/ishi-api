export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  try {
    const { system, messages } = req.body;
 
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
 
    const geminiBody = {
      system_instruction: { parts: [{ text: system }] },
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.9
      }
    };
 
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      }
    );
 
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here. Take your time.";
 
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });
 
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
 

