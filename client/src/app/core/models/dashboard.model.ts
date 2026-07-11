export interface StatusSummary   { status:   string; count: number; }
export interface PrioritySummary { priority: string; count: number; }
export interface CategorySummary { category: string; count: number; }

export interface DashboardStats {
  total:      number;
  open:       number;
  inProgress: number;
  resolved:   number;
  critical:   number;
}
