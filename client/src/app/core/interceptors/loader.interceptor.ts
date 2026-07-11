import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

/** Shows the global loader while any HTTP request is in flight. */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  loaderService.increment();

  return next(req).pipe(
    finalize(() => loaderService.decrement())
  );
};
