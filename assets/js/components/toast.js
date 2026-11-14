/**
 * ======================================================================
 * KOURI — Toast Notification Component (toast.js)
 * High-performance, accessible toasts for all async actions and errors.
 * Zero emoji; uses Lucide icons.
 * ======================================================================
 */

function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}

const TOAST_ICONS = {
  success: 'check-circle-2',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info'
};

window.showToast = function(type = 'info', title = '', message = '', duration = 4000) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const iconName = TOAST_ICONS[type] || 'info';

  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${iconName}"></i>
    </div>
    <div class="toast-body">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-msg">${message}</div>
    </div>
    <button type="button" class="btn-ghost btn-sm" style="padding:4px; min-height:24px; min-width:24px; margin-left:auto;" aria-label="Close">
      <i data-lucide="x" style="width:14px; height:14px;"></i>
    </button>
  `;

  // Close button click
  const closeBtn = toast.querySelector('button');
  const dismiss = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 250);
  };
  closeBtn.addEventListener('click', dismiss);

  container.appendChild(toast);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: toast });
  }

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
  return toast;
};

// Aliases
window.toastSuccess = (msg, title) => window.showToast('success', title || window.t('action_confirm', 'Siksè'), msg);
window.toastError = (msg, title) => window.showToast('error', title || 'Erè', msg, 6000);
window.toastWarning = (msg, title) => window.showToast('warning', title || 'Atansyon', msg);
window.toastInfo = (msg, title) => window.showToast('info', title || 'Enfòmasyon', msg);
