export const formatDate = (value, options) =>
  value ? new Date(value).toLocaleDateString('en-IN', options || { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, size] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${name}${n > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

export const greetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'greeting.morning';
  if (hour < 17) return 'greeting.afternoon';
  return 'greeting.evening';
};

export const ALERT_ICONS = {
  danger: 'bi-exclamation-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
  success: 'bi-check-circle-fill',
};

// Every status maps to a tone AND an icon so meaning never relies on colour alone.
export const STATUS_STYLES = {
  // crop health
  Healthy: ['green', 'bi-heart-pulse-fill'],
  'Needs Attention': ['amber', 'bi-eye-fill'],
  'At Risk': ['red', 'bi-exclamation-triangle-fill'],
  // risk levels
  Low: ['green', 'bi-shield-check'],
  Medium: ['amber', 'bi-shield-exclamation'],
  High: ['orange', 'bi-exclamation-triangle-fill'],
  Critical: ['red', 'bi-x-octagon-fill'],
  // soil
  Excellent: ['green', 'bi-emoji-smile-fill'],
  Good: ['lime', 'bi-hand-thumbs-up-fill'],
  Moderate: ['amber', 'bi-dash-circle-fill'],
  Poor: ['orange', 'bi-emoji-frown-fill'],
  // orders
  Pending: ['amber', 'bi-hourglass-split'],
  Confirmed: ['blue', 'bi-check2-circle'],
  Processing: ['indigo', 'bi-gear-fill'],
  Shipped: ['indigo', 'bi-truck'],
  Delivered: ['green', 'bi-box-seam-fill'],
  Cancelled: ['red', 'bi-x-circle-fill'],
  // consultations
  Requested: ['amber', 'bi-send-fill'],
  Accepted: ['blue', 'bi-person-check-fill'],
  'In Progress': ['indigo', 'bi-chat-dots-fill'],
  Completed: ['green', 'bi-patch-check-fill'],
  // generic
  Active: ['green', 'bi-check-circle-fill'],
  Inactive: ['grey', 'bi-pause-circle-fill'],
  Hidden: ['grey', 'bi-eye-slash-fill'],
  Visible: ['green', 'bi-eye-fill'],
  Available: ['green', 'bi-check-circle-fill'],
  'Out of stock': ['red', 'bi-x-circle-fill'],
  Low_stock: ['orange', 'bi-exclamation-circle-fill'],
};

export const GROWTH_ICONS = {
  Planned: 'bi-calendar-check',
  Germination: 'bi-record-circle',
  Seedling: 'bi-flower1',
  Vegetative: 'bi-flower2',
  Flowering: 'bi-flower3',
  Fruiting: 'bi-apple',
  Maturity: 'bi-tree-fill',
  Harvested: 'bi-basket2-fill',
};

export const CATEGORY_ICONS = {
  Seeds: 'bi-flower1',
  Fertilizers: 'bi-box2-heart',
  'Organic Products': 'bi-recycle',
  'Crop Care': 'bi-shield-plus',
  Equipment: 'bi-tools',
  Irrigation: 'bi-droplet-half',
};

export const ACTIVITY_ICONS = {
  farm: 'bi-geo-alt-fill',
  crop: 'bi-flower2',
  soil: 'bi-layers-fill',
  order: 'bi-bag-check-fill',
  consultation: 'bi-chat-heart-fill',
  community: 'bi-people-fill',
};

// Chart colours: validated, colour-blind-friendly set used across all charts.
export const CHART_COLORS = ['#2f7d3c', '#e6a81c', '#3a86c8', '#9a6b3e', '#8e6bbf', '#d9622b', '#5aa9a4', '#a6d65a'];
export const STATUS_CHART_COLORS = {
  Pending: '#e6a81c', Confirmed: '#3a86c8', Processing: '#8e6bbf', Shipped: '#5aa9a4', Delivered: '#2f7d3c', Cancelled: '#c0392b',
  Healthy: '#2f7d3c', 'Needs Attention': '#e6a81c', 'At Risk': '#c0392b',
  Low: '#2f7d3c', Medium: '#e6a81c', High: '#d9622b', Critical: '#c0392b',
};
