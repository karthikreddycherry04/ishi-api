export const config = { runtime: 'edge' };
 
export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
 
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
 
  let body;
  try { body = await req.json(); } 
  catch(e) { return new Response(JSON.stringify({error:'bad json'}), {status:400, headers:cors}); }
 
  const { system, messages } = body;
 
  // Build Gemini request - keep it minimal
  const geminiBody = {
    contents: messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content) }]
    })),
    generationConfig: { maxOutputTokens: 250, temperature: 0.9 }
  };
 
  // Add system instruction only if present
  if (system) {
    geminiBody.system_instruction = { parts: [{ text: String(system) }] };
  }
 
  const key = process.env.GEMINI_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`;
 
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });
 
    const data = await r.json();
    console.log('STATUS:', r.status, 'BODY:', JSON.stringify(data).slice(0, 300));
 
    if (!r.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'gemini error' }), { status: 500, headers: cors });
    }
 
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "i'm here with you.";
    return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status: 200, headers: cors });
 
  } catch(e) {
    console.error('FETCH ERROR:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
}
 
