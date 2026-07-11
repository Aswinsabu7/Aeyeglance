import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { Subject, forkJoin, skip, takeUntil } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import * as echarts from 'echarts';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { DashboardStats, StatusSummary, PrioritySummary } from '../../core/models/dashboard.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart')   statusChartEl!:   ElementRef<HTMLDivElement>;
  @ViewChild('priorityChart') priorityChartEl!: ElementRef<HTMLDivElement>;

  private readonly dashboardService = inject(DashboardService);
  private readonly themeService     = inject(ThemeService);
  private readonly notify           = inject(NotificationService);
  private readonly cdr              = inject(ChangeDetectorRef);

  private statusChart?:   echarts.ECharts;
  private priorityChart?: echarts.ECharts;
  private destroy$        = new Subject<void>();

  readonly loading         = signal(true);
  readonly stats           = signal<DashboardStats | null>(null);
  readonly statusSummary   = signal<StatusSummary[]>([]);
  readonly prioritySummary = signal<PrioritySummary[]>([]);
  readonly statCards       = signal<{ label: string; value: number; icon: string; color: string }[]>([]);

  ngOnInit(): void {
    this.loadData();

    // Redraw charts when theme toggles
    toObservable(this.themeService.isDark)
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.loading()) {
          setTimeout(() => this.drawCharts(), 50);
        }
      });
  }
  ngAfterViewInit(): void { /* charts drawn after data loads */ }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.statusChart?.dispose();
    this.priorityChart?.dispose();
  }

  private loadData(): void {
    forkJoin({
      stats:    this.dashboardService.getStats(),
      status:   this.dashboardService.getStatusSummary(),
      priority: this.dashboardService.getPrioritySummary()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ stats, status, priority }) => {
        const s = stats.data!;
        this.stats.set(s);
        this.statusSummary.set(status.data ?? []);
        this.prioritySummary.set(priority.data ?? []);

        this.statCards.set([
          { label: 'Total Tickets',   value: s.total,      icon: 'pi pi-ticket',         color: 'var(--primary-color)'  },
          { label: 'Open',            value: s.open,       icon: 'pi pi-circle',          color: 'var(--info-color)'     },
          { label: 'In Progress',     value: s.inProgress, icon: 'pi pi-refresh',         color: 'var(--warning-color)'  },
          { label: 'Resolved/Closed', value: s.resolved,   icon: 'pi pi-check-circle',    color: 'var(--success-color)'  },
          { label: 'Critical',        value: s.critical,   icon: 'pi pi-bolt',            color: 'var(--danger-color)'   }
        ]);

        this.loading.set(false);
        this.cdr.detectChanges();
        setTimeout(() => this.drawCharts(), 50);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Dashboard', 'Failed to load dashboard data');
        this.cdr.detectChanges();
      }
    });
  }

  private drawCharts(): void {
    this.drawStatusChart();
    this.drawPriorityChart();
    this.setupResizeObserver();
  }

  private drawStatusChart(): void {
    if (!this.statusChartEl?.nativeElement) return;
    this.statusChart?.dispose();
    const isDark = this.themeService.isDark();
    this.statusChart = echarts.init(this.statusChartEl.nativeElement, isDark ? 'dark' : undefined);

    const data = this.statusSummary();
    const COLORS: Record<string, string> = {
      open: '#3b82f6', 'in-progress': '#f59e0b', resolved: '#22c55e', closed: '#94a3b8'
    };

    this.statusChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '2%', textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: isDark ? '#1c2333' : '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: data.map(d => ({ name: d.status, value: d.count, itemStyle: { color: COLORS[d.status] ?? '#94a3b8' } }))
      }]
    });
  }

  private drawPriorityChart(): void {
    if (!this.priorityChartEl?.nativeElement) return;
    this.priorityChart?.dispose();
    const isDark = this.themeService.isDark();
    this.priorityChart = echarts.init(this.priorityChartEl.nativeElement, isDark ? 'dark' : undefined);

    const data = this.prioritySummary();
    const COLORS: Record<string, string> = {
      critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#94a3b8'
    };

    this.priorityChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => d.priority),
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b' }
      },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { color: isDark ? '#94a3b8' : '#64748b' } },
      series: [{
        type: 'bar',
        data: data.map(d => ({
          value: d.count,
          itemStyle: { color: COLORS[d.priority] ?? '#94a3b8', borderRadius: [6, 6, 0, 0] }
        })),
        barMaxWidth: 60,
        label: { show: true, position: 'top', color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 12 }
      }]
    });
  }

  private setupResizeObserver(): void {
    const observer = new ResizeObserver(() => {
      this.statusChart?.resize();
      this.priorityChart?.resize();
    });
    if (this.statusChartEl?.nativeElement)   observer.observe(this.statusChartEl.nativeElement);
    if (this.priorityChartEl?.nativeElement) observer.observe(this.priorityChartEl.nativeElement);
  }
}
