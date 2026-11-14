/**
 * ======================================================================
 * KOURI — Map Markers & SVGs (markers.js)
 * Clean, SVG-only, zero emoji markers:
 * 1. Pickup (Circle with accent core)
 * 2. Destination (Square with accent fill)
 * 3. Driver Vehicle (Rotates with bearing/heading)
 * 4. Pulsing Current User Location Dot
 * ======================================================================
 */

export function createPulsingUserMarker() {
  const el = document.createElement('div');
  el.className = 'marker-user-location';
  el.innerHTML = `
    <div class="marker-user-pulse"></div>
    <div class="marker-user-dot"></div>
  `;
  return el;
}

export function createPickupMarkerElement() {
  const el = document.createElement('div');
  el.className = 'marker-pickup';
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
    </svg>
  `;
  return el;
}

export function createDestinationMarkerElement() {
  const el = document.createElement('div');
  el.className = 'marker-destination';
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      <rect x="8" y="8" width="8" height="8" fill="currentColor"></rect>
    </svg>
  `;
  return el;
}

export function createVehicleMarkerElement(category = 'standard', heading = 0, label = '') {
  const el = document.createElement('div');
  el.className = 'marker-vehicle-container';
  el.style.position = 'relative';

  const badgeHtml = label ? `<div class="marker-vehicle-badge">${label}</div>` : '';

  const iconSvg = category === 'moto' 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;

  el.innerHTML = `
    ${badgeHtml}
    <div class="marker-vehicle" style="transform: rotate(${heading}deg);">
      <div class="marker-vehicle-inner">
        ${iconSvg}
      </div>
    </div>
  `;
  return el;
}

/**
 * Creates the fixed center pin for "Drag map to pick location" mode
 */
export function createMapCenterPin(container) {
  let pin = container.querySelector('.map-center-pin');
  if (!pin) {
    pin = document.createElement('div');
    pin.className = 'map-center-pin';
    pin.innerHTML = `
      <div class="map-center-pin-bubble" id="center-pin-text">Chwazi kote sa a</div>
      <svg class="map-center-pin-svg" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#0B0F1A"/>
        <circle cx="12" cy="9" r="3.5" fill="#2563EB"/>
      </svg>
      <div class="map-center-pin-shadow"></div>
    `;
    container.appendChild(pin);
  }
  return pin;
}
