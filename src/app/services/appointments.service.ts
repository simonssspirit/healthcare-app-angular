import { Injectable, signal } from '@angular/core';
import { getAppointmentsData, SchedulerAppointment, GridAppointment } from '../data/appointments.data';

export type { SchedulerAppointment, GridAppointment };

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private readonly appointmentsSignal = signal<SchedulerAppointment[]>(getAppointmentsData());

  public readonly appointments = this.appointmentsSignal.asReadonly();

  // Public method to get all scheduler appointments
  public getSchedulerAppointments(): SchedulerAppointment[] {
    return this.appointmentsSignal();
  }

  // Get today's appointments for the grid
  public getTodaysAppointments(): GridAppointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter today's appointments from the signal
    const schedulerAppointments = this.appointmentsSignal().filter((apt) => {
      const aptDate = new Date(apt.start);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    });

    return schedulerAppointments.map((apt) => {
      // Use hardcoded status from mock data, or default to 'Upcoming'
      const status = apt.status || (apt.cancelled ? 'Cancelled' : 'Upcoming');

      return {
        time: this.formatTime(apt.start),
        patientName: apt.title,
        reason: apt.reason,
        status,
        room: apt.description,
      };
    });
  }

  /** Appends an appointment immutably and returns the created record. */
  public addAppointment(input: {
    title: string;
    reason: string;
    start: Date;
    end: Date;
    description?: string;
    patientCode?: string;
    alertId?: number;
  }): SchedulerAppointment {
    const current = this.appointmentsSignal();
    const appointment: SchedulerAppointment = {
      id: current.reduce((max, apt) => Math.max(max, apt.id), 0) + 1,
      title: input.title,
      reason: input.reason,
      start: input.start,
      end: input.end,
      description: input.description ?? '',
      striped: false,
      cancelled: false,
      status: 'Upcoming',
      patientCode: input.patientCode,
      alertId: input.alertId,
    };

    this.appointmentsSignal.set([...current, appointment]);

    return appointment;
  }

  // Helper method
  private formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${hours.toString().padStart(2, '0')}:${minutesStr} ${ampm}`;
  }
}
