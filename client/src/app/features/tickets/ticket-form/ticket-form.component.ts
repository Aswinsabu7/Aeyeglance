import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  OnInit, inject, signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Ticket } from '../../../core/models/ticket.model';

interface SelectOption { label: string; value: string; }

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule, SelectModule
  ],
  templateUrl: './ticket-form.component.html',
  styleUrl:    './ticket-form.component.scss'
})
export class TicketFormComponent implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly fb            = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly notify        = inject(NotificationService);
  private readonly cdr           = inject(ChangeDetectorRef);

  readonly isEdit   = signal(false);
  readonly loading  = signal(false);
  readonly saving   = signal(false);
  private ticketId: number | null = null;

  readonly statusOptions: SelectOption[] = [
    { label: 'Open',        value: 'open'        },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved',    value: 'resolved'    },
    { label: 'Closed',      value: 'closed'      },
  ];

  readonly priorityOptions: SelectOption[] = [
    { label: 'Critical', value: 'critical' },
    { label: 'High',     value: 'high'     },
    { label: 'Medium',   value: 'medium'   },
    { label: 'Low',      value: 'low'      },
  ];

  readonly categoryOptions: SelectOption[] = [
    { label: 'Bug',     value: 'bug'     },
    { label: 'Feature', value: 'feature' },
    { label: 'Support', value: 'support' },
    { label: 'Inquiry', value: 'inquiry' },
  ];

  form: FormGroup = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    status:      ['open',   Validators.required],
    priority:    ['medium', Validators.required],
    category:    ['bug',    Validators.required],
    assignee:    [''],
    reporter:    [''],
    tags:        [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.ticketId = Number(id);
      this.loadTicket(this.ticketId);
    }
  }

  private loadTicket(id: number): void {
    this.loading.set(true);
    this.ticketService.getTicketById(id).subscribe({
      next: res => {
        const t = res.data;
        if (t) {
          this.form.patchValue({
            title:       t.title,
            description: t.description,
            status:      t.status,
            priority:    t.priority,
            category:    t.category,
            assignee:    t.assignee ?? '',
            reporter:    t.reporter ?? '',
            tags:        (t.tags ?? []).join(', '),
          });
        }
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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const payload: Partial<Ticket> = {
      title:       v.title.trim(),
      description: v.description.trim(),
      status:      v.status,
      priority:    v.priority,
      category:    v.category,
      assignee:    v.assignee?.trim() || '',
      reporter:    v.reporter?.trim() || '',
      tags:        v.tags
        ? v.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
    };

    this.saving.set(true);
    const req$ = this.isEdit()
      ? this.ticketService.updateTicket(this.ticketId!, payload)
      : this.ticketService.createTicket(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(
          this.isEdit() ? 'Updated' : 'Created',
          this.isEdit() ? 'Ticket updated successfully' : 'Ticket created successfully'
        );
        this.router.navigate(['/tickets']);
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Error', 'Failed to save ticket. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    if (this.isEdit() && this.ticketId) {
      this.router.navigate(['/tickets', this.ticketId]);
    } else {
      this.router.navigate(['/tickets']);
    }
  }

  fieldError(name: string): boolean {
    const c = this.form.get(name);
    return !!(c?.invalid && c?.touched);
  }
}
