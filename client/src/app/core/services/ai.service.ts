import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URLS } from '../../utilities/urls';
import { ApiResponse } from '../models/api-response.model';
import { AiAnalysis } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  analyze(ticketId: number): Observable<ApiResponse<AiAnalysis>> {
    return this.http.get<ApiResponse<AiAnalysis>>(URLS.ai.analyze(ticketId));
  }

  ask(ticketId: number, question: string): Observable<ApiResponse<{ answer: string }>> {
    return this.http.post<ApiResponse<{ answer: string }>>(URLS.ai.ask(ticketId), { question });
  }
}
