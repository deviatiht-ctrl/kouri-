/**
 * ======================================================================
 * KOURI — Modern Unified Map Engine (map.js)
 * 100% Free, Zero API Keys, Universal Hardware & Browser Compatibility.
 * - Base layers:
 *   1. Plan (CartoDB Positron - sleek minimal white/grey, ultra-fast)
 *   2. Satelit (Esri World Imagery - high resolution aerial photography)
 *   3. OpenStreetMap (Global open community street data)
 * - Custom SVG Markers: Pickup, Destination, Animated User Dot, Vehicle
 * - Real-time vehicle rotation with bearing/heading
 * - Draggable center pin for location picking
 * - Smooth camera navigation & route bounds fitting
 * ======================================================================
 */

import { createPulsingUserMarker, createPickupMarkerElement, createDestinationMarkerElement, createVehicleMarkerElement, createMapCenterPin } from './markers.js';
import { routingService } from './routing.js';
import { geocodingService } from './geocoding.js';

// 100% Free Tile Providers (No API key, ZERO watermarks, ultra-modern & crisp rendering)
const TILES = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b'],
      attribution: '&copy; OpenStreetMap contributors, Humanitarian Team'
    }
  },
  light: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: '&copy; Esri, HERE, Garmin'
    }
  },
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    }
  }
};

export class KouriMap {
  constructor(containerId = 'map', options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      center: [18.540, -72.300], // Port-au-Prince [lat, lng]
      zoom: 13,
      preferVector: false
    }, options);

    // Standardize center to [lat, lng]
    if (Array.isArray(this.options.center)) {
      // If passed as [lng, lat] (common in GeoJSON), flip to [lat, lng]
      if (this.options.center[0] < -50 && this.options.center[1] > 0) {
        this.options.center = [this.options.center[1], this.options.center[0]];
      }
    }

    this.map = null;
    this.currentLayerKey = 'streets';
    this.tileLayer = null;

    // Markers
    this.userMarker = null;
    this.pickupMarker = null;
    this.destMarker = null;
    this.vehicleMarkers = new Map(); // driverId -> Leaflet.Marker

    // Center pin
    this.centerPin = null;
    this.isCenterPinActive = false;
    this.onCenterPinSelected = null;

    // Lifecycle
    this.isReady = false;
    this.readyCallbacks = [];

    this.init();
  }

  onReady(callback) {
    if (this.isReady && this.map) {
      callback(this.map, this);
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  _triggerReady() {
    if (this.isReady) return;
    this.isReady = true;
    this.removeLoader();
    if (this.map && typeof this.map.invalidateSize === 'function') {
      this.map.invalidateSize();
    }
    while (this.readyCallbacks.length > 0) {
      const cb = this.readyCallbacks.shift();
      try {
        cb(this.map, this);
      } catch (err) {
        console.error('[KOURI Map] onReady callback error:', err);
      }
    }
  }

  init() {
    if (!this.container) return;

    this.showLoader();

    // Check if Leaflet is present
    if (!window.L) {
      console.warn('[KOURI Map] Leaflet library (L) not detected on window.');
      this.renderInitError();
      return;
    }

    try {
      // Create Leaflet Map Instance
      this.map = window.L.map(this.containerId, {
        center: this.options.center,
        zoom: this.options.zoom,
        zoomControl: false, // We use custom modern glassmorphic controls
        attributionControl: false
      });

      // Add default clean Esri World Street Map layer (Zero watermark, 100% Free)
      this.setTileLayer('streets');

      // Add subtle attribution in bottom right
      window.L.control.attribution({
        position: 'bottomright',
        prefix: 'KOURI &copy; Esri &copy; OSM'
      }).addTo(this.map);

      // Setup custom UI controls and location pin
      this.setupControls();
      this.setupCenterPin();
      this.watchUserLocation();

      // Trigger ready once map finishes initial render
      this.map.whenReady(() => {
        setTimeout(() => this._triggerReady(), 50);
      });

      // Invalidate size on multiple cycles to ensure 100% full canvas width/height
      window.addEventListener('resize', () => {
        if (this.map) this.map.invalidateSize();
      });
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 150);
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 600);
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 1500);

    } catch (err) {
      console.error('[KOURI Map] Initialization error:', err);
      this.renderInitError();
    }
  }

  setTileLayer(key) {
    if (!this.map || !TILES[key]) return;
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }
    if (this.satelliteOverlayLayer) {
      this.map.removeLayer(this.satelliteOverlayLayer);
      this.satelliteOverlayLayer = null;
    }
    const cfg = TILES[key];
    this.tileLayer = window.L.tileLayer(cfg.url, cfg.options).addTo(this.map);
    if (key === 'satellite' && cfg.overlayUrl) {
      this.satelliteOverlayLayer = window.L.tileLayer(cfg.overlayUrl, { maxZoom: 19 }).addTo(this.map);
    }
    this.currentLayerKey = key;
  }

  showLoader() {
    if (this.container.querySelector('.map-spinner-overlay')) return;
    const loader = document.createElement('div');
    loader.className = 'map-spinner-overlay';
    loader.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        <div class="map-spinner"></div>
        <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">Chaje kat KOURI...</span>
      </div>
    `;
    this.container.appendChild(loader);
  }

  removeLoader() {
    const loader = this.container.querySelector('.map-spinner-overlay');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.25s ease';
      setTimeout(() => loader.remove(), 250);
    }
  }

  renderInitError() {
    this.container.innerHTML = `
      <div class="map-webgl-error">
        <i data-lucide="map-pin-off" style="width:48px; height:48px; color:#DC2626; margin-bottom:12px;"></i>
        <h3 style="margin-bottom:8px;">Kat la pa ka louvri</h3>
        <p style="max-width:400px; color:#64748B;">Tanpri verifye koneksyon ou oswa rafrechi navigatè w la.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  setupControls() {
    // 1. Floating Controls Container
    let ctrlGroup = this.container.querySelector('.map-controls-group');
    if (!ctrlGroup) {
      ctrlGroup = document.createElement('div');
      ctrlGroup.className = 'map-controls-group';
      ctrlGroup.innerHTML = `
        <button type="button" class="map-control-btn" id="btn-layer-switch" title="Chanje kouch kat la">
          <i data-lucide="layers"></i>
        </button>
        <button type="button" class="map-control-btn" id="btn-locate-me" title="Pozisyon mwen">
          <i data-lucide="crosshair"></i>
        </button>
        <button type="button" class="map-control-btn" id="btn-zoom-in" title="Rale pi pre">
          <i data-lucide="plus"></i>
        </button>
        <button type="button" class="map-control-btn" id="btn-zoom-out" title="Rale pi lwen">
          <i data-lucide="minus"></i>
        </button>
      `;
      this.container.appendChild(ctrlGroup);

      // Layer Menu Dropdown
      const layerMenu = document.createElement('div');
      layerMenu.className = 'map-layers-menu';
      layerMenu.id = 'map-layers-menu';
      layerMenu.innerHTML = `
        <button type="button" class="map-layer-opt active" data-layer="streets">
          <i data-lucide="map"></i> Plan Modèn (HOT)
        </button>
        <button type="button" class="map-layer-opt" data-layer="light">
          <i data-lucide="sun"></i> Minimal (Uber Style)
        </button>
        <button type="button" class="map-layer-opt" data-layer="osm">
          <i data-lucide="navigation"></i> Lari (OSM)
        </button>
        <button type="button" class="map-layer-opt" data-layer="satellite">
          <i data-lucide="globe"></i> Satelit + Wout
        </button>
      `;
      this.container.appendChild(layerMenu);

      if (window.lucide) window.lucide.createIcons({ root: this.container });
    }

    // Event Listeners for Controls
    const btnLayer = this.container.querySelector('#btn-layer-switch');
    const layerMenu = this.container.querySelector('#map-layers-menu');
    const btnLocate = this.container.querySelector('#btn-locate-me');
    const btnZoomIn = this.container.querySelector('#btn-zoom-in');
    const btnZoomOut = this.container.querySelector('#btn-zoom-out');

    btnLayer?.addEventListener('click', (e) => {
      e.stopPropagation();
      layerMenu?.classList.toggle('active');
    });

    layerMenu?.querySelectorAll('.map-layer-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        const layerKey = opt.getAttribute('data-layer');
        this.switchBaseLayer(layerKey);
        layerMenu.classList.remove('active');
        layerMenu.querySelectorAll('.map-layer-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });

    document.addEventListener('click', () => layerMenu?.classList.remove('active'));

    btnLocate?.addEventListener('click', () => this.locateUser());
    btnZoomIn?.addEventListener('click', () => this.map.zoomIn());
    btnZoomOut?.addEventListener('click', () => this.map.zoomOut());
  }

  switchBaseLayer(layerKey) {
    this.setTileLayer(layerKey);
  }

  async locateUser() {
    try {
      const pos = await geocodingService.getCurrentPosition();
      this.setUserLocation(pos.lat, pos.lng);
      this.map.flyTo([pos.lat, pos.lng], 16, { animate: true, duration: 0.8 });
    } catch(err) {
      console.warn('[KOURI Map] Could not retrieve GPS location:', err);
    }
  }

  setUserLocation(lat, lng) {
    if (!this.map || !window.L) return;
    const el = createPulsingUserMarker();
    const icon = window.L.divIcon({
      html: el,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (!this.userMarker) {
      this.userMarker = window.L.marker([lat, lng], { icon }).addTo(this.map);
    } else {
      this.userMarker.setLatLng([lat, lng]);
      this.userMarker.setIcon(icon);
    }
  }

  watchUserLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        this.setUserLocation(pos.coords.latitude, pos.coords.longitude);
      }, () => {}, { enableHighAccuracy: true });
    }
  }

  setPickupPoint(lat, lng) {
    if (!this.map || !window.L) return;
    if (this.pickupMarker) {
      this.map.removeLayer(this.pickupMarker);
      this.pickupMarker = null;
    }
    const el = createPickupMarkerElement();
    const icon = window.L.divIcon({
      html: el,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    this.pickupMarker = window.L.marker([lat, lng], { icon, zIndexOffset: 100 }).addTo(this.map);
  }

  setDestinationPoint(lat, lng) {
    if (!this.map || !window.L) return;
    if (this.destMarker) {
      this.map.removeLayer(this.destMarker);
      this.destMarker = null;
    }
    const el = createDestinationMarkerElement();
    const icon = window.L.divIcon({
      html: el,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    this.destMarker = window.L.marker([lat, lng], { icon, zIndexOffset: 100 }).addTo(this.map);
  }

  fitBounds(coordA, coordB) {
    if (!this.map || !window.L) return;
    // Handle both [lng, lat] and [lat, lng]
    const p1 = coordA[0] < -50 ? [coordA[1], coordA[0]] : [coordA[0], coordA[1]];
    const p2 = coordB[0] < -50 ? [coordB[1], coordB[0]] : [coordB[0], coordB[1]];

    const bounds = window.L.latLngBounds([p1, p2]);
    this.map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 16,
      animate: true
    });
  }

  // Draggable Center Pin for Location Picking
  setupCenterPin() {
    this.centerPin = createMapCenterPin(this.container);

    this.map.on('movestart', () => {
      if (this.isCenterPinActive) {
        this.centerPin.classList.add('pin-dragging');
      }
    });

    this.map.on('moveend', async () => {
      if (this.isCenterPinActive) {
        this.centerPin.classList.remove('pin-dragging');
        const center = this.map.getCenter();
        const address = await geocodingService.reverseGeocode(center.lat, center.lng);
        const bubble = this.centerPin.querySelector('#center-pin-text');
        if (bubble) bubble.textContent = address;

        if (typeof this.onCenterPinSelected === 'function') {
          this.onCenterPinSelected({ lat: center.lat, lng: center.lng, address });
        }
      }
    });
  }

  enableCenterPin(onSelectCallback) {
    this.isCenterPinActive = true;
    this.onCenterPinSelected = onSelectCallback;
    this.centerPin.classList.add('active');
  }

  disableCenterPin() {
    this.isCenterPinActive = false;
    this.centerPin.classList.remove('active');
  }

  // Driver navigation mode
  updateDriverNavigation(lat, lng, heading = 0) {
    if (!this.map) return;
    this.map.panTo([lat, lng], { animate: true, duration: 0.8 });
  }

  // Fleet Rendering for Realtime drivers on map
  updateFleet(drivers = []) {
    if (!this.map || !window.L) return;
    const activeIds = new Set();

    drivers.forEach(d => {
      activeIds.add(d.id);
      const lat = d.lat;
      const lng = d.lng;

      if (this.vehicleMarkers.has(d.id)) {
        const marker = this.vehicleMarkers.get(d.id);
        marker.setLatLng([lat, lng]);
        const el = marker.getElement();
        if (el) {
          const innerEl = el.querySelector('.marker-vehicle') || el;
          innerEl.style.transform = `rotate(${d.heading || 0}deg)`;
        }
      } else {
        const el = createVehicleMarkerElement(d.category_id || 'standard', d.heading || 0, d.label || d.name || '');
        const icon = window.L.divIcon({
          html: el,
          className: '',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
        const marker = window.L.marker([lat, lng], { icon, zIndexOffset: 500 }).addTo(this.map);
        this.vehicleMarkers.set(d.id, marker);
      }
    });

    // Remove stale drivers
    for (const [id, marker] of this.vehicleMarkers.entries()) {
      if (!activeIds.has(id)) {
        this.map.removeLayer(marker);
        this.vehicleMarkers.delete(id);
      }
    }
  }
}
