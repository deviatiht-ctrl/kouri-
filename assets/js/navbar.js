/**
 * ======================================================================
 * KOURI + — Unified Navigation Component (navbar.js)
 * Injects Desktop Glassmorphic Pill and Mobile Bottom Bar.
 * Dynamically reacts to user authentication state & admin privilege.
 * ======================================================================
 */

class NavigationBar {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.isAdmin = false;
    this.init();
  }

  async init() {
    // 1. Check cached session first for instant flicker-free render
    const cached = localStorage.getItem('kouri_auth_session');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        this.currentUser = parsed;
        this.currentProfile = parsed;
        const cleanEmail = (parsed.email || '').trim().toLowerCase();
        this.isAdmin = cleanEmail.includes('admin') || 
                       cleanEmail === 'laurorejeanclarens0@gmail.com' || 
                       cleanEmail === 'laurorejeanclarens9@gmail.com' || 
                       cleanEmail === 'cvisual@kouri.ht' || 
                       parsed.role === 'admin';
        this.renderAll();
      } catch (e) {}
    }

    // 2. Perform live async verification with authService
    if (window.authService) {
      try {
        const { user, profile } = await window.authService.getCurrentUser();
        this.currentUser = user;
        this.currentProfile = profile;
        if (user) {
          this.isAdmin = (await window.authService.isAdminEmail(user.email)) || profile?.role === 'admin';
        } else {
          this.isAdmin = false;
        }
        this.renderAll();
      } catch (err) {
        console.warn('Navbar auth check notice:', err);
      }
    }

    // 3. Listen to Supabase Auth State changes in real time
    if (window.db && window.db.auth) {
      try {
        window.db.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            this.currentUser = session.user;
            this.currentProfile = session.user.user_metadata || { email: session.user.email };
            this.isAdmin = (await window.authService?.isAdminEmail(session.user.email)) || false;
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.currentProfile = null;
            this.isAdmin = false;
            localStorage.removeItem('kouri_auth_session');
          }
          this.renderAll();
        });
      } catch (e) {}
    }

    // 4. Listen to custom auth events
    window.addEventListener('kouri:auth-changed', () => this.refresh());
  }

  async refresh() {
    if (window.authService) {
      const { user, profile } = await window.authService.getCurrentUser();
      this.currentUser = user;
      this.currentProfile = profile;
      if (user) {
        this.isAdmin = (await window.authService.isAdminEmail(user.email)) || profile?.role === 'admin';
      } else {
        this.isAdmin = false;
      }
      this.renderAll();
    }
  }

  renderAll() {
    this.renderDesktopNav(this.currentUser, this.currentProfile, this.isAdmin);
    this.renderMobileBottomNav(this.currentUser, this.currentProfile, this.isAdmin);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderDesktopNav(user, profile, isAdmin) {
    const navPlaceholder = document.getElementById('kouri-navbar');
    if (!navPlaceholder) return;

    const currentPath = window.location.pathname;

    let links = '';
    if (!user) {
      // Visitor / Not logged in
      links = `
        <a href="/" class="navbar-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}" data-i18n="nav_home">Akèy</a>
        <a href="/pages/rider/home.html" class="navbar-link ${currentPath.includes('/rider/home') ? 'active' : ''}">Kòmande Kous</a>
        <a href="/pages/driver/home.html" class="navbar-link ${currentPath.includes('/driver/home') ? 'active' : ''}" data-i18n="nav_driver_portal">Espas Chofè</a>
      `;
    } else if (profile?.role === 'driver') {
      // Driver logged in
      links = `
        <a href="/" class="navbar-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}">Akèy</a>
        <a href="/pages/driver/home.html" class="navbar-link ${currentPath.includes('/driver/home') ? 'active' : ''}">Kous</a>
        <a href="/pages/driver/earnings.html" class="navbar-link ${currentPath.includes('/driver/earnings') ? 'active' : ''}">Revni</a>
        <a href="/pages/driver/documents.html" class="navbar-link ${currentPath.includes('/driver/documents') ? 'active' : ''}">Dokiman</a>
        <a href="/pages/driver/subscribers.html" class="navbar-link ${currentPath.includes('/driver/subscribers') ? 'active' : ''}">Abònman</a>
        <a href="/pages/driver/account.html" class="navbar-link ${currentPath.includes('/driver/account') ? 'active' : ''}" data-i18n="nav_account">Kont</a>
      `;
    } else {
      // Rider logged in
      links = `
        <a href="/" class="navbar-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}">Akèy</a>
        <a href="/pages/rider/home.html" class="navbar-link ${currentPath.includes('/rider/home') ? 'active' : ''}">Kòmande</a>
        <a href="/pages/account/trips.html" class="navbar-link ${currentPath.includes('/account/trips') ? 'active' : ''}" data-i18n="nav_trips">Kous Mwen</a>
        <a href="/pages/account/wallet.html" class="navbar-link ${currentPath.includes('/account/wallet') ? 'active' : ''}" data-i18n="nav_wallet">Bous</a>
        <a href="/pages/account/profile.html" class="navbar-link ${currentPath.includes('/account/profile') || currentPath.includes('/account/settings') ? 'active' : ''}" data-i18n="nav_account">Kont</a>
      `;
    }

    if (isAdmin) {
      links += `
        <a href="/pages/admin/dashboard.html" class="navbar-link ${currentPath.includes('/admin/') ? 'active' : ''}" style="color:var(--accent); font-weight:700;">
          <i data-lucide="shield" style="width:14px; height:14px;"></i> Admin
        </a>
      `;
    }

    const currentLang = window.i18n ? window.i18n.getLang() : 'ht';
    const currentCur = window.i18n ? window.i18n.getCurrency() : 'HTG';

    const displayName = profile?.full_name ? profile.full_name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'Kont');
    const avatarUrl = profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80';

    navPlaceholder.innerHTML = `
      <div class="navbar-desktop-wrapper">
        <header class="navbar-pill">
          <a href="/" class="navbar-brand" style="text-decoration:none; display:flex; align-items:center;">
            <img src="/assets/img/logo-placeholder.svg" alt="KOURI +" style="height:34px; width:auto;">
          </a>
          <nav class="navbar-links">
            ${links}
          </nav>
          <div class="navbar-actions">
            <!-- Language Switcher -->
            <div class="nav-dropdown">
              <button type="button" class="nav-dropdown-btn" id="btn-lang-drop" title="Lang">
                <i data-lucide="globe" style="width:14px; height:14px;"></i>
                <span id="label-cur-lang">${currentLang.toUpperCase()}</span>
              </button>
              <div class="nav-dropdown-menu" id="menu-lang">
                <button type="button" class="nav-dropdown-item ${currentLang === 'ht' ? 'active' : ''}" data-set-lang="ht">Kreyòl Ayisyen</button>
                <button type="button" class="nav-dropdown-item ${currentLang === 'fr' ? 'active' : ''}" data-set-lang="fr">Français</button>
                <button type="button" class="nav-dropdown-item ${currentLang === 'en' ? 'active' : ''}" data-set-lang="en">English</button>
              </div>
            </div>

            <!-- Currency Toggle -->
            <button type="button" class="nav-dropdown-btn" id="btn-currency-toggle" title="Chanje Lajan">
              ${currentCur}
            </button>

            <!-- User Status or Login -->
            ${user ? `
              <div style="display:flex; align-items:center; gap:4px;">
                <a href="${profile?.role === 'driver' ? '/pages/driver/account.html' : '/pages/account/profile.html'}" class="nav-user-pill" style="text-decoration:none;" title="Gade pwofil ou">
                  <img src="${avatarUrl}" class="nav-user-avatar" alt="Avatar">
                  <span style="max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayName}</span>
                </a>
                <button type="button" id="btn-nav-logout" class="nav-dropdown-btn" title="Dekonekte" style="padding:6px; color:var(--text-muted);">
                  <i data-lucide="log-out" style="width:15px; height:15px;"></i>
                </button>
              </div>
            ` : `
              <a href="/login.html" class="btn btn-primary btn-sm btn-pill" data-i18n="nav_login">
                <i data-lucide="log-in" style="width:14px; height:14px;"></i>
                <span>Konekte</span>
              </a>
            `}
          </div>
        </header>
      </div>
    `;

    // Dropdown listeners
    const dropBtn = navPlaceholder.querySelector('#btn-lang-drop');
    const dropMenu = navPlaceholder.querySelector('#menu-lang');
    dropBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropMenu?.classList.toggle('active');
    });

    document.addEventListener('click', () => dropMenu?.classList.remove('active'));

    navPlaceholder.querySelectorAll('[data-set-lang]').forEach(b => {
      b.addEventListener('click', () => {
        const lang = b.getAttribute('data-set-lang');
        window.i18n?.setLang(lang);
        document.getElementById('label-cur-lang').textContent = lang.toUpperCase();
        dropMenu?.classList.remove('active');
      });
    });

    // Currency toggle listener
    const curBtn = navPlaceholder.querySelector('#btn-currency-toggle');
    curBtn?.addEventListener('click', () => {
      const nextCur = window.i18n?.getCurrency() === 'HTG' ? 'USD' : 'HTG';
      window.i18n?.setCurrency(nextCur);
      curBtn.textContent = nextCur;
    });

    // Logout listener
    const logoutBtn = navPlaceholder.querySelector('#btn-nav-logout');
    logoutBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Èske ou vle dekonekte?')) {
        window.authService?.signOut();
      }
    });

    if (window.logoManager) window.logoManager.renderAll(navPlaceholder);
  }

  renderMobileBottomNav(user, profile, isAdmin) {
    const mobilePlaceholder = document.getElementById('kouri-mobile-nav');
    if (!mobilePlaceholder) return;

    const path = window.location.pathname;

    let tabs = '';
    if (profile?.role === 'driver') {
      tabs = `
        <a href="/pages/driver/home.html" class="mobile-nav-item ${path.includes('/driver/home') ? 'active' : ''}">
          <i data-lucide="navigation"></i>
          <span class="mobile-nav-label">Kous</span>
        </a>
        <a href="/pages/driver/earnings.html" class="mobile-nav-item ${path.includes('/driver/earnings') ? 'active' : ''}">
          <i data-lucide="trending-up"></i>
          <span class="mobile-nav-label">Revni</span>
        </a>
        <a href="/pages/driver/documents.html" class="mobile-nav-item ${path.includes('/driver/documents') ? 'active' : ''}">
          <i data-lucide="file-text"></i>
          <span class="mobile-nav-label">Dokiman</span>
        </a>
        <a href="/pages/driver/account.html" class="mobile-nav-item ${path.includes('/driver/account') ? 'active' : ''}">
          <i data-lucide="user"></i>
          <span class="mobile-nav-label">Kont</span>
        </a>
      `;
    } else if (user) {
      // Logged in Rider
      tabs = `
        <a href="/" class="mobile-nav-item ${path === '/' || path === '/index.html' ? 'active' : ''}">
          <i data-lucide="home"></i>
          <span class="mobile-nav-label">Akèy</span>
        </a>
        <a href="/pages/rider/home.html" class="mobile-nav-item ${path.includes('/rider/home') ? 'active' : ''}">
          <i data-lucide="navigation"></i>
          <span class="mobile-nav-label">Kòmande</span>
        </a>
        <a href="/pages/account/trips.html" class="mobile-nav-item ${path.includes('/account/trips') ? 'active' : ''}">
          <i data-lucide="clock"></i>
          <span class="mobile-nav-label">Kous</span>
        </a>
        <a href="/pages/account/wallet.html" class="mobile-nav-item ${path.includes('/account/wallet') ? 'active' : ''}">
          <i data-lucide="wallet"></i>
          <span class="mobile-nav-label">Bous</span>
        </a>
        <a href="/pages/account/profile.html" class="mobile-nav-item ${path.includes('/account/profile') || path.includes('/account/settings') ? 'active' : ''}">
          <i data-lucide="user"></i>
          <span class="mobile-nav-label">Kont</span>
        </a>
      `;
    } else {
      // Visitor / Not logged in
      tabs = `
        <a href="/" class="mobile-nav-item ${path === '/' || path === '/index.html' ? 'active' : ''}">
          <i data-lucide="home"></i>
          <span class="mobile-nav-label">Akèy</span>
        </a>
        <a href="/pages/rider/home.html" class="mobile-nav-item ${path.includes('/rider/home') ? 'active' : ''}">
          <i data-lucide="navigation"></i>
          <span class="mobile-nav-label">Kòmande</span>
        </a>
        <a href="/pages/driver/home.html" class="mobile-nav-item ${path.includes('/driver/home') ? 'active' : ''}">
          <i data-lucide="car"></i>
          <span class="mobile-nav-label">Chofè</span>
        </a>
        <a href="/login.html" class="mobile-nav-item ${path.includes('login') ? 'active' : ''}">
          <i data-lucide="user"></i>
          <span class="mobile-nav-label">Konekte</span>
        </a>
      `;
    }

    if (isAdmin) {
      tabs += `
        <a href="/pages/admin/dashboard.html" class="mobile-nav-item ${path.includes('/admin/') ? 'active' : ''}">
          <i data-lucide="shield" style="color:var(--accent);"></i>
          <span class="mobile-nav-label" style="color:var(--accent);">Admin</span>
        </a>
      `;
    }

    mobilePlaceholder.innerHTML = `
      <div class="mobile-bottom-bar">
        ${tabs}
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.navigationBar = new NavigationBar();

  // Instant Cache Invalidation: Ensure Service Worker checks for fresh code immediately
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(reg => {
        reg.update();
      })
      .catch(e => console.debug('SW reg note:', e.message));
  }
});