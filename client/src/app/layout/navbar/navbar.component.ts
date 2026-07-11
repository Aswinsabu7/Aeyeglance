import { ChangeDetectionStrategy, Component, HostListener, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LayoutService } from '../../core/services/layout.service';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/tickets':      'Tickets',
  '/tickets/new':  'New Ticket',
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly authService  = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  readonly showUserMenu = signal(false);

  private readonly navEnd = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
  );

  readonly pageTitle = computed(() => {
    this.navEnd(); // track dependency
    const url = this.router.url.split('?')[0];
    if (url === '/tickets/new') return 'New Ticket';
    if (url.endsWith('/edit'))  return 'Edit Ticket';
    for (const [path, title] of Object.entries(ROUTE_TITLES)) {
      if (url === path || url.startsWith(path + '/')) return title;
    }
    return 'Ticket Management System';
  });

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: HTMLElement): void {
    const wrapper = document.querySelector('.user-menu-wrapper');
    if (wrapper && !wrapper.contains(target)) {
      this.showUserMenu.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }
}
