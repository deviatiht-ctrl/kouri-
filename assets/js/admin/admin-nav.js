/**
 * ======================================================================
 * KOURI — Shared Admin Navigation & Auth Gatekeeper (admin-nav.js)
 * Checks admin access on every page, provides collapsible sidebar,
 * mobile drawer toggle, branding logo rendering, and header.
 * ======================================================================
 */

const ADMIN_PAGES = [
  { group: 'Operasyon', items: [
    { label: 'Tablodbò', href: '/pages/admin/dashboard.html', icon: 'layout-dashboard' },
    { label: 'Kat an Dirèk', href: '/pages/admin/live-map.html', icon: 'map' },
    { label: 'Kous yo', href: '/pages/admin/rides.html', icon: 'navigation' },
    { label: 'Alèt SOS & Tikè', href: '/pages/admin/support.html', icon: 'alert-octagon' },
    { label: 'WhatsApp Gateway', href: '/pages/admin/whatsapp.html', icon: 'message-circle' }
  ]},
  { group: 'Itilizatè', items: [
    { label: 'Chofè yo', href: '/pages/admin/drivers.html', icon: 'car' },
    { label: 'Pasaje yo', href: '/pages/admin/riders.html', icon: 'users' },
    { label: 'Abònman', href: '/pages/admin/subscriptions.html', icon: 'calendar' }
  ]},
  { group: 'Finans & Règleman', items: [
    { label: 'Konfigirasyon Pri', href: '/pages/admin/pricing.html', icon: 'calculator' },
    { label: 'Zòn & Pri Fiks', href: '/pages/admin/zones.html', icon: 'map-pin' },
    { label: 'Validasyon Peman', href: '/pages/admin/payments.html', icon: 'credit-card' },
    { label: 'Kòd Promo', href: '/pages/admin/promotions.html', icon: 'ticket' }
  ]},
  { group: 'Sistèm', items: [
    { label: 'Paramèt & Mak', href: '/pages/admin/settings.html', icon: 'settings' }
  ]}
];

class AdminNav {
  constructor() {
    this.init();
  }

  async init() {
    // 1. Strict Auth Gatekeeper
    const authResult = await window.authService.requireAdmin();
    if (!authResult) return;

    this.renderSidebar();
    this.renderHeader(authResult.user);
    if (window.lucide) window.lucide.createIcons();
  }

  renderSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) return;

    const currentPath = window.location.pathname;

    let navHtml = '';
    ADMIN_PAGES.forEach(grp => {
      navHtml += `<div class="admin-nav-group-title">${grp.group}</div>`;
      grp.items.forEach(item => {
        const isActive = currentPath.includes(item.href);
        navHtml += `
          <a href="${item.href}" class="admin-nav-item ${isActive ? 'active' : ''}">
            <i data-lucide="${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        `;
      });
    });

    sidebar.innerHTML = `
      <div class="admin-sidebar-header">
        <div data-kouri-logo data-logo-height="30">
          <img src="/assets/img/logo-placeholder.svg" alt="KOURI" style="height:30px;">
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-close-drawer" style="display:none;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <nav class="admin-sidebar-nav">
        ${navHtml}
      </nav>

      <div class="admin-sidebar-footer">
        <a href="/pages/rider/home.html" class="btn btn-outline btn-block btn-sm">
          <i data-lucide="external-link"></i> Wè Aplikasyon Pasaje
        </a>
      </div>
    `;

    // Drawer close on mobile
    sidebar.querySelector('#btn-close-drawer')?.addEventListener('click', () => {
      sidebar.classList.remove('drawer-open');
    });
  }

  renderHeader(user) {
    const header = document.getElementById('admin-header');
    if (!header) return;

    const pageTitle = document.querySelector('meta[name="admin-page-title"]')?.content || 'Administrasyon KOURI';

    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:14px;">
        <button type="button" class="btn btn-outline btn-sm" id="btn-toggle-drawer" style="display:none;">
          <i data-lucide="menu"></i>
        </button>
        <h1 class="admin-header-title">${pageTitle}</h1>
      </div>

      <div class="admin-header-actions">
        <!-- Live Offline / Online Sync status -->
        <span class="badge badge-success" id="admin-sync-indicator">
          <i data-lucide="wifi"></i> Sistèm An Liy
        </span>

        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.85rem; font-weight:700;">${user.email}</span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="window.authService.signOut()" title="Dekonekte">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </div>
    `;

    // Responsive Drawer Toggle for tablets and phones
    const btnToggle = header.querySelector('#btn-toggle-drawer');
    const sidebar = document.getElementById('admin-sidebar');
    const btnClose = sidebar?.querySelector('#btn-close-drawer');

    if (window.innerWidth <= 900) {
      if (btnToggle) btnToggle.style.display = 'inline-flex';
      if (btnClose) btnClose.style.display = 'inline-flex';
    }

    btnToggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('drawer-open');
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 900) {
        if (btnToggle) btnToggle.style.display = 'inline-flex';
        if (btnClose) btnClose.style.display = 'inline-flex';
      } else {
        if (btnToggle) btnToggle.style.display = 'none';
        if (btnClose) btnClose.style.display = 'none';
        sidebar?.classList.remove('drawer-open');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminNav = new AdminNav();
});
