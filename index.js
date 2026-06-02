const url = require('url');

module.exports = async (request, response) => {
  // Setel Header CORS agar bisa diakses dari Chub AI / SillyTavern
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', '*');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Ambil jalur URL asli
  let pathname = request.url;
  if (pathname.includes("/chat/completions")) {
    pathname = "/v1beta/openai/chat/completions";
  } else if (!pathname.startsWith("/v1beta")) {
    pathname = "/v1beta/openai" + pathname;
  }

  const targetUrl = "https://generativelanguage.googleapis.com" + pathname;

  // Saring parameter OpenAI yang dibenci Google Gemini
  let modifiedBody = null;
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    try {
      let bodyJson = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      
      delete bodyJson.frequency_penalty;
      delete bodyJson.repetition_penalty;
      delete bodyJson.presence_penalty;
      delete bodyJson.top_k;
      
      modifiedBody = JSON.stringify(bodyJson);
    } catch (e) {
      modifiedBody = JSON.stringify(request.body);
    }
  }

  try {
    const fetchResponse = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: modifiedBody
    });

    const data = await fetchResponse.text();
    return response.status(fetchResponse.status).send(data);
  } catch (error) {
    return response.status(500).send("Error Proxy Vercel: " + error.message);
  }
};
