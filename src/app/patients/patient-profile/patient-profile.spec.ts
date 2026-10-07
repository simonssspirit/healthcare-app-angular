import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { PATIENTS_DATA } from '../../data/patients.data';
import { PatientsService } from '../../services/patients.service';
import { PatientProfileComponent } from './patient-profile';

describe('PatientProfileComponent clinical notes', () => {
  let fixture: ComponentFixture<PatientProfileComponent>;
  let component: PatientProfileComponent;
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let patientsService: PatientsService;

  // PatientsService mutates the module-level PATIENTS_DATA array, which is
  // shared across tests/files. Snapshot the originals once so every test
  // can restore them afterwards and avoid cross-test pollution.
  const originalPatient1Notes = PATIENTS_DATA.find((p) => p.id === 1)!.notes;
  const originalPatient2Notes = PATIENTS_DATA.find((p) => p.id === 2)!.notes;

  beforeEach(async () => {
    routeParams = new BehaviorSubject(convertToParamMap({ id: '1' }));
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PatientProfileComponent],
      providers: [
        provideAnimations(),
        { provide: ActivatedRoute, useValue: { paramMap: routeParams } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    patientsService = TestBed.inject(PatientsService);
    fixture = TestBed.createComponent(PatientProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore shared fixture data so later tests see a clean baseline.
    patientsService.updatePatientNotes(1, originalPatient1Notes);
    patientsService.updatePatientNotes(2, originalPatient2Notes);
  });

  const statusEl = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('[data-testid="note-save-status"]');

  it('pre-populates the editor with the patient existing notes (AC-001)', () => {
    const patient = patientsService.getPatientById(1);

    expect(component.noteDraft).toBe(patient?.notes);
    expect(fixture.nativeElement.querySelector('kendo-editor')).toBeTruthy();
  });

  it('persists the edited content, not the original value (AC-002)', () => {
    const spy = vi.spyOn(patientsService, 'updatePatientNotes');
    component.noteDraft = '<p>Updated clinical note</p>';

    component.saveNotes();

    expect(spy).toHaveBeenCalledWith(1, '<p>Updated clinical note</p>');
  });

  it('reflects the saved note after re-loading the same patient (AC-003)', async () => {
    component.noteDraft = '<p>Updated clinical note</p>';
    component.saveNotes();

    expect(patientsService.getPatientById(1)?.notes).toBe('<p>Updated clinical note</p>');

    routeParams.next(convertToParamMap({ id: '1' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.noteDraft).toBe('<p>Updated clinical note</p>');
  });

  it('shows an auto-dismissing success confirmation (AC-004)', async () => {
    vi.useFakeTimers();

    component.saveNotes();
    fixture.detectChanges();

    expect(statusEl()?.textContent).toContain('Patient note saved.');
    expect(statusEl()?.getAttribute('role')).toBe('status');
    expect(statusEl()?.querySelector('kendo-svgicon')).toBeTruthy();

    await vi.advanceTimersByTimeAsync(4000);
    fixture.detectChanges();

    expect(statusEl()).toBeNull();
  });

  it('shows an error and preserves the stored note when the save fails (AC-005)', () => {
    vi.spyOn(patientsService, 'updatePatientNotes').mockReturnValue(false);
    const stored = component.patient?.notes;

    component.noteDraft = '<p>Lost edit</p>';
    component.saveNotes();
    fixture.detectChanges();

    expect(statusEl()?.getAttribute('role')).toBe('alert');
    expect(statusEl()?.textContent).toContain('could not be saved');
    expect(component.patient?.notes).toBe(stored);
  });

  it('keeps a single notification across rapid repeated saves (AC-006)', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(patientsService, 'updatePatientNotes');

    component.noteDraft = 'A';
    component.saveNotes();
    component.noteDraft = 'B';
    component.saveNotes();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="note-save-status"]')).toHaveLength(
      1,
    );
    expect(spy).toHaveBeenLastCalledWith(1, 'B');
    expect(patientsService.getPatientById(1)?.notes).toBe('B');
  });

  it('treats an empty note as a valid save (AC-007)', () => {
    const spy = vi.spyOn(patientsService, 'updatePatientNotes');

    component.noteDraft = '';
    component.saveNotes();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(1, '');
    expect(statusEl()?.getAttribute('role')).toBe('status');
  });

  it("loads the new patient's notes when the route id changes (AC-008)", async () => {
    component.noteDraft = '<p>Unsaved for patient 1</p>';

    routeParams.next(convertToParamMap({ id: '2' }));
    fixture.detectChanges();
    await fixture.whenStable();

    const patientTwo = patientsService.getPatientById(2);

    expect(component.noteDraft).toBe(patientTwo?.notes);
    expect(component.noteDraft).not.toContain('Unsaved for patient 1');
  });

  it('clears a pending status timer on destroy (no leaked timer)', () => {
    vi.useFakeTimers();

    component.saveNotes();
    fixture.destroy();

    expect(() => vi.runAllTimers()).not.toThrow();
  });

  it('does not save when no patient is loaded', () => {
    const spy = vi.spyOn(patientsService, 'updatePatientNotes');
    component.patient = null;

    component.saveNotes();

    expect(spy).not.toHaveBeenCalled();
  });

  it('ignores re-entrant save attempts while a save is already in progress', () => {
    const spy = vi.spyOn(patientsService, 'updatePatientNotes');
    component.isSavingNote = true;

    component.saveNotes();

    expect(spy).not.toHaveBeenCalled();
  });
});
