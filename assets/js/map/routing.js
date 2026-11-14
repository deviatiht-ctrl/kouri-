/**
 * ======================================================================
 * KOURI — Routing Engine Abstraction (routing.js)
 * Default Provider: OSRM Public Demo / Valhalla (Self-hostable & 100% Free).
 * Swappable via window.KOURI_ROUTING_ENDPOINT.
 * Includes offline / fallback trajectory generation if network is lost.
 * ======================================================================
 */

// Production notice: OSRM public demo is for development. Self-hosted recommended in README.
const DEFAULT_OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export class RoutingService {
  constructor(endpoint = DEFAULT_OSRM_URL) {
    this.endpoint = window.KOURI_ROUTING_ENDPOINT || endpoint;
  }

  /**
   * Calculate driving route between two points [lng, lat]
   * @param {Array} start [lng, lat]
   * @param {Array} end [lng, lat]
   * @returns {Promise<Object>} { distanceKm, durationMin, coordinates, alternatives }
   */
  async getRoute(start, end) {
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;

    const url = `${this.endpoint}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`OSRM HTTP error ${response.status}`);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0];
        const distanceKm = Number((primary.distance / 1000).toFixed(2));
        const durationMin = Number(Math.max(1, Math.round(primary.duration / 60)));

        const alternatives = (data.routes.slice(1) || []).map(r => ({
          distanceKm: Number((r.distance / 1000).toFixed(2)),
          durationMin: Number(Math.max(1, Math.round(r.duration / 60))),
          coordinates: r.geometry.coordinates
        }));

        return {
          success: true,
          distanceKm,
          durationMin,
          coordinates: primary.geometry.coordinates,
          alternatives,
          routeGeoJSON: {
            type: 'Feature',
            geometry: primary.geometry,
            properties: { distanceKm, durationMin }
          }
        };
      }
    } catch (err) {
      console.warn('[KOURI Routing] Network routing failed or offline. Using local dead-reckoning fallback:', err.message);
    }

    // Offline / fallback calculation using Haversine + road wiggle interpolation
    return this.calculateFallbackRoute(start, end);
  }

  calculateFallbackRoute(start, end) {
    const [lng1, lat1] = start;
    const [lng2, lat2] = end;

    // Haversine formula
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;

    // Traffic/Urban road factor for Haiti streets (~1.38x straight line)
    const distanceKm = Number(Math.max(0.5, (straightDist * 1.38)).toFixed(2));
    // Avg city speed 22 km/h in Port-au-Prince traffic
    const durationMin = Math.max(3, Math.round((distanceKm / 22) * 60));

    // Generate intermediate waypoints for smooth polyline display
    const steps = 12;
    const coords = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const interpLng = lng1 + (lng2 - lng1) * t;
      const interpLat = lat1 + (lat2 - lat1) * t;
      coords.push([interpLng, interpLat]);
    }

    return {
      success: true,
      distanceKm,
      durationMin,
      coordinates: coords,
      alternatives: [],
      isFallback: true,
      routeGeoJSON: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords
        },
        properties: { distanceKm, durationMin }
      }
    };
  }

  /**
   * Draw or update route polyline on Leaflet or MapLibre instance
   */
  renderRouteOnMap(map, routeGeoJSON, routeId = 'route-primary') {
    if (!map) return;

    // 1. Support Leaflet.js
    if (window.L && (map instanceof window.L.Map || typeof map.addLayer === 'function' && typeof map.getSource !== 'function')) {
      this.renderLeafletRoute(map, routeGeoJSON);
      return;
    }

    // 2. Support MapLibre GL
    const sourceId = `${routeId}-source`;
    const casingLayerId = `${routeId}-casing`;
    const mainLayerId = `${routeId}-line`;

    if (map.getSource && map.getSource(sourceId)) {
      map.getSource(sourceId).setData(routeGeoJSON);
    } else if (map.addSource) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: routeGeoJSON
      });

      // Shadow / Casing line
      map.addLayer({
        id: casingLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0B0F1A',
          'line-width': 8,
          'line-opacity': 0.15
        }
      });

      // Primary brand line
      map.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563EB',
          'line-width': 5,
          'line-opacity': 0.95
        }
      });
    }

    // Subtle GSAP route pulse animation if available
    if (window.gsap && map.getLayer) {
      try {
        const pulse = { width: 5 };
        window.gsap.to(pulse, {
          width: 7,
          repeat: 2,
          yoyo: true,
          duration: 0.4,
          onUpdate: () => {
            if (map.getLayer(mainLayerId)) {
              map.setPaintProperty(mainLayerId, 'line-width', pulse.width);
            }
          }
        });
      } catch (e) {}
    }
  }

  renderLeafletRoute(map, routeGeoJSON) {
    if (!map || !routeGeoJSON || !routeGeoJSON.geometry) return;
    if (map._kouriRouteGroup) {
      try { map.removeLayer(map._kouriRouteGroup); } catch(e) {}
      map._kouriRouteGroup = null;
    }

    const rawCoords = routeGeoJSON.geometry.coordinates || [];
    // GeoJSON is [lng, lat], Leaflet polyline expects [lat, lng]
    const latLngs = rawCoords.map(c => [c[1], c[0]]);

    const casing = window.L.polyline(latLngs, {
      color: '#0B0F1A',
      weight: 8,
      opacity: 0.18,
      lineCap: 'round',
      lineJoin: 'round'
    });

    const line = window.L.polyline(latLngs, {
      color: '#2563EB',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });

    const group = window.L.featureGroup([casing, line]).addTo(map);
    map._kouriRouteGroup = group;
  }

  clearRoute(map, routeId = 'route-primary') {
    if (!map) return;
    if (map._kouriRouteGroup) {
      try { map.removeLayer(map._kouriRouteGroup); } catch(e) {}
      map._kouriRouteGroup = null;
    }
    if (typeof map.getLayer === 'function') {
      const sourceId = `${routeId}-source`;
      const casingLayerId = `${routeId}-casing`;
      const mainLayerId = `${routeId}-line`;

      if (map.getLayer(mainLayerId)) map.removeLayer(mainLayerId);
      if (map.getLayer(casingLayerId)) map.removeLayer(casingLayerId);
      if (map.getSource && map.getSource(sourceId)) map.removeSource(sourceId);
    }
  }
}

export const routingService = new RoutingService();
