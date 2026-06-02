export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        }
      });
    }

    const url = new URL(request.url);
    let pathname = url.pathname;

    // Memastikan endpoint mengarah ke v1beta OpenAI milik Google
    if (pathname.includes("/chat/completions")) {
      pathname = "/v1beta/openai/chat/completions";
    }

    const targetUrl = "https://generativelanguage.googleapis.com" + pathname + url.search;

    let requestInit = {
      method: request.method,
      headers: new Headers(request.headers),
    };

    // Proses penyaringan parameter agar tidak eror 400 di Google
    if (request.method !== "GET" && request.method !== "HEAD") {
      let bodyText = await request.text();
      try {
        let bodyJson = JSON.parse(bodyText);
        
        // Hapus parameter OpenAI yang tidak didukung Google Gemini
        delete bodyJson.frequency_penalty;
        delete bodyJson.repetition_penalty;
        delete bodyJson.presence_penalty;
        delete bodyJson.top_k;
        
        requestInit.body = JSON.stringify(bodyJson);
        requestInit.headers.delete("content-length");
      } catch (e) {
        requestInit.body = bodyText; 
      }
    }

    try {
      const response = await fetch(targetUrl, requestInit);
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (e) {
      return new Response("Error Proxy: " + e.message, {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};
