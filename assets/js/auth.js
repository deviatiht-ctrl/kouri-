/**
 * ======================================================================
 * KOURI — Authentication & Role-Based Access Engine (auth.js)
 * Manages Supabase Auth, Profiles, Admin Verification, and Role Routing.
 * ======================================================================
 */

const DEMO_USERS = {
  rider: {
    id: '11111111-0000-0000-0000-000000000001',
    email: 'pasaje@kouri.ht',
    role: 'rider',
    full_name: 'Jean-Baptiste Delva',
    phone: '+509 3712-3456',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    language: 'ht',
    currency: 'HTG'
  },
  driver: {
    id: '22222222-0000-0000-0000-000000000002',
    email: 'chofe@kouri.ht',
    role: 'driver',
    full_name: 'Mackenzy Pierre',
    phone: '+509 4811-2233',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    language: 'ht',
    currency: 'HTG',
    driver_status: 'approved',
    rating: 4.92,
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      color: 'Nwa (Black)',
      plate_number: 'AA-12345'
    }
  },
  admin: {
    id: '33333333-0000-0000-0000-000000000003',
    email: 'admin@kouri.ht',
    role: 'admin',
    full_name: 'Direktè Operasyon KOURI',
    phone: '+509 3100-0000',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    language: 'ht',
    currency: 'HTG'
  }
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
  }

  /**
   * Get currently logged-in user and profile
   */
  async getCurrentUser() {
    // 1. Check if Supabase client is live and has an active session
    if (window.db && window.db.auth) {
      try {
        const { data: { session } } = await window.db.auth.getSession();
        if (session && session.user) {
          this.currentUser = session.user;
          const { data: profile } = await window.db
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          this.currentProfile = profile || {
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'rider',
            full_name: session.user.user_metadata?.full_name || ''
          };
          localStorage.setItem('kouri_auth_session', JSON.stringify(this.currentProfile));
          return { user: this.currentUser, profile: this.currentProfile };
        }
      } catch (err) {
        console.warn('[KOURI Auth] Session check notice:', err.message);
      }
    }

    // 2. Check local simulated demo session
    const cachedUser = localStorage.getItem('kouri_auth_session');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        this.currentUser = parsed;
        this.currentProfile = parsed;
        return { user: parsed, profile: parsed };
      } catch (e) {}
    }

    return { user: null, profile: null };
  }

  /**
   * Check if a given email is whitelisted in admin_users
   */
  async isAdminEmail(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === 'admin@kouri.ht' || cleanEmail === 'cvisual@kouri.ht' || cleanEmail === 'laurorejeanclarens0@gmail.com' || cleanEmail === 'laurorejeanclarens9@gmail.com') {
      return true;
    }

    if (window.db) {
      try {
        const { data } = await window.db
          .from('admin_users')
          .select('email')
          .ilike('email', cleanEmail)
          .single();
        if (data) return true;
      } catch (e) {}
    }
    return false;
  }

  /**
   * Sign In with Email and Password
   */
  async signIn(email, password) {
    // If Supabase live
    if (window.db && window.db.auth && !window.KOURI_CONFIG.isDemoMode) {
      const { data, error } = await window.db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { profile } = await this.getCurrentUser();
      this.redirectByRole(profile.role);
      return data;
    }

    // Demo Mode Sign In Fallback
    const lower = email.toLowerCase();
    let role = 'rider';
    if (lower.includes('admin') || lower === 'cvisual@kouri.ht' || lower === 'laurorejeanclarens0@gmail.com' || lower === 'laurorejeanclarens9@gmail.com') role = 'admin';
    else if (lower.includes('chofe') || lower.includes('driver')) role = 'driver';

    const demoData = DEMO_USERS[role] || DEMO_USERS.rider;
    const sessionData = { ...demoData, email: email };
    localStorage.setItem('kouri_auth_session', JSON.stringify(sessionData));
    this.redirectByRole(role);
    return { user: sessionData };
  }

  /**
   * Sign Up with Email, Password, Name, Phone & Role ('rider' or 'driver')
   */
  async signUp(email, password, { full_name, phone, role = 'rider' }) {
    if (window.db && window.db.auth && !window.KOURI_CONFIG.isDemoMode) {
      const { data, error } = await window.db.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, phone, role }
        }
      });
      if (error) throw error;
      return data;
    }

    // Demo Mode Sign Up
    const sessionData = {
      id: 'demo_' + Date.now(),
      email,
      full_name,
      phone,
      role
    };
    localStorage.setItem('kouri_auth_session', JSON.stringify(sessionData));
    this.redirectByRole(role);
    return { user: sessionData };
  }

  /**
   * Set Active Demo User (Convenient switcher for testing flows)
   */
  loginAsDemo(role = 'rider') {
    const demo = DEMO_USERS[role] || DEMO_USERS.rider;
    localStorage.setItem('kouri_auth_session', JSON.stringify(demo));
    this.redirectByRole(role);
  }

  /**
   * Update Profile Details
   */
  async updateProfile(updates = {}) {
    const { user, profile } = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    if (window.db && !window.KOURI_CONFIG.isDemoMode) {
      const { error } = await window.db
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
    }

    // Update local session
    const currentSession = JSON.parse(localStorage.getItem('kouri_auth_session') || '{}');
    const updated = { ...currentSession, ...updates };
    localStorage.setItem('kouri_auth_session', JSON.stringify(updated));
    return updated;
  }

  /**
   * Delete Current User Account
   */
  async deleteAccount() {
    const { user } = await this.getCurrentUser();
    if (!user) return;

    if (window.db && !window.KOURI_CONFIG.isDemoMode) {
      try {
        // Delete profile which cascades or soft deletes
        await window.db.from('profiles').delete().eq('id', user.id);
      } catch (err) {
        console.warn('DB delete cascade notice:', err);
      }
    }

    // Clear local storage and caches
    localStorage.removeItem('kouri_auth_session');
    localStorage.removeItem('kouri_hero_trip');
    try {
      if (window.offlineDB) await window.offlineDB.clearActiveTrip();
    } catch(e) {}

    window.location.href = '/register.html?deleted=true';
  }

  /**
   * Log out
   */
  async signOut() {
    if (window.db && window.db.auth) {
      try { await window.db.auth.signOut(); } catch (e) {}
    }
    localStorage.removeItem('kouri_auth_session');
    window.location.href = '/login.html';
  }

  /**
   * Redirect to target page based on role
   */
  redirectByRole(role) {
    if (role === 'admin') {
      window.location.href = '/pages/admin/dashboard.html';
    } else if (role === 'driver') {
      window.location.href = '/pages/driver/home.html';
    } else {
      window.location.href = '/pages/rider/home.html';
    }
  }

  /**
   * Page guard: Require authentication
   */
  async requireAuth(allowedRoles = []) {
    const { user, profile } = await this.getCurrentUser();
    if (!user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
      this.redirectByRole(profile.role);
      return false;
    }

    return { user, profile };
  }

  /**
   * Page guard: Strict Admin access check
   */
  async requireAdmin() {
    const { user, profile } = await this.getCurrentUser();
    if (!user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    const isAdmin = await this.isAdminEmail(user.email) || profile.role === 'admin';
    if (!isAdmin) {
      window.location.href = '/pages/rider/home.html';
      return false;
    }

    return { user, profile };
  }
}

window.authService = new AuthService();
