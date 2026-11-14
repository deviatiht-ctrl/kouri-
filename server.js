/**
 * ======================================================================
 * KOURI — Production Backend Server (server.js)
 * Zero external dependencies (runs with pure Node.js 18+).
 * 1. Serves static files with strict NO-CACHE headers for HTML (Fixes Ctrl+Shift+R!)
 * 2. Secure REST Proxy for CVISUAL WhatsApp Gateway (API Key never leaks to browser)
 * 3. Automatic Ride & Registration WhatsApp Notifications
 * 4. Webhook Receiver with HMAC-SHA256 signature verification
 * ======================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const { CvisualWhatsAppClient } = require('./backend/whatsapp-gateway.js');

const waClient = new CvisualWhatsAppClient({
  apiKey: process.env.CVISUAL_WA_API_KEY || 'cv_live_laurore9_ec0b28c5a0b729162c63c6e2',
  baseUrl: process.env.CVISUAL_WA_BASE_URL || 'https://cvisual-whatsapp-gateway.onrender.com',
  webhookSecret: process.env.CVISUAL_WA_WEBHOOK_SECRET || 'kouri_wa_secret_2026_webhook'
});

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function sendJson(res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': Buffer.byteLength(jsonStr),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key'
  });
  res.end(jsonStr);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key'
    });
    res.end();
    return;
  }

  // ====================================================================
  // BACKEND API ROUTES (/api/whatsapp/...)
  // ====================================================================

  // 1. WhatsApp Health & Me
  if (pathname === '/api/whatsapp/me' && req.method === 'GET') {
    try {
      const data = await waClient.getMe();
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, err.statusCode || 500, { ok: false, error: err.message, code: err.code });
    }
  }

  // 2. WhatsApp Status (Cluster & SIM Lines)
  if (pathname === '/api/whatsapp/status' && req.method === 'GET') {
    try {
      const data = await waClient.getStatus();
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, err.statusCode || 500, { ok: false, error: err.message, code: err.code });
    }
  }

  // 3. Check WhatsApp Numbers
  if (pathname === '/api/whatsapp/check-numbers' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const data = await waClient.checkNumbers(body.phones || []);
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, err.statusCode || 500, { ok: false, error: err.message, code: err.code });
    }
  }

  // 4. Send Custom WhatsApp Message (Fast vs Slow lane)
  if (pathname === '/api/whatsapp/send' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const idempotencyKey = req.headers['idempotency-key'] || body.idempotencyKey;
      const data = await waClient.sendMessage({ ...body, idempotencyKey });
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, err.statusCode || 500, { ok: false, error: err.message, code: err.code, response: err.response });
    }
  }

  // 5. Automatic Event Dispatcher (welcome, ride_requested, driver_assigned, driver_arrived, ride_completed)
  if (pathname === '/api/whatsapp/notify-event' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const eventType = body.event || body.type;
      const result = await waClient.triggerEvent(eventType, body.data || body);
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 6. Recent Messages History
  if (pathname === '/api/whatsapp/messages' && req.method === 'GET') {
    try {
      const data = await waClient.getMessages();
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, err.statusCode || 500, { ok: false, error: err.message });
    }
  }

  // 7. Webhook Receiver (HMAC-SHA256 verified)
  if (pathname === '/api/whatsapp/webhook' && req.method === 'POST') {
    let rawBody = '';
    req.on('data', chunk => rawBody += chunk);
    req.on('end', () => {
      const signature = req.headers['x-cvisual-signature'];
      const timestamp = req.headers['x-cvisual-timestamp'] || '';

      const isValid = waClient.verifyWebhookSignature(signature, rawBody, timestamp);
      if (!isValid && process.env.NODE_ENV === 'production') {
        return sendJson(res, 401, { error: 'Invalid HMAC signature' });
      }

      console.log('[KOURI Webhook] WhatsApp event received:', rawBody.slice(0, 160));
      return sendJson(res, 200, { received: true });
    });
    return;
  }

  // ====================================================================
  // STATIC FILE SERVING (WITH ZERO-STALE CACHE HEADERS FOR HTML)
  // ====================================================================
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let filePath = path.join(ROOT_DIR, safePath);

  // If path has no extension and directory doesn't exist, try appending .html
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 Not Found
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Paj sa a pa egziste sou KOURI.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size
    };

    // CRITICAL: Prevent HTML files from being cached by browser!
    // This permanently eliminates the need for users to press Ctrl+Shift+R!
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else if (ext === '.css' || ext === '.js') {
      headers['Cache-Control'] = 'public, max-age=60'; // Short cache for dev/live reload
    } else {
      headers['Cache-Control'] = 'public, max-age=86400';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 KOURI Server running at: http://localhost:${PORT}`);
  console.log(`📡 CVISUAL WhatsApp Gateway: READY on ${waClient.baseUrl}`);
  console.log(`⚡ Zero-Stale HTML Cache: ACTIVE (No Ctrl+Shift+R needed!)`);
  console.log(`======================================================\n`);
});
