import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    provideHttpClient(withInterceptors([loaderInterceptor, authInterceptor])),

    provideAnimationsAsync(),

    // PrimeNG v19 new theme system
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'body.dark-theme',
          cssLayer: { name: 'primeng', order: 'primeng, app' }
        }
      },
      ripple: true
    }),

    // PrimeNG singleton services
    MessageService,
    ConfirmationService
  ]
};
