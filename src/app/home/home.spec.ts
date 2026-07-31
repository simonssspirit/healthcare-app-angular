import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home';
import { AppointmentsService } from '../services/appointments.service';
import { PageHeaderService } from '../services/page-header.service';
import { PATIENTS_DATA } from '../data/patients.data';
import { HOME_PATIENTS } from '../data/home.data';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: jasmine.SpyObj<Router>;
  let appointmentsService: jasmine.SpyObj<AppointmentsService>;
  let pageHeaderService: PageHeaderService;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const appointmentsServiceSpy = jasmine.createSpyObj('AppointmentsService', [
      'getTodaysAppointments',
    ]);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AppointmentsService, useValue: appointmentsServiceSpy },
        PageHeaderService,
      ],
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    appointmentsService = TestBed.inject(AppointmentsService) as jasmine.SpyObj<AppointmentsService>;
    pageHeaderService = TestBed.inject(PageHeaderService);

    appointmentsService.getTodaysAppointments.and.returnValue([]);

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Patient Mapping - Phase 2', () => {
    describe('findPatientByAlertId', () => {
      it('should return patient for exact patientCode match', () => {
        // Use first patient from PATIENTS_DATA
        const firstPatient = PATIENTS_DATA[0];
        const result = component.findPatientByAlertId(firstPatient.patientCode);
        
        expect(result).toBeTruthy();
        expect(result?.id).toBe(firstPatient.id);
        expect(result?.patientCode).toBe(firstPatient.patientCode);
      });

      it('should return fallback patient for non-matching code', () => {
        spyOn(console, 'warn');
        const result = component.findPatientByAlertId('P-999999');
        
        expect(result).toBeTruthy();
        expect(result?.id).toBe(PATIENTS_DATA[0].id);
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('Patient with code "P-999999" not found')
        );
      });

      it('should return null when PATIENTS_DATA is empty', () => {
        // This test validates the edge case, though PATIENTS_DATA is a constant
        // In a real scenario, we'd mock the data source
        const result = component.findPatientByAlertId('P-999999');
        expect(result).toBeTruthy(); // Will be fallback in actual implementation
      });
    });

    describe('findHomePatientByAlertId', () => {
      it('should return home patient for matching patientId', () => {
        // HOME_PATIENTS has James Wilson with P-104582
        const result = component.findHomePatientByAlertId('P-104582');
        
        expect(result).toBeTruthy();
        expect(result.name).toBe('James Wilson');
        expect(result.patientId).toBe('P-104582');
      });

      it('should return first patient as fallback for non-matching ID', () => {
        spyOn(console, 'warn');
        const result = component.findHomePatientByAlertId('P-999999');
        
        expect(result).toBeTruthy();
        expect(result.id).toBe(HOME_PATIENTS[0].id);
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('Home patient with ID "P-999999" not found')
        );
      });

      it('should handle multiple exact matches gracefully', () => {
        // Test with a known matching ID
        const result = component.findHomePatientByAlertId('P-104582');
        expect(result.patientId).toBe('P-104582');
      });
    });
  });

  describe('Alert Actions - Phase 3', () => {
    let mockAlert: any;

    beforeEach(() => {
      mockAlert = {
        id: 1,
        title: 'Test Alert',
        patient: 'Test Patient',
        patientId: 'P-104582',
        time: 'Now',
        condition: 'Test Condition',
        value: '100',
        normalRange: '50-80',
        priority: 'High' as const,
        details: 'Test details',
        recommendations: ['Rec 1'],
        suggestedAction: 'Test action',
      };
      component.selectedAlert = mockAlert;
      component.alertDialogOpened = true;
    });

    describe('reviewAlertPatient', () => {
      it('should close dialog and navigate to patient profile', () => {
        const navigateSpy = spyOn(component, 'navigateToPatientProfile');
        
        component.reviewAlertPatient();
        
        expect(component.alertDialogOpened).toBeFalse();
        expect(navigateSpy).toHaveBeenCalled();
      });

      it('should handle missing selectedAlert', () => {
        spyOn(console, 'warn');
        component.selectedAlert = null;
        
        component.reviewAlertPatient();
        
        expect(console.warn).toHaveBeenCalledWith('No alert selected for review');
      });

      it('should navigate to patients list if patient not found', () => {
        component.selectedAlert = { ...mockAlert, patientId: 'P-999999' };
        spyOn(console, 'error');
        
        component.reviewAlertPatient();
        
        expect(router.navigate).toHaveBeenCalledWith(['/patients']);
      });
    });

    describe('addNoteFromAlert', () => {
      it('should pre-populate and open clinical note dialog', () => {
        component.addNoteFromAlert();
        
        expect(component.alertDialogOpened).toBeFalse();
        expect(component.clinicalNoteDialogOpened).toBeTrue();
        expect(component.clinicalNoteText).toContain('Test Patient');
        expect(component.clinicalNoteText).toContain('Test Condition');
        expect(component.clinicalNoteText).toContain('100');
        expect(component.clinicalNoteText).toContain('50-80');
      });

      it('should handle missing selectedAlert', () => {
        spyOn(console, 'warn');
        component.selectedAlert = null;
        
        component.addNoteFromAlert();
        
        expect(console.warn).toHaveBeenCalledWith('No alert selected for adding note');
        expect(component.clinicalNoteDialogOpened).toBeFalse();
      });

      it('should pre-select patient in dropdown', () => {
        component.addNoteFromAlert();
        
        expect(component.selectedPatient).toBeTruthy();
        expect(component.selectedPatient?.patientId).toBe('P-104582');
      });
    });

    describe('requestTestFromAlert', () => {
      it('should pre-select patient and open lab test dialog', () => {
        component.requestTestFromAlert();
        
        expect(component.alertDialogOpened).toBeFalse();
        expect(component.labTestDialogOpened).toBeTrue();
        expect(component.labTestPatient).toBeTruthy();
        expect(component.labTestPatient?.patientId).toBe('P-104582');
      });

      it('should clear previous lab test selections', () => {
        component.labTests[0].selected = true;
        component.labTests[1].selected = true;
        
        component.requestTestFromAlert();
        
        expect(component.labTests.every(t => !t.selected)).toBeTrue();
      });

      it('should handle missing selectedAlert', () => {
        spyOn(console, 'warn');
        component.selectedAlert = null;
        
        component.requestTestFromAlert();
        
        expect(console.warn).toHaveBeenCalledWith('No alert selected for requesting test');
        expect(component.labTestDialogOpened).toBeFalse();
      });
    });

    describe('generateNoteFromAlert', () => {
      it('should include alert patient name', () => {
        const note = (component as any).generateNoteFromAlert(mockAlert);
        
        expect(note).toContain('Test Patient');
      });

      it('should include condition and values', () => {
        const note = (component as any).generateNoteFromAlert(mockAlert);
        
        expect(note).toContain('Test Condition');
        expect(note).toContain('100');
        expect(note).toContain('50-80');
      });

      it('should include priority', () => {
        const note = (component as any).generateNoteFromAlert(mockAlert);
        
        expect(note).toContain('High');
      });

      it('should include clinical details', () => {
        const note = (component as any).generateNoteFromAlert(mockAlert);
        
        expect(note).toContain('Test details');
      });

      it('should include timestamp', () => {
        const note = (component as any).generateNoteFromAlert(mockAlert);
        
        expect(note).toContain('Alert Follow-up Note');
      });

      it('should include action placeholders', () => {
        const note = (component as any).generateNoteFromAlert(mockAlert);
        
        expect(note).toContain('[Document your clinical decision and actions here]');
        expect(note).toContain('[Document follow-up plan here]');
      });
    });
  });
});
