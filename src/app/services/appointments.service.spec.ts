import { TestBed } from '@angular/core/testing';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return scheduler appointments', () => {
    const appointments = service.getSchedulerAppointments();

    expect(Array.isArray(appointments)).toBe(true);
    expect(appointments.length).toBeGreaterThan(0);
  });

  it('should return todays appointments as grid items', () => {
    const todayItems = service.getTodaysAppointments();

    expect(Array.isArray(todayItems)).toBe(true);

    if (todayItems.length > 0) {
      expect(todayItems[0]).toEqual(
        expect.objectContaining({
          time: expect.any(String),
          patientName: expect.any(String),
          reason: expect.any(String),
          status: expect.any(String),
          room: expect.any(String),
        }),
      );
    }
  });

  it('should append a new appointment and increase the signal length by one', () => {
    const lengthBefore = service.appointments().length;

    const created = service.addAppointment({
      title: 'Sophia Bennett',
      reason: 'Follow-up consultation',
      start: new Date(),
      end: new Date(),
      patientCode: 'P-104505',
      alertId: 1,
    });

    expect(service.appointments().length).toBe(lengthBefore + 1);
    expect(created).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        status: 'Upcoming',
        patientCode: 'P-104505',
        alertId: 1,
      }),
    );
  });

  it('should assign distinct ids to appointments created sequentially', () => {
    const first = service.addAppointment({
      title: 'Patient A',
      reason: 'Lab review',
      start: new Date(),
      end: new Date(),
    });
    const second = service.addAppointment({
      title: 'Patient B',
      reason: 'Lab review',
      start: new Date(),
      end: new Date(),
    });

    expect(first.id).not.toBe(second.id);
  });

  it('should surface a same-day appointment in getTodaysAppointments', () => {
    const today = new Date();
    const created = service.addAppointment({
      title: 'Today Patient',
      reason: 'Telehealth check-in',
      start: today,
      end: today,
    });

    const todayItems = service.getTodaysAppointments();

    expect(todayItems.some((item) => item.patientName === created.title)).toBe(true);
  });

  it('should not mutate the previous appointments array reference', () => {
    const before = service.appointments();

    service.addAppointment({
      title: 'Patient C',
      reason: 'Specialist referral',
      start: new Date(),
      end: new Date(),
    });

    expect(service.appointments()).not.toBe(before);
    expect(before.some((apt) => apt.title === 'Patient C')).toBe(false);
  });
});