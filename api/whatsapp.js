/**
 * ======================================================================
 * KOURI + — Vercel Serverless Function: /api/whatsapp
 * Secure proxy to CVISUAL WhatsApp Gateway on Vercel
 * ======================================================================
 */

const { CvisualWhatsAppClient } = require('../backend/whatsapp-gateway.js');

const waClient = new CvisualWhatsAppClient({
  apiKey: process.env.CVISUAL_WA_API_KEY || 'cv_live_laurore9_ec0b28c5a0b729162c63c6e2',
  baseUrl: process.env.CVISUAL_WA_BASE_URL || 'https://cvisual-whatsapp-gateway.onrender.com',
  webhookSecret: process.env.CVISUAL_WA_WEBHOOK_SECRET || 'kouri_wa_secret_2026_webhook'
});

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = req.url || '';
  const pathname = url.split('?')[0];
  const subroute = pathname.replace('/api/whatsapp', '') || req.query?.action || '';

  try {
    if (subroute === '/me' || subroute === 'me') {
      const data = await waClient.getMe();
      return res.status(200).json(data);
    }

    if (subroute === '/status' || subroute === 'status') {
      const data = await waClient.getStatus();
      return res.status(200).json(data);
    }

    if ((subroute === '/check-numbers' || subroute === 'check-numbers') && req.method === 'POST') {
      const body = req.body || {};
      const data = await waClient.checkNumbers(body.phones || []);
      return res.status(200).json(data);
    }

    if ((subroute === '/send' || subroute === 'send') && req.method === 'POST') {
      const body = req.body || {};
      const idempotencyKey = req.headers['idempotency-key'] || body.idempotencyKey;
      const data = await waClient.sendMessage({ ...body, idempotencyKey });
      return res.status(200).json(data);
    }

    if ((subroute === '/notify-event' || subroute === 'notify-event') && req.method === 'POST') {
      const body = req.body || {};
      const eventType = body.event || body.type;
      const result = await waClient.triggerEvent(eventType, body.data || body);
      return res.status(200).json(result);
    }

    if (subroute === '/messages' || subroute === 'messages') {
      const data = await waClient.getMessages();
      return res.status(200).json(data);
    }

    // Default status info
    const status = await waClient.getStatus();
    return res.status(200).json({ ok: true, service: 'KOURI + WhatsApp Gateway Proxy', ...status });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      ok: false,
      error: err.message,
      code: err.code,
      response: err.response
    });
  }
};