import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

export interface AgentState {
  phase: 'greeting' | 'collecting' | 'recommending' | 'cart' | 'checkout' | 'done';
  answers: Record<string, string>;
  selectedProducts: Product[];
  budget?: number;
  category?: string;
  query?: string;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  messages = signal<ChatMessage[]>([]);
  state = signal<AgentState>({
    phase: 'greeting',
    answers: {},
    selectedProducts: []
  });
  isProcessing = signal(false);

  private conversationSteps = [
    { key: 'intent', question: "What are you looking to buy today? I can help with smartphones, laptops, fashion, beauty products, furniture, and more!", category: 'all' },
    { key: 'budget', question: "What's your budget range?", category: 'budget' },
    { key: 'brand', question: "Any preferred brand?", category: 'brand' },
    { key: 'priority', question: "What matters most to you? (e.g., best rating, lowest price, biggest discount)", category: 'priority' },
  ];

  private stepIndex = 0;

  constructor(
    private http: HttpClient,
    private cartService: CartService,
    private productService: ProductService
  ) {}

  startConversation(): void {
    this.messages.set([]);
    this.state.set({ phase: 'greeting', answers: {}, selectedProducts: [] });
    this.stepIndex = 0;

    this.addAgentMessage(
      "👋 Hi there! I'm your **AI Shopping Agent**. I'll help you find the perfect products by asking a few quick questions.\n\n" +
      "Let's start — **what are you looking to buy today?**\n\n" +
      "For example:\n" +
      "• \"I need a new smartphone\"\n" +
      "• \"Looking for a laptop for work\"\n" +
      "• \"Want some skincare products\"\n" +
      "• \"Need home furniture\"",
      [{ type: 'ask_question', label: 'Type your answer below...' }]
    );
  }

  async processUserInput(input: string): Promise<void> {
    this.addUserMessage(input);
    this.isProcessing.set(true);

    const currentState = this.state();

    // Small delay to simulate AI thinking
    await this.delay(600 + Math.random() * 800);

    switch (currentState.phase) {
      case 'greeting':
        await this.handleIntent(input);
        break;
      case 'collecting':
        await this.handleCollection(input);
        break;
      case 'recommending':
        await this.handleRecommendation(input);
        break;
      case 'cart':
        await this.handleCart(input);
        break;
      default:
        break;
    }

    this.isProcessing.set(false);
  }

  private async handleIntent(input: string): Promise<void> {
    const lower = input.toLowerCase();
    let category = '';
    let query = input;

    // Detect category from intent
    if (lower.match(/phone|iphone|samsung|pixel|android|smartphone/)) {
      category = 'smartphones';
      query = '';
    } else if (lower.match(/laptop|macbook|notebook|computer|pc/)) {
      category = 'laptops';
      query = '';
    } else if (lower.match(/watch|clock|timepiece/)) {
      category = 'mens-watches';
      query = '';
    } else if (lower.match(/sunglasses|glasses|eyewear/)) {
      category = 'sunglasses';
      query = '';
    } else if (lower.match(/shirt|t-shirt|top|clothing|fashion/)) {
      category = 'mens-shirts';
      query = '';
    } else if (lower.match(/beauty|makeup|cosmetic|mascara|lip/)) {
      category = 'beauty';
      query = '';
    } else if (lower.match(/fragrance|perfume|cologne|scent/)) {
      category = 'fragrances';
      query = '';
    } else if (lower.match(/furniture|chair|table|sofa|desk|bed/)) {
      category = 'furniture';
      query = '';
    } else if (lower.match(/shoe|sneaker|boot|footwear/)) {
      category = 'mens-shoes';
      query = '';
    } else if (lower.match(/bag|purse|handbag|tote/)) {
      category = 'womens-bags';
      query = '';
    } else if (lower.match(/grocery|food|snack|drink/)) {
      category = 'groceries';
      query = '';
    } else if (lower.match(/tablet|ipad/)) {
      category = 'tablets';
      query = '';
    } else if (lower.match(/skincare|skin|moisturizer|cream/)) {
      category = 'skin-care';
      query = '';
    } else {
      // Generic search
      query = input.replace(/i want to buy|i need|i'm looking for|buy me|get me|find me/gi, '').trim();
    }

    this.state.update(s => ({
      ...s,
      phase: 'collecting',
      answers: { ...s.answers, intent: input },
      category,
      query
    }));

    // Ask about budget
    this.addAgentMessage(
      `Great choice! ${category ? `I'll search **${category.replace(/-/g, ' ')}** for you.` : `I'll search for "**${query}**".`}\n\n` +
      "💰 **What's your budget?** (e.g., \"$50\", \"$100-$200\", \"under $500\")",
      [{ type: 'ask_question', label: 'Enter your budget...' }]
    );
  }

  private async handleCollection(input: string): Promise<void> {
    const currentState = this.state();
    const answers = { ...currentState.answers };

    // Parse budget
    if (this.stepIndex === 0) {
      answers['budget'] = input;
      const budgetMatch = input.match(/\$?([\d,.]+)/);
      const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(',', '')) : 999;
      this.state.update(s => ({ ...s, answers, budget, phase: 'collecting' }));
      this.stepIndex++;

      this.addAgentMessage(
        `Got it! Budget: **${input}**\n\n` +
        "⭐ **What matters most?** (best rated / cheapest / biggest discount / any)",
        [{ type: 'ask_question', label: 'Choose priority...' }]
      );
      return;
    }

    // Parse priority
    if (this.stepIndex === 1) {
      answers['priority'] = input;
      this.state.update(s => ({ ...s, answers, phase: 'collecting' }));
      this.stepIndex++;

      this.addAgentMessage(
        "Almost there! **Any specific brand?** (or type \"any\" for all brands)",
        [{ type: 'ask_question', label: 'Enter brand or "any"...' }]
      );
      return;
    }

    // Parse brand — now search products
    answers['brand'] = input;
    this.state.update(s => ({ ...s, answers, phase: 'recommending' }));
    this.stepIndex = 0;

    await this.searchAndRecommend();
  }

  private async searchAndRecommend(): Promise<void> {
    const state = this.state();
    let products: Product[] = [];

    try {
      if (state.category) {
        const res = await firstValueFrom(this.productService.getCategoryProducts(state.category));
        products = res.products;
      } else if (state.query) {
        const res = await firstValueFrom(this.productService.searchProducts(state.query, 30));
        products = res.products;
      }

      // Filter by brand
      if (state.answers['brand'] && state.answers['brand'].toLowerCase() !== 'any') {
        const brandLower = state.answers['brand'].toLowerCase();
        const filtered = products.filter(p =>
          p.brand?.toLowerCase().includes(brandLower) ||
          p.title.toLowerCase().includes(brandLower)
        );
        if (filtered.length > 0) products = filtered;
      }

      // Sort by priority
      const priority = (state.answers['priority'] || '').toLowerCase();
      if (priority.match(/rating|best|review|top/)) {
        products.sort((a, b) => b.rating - a.rating);
      } else if (priority.match(/cheap|low|budget|price/)) {
        products.sort((a, b) => a.price - b.price);
      } else if (priority.match(/discount|deal|save|off/)) {
        products.sort((a, b) => b.discountPercentage - a.discountPercentage);
      } else {
        products.sort((a, b) => b.rating - a.rating);
      }

      // Filter by budget
      if (state.budget && state.budget > 0) {
        const withinBudget = products.filter(p => {
          const discounted = ProductService.discountedPrice(p);
          return discounted <= state.budget! * 1.2; // 20% buffer
        });
        if (withinBudget.length >= 2) products = withinBudget;
      }

      // Take top 5
      products = products.slice(0, 5);

    } catch {
      products = [];
    }

    this.state.update(s => ({ ...s, selectedProducts: products }));

    if (products.length === 0) {
      this.addAgentMessage(
        "🤔 I couldn't find products matching your criteria. Let me try a broader search...",
        []
      );
      // Fallback: just get top rated
      try {
        const res = await firstValueFrom(this.productService.getProducts({ limit: 5, sortBy: 'rating', order: 'desc' }));
        this.state.update(s => ({ ...s, selectedProducts: res.products }));
        this.showRecommendations(res.products);
      } catch {
        this.addAgentMessage("Sorry, I'm having trouble finding products. Please try again.", []);
      }
    } else {
      this.showRecommendations(products);
    }
  }

  private showRecommendations(products: Product[]): void {
    const maxBudget = this.state().budget || Infinity;
    const productCards = products.map((p, i) => {
      const price = ProductService.discountedPrice(p);
      return `${i + 1}. **${p.title}** — $${price.toFixed(2)} ⭐${p.rating} ${p.brand ? `(${p.brand})` : ''}`;
    }).join('\n');

    this.addAgentMessage(
      `🔍 Here are my top recommendations:\n\n${productCards}\n\n` +
      "What would you like to do?\n" +
      "• **\"add all\"** — Add all to cart\n" +
      "• **\"add 1\"** — Add product #1 (or any number)\n" +
      "• **\"add 1,3,5\"** — Add specific products\n" +
      "• **\"more options\"** — Show different products\n" +
      "• **\"change budget\"** — Update your budget",
      [
        { type: 'show_products', label: 'View Products', data: products },
        { type: 'add_to_cart', label: 'Add All to Cart', data: products }
      ]
    );
  }

  private async handleRecommendation(input: string): Promise<void> {
    const lower = input.toLowerCase().trim();
    const products = this.state().selectedProducts;

    if (lower.match(/add\s*all|add everything|all of them|take all/)) {
      products.forEach(p => this.cartService.addItem(p));
      this.state.update(s => ({ ...s, phase: 'cart' }));
      this.addAgentMessage(
        `✅ Added **${products.length} items** to your cart!\n\n` +
        `🛒 **Cart Total: $${this.cartService.total().toFixed(2)}** (${this.cartService.itemCount()} items)\n\n` +
        "Ready to checkout? Or would you like to add more items?",
        [{ type: 'checkout', label: 'Proceed to Checkout' }]
      );
      return;
    }

    if (lower.match(/add\s*(\d[\d,\s]*)/)) {
      const nums = lower.match(/\d+/g)!.map(n => parseInt(n) - 1);
      const valid = nums.filter(n => n >= 0 && n < products.length);
      if (valid.length === 0) {
        this.addAgentMessage("Please specify valid product numbers (1-" + products.length + ")", []);
        return;
      }
      valid.forEach(i => this.cartService.addItem(products[i]));
      this.state.update(s => ({ ...s, phase: 'cart' }));
      const names = valid.map(i => products[i].title).join(', ');
      this.addAgentMessage(
        `✅ Added to cart:\n${valid.map(i => `• ${products[i].title} — $${ProductService.discountedPrice(products[i]).toFixed(2)}`).join('\n')}\n\n` +
        `🛒 **Cart Total: $${this.cartService.total().toFixed(2)}**\n\n` +
        "What's next? **\"checkout\"** to pay, or **\"add more\"** to continue shopping.",
        [{ type: 'checkout', label: 'Proceed to Checkout' }]
      );
      return;
    }

    if (lower.match(/more|another|different|next|show more|other options/)) {
      this.addAgentMessage("Let me find more options for you...", []);
      await this.searchAndRecommend();
      return;
    }

    if (lower.match(/change.*budget|update.*budget|new.*budget|budget.*change/)) {
      this.stepIndex = 0;
      this.state.update(s => ({ ...s, phase: 'collecting' }));
      this.addAgentMessage("💰 **What's your new budget?**", [{ type: 'ask_question', label: 'Enter budget...' }]);
      return;
    }

    if (lower.match(/change.*brand|different.*brand|new.*brand/)) {
      this.stepIndex = 2;
      this.state.update(s => ({ ...s, phase: 'collecting' }));
      this.addAgentMessage("🏷️ **What brand?** (or \"any\" for all)", [{ type: 'ask_question', label: 'Enter brand...' }]);
      return;
    }

    // Default: treat as new search
    this.state.update(s => ({ ...s, phase: 'greeting' }));
    this.stepIndex = 0;
    await this.handleIntent(input);
  }

  private async handleCart(input: string): Promise<void> {
    const lower = input.toLowerCase().trim();

    if (lower.match(/checkout|pay|checkout|proceed|place order|buy|confirm/)) {
      this.state.update(s => ({ ...s, phase: 'done' }));
      this.addAgentMessage(
        "🎉 **Perfect!** I'm redirecting you to checkout.\n\n" +
        `📦 **${this.cartService.itemCount()} items** in your cart\n` +
        `💰 **Total: $${this.cartService.total().toFixed(2)}**\n\n` +
        "You'll be taken to the secure checkout page to complete your purchase.",
        [{ type: 'checkout', label: 'Go to Checkout' }]
      );
      return;
    }

    if (lower.match(/add more|continue shopping|shop more|add more items/)) {
      this.state.update(s => ({ ...s, phase: 'greeting' }));
      this.stepIndex = 0;
      this.addAgentMessage(
        "Sure! Let's find more products. **What are you looking for?**",
        [{ type: 'ask_question', label: 'What do you need?' }]
      );
      return;
    }

    if (lower.match(/clear|empty|remove all/)) {
      this.cartService.clear();
      this.addAgentMessage("🗑️ Cart cleared! What would you like to shop for?", []);
      return;
    }

    this.addAgentMessage(
      "You can:\n• **\"checkout\"** — Complete your purchase\n• **\"add more\"** — Continue shopping\n• **\"clear cart\"** — Empty your cart",
      [{ type: 'checkout', label: 'Proceed to Checkout' }]
    );
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
    this.messages.update(msgs => [...msgs, {
      id: this.generateId(),
      role: 'agent',
      content,
      timestamp: new Date(),
      actions
    }]);
  }

  private generateId(): string {
    return 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
