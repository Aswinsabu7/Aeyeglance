import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URLS } from '../../utilities/urls';
import { ApiResponse } from '../models/api-response.model';
import { Ticket, TicketListResponse, TicketFilters } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);

  getTickets(
    page = 1,
    limit = 10,
    filters: Partial<TicketFilters> = {}
  ): Observable<ApiResponse<TicketListResponse>> {
    let params = new HttpParams()
      .set('page',  String(page))
      .set('limit', String(limit));

    if (filters.search)   params = params.set('search',   filters.search);
    if (filters.status)   params = params.set('status',   filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.category) params = params.set('category', filters.category);

    return this.http.get<ApiResponse<TicketListResponse>>(URLS.tickets.base, { params });
  }

  getTicketById(id: number): Observable<ApiResponse<Ticket>> {
    return this.http.get<ApiResponse<Ticket>>(URLS.tickets.byId(id));
  }

  createTicket(data: Partial<Ticket>): Observable<ApiResponse<Ticket>> {
    return this.http.post<ApiResponse<Ticket>>(URLS.tickets.base, data);
  }

  updateTicket(id: number, data: Partial<Ticket>): Observable<ApiResponse<Ticket>> {
    return this.http.put<ApiResponse<Ticket>>(URLS.tickets.byId(id), data);
  }

  deleteTicket(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(URLS.tickets.byId(id));
  }
}
