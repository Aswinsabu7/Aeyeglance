import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { URLS } from '../../utilities/urls';
import { ApiResponse } from '../models/api-response.model';
import { AuthUser, LoginRequest, LoginResponse, RefreshResponse } from '../models/auth.model';

const ACCESS_TOKEN_KEY  = 'tms_access_token';
const REFRESH_TOKEN_KEY = 'tms_refresh_token';
const USER_KEY          = 'tms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  // ── Signals ────────────────────────────────────────────────────────────────
  private readonly _accessToken = signal<string | null>(this.loadAccessToken());
  private readonly _user        = signal<AuthUser | null>(this.loadUser());

  readonly accessToken    = this._accessToken.asReadonly();
  readonly user           = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  // ── Login ─────────────────────────────────────────────────────────────────
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(URLS.auth.login, credentials)
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error(res.message);
          return res.data;
        }),
        tap(data => this.persistTokens(data))
      );
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<ApiResponse<RefreshResponse>>(URLS.auth.refresh, { refreshToken })
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error(res.message);
          return res.data.accessToken;
        }),
        tap(token => {
          this._accessToken.set(token);
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
        }),
        catchError(err => {
          this.clearTokens();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      // Fire-and-forget; even if it fails we clear local state
      this.http
        .post<ApiResponse>(URLS.auth.logout, { refreshToken })
        .subscribe({ error: () => {} });
    }
    this.clearTokens();
    this.router.navigate(['/auth/login']);
  }

  // ── Token Helpers ─────────────────────────────────────────────────────────
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private persistTokens(data: LoginResponse): void {
    this._accessToken.set(data.accessToken);
    this._user.set(data.user);
    localStorage.setItem(ACCESS_TOKEN_KEY,  data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  private clearTokens(): void {
    this._accessToken.set(null);
    this._user.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private loadAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? (JSON.parse(raw) as AuthUser) : null; } catch { return null; }
  }
}
