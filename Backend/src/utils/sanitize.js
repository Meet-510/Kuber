// Escape user-supplied values before interpolating them into HTML email
// templates. Without this, a name or message could inject markup/script
// into the outgoing email (stored-XSS in the recipient's inbox).
const MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => MAP[c]);
