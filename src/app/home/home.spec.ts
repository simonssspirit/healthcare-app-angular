import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HomeComponent } from './home';
import { AlertsService } from '../services/alerts.service';

describe('HomeComponent', () => {
  let alertsService: AlertsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    alertsService = TestBed.inject(AlertsService);
    alertsService.reset();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    return { fixture, component };
  }

  // PHASE-2 ------------------------------------------------------------

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should expose the alerts from AlertsService', () => {
    const { component } = createComponent();
    expect(component.dailyAlerts().length).toBe(alertsService.alerts().length);
  });

  it('should resolve selectedAlert from the selected id', () => {
    const { component } = createComponent();
    const firstAlert = component.dailyAlerts()[0];

    component.openAlertDialog(firstAlert);

    expect(component.selectedAlert()!.id).toBe(firstAlert.id);
    expect(component.alertDialogOpened).toBe(true);
  });

  it('should render the suggested next action in the dialog', async () => {
    const { fixture, component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openAlertDialog(alert1);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = document.querySelector('.suggested-next-action-text')!.textContent;
    expect(text).toContain(alert1.suggestedNextAction);
  });

  it('should hide the suggested next action section when the field is absent', () => {
    const { component } = createComponent();
    const alert = component.dailyAlerts()[0];

    expect(component.hasSuggestedNextAction({ ...alert, suggestedNextAction: undefined })).toBe(
      false,
    );
    expect(component.hasSuggestedNextAction({ ...alert, suggestedNextAction: '   ' })).toBe(false);
  });

  it('should move the selected alert to In Progress from the dialog', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openAlertDialog(alert1);
    component.startSelectedAlert();

    expect(component.selectedAlert()!.status).toBe('In Progress');
    expect(component.alertActionFeedback).toBeTruthy();
  });

  it('should resolve the selected alert from the dialog', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openAlertDialog(alert1);
    component.resolveSelectedAlert();

    expect(component.selectedAlert()!.status).toBe('Resolved');
    expect(component.alertActionFeedback).toBeTruthy();
  });

  it('should stay consistent when resolve is invoked twice', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openAlertDialog(alert1);

    expect(() => {
      component.resolveSelectedAlert();
      component.resolveSelectedAlert();
    }).not.toThrow();
    expect(component.selectedAlert()!.status).toBe('Resolved');
  });

  it('should not change status merely by opening the alert dialog', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openAlertDialog(alert1);

    expect(component.selectedAlert()!.status).toBe('Open');
  });

  it('should clear selection and feedback on close', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts()[0];

    component.openAlertDialog(alert1);
    component.resolveSelectedAlert();
    component.closeAlertDialog();

    expect(component.alertDialogOpened).toBe(false);
    expect(component.selectedAlert()).toBeNull();
    expect(component.alertActionFeedback).toBe('');
  });

  // PHASE-3 ------------------------------------------------------------

  it('should open the note dialog pre-associated with the alert patient', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openAlertDialog(alert1);
    component.openClinicalNoteDialogForAlert(alert1);

    expect(component.clinicalNoteDialogOpened).toBe(true);
    expect(component.alertNoteContext!.id).toBe(alert1.id);
    expect(component.selectedPatient.patientId).toBe(alert1.patientId);
    expect(component.alertDialogOpened).toBe(true);
  });

  it('should link a saved note to both patient and alert', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openClinicalNoteDialogForAlert(alert1);
    component.clinicalNoteText = 'Observed inflammation';
    component.saveClinicalNote();

    const notes = alertsService.getNotesForAlert(alert1.id);
    expect(notes.length).toBe(1);
    expect(notes[0].patientId).toBe(alert1.patientId);
    expect(notes[0].text).toBe('Observed inflammation');
  });

  it('should keep the alert dialog open and persist nothing when the note is cancelled', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openAlertDialog(alert1);
    component.openClinicalNoteDialogForAlert(alert1);
    component.clinicalNoteText = 'draft text';
    component.closeClinicalNoteDialog();

    expect(component.alertDialogOpened).toBe(true);
    expect(alertsService.notes().length).toBe(0);
    expect(component.clinicalNoteText).toBe('');
  });

  it('should block saving an empty note', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openClinicalNoteDialogForAlert(alert1);
    component.clinicalNoteText = '   ';
    component.saveClinicalNote();

    expect(component.clinicalNoteError).toBe('Note text is required.');
    expect(component.clinicalNoteDialogOpened).toBe(true);
    expect(alertsService.notes().length).toBe(0);
  });

  it('should not save twice on rapid double-click', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openClinicalNoteDialogForAlert(alert1);
    component.clinicalNoteText = 'Observed inflammation';
    component.saveClinicalNote();
    component.saveClinicalNote();

    expect(alertsService.notes().length).toBe(1);
  });

  it('should open the test dialog pre-associated with the alert patient and no preselected tests', () => {
    const { component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;

    component.openLabTestDialogForAlert(alert2);

    expect(component.labTestDialogOpened).toBe(true);
    expect(component.labTestPatient.patientId).toBe(alert2.patientId);
    expect(component.labTests.every((t) => !t.selected)).toBe(true);
  });

  it('should link a submitted test request to both patient and alert and surface feedback', () => {
    const { component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;

    component.openLabTestDialogForAlert(alert2);
    const firstTestName = component.labTests[0].name;
    component.toggleLabTest(component.labTests[0]);
    component.sendLabTestRequest();

    const requests = alertsService.getTestRequestsForAlert(alert2.id);
    expect(requests[0].testNames).toEqual([firstTestName]);
    expect(component.alertActionFeedback).toContain(alert2.patient);
  });

  it('should create no test request when cancelled', () => {
    const { component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;

    component.openAlertDialog(alert2);
    component.openLabTestDialogForAlert(alert2);
    component.toggleLabTest(component.labTests[0]);
    component.closeLabTestDialog();

    expect(alertsService.testRequests().length).toBe(0);
    expect(component.alertDialogOpened).toBe(true);
  });

  it('should block submitting with no tests selected', () => {
    const { component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;

    component.openLabTestDialogForAlert(alert2);
    component.sendLabTestRequest();

    expect(component.labTestError).toBe('Select at least one lab test.');
    expect(alertsService.testRequests().length).toBe(0);
  });

  it('should not leak a selected test into a later submission for a different alert', () => {
    const { component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;
    const alert3 = component.dailyAlerts().find((a) => a.id === 3)!;

    component.openLabTestDialogForAlert(alert2);
    component.toggleLabTest(component.labTests[0]);
    component.sendLabTestRequest();

    component.openLabTestDialogForAlert(alert3);

    expect(component.labTests.every((t) => !t.selected)).toBe(true);
  });

  it('should not leak a selected test into the generic Request Lab Test dialog after cancelling', () => {
    const { component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;

    component.openLabTestDialogForAlert(alert2);
    component.toggleLabTest(component.labTests[0]);
    component.closeLabTestDialog();

    component.openLabTestDialog();

    expect(component.labTestPatient).toBe(component.patients[0]);
    expect(component.labTests.every((t) => !t.selected)).toBe(true);
  });

  it('should disable the patient dropdown while a note is tied to an alert', async () => {
    const { fixture, component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openClinicalNoteDialogForAlert(alert1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dropdown = document.querySelector('.clinical-note-dialog kendo-dropdownlist');
    expect(dropdown?.getAttribute('aria-disabled')).toBe('true');
  });

  it('should not disable the patient dropdown for the generic Add Note quick action', async () => {
    const { fixture, component } = createComponent();

    component.openClinicalNoteDialog();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dropdown = document.querySelector('.clinical-note-dialog kendo-dropdownlist');
    expect(dropdown?.getAttribute('aria-disabled')).not.toBe('true');
  });

  it('should disable the patient dropdown while a test request is tied to an alert', async () => {
    const { fixture, component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;

    component.openLabTestDialogForAlert(alert2);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dropdown = document.querySelector('.lab-test-dialog kendo-dropdownlist');
    expect(dropdown?.getAttribute('aria-disabled')).toBe('true');
  });

  it('should associate actions with the correct alert when a patient has several alerts', () => {
    const { component } = createComponent();
    const alertA = component.dailyAlerts().find((a) => a.id === 1)!;
    const alertB = component.dailyAlerts().find((a) => a.id === 2)!;

    component.openClinicalNoteDialogForAlert(alertA);
    component.closeClinicalNoteDialog();

    component.openClinicalNoteDialogForAlert(alertB);
    component.clinicalNoteText = 'note for B';
    component.saveClinicalNote();

    expect(alertsService.getNotesForAlert(alertB.id).length).toBe(1);
    expect(alertsService.getNotesForAlert(alertA.id).length).toBe(0);
  });

  it('should not tag Quick Action notes with an alert', () => {
    const { component } = createComponent();
    const alert1 = component.dailyAlerts().find((a) => a.id === 1)!;

    component.openClinicalNoteDialogForAlert(alert1);
    component.closeClinicalNoteDialog();
    component.openClinicalNoteDialog();
    component.clinicalNoteText = 'quick action note';
    component.saveClinicalNote();

    expect(alertsService.notes().length).toBe(0);
  });

  it('should toggle a lab test exactly once per click', async () => {
    const { fixture, component } = createComponent();
    const alert2 = component.dailyAlerts().find((a) => a.id === 2)!;
    component.openLabTestDialogForAlert(alert2);
    fixture.detectChanges();
    await fixture.whenStable();

    const firstItem = document.querySelector('.lab-test-item') as HTMLElement;
    firstItem.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.labTests.filter((t) => t.selected).length).toBe(1);
  });

  // PHASE-4 ------------------------------------------------------------

  it('should render one open-button per alert', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.alert-open-button');
    expect(buttons.length).toBe(component.dailyAlerts().length);
  });

  it('should render four CTAs per alert row', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const ctas = fixture.nativeElement.querySelectorAll('.alert-item .alert-actions button');
    expect(ctas.length).toBe(component.dailyAlerts().length * 4);
  });

  it('should not nest interactive controls inside the open button', async () => {
    const { fixture } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const openButtons = fixture.nativeElement.querySelectorAll('.alert-open-button');
    openButtons.forEach((el: HTMLElement) => {
      expect(el.querySelectorAll('button, [role="button"], a[href], input').length).toBe(0);
    });
  });

  it('should not put role=button or tabindex on the alert row', async () => {
    const { fixture } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('.alert-item');
    rows.forEach((el: HTMLElement) => {
      expect(el.getAttribute('role')).toBeNull();
      expect(el.getAttribute('tabindex')).toBeNull();
    });
  });

  it('should give every CTA an aria-label', async () => {
    const { fixture } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const ctas = fixture.nativeElement.querySelectorAll('.alert-actions button');
    ctas.forEach((el: HTMLElement) => {
      expect(el.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('should open the alert dialog when the open button is clicked', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const firstButton = fixture.nativeElement.querySelector(
      '.alert-open-button',
    ) as HTMLButtonElement;
    firstButton.click();
    fixture.detectChanges();

    expect(component.alertDialogOpened).toBe(true);
  });

  it('should start an alert from the list CTA', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const startButton = fixture.nativeElement.querySelector(
      '.alert-item .alert-actions button',
    ) as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();

    expect(component.dailyAlerts()[0].status).toBe('In Progress');
  });

  it('should resolve an alert from the list CTA', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const resolveButton = fixture.nativeElement.querySelectorAll(
      '.alert-item .alert-actions button',
    )[1] as HTMLButtonElement;
    resolveButton.click();
    fixture.detectChanges();

    expect(component.dailyAlerts()[0].status).toBe('Resolved');
  });

  it('should render a status chip for every alert in the list', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const chips = fixture.nativeElement.querySelectorAll('.alert-item .alert-status-chip');
    expect(chips.length).toBe(component.dailyAlerts().length);
    expect(chips[0].textContent.trim()).toContain('Open');
  });

  it('should expose an aria-label on the list status chip matching its state', async () => {
    const { fixture } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const firstChip = fixture.nativeElement.querySelector('.alert-item .alert-status-chip');
    expect(firstChip.getAttribute('aria-label')).toBe('Case status: Open');
  });

  it('should update the list chip label as the case progresses', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.startAlertProgress(component.dailyAlerts()[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    let firstChip = fixture.nativeElement.querySelector('.alert-item .alert-status-chip');
    expect(firstChip.textContent.trim()).toContain('In Progress');

    component.resolveAlert(component.dailyAlerts()[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    firstChip = fixture.nativeElement.querySelector('.alert-item .alert-status-chip');
    expect(firstChip.textContent.trim()).toContain('Resolved');
  });

  it('should announce the case status in the open button aria-label for assistive tech', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.resolveAlert(component.dailyAlerts()[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    const firstOpenButton = fixture.nativeElement.querySelector(
      '.alert-open-button',
    ) as HTMLButtonElement;
    expect(firstOpenButton.getAttribute('aria-label')).toMatch(/^Resolved\. /);
  });

  it('should keep the resolved alert in the list', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    const lengthBefore = component.dailyAlerts().length;

    component.resolveAlert(component.dailyAlerts()[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.dailyAlerts().length).toBe(lengthBefore);
  });

  it('should disable both CTAs for an already resolved alert', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.resolveAlert(component.dailyAlerts()[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    const ctas = fixture.nativeElement.querySelectorAll(
      '.alert-item .alert-actions button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(ctas[0].disabled).toBe(true);
    expect(ctas[1].disabled).toBe(true);
  });

  it('should open the note dialog from the list CTA without opening the details dialog', async () => {
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const rowCtas = fixture.nativeElement.querySelectorAll(
      '.alert-item .alert-actions button',
    ) as NodeListOf<HTMLButtonElement>;
    rowCtas[2].click();
    fixture.detectChanges();

    expect(component.clinicalNoteDialogOpened).toBe(true);
    expect(component.alertDialogOpened).toBe(false);
  });
});
