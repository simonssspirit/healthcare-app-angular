import { TestBed } from '@angular/core/testing';
import { AlertsService, isBlankText } from './alerts.service';
import { DAILY_ALERTS } from '../data/home.data';

describe('isBlankText', () => {
  it('should treat empty and whitespace-only strings as blank', () => {
    expect(isBlankText('')).toBe(true);
    expect(isBlankText('   ')).toBe(true);
  });

  it('should treat strings with visible characters as not blank', () => {
    expect(isBlankText('  note  ')).toBe(false);
  });
});

describe('AlertsService', () => {
  let service: AlertsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should seed every alert with status New', () => {
    expect(service.alerts().every((alert) => alert.status === 'New')).toBe(true);
    expect(service.alerts().length).toBe(DAILY_ALERTS.length);
  });

  it('should not mutate the DAILY_ALERTS source array', () => {
    service.markReviewed(1);

    expect(DAILY_ALERTS[0].status).toBe('New');
  });

  it('should mark an alert as reviewed', () => {
    service.markReviewed(1);

    expect(service.getAlert(1)!.status).toBe('Reviewed');
  });

  it('should be idempotent when marking the same alert twice', () => {
    service.markReviewed(1);
    const afterFirst = service.alerts();

    service.markReviewed(1);

    expect(service.alerts()).toBe(afterFirst);
    expect(service.getAlert(1)!.status).toBe('Reviewed');
  });

  it('should ignore an unknown alert id', () => {
    const lengthBefore = service.alerts().length;

    expect(() => service.markReviewed(9999)).not.toThrow();
    expect(service.alerts().length).toBe(lengthBefore);
  });

  it('should reject empty or whitespace note text', () => {
    const result = service.addNote(1, 'P-1', '   ');

    expect(result).toBeNull();
    expect(service.notes().length).toBe(0);
  });

  it('should store a trimmed note with alert and patient linkage', () => {
    const record = service.addNote(1, 'P-105328', '  obs  ');

    expect(record).toEqual(
      expect.objectContaining({ text: 'obs', alertId: 1, patientId: 'P-105328' }),
    );
    expect(service.getNotesForAlert(1).length).toBe(1);
  });

  it('should keep notes for different alerts separate', () => {
    service.addNote(1, 'P-105328', 'note for alert 1');
    service.addNote(2, 'P-104582', 'note for alert 2');

    expect(service.getNotesForAlert(1).length).toBe(1);
    expect(service.getNotesForAlert(2).length).toBe(1);
  });

  it('should reject a test request with no tests', () => {
    const result = service.addTestRequest(1, 'P-1', []);

    expect(result).toBeNull();
  });

  it('should store a test request with alert linkage', () => {
    const record = service.addTestRequest(2, 'P-104582', ['Lipid panel']);

    expect(record).toEqual(
      expect.objectContaining({
        alertId: 2,
        patientId: 'P-104582',
        testNames: ['Lipid panel'],
      }),
    );
    expect(service.getTestRequestsForAlert(2).length).toBe(1);
  });

  it('should reset all state', () => {
    service.markReviewed(1);
    service.addNote(1, 'P-105328', 'note');
    service.addTestRequest(2, 'P-104582', ['Lipid panel']);

    service.reset();

    expect(service.notes().length).toBe(0);
    expect(service.testRequests().length).toBe(0);
    expect(service.alerts().every((alert) => alert.status === 'New')).toBe(true);
  });
});
