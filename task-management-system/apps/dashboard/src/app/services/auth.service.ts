import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  access_token?: string;
  user: {
    id: number;
    email: string;
    role: string;
    organizationId: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/api';

  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'current_user';

  private authState$ = new BehaviorSubject<boolean>(this.hasToken());

  constructor() {
    // Initialize auth state on service creation
    this.authState$.next(this.hasToken());
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          const token = response.accessToken ?? (response as any).access_token;
          if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
          }
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          this.authState$.next(true);
        })
      );
  }

  register(dto: { email: string; password: string; organizationId: number }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, dto).pipe(
      tap((response) => {
        const token = response.accessToken ?? (response as any).access_token;
        if (token) {
          localStorage.setItem(this.TOKEN_KEY, token);
        }
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this.authState$.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser() {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.authState$.asObservable();
  }

  private hasToken(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }
}
