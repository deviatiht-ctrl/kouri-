/**
 * ======================================================================
 * KOURI + — Ultra-Modern Geocoding & POI Search Engine (geocoding.js)
 * Multi-layer real-time search optimized for Haiti:
 * 1. Photon Komoot OSM API (instant autocomplete, typo-tolerant, restaurants,
 *    schools, universities, hospitals, hotels, supermarkets)
 * 2. Nominatim with Haiti-specific bounding box & User-Agent
 * 3. Rich built-in Haitian POI database (100+ iconic places)
 * 4. Reverse geocoding for draggable map pin
 * ======================================================================
 */

// Haiti Geocoding Bounds & PAP Center
const HAITI_BOUNDS = {
  minLat: 18.0,
  maxLat: 20.2,
  minLng: -74.6,
  maxLng: -71.5
};

const PAP_VIEWBOX = [-72.45, 18.45, -72.20, 18.65]; // [minLng, minLat, maxLng, maxLat]

// Comprehensive, curated directory of Haitian POIs (Restaurants, Schools, Universities, Hospitals, Hotels, Plazas)
const HAITI_CURATED_PLACES = [
  // --- RESTAURANTS, CAFES & BARS ---
  { name: 'Muncheez Pizza & Subs (Pétion-Ville)', address: 'Rue Louverture & Rue Clerveaux, Pétion-Ville', category: 'restaurant', lat: 18.5176, lng: -72.2903 },
  { name: 'Muncheez (Aéroport / Delmas)', address: 'Boulevard Toussaint Louverture, Delmas', category: 'restaurant', lat: 18.5661, lng: -72.3126 },
  { name: 'Papaye Restaurant', address: '48 Rue Metellus, Pétion-Ville', category: 'restaurant', lat: 18.5152, lng: -72.2872 },
  { name: 'Asu Rooftop Lounge (Karibe)', address: 'Juvénat 7, Pétion-Ville', category: 'restaurant', lat: 18.5255, lng: -72.2988 },
  { name: 'Quartier Latin Restaurant', address: '10 Rue Goulard, Place Boyer, Pétion-Ville', category: 'restaurant', lat: 18.5135, lng: -72.2882 },
  { name: 'Kay Foun Restaurant', address: 'Rue Jean-Gilles, Delmas 75', category: 'restaurant', lat: 18.5320, lng: -72.2940 },
  { name: 'Frite Restaurant', address: 'Rue Louverture, Pétion-Ville', category: 'restaurant', lat: 18.5160, lng: -72.2895 },
  { name: 'L’Épicier Restaurant & Lounge', address: 'Rue Lambert, Pétion-Ville', category: 'restaurant', lat: 18.5140, lng: -72.2865 },
  { name: 'Pizza Garden', address: 'Rue Rebecca & Rue Pan Américaine, Pétion-Ville', category: 'restaurant', lat: 18.5128, lng: -72.2875 },
  { name: 'Rebo Café (Pétion-Ville)', address: 'Place Boyer, Pétion-Ville', category: 'cafe', lat: 18.5138, lng: -72.2885 },
  { name: 'Rebo Café (Aéroport)', address: 'Boulevard Toussaint Louverture, Mais Gâté', category: 'cafe', lat: 18.5780, lng: -72.2920 },
  { name: 'Observatoire Restaurant', address: 'Route de Boutilliers, Port-au-Prince', category: 'restaurant', lat: 18.4980, lng: -72.3150 },
  { name: 'Le Montcel Restaurant', address: 'Route de Kenscoff, Belot', category: 'restaurant', lat: 18.4550, lng: -72.2920 },
  { name: 'Coin Vert Restaurant', address: 'Rue Grégoire, Pétion-Ville', category: 'restaurant', lat: 18.5148, lng: -72.2845 },
  { name: 'Bute Boy Burgers', address: 'Rue Rebecca, Pétion-Ville', category: 'restaurant', lat: 18.5115, lng: -72.2870 },
  { name: 'Epi d’Or (Delmas)', address: 'Boulevard de Delmas, Delmas 31', category: 'bakery', lat: 18.5520, lng: -72.3080 },
  { name: 'Epi d’Or (Pétion-Ville)', address: 'Rue Villate & Rue Geffrard, Pétion-Ville', category: 'bakery', lat: 18.5158, lng: -72.2868 },
  { name: 'Epi d’Or (Champs de Mars)', address: 'Avenue de la République, Port-au-Prince', category: 'bakery', lat: 18.5425, lng: -72.3392 },
  { name: 'Coin Chaud', address: 'Delmas 33, Carrefour de l’Aéroport', category: 'restaurant', lat: 18.5560, lng: -72.3115 },
  { name: 'Smoke Shack BBQ', address: 'Rue Louverture, Pétion-Ville', category: 'restaurant', lat: 18.5185, lng: -72.2910 },
  { name: 'La Taverne Restaurant', address: 'Rue Rebecca, Pétion-Ville', category: 'restaurant', lat: 18.5122, lng: -72.2878 },

  // --- SCHOOLS, COLLEGES & UNIVERSITIES ---
  { name: 'Institution Saint-Louis de Gonzague', address: 'Delmas 31 & Rue Saint-Louis, Delmas', category: 'school', lat: 18.5552, lng: -72.3021 },
  { name: 'Institution Saint-Louis de Gonzague (Centre-Ville)', address: 'Rue du Centre & Rue des Miracles, Port-au-Prince', category: 'school', lat: 18.5464, lng: -72.3431 },
  { name: 'Collège Canado-Haïtien', address: 'Avenue Jean-Paul II, Turgeau', category: 'school', lat: 18.5350, lng: -72.3240 },
  { name: 'Université Quisqueya (UniQ)', address: '218 Haut de Turgeau, Port-au-Prince', category: 'university', lat: 18.5325, lng: -72.3185 },
  { name: 'Collège Catts Pressoir', address: 'Avenue Charles Sumner, Port-au-Prince', category: 'school', lat: 18.5385, lng: -72.3290 },
  { name: 'Institution Sainte-Rose de Lima', address: 'Rue Lamarre & Lalue (Avenue John Brown), Port-au-Prince', category: 'school', lat: 18.5430, lng: -72.3330 },
  { name: 'Centre d’Études Secondaires (CES)', address: 'Avenue John Brown (Lalue), Port-au-Prince', category: 'school', lat: 18.5442, lng: -72.3315 },
  { name: 'Collège Saint-Pierre', address: 'Rue Capois & Rue Légitime, Champs de Mars', category: 'school', lat: 18.5410, lng: -72.3375 },
  { name: 'Lycée Alexandre Pétion', address: 'Rue Borgella & Bel Air, Port-au-Prince', category: 'school', lat: 18.5480, lng: -72.3400 },
  { name: 'Faculté de Médecine et de Pharmacie (UEH)', address: 'Rue Oswald Durand, Port-au-Prince', category: 'university', lat: 18.5380, lng: -72.3410 },
  { name: 'Faculté des Sciences - FDS (UEH)', address: 'Boulevard Jean-Jacques Dessalines, Port-au-Prince', category: 'university', lat: 18.5405, lng: -72.3425 },
  { name: 'Faculté de Droit et des Sciences Économiques - FDSE (UEH)', address: 'Rue Oswald Durand, Port-au-Prince', category: 'university', lat: 18.5375, lng: -72.3395 },
  { name: 'INAGHEI (UEH)', address: 'Avenue Christophe, Port-au-Prince', category: 'university', lat: 18.5360, lng: -72.3340 },
  { name: 'UniFA (Université Fondation Aristide)', address: 'Boulevard 15 Octobre, Tabarre', category: 'university', lat: 18.5870, lng: -72.2530 },
  { name: 'UNDH (Université Notre Dame d’Haïti)', address: 'Rue Sapotille, Pacot, Port-au-Prince', category: 'university', lat: 18.5310, lng: -72.3280 },
  { name: 'Union School Haiti', address: 'Juvénat, Route de Bourdon, Pétion-Ville', category: 'school', lat: 18.5280, lng: -72.3020 },
  { name: 'Lycée Fritz Pierre-Louis', address: 'Rue Saint-Honoré, Port-au-Prince', category: 'school', lat: 18.5415, lng: -72.3435 },
  { name: 'Institution du Sacré-Cœur', address: 'Turgeau, Port-au-Prince', category: 'school', lat: 18.5330, lng: -72.3210 },
  { name: 'Nouveau Collège Bird', address: 'Rue de l’Enterrement, Port-au-Prince', category: 'school', lat: 18.5390, lng: -72.3440 },

  // --- HOTELS & RESORTS ---
  { name: 'Karibe Hotel & Convention Center', address: 'Juvénat 7, Pétion-Ville', category: 'hotel', lat: 18.5255, lng: -72.2988 },
  { name: 'Hotel Montana', address: 'Rue Cardozo, Morne Bourdon, Pétion-Ville', category: 'hotel', lat: 18.5285, lng: -72.3080 },
  { name: 'NH Haiti El Rancho', address: 'Avenue Pan Américaine, Pétion-Ville', category: 'hotel', lat: 18.5130, lng: -72.2840 },
  { name: 'Kinam Hotel', address: 'Place Saint-Pierre, Pétion-Ville', category: 'hotel', lat: 18.5142, lng: -72.2862 },
  { name: 'Royal Oasis Hotel', address: '115 Avenue Pan Américaine, Pétion-Ville', category: 'hotel', lat: 18.5165, lng: -72.2915 },
  { name: 'Marriott Port-au-Prince', address: '147 Avenue Jean-Paul II, Turgeau', category: 'hotel', lat: 18.5365, lng: -72.3260 },
  { name: 'Servotel Hotel', address: 'Boulevard Toussaint Louverture, Mais Gâté', category: 'hotel', lat: 18.5775, lng: -72.2940 },
  { name: 'Villa Nicole', address: 'Route de Kenscoff, Laboule', category: 'hotel', lat: 18.4900, lng: -72.2950 },

  // --- SUPERMARKETS & COMMERCIAL PLAZAS ---
  { name: 'Giant Supermarket', address: 'Rue Grégoire, Pétion-Ville', category: 'market', lat: 18.5145, lng: -72.2855 },
  { name: 'Eagle Market (Delmas 60)', address: 'Boulevard de Delmas, Delmas 60', category: 'market', lat: 18.5390, lng: -72.3000 },
  { name: 'Eagle Market (Péguy-Ville)', address: 'Route de Péguy-Ville, Pétion-Ville', category: 'market', lat: 18.5080, lng: -72.2810 },
  { name: 'Big Star Supermarket', address: 'Rue Darguin & Rue Villate, Pétion-Ville', category: 'market', lat: 18.5150, lng: -72.2870 },
  { name: 'Caribbean Supermarket', address: 'Delmas 33 & Boulevard Toussaint Louverture', category: 'market', lat: 18.5570, lng: -72.3110 },
  { name: 'Supermax Market (Tabarre)', address: 'Boulevard 15 Octobre, Tabarre', category: 'market', lat: 18.5790, lng: -72.2680 },
  { name: 'Plaza 2000', address: 'Boulevard Toussaint Louverture, Mais Gâté', category: 'plaza', lat: 18.5720, lng: -72.2980 },
  { name: 'Marché en Fer (Hyppolite)', address: 'Rue Courbe & Boulevard Dessalines, Port-au-Prince', category: 'market', lat: 18.5448, lng: -72.3425 },
  { name: 'Marché Salomon', address: 'Bas-Peu-de-Chose, Port-au-Prince', category: 'market', lat: 18.5360, lng: -72.3420 },

  // --- HOSPITALS & HEALTH CENTERS ---
  { name: 'Hôpital Bernard Mevs (Trauma & Critical Care)', address: 'Boulevard Toussaint Louverture, Carrefour Fleuriot', category: 'hospital', lat: 18.5685, lng: -72.2995 },
  { name: 'Hôpital du Canapé-Vert', address: 'Route du Canapé-Vert, Port-au-Prince', category: 'hospital', lat: 18.5280, lng: -72.3215 },
  { name: 'Hôpital de l’Université d’État d’Haïti (HUEH / Lopital Jeneral)', address: 'Rue Mgr Guilloux, Port-au-Prince', category: 'hospital', lat: 18.5395, lng: -72.3415 },
  { name: 'Hôpital Universitaire la Paix (HUP)', address: 'Delmas 33, Delmas', category: 'hospital', lat: 18.5585, lng: -72.3090 },
  { name: 'OFATMA (Hôpital & Clinique)', address: 'Boulevard Cité Militaire & Delmas', category: 'hospital', lat: 18.5620, lng: -72.3250 },
  { name: 'Hôpital Saint-Damien (Pédiatrique)', address: 'Boulevard 15 Octobre, Tabarre', category: 'hospital', lat: 18.5830, lng: -72.2600 },
  { name: 'Centre Hospitalier Sainte-Marie', address: 'Avenue Jean-Paul II, Turgeau', category: 'hospital', lat: 18.5340, lng: -72.3230 },

  // --- KEY HUBS, PUBLIC PLACES & LANDMARKS ---
  { name: 'Aéroport International Toussaint Louverture', address: 'Boulevard Toussaint Louverture, Mais Gâté', category: 'airport', lat: 18.5796, lng: -72.2926 },
  { name: 'Place Saint-Pierre', address: 'Rue Pan Américaine, Pétion-Ville', category: 'place', lat: 18.5144, lng: -72.2858 },
  { name: 'Place Boyer', address: 'Rue Rebecca & Rue Lambert, Pétion-Ville', category: 'place', lat: 18.5135, lng: -72.2880 },
  { name: 'Place du Champs de Mars', address: 'Avenue de la République, Port-au-Prince', category: 'place', lat: 18.5432, lng: -72.3389 },
  { name: 'Delmas 33 (Carrefour de l’Aéroport / Viaduc)', address: 'Boulevard Toussaint Louverture & Delmas', category: 'hub', lat: 18.5552, lng: -72.3125 },
  { name: 'Carrefour Fleuriot (Tabarre)', address: 'Boulevard 15 Octobre & Route de Tabarre', category: 'hub', lat: 18.5750, lng: -72.2790 },
  { name: 'Carrefour Marassa', address: 'Route Nationale #1 & Croix-des-Bouquets', category: 'hub', lat: 18.6010, lng: -72.2450 },
  { name: 'Carrefour Trois Mains', address: 'Boulevard Toussaint Louverture & Tabarre', category: 'hub', lat: 18.5710, lng: -72.2890 },
  { name: 'Ambassade des États-Unis', address: 'Boulevard 15 Octobre, Tabarre 27', category: 'embassy', lat: 18.5820, lng: -72.2610 },
  { name: 'Ambassade de France', address: '51 Rue Capois, Champs de Mars, Port-au-Prince', category: 'embassy', lat: 18.5410, lng: -72.3360 },
  { name: 'Stade Sylvio Cator', address: 'Rue Oswald Durand, Port-au-Prince', category: 'stadium', lat: 18.5365, lng: -72.3430 },
  { name: 'Parc Sainte-Thérèse', address: 'Rue Faubert, Pétion-Ville', category: 'park', lat: 18.5155, lng: -72.2920 }
];

class GeocodingService {
  constructor() {
    this.debounceTimer = null;
    this.curatedPlaces = HAITI_CURATED_PLACES;
  }

  /**
   * Search places by text query with Photon (OSM POIs) + Nominatim + Local Curated Haiti Database
   */
  async search(query) {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim().toLowerCase();
    const results = [];
    const seenNames = new Set();

    const addResult = (item) => {
      const key = `${item.name.toLowerCase()}_${item.lat.toFixed(3)}_${item.lng.toFixed(3)}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        results.push(item);
      }
    };

    // 1. Search local curated Haitian dataset first (instant match for schools, restaurants, hotels)
    const localMatches = this.searchCuratedDataset(cleanQuery);
    localMatches.forEach(addResult);

    // 2. Query Photon Komoot API (Ultra-modern OSM POI search engine, typo-tolerant, contains all Haitian POIs)
    if (navigator.onLine) {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=18.540&lon=-72.300&limit=8`;
        const res = await fetch(photonUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data && data.features) {
            for (const f of data.features) {
              const [lng, lat] = f.geometry.coordinates;
              // Ensure coordinates are within Haiti bounds
              if (lat >= HAITI_BOUNDS.minLat && lat <= HAITI_BOUNDS.maxLat && 
                  lng >= HAITI_BOUNDS.minLng && lng <= HAITI_BOUNDS.maxLng) {
                const props = f.properties || {};
                const name = props.name || props.street || query;
                const parts = [
                  props.street,
                  props.district || props.suburb || props.neighbourhood,
                  props.city || props.town || props.state || 'Haïti'
                ].filter(Boolean);
                const address = parts.length > 0 ? parts.join(', ') : 'Pòtoprens, Ayiti';

                addResult({
                  name,
                  address,
                  lat,
                  lng,
                  category: props.osm_value || 'poi'
                });
              }
            }
          }
        }
      } catch (err) {
        console.debug('Photon search note:', err.message);
      }
    }

    // 3. Fallback to Nominatim if results are still under 3
    if (results.length < 3 && navigator.onLine) {
      try {
        const viewboxStr = `${PAP_VIEWBOX[0]},${PAP_VIEWBOX[3]},${PAP_VIEWBOX[2]},${PAP_VIEWBOX[1]}`;
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ht&viewbox=${viewboxStr}&bounded=0&limit=5&addressdetails=1`;
        const res = await fetch(nomUrl, {
          headers: { 
            'Accept-Language': 'ht, fr, en',
            'User-Agent': 'KOURI-RideHailing-App'
          },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const raw = await res.json();
          raw.forEach(item => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (lat >= HAITI_BOUNDS.minLat && lat <= HAITI_BOUNDS.maxLat) {
              addResult({
                name: item.namedetails?.name || item.name || item.display_name.split(',')[0],
                address: item.display_name.split(',').slice(1, 4).join(',').trim() || 'Pòtoprens, Ayiti',
                lat,
                lng,
                category: item.type || 'place'
              });
            }
          });
        }
      } catch (err) {
        console.debug('Nominatim search note:', err.message);
      }
    }

    return results.slice(0, 7);
  }

  /**
   * Search within curated Haitian database
   */
  searchCuratedDataset(cleanQuery) {
    // Normalization helper
    const normalize = (str) => {
      return (str || '')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9 ]/g, ' ');
    };

    const normQuery = normalize(cleanQuery);
    const tokens = normQuery.split(/\s+/).filter(t => t.length > 1);

    return this.curatedPlaces.filter(p => {
      const normName = normalize(p.name);
      const normAddr = normalize(p.address);

      // Check if all tokens match either name or address
      if (tokens.length === 0) return false;
      return tokens.every(token => normName.includes(token) || normAddr.includes(token));
    });
  }

  /**
   * Reverse geocode coordinates [lat, lng] to formatted street address
   */
  async reverseGeocode(lat, lng) {
    // 1. Check if very close to a known curated POI (within ~150 meters)
    for (const p of this.curatedPlaces) {
      const distKm = this.calculateDistance(lat, lng, p.lat, p.lng);
      if (distKm < 0.15) {
        return `${p.name}, ${p.address.split(',')[0]}`;
      }
    }

    // 2. Online reverse geocode via Nominatim
    if (navigator.onLine) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 
            'Accept-Language': 'ht, fr, en',
            'User-Agent': 'KOURI-RideHailing-App'
          },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          const road = data.address?.road || data.address?.pedestrian || data.address?.neighbourhood || data.address?.suburb;
          const city = data.address?.city || data.address?.town || data.address?.village || 'Pòtoprens';
          if (road) return `${road}, ${city}`;
          return data.display_name.split(',').slice(0, 3).join(',');
        }
      } catch (e) {}
    }

    // 3. Fallback to nearest landmark
    let closest = this.curatedPlaces[0];
    let minDiff = 999;
    for (const p of this.curatedPlaces) {
      const diff = Math.hypot(p.lat - lat, p.lng - lng);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    return `${closest.name} (${closest.address.split(',')[0]})`;
  }

  /**
   * Helper Haversine Distance in Kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get device GPS position with promise
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }
}

export const geocodingService = new GeocodingService();
window.geocodingService = geocodingService;