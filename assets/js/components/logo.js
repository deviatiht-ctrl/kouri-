/**
 * ======================================================================
 * KOURI — Logo Component (logo.js)
 * Renders logo from settings.logo_url with fallback to logo-placeholder.svg.
 * Handles dynamic branding updates (colors, logos, app name).
 * ======================================================================
 */

const DEFAULT_LOGO_URL = '/assets/img/logo-placeholder.svg';
const DEFAULT_ICON_URL = '/assets/img/icon-placeholder.svg';

class LogoComponent {
  constructor() {
    this.cachedSettings = null;
    this.init();
  }

  async init() {
    // 1. Check local cache first for instant render
    const cached = localStorage.getItem('kouri_branding_settings');
    if (cached) {
      try {
        this.cachedSettings = JSON.parse(cached);
        this.applyBranding(this.cachedSettings);
      } catch (e) {
        console.warn('Failed parsing cached branding', e);
      }
    }

    // 2. Fetch fresh settings from Supabase if online
    if (window.db) {
      try {
        const { data, error } = await window.db
          .from('app_settings')
          .select('value')
          .eq('key', 'branding')
          .single();

        if (data && data.value) {
          this.cachedSettings = data.value;
          localStorage.setItem('kouri_branding_settings', JSON.stringify(data.value));
          this.applyBranding(data.value);
        }
      } catch (err) {
        // Silent fallback to default/cached settings
      }
    }

    // 3. Render all logo elements in document
    this.renderAll();
  }

  applyBranding(settings) {
    if (!settings) return;

    // Apply CSS Variables if configured
    if (settings.primary_color) {
      document.documentElement.style.setProperty('--ink', settings.primary_color);
      document.documentElement.style.setProperty('--primary', settings.primary_color);
    }
    if (settings.accent_color) {
      document.documentElement.style.setProperty('--accent', settings.accent_color);
    }

    // Update document title if app_name exists
    if (settings.app_name) {
      window.KOURI_APP_NAME = settings.app_name;
    }

    // Update favicon
    if (settings.favicon_url) {
      const fav = document.querySelector("link[rel*='icon']");
      if (fav) fav.href = settings.favicon_url;
    }
  }

  getLogoUrl() {
    return (this.cachedSettings && this.cachedSettings.logo_url) || DEFAULT_LOGO_URL;
  }

  getIconUrl() {
    return (this.cachedSettings && this.cachedSettings.icon_url) || DEFAULT_ICON_URL;
  }

  renderLogoHTML(options = {}) {
    const { variant = 'full', height = 36, className = '', linkToHome = true } = options;
    const url = variant === 'icon' ? this.getIconUrl() : this.getLogoUrl();
    const appName = (this.cachedSettings && this.cachedSettings.app_name) || 'KOURI +';

    const imgTag = `<img src="${url}" alt="${appName}" class="kouri-logo-img ${className}" style="height:${height}px; width:auto; display:block;" onerror="this.onerror=null;this.src='${DEFAULT_LOGO_URL}';">`;
    
    if (linkToHome) {
      return `<a href="/" class="kouri-logo-link" style="display:inline-flex; align-items:center; text-decoration:none;">${imgTag}</a>`;
    }
    return imgTag;
  }

  renderAll(container = document) {
    const logoContainers = container.querySelectorAll('[data-kouri-logo]');
    logoContainers.forEach(el => {
      const variant = el.getAttribute('data-logo-variant') || 'full';
      const height = parseInt(el.getAttribute('data-logo-height') || '36', 10);
      const link = el.getAttribute('data-logo-link') !== 'false';
      el.innerHTML = this.renderLogoHTML({ variant, height, linkToHome: link });
    });
  }
}

window.logoManager = new LogoComponent();
window.renderLogo = (opts) => window.logoManager.renderLogoHTML(opts);

document.addEventListener('DOMContentLoaded', () => {
  window.logoManager.renderAll();
});
