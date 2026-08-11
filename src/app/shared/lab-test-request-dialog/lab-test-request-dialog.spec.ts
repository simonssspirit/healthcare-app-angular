import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LAB_TEST_OPTIONS, LabRequestPatient } from '../../data/lab-tests.data';
import { LabTestRequestDialogComponent } from './lab-test-request-dialog';

describe('LabTestRequestDialogComponent', () => {
  let fixture: ComponentFixture<LabTestRequestDialogComponent>;
  let component: LabTestRequestDialogComponent;
  const patients: readonly LabRequestPatient[] = [
    { id: 7, name: 'Ada Lovelace', identifier: 'P-007' },
    { id: 9, name: 'Grace Hopper', identifier: 'P-009' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabTestRequestDialogComponent],
      providers: [provideAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(LabTestRequestDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('patients', patients);
    fixture.componentRef.setInput('initialPatientId', 9);
  });

  it('selects the requested initial patient and the CMP default', () => {
    fixture.detectChanges();

    expect(component.selectedPatientId).toBe(9);
    expect([...component.selectedTestIds]).toEqual([2]);
  });

  it('falls back to the first patient for an unknown initial patient ID', () => {
    fixture.componentRef.setInput('initialPatientId', 999);
    fixture.detectChanges();

    expect(component.selectedPatientId).toBe(7);
  });

  it('rejects an empty patient collection', () => {
    fixture.componentRef.setInput('patients', []);

    expect(() => fixture.detectChanges()).toThrow(
      'LabTestRequestDialogComponent requires at least one patient',
    );
  });

  it('filters lab tests case-insensitively after trimming whitespace', () => {
    fixture.detectChanges();
    component.searchQuery = ' lipid ';

    expect(component.filteredLabTests.map((test) => test.name)).toEqual(['Lipid panel']);
  });

  it('toggles a test without mutating the immutable catalog', () => {
    fixture.detectChanges();
    const catalogSnapshot = LAB_TEST_OPTIONS.map((test) => ({ ...test }));

    component.toggleLabTest(4);
    expect(component.isTestSelected(4)).toBe(true);
    component.toggleLabTest(4);

    expect(component.isTestSelected(4)).toBe(false);
    expect(LAB_TEST_OPTIONS).toEqual(catalogSnapshot);
  });

  it('does not double-toggle a focused checkbox after its Space-key change event', () => {
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector(
      '#lab-test-4',
    ) as HTMLInputElement;

    checkbox.focus();
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    checkbox.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));

    expect(document.activeElement).toBe(checkbox);
    expect(component.isTestSelected(4)).toBe(true);
  });

  it('emits the selected patient and sorted test IDs when submitted', () => {
    fixture.detectChanges();
    const requestSubmitted = vi.fn();
    component.requestSubmitted.subscribe(requestSubmitted);
    component.toggleLabTest(4);
    component.toggleLabTest(1);

    component.submit();

    expect(requestSubmitted).toHaveBeenCalledWith({ patientId: 9, testIds: [1, 2, 4] });
  });

  it('disables submission when no lab tests are selected', async () => {
    fixture.detectChanges();
    component.toggleLabTest(2);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const submitButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Send request',
    ) as HTMLButtonElement;

    expect(submitButton.hasAttribute('disabled')).toBe(true);
  });
});
