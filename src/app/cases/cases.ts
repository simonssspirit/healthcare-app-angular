import { Component, OnInit, OnDestroy, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_DROPDOWNS } from '@progress/kendo-angular-dropdowns';
import { KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_INDICATORS } from '@progress/kendo-angular-indicators';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { KENDO_LAYOUT } from '@progress/kendo-angular-layout';
import {
  ActiveCase,
  CASE_EMPTY_NO_CASES,
  CASE_EMPTY_NO_MATCHES,
  CASE_NO_ACTIONS_LABEL,
  CaseFilterState,
  CaseSortDirection,
  CaseSortKey,
  DEFAULT_CASE_FILTER,
  filterCases,
  getCasePriorityColor,
  getCaseStatusColor,
  sortCases,
} from '../data/cases.data';
import { AlertStatus } from '../data/home.data';
import { CaseQueueService } from '../services/case-queue.service';
import { PageHeaderService } from '../services/page-header.service';

@Component({
  selector: 'app-cases',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './cases.html',
  styleUrls: ['./cases.css'],
  imports: [
    FormsModule,
    DatePipe,
    KENDO_GRID,
    KENDO_BUTTONS,
    KENDO_ICONS,
    KENDO_INDICATORS,
    KENDO_LAYOUT,
    KENDO_DROPDOWNS,
    KENDO_INPUTS,
  ],
})
export class CasesComponent implements OnInit, OnDestroy {
  private readonly caseQueue = inject(CaseQueueService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly router = inject(Router);

  public readonly CASE_NO_ACTIONS_LABEL = CASE_NO_ACTIONS_LABEL;
  public readonly getCaseStatusColor = getCaseStatusColor;
  public readonly getCasePriorityColor = getCasePriorityColor;

  /** Sentinel item prepended to the priority dropdown; never a real priority value. */
  public readonly ALL_PRIORITIES_LABEL = 'All priorities';

  public readonly statusOptions: AlertStatus[] = ['Open', 'In Progress'];
  public readonly sortOptions: { text: string; value: CaseSortKey }[] = [
    { text: 'Priority', value: 'priority' },
    { text: 'Case age', value: 'age' },
  ];

  public readonly filter = signal<CaseFilterState>({ ...DEFAULT_CASE_FILTER });
  public readonly sortKey = signal<CaseSortKey>('priority');
  public readonly sortDirection = signal<CaseSortDirection>('asc');
  public readonly selectedAlertId = signal<number | null>(null);
  public patientLinkFeedback = '';

  public readonly visibleCases = computed(() =>
    sortCases(filterCases(this.caseQueue.allCases(), this.filter()), this.sortKey(), this.sortDirection()),
  );

  public readonly selectedCase = computed(
    () => this.visibleCases().find((c) => c.alert.id === this.selectedAlertId()) ?? null,
  );

  public readonly hasAnyActiveCase = computed(() => this.caseQueue.activeCases().length > 0);

  /** Distinguishes the "no cases at all" empty state from the "no matches" one. */
  public readonly emptyStateMessage = computed(() =>
    this.hasAnyActiveCase() ? CASE_EMPTY_NO_MATCHES : CASE_EMPTY_NO_CASES,
  );

  public readonly priorityOptions = computed(() => this.caseQueue.availablePriorities());
  public readonly allPriorityOptions = computed(() => [
    this.ALL_PRIORITIES_LABEL,
    ...this.priorityOptions(),
  ]);

  public ngOnInit(): void {
    this.pageHeaderService.title.set('Active Cases');
    this.pageHeaderService.subtitle.set('Open and in-progress patient cases');
  }

  public ngOnDestroy(): void {
    this.pageHeaderService.title.set('');
    this.pageHeaderService.subtitle.set('');
  }

  public selectCase(c: ActiveCase): void {
    this.selectedAlertId.set(c.alert.id);
  }

  public clearSelection(): void {
    this.selectedAlertId.set(null);
  }

  public canStart(c: ActiveCase): boolean {
    return this.caseQueue.canStart(c.alert);
  }

  public canResolve(c: ActiveCase): boolean {
    return this.caseQueue.canResolve(c.alert);
  }

  public startCase(c: ActiveCase): void {
    this.caseQueue.markInProgress(c.alert);
  }

  public resolveCase(c: ActiveCase): void {
    this.caseQueue.markResolved(c.alert);

    if (this.selectedAlertId() === c.alert.id && !this.filter().showResolved) {
      this.clearSelection();
    }
  }

  /** Accessible name for the per-case "start" control, reflecting current state. */
  public startCaseAriaLabel(c: ActiveCase): string {
    return this.canStart(c)
      ? `Start work on ${c.alert.title}. Current status ${c.alert.status}.`
      : `${c.alert.title} is already ${c.alert.status}. Cannot start work.`;
  }

  /** Accessible name for the per-case "resolve" control, reflecting current state. */
  public resolveCaseAriaLabel(c: ActiveCase): string {
    return this.canResolve(c)
      ? `Resolve ${c.alert.title}. Current status ${c.alert.status}.`
      : `${c.alert.title} is already Resolved.`;
  }

  public canOpenPatient(c: ActiveCase): boolean {
    return c.patientRouteId !== null;
  }

  public openPatient(c: ActiveCase): void {
    if (this.canOpenPatient(c)) {
      this.patientLinkFeedback = '';
      this.router.navigate(['/patients', c.patientRouteId]);
      return;
    }

    this.patientLinkFeedback = `Patient record ${c.alert.patientId} could not be found.`;
  }

  public setStatusFilter(statuses: AlertStatus[]): void {
    this.filter.set({ ...this.filter(), statuses });
  }

  public setPriorityFilter(priority: string | null): void {
    this.filter.set({ ...this.filter(), priority });
  }

  public toggleShowResolved(showResolved: boolean): void {
    this.filter.set({ ...this.filter(), showResolved });
  }

  public setSort(key: CaseSortKey, direction: CaseSortDirection): void {
    this.sortKey.set(key);
    this.sortDirection.set(direction);
  }

  public toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }
}
