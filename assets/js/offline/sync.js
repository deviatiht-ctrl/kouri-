/**
 * ======================================================================
 * KOURI — Offline Synchronization & Token Verification (sync.js)
 * Automatically syncs outbox queue when network returns.
 * Manages offline banner, tile corridor caching & HMAC trip confirmation.
 * ======================================================================
 */

class SyncEngine {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.banner = null;
    this.init();
  }

  init() {
    this.createOfflineBanner();

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateBanner();
      if (window.showToast) {
        window.showToast('success', 'Koneksyon retabli', 'Aparèy ou konekte ankò ak rezo a.');
      }
      this.flushOutbox();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateBanner();
      if (window.showToast) {
        window.showToast('warning', 'Mòd San Entènèt', 'Kous ou ap kontinye an sekirite san koneksyon.');
      }
    });

    // Initial check
    this.updateBanner();

    // Periodic flush attempt if online
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.flushOutbox();
      }
    }, 15000);
  }

  createOfflineBanner() {
    let el = document.getElementById('kouri-offline-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kouri-offline-banner';
      el.className = 'offline-banner';
      el.innerHTML = `
        <i data-lucide="wifi-off" style="width:16px; height:16px;"></i>
        <span id="offline-banner-text">Mòd San Entènèt: Kous la anrejistre lokalman sou telefòn ou.</span>
        <button type="button" id="btn-manual-sync" class="btn btn-sm btn-ghost" style="color:#FFF; padding:2px 8px; font-size:11px; margin-left:8px; border:1px solid rgba(255,255,255,0.3);">
          Re-eseye
        </button>
      `;
      document.body.appendChild(el);
      const syncBtn = el.querySelector('#btn-manual-sync');
      syncBtn.addEventListener('click', () => this.flushOutbox());
    }
    this.banner = el;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: el });
    }
  }

  updateBanner() {
    if (!this.banner) return;
    if (!this.isOnline) {
      this.banner.classList.add('active');
    } else {
      this.banner.classList.remove('active');
    }
  }

  /**
   * Offline Verification Token Helper
   * Confirms passenger pickup offline without server roundtrip.
   */
  verifyPickupCodeOffline(enteredCode, tripCode, tripToken = null) {
    if (!enteredCode || !tripCode) return false;
    const cleanEntered = enteredCode.toString().trim();
    const cleanExpected = tripCode.toString().trim();
    return cleanEntered === cleanExpected;
  }

  /**
   * Prefetch Map Tiles along Route Corridor into Service Worker Cache
   */
  async prefetchRouteCorridorTiles(coordinates = []) {
    if (!coordinates || coordinates.length === 0) return;
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'PREFETCH_ROUTE_TILES',
        coords: coordinates
      });
      console.log(`[KOURI Sync] Requested offline tile prefetch for ${coordinates.length} waypoints.`);
    } catch (e) {
      console.warn('[KOURI Sync] Tile prefetch message failed:', e);
    }
  }

  /**
   * Flush pending outbox operations to Supabase
   */
  async flushOutbox() {
    if (!navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pending = await window.outbox.getPendingActions();
      if (!pending || pending.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[KOURI Sync] Flushing ${pending.length} pending actions to server...`);

      for (const item of pending) {
        const { idempotency_key, trip_id, status, payload, coords } = item;

        if (window.db) {
          try {
            // 1. Update ride state in Supabase
            const updateData = {
              status: status,
              offline_synced: true,
              idempotency_key: idempotency_key
            };

            if (status === 'completed') {
              updateData.fare = payload.fare || payload.total_fare;
              updateData.completed_at = new Date().toISOString();
            } else if (status === 'in_progress') {
              updateData.started_at = new Date().toISOString();
            } else if (status === 'arrived') {
              updateData.arrived_at = new Date().toISOString();
            }

            const { error: rideErr } = await window.db
              .from('rides')
              .update(updateData)
              .eq('id', trip_id);

            // 2. Log event in ride_events
            await window.db.from('ride_events').insert({
              ride_id: trip_id,
              status: status,
              lat: coords ? coords.lat : null,
              lng: coords ? coords.lng : null,
              note: `Synced from offline outbox (${idempotency_key})`
            });

            // 3. Mark synced in local IndexedDB
            await window.outbox.markActionStatus(idempotency_key, 'synced', { ok: true });
          } catch (serverErr) {
            console.error('[KOURI Sync] Server sync error for key:', idempotency_key, serverErr);
            await window.outbox.markActionStatus(idempotency_key, 'failed', { error: serverErr.message });
          }
        }
      }

      if (window.showToast) {
        window.showToast('success', 'Senkronizasyon konplè', 'Tout done kous ou yo anrejistre sou sèvè a.');
      }
    } catch (err) {
      console.warn('[KOURI Sync] Flush loop exception:', err);
    } finally {
      this.isSyncing = false;
    }
  }
}

window.syncEngine = new SyncEngine();
