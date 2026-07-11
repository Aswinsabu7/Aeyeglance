import { Injectable, signal } from '@angular/core';

/** Placeholder service – extend for future settings persistence */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly appName = signal('Student Management System');
  readonly version = signal('1.0.0');
}
