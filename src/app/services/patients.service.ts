import { Injectable } from '@angular/core';
import { PATIENTS_DATA, Patient, PatientProfile } from '../data/patients.data';

@Injectable({
  providedIn: 'root',
})
export class PatientsService {
  private patientsData: PatientProfile[] = PATIENTS_DATA;

  /**
   * Get all patients (list view data)
   */
  public getAllPatients(): Patient[] {
    return this.patientsData.map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      status: patient.status,
      gender: patient.gender,
      bloodType: patient.bloodType,
      ward: patient.ward,
      diagnosis: patient.diagnosis,
      avatar: patient.avatar,
    }));
  }

  /**
   * Get full patient profile by ID
   */
  public getPatientById(id: number): PatientProfile | null {
    return this.patientsData.find((patient) => patient.id === id) || null;
  }

  /**
   * Resolves the shared alert↔patient identifier (`DailyAlert.patientId` ===
   * `PatientProfile.patientCode`). Single source of truth for this mapping.
   */
  public getPatientByCode(patientCode: string): PatientProfile | null {
    const code = patientCode.trim();
    return this.patientsData.find((patient) => patient.patientCode === code) || null;
  }

  /**
   * Update patient notes
   */
  public updatePatientNotes(id: number, notes: string): boolean {
    const patient = this.patientsData.find((p) => p.id === id);
    if (patient) {
      patient.notes = notes;
      return true;
    }
    return false;
  }
}
