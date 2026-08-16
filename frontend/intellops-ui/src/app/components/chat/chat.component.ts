import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CopilotService, Conversation, ActivityEvidence } from '../../services/copilot.service';
import { eventMeta as eventMetaFor, relativeTime as relativeTimeFor } from '../feed/activity-meta';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  evidence?: ActivityEvidence[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-layout animate-fadeIn">
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <h3><i class="fas fa-robot"></i> AI Co-Pilot</h3>
          <button class="btn btn-primary btn-sm" (click)="newConversation()"><i class="fas fa-plus"></i> New</button>
        </div>
        <div class="conversations-list">
          <div class="conversation-item" *ngFor="let conv of conversations"
               [class.active]="conv.id === activeConversationId"
               (click)="loadConversation(conv)">
            <i class="fas fa-message"></i>
            <span class="conv-title">{{ conv.title || 'New Conversation' }}</span>
          </div>
          <p class="empty" *ngIf="!conversations.length">No conversations yet</p>
        </div>
      </div>

      <div class="chat-main">
        <div class="chat-messages" #messagesContainer>
          <div class="welcome-message" *ngIf="!messages.length">
            <div class="welcome-icon"><i class="fas fa-robot"></i></div>
            <h2>IntelliOps AI Co-Pilot</h2>
            <p>Ask me anything about orders, inventory, or billing. I can help troubleshoot issues and provide insights.</p>
            <div class="quick-actions">
              <button (click)="sendMessage('What is the status of recent orders?')">📋 Check recent orders</button>
              <button (click)="sendMessage('Show me inventory levels')">📦 Check inventory</button>
              <button (click)="sendMessage('Are there any overdue invoices?')">💰 Check billing</button>
            </div>
          </div>

          <div *ngFor="let msg of messages" class="message" [ngClass]="msg.role">
            <div class="message-avatar">
              <i [class]="msg.role === 'user' ? 'fas fa-user' : 'fas fa-robot'"></i>
            </div>
            <div class="message-content">
              <div class="message-text" [innerHTML]="formatMessage(msg.content)"></div>
              <div class="evidence" *ngIf="msg.evidence && msg.evidence.length">
                <div class="evidence-header">
                  <span><i class="fas fa-stream"></i> Evidence · Activity feed</span>
                  <a routerLink="/feed" class="evidence-open"><i class="fas fa-external-link-alt"></i> Open feed</a>
                </div>
                <div class="evidence-block" *ngFor="let ev of msg.evidence">
                  <div class="evidence-block-title" *ngIf="ev.entityId">
                    <span class="badge">{{ ev.entityType || 'ENTITY' }}</span>
                    <span class="evidence-entity">{{ ev.entityId }}</span>
                    <span class="evidence-count">{{ ev.events.length }} event(s)</span>
                  </div>
                  <div class="evidence-item" *ngFor="let event of ev.events">
                    <span class="evidence-marker" [style.background]="eventMeta(event.eventType).bg" [style.color]="eventMeta(event.eventType).color">
                      <i class="fas" [ngClass]="eventMeta(event.eventType).icon"></i>
                    </span>
                    <span class="evidence-label">{{ eventMeta(event.eventType).label }}</span>
                    <span class="evidence-time">{{ relativeTime(event.timestamp) }}</span>
                  </div>
                </div>
              </div>
              <span class="message-time">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
          </div>

          <div class="message assistant" *ngIf="loading">
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
              <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <div class="input-wrapper">
            <textarea [(ngModel)]="inputMessage"
                      (keydown.enter)="onKeydownEnter($event)"
                      placeholder="Ask about orders, inventory, billing..."
                      rows="1"
                      [disabled]="loading"></textarea>
            <button class="send-btn" (click)="sendMessage()" [disabled]="loading || !inputMessage.trim()">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-layout { display: flex; height: calc(100vh - 128px); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-lg); }
    .chat-sidebar { width: 280px; background: var(--gray-900); color: white; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gray-700);
      h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; } }
    .conversations-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
    .conversation-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: var(--radius); cursor: pointer; color: var(--gray-300); font-size: 0.875rem;
      &:hover { background: var(--gray-700); }
      &.active { background: var(--primary); color: white; }
      .conv-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } }
    .empty { text-align: center; color: var(--gray-500); padding: 2rem; font-size: 0.875rem; }
    .chat-main { flex: 1; display: flex; flex-direction: column; background: white; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .welcome-message { text-align: center; margin: auto; max-width: 500px;
      .welcome-icon { width: 80px; height: 80px; background: var(--primary); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; i { color: white; font-size: 2rem; } }
      h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
      p { color: var(--gray-500); font-size: 0.875rem; margin-bottom: 1.5rem; } }
    .quick-actions { display: flex; flex-direction: column; gap: 0.5rem;
      button { padding: 0.75rem 1rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius); cursor: pointer; font-size: 0.875rem; text-align: left;
        &:hover { background: var(--gray-100); border-color: var(--primary); } } }
    .message { display: flex; gap: 0.75rem; max-width: 80%;
      &.user { align-self: flex-end; flex-direction: row-reverse;
        .message-content { background: var(--primary); color: white; border-radius: 16px 16px 4px 16px; }
        .message-time { text-align: right; } }
      &.assistant { align-self: flex-start;
        .message-content { background: var(--gray-100); border-radius: 16px 16px 16px 4px; } } }
    .message-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      i { font-size: 0.875rem; } }
    .message.assistant .message-avatar { background: var(--primary); color: white; }
    .message.user .message-avatar { background: var(--gray-200); color: var(--gray-600); }
    .message-content { padding: 0.75rem 1rem; }
    .message-text { font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; }
    .evidence { margin-top: 0.75rem; background: white; border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 0.75rem; }
    .evidence-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 600; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; }
    .evidence-open { font-weight: 500; color: var(--primary); text-transform: none; letter-spacing: normal; }
    .evidence-open:hover { text-decoration: underline; }
    .evidence-block { border-top: 1px dashed var(--gray-200); padding-top: 0.5rem; margin-top: 0.5rem; }
    .evidence-block:first-of-type { border-top: none; margin-top: 0; padding-top: 0; }
    .evidence-block-title { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.375rem; font-size: 0.8125rem; }
    .evidence-entity { font-weight: 600; color: var(--gray-800); }
    .evidence-count { font-size: 0.6875rem; color: var(--gray-400); margin-left: auto; }
    .evidence-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; font-size: 0.8125rem; }
    .evidence-marker { width: 1.375rem; height: 1.375rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; flex-shrink: 0; }
    .evidence-label { font-weight: 500; color: var(--gray-700); }
    .evidence-time { font-size: 0.6875rem; color: var(--gray-400); margin-left: auto; }
    .message-time { font-size: 0.75rem; color: var(--gray-400); margin-top: 0.25rem; display: block; }
    .typing-indicator { display: flex; gap: 4px; padding: 0.5rem 0;
      span { width: 8px; height: 8px; background: var(--gray-400); border-radius: 50%; animation: bounce 1.4s infinite;
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; } } }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
    .chat-input { padding: 1rem 1.5rem; border-top: 1px solid var(--gray-200); }
    .input-wrapper { display: flex; align-items: flex-end; gap: 0.75rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 12px; padding: 0.5rem;
      &:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      textarea { flex: 1; border: none; background: none; resize: none; font-family: inherit; font-size: 0.875rem; padding: 0.5rem; outline: none; min-height: 24px; max-height: 120px; } }
    .send-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--primary); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
      &:hover { background: var(--primary-dark); }
      &:disabled { opacity: 0.5; cursor: not-allowed; } }
  `]
})
export class ChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: ChatMsg[] = [];
  conversations: Conversation[] = [];
  activeConversationId: string | null = null;
  inputMessage = '';
  loading = false;

  constructor(private copilotService: CopilotService) {}

  ngOnInit() {
    this.copilotService.getConversations().subscribe(conv => this.conversations = conv);
  }

  onKeydownEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      this.sendMessage();
    }
    keyboardEvent.preventDefault();
  }

  sendMessage(override?: string) {
    const msg = override || this.inputMessage.trim();
    if (!msg || this.loading) return;

    this.messages.push({ role: 'user', content: msg, timestamp: new Date() });
    this.inputMessage = '';
    this.loading = true;
    this.scrollToBottom();

    this.copilotService.chat(msg, this.activeConversationId || undefined).subscribe({
      next: (res) => {
        this.activeConversationId = res.conversationId;
        this.messages.push({ role: 'assistant', content: res.response, timestamp: new Date(), evidence: res.evidence });
        this.loading = false;
        this.scrollToBottom();
        this.copilotService.getConversations().subscribe(c => this.conversations = c);
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() });
        this.loading = false;
      }
    });
  }

  newConversation() {
    this.activeConversationId = null;
    this.messages = [];
  }

  loadConversation(conv: Conversation) {
    this.activeConversationId = conv.id;
    this.messages = (conv.messages || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.timestamp),
      evidence: m.evidence
    }));
    this.scrollToBottom();
  }

  formatMessage(content: string): string {
    return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  eventMeta(eventType: string) { return eventMetaFor(eventType); }
  relativeTime(iso: string) { return relativeTimeFor(iso); }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
