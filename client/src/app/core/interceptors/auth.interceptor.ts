import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Module-level state coordinates token refresh across concurrent requests
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

/** Attaches Bearer token and transparently refreshes it on 401 responses. */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Skip interceptor for auth endpoints to avoid infinite loops
  if (isAuthUrl(req.url)) {
    return next(req);
  }

  const token = authService.accessToken();
  const authReq = token ? withBearer(req, token) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return handleUnauthorised(authReq, next, authService);
      }
      return throwError(() => err);
    })
  );
};

function isAuthUrl(url: string): boolean {
  return url.includes('/api/auth/login') || url.includes('/api/auth/refresh');
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handleUnauthorised(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((newToken: string) => {
        isRefreshing = false;
        refreshSubject.next(newToken);
        return next(withBearer(req, newToken));
      }),
      catchError((err: unknown) => {
        isRefreshing = false;
        refreshSubject.next(null);
        // authService.logout() is called inside refreshAccessToken on failure
        return throwError(() => err);
      })
    );
  }

  // Queue all other requests until the refresh completes
  return refreshSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap(token => next(withBearer(req, token)))
  );
}
