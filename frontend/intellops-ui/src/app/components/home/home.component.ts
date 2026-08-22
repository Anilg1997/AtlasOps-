import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AgentWebSocketService } from '../../services/agent-websocket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="home">
      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- HERO SECTION — Full-width rotating banner with search     -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="hero" #heroSection>
        <div class="hero-slides">
          <div class="hero-slide" *ngFor="let slide of heroSlides; let i = index"
               [class.active]="currentSlide === i">
            <div class="slide-bg" [style.background]="slide.bg"></div>
            <div class="slide-content">
              <span class="slide-badge"><i class="fas" [ngClass]="slide.badgeIcon"></i> {{ slide.badge }}</span>
              <h1 [innerHTML]="slide.title"></h1>
              <p>{{ slide.subtitle }}</p>
              <div class="hero-actions">
                <a routerLink="/products" class="btn-hero-primary">
                  <i class="fas fa-shopping-bag"></i> Shop Now
                </a>
                <a routerLink="/categories" class="btn-hero-outline">
                  <i class="fas fa-th-large"></i> Browse Categories
                </a>
              </div>
            </div>
            <div class="slide-visual">
              <div class="hero-3d-card" [style.transform]="'perspective(1000px) rotateY(' + tiltX + 'deg) rotateX(' + tiltY + 'deg)'">
                <img [src]="slide.image" [alt]="slide.imageAlt" loading="lazy">
                <div class="card-glow"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slide indicators -->
        <div class="slide-dots">
          <button *ngFor="let slide of heroSlides; let i = index"
                  class="dot" [class.active]="currentSlide === i"
                  (click)="goToSlide(i)"></button>
        </div>

        <!-- Slide arrows -->
        <button class="slide-arrow slide-arrow-left" (click)="prevSlide()">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="slide-arrow slide-arrow-right" (click)="nextSlide()">
          <i class="fas fa-chevron-right"></i>
        </button>

        <!-- Search Bar in Hero -->
        <div class="hero-search">
          <div class="hero-search-inner">
            <i class="fas fa-search"></i>
            <input type="text" [(ngModel)]="heroSearchQuery" (keyup.enter)="heroSearch()"
                   placeholder="Search products, brands, categories...">
            <button class="hero-search-btn" (click)="heroSearch()">
              <i class="fas fa-arrow-right"></i> Search
            </button>
          </div>
          <div class="hero-search-hint">
            Popular: <span *ngFor="let term of popularSearches" class="search-tag" (click)="searchFor(term)">{{ term }}</span>
          </div>
        </div>

        <!-- Stats bar -->
        <div class="hero-stats-bar">
          <div class="stat-item"><i class="fas fa-box"></i> <span>194+</span> Products</div>
          <div class="stat-item"><i class="fas fa-truck"></i> <span>Free</span> Shipping</div>
          <div class="stat-item"><i class="fas fa-shield-halved"></i> <span>100%</span> Secure</div>
          <div class="stat-item"><i class="fas fa-robot"></i> <span>AI</span> Assistant</div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- CATEGORY STRIP — Icon-based cards (Amazon pattern)         -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="categories-strip">
        <div class="section-container">
          <div class="categories-scroll">
            <a *ngFor="let cat of displayCategories" [routerLink]="['/category', cat.slug]"
               class="category-pill">
              <div class="cat-icon-wrap" [style.background]="getCatColor(cat.slug)">
                <i class="fas" [ngClass]="getCatIcon(cat.slug)"></i>
              </div>
              <span>{{ cat.name }}</span>
            </a>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- DEALS OF THE DAY — Carousel with left/right arrows         -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="deals-section">
        <div class="section-container">
          <div class="section-header">
            <div>
              <h2><i class="fas fa-fire-flame-curved"></i> Deals of the Day</h2>
              <p>Hurry up! These deals won't last long</p>
            </div>
            <div class="carousel-controls">
              <button class="carousel-btn" (click)="scrollCarousel('deals', -1)"><i class="fas fa-chevron-left"></i></button>
              <button class="carousel-btn" (click)="scrollCarousel('deals', 1)"><i class="fas fa-chevron-right"></i></button>
            </div>
          </div>
          <div class="carousel-track" #dealsCarousel>
            <div class="deal-card hover-lift" *ngFor="let product of topDeals" (click)="goToProduct(product.id)">
              <div class="deal-image">
                <img [src]="product.thumbnail" [alt]="product.title" loading="lazy">
                <span class="deal-badge">-{{ product.discountPercentage | number:'1.0-0' }}%</span>
                <div class="deal-overlay">
                  <button class="overlay-btn" title="Quick Add" (click)="addToCart(product, $event)">
                    <i class="fas fa-cart-plus"></i>
                  </button>
                  <button class="overlay-btn" title="View Details" (click)="goToProduct(product.id); $event.stopPropagation()">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
              <div class="deal-info">
                <span class="deal-brand" *ngIf="product.brand">{{ product.brand }}</span>
                <h4>{{ product.title }}</h4>
                <div class="deal-pricing">
                  <span class="deal-price">\${{ getDiscountedPrice(product) | number:'1.2-2' }}</span>
                  <span class="deal-original">\${{ product.price | number:'1.2-2' }}</span>
                  <span class="deal-save">Save \${{ (product.price - getDiscountedPrice(product)) | number:'1.2-2' }}</span>
                </div>
                <div class="deal-stock" [ngClass]="product.stock < 10 ? 'low' : 'ok'">
                  <i class="fas" [ngClass]="product.stock < 10 ? 'fa-fire' : 'fa-check-circle'"></i>
                  {{ product.stock < 10 ? 'Only ' + product.stock + ' left!' : 'In Stock' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- RECOMMENDED FOR YOU — Carousel with parallax card depth     -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="recommended-section">
        <div class="section-container">
          <div class="section-header">
            <div>
              <h2><i class="fas fa-star"></i> Recommended for You</h2>
              <p>Hand-picked top-rated products based on your interests</p>
            </div>
            <div class="carousel-controls">
              <button class="carousel-btn" (click)="scrollCarousel('recommended', -1)"><i class="fas fa-chevron-left"></i></button>
              <button class="carousel-btn" (click)="scrollCarousel('recommended', 1)"><i class="fas fa-chevron-right"></i></button>
            </div>
          </div>
          <div class="carousel-track" #recommendedCarousel>
            <div class="product-card hover-lift" *ngFor="let product of featuredProducts" (click)="goToProduct(product.id)">
              <div class="product-image">
                <img [src]="product.thumbnail" [alt]="product.title" loading="lazy">
                <span class="discount-tag" *ngIf="product.discountPercentage > 5">
                  -{{ product.discountPercentage | number:'1.0-0' }}%
                </span>
                <button class="wishlist-fab" [class.active]="wishlistService.isWishlisted(product.id)"
                        (click)="toggleWishlist(product, $event)">
                  <i class="fas fa-heart"></i>
                </button>
                <div class="product-overlay">
                  <button class="overlay-btn" (click)="addToCart(product, $event)">
                    <i class="fas fa-cart-plus"></i>
                  </button>
                  <button class="overlay-btn" (click)="goToProduct(product.id); $event.stopPropagation()">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
              <div class="product-info">
                <span class="product-category">{{ product.category }}</span>
                <h3>{{ product.title }}</h3>
                <div class="product-rating">
                  <div class="stars">
                    <i *ngFor="let s of getStars(product.rating)" class="fas"
                       [ngClass]="{'fa-star': s === 'full', 'fa-star-half-alt': s === 'half', 'fa-star empty-star': s === 'empty'}"></i>
                  </div>
                  <span class="rating-count">({{ product.rating | number:'1.1-1' }})</span>
                </div>
                <div class="product-price">
                  <span class="current-price">\${{ getDiscountedPrice(product) | number:'1.2-2' }}</span>
                  <span class="original-price" *ngIf="product.discountPercentage > 0">\${{ product.price | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- CATEGORIES BANNER — Full-width category showcase            -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="categories-showcase">
        <div class="section-container">
          <div class="section-header centered">
            <h2><i class="fas fa-th-large"></i> Shop by Category</h2>
            <p>Explore our wide range of categories</p>
          </div>
          <div class="category-grid">
            <a *ngFor="let cat of displayCategories" [routerLink]="['/category', cat.slug]" class="category-card hover-lift">
              <div class="cat-icon-large" [style.background]="getCatColor(cat.slug)">
                <i class="fas" [ngClass]="getCatIcon(cat.slug)"></i>
              </div>
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-count">Browse &rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- AI AGENT BANNER — Promo strip for the AI agent              -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="ai-banner">
        <div class="section-container">
          <div class="ai-banner-inner">
            <div class="ai-banner-content">
              <div class="ai-icon"><i class="fas fa-robot"></i></div>
              <div>
                <h3>Meet Your AI Shopping Agent</h3>
                <p>Powered by LangChain4j + Ollama LLM. It can search products, compare prices, handle checkout, and even resolve order issues automatically.</p>
              </div>
            </div>
            <a routerLink="/agent" class="btn-ai-chat">
              <i class="fas fa-comment-dots"></i> Try AI Agent
            </a>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- FLOATING AI AGENT LAUNCHER — Bottom-right persistent bubble -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="floating-agent" [class.open]="agentChatOpen" (click)="toggleAgentChat()">
        <div class="agent-bubble" *ngIf="!agentChatOpen">
          <i class="fas fa-comment-dots"></i>
          <span class="agent-tooltip">Chat with AI Agent</span>
        </div>
        <div class="agent-expanded" *ngIf="agentChatOpen" (click)="$event.stopPropagation()">
          <div class="expanded-header">
            <div class="expanded-avatar"><i class="fas fa-robot"></i></div>
            <div>
              <h4>AI Shopping Agent</h4>
              <span class="online-dot"><span class="pulse-ring"></span> Online</span>
            </div>
            <button class="close-btn" (click)="agentChatOpen = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="expanded-messages">
            <div class="expanded-msg bot">
              <i class="fas fa-robot"></i>
              <span>Hi! I'm your AI shopping assistant. How can I help you today?</span>
            </div>
            <div class="expanded-quick">
              <button (click)="launchAgent('Find me a smartphone')">📱 Find a smartphone</button>
              <button (click)="launchAgent('I need a laptop')">💻 Find a laptop</button>
              <button (click)="launchAgent('I have an order issue')">🔍 Order Support</button>
            </div>
          </div>
          <div class="expanded-input">
            <input type="text" [(ngModel)]="agentQuickInput" placeholder="Ask me anything..."
                   (keyup.enter)="launchAgent(agentQuickInput)">
            <button (click)="launchAgent(agentQuickInput)"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home { overflow-x: hidden; }

    /* ═══════════════════════════════════════════════════════════ */
    /* HERO SECTION                                               */
    /* ═══════════════════════════════════════════════════════════ */
    .hero {
      position: relative; min-height: 520px; overflow: hidden;
      background: #0f172a; color: white;
    }
    .hero-slides { position: relative; min-height: 520px; }
    .hero-slide {
      position: absolute; inset: 0; display: flex; align-items: center;
      opacity: 0; transition: opacity 0.8s ease-in-out; pointer-events: none;
    }
    .hero-slide.active { opacity: 1; pointer-events: all; }
    .slide-bg {
      position: absolute; inset: 0; opacity: 0.15;
    }
    .slide-content {
      flex: 1; padding: 4rem 2rem; max-width: 600px; z-index: 2; margin-left: 5%;
    }
    .slide-badge {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
      padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.8125rem;
      font-weight: 600; margin-bottom: 1.5rem;
      border: 1px solid rgba(255,255,255,0.15);
      i { color: #f59e0b; }
    }
    .slide-content h1 {
      font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem;
    }
    .slide-content h1 .highlight {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .slide-content p { font-size: 1.125rem; color: rgba(255,255,255,0.7); margin-bottom: 2rem; }
    .hero-actions { display: flex; gap: 1rem; }
    .btn-hero-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 2rem; background: var(--primary); color: white;
      border-radius: 12px; font-weight: 700; font-size: 1rem; text-decoration: none;
      transition: all 0.3s;
      &:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.3); }
    }
    .btn-hero-outline {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 2rem; background: transparent; color: white;
      border: 2px solid rgba(255,255,255,0.3); border-radius: 12px;
      font-weight: 600; font-size: 1rem; text-decoration: none; transition: all 0.3s;
      &:hover { background: rgba(255,255,255,0.1); border-color: white; }
    }

    /* 3D Card effect */
    .slide-visual {
      flex: 0 0 400px; z-index: 2; display: flex; justify-content: center; margin-right: 5%;
    }
    .hero-3d-card {
      position: relative; width: 300px; height: 340px;
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 30px 80px rgba(0,0,0,0.4);
      transition: transform 0.1s ease-out;
      img { width: 100%; height: 100%; object-fit: cover; }
      .card-glow {
        position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, transparent 60%);
        pointer-events: none;
      }
    }

    /* Slide controls */
    .slide-dots {
      position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 0.5rem; z-index: 10;
    }
    .dot {
      width: 10px; height: 10px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.3s;
      &.active { background: white; width: 28px; border-radius: 5px; }
      &:hover { background: rgba(255,255,255,0.6); }
    }
    .slide-arrow {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
      width: 44px; height: 44px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
      color: white; font-size: 1rem; cursor: pointer; transition: all 0.3s;
      &:hover { background: rgba(255,255,255,0.3); }
    }
    .slide-arrow-left { left: 24px; }
    .slide-arrow-right { right: 24px; }

    /* Hero Search Bar */
    .hero-search {
      position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
      padding: 0 5% 1.5rem;
    }
    .hero-search-inner {
      display: flex; align-items: center; background: white; border-radius: 16px;
      padding: 0.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      i.fa-search { margin-left: 1rem; color: var(--gray-400); font-size: 1.125rem; }
      input {
        flex: 1; border: none; padding: 0.875rem 1rem; font-size: 1rem;
        font-family: inherit; background: transparent; color: var(--gray-900);
        &:focus { outline: none; }
        &::placeholder { color: var(--gray-400); }
      }
    }
    .hero-search-btn {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.75rem;
      background: var(--primary); color: white; border: none; border-radius: 12px;
      font-weight: 700; font-size: 0.9375rem; cursor: pointer; transition: all 0.2s;
      &:hover { background: var(--primary-dark); }
    }
    .hero-search-hint {
      padding: 0.5rem 1rem 0; font-size: 0.8125rem; color: rgba(255,255,255,0.6);
      span.search-tag {
        display: inline-block; padding: 0.2rem 0.625rem; margin: 0 0.25rem;
        background: rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer;
        transition: background 0.2s;
        &:hover { background: rgba(255,255,255,0.2); }
      }
    }

    /* Stats Bar */
    .hero-stats-bar {
      position: absolute; top: 0; right: 5%; z-index: 10;
      display: flex; gap: 0.25rem; padding: 1rem 0;
    }
    .stat-item {
      display: flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 1rem; background: rgba(255,255,255,0.1);
      backdrop-filter: blur(8px); border-radius: 8px;
      font-size: 0.8125rem; color: rgba(255,255,255,0.8);
      i { color: #60a5fa; }
      span { font-weight: 700; color: white; }
    }

    /* ═══════════════════════════════════════════════════════════ */
    /* CATEGORY STRIP                                             */
    /* ═══════════════════════════════════════════════════════════ */
    .categories-strip {
      background: white; border-bottom: 1px solid var(--gray-100);
      padding: 1.25rem 0; overflow: hidden;
    }
    .section-container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
    .categories-scroll {
      display: flex; gap: 1.5rem; overflow-x: auto; padding: 0.25rem 0;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
    .category-pill {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.625rem 1.25rem 0.625rem 0.5rem;
      background: var(--gray-50); border: 1px solid var(--gray-100);
      border-radius: 9999px; text-decoration: none !important;
      color: var(--gray-700); white-space: nowrap; font-size: 0.875rem;
      font-weight: 500; transition: all 0.3s; cursor: pointer;
      &:hover { background: var(--primary-50); border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow); }
    }
    .cat-icon-wrap {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; flex-shrink: 0;
    }

    /* ═══════════════════════════════════════════════════════════ */
    /* SECTION HEADERS & CAROUSELS                                */
    /* ═══════════════════════════════════════════════════════════ */
    .section-header {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;
      &.centered { flex-direction: column; align-items: center; text-align: center; }
      h2 {
        font-size: 1.5rem; font-weight: 700; color: var(--gray-900);
        display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); }
      }
      p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; }
    }
    .carousel-controls { display: flex; gap: 0.5rem; }
    .carousel-btn {
      width: 40px; height: 40px; border-radius: 12px; border: 2px solid var(--gray-200);
      background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--gray-600); transition: all 0.2s;
      &:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-50); }
    }
    .carousel-track {
      display: flex; gap: 1.25rem; overflow-x: auto; padding: 0.5rem 0;
      scroll-behavior: smooth; scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    /* Hover-lift micro-interaction */
    .hover-lift {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      &:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
    }

    /* ═══════════════════════════════════════════════════════════ */
    /* DEALS OF THE DAY                                           */
    /* ═══════════════════════════════════════════════════════════ */
    .deals-section { padding: 3rem 0; }
    .deal-card {
      flex: 0 0 300px; background: white; border-radius: 16px; overflow: hidden;
      border: 1px solid var(--gray-100); cursor: pointer;
    }
    .deal-image {
      position: relative; height: 200px; overflow: hidden; background: var(--gray-50);
      img { width: 100%; height: 100%; object-fit: contain; padding: 1rem; transition: transform 0.3s; }
      &:hover img { transform: scale(1.08); }
      .deal-badge {
        position: absolute; top: 12px; left: 12px; background: var(--danger);
        color: white; padding: 0.25rem 0.75rem; border-radius: 9999px;
        font-size: 0.75rem; font-weight: 700;
      }
      .deal-overlay {
        position: absolute; bottom: 12px; right: 12px; display: flex; gap: 0.5rem;
        opacity: 0; transition: opacity 0.3s;
      }
      &:hover .deal-overlay { opacity: 1; }
    }
    .overlay-btn {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: white; color: var(--primary); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.2s;
      &:hover { background: var(--primary); color: white; }
    }
    .deal-info { padding: 1rem 1.25rem 1.25rem; }
    .deal-brand { font-size: 0.6875rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .deal-info h4 {
      font-size: 0.9375rem; font-weight: 600; color: var(--gray-900); margin: 0.25rem 0 0.5rem;
      line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .deal-pricing { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
    .deal-price { font-size: 1.125rem; font-weight: 700; color: var(--primary); }
    .deal-original { font-size: 0.8125rem; color: var(--gray-400); text-decoration: line-through; }
    .deal-save { font-size: 0.6875rem; color: var(--success); font-weight: 600; }
    .deal-stock {
      font-size: 0.75rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.375rem;
      &.ok { color: var(--success); }
      &.low { color: var(--warning); }
    }

    /* ═══════════════════════════════════════════════════════════ */
    /* RECOMMENDED PRODUCTS                                       */
    /* ═══════════════════════════════════════════════════════════ */
    .recommended-section { padding: 3rem 0; }
    .product-card {
      flex: 0 0 260px; background: white; border-radius: 16px; overflow: hidden;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100); cursor: pointer;
    }
    .product-image {
      position: relative; height: 200px; overflow: hidden; background: var(--gray-50);
      display: flex; align-items: center; justify-content: center;
      img { width: 100%; height: 100%; object-fit: contain; padding: 1rem; transition: transform 0.3s; }
      &:hover img { transform: scale(1.05); }
    }
    .discount-tag {
      position: absolute; top: 12px; left: 12px; background: var(--danger);
      color: white; padding: 0.25rem 0.75rem; border-radius: 9999px;
      font-size: 0.75rem; font-weight: 700;
    }
    .wishlist-fab {
      position: absolute; top: 12px; right: 12px; z-index: 2;
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
      color: var(--gray-400); cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: all 0.25s;
      &:hover { transform: scale(1.15); color: #ef4444; background: white; }
      &.active { color: #ef4444; background: #fef2f2; }
    }
    .product-overlay {
      position: absolute; bottom: 12px; right: 12px; display: flex; gap: 0.5rem;
      opacity: 0; transition: opacity 0.3s;
    }
    .product-image:hover .product-overlay { opacity: 1; }
    .product-info { padding: 1rem 1.25rem 1.25rem; }
    .product-category {
      font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--primary); font-weight: 600;
    }
    .product-info h3 {
      font-size: 0.9375rem; font-weight: 600; margin: 0.375rem 0 0.5rem;
      color: var(--gray-900); line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .product-rating { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .stars { display: flex; gap: 2px; }
    .stars i { font-size: 0.75rem; color: #f59e0b; }
    .stars .empty-star { color: var(--gray-300); }
    .rating-count { font-size: 0.75rem; color: var(--gray-500); }
    .product-price { display: flex; align-items: baseline; gap: 0.5rem; }
    .current-price { font-size: 1.25rem; font-weight: 700; color: var(--gray-900); }
    .original-price { font-size: 0.875rem; color: var(--gray-400); text-decoration: line-through; }

    /* ═══════════════════════════════════════════════════════════ */
    /* CATEGORIES SHOWCASE                                        */
    /* ═══════════════════════════════════════════════════════════ */
    .categories-showcase { padding: 3rem 0; }
    .category-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem;
    }
    .category-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 1.5rem 1rem; background: white; border-radius: 16px;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      text-decoration: none !important; color: var(--gray-700);
      &:hover { background: var(--primary); color: white;
        .cat-icon-large { background: rgba(255,255,255,0.2); color: white; }
        .cat-count { color: rgba(255,255,255,0.8); }
      }
    }
    .cat-icon-large {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .cat-name { font-size: 0.8125rem; font-weight: 600; text-align: center; }
    .cat-count { font-size: 0.6875rem; color: var(--gray-400); }

    /* ═══════════════════════════════════════════════════════════ */
    /* AI AGENT BANNER                                            */
    /* ═══════════════════════════════════════════════════════════ */
    .ai-banner { padding: 2rem 0 3rem; }
    .ai-banner-inner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 2rem 2.5rem; background: linear-gradient(135deg, #7c3aed, #3b82f6);
      border-radius: 20px; color: white;
    }
    .ai-banner-content {
      display: flex; align-items: center; gap: 1.5rem;
      h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
      p { font-size: 0.875rem; color: rgba(255,255,255,0.8); max-width: 500px; }
    }
    .ai-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: rgba(255,255,255,0.2); display: flex; align-items: center;
      justify-content: center; font-size: 1.5rem; flex-shrink: 0;
    }
    .btn-ai-chat {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 2rem; background: white; color: #7c3aed;
      border-radius: 12px; font-weight: 700; text-decoration: none;
      transition: all 0.3s; white-space: nowrap;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
    }

    /* ═══════════════════════════════════════════════════════════ */
    /* FLOATING AI AGENT LAUNCHER                                 */
    /* ═══════════════════════════════════════════════════════════ */
    .floating-agent {
      position: fixed; bottom: 24px; right: 24px; z-index: 1000;
    }
    .agent-bubble {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.5rem; cursor: pointer;
      box-shadow: 0 4px 24px rgba(124,58,237,0.4);
      transition: all 0.3s; position: relative;
      &:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(124,58,237,0.5); }
      &::after {
        content: ''; position: absolute; inset: -4px; border-radius: 50%;
        border: 2px solid rgba(124,58,237,0.3); animation: agent-pulse 2s infinite;
      }
    }
    @keyframes agent-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.5; }
    }
    .agent-tooltip {
      position: absolute; bottom: calc(100% + 12px); right: 0;
      background: var(--gray-900); color: white; padding: 0.5rem 1rem;
      border-radius: 8px; font-size: 0.8125rem; white-space: nowrap;
      opacity: 0; pointer-events: none; transition: opacity 0.3s;
    }
    .agent-bubble:hover .agent-tooltip { opacity: 1; }

    .agent-expanded {
      width: 360px; max-height: 480px; background: white;
      border-radius: 20px; box-shadow: 0 16px 48px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .expanded-header {
      display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--gray-100);
      h4 { font-size: 0.9375rem; font-weight: 700; color: var(--gray-900); }
      .close-btn {
        margin-left: auto; width: 32px; height: 32px; border-radius: 8px; border: none;
        background: var(--gray-100); cursor: pointer; color: var(--gray-500);
        display: flex; align-items: center; justify-content: center;
        &:hover { background: var(--gray-200); }
      }
    }
    .expanded-avatar {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .online-dot { font-size: 0.75rem; color: var(--gray-500); display: flex; align-items: center; gap: 0.375rem; }
    .pulse-ring { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; }
    .expanded-messages { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; }
    .expanded-msg {
      display: flex; gap: 0.5rem; font-size: 0.875rem; color: var(--gray-700);
      &.bot { background: var(--gray-50); padding: 0.75rem; border-radius: 12px; margin-bottom: 0.75rem; }
      i { color: #7c3aed; flex-shrink: 0; margin-top: 2px; }
    }
    .expanded-quick { display: flex; flex-direction: column; gap: 0.5rem; }
    .expanded-quick button {
      padding: 0.625rem 1rem; background: var(--gray-50); border: 1px solid var(--gray-200);
      border-radius: 10px; font-size: 0.8125rem; cursor: pointer; text-align: left;
      font-family: inherit; transition: all 0.2s;
      &:hover { background: var(--primary-50); border-color: var(--primary); }
    }
    .expanded-input {
      display: flex; gap: 0.5rem; padding: 1rem 1.25rem; border-top: 1px solid var(--gray-100);
      input {
        flex: 1; padding: 0.625rem 1rem; border: 2px solid var(--gray-200);
        border-radius: 10px; font-size: 0.875rem; font-family: inherit;
        &:focus { outline: none; border-color: var(--primary); }
      }
      button {
        width: 40px; height: 40px; border-radius: 10px; border: none;
        background: var(--primary); color: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        &:hover { background: var(--primary-dark); }
      }
    }

    /* ═══════════════════════════════════════════════════════════ */
    /* RESPONSIVE                                                 */
    /* ═══════════════════════════════════════════════════════════ */
    @media (max-width: 900px) {
      .slide-visual { display: none; }
      .slide-content { max-width: 100%; margin-left: 0; padding: 3rem 2rem 5rem; }
      .slide-content h1 { font-size: 2rem; }
      .hero-stats-bar { display: none; }
      .ai-banner-inner { flex-direction: column; gap: 1.5rem; text-align: center; }
      .ai-banner-content { flex-direction: column; }
      .agent-expanded { width: calc(100vw - 48px); }
    }
    @media (max-width: 600px) {
      .hero { min-height: 420px; }
      .hero-slides { min-height: 420px; }
      .hero-search-inner input { font-size: 0.875rem; }
      .hero-search-btn span { display: none; }
    }
  `]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroSection') heroSection!: ElementRef;
  @ViewChild('dealsCarousel') dealsCarousel!: ElementRef;
  @ViewChild('recommendedCarousel') recommendedCarousel!: ElementRef;

  featuredProducts: Product[] = [];
  topDeals: Product[] = [];
  displayCategories: { slug: string; name: string }[] = [];

  heroSearchQuery = '';
  agentQuickInput = '';
  agentChatOpen = false;
  currentSlide = 0;
  tiltX = 0;
  tiltY = 0;

  private slideTimer: any;
  private tiltHandler: any;

  heroSlides = [
    {
      badge: 'Trending Now',
      badgeIcon: 'fa-fire',
      title: 'Discover <span class="highlight">Premium Products</span>',
      subtitle: 'Shop the latest collection from top brands. Quality products at unbeatable prices with AI-powered recommendations.',
      image: 'https://cdn.dummyjson.com/products/images/smartphones/iPhone%209/thumbnail.webp',
      imageAlt: 'iPhone',
      bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    },
    {
      badge: 'Smart Shopping',
      badgeIcon: 'fa-robot',
      title: 'AI-Powered <span class="highlight">Shopping Agent</span>',
      subtitle: 'Our intelligent agent finds products, compares prices, handles checkout, and resolves order issues automatically.',
      image: 'https://cdn.dummyjson.com/products/images/laptops/MacBook%20Pro/thumbnail.webp',
      imageAlt: 'MacBook',
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
    },
    {
      badge: 'Best Deals',
      badgeIcon: 'fa-tags',
      title: 'Up to <span class="highlight">50% Off</span> Top Brands',
      subtitle: 'Limited time offers on electronics, fashion, and home essentials. Don\'t miss out on these incredible savings.',
      image: 'https://cdn.dummyjson.com/products/images/sunglasses/Sunglasses/thumbnail.webp',
      imageAlt: 'Sunglasses',
      bg: 'linear-gradient(135deg, #134e4a 0%, #0f172a 100%)'
    },
    {
      badge: 'Free Shipping',
      badgeIcon: 'fa-truck-fast',
      title: 'Fast & <span class="highlight">Free Delivery</span>',
      subtitle: 'Free shipping on all orders. Get your favorite products delivered to your doorstep in 2-5 business days.',
      image: 'https://cdn.dummyjson.com/products/images/womens-dresses/Dark%20Green%20Women\'s%20Gown/thumbnail.webp',
      imageAlt: 'Fashion',
      bg: 'linear-gradient(135deg, #4c1d95 0%, #0f172a 100%)'
    }
  ];

  popularSearches = ['iPhone', 'MacBook', 'Sunglasses', 'Skincare', 'Watches'];

  private categoryColors: Record<string, string> = {
    beauty: '#fce7f3', fragrances: '#ede9fe', furniture: '#fef3c7',
    groceries: '#d1fae5', 'home-decoration': '#ffedd5', 'kitchen-accessories': '#e0f2fe',
    laptops: '#dbeafe', 'mens-shirts': '#cffafe', 'mens-shoes': '#f3e8ff',
    'mens-watches': '#fef9c3', 'mobile-accessories': '#e0e7ff', motorcycle: '#fee2e2',
    'skin-care': '#fce7f3', smartphones: '#dbeafe', 'sports-accessories': '#d1fae5',
    sunglasses: '#fef3c7', tablets: '#e0f2fe', tops: '#cffafe', vehicle: '#fee2e2',
    'womens-bags': '#fce7f3', 'womens-dresses': '#ede9fe', 'womens-jewellery': '#fef9c3',
    'womens-shoes': '#e0f2fe', 'womens-watches': '#f3e8ff'
  };

  private categoryIcons: Record<string, string> = {
    beauty: 'fa-palette', fragrances: 'fa-spray-can', furniture: 'fa-couch',
    groceries: 'fa-apple-whole', 'home-decoration': 'fa-vase', 'kitchen-accessories': 'fa-utensils',
    laptops: 'fa-laptop', 'mens-shirts': 'fa-shirt', 'mens-shoes': 'fa-shoe-prints',
    'mens-watches': 'fa-clock', 'mobile-accessories': 'fa-headphones', motorcycle: 'fa-motorcycle',
    'skin-care': 'fa-spa', smartphones: 'fa-mobile-alt', 'sports-accessories': 'fa-dumbbell',
    sunglasses: 'fa-glasses', tablets: 'fa-tablet-alt', tops: 'fa-vest',
    vehicle: 'fa-car', 'womens-bags': 'fa-bag-shopping', 'womens-dresses': 'fa-vest-patches',
    'womens-jewellery': 'fa-gem', 'womens-shoes': 'fa-shoe-prints', 'womens-watches': 'fa-clock'
  };

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    public wishlistService: WishlistService,
    private agentService: AgentWebSocketService
  ) {}

  ngOnInit() {
    this.productService.getProducts({ limit: 8, sortBy: 'rating', order: 'desc' })
      .subscribe(res => this.featuredProducts = res.products);

    this.productService.getProducts({ limit: 8, sortBy: 'discountPercentage', order: 'desc' })
      .subscribe(res => this.topDeals = res.products);

    this.productService.getCategories()
      .subscribe(cats => this.displayCategories = cats.slice(0, 15));
  }

  ngAfterViewInit() {
    // Auto-rotate hero slides
    this.slideTimer = setInterval(() => this.nextSlide(), 5000);

    // Parallax tilt effect on hero card
    this.tiltHandler = (e: MouseEvent) => {
      if (!this.heroSection) return;
      const rect = this.heroSection.nativeElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.tiltX = x * 15;
      this.tiltY = -y * 10;
    };
    document.addEventListener('mousemove', this.tiltHandler);
  }

  ngOnDestroy() {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.tiltHandler) document.removeEventListener('mousemove', this.tiltHandler);
  }

  goToSlide(i: number) { this.currentSlide = i; this.resetSlideTimer(); }
  nextSlide() { this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length; }
  prevSlide() { this.currentSlide = (this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length; this.resetSlideTimer(); }
  private resetSlideTimer() {
    if (this.slideTimer) clearInterval(this.slideTimer);
    this.slideTimer = setInterval(() => this.nextSlide(), 5000);
  }

  scrollCarousel(id: string, dir: number) {
    const el = id === 'deals' ? this.dealsCarousel?.nativeElement : this.recommendedCarousel?.nativeElement;
    if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  heroSearch() {
    if (this.heroSearchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { q: this.heroSearchQuery.trim() } });
    }
  }

  searchFor(term: string) { this.router.navigate(['/products'], { queryParams: { q: term } }); }

  getDiscountedPrice(product: Product): number { return ProductService.discountedPrice(product); }
  getStars(rating: number) { return ProductService.starsArray(rating); }
  getCatColor(slug: string): string { return this.categoryColors[slug] || '#f1f5f9'; }
  getCatIcon(slug: string): string { return this.categoryIcons[slug] || 'fa-folder'; }

  addToCart(product: Product, event: Event) { event.stopPropagation(); this.cartService.addItem(product); }
  toggleWishlist(product: Product, event: Event) { event.stopPropagation(); this.wishlistService.toggle(product); }
  goToProduct(id: number) { this.router.navigate(['/product', id]); }

  toggleAgentChat() { this.agentChatOpen = !this.agentChatOpen; }

  launchAgent(message: string) {
    if (message?.trim()) {
      this.router.navigate(['/agent'], { queryParams: { q: message } });
      this.agentChatOpen = false;
    }
  }
}
