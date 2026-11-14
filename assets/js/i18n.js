/**
 * ======================================================================
 * KOURI — Internationalization & Currency Engine (i18n.js)
 * Languages: Haitian Creole ('ht' - default), French ('fr'), English ('en')
 * Currency: HTG (primary) + USD display option
 * ======================================================================
 */

const DICTIONARY = {
  ht: {
    // Brand & Meta
    app_name: "KOURI +",
    tagline: "Transpò rapid, fyab e an sekirite nan Ayiti",
    designed_by: "Designed by Cvisual",
    
    // Navbar & Common
    nav_home: "Akèy",
    nav_trips: "Kous mwen",
    nav_subscription: "Abònman",
    nav_wallet: "Bous",
    nav_account: "Kont mwen",
    nav_driver_portal: "Espas Chofè",
    nav_admin: "Administrasyon",
    nav_login: "Konekte",
    nav_register: "Enskri",
    nav_logout: "Dekonekte",
    
    // Actions
    action_confirm: "Konfime",
    action_cancel: "Anile",
    action_save: "Anrejistre",
    action_delete: "Efase",
    action_retry: "Re-eseye",
    action_search: "Chèche",
    action_close: "Fèmen",
    action_back: "Retounen",
    action_next: "Swivan",
    action_copy: "Kopye",

    // Landing Page
    hero_title: "Chak deplasman ou vin pi senp, rapid e an sekirite.",
    hero_subtitle: "Kòmande yon kous fasilman nan Pòtoprens ak tout Ayiti, oswa rantre kòm chofè patnè pou ogmante revni ou.",
    btn_book_ride: "Kòmande yon kous",
    btn_become_driver: "Vin yon chofè",
    features_title: "Poukisa chwazi KOURI +?",
    feature_1_title: "Kous san entènèt (Mòd Ofline)",
    feature_1_desc: "Depi chofè a pran w, kous la kontinye fonksyone epi konfime menm lè rezo tonbe.",
    feature_2_title: "Pri Klè & Transparan",
    feature_2_desc: "Pa gen sipriz. Pri a fiks oswa kalkile avan ou monte, peyab an Goud, MonCash oswa NatCash.",
    feature_3_title: "Abònman ak Chofè Dedye",
    feature_3_desc: "Fè yon abònman pou wout travay ou oswa lekòl timoun yo ak yon chofè verifye pèsonèlman.",
    pricing_teaser_title: "Opsyon machin ki adapte a bezwen ou",
    safety_title: "Sekirite ou se priyorite absoli nou",
    safety_desc: "Bouton SOS dirèk, pataj wout an dirèk ak fanmi ou, epi kòd verifikasyon 6 chif avan demaraj.",
    install_pwa_title: "Enstale aplikasyon KOURI sou telefòn ou",
    install_pwa_desc: "Aksè rapid san pase nan App Store. Travay pi vit epi itilize mwens done.",
    btn_install: "Enstale KOURI",

    // Rider Booking
    where_to: "Ki kote ou prale?",
    pickup_location: "Kote pou pran w lan",
    destination_location: "Destinasyon ou",
    saved_places: "Kote ou anrejistre",
    recent_places: "Kote ou fèk ale",
    choose_vehicle: "Chwazi kategori machin",
    estimated_arrival: "Rive estime",
    price_estimate: "Pri estime",
    payment_method: "Mwayen peman",
    cash: "Kach (Lajan kach)",
    wallet: "Bous KOURI",
    moncash: "MonCash",
    natcash: "NatCash",
    subscription_applied: "Abònman w ap aplike (0 HTG kous sa)",
    btn_request_kouri: "Kòmande KOURI kounye a",
    searching_driver: "N ap chèche yon chofè ki toupre w...",
    driver_assigned: "Chofè asiyen!",
    driver_arriving: "Chofè a ap vini",
    driver_arrived: "Chofè a rive sou plas",
    trip_in_progress: "Kous la ap fèt...",
    trip_completed: "Kous la fini!",
    trip_code_label: "Kòd sekirite pou bay chofè a:",
    trip_qr_label: "Oswa fè chofè a eskane kòd sa a:",
    sos_button: "SOS Ijans",
    share_trip: "Pataje kous la",
    call_driver: "Rele chofè",
    rate_trip_title: "Ki jan kous la te pase?",
    add_tip: "Ajoute yon ti kras poubwa (Tip)",
    btn_submit_rating: "Voye evalyasyon",

    // Driver App
    driver_status_online: "Ou an liy (Disponib)",
    driver_status_offline: "Ou pa an liy",
    go_online: "Mete w an liy",
    go_offline: "Mete w pa an liy",
    new_ride_request: "Nouvo demann kous!",
    pickup_distance: "Distans pou pran pasaje a",
    trip_distance: "Distans vwayaj la",
    estimated_earnings: "Revni ou estime",
    accept_ride: "Aksepte kous la",
    decline_ride: "Refize",
    confirm_pickup_code: "Mete kòd pasaje a (6 chif)",
    btn_confirm_pickup: "Konfime pasaje a monte",
    btn_arrived_pickup: "Mwen rive sou plas",
    btn_start_trip: "Kòmanse kous la",
    btn_complete_trip: "Fini kous la",
    offline_sync_saved: "Mòd San Entènèt: Kous la anrejistre lokalman sou telefòn ou.",
    offline_sync_badge_synced: "Senkronize ak sèvè a",
    offline_sync_badge_pending: "Ap tann rezo pou voye",

    // Categories
    cat_moto: "Kouri Moto",
    cat_standard: "Kouri Klasik",
    cat_comfort: "Kouri Konfò",
    cat_van: "Kouri Van",

    // Subscriptions
    subscription_title: "Abònman mwen",
    no_active_subscription: "Ou pa gen yon abònman aktif pou kounye a.",
    active_plan: "Plan aktif",
    rides_remaining: "Kous ki rete",
    renewal_date: "Dat renouvèlman",
    assigned_driver: "Chofè dedye ou",
    no_assigned_driver: "Chofè a pral asiyen pa administratè a.",
    driver_schedule: "Orè disponiblite",
    btn_upgrade_plan: "Chanje oswa renouvle plan",
    available_plans: "Plan ki disponib yo",

    // Wallet
    wallet_balance: "Balans Bous ou",
    btn_top_up: "Rechaje bous",
    top_up_instructions: "Voye montan an sou kont MonCash oswa NatCash ofisyèl KOURI, epi voye prèv tranzaksyon an.",
    upload_proof: "Telechaje foto resi oswa capture ekran",
    transaction_history: "Istorik tranzaksyon yo",

    // Admin
    admin_dashboard: "Tablodbò Jeneral",
    admin_live_map: "Kat jeyografik an dirèk",
    admin_rides: "Jesyon Kous yo",
    admin_drivers: "Jesyon Chofè yo",
    admin_riders: "Jesyon Pasaje yo",
    admin_pricing: "Konfigirasyon Pri",
    admin_zones: "Zòn ak Pri Fiks",
    admin_subscriptions: "Plan Abònman",
    admin_payments: "Validasyon Peman & Payout",
    admin_support: "Tikè & Alèt SOS",
    admin_settings: "Paramèt Sistèm & Mak"
  },

  fr: {
    // Brand & Meta
    app_name: "KOURI +",
    tagline: "Transport rapide, fiable et sécurisé en Haïti",
    designed_by: "Designed by Cvisual",
    
    // Navbar & Common
    nav_home: "Accueil",
    nav_trips: "Mes courses",
    nav_subscription: "Abonnement",
    nav_wallet: "Portefeuille",
    nav_account: "Mon compte",
    nav_driver_portal: "Espace Chauffeur",
    nav_admin: "Administration",
    nav_login: "Connexion",
    nav_register: "Inscription",
    nav_logout: "Déconnexion",

    // Actions
    action_confirm: "Confirmer",
    action_cancel: "Annuler",
    action_save: "Enregistrer",
    action_delete: "Supprimer",
    action_retry: "Réessayer",
    action_search: "Rechercher",
    action_close: "Fermer",
    action_back: "Retour",
    action_next: "Suivant",
    action_copy: "Copier",

    // Landing Page
    hero_title: "Chaque trajet devient plus simple, rapide et sécurisé.",
    hero_subtitle: "Commandez une course facilement à Port-au-Prince et partout en Haïti, ou rejoignez-nous comme chauffeur partenaire pour accroître vos revenus.",
    btn_book_ride: "Commander une course",
    btn_become_driver: "Devenir chauffeur",
    features_title: "Pourquoi choisir KOURI ?",
    feature_1_title: "Courses hors-ligne (Mode Offline)",
    feature_1_desc: "Dès que le chauffeur vous a pris en charge, la course continue et se confirme sans aucune connexion Internet.",
    feature_2_title: "Tarifs Clairs & Transparents",
    feature_2_desc: "Aucune mauvaise surprise. Prix fixe ou calculé à l'avance, payable en Gourdes, MonCash ou NatCash.",
    feature_3_title: "Abonnements avec Chauffeur Dédié",
    feature_3_desc: "Abonnez-vous pour vos trajets travail ou école avec un chauffeur vérifié et réservé.",
    pricing_teaser_title: "Des catégories de véhicules adaptées à vos besoins",
    safety_title: "Votre sécurité est notre priorité absolue",
    safety_desc: "Bouton SOS d'urgence, partage de trajet en direct et code de sécurité à 6 chiffres.",
    install_pwa_title: "Installez l'application KOURI sur votre téléphone",
    install_pwa_desc: "Accès instantané sans passer par l'App Store. Plus rapide et économe en données.",
    btn_install: "Installer KOURI",

    // Rider Booking
    where_to: "Où allez-vous ?",
    pickup_location: "Lieu de prise en charge",
    destination_location: "Lieu de destination",
    saved_places: "Lieux enregistrés",
    recent_places: "Lieux récents",
    choose_vehicle: "Choisissez une catégorie",
    estimated_arrival: "Arrivée estimée",
    price_estimate: "Prix estimé",
    payment_method: "Moyen de paiement",
    cash: "Espèces (Cash)",
    wallet: "Portefeuille KOURI",
    moncash: "MonCash",
    natcash: "NatCash",
    subscription_applied: "Abonnement appliqué (0 HTG pour ce trajet)",
    btn_request_kouri: "Commander maintenant",
    searching_driver: "Recherche d'un chauffeur à proximité...",
    driver_assigned: "Chauffeur assigné !",
    driver_arriving: "Le chauffeur arrive",
    driver_arrived: "Le chauffeur est sur place",
    trip_in_progress: "Course en cours...",
    trip_completed: "Course terminée !",
    trip_code_label: "Code secret à communiquer au chauffeur :",
    trip_qr_label: "Ou présentez ce QR code au chauffeur :",
    sos_button: "SOS Urgence",
    share_trip: "Partager la course",
    call_driver: "Appeler le chauffeur",
    rate_trip_title: "Comment s'est passée votre course ?",
    add_tip: "Ajouter un pourboire",
    btn_submit_rating: "Envoyer l'évaluation",

    // Driver App
    driver_status_online: "Vous êtes en ligne (Disponible)",
    driver_status_offline: "Vous êtes hors-ligne",
    go_online: "Passer en ligne",
    go_offline: "Passer hors-ligne",
    new_ride_request: "Nouvelle demande de course !",
    pickup_distance: "Distance vers le client",
    trip_distance: "Distance de la course",
    estimated_earnings: "Revenus estimés",
    accept_ride: "Accepter la course",
    decline_ride: "Refuser",
    confirm_pickup_code: "Saisir le code client (6 chiffres)",
    btn_confirm_pickup: "Confirmer la prise en charge",
    btn_arrived_pickup: "Je suis arrivé sur place",
    btn_start_trip: "Démarrer la course",
    btn_complete_trip: "Terminer la course",
    offline_sync_saved: "Mode Hors-ligne : Course enregistrée localement sur votre appareil.",
    offline_sync_badge_synced: "Synchronisé avec le serveur",
    offline_sync_badge_pending: "En attente de connexion réseau",

    // Categories
    cat_moto: "Kouri Moto",
    cat_standard: "Kouri Standard",
    cat_comfort: "Kouri Confort",
    cat_van: "Kouri Van",

    // Subscriptions
    subscription_title: "Mon abonnement",
    no_active_subscription: "Vous n'avez aucun abonnement actif actuellement.",
    active_plan: "Plan actif",
    rides_remaining: "Courses restantes",
    renewal_date: "Date de renouvellement",
    assigned_driver: "Votre chauffeur dédié",
    no_assigned_driver: "Votre chauffeur sera assigné par l'administrateur.",
    driver_schedule: "Horaires de disponibilité",
    btn_upgrade_plan: "Changer ou renouveler",
    available_plans: "Formules d'abonnements",

    // Wallet
    wallet_balance: "Solde du Portefeuille",
    btn_top_up: "Recharger",
    top_up_instructions: "Effectuez un virement sur nos comptes officiels MonCash ou NatCash et téléchargez la preuve.",
    upload_proof: "Télécharger le reçu ou la capture",
    transaction_history: "Historique des transactions",

    // Admin
    admin_dashboard: "Tableau de Bord",
    admin_live_map: "Carte en Direct",
    admin_rides: "Gestion des Courses",
    admin_drivers: "Gestion des Chauffeurs",
    admin_riders: "Gestion des Passagers",
    admin_pricing: "Configuration des Prix",
    admin_zones: "Zones & Prix Forfaitaires",
    admin_subscriptions: "Plans d'Abonnement",
    admin_payments: "Validation des Paiements & Payouts",
    admin_support: "Support & Alertes SOS",
    admin_settings: "Paramètres & Marque"
  },

  en: {
    // Brand & Meta
    app_name: "KOURI +",
    tagline: "Fast, reliable and safe transportation in Haiti",
    designed_by: "Designed by Cvisual",
    
    // Navbar & Common
    nav_home: "Home",
    nav_trips: "My Trips",
    nav_subscription: "Subscription",
    nav_wallet: "Wallet",
    nav_account: "My Account",
    nav_driver_portal: "Driver Portal",
    nav_admin: "Administration",
    nav_login: "Sign In",
    nav_register: "Sign Up",
    nav_logout: "Log Out",

    // Actions
    action_confirm: "Confirm",
    action_cancel: "Cancel",
    action_save: "Save",
    action_delete: "Delete",
    action_retry: "Retry",
    action_search: "Search",
    action_close: "Close",
    action_back: "Back",
    action_next: "Next",
    action_copy: "Copy",

    // Landing Page
    hero_title: "Every trip made simpler, faster, and safer.",
    hero_subtitle: "Book a ride seamlessly across Port-au-Prince and throughout Haiti, or sign up as a partner driver to boost your earnings.",
    btn_book_ride: "Book a ride",
    btn_become_driver: "Become a driver",
    features_title: "Why choose KOURI?",
    feature_1_title: "Works Offline",
    feature_1_desc: "Once the driver picks you up, the trip keeps running and completes smoothly with zero internet.",
    feature_2_title: "Transparent Fares",
    feature_2_desc: "No surprises. Fixed or upfront fares payable in Gourdes, MonCash, or NatCash.",
    feature_3_title: "Dedicated Driver Passes",
    feature_3_desc: "Subscribe for work or school commutes with a personally verified and scheduled driver.",
    pricing_teaser_title: "Vehicle categories tailored for you",
    safety_title: "Your safety is our top priority",
    safety_desc: "Instant emergency SOS button, live route sharing, and a 6-digit confirmation pin before departure.",
    install_pwa_title: "Install the KOURI app on your phone",
    install_pwa_desc: "Instant access without downloading from app stores. Fast, lightweight, and low data usage.",
    btn_install: "Install KOURI",

    // Rider Booking
    where_to: "Where to?",
    pickup_location: "Pickup location",
    destination_location: "Destination",
    saved_places: "Saved places",
    recent_places: "Recent places",
    choose_vehicle: "Choose category",
    estimated_arrival: "Estimated arrival",
    price_estimate: "Estimated fare",
    payment_method: "Payment method",
    cash: "Cash",
    wallet: "KOURI Wallet",
    moncash: "MonCash",
    natcash: "NatCash",
    subscription_applied: "Subscription applied (0 HTG for this trip)",
    btn_request_kouri: "Request KOURI now",
    searching_driver: "Searching for a nearby driver...",
    driver_assigned: "Driver assigned!",
    driver_arriving: "Driver is on the way",
    driver_arrived: "Driver has arrived",
    trip_in_progress: "Trip in progress...",
    trip_completed: "Trip completed!",
    trip_code_label: "Give this code to the driver:",
    trip_qr_label: "Or have the driver scan this QR code:",
    sos_button: "Emergency SOS",
    share_trip: "Share trip",
    call_driver: "Call driver",
    rate_trip_title: "How was your trip?",
    add_tip: "Add a tip",
    btn_submit_rating: "Submit rating",

    // Driver App
    driver_status_online: "You are online (Available)",
    driver_status_offline: "You are offline",
    go_online: "Go Online",
    go_offline: "Go Offline",
    new_ride_request: "New trip request!",
    pickup_distance: "Distance to passenger",
    trip_distance: "Trip distance",
    estimated_earnings: "Estimated earnings",
    accept_ride: "Accept ride",
    decline_ride: "Decline",
    confirm_pickup_code: "Enter 6-digit rider code",
    btn_confirm_pickup: "Confirm pickup",
    btn_arrived_pickup: "I have arrived",
    btn_start_trip: "Start trip",
    btn_complete_trip: "Complete trip",
    offline_sync_saved: "Offline Mode: Trip saved locally on your device.",
    offline_sync_badge_synced: "Synced with server",
    offline_sync_badge_pending: "Waiting for network",

    // Categories
    cat_moto: "Kouri Moto",
    cat_standard: "Kouri Classic",
    cat_comfort: "Kouri Comfort",
    cat_van: "Kouri Van",

    // Subscriptions
    subscription_title: "My Subscription",
    no_active_subscription: "You currently have no active subscription.",
    active_plan: "Active plan",
    rides_remaining: "Rides remaining",
    renewal_date: "Renewal date",
    assigned_driver: "Your dedicated driver",
    no_assigned_driver: "Your driver will be assigned by the administrator.",
    driver_schedule: "Availability schedule",
    btn_upgrade_plan: "Change or renew plan",
    available_plans: "Available subscription plans",

    // Wallet
    wallet_balance: "Wallet Balance",
    btn_top_up: "Top Up",
    top_up_instructions: "Transfer to our official MonCash or NatCash account and upload transaction proof.",
    upload_proof: "Upload receipt or screenshot",
    transaction_history: "Transaction history",

    // Admin
    admin_dashboard: "Dashboard",
    admin_live_map: "Live Map",
    admin_rides: "Rides Management",
    admin_drivers: "Drivers Management",
    admin_riders: "Riders Management",
    admin_pricing: "Pricing Rules",
    admin_zones: "Zones & Fixed Prices",
    admin_subscriptions: "Subscription Plans",
    admin_payments: "Payment & Payout Validation",
    admin_support: "Support & SOS Alerts",
    admin_settings: "System & Branding Settings"
  }
};

class I18nEngine {
  constructor() {
    this.currentLang = localStorage.getItem('kouri_lang') || 'ht'; // Haitian Creole default
    this.currentCurrency = localStorage.getItem('kouri_currency') || 'HTG'; // HTG primary
    this.usdRate = 132.0; // 1 USD = ~132 HTG
  }

  getLang() {
    return this.currentLang;
  }

  setLang(lang) {
    if (!DICTIONARY[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('kouri_lang', lang);
    document.documentElement.lang = lang;
    this.translateDOM();
    window.dispatchEvent(new CustomEvent('kouri:language-changed', { detail: { lang } }));
  }

  getCurrency() {
    return this.currentCurrency;
  }

  setCurrency(cur) {
    if (cur !== 'HTG' && cur !== 'USD') return;
    this.currentCurrency = cur;
    localStorage.setItem('kouri_currency', cur);
    this.translateDOM();
    window.dispatchEvent(new CustomEvent('kouri:currency-changed', { detail: { cur } }));
  }

  t(key, fallback = '') {
    const langDict = DICTIONARY[this.currentLang] || DICTIONARY.ht;
    if (langDict[key] !== undefined) return langDict[key];
    if (DICTIONARY.ht[key] !== undefined) return DICTIONARY.ht[key];
    return fallback || key;
  }

  formatMoney(amountInHTG, targetCurrency = null) {
    const cur = targetCurrency || this.currentCurrency;
    const num = parseFloat(amountInHTG) || 0;
    if (cur === 'USD') {
      const usdVal = num / this.usdRate;
      return `$${usdVal.toFixed(2)} USD`;
    }
    return `${Math.round(num).toLocaleString('fr-FR')} HTG`;
  }

  translateDOM(container = document) {
    const elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) {
            el.setAttribute('placeholder', text);
          }
        } else {
          el.textContent = text;
        }
      }
    });

    // Translate currency values
    const moneyEls = container.querySelectorAll('[data-money-htg]');
    moneyEls.forEach(el => {
      const htgVal = parseFloat(el.getAttribute('data-money-htg')) || 0;
      el.textContent = this.formatMoney(htgVal);
    });

    // Re-initialize Lucide Icons after every DOM render/translation
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}

window.i18n = new I18nEngine();
window.t = (key, fallback) => window.i18n.t(key, fallback);
window.formatMoney = (amt, cur) => window.i18n.formatMoney(amt, cur);

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.i18n.translateDOM();
});
