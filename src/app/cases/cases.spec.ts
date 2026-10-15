import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { CasesComponent } from './cases';
import { AlertsService } from '../services/alerts.service';
import { DAILY_ALERTS } from '../data/home.data';
import { CASE_EMPTY_NO_CASES, CASE_EMPTY_NO_MATCHES } from '../data/cases.data';

describe('CasesComponent', () => {
  let alertsService: AlertsService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    alertsService = TestBed.inject(AlertsService);
    router = TestBed.inject(Router);
    alertsService.reset();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(CasesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, component };
  }

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should default to a list containing no Resolved case', () => {
    const { component } = createComponent();
    expect(component.visibleCases().some((c) => c.alert.status === 'Resolved')).toBe(false);
  });

  it('should set the page header title on init and clear it on destroy', () => {
    const { component, fixture } = createComponent();
    expect(component['pageHeaderService'].title()).toBe('Active Cases');

    fixture.destroy();

    expect(component['pageHeaderService'].title()).toBe('');
  });

  it('should narrow the list by status filter', () => {
    const { component } = createComponent();

    component.setStatusFilter(['Open']);

    expect(component.visibleCases().every((c) => c.alert.status === 'Open')).toBe(true);
  });

  it('should narrow the list by priority filter', () => {
    const { component } = createComponent();
    const priority = component.visibleCases()[0].alert.priority;

    component.setPriorityFilter(priority);

    expect(component.visibleCases().every((c) => c.alert.priority === priority)).toBe(true);
  });

  it('should reorder visibleCases when sortKey switches to age', () => {
    const { component } = createComponent();

    const priorityOrder = component.visibleCases().map((c) => c.alert.id);
    component.setSort('age', 'asc');
    const ageOrder = component.visibleCases().map((c) => c.alert.id);

    expect(ageOrder).not.toEqual(priorityOrder);
  });

  it('should show the "no matches" empty state when a filter excludes every case', () => {
    const { component } = createComponent();

    component.setPriorityFilter('no-such-priority');

    expect(component.emptyStateMessage()).toBe(CASE_EMPTY_NO_MATCHES);
  });

  it('should show the "no active cases" empty state once every case is resolved', () => {
    const { component } = createComponent();

    DAILY_ALERTS.forEach((alert) => alertsService.markResolved(alert.id));

    expect(component.emptyStateMessage()).toBe(CASE_EMPTY_NO_CASES);
  });

  it('should disable start and resolve controls for a resolved case', () => {
    const { component } = createComponent();
    const alert = DAILY_ALERTS[0];

    alertsService.markResolved(alert.id);
    component.toggleShowResolved(true);

    const resolvedCase = component.visibleCases().find((c) => c.alert.id === alert.id)!;

    expect(component.canStart(resolvedCase)).toBe(false);
    expect(component.canResolve(resolvedCase)).toBe(false);
  });

  it('should start a case from the list and keep it listed as In Progress', () => {
    const { component } = createComponent();
    const openCase = component.visibleCases().find((c) => c.alert.status === 'Open')!;

    component.startCase(openCase);

    const updated = component.visibleCases().find((c) => c.alert.id === openCase.alert.id)!;
    expect(updated.alert.status).toBe('In Progress');
  });

  it('should remove a resolved case from the default list and clear its selection', () => {
    const { component } = createComponent();
    const target = component.visibleCases()[0];

    component.selectCase(target);
    component.resolveCase(target);

    expect(component.visibleCases().some((c) => c.alert.id === target.alert.id)).toBe(false);
    expect(component.selectedCase()).toBeNull();
  });

  it('should navigate to /patients/:id using patientRouteId', () => {
    const { component } = createComponent();
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const target = component.visibleCases()[0];

    component.openPatient(target);

    expect(navigateSpy).toHaveBeenCalledWith(['/patients', target.patientRouteId]);
  });

  it('should not navigate and should set feedback for an unresolvable patient', () => {
    const { component } = createComponent();
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const target = component.visibleCases()[0];
    const unresolvable = { ...target, patientRouteId: null };

    component.openPatient(unresolvable);

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.canOpenPatient(unresolvable)).toBe(false);
    expect(component.patientLinkFeedback).toContain('could not be found');
  });
});
