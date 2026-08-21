import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of, switchMap, catchError } from 'rxjs';

const API = '/api/v1';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  role?: string;
}

export interface AuthResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<AuthUser | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.getToken());

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    try {
      const userJson = localStorage.getItem('shop_user');
      const token = localStorage.getItem('shop_token');
      if (userJson && token) {
        this.currentUser.set(JSON.parse(userJson));
      }
    } catch { localStorage.clear(); }
  }

  getToken(): string | null {
    return localStorage.getItem('shop_token');
  }

  login(username: string, password: string): Observable<AuthResponse> {
    // Try backend first, fall back to DummyJSON
    return this.http.post<AuthResponse>(`${API}/auth/login`, { username, password }).pipe(
      tap(res => this.handleAuth(res)),
      catchError(() => {
        // Fallback to DummyJSON API
        return this.http.post<AuthResponse>('https://dummyjson.com/auth/login', {
          username, password, expiresInMins: 60
        }).pipe(tap(res => this.handleAuth(res)));
      })
    );
  }

  register(data: { username: string; password: string; email: string; firstName: string; lastName: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/register`, data).pipe(
      tap(res => this.handleAuth(res)),
      catchError(() => {
        return this.http.post<AuthResponse>('https://dummyjson.com/auth/login', {
          username: data.username, password: data.password, expiresInMins: 60
        }).pipe(tap(res => this.handleAuth({ ...res, firstName: data.firstName, lastName: data.lastName })));
      })
    );
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(tap(user => {
      this.currentUser.set(user);
      localStorage.setItem('shop_user', JSON.stringify(user));
    }));
  }

  logout(): void {
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_refresh');
    localStorage.removeItem('shop_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem('shop_token', res.accessToken);
    localStorage.setItem('shop_refresh', res.refreshToken);
    const userWithRole = { ...res, role: res.username === 'admin' || res.email?.includes('admin') ? 'admin' : 'user' };
    localStorage.setItem('shop_user', JSON.stringify(userWithRole));
    this.currentUser.set(userWithRole);
  }
}
