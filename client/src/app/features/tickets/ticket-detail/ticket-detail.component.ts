import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  OnDestroy, OnInit, inject, signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../../../core/models/ticket.model';
import { AiPanelComponent } from '../../../shared/components/ai-panel/ai-panel.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
  imports: [
    RouterLink, DatePipe,
    ButtonModule, TagModule, TooltipModule,
    ConfirmDialogModule, AiPanelComponent
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl:    './ticket-detail.component.scss'
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly ticketService  = inject(TicketService);
  private readonly notify         = inject(NotificationService);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly confirmService = inject(ConfirmationService);
  private readonly destroy$       = new Subject<void>();

  readonly ticket   = signal<Ticket | null>(null);
  readonly loading  = signal(true);
  readonly aiOpen   = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.ticketService.getTicketById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.ticket.set(res.data ?? null);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Error', 'Ticket not found');
          this.router.navigate(['/tickets']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleAiPanel(): void {
    this.aiOpen.update(v => !v);
  }

  deleteTicket(): void {
    const t = this.ticket();
    if (!t) return;
    this.confirmService.confirm({
      message: `Delete ticket <strong>${t.ticketId}</strong>? This cannot be undone.`,
      header:  'Confirm Delete',
      icon:    'pi pi-exclamation-triangle',
      accept:  () => {
        this.ticketService.deleteTicket(t.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notify.success('Deleted', `Ticket ${t.ticketId} deleted`);
              this.router.navigate(['/tickets']);
            },
            error: () => this.notify.error('Error', 'Failed to delete ticket')
          });
      }
    });
  }

  // ── Badge helpers ────────────────────────────────────────────────────────────
  statusSeverity(status: TicketStatus): string {
    const m: Record<TicketStatus, string> = {
      'open': 'info', 'in-progress': 'warn', 'resolved': 'success', 'closed': 'secondary'
    };
    return m[status] ?? 'info';
  }

  priorityIcon(priority: TicketPriority): string {
    const m: Record<TicketPriority, string> = {
      critical: 'pi pi-bolt', high: 'pi pi-arrow-up', medium: 'pi pi-minus', low: 'pi pi-arrow-down'
    };
    return m[priority] ?? 'pi pi-minus';
  }

  categoryIcon(category: TicketCategory): string {
    const m: Record<TicketCategory, string> = {
      bug: 'pi pi-bug', feature: 'pi pi-star', support: 'pi pi-headphones', inquiry: 'pi pi-question-circle'
    };
    return m[category] ?? 'pi pi-tag';
  }
}
