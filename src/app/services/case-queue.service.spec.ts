import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CaseQueueService } from './case-queue.service';
import { AlertsService } from './alerts.service';
import { AppointmentsService } from './appointments.service';
import { PatientsService } from './patients.service';
import { DAILY_ALERTS } from '../data/home.data';

describe('CaseQueueService', () => {
  let service: CaseQueueService;
  let alertsService: AlertsService;
  let appointmentsService: AppointmentsService;
  let patientsService: PatientsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaseQueueService);
    alertsService = TestBed.inject(AlertsService);
    appointmentsService = TestBed.inject(AppointmentsService);
    patientsService = TestBed.inject(PatientsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should aggregate every seeded alert with no pending actions or follow-up', () => {
    const cases = service.allCases();

    expect(cases.length).toBe(DAILY_ALERTS.length);
    expect(cases.every((c) => c.noteCount === 0)).toBe(true);
    expect(cases.every((c) => c.testRequestCount === 0)).toBe(true);
    expect(cases.every((c) => c.hasPendingActions === false)).toBe(true);
    expect(cases.every((c) => c.nextFollowUp === null)).toBe(true);
  });

  it('should resolve a patient and numeric route id for every seeded case', () => {
    const cases = service.allCases();

    expect(cases.every((c) => c.patient !== null)).toBe(true);
    expect(cases.every((c) => typeof c.patientRouteId === 'number')).toBe(true);
  });

  it('should gracefully fall back to null patient for an unresolvable patientId', () => {
    vi.spyOn(patientsService, 'getPatientByCode').mockReturnValue(null);

    expect(() => service.allCases()).not.toThrow();
    const cases = service.allCases();

    expect(cases.every((c) => c.patient === null)).toBe(true);
    expect(cases.every((c) => c.patientRouteId === null)).toBe(true);
  });

  it('should surface pending-action counts after a note and a test request are added', () => {
    const alert = DAILY_ALERTS[0];

    alertsService.addNote(alert.id, alert.patientId, 'Follow up tomorrow');
    alertsService.addTestRequest(alert.id, alert.patientId, ['Complete blood count (CBC)']);

    const found = service.allCases().find((c) => c.alert.id === alert.id)!;

    expect(found.noteCount).toBe(1);
    expect(found.testRequestCount).toBe(1);
    expect(found.hasPendingActions).toBe(true);
  });

  it('should surface a future follow-up as not overdue', () => {
    const alert = DAILY_ALERTS[0];
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const appointment = appointmentsService.addAppointment({
      title: alert.patient,
      reason: 'Follow-up consultation',
      start: future,
      end: future,
      patientCode: alert.patientId,
      alertId: alert.id,
    });
    alertsService.addFollowUp(alert.id, alert.patientId, appointment.id, 'Follow-up consultation', future);

    const found = service.allCases().find((c) => c.alert.id === alert.id)!;

    expect(found.nextFollowUp).not.toBeNull();
    expect(found.nextFollowUp!.scheduledFor).toEqual(future);
    expect(found.nextFollowUp!.overdue).toBe(false);
  });

  it('should surface a past-dated follow-up as overdue', () => {
    const alert = DAILY_ALERTS[1];
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

    const appointment = appointmentsService.addAppointment({
      title: alert.patient,
      reason: 'Lab review',
      start: past,
      end: past,
      patientCode: alert.patientId,
      alertId: alert.id,
    });
    alertsService.addFollowUp(alert.id, alert.patientId, appointment.id, 'Lab review', past);

    const found = service.allCases().find((c) => c.alert.id === alert.id)!;

    expect(found.nextFollowUp!.overdue).toBe(true);
  });

  it('should reactively drop a case from activeCases once it is resolved', () => {
    const alert = DAILY_ALERTS[0];
    const lengthBefore = service.activeCases().length;

    alertsService.markResolved(alert.id);

    expect(service.activeCases().length).toBe(lengthBefore - 1);
    expect(service.activeCases().some((c) => c.alert.id === alert.id)).toBe(false);
  });

  it('should guard legal transitions through canStart/canResolve', () => {
    const openAlert = DAILY_ALERTS[0];
    const inProgressAlert = DAILY_ALERTS[1];
    const resolvedAlert = DAILY_ALERTS[2];

    alertsService.startProgress(inProgressAlert.id);
    alertsService.markResolved(resolvedAlert.id);

    expect(service.canStart(alertsService.getAlert(openAlert.id)!)).toBe(true);
    expect(service.canStart(alertsService.getAlert(inProgressAlert.id)!)).toBe(false);
    expect(service.canStart(alertsService.getAlert(resolvedAlert.id)!)).toBe(false);

    expect(service.canResolve(alertsService.getAlert(openAlert.id)!)).toBe(true);
    expect(service.canResolve(alertsService.getAlert(inProgressAlert.id)!)).toBe(true);
    expect(service.canResolve(alertsService.getAlert(resolvedAlert.id)!)).toBe(false);
  });

  it('should delegate markInProgress to AlertsService and be a no-op on repeat calls', () => {
    const alert = DAILY_ALERTS[0];

    service.markInProgress(alertsService.getAlert(alert.id)!);
    expect(alertsService.getAlert(alert.id)!.status).toBe('In Progress');

    service.markInProgress(alertsService.getAlert(alert.id)!);
    expect(alertsService.getAlert(alert.id)!.status).toBe('In Progress');
  });

  it('should delegate markResolved to AlertsService', () => {
    const alert = DAILY_ALERTS[0];

    service.markResolved(alertsService.getAlert(alert.id)!);
    expect(alertsService.getAlert(alert.id)!.status).toBe('Resolved');
  });
});
