import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CopilotService, Conversation, ActivityEvidence } from '../../services/copilot.service';
import { ToastService } from '../../services/notification/toast.service';
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
      <!-- Sidebar -->
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon"><i class="fas fa-robot"></i></div>
            <div *ngIf="true">
              <h3>AI Co-Pilot</h3>
              <p>Ask anything</p>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" (click)="newConversation()"><i class="fas fa-plus"></i></button>
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

      <!-- Main Chat -->
      <div class="chat-main">
        <div class="chat-messages" #messagesContainer>
          <!-- Welcome -->
          <div class="welcome-message" *ngIf="!messages.length">
            <div class="welcome-icon"><i class="fas fa-robot"></i></div>
            <h2>AtlasOps AI Co-Pilot</h2>
            <p>Your intelligent operations assistant. Ask about orders, inventory, billing, or anything else.</p>
            <div class="quick-actions">
              <button (click)='sendMessage("What is the status of recent orders?")'>
                <i class="fas fa-receipt"></i> Check recent orders
              </button>
              <button (click)='sendMessage("Show me inventory levels")'>
                <i class="fas fa-boxes-stacked"></i> Check inventory
              </button>
              <button (click)='sendMessage("Are there any overdue invoices?")'>
                <i class="fas fa-file-invoice-dollar"></i> Check billing
              </button>
              <button (click)='sendMessage("Why is order ORD-1001 on hold?")'>
                <i class="fas fa-circle-exclamation"></i> Diagnose ORD-1001
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div *ngFor="let msg of messages" class="message" [ngClass]="msg.role">
            <div class="message-avatar">
              <i [class]="msg.role === 'user' ? 'fas fa-user' : 'fas fa-robot'"></i>
            </div>
            <div class="message-content">
              <div class="message-text" [innerHTML]="formatMessage(msg.content)"></div>
              <div class="evidence" *ngIf="msg.evidence && msg.evidence.length">
                <div class="evidence-header">
                  <span><i class="fas fa-stream"></i> Evidence</span>
                  <a routerLink="/feed" class="evidence-open"><i class="fas fa-external-link-alt"></i> Feed</a>
                </div>
                <div class="evidence-block" *ngFor="let ev of msg.evidence">
                  <div class="evidence-block-title" *ngIf="ev.entityId">
                    <span class="badge">{{ ev.entityType || 'ENTITY' }}</span>
                    <span class="evidence-entity">{{ ev.entityId }}</span>
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

          <!-- Typing indicator -->
          <div class="message assistant" *ngIf="loading">
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
              <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <!-- Input -->
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
    .chat-layout { display: flex; height: calc(100vh - 140px); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-lg); border: 1px solid var(--gray-200); }

    /* Sidebar */
    .chat-sidebar { width: 280px; background: var(--gray-900); color: white; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 10px; display: flex; align-items: center; justify-content: center; i { color: white; font-size: 0.875rem; } }
    .brand h3 { font-size: 0.9375rem; font-weight: 600; margin: 0; }
    .brand p { font-size: 0.75rem; color: var(--gray-400); margin: 0; }
    .conversations-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
    .conversation-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: var(--radius); cursor: pointer; color: var(--gray-300); font-size: 0.8125rem; transition: all 0.15s;
      &:hover { background: rgba(255,255,255,0.1); }
      &.active { background: var(--primary); color: white; }
      .conv-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    }
    .empty { text-align: center; color: var(--gray-500); padding: 2rem; font-size: 0.8125rem; }

    /* Main */
    .chat-main { flex: 1; display: flex; flex-direction: column; background: white; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

    /* Welcome */
    .welcome-message { text-align: center; margin: auto; max-width: 520px; }
    .welcome-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; i { color: white; font-size: 1.75rem; } }
    .welcome-message h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    .welcome-message p { color: var(--gray-500); font-size: 0.875rem; margin-bottom: 1.5rem; }
    .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
      button { padding: 0.75rem 1rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius); cursor: pointer; font-size: 0.8125rem; text-align: left; display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); }
        &:hover { background: white; border-color: var(--primary); box-shadow: var(--shadow); }
      }
    }

    /* Messages */
    .message { display: flex; gap: 0.75rem; max-width: 80%; }
    .message.user { align-self: flex-end; flex-direction: row-reverse;
      .message-content { background: var(--primary); color: white; border-radius: 16px 16px 4px 16px; }
      .message-time { text-align: right; }
    }
    .message.assistant { align-self: flex-start;
      .message-content { background: var(--gray-100); border-radius: 16px 16px 16px 4px; }
    }
    .message-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; i { font-size: 0.8125rem; } }
    .message.assistant .message-avatar { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; }
    .message.user .message-avatar { background: var(--gray-200); color: var(--gray-600); }
    .message-content { padding: 0.75rem 1rem; }
    .message-text { font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; }
    .message-time { font-size: 0.6875rem; color: var(--gray-400); margin-top: 0.25rem; display: block; }

    /* Evidence */
    .evidence { margin-top: 0.75rem; background: white; border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 0.75rem; }
    .evidence-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 600; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; }
    .evidence-open { color: var(--primary); text-transform: none; letter-spacing: normal; }
    .evidence-block { border-top: 1px dashed var(--gray-200); padding-top: 0.5rem; margin-top: 0.5rem; }
    .evidence-block:first-of-type { border-top: none; margin-top: 0; padding-top: 0; }
    .evidence-block-title { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.375rem; font-size: 0.8125rem; }
    .evidence-entity { font-weight: 600; }
    .evidence-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; font-size: 0.8125rem; }
    .evidence-marker { width: 1.375rem; height: 1.375rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; flex-shrink: 0; }
    .evidence-label { font-weight: 500; color: var(--gray-700); }
    .evidence-time { font-size: 0.6875rem; color: var(--gray-400); margin-left: auto; }

    /* Typing */
    .typing-indicator { display: flex; gap: 4px; padding: 0.5rem 0;
      span { width: 8px; height: 8px; background: var(--gray-400); border-radius: 50%; animation: bounce 1.4s infinite;
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

    /* Input */
    .chat-input { padding: 1rem 1.5rem; border-top: 1px solid var(--gray-200); background: white; }
    .input-wrapper { display: flex; align-items: flex-end; gap: 0.5rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 12px; padding: 0.5rem;
      &:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      textarea { flex: 1; border: none; background: none; resize: none; font-family: inherit; font-size: 0.875rem; padding: 0.5rem; outline: none; min-height: 24px; max-height: 120px; }
    }
    .send-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--primary); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s;
      &:hover { background: var(--primary-dark); transform: scale(1.05); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    }
  `]
})
export class ChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: ChatMsg[] = [];
  conversations: Conversation[] = [];
  activeConversationId: string | null = null;
  inputMessage = '';
  loading = false;

  constructor(private copilotService: CopilotService, private toastService: ToastService) {}

  ngOnInit() {
    this.copilotService.getConversations().subscribe(conv => this.conversations = conv);
  }

  onKeydownEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) { this.sendMessage(); }
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
        this.toastService.error('Co-Pilot unavailable', 'The AI service could not be reached.');
        this.loading = false;
      }
    });
  }

  newConversation() { this.activeConversationId = null; this.messages = []; }

  loadConversation(conv: Conversation) {
    this.activeConversationId = conv.id;
    this.messages = (conv.messages || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content, timestamp: new Date(m.timestamp), evidence: m.evidence }));
    this.scrollToBottom();
  }

  formatMessage(content: string): string {
    return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  eventMeta(eventType: string) { return eventMetaFor(eventType); }
  relativeTime(iso: string) { return relativeTimeFor(iso); }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) { this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; }
    }, 100);
  }
}
