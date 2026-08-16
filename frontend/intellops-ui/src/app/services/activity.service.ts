import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityEntry {
  id: string;
  eventType: string;
  source: string;
  entityId: string;
  entityType: string;
  details: Record<string, string>;
  timestamp: string;
}

export interface ActivityStats {
  totalEntries: number;
  totalOrders: number;
  totalInvoices: number;
  totalPayments: number;
}

export interface ActivityQuery {
  entityId?: string;
  entityType?: string;
  eventType?: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly API_URL = '/api/v1/activity';

  constructor(private http: HttpClient) {}

  getActivity(query: ActivityQuery = {}): Observable<ActivityEntry[]> {
    let params = new HttpParams();
    if (query.entityId) params = params.set('entityId', query.entityId);
    if (query.entityType) params = params.set('entityType', query.entityType);
    if (query.eventType) params = params.set('eventType', query.eventType);
    if (query.limit) params = params.set('limit', query.limit);
    return this.http.get<ActivityEntry[]>(this.API_URL, { params });
  }

  getStats(): Observable<ActivityStats> {
    return this.http.get<ActivityStats>(`${this.API_URL}/stats`);
  }
}
