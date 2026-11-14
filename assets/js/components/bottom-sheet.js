/**
 * ======================================================================
 * KOURI — Draggable Bottom Sheet Component (bottom-sheet.js)
 * Mobile-first draggable sheet with snap points (peek, half, full).
 * Uses GSAP 3.12 for fluid inertia / spring snapping.
 * ======================================================================
 */

class BottomSheet {
  constructor(elementId) {
    this.sheet = document.getElementById(elementId);
    if (!this.sheet) return;

    this.handle = this.sheet.querySelector('.sheet-handle-wrapper');
    this.currentSnap = 'half'; // default snap
    this.isDragging = false;
    this.startY = 0;
    this.currentY = 0;
    this.sheetHeight = 0;

    this.init();
  }

  init() {
    if (!this.handle) return;

    // Mobile touch events
    this.handle.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: true });

    // Desktop/Mouse events
    this.handle.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Initial snap
    this.snapTo('half', false);

    // Window resize handler
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        this.snapTo(this.currentSnap, false);
      } else {
        // Reset transform on desktop where it's a fixed left sidebar
        this.sheet.style.transform = '';
      }
    });
  }

  getSnapPositions() {
    const vh = window.innerHeight;
    return {
      peek: vh - 160,       // 160px visible
      half: vh * 0.52,      // 48% height
      full: vh * 0.12       // 88% height
    };
  }

  snapTo(point = 'half', animated = true) {
    if (window.innerWidth > 768) return; // Desktop layout

    this.currentSnap = point;
    this.sheet.classList.remove('snap-peek', 'snap-half', 'snap-full');
    this.sheet.classList.add(`snap-${point}`);

    const snaps = this.getSnapPositions();
    const targetY = snaps[point] !== undefined ? snaps[point] : snaps.half;

    if (window.gsap && animated) {
      window.gsap.to(this.sheet, {
        y: targetY,
        duration: 0.38,
        ease: 'power3.out'
      });
    } else {
      this.sheet.style.transform = `translateY(${targetY}px)`;
    }
  }

  onTouchStart(e) {
    if (window.innerWidth > 768) return;
    this.isDragging = true;
    this.startY = e.touches[0].clientY;
    const style = window.getComputedStyle(this.sheet);
    const matrix = new WebKitCSSMatrix(style.transform);
    this.startTranslateY = matrix.m42 || 0;
  }

  onTouchMove(e) {
    if (!this.isDragging) return;
    const deltaY = e.touches[0].clientY - this.startY;
    const newY = this.startTranslateY + deltaY;

    const snaps = this.getSnapPositions();
    // Clamp between full and off-screen bottom
    if (newY >= snaps.full && newY <= window.innerHeight - 80) {
      this.sheet.style.transform = `translateY(${newY}px)`;
    }
  }

  onTouchEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.resolveSnap();
  }

  onMouseDown(e) {
    if (window.innerWidth > 768) return;
    this.isDragging = true;
    this.startY = e.clientY;
    const style = window.getComputedStyle(this.sheet);
    const matrix = new WebKitCSSMatrix(style.transform);
    this.startTranslateY = matrix.m42 || 0;
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    const deltaY = e.clientY - this.startY;
    const newY = this.startTranslateY + deltaY;
    const snaps = this.getSnapPositions();
    if (newY >= snaps.full && newY <= window.innerHeight - 80) {
      this.sheet.style.transform = `translateY(${newY}px)`;
    }
  }

  onMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.resolveSnap();
  }

  resolveSnap() {
    const style = window.getComputedStyle(this.sheet);
    const matrix = new WebKitCSSMatrix(style.transform);
    const currentY = matrix.m42;
    const snaps = this.getSnapPositions();

    // Find nearest snap point
    const diffPeek = Math.abs(currentY - snaps.peek);
    const diffHalf = Math.abs(currentY - snaps.half);
    const diffFull = Math.abs(currentY - snaps.full);

    if (diffFull < diffHalf && diffFull < diffPeek) {
      this.snapTo('full');
    } else if (diffHalf < diffPeek) {
      this.snapTo('half');
    } else {
      this.snapTo('peek');
    }
  }
}

window.BottomSheet = BottomSheet;
