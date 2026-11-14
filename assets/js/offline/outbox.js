/**
 * ======================================================================
 * KOURI — Outbox Queue Manager (outbox.js)
 * Queues offline state transitions with idempotency keys and GPS coordinates.
 * Safely computes offline fare according to the pricing snapshot.
 * ======================================================================
 */

function generateIdempotencyKey() {
  return 'idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

class OutboxManager {
  constructor() {
    this.db = window.offlineDB;
  }

  /**
   * Enqueue a ride state transition locally
   */
  async queueTransition(tripId, status, payload = {}, coords = null) {
    const store = await this.db.getStore('outbox', 'readwrite');
    const idempotencyKey = generateIdempotencyKey();

    const record = {
      idempotency_key: idempotencyKey,
      trip_id: tripId,
      action: 'UPDATE_STATUS',
      status: status, // 'accepted', 'arrived', 'in_progress', 'completed', 'paid'
      payload: payload,
      coords: coords || null, // { lat, lng }
      sync_status: 'pending', // 'pending', 'synced', 'failed', 'conflict'
      created_at: new Date().toISOString(),
      retry_count: 0
    };

    return new Promise((resolve, reject) => {
      const req = store.add(record);
      req.onsuccess = () => {
        // Also update the local active trip state immediately
        this.updateLocalTripState(tripId, status, payload);
        resolve(record);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async updateLocalTripState(tripId, status, payload) {
    try {
      const trip = await this.db.getActiveTrip(tripId) || { id: tripId };
      trip.status = status;
      trip.last_updated = new Date().toISOString();
      if (payload) {
        Object.assign(trip, payload);
      }
      await this.db.saveActiveTrip(trip);
    } catch (e) {
      console.warn('[KOURI Outbox] Could not update local trip state:', e);
    }
  }

  async getPendingActions() {
    const store = await this.db.getStore('outbox', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        const pending = list.filter(item => item.sync_status === 'pending');
        resolve(pending);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async markActionStatus(idempotencyKey, syncStatus, response = null) {
    const store = await this.db.getStore('outbox', 'readwrite');
    return new Promise((resolve, reject) => {
      const getReq = store.get(idempotencyKey);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (!item) return resolve(false);
        item.sync_status = syncStatus;
        item.synced_at = new Date().toISOString();
        if (response) item.server_response = response;
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = (e) => reject(e.target.error);
      };
      getReq.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Deterministic fare calculation at drop-off offline
   * Uses the immutable pricing_snapshot stored at ride acceptance time
   */
  calculateOfflineFare(pricingSnapshot, actualDistanceKm, actualDurationMin) {
    if (!pricingSnapshot) {
      return { total_fare: 150.0, is_fallback: true };
    }

    // If it was a fixed zone-to-zone fare agreed upon:
    if (pricingSnapshot.is_zone_fare && pricingSnapshot.zone_price) {
      return {
        total_fare: pricingSnapshot.zone_price,
        is_zone_fare: true,
        multiplier: pricingSnapshot.multiplier || 1.0
      };
    }

    // Distance-based with guaranteed minimum fare
    const baseFare = parseFloat(pricingSnapshot.base_fare) || 250;
    const perKm = parseFloat(pricingSnapshot.per_km_rate) || 65;
    const perMin = parseFloat(pricingSnapshot.per_min_rate) || 12;
    const minFare = parseFloat(pricingSnapshot.min_fare) || 350;
    const multiplier = parseFloat(pricingSnapshot.multiplier) || 1.0;

    const rawFare = baseFare + (actualDistanceKm * perKm) + (actualDurationMin * perMin);
    const subtotal = Math.max(rawFare, minFare);
    const finalFare = Math.round(subtotal * multiplier);

    // Rule: Never lower than the agreed estimate unless admin policy allows
    const estimated = parseFloat(pricingSnapshot.estimated_fare || pricingSnapshot.total_fare || 0);
    const enforcedFare = Math.max(finalFare, estimated);

    return {
      total_fare: enforcedFare,
      base_fare: baseFare,
      actual_distance_km: actualDistanceKm,
      actual_duration_min: actualDurationMin,
      multiplier: multiplier,
      is_zone_fare: false
    };
  }
}

window.outbox = new OutboxManager();
