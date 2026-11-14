/**
 * ======================================================================
 * KOURI — IndexedDB Storage Engine (db.js)
 * Persistent offline storage for active trip state machine, outbox queue,
 * compressed GPS breadcrumbs, and cached geocoding/tiles.
 * ======================================================================
 */

const DB_NAME = 'kouri_offline_db';
const DB_VERSION = 2;

class OfflineDB {
  constructor() {
    this.db = null;
    this.readyPromise = this.openDB();
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Active trip state machine store (single active trip record)
        if (!db.objectStoreNames.contains('active_trip')) {
          db.createObjectStore('active_trip', { keyPath: 'id' });
        }

        // 2. Outbox queue for offline actions to be synced
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'idempotency_key' });
          outboxStore.createIndex('idx_status', 'status', { unique: false });
          outboxStore.createIndex('idx_created_at', 'created_at', { unique: false });
        }

        // 3. GPS Breadcrumbs recorded during offline trip
        if (!db.objectStoreNames.contains('gps_traces')) {
          const gpsStore = db.createObjectStore('gps_traces', { autoIncrement: true });
          gpsStore.createIndex('idx_trip_id', 'trip_id', { unique: false });
          gpsStore.createIndex('idx_timestamp', 'timestamp', { unique: false });
        }

        // 4. Geocoding / Search Cache (IndexedDB for fast offline place search)
        if (!db.objectStoreNames.contains('geocoding_cache')) {
          db.createObjectStore('geocoding_cache', { keyPath: 'query' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[KOURI DB] IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    await this.readyPromise;
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // Active Trip State Machine
  async saveActiveTrip(tripData) {
    const store = await this.getStore('active_trip', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(tripData);
      req.onsuccess = () => resolve(tripData);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getActiveTrip(tripId = null) {
    const store = await this.getStore('active_trip', 'readonly');
    return new Promise((resolve, reject) => {
      if (tripId) {
        const req = store.get(tripId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e.target.error);
      } else {
        // Return latest/first active trip
        const req = store.openCursor(null, 'prev');
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          resolve(cursor ? cursor.value : null);
        };
        req.onerror = (e) => reject(e.target.error);
      }
    });
  }

  async clearActiveTrip(tripId) {
    const store = await this.getStore('active_trip', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(tripId);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // GPS Traces
  async recordGPSPoint(tripId, lat, lng, speed = 0, heading = 0) {
    const store = await this.getStore('gps_traces', 'readwrite');
    const point = {
      trip_id: tripId,
      lat,
      lng,
      speed,
      heading,
      timestamp: Date.now()
    };
    return new Promise((resolve, reject) => {
      const req = store.add(point);
      req.onsuccess = () => resolve(point);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getGPSTraces(tripId) {
    const store = await this.getStore('gps_traces', 'readonly');
    const index = store.index('idx_trip_id');
    return new Promise((resolve, reject) => {
      const req = index.getAll(tripId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // Geocoding Cache
  async getCachedGeocode(query) {
    const store = await this.getStore('geocoding_cache', 'readonly');
    return new Promise((resolve) => {
      const req = store.get(query.trim().toLowerCase());
      req.onsuccess = () => resolve(req.result ? req.result.results : null);
      req.onerror = () => resolve(null);
    });
  }

  async setCachedGeocode(query, results) {
    const store = await this.getStore('geocoding_cache', 'readwrite');
    return new Promise((resolve) => {
      const req = store.put({
        query: query.trim().toLowerCase(),
        results,
        cached_at: Date.now()
      });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }
}

window.offlineDB = new OfflineDB();
