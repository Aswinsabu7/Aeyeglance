import { environment } from '../../environments/environment';

const BASE = environment.apiUrl;

/**
 * Centralised URL registry – no hardcoded endpoints elsewhere.
 */
export const URLS = {
  auth: {
    login:   `${BASE}/api/auth/login`,
    refresh: `${BASE}/api/auth/refresh`,
    logout:  `${BASE}/api/auth/logout`
  },
  tickets: {
    base:  `${BASE}/api/tickets`,
    byId:  (id: number) => `${BASE}/api/tickets/${id}`
  },
  ai: {
    analyze: (id: number) => `${BASE}/api/ai/${id}`,
    ask:     (id: number) => `${BASE}/api/ai/${id}`
  },
  dashboard: {
    stats:           `${BASE}/api/dashboard/stats`,
    statusSummary:   `${BASE}/api/dashboard/status-summary`,
    prioritySummary: `${BASE}/api/dashboard/priority-summary`,
    categorySummary: `${BASE}/api/dashboard/category-summary`
  }
} as const;
