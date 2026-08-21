import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme = signal<Theme>(this.loadTheme());

  readonly currentTheme = this.theme.asReadonly();

  constructor() {
    effect(() => {
      this.applyTheme(this.theme());
    });
    // Apply on init
    this.applyTheme(this.theme());
  }

  toggle(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
    this.save();
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.save();
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-mode', theme === 'dark');
  }

  private save(): void {
    try {
      localStorage.setItem('shop_theme', this.theme());
    } catch {}
  }

  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem('shop_theme') as Theme;
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    // Respect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
}
