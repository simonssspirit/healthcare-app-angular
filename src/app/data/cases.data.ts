import { ChipThemeColor } from '@progress/kendo-angular-buttons';
import {
  AlertFollowUpRecord,
  AlertNoteRecord,
  AlertStatus,
  AlertTestRequestRecord,
  DailyAlert,
} from './home.data';
import { PatientProfile } from './patients.data';
import { SchedulerAppointment } from './appointments.data';

/** View model for a single resolvable follow-up, projected for display. */
export interface CaseFollowUpView {
  id: string;
  appointmentId: number;
  type: string;
  /** `appointment.start` when resolvable, else `record.scheduledFor`. */
  scheduledFor: Date;
  overdue: boolean;
}

/**
 * Consolidated view of a `DailyAlert` ("case") with its joined patient, pending
 * actions, and next follow-up. Reference-only: never copies or re-derives
 * `DailyAlert` fields.
 */
export interface ActiveCase {
  alert: DailyAlert;
  /** `null` when `alert.patientId` has no matching `PatientProfile.patientCode`. */
  patient: PatientProfile | null;
  /** `patient?.id`, the only value used to navigate to `/patients/:id`. */
  patientRouteId: number | null;
  noteCount: number;
  testRequestCount: number;
  notes: AlertNoteRecord[];
  testRequests: AlertTestRequestRecord[];
  nextFollowUp: CaseFollowUpView | null;
  hasPendingActions: boolean;
  /** Minutes-since rank derived from `alert.time`; see `caseAgeRank`. */
  ageRank: number;
}

export type CaseSortKey = 'age' | 'priority';
export type CaseSortDirection = 'asc' | 'desc';

export interface CaseFilterState {
  /** Empty array means no status restriction. */
  statuses: AlertStatus[];
  /** `null` means all priorities. */
  priority: string | null;
  showResolved: boolean;
}

export const DEFAULT_CASE_FILTER: CaseFilterState = {
  statuses: [],
  priority: null,
  showResolved: false,
};

/** Lower rank sorts first. Unknown priorities sort last. */
export const CASE_PRIORITY_RANK: Readonly<Record<string, number>> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const UNKNOWN_PRIORITY_RANK = 99;

/** Statuses shown by default, before the "show resolved" toggle is enabled. */
export const ACTIVE_CASE_STATUSES: readonly AlertStatus[] = ['Open', 'In Progress'];

export const CASE_EMPTY_NO_CASES = 'No active cases. All patient cases are resolved.';
export const CASE_EMPTY_NO_MATCHES =
  'No cases match the selected filters. Adjust the status or priority filter to see more.';
export const CASE_NO_ACTIONS_LABEL = 'No actions taken yet';

/** Mirrors `HomeComponent.getAlertStatusColor`; the shared source for both views. */
export function getCaseStatusColor(status: AlertStatus): ChipThemeColor {
  const colorMap: Record<AlertStatus, ChipThemeColor> = {
    Open: 'info',
    'In Progress': 'warning',
    Resolved: 'success',
  };
  return colorMap[status];
}

export function getCasePriorityColor(priority: string): ChipThemeColor {
  const colorMap: Record<string, ChipThemeColor> = {
    High: 'error',
    Medium: 'warning',
    Low: 'info',
  };
  return colorMap[priority] ?? 'base';
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

const MINUTES_AGO_PATTERN = /^(\d+)\s*min(ute)?s?\s+ago$/i;
const HOURS_AGO_PATTERN = /^(\d+)\s*(hour|hr)s?\s+ago$/i;
const DAYS_AGO_PATTERN = /^(\d+)\s*days?\s+ago$/i;

/**
 * Parses `DailyAlert.time` (a display string, not a timestamp) into "minutes
 * since the case appeared". Unrecognised formats sort last and never throw.
 */
export function caseAgeRank(time: string): number {
  const value = time.trim();

  if (value.toLowerCase() === 'now') {
    return 0;
  }

  const minutesMatch = MINUTES_AGO_PATTERN.exec(value);
  if (minutesMatch) {
    return Number(minutesMatch[1]);
  }

  const hoursMatch = HOURS_AGO_PATTERN.exec(value);
  if (hoursMatch) {
    return Number(hoursMatch[1]) * MINUTES_PER_HOUR;
  }

  const daysMatch = DAYS_AGO_PATTERN.exec(value);
  if (daysMatch) {
    return Number(daysMatch[1]) * MINUTES_PER_DAY;
  }

  return Number.MAX_SAFE_INTEGER;
}

/** `true` iff `scheduledFor` is strictly before `now`. Invalid dates are never overdue. */
export function isFollowUpOverdue(scheduledFor: Date, now: Date): boolean {
  if (Number.isNaN(scheduledFor.getTime())) {
    return false;
  }
  return scheduledFor.getTime() < now.getTime();
}

function isAppointmentCancelled(appointment: SchedulerAppointment): boolean {
  return appointment.cancelled === true || appointment.status === 'Cancelled';
}

/**
 * Selects the single follow-up to surface for a case:
 * - prefers the soonest effective date in the future (>= now);
 * - falls back to the most recent past one, flagged overdue, so a lapsed
 *   follow-up stays visible instead of disappearing;
 * - drops follow-ups whose linked appointment was cancelled;
 * - returns `null` when nothing survives.
 */
export function selectNextFollowUp(
  followUps: AlertFollowUpRecord[],
  appointments: SchedulerAppointment[],
  now: Date,
): CaseFollowUpView | null {
  const candidates: { record: AlertFollowUpRecord; effectiveDate: Date }[] = [];

  for (const record of followUps) {
    const appointment = appointments.find((a) => a.id === record.appointmentId);

    if (appointment && isAppointmentCancelled(appointment)) {
      continue;
    }

    const effectiveDate = appointment ? appointment.start : record.scheduledFor;

    if (Number.isNaN(effectiveDate.getTime())) {
      continue;
    }

    candidates.push({ record, effectiveDate });
  }

  if (candidates.length === 0) {
    return null;
  }

  const future = candidates
    .filter((c) => c.effectiveDate.getTime() >= now.getTime())
    .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());

  if (future.length > 0) {
    const soonest = future[0];
    return {
      id: soonest.record.id,
      appointmentId: soonest.record.appointmentId,
      type: soonest.record.type,
      scheduledFor: soonest.effectiveDate,
      overdue: false,
    };
  }

  const past = candidates.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  const mostRecentPast = past[0];

  return {
    id: mostRecentPast.record.id,
    appointmentId: mostRecentPast.record.appointmentId,
    type: mostRecentPast.record.type,
    scheduledFor: mostRecentPast.effectiveDate,
    overdue: true,
  };
}

/** Returns a new, filtered array; `cases` is never mutated. */
export function filterCases(cases: ActiveCase[], filter: CaseFilterState): ActiveCase[] {
  return cases.filter((c) => {
    if (!filter.showResolved && !ACTIVE_CASE_STATUSES.includes(c.alert.status)) {
      return false;
    }

    if (filter.statuses.length > 0 && !filter.statuses.includes(c.alert.status)) {
      return false;
    }

    if (filter.priority !== null && c.alert.priority !== filter.priority) {
      return false;
    }

    return true;
  });
}

/** Returns a new, sorted array; `cases` is never mutated. */
export function sortCases(
  cases: ActiveCase[],
  key: CaseSortKey,
  dir: CaseSortDirection,
): ActiveCase[] {
  const directionFactor = dir === 'asc' ? 1 : -1;

  return [...cases].sort((a, b) => {
    if (key === 'age') {
      return (a.ageRank - b.ageRank) * directionFactor;
    }

    const rankA = CASE_PRIORITY_RANK[a.alert.priority] ?? UNKNOWN_PRIORITY_RANK;
    const rankB = CASE_PRIORITY_RANK[b.alert.priority] ?? UNKNOWN_PRIORITY_RANK;

    if (rankA !== rankB) {
      return (rankA - rankB) * directionFactor;
    }

    // Deterministic tie-break: always ascending by age, regardless of the
    // outer sort direction.
    return a.ageRank - b.ageRank;
  });
}
