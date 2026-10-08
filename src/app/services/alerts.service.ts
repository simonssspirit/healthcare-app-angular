import { Injectable, signal } from '@angular/core';
import { guid } from '@progress/kendo-angular-common';
import {
  AlertNoteRecord,
  AlertStatus,
  AlertTestRequestRecord,
  DAILY_ALERTS,
  DailyAlert,
  canTransitionAlertStatus,
} from '../data/home.data';

/** Single source of truth for the "blank text" rule shared by callers and this service. */
export function isBlankText(text: string): boolean {
  return text.trim().length === 0;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly alertsSignal = signal<DailyAlert[]>(this.seedAlerts());
  private readonly noteRecordsSignal = signal<AlertNoteRecord[]>([]);
  private readonly testRequestRecordsSignal = signal<AlertTestRequestRecord[]>([]);

  public readonly alerts = this.alertsSignal.asReadonly();
  public readonly notes = this.noteRecordsSignal.asReadonly();
  public readonly testRequests = this.testRequestRecordsSignal.asReadonly();

  public getAlert(alertId: number): DailyAlert | undefined {
    return this.alertsSignal().find((alert) => alert.id === alertId);
  }

  /** Moves an Open case to In Progress. No-op for any other current state. */
  public startProgress(alertId: number): void {
    this.transitionTo(alertId, 'In Progress');
  }

  /** Moves an Open or In Progress case to Resolved. No-op once already Resolved. */
  public markResolved(alertId: number): void {
    this.transitionTo(alertId, 'Resolved');
  }

  /**
   * Applies a case-state transition if, and only if, it is legal for the
   * alert's current state. Unknown ids and illegal transitions are silent
   * no-ops that leave the alerts signal reference untouched.
   */
  private transitionTo(alertId: number, next: AlertStatus): void {
    const current = this.alertsSignal();
    const target = current.find((alert) => alert.id === alertId);

    if (!target || !canTransitionAlertStatus(target.status, next)) {
      return;
    }

    this.alertsSignal.set(
      current.map((alert) => (alert.id === alertId ? { ...alert, status: next } : alert)),
    );
  }

  public addNote(alertId: number, patientId: string, text: string): AlertNoteRecord | null {
    if (isBlankText(text)) {
      return null;
    }

    const record: AlertNoteRecord = {
      id: guid(),
      alertId,
      patientId,
      text: text.trim(),
      createdAt: new Date(),
    };

    this.noteRecordsSignal.set([...this.noteRecordsSignal(), record]);

    return record;
  }

  public addTestRequest(
    alertId: number,
    patientId: string,
    testNames: string[],
  ): AlertTestRequestRecord | null {
    if (testNames.length === 0) {
      return null;
    }

    const record: AlertTestRequestRecord = {
      id: guid(),
      alertId,
      patientId,
      testNames: [...testNames],
      createdAt: new Date(),
    };

    this.testRequestRecordsSignal.set([...this.testRequestRecordsSignal(), record]);

    return record;
  }

  public getNotesForAlert(alertId: number): AlertNoteRecord[] {
    return this.noteRecordsSignal().filter((note) => note.alertId === alertId);
  }

  public getTestRequestsForAlert(alertId: number): AlertTestRequestRecord[] {
    return this.testRequestRecordsSignal().filter((request) => request.alertId === alertId);
  }

  public reset(): void {
    this.alertsSignal.set(this.seedAlerts());
    this.noteRecordsSignal.set([]);
    this.testRequestRecordsSignal.set([]);
  }

  private seedAlerts(): DailyAlert[] {
    return DAILY_ALERTS.map((alert) => ({ ...alert }));
  }
}
