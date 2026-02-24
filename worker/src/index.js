// Cloudflare Worker: speech proxy + temporary key endpoint for Deepgram
// Two modes:
//   GET /token  — creates a short-lived Deepgram API key for direct browser connection
//   WSS /       — 1:1 WebSocket proxy (fallback), accepts encoding params from client

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
    const originAllowed = allowed.includes(origin) || origin.includes('localhost');

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    // --- Token endpoint: create short-lived Deepgram key ---
    if (url.pathname === '/token' && request.method === 'GET') {
      if (!originAllowed) {
        return new Response('Forbidden', { status: 403 });
      }

      try {
        // Get project ID from Deepgram
        const projRes = await fetch('https://api.deepgram.com/v1/projects', {
          headers: { 'Authorization': 'Token ' + env.DEEPGRAM_API_KEY }
        });
        if (!projRes.ok) throw new Error('Failed to list projects: ' + projRes.status);
        const projData = await projRes.json();
        const projectId = projData.projects && projData.projects[0] && projData.projects[0].project_id;
        if (!projectId) throw new Error('No Deepgram project found');

        // Create temporary key (2 minutes)
        const keyRes = await fetch('https://api.deepgram.com/v1/keys/' + projectId, {
          method: 'POST',
          headers: {
            'Authorization': 'Token ' + env.DEEPGRAM_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            comment: 'learntoread-session',
            scopes: ['usage:write'],
            time_to_live_in_seconds: 120
          })
        });
        if (!keyRes.ok) throw new Error('Failed to create temp key: ' + keyRes.status);
        const keyData = await keyRes.json();

        return new Response(JSON.stringify({ key: keyData.key }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Cache-Control': 'no-store'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin
          }
        });
      }
    }

    // --- WebSocket proxy ---
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    if (!originAllowed) {
      return new Response('Forbidden', { status: 403 });
    }

    // Read client-specified params
    const keywords = url.searchParams.get('keywords') || '';
    const clientEncoding = url.searchParams.get('encoding');
    const clientSampleRate = url.searchParams.get('sample_rate');

    // Build Deepgram URL
    const dgParams = new URLSearchParams({
      model: 'nova-2',
      language: 'en-GB',
      punctuate: 'false',
      interim_results: 'true',
      smart_format: 'false',
    });

    // Use client-specified encoding (AudioWorklet PCM) or default (MediaRecorder opus)
    if (clientEncoding === 'linear16') {
      dgParams.set('encoding', 'linear16');
      dgParams.set('sample_rate', clientSampleRate || '48000');
      dgParams.set('channels', '1');
    } else {
      dgParams.set('encoding', 'opus');
      dgParams.set('container', 'webm');
    }

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

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
  };
}
