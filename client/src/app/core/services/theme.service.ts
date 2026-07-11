import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'tms_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal<boolean>(this.loadTheme());

  readonly isDark = this._isDark.asReadonly();

  /** Apply the persisted theme on app startup. */
  initTheme(): void {
    this.applyTheme(this._isDark());
  }

  toggleTheme(): void {
    const next = !this._isDark();
    this._isDark.set(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    this.applyTheme(next);
  }

  private applyTheme(dark: boolean): void {
    const body = document.body;
    if (dark) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }

  private loadTheme(): boolean {
    return localStorage.getItem(THEME_KEY) === 'dark';
  }
}
