import { Injectable, signal } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { CartService } from './cart.service';
import { ProductService, Product } from './product.service';
import { catchError, of, Subject, Subscription } from 'rxjs';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  products?: Product[];
  actions?: AgentAction[];
  streaming?: boolean;
}

export interface AgentAction {
  type: 'show_products' | 'add_to_cart' | 'checkout' | 'search' | 'ask_question';
  label: string;
  data?: any;
}

interface WsMessage {
  type: string;
  action?: string;
  content?: string;
  sessionId?: string;
  conversationId?: number;
  intent?: string;
  tools?: any[];
  message?: string;
  status?: string;
  userId?: number;
}

@Injectable({ providedIn: 'root' })
export class AgentWebSocketService {
  messages = signal<ChatMessage[]>([]);
  isProcessing = signal(false);
  isConnected = signal(false);
  
  private ws$: WebSocketSubject<WsMessage> | null = null;
  private conversationId: number | null = null;
  private userId = 1;
  private sessionId: string | null = null;
  private tokenBuffer = '';
  private currentStreamingMessageId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;
  
  // Events for components to subscribe to
  public tokenReceived$ = new Subject<string>();
  public streamComplete$ = new Subject<any>();
  public connectionChanged$ = new Subject<boolean>();

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

  connect(): void {
    if (this.ws$ && !this.ws$.closed) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev mode, use the proxy; in production, connect directly to the service
    const isDev = window.location.port === '4200';
    const wsUrl = isDev 
      ? `${protocol}//${window.location.host}/ws/agent`
      : `${protocol}//${window.location.hostname}:8084/ws/agent`;
    
    this.ws$ = webSocket<WsMessage>({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('✅ WebSocket connected');
          this.isConnected.set(true);
          this.reconnectAttempts = 0;
          this.connectionChanged$.next(true);
        }
      },
      closeObserver: {
        next: () => {
          console.log('❌ WebSocket disconnected');
          this.isConnected.set(false);
          this.connectionChanged$.next(false);
          this.attemptReconnect();
        }
      }
    });

    this.ws$.subscribe({
      next: (msg) => this.handleMessage(msg),
      error: (err) => {
        console.error('WebSocket error:', err);
        this.isConnected.set(false);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(msg: WsMessage): void {
    switch (msg.type) {
      case 'connected':
        this.sessionId = msg.sessionId || null;
        break;
        
      case 'processing':
        // Already set when user sends message
        break;
        
      case 'token':
        if (msg.content) {
          this.tokenBuffer += msg.content;
          this.tokenReceived$.next(msg.content);
          
          // Update streaming message in real-time
          if (this.currentStreamingMessageId) {
            this.messages.update(msgs => 
              msgs.map(m => 
                m.id === this.currentStreamingMessageId 
                  ? { ...m, content: this.tokenBuffer }
                  : m
              )
            );
          }
        }
        break;
        
      case 'complete':
        // Finalize streaming message
        if (this.currentStreamingMessageId) {
          this.messages.update(msgs => 
            msgs.map(m => 
              m.id === this.currentStreamingMessageId 
                ? { ...m, streaming: false }
                : m
            )
          );
        }
        this.conversationId = msg.conversationId || null;
        this.isProcessing.set(false);
        this.streamComplete$.next(msg);
        break;
        
      case 'error':
        console.error('Agent error:', msg.message);
        this.isProcessing.set(false);
        // Add error message
        this.addAgentMessage(`❌ Error: ${msg.message || 'Unknown error occurred'}`);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws$) {
      this.ws$.complete();
      this.ws$ = null;
    }
    this.isConnected.set(false);
  }

  startConversation(): void {
    this.messages.set([]);
    this.conversationId = null;
    this.tokenBuffer = '';
    this.currentStreamingMessageId = null;
    this.connect();
    this.addAgentMessage(
      "👋 Hi there! I'm your **AI Shopping Agent** powered by LangChain4j + Ollama LLM.\n\n" +
      "I can:\n" +
      "• 🔍 Search products from our catalog\n" +
      "• 💰 Find the best deals in your budget\n" +
      "• ⭐ Recommend products by rating\n" +
      "• 🛒 Add items to cart and checkout\n" +
      "• 📦 Track orders and answer questions\n\n" +
      "**What are you looking for today?**",
      [{ type: 'ask_question', label: 'Type your message...' }]
    );
  }

  async processUserInput(input: string): Promise<void> {
    this.addUserMessage(input);
    this.isProcessing.set(true);
    this.tokenBuffer = '';
    
    // Create streaming message placeholder
    this.currentStreamingMessageId = this.generateId();
    this.messages.update(msgs => [...msgs, {
      id: this.currentStreamingMessageId!,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      streaming: true
    }]);

    // Ensure connection
    this.connect();

    // Send message via WebSocket
    if (this.ws$) {
      const msg: WsMessage = {
        type: 'chat',
        action: 'chat',
        message: input,
        userId: this.userId
      };
      if (this.conversationId !== null) {
        msg.conversationId = this.conversationId;
      }
      this.ws$.next(msg);
    } else {
      // Fallback to HTTP if WebSocket is not available
      await this.processWithHttpFallback(input);
    }
  }

  private async processWithHttpFallback(input: string): Promise<void> {
    // Fallback logic similar to the original service
    const lower = input.toLowerCase();

    if (lower.match(/checkout|pay|buy|proceed|place order/)) {
      this.addAgentMessage(
        "🎉 Redirecting you to **checkout**...\n\n" +
        `📦 **${this.cartService.itemCount()} items** · $${this.cartService.total().toFixed(2)}`,
        [{ type: 'checkout', label: 'Go to Checkout' }]
      );
      this.isProcessing.set(false);
      return;
    }

    let products: Product[] = [];
    try {
      let category = '';
      if (lower.match(/phone|smartphone|iphone|samsung|pixel/)) category = 'smartphones';
      else if (lower.match(/laptop|macbook|notebook|computer/)) category = 'laptops';
      else if (lower.match(/watch|timepiece/)) category = 'mens-watches';
      else if (lower.match(/sunglasses|glasses/)) category = 'sunglasses';
      else if (lower.match(/shirt|fashion|clothing/)) category = 'mens-shirts';

      if (category) {
        const res = await this.productService.getCategoryProducts(category).toPromise();
        products = res?.products?.slice(0, 5) || [];
      } else if (input.length > 2) {
        const res = await this.productService.searchProducts(input, 5).toPromise();
        products = res?.products || [];
      } else {
        const res = await this.productService.getProducts({ limit: 5, sortBy: 'rating', order: 'desc' }).toPromise();
        products = res?.products || [];
      }
    } catch {}

    if (products.length > 0) {
      const list = products.map((p, i) =>
        `${i + 1}. **${p.title}** — $${ProductService.discountedPrice(p).toFixed(2)} ⭐${p.rating}`
      ).join('\n');

      this.addAgentMessage(
        `🔍 Here are my top recommendations:\n\n${list}\n\n` +
        "**What would you like to do?**\n" +
        "• Say **\"add 1\"** or **\"add all\"** to add to cart\n" +
        "• Say **\"checkout\"** to complete purchase",
        [
          { type: 'show_products', label: 'View Products', data: products },
          { type: 'add_to_cart', label: 'Add All to Cart', data: products }
        ]
      );
    } else {
      this.addAgentMessage(
        "🤔 I couldn't find specific products for that. Try asking about:\n" +
        "• Smartphones, laptops, watches\n" +
        "• Fashion, beauty, furniture\n" +
        "• Your budget (e.g., \"under $100\")",
        []
      );
    }

    this.isProcessing.set(false);
  }

  private addUserMessage(content: string): void {
    this.messages.update(msgs => [...msgs, {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  }

  private addAgentMessage(content: string, actions: AgentAction[] = []): void {
    this.currentStreamingMessageId = this.generateId();
    this.messages.update(msgs => [...msgs, {
      id: this.currentStreamingMessageId!,
      role: 'agent',
      content,
      timestamp: new Date(),
      actions
    }]);
  }

  private generateId(): string {
    return 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  }
}
