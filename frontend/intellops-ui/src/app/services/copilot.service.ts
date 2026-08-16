import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityEntry } from './activity.service';

export interface ChatMessage {
  response: string;
  conversationId: string;
  /** Structured tool evidence (e.g. activity feed events) backing the answer. */
  evidence?: ActivityEvidence[];
}

export interface ActivityEvidence {
  tool: string;
  method: string;
  entityType: string | null;
  entityId: string | null;
  events: ActivityEntry[];
}

export interface ConversationMessage {
  role: string;
  content: string;
  timestamp: string;
  /** Tool evidence persisted with the answer, survives reloads. */
  evidence?: ActivityEvidence[];
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CopilotService {
  private readonly API_URL = '/api/v1/copilot';

  constructor(private http: HttpClient) {}

  chat(message: string, conversationId?: string): Observable<ChatMessage> {
    const body: any = { message, userId: 'web-user' };
    if (conversationId) body.conversationId = conversationId;
    return this.http.post<ChatMessage>(`${this.API_URL}/chat`, body);
  }

  streamChat(message: string, conversationId?: string): EventSource {
    const body = JSON.stringify({ message, conversationId, userId: 'web-user' });
    // SSE via fetch for POST
    return new EventSource(`${this.API_URL}/stream?message=${encodeURIComponent(message)}`);
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.API_URL}/conversations?userId=web-user`);
  }

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.API_URL}/conversations/${id}`);
  }
}
