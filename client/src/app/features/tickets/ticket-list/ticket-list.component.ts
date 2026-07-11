import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  OnDestroy, OnInit, inject, signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../../../core/models/ticket.model';

interface SelectOption { label: string; value: string; }

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
  imports: [
    RouterLink, ReactiveFormsModule, DatePipe,
    TableModule, ButtonModule, TagModule, TooltipModule,
    SelectModule, InputTextModule, ConfirmDialogModule
  ],
  templateUrl: './ticket-list.component.html',
  styleUrl:    './ticket-list.component.scss'
})
export class TicketListComponent implements OnInit, OnDestroy {
  private readonly ticketService    = inject(TicketService);
  private readonly notify           = inject(NotificationService);
  private readonly cdr              = inject(ChangeDetectorRef);
  private readonly router           = inject(Router);
  private readonly confirmService   = inject(ConfirmationService);
  private readonly destroy$         = new Subject<void>();

  readonly tickets       = signal<Ticket[]>([]);
  readonly totalRecords  = signal(0);
  readonly tableLoading  = signal(false);

  private currentPage  = 1;
  private currentLimit = 10;

  readonly searchControl    = new FormControl('');
  readonly statusControl    = new FormControl<TicketStatus | ''>('');
  readonly priorityControl  = new FormControl<TicketPriority | ''>('');
  readonly categoryControl  = new FormControl<TicketCategory | ''>('');

  readonly statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Open',         value: 'open' },
    { label: 'In Progress',  value: 'in-progress' },
    { label: 'Resolved',     value: 'resolved' },
    { label: 'Closed',       value: 'closed' }
  ];

  readonly priorityOptions: SelectOption[] = [
    { label: 'All Priorities', value: '' },
    { label: 'Critical',       value: 'critical' },
    { label: 'High',           value: 'high' },
    { label: 'Medium',         value: 'medium' },
    { label: 'Low',            value: 'low' }
  ];

  readonly categoryOptions: SelectOption[] = [
    { label: 'All Categories', value: '' },
    { label: 'Bug',            value: 'bug' },
    { label: 'Feature',        value: 'feature' },
    { label: 'Support',        value: 'support' },
    { label: 'Inquiry',        value: 'inquiry' }
  ];

  ngOnInit(): void {
    // Debounce search
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.resetAndLoad());

    // Instant filter changes
    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.resetAndLoad());
    this.priorityControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.resetAndLoad());
    this.categoryControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.resetAndLoad());

    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(event?: TableLazyLoadEvent): void {
    if (event) {
      this.currentPage  = Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1;
      this.currentLimit = event.rows ?? 10;
    }

    this.tableLoading.set(true);
    this.ticketService.getTickets(this.currentPage, this.currentLimit, {
      search:   this.searchControl.value  ?? '',
      status:   this.statusControl.value  ?? '',
      priority: this.priorityControl.value ?? '',
      category: this.categoryControl.value ?? ''
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        this.tickets.set(res.data?.tickets ?? []);
        this.totalRecords.set(res.data?.total ?? 0);
        this.tableLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.tableLoading.set(false);
        this.notify.error('Error', 'Failed to load tickets');
        this.cdr.markForCheck();
      }
    });
  }

  private resetAndLoad(): void {
    this.currentPage = 1;
    this.loadTickets();
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('',   { emitEvent: false });
    this.priorityControl.setValue('', { emitEvent: false });
    this.categoryControl.setValue('', { emitEvent: false });
    this.resetAndLoad();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.statusControl.value ||
      this.priorityControl.value ||
      this.categoryControl.value
    );
  }

  viewTicket(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.id]);
  }

  editTicket(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.id, 'edit']);
  }

  deleteTicket(ticket: Ticket): void {
    this.confirmService.confirm({
      message: `Delete ticket <strong>${ticket.ticketId}</strong>? This cannot be undone.`,
      header:  'Confirm Delete',
      icon:    'pi pi-exclamation-triangle',
      accept:  () => {
        this.ticketService.deleteTicket(ticket.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notify.success('Deleted', `Ticket ${ticket.ticketId} deleted`);
              this.loadTickets();
            },
            error: () => this.notify.error('Error', 'Failed to delete ticket')
          });
      }
    });
  }

  // ── Badge helpers ────────────────────────────────────────────────────────────
  statusSeverity(status: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      'open':        'info',
      'in-progress': 'warn',
      'resolved':    'success',
      'closed':      'secondary'
    };
    return map[status] ?? 'info';
  }

  prioritySeverity(priority: TicketPriority): string {
    const map: Record<TicketPriority, string> = {
      critical: 'danger',
      high:     'warn',
      medium:   'info',
      low:      'secondary'
    };
    return map[priority] ?? 'info';
  }

  priorityIcon(priority: TicketPriority): string {
    const map: Record<TicketPriority, string> = {
      critical: 'pi pi-bolt',
      high:     'pi pi-arrow-up',
      medium:   'pi pi-minus',
      low:      'pi pi-arrow-down'
    };
    return map[priority] ?? 'pi pi-minus';
  }

  categoryIcon(category: TicketCategory): string {
    const map: Record<TicketCategory, string> = {
      bug:     'pi pi-bug',
      feature: 'pi pi-star',
      support: 'pi pi-headphones',
      inquiry: 'pi pi-question-circle'
    };
    return map[category] ?? 'pi pi-tag';
  }
}
