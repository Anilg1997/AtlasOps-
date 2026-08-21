import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgentService, ChatMessage } from '../../services/agent.service';
import { CartService } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agent-page animate-fadeIn">
      <div class="agent-container">
        <!-- Header -->
        <div class="agent-header">
          <div class="agent-avatar">
            <div class="avatar-ring">
              <i class="fas fa-robot"></i>
            </div>
            <span class="status-dot"></span>
          </div>
          <div class="agent-info">
            <h2>AI Shopping Agent</h2>
            <span class="agent-status">
              <span class="pulse"></span> Online — Ready to help you shop
            </span>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary btn-sm" (click)="resetChat()">
              <i class="fas fa-redo"></i> New Chat
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="chat-area" #chatArea>
          <!-- Welcome Screen -->
          <div class="welcome-screen" *ngIf="agentService.messages().length === 0">
            <div class="welcome-icon"><i class="fas fa-robot"></i></div>
            <h3>Hi! I'm your AI Shopping Assistant</h3>
            <p>I can help you find products, compare prices, and handle checkout automatically.</p>
            <div class="quick-prompts">
              <button class="quick-prompt" (click)="sendQuickPrompt('I want to buy a smartphone')">
                <i class="fas fa-mobile-alt"></i> Find a smartphone
              </button>
              <button class="quick-prompt" (click)="sendQuickPrompt('I need a laptop for work')">
                <i class="fas fa-laptop"></i> Find a laptop
              </button>
              <button class="quick-prompt" (click)="sendQuickPrompt('Looking for skincare products')">
                <i class="fas fa-spa"></i> Skincare
              </button>
              <button class="quick-prompt" (click)="sendQuickPrompt('I want sunglasses')">
                <i class="fas fa-glasses"></i> Sunglasses
              </button>
              <button class="quick-prompt" (click)="sendQuickPrompt('Show me furniture')">
                <i class="fas fa-couch"></i> Furniture
              </button>
              <button class="quick-prompt" (click)="sendQuickPrompt('I want fashion and clothing')">
                <i class="fas fa-shirt"></i> Fashion
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div class="message" *ngFor="let msg of agentService.messages()" [ngClass]="msg.role">
            <div class="message-avatar" *ngIf="msg.role === 'agent'">
              <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
              <div class="message-bubble" [innerHTML]="formatMessage(msg.content)"></div>

              <!-- Product Cards in message -->
              <div class="product-carousel" *ngIf="msg.products?.length">
                <div class="product-mini" *ngFor="let p of msg.products">
                  <img [src]="p.thumbnail" [alt]="p.title" loading="lazy">
                  <div class="pm-info">
                    <span class="pm-title">{{ p.title }}</span>
                    <span class="pm-price">\${{ getDiscountedPrice(p) | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="message-actions" *ngIf="msg.actions?.length">
                <button *ngFor="let action of msg.actions" class="action-btn"
                        [ngClass]="getActionClass(action.type)"
                        (click)="handleAction(action)">
                  <i class="fas" [ngClass]="getActionIcon(action.type)"></i> {{ action.label }}
                </button>
              </div>

              <span class="message-time">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
            <div class="message-avatar user-avatar" *ngIf="msg.role === 'user'">
              <i class="fas fa-user"></i>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div class="message agent" *ngIf="agentService.isProcessing()">
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <div class="cart-badge" *ngIf="cartService.itemCount() > 0" (click)="goToCheckout()">
            <i class="fas fa-shopping-cart"></i>
            <span>{{ cartService.itemCount() }} items · \${{ cartService.total() | number:'1.2-2' }}</span>
          </div>
          <form class="input-form" (ngSubmit)="sendMessage()">
            <input type="text" [(ngModel)]="userInput" name="input"
                   [placeholder]="getPlaceholder()" [disabled]="agentService.isProcessing()"
                   class="chat-input" autocomplete="off">
            <button type="submit" class="send-btn" [disabled]="!userInput.trim() || agentService.isProcessing()">
              <i class="fas" [ngClass]="agentService.isProcessing() ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .agent-page { height: calc(100vh - 68px - 4rem); max-width: 900px; margin: 0 auto; }
    .agent-container {
      display: flex; flex-direction: column; height: 100%;
      background: white; border-radius: 20px; box-shadow: var(--shadow-lg);
      border: 1px solid var(--gray-100); overflow: hidden;
    }

    /* Header */
    .agent-header {
      display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--gray-100); background: white;
    }
    .agent-avatar { position: relative; }
    .avatar-ring {
      width: 44px; height: 44px; border-radius: 14px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.125rem;
    }
    .status-dot {
      position: absolute; bottom: -1px; right: -1px;
      width: 12px; height: 12px; border-radius: 50%;
      background: #10b981; border: 2px solid white;
    }
    .agent-info { flex: 1;
      h2 { font-size: 1rem; font-weight: 700; color: var(--gray-900); }
    }
    .agent-status {
      font-size: 0.75rem; color: var(--gray-500); display: flex; align-items: center; gap: 0.375rem;
    }
    .pulse {
      width: 6px; height: 6px; border-radius: 50%; background: #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
    }

    /* Chat Area */
    .chat-area {
      flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;
    }

    /* Welcome */
    .welcome-screen {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      flex: 1; text-align: center; padding: 2rem;
      .welcome-icon { width: 80px; height: 80px; border-radius: 24px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 2rem; margin-bottom: 1.5rem; }
      h3 { font-size: 1.5rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.5rem; }
      p { color: var(--gray-500); margin-bottom: 2rem; }
    }
    .quick-prompts { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; max-width: 600px; }
    .quick-prompt {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
      background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 12px;
      font-size: 0.875rem; font-weight: 500; color: var(--gray-700); cursor: pointer;
      transition: all 0.2s; font-family: inherit;
      &:hover { background: var(--primary-50); border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
      i { font-size: 0.875rem; }
    }

    /* Messages */
    .message { display: flex; gap: 0.75rem; max-width: 85%; animation: fadeIn 0.3s ease; }
    .message.user { align-self: flex-end; flex-direction: row-reverse; }
    .message-avatar {
      width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white;
    }
    .user-avatar { background: var(--primary); }
    .message-content { display: flex; flex-direction: column; gap: 0.5rem; }
    .message.user .message-content { align-items: flex-end; }
    .message-bubble {
      padding: 0.875rem 1.125rem; border-radius: 16px; font-size: 0.875rem; line-height: 1.6;
      word-break: break-word;
    }
    .message.agent .message-bubble {
      background: var(--gray-50); color: var(--gray-800);
      border-bottom-left-radius: 4px;
    }
    .message.user .message-bubble {
      background: var(--primary); color: white;
      border-bottom-right-radius: 4px;
    }
    .message-time { font-size: 0.6875rem; color: var(--gray-400); padding: 0 0.25rem; }

    /* Product Carousel */
    .product-carousel {
      display: flex; gap: 0.75rem; overflow-x: auto; padding: 0.25rem 0; max-width: 100%;
    }
    .product-mini {
      display: flex; gap: 0.5rem; padding: 0.625rem; background: white;
      border: 1px solid var(--gray-200); border-radius: 12px; min-width: 200px; flex-shrink: 0;
      img { width: 48px; height: 48px; border-radius: 8px; object-fit: contain; background: var(--gray-50); }
    }
    .pm-info { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
    .pm-title { font-size: 0.75rem; font-weight: 600; color: var(--gray-800);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pm-price { font-size: 0.8125rem; font-weight: 700; color: var(--primary); }

    /* Action Buttons */
    .message-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .action-btn {
      display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem;
      border-radius: 10px; font-size: 0.8125rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; border: 1px solid; font-family: inherit;
    }
    .action-btn.primary { background: var(--primary); color: white; border-color: var(--primary);
      &:hover { background: var(--primary-dark); } }
    .action-btn.success { background: var(--success); color: white; border-color: var(--success);
      &:hover { background: var(--success-dark); } }
    .action-btn.secondary { background: white; color: var(--gray-700); border-color: var(--gray-200);
      &:hover { background: var(--gray-50); border-color: var(--gray-300); } }

    /* Typing */
    .typing-indicator {
      display: flex; gap: 4px; padding: 0.875rem 1.125rem; background: var(--gray-50);
      border-radius: 16px; border-bottom-left-radius: 4px;
      span { width: 8px; height: 8px; border-radius: 50%; background: var(--gray-400);
        animation: typing 1.4s infinite; }
      span:nth-child(2) { animation-delay: 0.2s; }
      span:nth-child(3) { animation-delay: 0.4s; }
    }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    /* Input */
    .input-area { padding: 1rem 1.5rem; border-top: 1px solid var(--gray-100); background: white; }
    .cart-badge {
      display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;
      padding: 0.625rem 1rem; background: var(--success); color: white;
      border-radius: 10px; font-size: 0.8125rem; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
      &:hover { background: var(--success-dark); }
    }
    .input-form { display: flex; gap: 0.75rem; }
    .chat-input {
      flex: 1; padding: 0.875rem 1.25rem; border: 2px solid var(--gray-200);
      border-radius: 14px; font-size: 0.9375rem; font-family: inherit;
      background: var(--gray-50); color: var(--gray-900); transition: all 0.2s;
      &:focus { outline: none; border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      &::placeholder { color: var(--gray-400); }
      &:disabled { opacity: 0.6; }
    }
    .send-btn {
      width: 48px; height: 48px; border-radius: 14px; border: none;
      background: var(--primary); color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 1rem;
      transition: all 0.2s; flex-shrink: 0;
      &:hover { background: var(--primary-dark); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    @media (max-width: 768px) {
      .agent-page { height: calc(100vh - 68px - 2rem); }
      .message { max-width: 95%; }
      .quick-prompts { flex-direction: column; }
    }
  `]
})
export class AgentComponent implements AfterViewChecked {
  @ViewChild('chatArea') chatArea!: ElementRef;
  userInput = '';

  constructor(
    public agentService: AgentService,
    public cartService: CartService,
    private router: Router,
    private productService: ProductService
  ) {
    if (this.agentService.messages().length === 0) {
      this.agentService.startConversation();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (!this.userInput.trim() || this.agentService.isProcessing()) return;
    const input = this.userInput;
    this.userInput = '';
    this.agentService.processUserInput(input);
  }

  sendQuickPrompt(prompt: string) {
    this.agentService.processUserInput(prompt);
  }

  handleAction(action: any) {
    if (action.type === 'checkout') {
      this.router.navigate(['/checkout']);
    } else if (action.type === 'add_to_cart' && action.data) {
      action.data.forEach((p: Product) => this.cartService.addItem(p));
      this.agentService.processUserInput('checkout');
    }
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }

  resetChat() {
    this.agentService.startConversation();
  }

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '&bull; ');
  }

  getDiscountedPrice(product: Product): number {
    return ProductService.discountedPrice(product);
  }

  getActionClass(type: string): string {
    switch (type) {
      case 'add_to_cart': return 'success';
      case 'checkout': return 'primary';
      default: return 'secondary';
    }
  }

  getActionIcon(type: string): string {
    switch (type) {
      case 'add_to_cart': return 'fa-cart-plus';
      case 'checkout': return 'fa-credit-card';
      case 'show_products': return 'fa-eye';
      default: return 'fa-comment';
    }
  }

  getPlaceholder(): string {
    const phase = this.agentService.state().phase;
    switch (phase) {
      case 'greeting': return 'Tell me what you want to buy...';
      case 'collecting': return 'Type your answer...';
      case 'recommending': return 'Type a command (add, checkout, more)...';
      case 'cart': return 'Type checkout or add more...';
      default: return 'Type a message...';
    }
  }

  private scrollToBottom() {
    if (this.chatArea) {
      const el = this.chatArea.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
