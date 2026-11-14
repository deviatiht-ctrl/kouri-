/**
 * ======================================================================
 * KOURI — CVISUAL WhatsApp Gateway Client (whatsapp-gateway.js)
 * REST Client for CVISUAL WhatsApp Gateway Multi-Tenant API.
 * Dual-Lane routing: Fast Lane (instant) vs Slow Lane (campaigns/reminders).
 * ======================================================================
 */

const https = require('https');
const crypto = require('crypto');

class CvisualWhatsAppClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.CVISUAL_WA_API_KEY;
    this.baseUrl = (config.baseUrl || process.env.CVISUAL_WA_BASE_URL || 'https://cvisual-whatsapp-gateway.onrender.com').replace(/\/+$/, '');
    this.webhookSecret = config.webhookSecret || process.env.CVISUAL_WA_WEBHOOK_SECRET || '';

    if (!this.apiKey) {
      console.warn('[CVISUAL WA] Warning: CVISUAL_WA_API_KEY is not defined in environment.');
    }
  }

  /**
   * Format phone number: auto-prepends 509 for 8-digit Haitian numbers (e.g. 31234567 -> 50931234567)
   * Strips '+' and non-digit characters.
   */
  formatPhone(phone) {
    if (!phone) return '';
    let digits = phone.toString().replace(/\D/g, '');

    // Haitian 8-digit local mobile numbers (e.g., 37123456, 48112233)
    if (digits.length === 8) {
      digits = '509' + digits;
    }
    return digits;
  }

  /**
   * Internal HTTP Request with full status code handling
   */
  request(method, endpoint, data = null, customHeaders = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const postData = data ? JSON.stringify(data) : null;

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...customHeaders
      };

      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch (e) {
            parsed = { raw: responseBody };
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            const error = new Error(parsed.message || parsed.detail || `WhatsApp API error HTTP ${res.statusCode}`);
            error.statusCode = res.statusCode;
            error.response = parsed;

            switch (res.statusCode) {
              case 400:
                error.code = 'BAD_REQUEST';
                break;
              case 401:
                error.code = 'UNAUTHORIZED';
                break;
              case 413:
                error.code = 'PAYLOAD_TOO_LARGE';
                break;
              case 422:
                error.code = 'INVALID_LANE_OR_PARAMS';
                break;
              case 429:
                error.code = 'RATE_LIMIT_OR_DAILY_CAP';
                break;
              case 503:
                error.code = 'WHATSAPP_OFFLINE';
                break;
              default:
                error.code = 'GATEWAY_ERROR';
            }
            reject(error);
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  /**
   * Health Check
   */
  async getHealth() {
    const res = await this.request('GET', '/health');
    return res.data;
  }

  /**
   * Tenant profile & usage stats
   */
  async getMe() {
    const res = await this.request('GET', '/api/v1/me');
    return res.data;
  }

  /**
   * Cluster lines & lanes status
   */
  async getStatus() {
    const res = await this.request('GET', '/api/v1/status');
    return res.data;
  }

  /**
   * Check if numbers have WhatsApp accounts
   */
  async checkNumbers(phones = []) {
    const formatted = phones.map(p => this.formatPhone(p)).filter(Boolean);
    const res = await this.request('POST', '/api/v1/numbers/check', { phones: formatted });
    return res.data;
  }

  /**
   * Send WhatsApp Message (Dual-Lane compliant)
   * @param {Object} opts
   * @param {string} opts.to - Destination phone (local or international)
   * @param {string} opts.message - Message body (supports Spintax: {Bonjou|Bonswa})
   * @param {string} opts.kind - 'receipt'|'welcome'|'otp'|'test'|'manual_direct' (Fast) OR 'reminder'|'marketing'|'manual' (Slow)
   * @param {string} [opts.mode='async'] - 'async' (default, 202) or 'sync' (200, Fast Lane only)
   * @param {string} [opts.pdf_base64] - Optional base64 encoded PDF receipt
   * @param {string} [opts.pdf_file_name] - Optional name for the PDF (e.g. 'Recu_KOURI.pdf')
   * @param {string} [opts.idempotencyKey] - Optional deduplication key
   */
  async sendMessage(opts = {}) {
    const to = this.formatPhone(opts.to);
    if (!to || to.length < 8) {
      throw new Error('Nimewo telefòn lan pa valid. Tanpri verifye nimewo a.');
    }

    const kind = opts.kind || 'manual_direct';
    const isSlowLane = ['reminder', 'reminder_7d', 'reminder_2d', 'marketing', 'manual'].includes(kind);
    
    // Slow lane MUST use async mode
    const mode = isSlowLane ? 'async' : (opts.mode || 'async');

    const payload = {
      to,
      message: opts.message,
      kind,
      mode
    };

    if (opts.pdf_base64) {
      payload.pdf_base64 = opts.pdf_base64;
      payload.pdf_file_name = opts.pdf_file_name || 'Recu_KOURI.pdf';
    }

    const headers = {};
    if (opts.idempotencyKey) {
      headers['Idempotency-Key'] = opts.idempotencyKey;
    } else {
      headers['Idempotency-Key'] = `kouri_wa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    const res = await this.request('POST', '/api/v1/messages/send', payload, headers);
    return res.data;
  }

  /**
   * Get Recent Messages List
   */
  async getMessages() {
    const res = await this.request('GET', '/api/v1/messages');
    return res.data;
  }

  /**
   * Verify HMAC-SHA256 Webhook Signature
   */
  verifyWebhookSignature(signatureHeader, rawBody, timestamp) {
    if (!this.webhookSecret || !signatureHeader) return false;
    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const computed = 'sha256=' + hmac.update(timestamp + '.' + rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(computed));
    } catch (e) {
      return false;
    }
  }

  /**
   * High-Level Automatic Event Triggers
   */
  async triggerEvent(eventType, data = {}) {
    const { phone, name, rideId, tripCode, driverName, plate, fare, distance, address } = data;
    const recipientPhone = this.formatPhone(phone);

    if (!recipientPhone) {
      console.warn('[CVISUAL WA] Skipping triggerEvent: No phone number provided for', eventType);
      return { skipped: true, reason: 'missing_phone' };
    }

    let message = '';
    let kind = 'welcome';
    let mode = 'async';

    switch (eventType) {
      case 'welcome':
        kind = 'welcome';
        message = `{Bonjou|Bonswa} ${name || 'Chè Kliyan'}! Byenveni sou KOURI, platfòm transpò rapid e an sekirite nan Ayiti. Kont ou an kreye avèk siksè. Kòmande premye kous ou kounye a sou kouri.ht!`;
        break;

      case 'ride_requested':
        kind = 'otp';
        message = `🚗 KOURI — Kous ou an anrejistre!\nKòd sekirite ou pou bay chofè a se: *${tripCode || '------'}*.\nDepa: ${address || 'Pozisyon ou'}.\nN ap chèche chofè ki pi pre a pou ou kounye a.`;
        break;

      case 'driver_assigned':
        kind = 'receipt';
        message = `✅ KOURI — Chofè Asiyen!\nChofè *${driverName || 'Mackenzy Pierre'}* (Machin Plak: *${plate || 'AA-12345'}*) ap vini pran w.\nSonje prezante kòd PIN ou *${tripCode}* anvan ou monte.`;
        break;

      case 'driver_arrived':
        kind = 'receipt';
        message = `📍 KOURI — Chofè ou a rive sou plas!\n*${driverName || 'Chofè ou a'}* rive kote ou ye a. Tanpri rantre nan machin nan epi pataje kòd PIN sekirite w la.`;
        break;

      case 'ride_completed':
        kind = 'receipt';
        message = `🏁 KOURI — Kous Fini avèk Siksè!\nMontan total: *${fare || '0'} HTG* (${distance || '0'} km).\nMèsi paske w vwayaje ak KOURI! Ki jan kous ou a te pase? Evalye chofè w sou kouri.ht.`;
        break;

      default:
        kind = 'manual_direct';
        message = data.message || `Notifikasyon KOURI pou ou.`;
    }

    try {
      console.log(`[CVISUAL WA] Sending ${eventType} to ${recipientPhone} (kind=${kind})...`);
      const result = await this.sendMessage({
        to: recipientPhone,
        message,
        kind,
        mode
      });
      return { success: true, result };
    } catch (err) {
      console.error(`[CVISUAL WA] Error triggering ${eventType}:`, err.message);
      return { success: false, error: err.message, code: err.code };
    }
  }
}

module.exports = { CvisualWhatsAppClient };
