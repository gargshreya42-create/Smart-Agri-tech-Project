import { useEffect, useState } from 'react';
import { api } from '../services/api';

// Reference lists (soil types, statuses, categories…) come from the API so client and server never drift.
const FALLBACK = {
  SOIL_TYPES: ['Black (Regur)', 'Alluvial', 'Red', 'Laterite', 'Sandy', 'Loamy', 'Clayey', 'Mixed'],
  IRRIGATION_TYPES: ['Drip', 'Sprinkler', 'Canal', 'Tube well', 'Rain-fed', 'Flood', 'Farm pond'],
  FARMING_TYPES: ['Organic', 'Natural', 'Conventional', 'Mixed'],
  GROWTH_STAGES: ['Planned', 'Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Harvested'],
  CROP_HEALTH: ['Healthy', 'Needs Attention', 'At Risk'],
  RESOURCE_CATEGORIES: ['Seeds', 'Fertilizers', 'Organic Products', 'Crop Care', 'Equipment', 'Irrigation'],
  ORDER_STATUSES: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
  CONSULTATION_STATUSES: ['Requested', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
  RISK_LEVELS: ['Low', 'Medium', 'High', 'Critical'],
  POST_CATEGORIES: ['Crop Problems', 'Farming Techniques', 'Weather', 'Pest & Disease', 'Irrigation', 'Harvest', 'Market & Schemes', 'General'],
  LANGUAGES: [{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी' }, { code: 'mr', label: 'मराठी' }],
  SOIL_STATUSES: ['Excellent', 'Good', 'Moderate', 'Poor', 'Critical'],
  ORDER_TRANSITIONS: {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['Processing', 'Cancelled'],
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered', 'Cancelled'],
    Delivered: [],
    Cancelled: [],
  },
};

let cached = null;
let pending = null;

export default function useMeta() {
  const [meta, setMeta] = useState(cached || FALLBACK);

  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    pending = pending || api.get('/meta').then((res) => { cached = { ...FALLBACK, ...res.data }; return cached; }).catch(() => FALLBACK);
    pending.then((value) => { if (alive) setMeta(value); });
    return () => { alive = false; };
  }, []);

  return meta;
}
