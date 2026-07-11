import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject, signal
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { AiService } from '../../../core/services/ai.service';
import { Ticket, AiAnalysis, AiMessage } from '../../../core/models/ticket.model';

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './ai-panel.component.html',
  styleUrl:    './ai-panel.component.scss'
})
export class AiPanelComponent implements OnInit {
  @Input({ required: true }) ticket!: Ticket;
  @Output() close = new EventEmitter<void>();
  @ViewChild('messagesEnd') messagesEnd!: ElementRef<HTMLDivElement>;

  private readonly aiService = inject(AiService);
  private readonly cdr       = inject(ChangeDetectorRef);

  readonly analysis    = signal<AiAnalysis | null>(null);
  readonly messages    = signal<AiMessage[]>([]);
  readonly loadingInit = signal(true);
  readonly asking      = signal(false);

  readonly questionControl = new FormControl('');

  readonly quickQuestions: string[] = [
    'Estimate time to close this ticket',
    'Is the priority correct?',
    'What is the root cause?',
    'Suggest a fix',
    'Who should handle this?',
    'Are there any blockers?',
  ];

  ngOnInit(): void {
    this.aiService.analyze(this.ticket.id).subscribe({
      next: res => {
        this.analysis.set(res.data ?? null);
        this.loadingInit.set(false);
        // Seed the chat with the analysis summary
        const a = res.data;
        if (a) {
          const intro = `**Summary:** ${a.summary}\n\n**Next Step:** ${a.nextStep}\n\n**Suggestions:**\n${a.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n**Estimated time:** ${a.estimatedTime}`;
          this.messages.set([{ role: 'assistant', content: intro }]);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingInit.set(false);
        this.messages.set([{ role: 'assistant', content: 'Failed to load analysis. Please try asking a question below.' }]);
        this.cdr.markForCheck();
      }
    });
  }

  askQuestion(): void {
    const q = this.questionControl.value?.trim();
    if (!q || this.asking()) return;

    this.questionControl.setValue('');
    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', content: q },
      { role: 'assistant', content: '', loading: true }
    ]);
    this.asking.set(true);
    this.cdr.markForCheck();
    this.scrollToBottom();

    this.aiService.ask(this.ticket.id, q).subscribe({
      next: res => {
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[updated.length - 1] = { role: 'assistant', content: res.data?.answer ?? 'No answer.' };
          return updated;
        });
        this.asking.set(false);
        this.cdr.markForCheck();
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' };
          return updated;
        });
        this.asking.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.askQuestion();
    }
  }

  askQuick(question: string): void {
    this.questionControl.setValue(question);
    this.askQuestion();
  }

  // Simple markdown-ish renderer (bold + line breaks)
  renderContent(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}
