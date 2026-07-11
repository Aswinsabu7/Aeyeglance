import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Protects routes from unauthenticated access.
 * On page refresh, silently attempts to obtain a new access token from
 * the persisted refresh token before redirecting to login.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // Already authenticated in memory
  if (authService.isAuthenticated()) {
    return true;
  }

  // Attempt silent refresh if a refresh token exists in storage
  if (authService.hasRefreshToken()) {
    return authService.refreshAccessToken().pipe(
      map(() => true),
      catchError(() =>
        of(router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        }))
      )
    );
  }

  // No tokens at all – go to login
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
