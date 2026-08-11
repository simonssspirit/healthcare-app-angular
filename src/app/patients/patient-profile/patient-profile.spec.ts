import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PatientProfileComponent } from './patient-profile';

describe('PatientProfileComponent recommendations', () => {
  let fixture: ComponentFixture<PatientProfileComponent>;
  let component: PatientProfileComponent;
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: { navigate: ReturnType<typeof vi.fn> };

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

    fixture = TestBed.createComponent(PatientProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders one recommendation panel with exactly three patient-scoped actions', () => {
    const panel = fixture.nativeElement.querySelector('.recommendation-panel') as HTMLElement;
    const actions = panel.querySelectorAll('button');

    expect(panel).toBeTruthy();
    expect(actions).toHaveLength(3);
    expect(actions[0].textContent).toContain('Review vitals');
    expect(actions[1].textContent).toContain('Request lab');
    expect(actions[2].textContent).toContain('Schedule follow-up');
    expect(actions[0].getAttribute('aria-label')).toBe(`Review vitals for ${component.patient?.name}`);
    expect(actions[1].getAttribute('aria-label')).toBe(
      `Request lab tests for ${component.patient?.name}`,
    );
    expect(actions[2].getAttribute('aria-label')).toBe(
      `Schedule follow-up for ${component.patient?.name}`,
    );
  });

  it('scrolls to and focuses the Recent Vitals card', () => {
    const vitalsCard = fixture.nativeElement.querySelector('.vitals-card') as HTMLElement;
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    Object.defineProperty(vitalsCard, 'scrollIntoView', { value: scrollIntoView });
    Object.defineProperty(vitalsCard, 'focus', { value: focus });

    component.reviewVitals();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(focus).toHaveBeenCalledOnce();
  });

  it('opens a lab dialog scoped to the loaded patient and closes it on cancel or submit', () => {
    component.openLabTestDialog();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-lab-test-request-dialog')).toBeTruthy();
    expect(component.labRequestPatients).toEqual([
      {
        id: component.patient?.id,
        name: component.patient?.name,
        identifier: component.patient?.patientCode,
      },
    ]);

    component.closeLabTestDialog();
    expect(component.labTestDialogOpened).toBe(false);
    component.openLabTestDialog();
    component.handleLabTestRequest({ patientId: component.patient!.id, testIds: [2] });
    expect(component.labTestDialogOpened).toBe(false);
  });

  it('navigates to Schedule with only the active patient context', () => {
    component.scheduleFollowUp();

    expect(router.navigate).toHaveBeenCalledWith(['/schedule'], {
      queryParams: { intent: 'follow-up', patientId: component.patient!.id },
    });
  });

  it('replaces patient context and closes an open dialog when the route ID changes', () => {
    component.openLabTestDialog();
    routeParams.next(convertToParamMap({ id: '2' }));
    fixture.detectChanges();

    expect(component.labTestDialogOpened).toBe(false);
    expect(component.patient?.id).toBe(2);
    expect(component.labRequestPatients).toHaveLength(1);
    expect(component.labRequestPatients[0].id).toBe(2);
  });

  it('redirects invalid routes and renders no recommendation panel', () => {
    routeParams.next(convertToParamMap({ id: 'not-a-number' }));
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/patients']);
    expect(fixture.nativeElement.querySelector('.recommendation-panel')).toBeNull();
  });

  it('defines a three-column action grid that stacks at the 1000px breakpoint', () => {
    const styles = [...document.head.querySelectorAll('style')].map((style) => style.textContent);
    const recommendationStyles = styles.find((style) => style?.includes('.recommendation-actions'));

    expect(recommendationStyles).toMatch(
      /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(recommendationStyles).toMatch(
      /@media \(max-width:\s*1000px\)[\s\S]*?\.recommendation-actions[^{]*\{\s*grid-template-columns:\s*1fr/,
    );
  });
});
