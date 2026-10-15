import {
  ACTIVE_CASE_STATUSES,
  ActiveCase,
  CASE_PRIORITY_RANK,
  caseAgeRank,
  CaseFilterState,
  DEFAULT_CASE_FILTER,
  filterCases,
  isFollowUpOverdue,
  selectNextFollowUp,
  sortCases,
} from './cases.data';
import { AlertFollowUpRecord, DailyAlert } from './home.data';
import { SchedulerAppointment } from './appointments.data';

describe('caseAgeRank', () => {
  it('returns 0 for "Now" (case-insensitive)', () => {
    expect(caseAgeRank('Now')).toBe(0);
    expect(caseAgeRank('now')).toBe(0);
  });

  it('parses "N min ago" into minutes', () => {
    expect(caseAgeRank('2 min ago')).toBe(2);
  });

  it('parses "N hours ago" into minutes', () => {
    expect(caseAgeRank('3 hours ago')).toBe(180);
  });

  it('parses "N day ago" into minutes', () => {
    expect(caseAgeRank('1 day ago')).toBe(1440);
  });

  it('sorts unrecognised formats last without throwing', () => {
    expect(caseAgeRank('whenever')).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('isFollowUpOverdue', () => {
  const now = new Date('2024-06-01T12:00:00Z');

  it('returns true for a past date', () => {
    expect(isFollowUpOverdue(new Date('2024-05-01T12:00:00Z'), now)).toBe(true);
  });

  it('returns false for a future date', () => {
    expect(isFollowUpOverdue(new Date('2024-07-01T12:00:00Z'), now)).toBe(false);
  });

  it('returns false when exactly equal to now', () => {
    expect(isFollowUpOverdue(new Date(now.getTime()), now)).toBe(false);
  });

  it('returns false for an invalid date', () => {
    expect(isFollowUpOverdue(new Date('not-a-date'), now)).toBe(false);
  });
});

function makeFollowUp(overrides: Partial<AlertFollowUpRecord>): AlertFollowUpRecord {
  return {
    id: 'followup-1',
    alertId: 1,
    patientId: 'P-1',
    appointmentId: 1,
    type: 'Follow-up consultation',
    scheduledFor: new Date('2024-06-05T10:00:00Z'),
    createdAt: new Date('2024-06-01T00:00:00Z'),
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<SchedulerAppointment>): SchedulerAppointment {
  return {
    id: 1,
    title: 'Appt',
    reason: 'Follow-up',
    start: new Date('2024-06-05T10:00:00Z'),
    end: new Date('2024-06-05T11:00:00Z'),
    description: '',
    striped: false,
    cancelled: false,
    ...overrides,
  };
}

describe('selectNextFollowUp', () => {
  const now = new Date('2024-06-01T00:00:00Z');

  it('picks the soonest future follow-up, not the latest created', () => {
    const followUps = [
      makeFollowUp({ id: 'a', appointmentId: 1, scheduledFor: new Date('2024-06-20T00:00:00Z') }),
      makeFollowUp({ id: 'b', appointmentId: 2, scheduledFor: new Date('2024-06-10T00:00:00Z') }),
      makeFollowUp({ id: 'c', appointmentId: 3, scheduledFor: new Date('2024-06-15T00:00:00Z') }),
    ];
    const appointments = [
      makeAppointment({ id: 1, start: new Date('2024-06-20T00:00:00Z') }),
      makeAppointment({ id: 2, start: new Date('2024-06-10T00:00:00Z') }),
      makeAppointment({ id: 3, start: new Date('2024-06-15T00:00:00Z') }),
    ];

    const result = selectNextFollowUp(followUps, appointments, now);

    expect(result?.id).toBe('b');
    expect(result?.overdue).toBe(false);
  });

  it('returns the most recent past follow-up with overdue:true when all are past', () => {
    const followUps = [
      makeFollowUp({ id: 'a', appointmentId: 1, scheduledFor: new Date('2024-05-01T00:00:00Z') }),
      makeFollowUp({ id: 'b', appointmentId: 2, scheduledFor: new Date('2024-05-20T00:00:00Z') }),
    ];
    const appointments = [
      makeAppointment({ id: 1, start: new Date('2024-05-01T00:00:00Z') }),
      makeAppointment({ id: 2, start: new Date('2024-05-20T00:00:00Z') }),
    ];

    const result = selectNextFollowUp(followUps, appointments, now);

    expect(result?.id).toBe('b');
    expect(result?.overdue).toBe(true);
  });

  it('excludes a follow-up whose appointment is cancelled', () => {
    const followUps = [makeFollowUp({ appointmentId: 1 })];
    const appointments = [makeAppointment({ id: 1, cancelled: true })];

    expect(selectNextFollowUp(followUps, appointments, now)).toBeNull();
  });

  it('excludes a follow-up whose appointment status is Cancelled', () => {
    const followUps = [makeFollowUp({ appointmentId: 1 })];
    const appointments = [makeAppointment({ id: 1, status: 'Cancelled' })];

    expect(selectNextFollowUp(followUps, appointments, now)).toBeNull();
  });

  it("prefers the appointment's current start over the record's scheduledFor", () => {
    const followUps = [
      makeFollowUp({ appointmentId: 1, scheduledFor: new Date('2024-06-05T00:00:00Z') }),
    ];
    const appointments = [makeAppointment({ id: 1, start: new Date('2024-06-25T00:00:00Z') })];

    const result = selectNextFollowUp(followUps, appointments, now);

    expect(result?.scheduledFor).toEqual(new Date('2024-06-25T00:00:00Z'));
  });

  it('falls back to scheduledFor when appointmentId matches nothing', () => {
    const followUps = [
      makeFollowUp({ appointmentId: 999, scheduledFor: new Date('2024-06-05T00:00:00Z') }),
    ];

    const result = selectNextFollowUp(followUps, [], now);

    expect(result?.scheduledFor).toEqual(new Date('2024-06-05T00:00:00Z'));
    expect(result?.overdue).toBe(false);
  });

  it('returns null for an empty follow-up list', () => {
    expect(selectNextFollowUp([], [], now)).toBeNull();
  });
});

function makeAlert(overrides: Partial<DailyAlert>): DailyAlert {
  return {
    id: 1,
    title: 'Case',
    patient: 'Patient',
    patientId: 'P-1',
    time: 'Now',
    condition: 'Condition',
    value: '1',
    normalRange: '0-1',
    priority: 'Medium',
    details: 'Details',
    recommendations: [],
    status: 'Open',
    ...overrides,
  };
}

function makeCase(overrides: Partial<ActiveCase> & { alert: DailyAlert }): ActiveCase {
  return {
    patient: null,
    patientRouteId: null,
    noteCount: 0,
    testRequestCount: 0,
    notes: [],
    testRequests: [],
    nextFollowUp: null,
    hasPendingActions: false,
    ageRank: caseAgeRank(overrides.alert.time),
    ...overrides,
  };
}

describe('filterCases', () => {
  const cases: ActiveCase[] = [
    makeCase({ alert: makeAlert({ id: 1, status: 'Open', priority: 'High' }) }),
    makeCase({ alert: makeAlert({ id: 2, status: 'In Progress', priority: 'Medium' }) }),
    makeCase({ alert: makeAlert({ id: 3, status: 'Resolved', priority: 'Low' }) }),
  ];

  it('hides Resolved cases by default', () => {
    const result = filterCases(cases, DEFAULT_CASE_FILTER);
    expect(result.every((c) => ACTIVE_CASE_STATUSES.includes(c.alert.status))).toBe(true);
    expect(result.length).toBe(2);
  });

  it('includes Resolved cases when showResolved is true', () => {
    const filter: CaseFilterState = { ...DEFAULT_CASE_FILTER, showResolved: true };
    const result = filterCases(cases, filter);
    expect(result.length).toBe(3);
  });

  it('narrows by status filter', () => {
    const filter: CaseFilterState = { ...DEFAULT_CASE_FILTER, statuses: ['Open'] };
    const result = filterCases(cases, filter);
    expect(result.map((c) => c.alert.id)).toEqual([1]);
  });

  it('narrows by priority filter', () => {
    const filter: CaseFilterState = { ...DEFAULT_CASE_FILTER, priority: 'Medium' };
    const result = filterCases(cases, filter);
    expect(result.map((c) => c.alert.id)).toEqual([2]);
  });

  it('intersects combined filters', () => {
    const filter: CaseFilterState = {
      statuses: ['Open', 'In Progress'],
      priority: 'High',
      showResolved: false,
    };
    const result = filterCases(cases, filter);
    expect(result.map((c) => c.alert.id)).toEqual([1]);
  });

  it('does not mutate the input array', () => {
    const copy = [...cases];
    filterCases(cases, DEFAULT_CASE_FILTER);
    expect(cases).toEqual(copy);
  });
});

describe('sortCases', () => {
  const cases: ActiveCase[] = [
    makeCase({ alert: makeAlert({ id: 1, priority: 'Low', time: '1 min ago' }) }),
    makeCase({ alert: makeAlert({ id: 2, priority: 'High', time: '5 min ago' }) }),
    makeCase({ alert: makeAlert({ id: 3, priority: 'Medium', time: 'Now' }) }),
    makeCase({ alert: makeAlert({ id: 4, priority: 'Unknown', time: '2 min ago' }) }),
  ];

  it('sorts by age ascending (newest first)', () => {
    const result = sortCases(cases, 'age', 'asc');
    expect(result.map((c) => c.alert.id)).toEqual([3, 1, 4, 2]);
  });

  it('sorts by age descending', () => {
    const result = sortCases(cases, 'age', 'desc');
    expect(result.map((c) => c.alert.id)).toEqual([2, 4, 1, 3]);
  });

  it('sorts by priority High -> Medium -> Low, unknown last', () => {
    const result = sortCases(cases, 'priority', 'asc');
    expect(result.map((c) => c.alert.id)).toEqual([2, 3, 1, 4]);
    expect(CASE_PRIORITY_RANK['High']).toBeLessThan(CASE_PRIORITY_RANK['Medium']);
  });

  it('breaks priority ties by age ascending', () => {
    const tied: ActiveCase[] = [
      makeCase({ alert: makeAlert({ id: 10, priority: 'High', time: '10 min ago' }) }),
      makeCase({ alert: makeAlert({ id: 11, priority: 'High', time: '1 min ago' }) }),
    ];
    const result = sortCases(tied, 'priority', 'asc');
    expect(result.map((c) => c.alert.id)).toEqual([11, 10]);
  });

  it('does not mutate the input array', () => {
    const copy = [...cases];
    sortCases(cases, 'age', 'asc');
    expect(cases).toEqual(copy);
  });
});
