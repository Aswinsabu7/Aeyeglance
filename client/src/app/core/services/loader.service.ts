import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  /** Count of in-flight HTTP requests */
  private readonly _count = signal(0);

  /** True whenever at least one request is pending */
  readonly isLoading = computed(() => this._count() > 0);

  increment(): void {
    this._count.update(n => n + 1);
  }

  decrement(): void {
    this._count.update(n => Math.max(0, n - 1));
  }
}
