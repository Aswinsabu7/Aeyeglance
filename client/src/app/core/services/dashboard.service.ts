import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URLS } from '../../utilities/urls';
import { ApiResponse } from '../models/api-response.model';
import { StatusSummary, PrioritySummary, CategorySummary, DashboardStats } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(URLS.dashboard.stats);
  }

  getStatusSummary(): Observable<ApiResponse<StatusSummary[]>> {
    return this.http.get<ApiResponse<StatusSummary[]>>(URLS.dashboard.statusSummary);
  }

  getPrioritySummary(): Observable<ApiResponse<PrioritySummary[]>> {
    return this.http.get<ApiResponse<PrioritySummary[]>>(URLS.dashboard.prioritySummary);
  }

  getCategorySummary(): Observable<ApiResponse<CategorySummary[]>> {
    return this.http.get<ApiResponse<CategorySummary[]>>(URLS.dashboard.categorySummary);
  }
}
