import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, catchError, of } from 'rxjs';
import { CartService } from './cart.service';
import { ProductService, Product } from './product.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  products?: Product[];
  actions?: AgentAction[];
}

export interface AgentAction {
  type: 'show_products' | 'add_to_cart' | 'checkout' | 'search' | 'ask_question';
  label: string;
  data?: any;
}

const API = '/api/v1/agent';

@Injectable({ providedIn: 'root' })
export class AgentService {
  messages = signal<ChatMessage[]>([]);
  isProcessing = signal(false);
  private conversationId: number | null = null;

  constructor(
    private http: HttpClient,
    private cartService: CartService,
    private productService: ProductService
  ) {}

  startConversation(): void {
    this.messages.set([]);
    this.conversationId = null;
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

    try {
      // Try backend first
      const response: any = await firstValueFrom(
        this.http.post(`${API}/chat`, {
          message: input,
          conversationId: this.conversationId,
          userId: 1
        }).pipe(
          catchError(() => {
            // Fallback to local agent logic
            return of(null);
          })
        )
      );

      if (response && response.message) {
        this.conversationId = response.conversationId;
        const tools = response.tools || [];
        this.addAgentMessage(response.message, this.parseActions(tools));
      } else {
        // Use local agent logic
        await this.processLocalAgent(input);
      }
    } catch {
      await this.processLocalAgent(input);
    }

    this.isProcessing.set(false);
  }

  private async processLocalAgent(input: string): Promise<void> {
    const lower = input.toLowerCase();

    if (lower.match(/add\s*all|add everything|all of them/)) {
      const cartItems = this.cartService.cartItems();
      if (cartItems.length > 0) {
        this.addAgentMessage(
          `✅ All **${cartItems.length} items** are in your cart!\n\n` +
          `🛒 **Cart Total: $${this.cartService.total().toFixed(2)}**\n\n` +
          "Ready to checkout?",
          [{ type: 'checkout', label: 'Proceed to Checkout' }]
        );
        return;
      }
    }

    if (lower.match(/checkout|pay|buy|proceed|place order/)) {
      this.addAgentMessage(
        "🎉 Redirecting you to **checkout**...\n\n" +
        `📦 **${this.cartService.itemCount()} items** · $${this.cartService.total().toFixed(2)}`,
        [{ type: 'checkout', label: 'Go to Checkout' }]
      );
      return;
    }

    // Search for products
    let category = '';
    let query = input.replace(/i want to buy|i need|i'm looking for|buy me|get me|find me/gi, '').trim();

    if (lower.match(/phone|smartphone|iphone|samsung|pixel/)) category = 'smartphones';
    else if (lower.match(/laptop|macbook|notebook|computer/)) category = 'laptops';
    else if (lower.match(/watch|timepiece/)) category = 'mens-watches';
    else if (lower.match(/sunglasses|glasses/)) category = 'sunglasses';
    else if (lower.match(/shirt|fashion|clothing/)) category = 'mens-shirts';
    else if (lower.match(/beauty|makeup|mascara/)) category = 'beauty';
    else if (lower.match(/furniture|chair|table|sofa/)) category = 'furniture';
    else if (lower.match(/skincare|skin|moisturizer/)) category = 'skin-care';

    let products: Product[] = [];
    try {
      if (category) {
        const res = await firstValueFrom(this.productService.getCategoryProducts(category));
        products = res.products.slice(0, 5);
      } else if (query.length > 2) {
        const res = await firstValueFrom(this.productService.searchProducts(query, 5));
        products = res.products;
      } else {
        const res = await firstValueFrom(this.productService.getProducts({ limit: 5, sortBy: 'rating', order: 'desc' }));
        products = res.products;
      }
    } catch {}

    if (products.length > 0) {
      const list = products.map((p, i) =>
        `${i + 1}. **${p.title}** — $${ProductService.discountedPrice(p).toFixed(2)} ⭐${p.rating} ${p.brand ? `(${p.brand})` : ''}`
      ).join('\n');

      this.addAgentMessage(
        `🔍 Here are my top recommendations:\n\n${list}\n\n` +
        "**What would you like to do?**\n" +
        "• Say **\"add 1\"** or **\"add all\"** to add to cart\n" +
        "• Say **\"more options\"** for different products\n" +
        "• Say **\"checkout\"** to complete purchase",
        [
          { type: 'show_products', label: 'View Products', data: products },
          { type: 'add_to_cart', label: 'Add All to Cart', data: products }
        ]
      );
    } else {
      this.addAgentMessage(
        "🤔 I couldn't find specific products for that. Let me show you our top-rated items:\n\n" +
        "Try asking about:\n" +
        "• Smartphones, laptops, watches\n" +
        "• Fashion, beauty, furniture\n" +
        "• Your budget (e.g., \"under $100\")\n" +
        "• Specific brands",
        []
      );
    }
  }

  private parseActions(tools: any[]): AgentAction[] {
    return tools.map(t => ({
      type: t.type || 'search',
      label: t.label || t.action || 'View',
      data: t.data
    }));
  }

  private addUserMessage(content: string): void {
    this.messages.update(msgs => [...msgs, {
      id: this.generateId(), role: 'user', content, timestamp: new Date()
    }]);
  }

  private addAgentMessage(content: string, actions: AgentAction[] = []): void {
    this.messages.update(msgs => [...msgs, {
      id: this.generateId(), role: 'agent', content, timestamp: new Date(), actions
    }]);
  }

  private generateId(): string {
    return 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  }
}
