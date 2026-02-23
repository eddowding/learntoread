// Cloudflare Worker: WebSocket proxy for Deepgram speech-to-text
// 1:1 proxy — client <-> Deepgram, API key stays server-side

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(env),
      });
    }

    // Only accept WebSocket upgrades
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Origin check
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
    if (!allowed.includes(origin) && !origin.includes('localhost')) {
      return new Response('Forbidden', { status: 403 });
    }

    // Parse query params for Deepgram options
    const url = new URL(request.url);
    const keywords = url.searchParams.get('keywords') || '';

    // Build Deepgram URL
    const dgParams = new URLSearchParams({
      model: 'nova-2',
      language: 'en-GB',
      punctuate: 'false',
      interim_results: 'true',
      encoding: 'opus',
      container: 'webm',
      smart_format: 'false',
    });
    if (keywords) {
      keywords.split(',').forEach(kw => dgParams.append('keywords', kw.trim()));
    }
    const dgUrl = 'wss://api.deepgram.com/v1/listen?' + dgParams.toString();

    // Create client WebSocket pair
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    // Connect to Deepgram
    let dgSocket;
    try {
      dgSocket = new WebSocket(dgUrl, {
        headers: {
          Authorization: 'Token ' + env.DEEPGRAM_API_KEY,
        },
      });
    } catch (e) {
      server.close(1011, 'Failed to connect to speech service');
      return new Response(null, { status: 101, webSocket: client });
    }

    // Pipe: client audio -> Deepgram
    server.addEventListener('message', (event) => {
      if (dgSocket.readyState === WebSocket.OPEN) {
        dgSocket.send(event.data);
      }
    });

    // Pipe: Deepgram transcripts -> client
    dgSocket.addEventListener('message', (event) => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(event.data);
      }
    });

    // Handle close from either side
    server.addEventListener('close', () => {
      try {
        // Send CloseStream to Deepgram for graceful shutdown
        if (dgSocket.readyState === WebSocket.OPEN) {
          dgSocket.send(JSON.stringify({ type: 'CloseStream' }));
          dgSocket.close();
        }
      } catch (e) { /* ignore */ }
    });

    dgSocket.addEventListener('close', () => {
      try {
        if (server.readyState === WebSocket.OPEN) {
          server.close(1000, 'Upstream closed');
        }
      } catch (e) { /* ignore */ }
    });

    dgSocket.addEventListener('error', () => {
      try {
        if (server.readyState === WebSocket.OPEN) {
          server.close(1011, 'Upstream error');
        }
      } catch (e) { /* ignore */ }
    });

    return new Response(null, { status: 101, webSocket: client });
  },
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
  };
}
