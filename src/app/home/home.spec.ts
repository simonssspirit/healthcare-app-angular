import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HomeComponent } from './home';
import { LabTestRequestDialogComponent } from '../shared/lab-test-request-dialog/lab-test-request-dialog';
import { DAILY_ALERTS } from '../data/home.data';

describe('HomeComponent lab test workflow', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideAnimations(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getDialog(): LabTestRequestDialogComponent {
    return fixture.debugElement.query(By.directive(LabTestRequestDialogComponent)).componentInstance;
  }

  function openDialog(): void {
    const action = fixture.nativeElement.querySelector(
      'button[aria-label="Request lab test"]',
    ) as HTMLButtonElement;
    action.click();
    fixture.detectChanges();
  }

  it('renders the shared lab dialog from the existing Request lab test action', () => {
    openDialog();

    expect(getDialog()).toBeTruthy();
    expect(getDialog().patients()).toEqual(component.labRequestPatients);
  });

  it('removes the shared dialog when cancelled', () => {
    openDialog();

    getDialog().cancelled.emit();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(LabTestRequestDialogComponent))).toBeNull();
  });

  it('removes the shared dialog after a request is submitted', () => {
    openDialog();

    getDialog().requestSubmitted.emit({ patientId: component.labTestPatientId, testIds: [2] });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(LabTestRequestDialogComponent))).toBeNull();
  });
});

describe('HomeComponent alert status lifecycle', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideAnimations(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults every alert to Open and isolates state from the shared mock data', () => {
    expect(component.dailyAlerts.length).toBeGreaterThan(0);
    expect(component.dailyAlerts.every((alert) => alert.status === 'Open')).toBe(true);
    expect(component.dailyAlerts[0]).not.toBe(DAILY_ALERTS[0]);
  });

  it('renders a status label for each alert in the list', () => {
    const labels = fixture.nativeElement.querySelectorAll('.alert-status-chip__label');
    expect(labels.length).toBe(component.dailyAlerts.length);
    expect(labels[0].textContent.trim()).toBe('Open');
  });

  it('transitions an alert to In Progress and then Resolved', () => {
    const alert = component.dailyAlerts[0];

    component.setAlertStatus(alert, 'In Progress');
    expect(alert.status).toBe('In Progress');

    component.setAlertStatus(alert, 'Resolved');
    expect(alert.status).toBe('Resolved');
  });

  it('keeps the dialog and the list in sync because they share one object', () => {
    const alert = component.dailyAlerts[0];
    component.openAlertDialog(alert);

    component.setAlertStatus(component.selectedAlert!, 'Resolved');

    expect(alert.status).toBe('Resolved');
    expect(component.selectedAlert).toBe(alert);
  });

  it('allows a mistaken status to be corrected back to Open', () => {
    const alert = component.dailyAlerts[0];

    component.setAlertStatus(alert, 'Resolved');
    component.setAlertStatus(alert, 'Open');

    expect(alert.status).toBe('Open');
  });

  it('ignores a repeated transition to the same status', () => {
    const alert = component.dailyAlerts[0];

    component.setAlertStatus(alert, 'Resolved');
    component.statusAnnouncement = '';
    component.setAlertStatus(alert, 'Resolved');

    expect(component.statusAnnouncement).toBe('');
  });

  it('moves resolved alerts to the end of the displayed list', () => {
    const first = component.dailyAlerts[0];
    component.setAlertStatus(first, 'Resolved');

    const displayed = component.displayedAlerts;
    expect(displayed[displayed.length - 1]).toBe(first);
    expect(displayed.length).toBe(component.dailyAlerts.length);
  });

  it('keeps resolved alerts reachable in the DOM and shows the all-clear message', () => {
    const total = component.dailyAlerts.length;

    for (let i = 0; i < total; i++) {
      const item = fixture.nativeElement.querySelector('.alert-item') as HTMLElement;
      item.click();
      fixture.detectChanges();

      const resolveButton = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find(
        (button) => (button as HTMLButtonElement).textContent?.trim() === 'Mark Resolved',
      ) as HTMLButtonElement;
      resolveButton.click();
      fixture.detectChanges();

      const closeButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (button) => (button as HTMLButtonElement).textContent?.trim() === 'Close',
      ) as HTMLButtonElement;
      closeButton.click();
      fixture.detectChanges();
    }

    expect(fixture.nativeElement.querySelectorAll('.alert-item').length).toBe(total);
    expect(fixture.nativeElement.querySelector('.alerts-all-clear').textContent).toContain(
      'All clear',
    );
  });

  it('shows an explicit message when there are no alerts', () => {
    const emptyFixture = TestBed.createComponent(HomeComponent);
    emptyFixture.componentInstance.dailyAlerts = [];
    emptyFixture.detectChanges();

    expect(emptyFixture.nativeElement.querySelector('.alerts-all-clear').textContent).toContain(
      'No alerts for today',
    );
  });
});
