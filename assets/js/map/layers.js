/**
 * ======================================================================
 * KOURI — MapLibre GL Layers & Styles Configuration (layers.js)
 * 100% Free - No paid API keys.
 * 1. Plan: OpenFreeMap Liberty / Positron minimal vector style
 * 2. Satellite: Esri World Imagery raster tiles + OSM road overlay
 * 3. 3D: OSM 3D building extrusion + elevation terrain hillshade
 * ======================================================================
 */

// 1. Vector Minimal Plan Style (OpenFreeMap - Free, no token required)
export const STYLE_PLAN = 'https://tiles.openfreemap.org/styles/liberty';

// 1b. Ultra-Reliable Minimal White Positron Style (Instant rendering, zero dependency on vector fonts/sprites)
export const STYLE_POSITRON = {
  version: 8,
  sources: {
    'carto-positron': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'carto-positron-layer',
      type: 'raster',
      source: 'carto-positron',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

// 1c. OpenStreetMap Standard Raster Style Fallback
export const STYLE_OSM = {
  version: 8,
  sources: {
    'osm-standard': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-standard-layer',
      type: 'raster',
      source: 'osm-standard',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// 2. Satellite Hybrid Style (Esri World Imagery + OSM label overlay)
export const STYLE_SATELLITE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics'
    },
    'osm-overlay': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 20
    },
    {
      id: 'osm-overlay-layer',
      type: 'raster',
      source: 'osm-overlay',
      minzoom: 12,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.35
      }
    }
  ]
};

// 3. 3D Building Extrusion helper to add to any vector style
export function add3DBuildingsLayer(map) {
  // Check if building layer exists in the vector source
  if (map.getLayer('3d-buildings')) return;

  const layers = map.getStyle().layers;
  let labelLayerId;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id;
      break;
    }
  }

  // Look for openmaptiles building source
  try {
    map.addLayer(
      {
        id: '3d-buildings',
        source: 'openmaptiles',
        'source-layer': 'building',
        filter: ['!=', ['get', 'hide_3d'], true],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#E2E8F0',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            14.5,
            ['coalesce', ['get', 'render_height'], 12]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            14.5,
            ['coalesce', ['get', 'render_min_height'], 0]
          ],
          'fill-extrusion-opacity': 0.82
        }
      },
      labelLayerId
    );
  } catch (err) {
    // If openmaptiles building is unavailable, fallback quietly
    console.debug('[KOURI Map] Building extrusion source not present in this style');
  }
}

// 4. Free Elevation Terrain & Hillshade (Terrarium DEM)
export function addTerrainAndSky(map) {
  try {
    if (!map.getSource('terrarium-dem')) {
      map.addSource('terrarium-dem', {
        type: 'raster-dem',
        encoding: 'terrarium',
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        ],
        tileSize: 256
      });
    }

    if (!map.getLayer('hillshading')) {
      map.addLayer({
        id: 'hillshading',
        source: 'terrarium-dem',
        type: 'hillshade',
        paint: {
          'hillshade-exaggeration': 0.35,
          'hillshade-shadow-color': '#0B0F1A',
          'hillshade-highlight-color': '#FFFFFF'
        }
      });
    }
  } catch (e) {
    console.debug('[KOURI Map] Terrain source note:', e.message);
  }
}
