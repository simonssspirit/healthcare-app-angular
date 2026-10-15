import { Injectable, Signal, computed, inject } from '@angular/core';
import { DailyAlert, canTransitionAlertStatus } from '../data/home.data';
import { ActiveCase, ACTIVE_CASE_STATUSES, caseAgeRank, selectNextFollowUp } from '../data/cases.data';
import { AlertsService } from './alerts.service';
import { AppointmentsService } from './appointments.service';
import { PatientsService } from './patients.service';

/**
 * Derives the Active Cases queue from existing read-only signals
 * (`AlertsService`, `PatientsService`, `AppointmentsService`). Owns no state
 * of its own and introduces no new data source — it only joins and projects.
 */
@Injectable({ providedIn: 'root' })
export class CaseQueueService {
  private readonly alertsService = inject(AlertsService);
  private readonly patientsService = inject(PatientsService);
  private readonly appointmentsService = inject(AppointmentsService);

  public readonly allCases: Signal<ActiveCase[]> = computed(() => this.buildCases());

  public readonly activeCases: Signal<ActiveCase[]> = computed(() =>
    this.allCases().filter((c) => ACTIVE_CASE_STATUSES.includes(c.alert.status)),
  );

  /** Distinct priorities present in the live case set, so unseen values never become invisible. */
  public readonly availablePriorities: Signal<string[]> = computed(() => {
    const priorities = new Set(this.allCases().map((c) => c.alert.priority));
    return Array.from(priorities);
  });

  public canStart(alert: DailyAlert): boolean {
    return canTransitionAlertStatus(alert.status, 'In Progress');
  }

  public canResolve(alert: DailyAlert): boolean {
    return canTransitionAlertStatus(alert.status, 'Resolved');
  }

  public markInProgress(alert: DailyAlert): void {
    if (this.canStart(alert)) {
      this.alertsService.startProgress(alert.id);
    }
  }

  public markResolved(alert: DailyAlert): void {
    if (this.canResolve(alert)) {
      this.alertsService.markResolved(alert.id);
    }
  }

  private buildCases(): ActiveCase[] {
    const alerts = this.alertsService.alerts();
    const notes = this.alertsService.notes();
    const testRequests = this.alertsService.testRequests();
    const followUps = this.alertsService.followUps();
    const appointments = this.appointmentsService.appointments();
    const now = new Date();

    const notesByAlertId = groupBy(notes, (n) => n.alertId);
    const testRequestsByAlertId = groupBy(testRequests, (t) => t.alertId);
    const followUpsByAlertId = groupBy(followUps, (f) => f.alertId);

    return alerts.map((alert) => {
      const patient = this.patientsService.getPatientByCode(alert.patientId);
      const alertNotes = notesByAlertId.get(alert.id) ?? [];
      const alertTestRequests = testRequestsByAlertId.get(alert.id) ?? [];
      const alertFollowUps = followUpsByAlertId.get(alert.id) ?? [];

      return {
        alert,
        patient,
        patientRouteId: patient?.id ?? null,
        noteCount: alertNotes.length,
        testRequestCount: alertTestRequests.length,
        notes: alertNotes,
        testRequests: alertTestRequests,
        nextFollowUp: selectNextFollowUp(alertFollowUps, appointments, now),
        hasPendingActions: alertNotes.length + alertTestRequests.length > 0,
        ageRank: caseAgeRank(alert.time),
      };
    });
  }
}

function groupBy<T, K>(items: T[], keyOf: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}
