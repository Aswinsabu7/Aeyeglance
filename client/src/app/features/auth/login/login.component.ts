import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { xssValidator, noWhitespaceValidator } from '../../../shared/validators/custom-validators';
import { XssPreventDirective } from '../../../shared/directives/xss-prevent.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    XssPreventDirective
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb           = inject(FormBuilder);
  private readonly authService  = inject(AuthService);
  private readonly notify       = inject(NotificationService);
  private readonly router       = inject(Router);

  readonly loading = signal(false);

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), xssValidator(), noWhitespaceValidator()]],
    password: ['', [Validators.required, Validators.minLength(6), xssValidator()]]
  });

  get username() { return this.form.get('username')!; }
  get password() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);

    this.authService.login(this.form.getRawValue() as { username: string; password: string })
      .subscribe({
        next: () => {
          this.notify.success('Welcome!', 'Login successful');
          this.router.navigate(['/dashboard']);
        },
        error: (err: { error?: { message?: string }; status?: number }) => {
          this.loading.set(false);
          let msg = 'Login failed. Please try again.';
          if (err?.status === 0) {
            msg = 'Cannot reach the server. Please ensure the backend is running.';
          } else if (err?.error?.message) {
            msg = err.error.message;
          } else if (err?.status && err.status >= 500) {
            msg = 'Server error. Please try again later.';
          }
          this.notify.error('Login Failed', msg);
        },
        complete: () => this.loading.set(false)
      });
  }
}
