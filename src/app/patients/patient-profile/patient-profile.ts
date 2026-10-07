import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChipThemeColor, KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { EditorCssSettings, KENDO_EDITOR } from '@progress/kendo-angular-editor';
import { ExcelExportData } from '@progress/kendo-angular-excel-export';
import { GridComponent, KENDO_GRID, KENDO_GRID_EXCEL_EXPORT } from '@progress/kendo-angular-grid';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_INDICATORS } from '@progress/kendo-angular-indicators';
import { KENDO_LAYOUT } from '@progress/kendo-angular-layout';
import { BreadCrumbItem, KENDO_BREADCRUMB } from '@progress/kendo-angular-navigation';
import { KENDO_PAGER } from '@progress/kendo-angular-pager';
import { KENDO_TOOLBAR } from '@progress/kendo-angular-toolbar';

import { SortDescriptor } from '@progress/kendo-data-query';
import {
  checkIcon,
  downloadIcon,
  exclamationCircleIcon,
  homeIcon,
  sparklesIcon,
  SVGIcon,
  userIcon,
} from '@progress/kendo-svg-icons';

import { LabResult, PatientProfile } from '../../data/patients.data';
import { PageHeaderService } from '../../services/page-header.service';
import { PatientsService } from '../../services/patients.service';

type NoteSaveStatus = { kind: 'success' | 'error'; message: string } | null;

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './patient-profile.html',
  styleUrls: ['./patient-profile.css'],
  imports: [
    CommonModule,
    KENDO_BREADCRUMB,
    KENDO_BUTTONS,
    KENDO_ICONS,
    KENDO_INDICATORS,
    KENDO_LAYOUT,
    KENDO_EDITOR,
    KENDO_TOOLBAR,
    KENDO_GRID,
    KENDO_GRID_EXCEL_EXPORT,
    KENDO_PAGER,
  ],
})
export class PatientProfileComponent implements OnInit, OnDestroy {
  @ViewChild(GridComponent) private grid!: GridComponent;

  public downloadIcon: SVGIcon = downloadIcon;
  public sparklesIcon: SVGIcon = sparklesIcon;
  public checkIcon: SVGIcon = checkIcon;
  public exclamationCircleIcon: SVGIcon = exclamationCircleIcon;

  public editorIframeCss: EditorCssSettings = {
    path: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    content: `.k-content {
        font-family: 'Poppins', sans-serif;
        font-size: 16px;
    }`,
  };

  public getPatientStatusColor(status: string): ChipThemeColor {
    const colorMap: Record<string, ChipThemeColor> = {
      Stable: 'success',
      Monitoring: 'warning',
      Critical: 'error',
    };
    return colorMap[status] ?? 'base';
  }

  public breadcrumbItems: BreadCrumbItem[] = [
    { text: 'Patients', svgIcon: homeIcon, title: 'Patients' },
    { text: 'Patient Profile', svgIcon: userIcon, title: 'Patient Profile' },
  ];

  public patientId = 0;
  public patient: PatientProfile | null = null;
  public labResults: LabResult[] = [];
  public labResultsSort: SortDescriptor[] = [{ field: 'testName', dir: 'asc' }];

  public noteDraft = '';
  public noteSaveStatus: NoteSaveStatus = null;
  public isSavingNote = false;

  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientsService = inject(PatientsService);
  private noteStatusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.pageHeaderService.title.set('Patients');
    this.pageHeaderService.subtitle.set('');

    // Subscribe to route parameter changes to handle navigation between different patients
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.patientId = parseInt(id, 10);
        this.noteDraft = '';
        this.clearNoteStatus();
        this.loadPatientData();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearNoteStatus();
    this.pageHeaderService.title.set('');
    this.pageHeaderService.subtitle.set('');
  }

  private loadPatientData(): void {
    const patientData = this.patientsService.getPatientById(this.patientId);
    if (patientData) {
      this.patient = patientData;
      this.labResults = patientData.labResults;
      this.noteDraft = patientData.notes ?? '';
    } else {
      // Patient not found, navigate back to patients list
      this.router.navigate(['/patients']);
    }
  }

  public navigateToPatients(): void {
    this.router.navigate(['/patients']);
  }

  public onBreadcrumbItemClick(item: BreadCrumbItem): void {
    if (item.text === 'Patients') {
      this.navigateToPatients();
    }
  }

  public saveNotes(): void {
    if (this.isSavingNote || !this.patient) {
      return;
    }

    this.isSavingNote = true;
    this.clearNoteStatus();

    try {
      const saved = this.patientsService.updatePatientNotes(this.patientId, this.noteDraft);

      if (saved) {
        this.patient.notes = this.noteDraft;
        this.setNoteStatus('success', 'Patient note saved.');
      } else {
        this.setNoteStatus(
          'error',
          'Patient note could not be saved. Your changes were not stored.',
        );
      }
    } finally {
      this.isSavingNote = false;
    }
  }

  private setNoteStatus(kind: 'success' | 'error', message: string): void {
    this.noteSaveStatus = { kind, message };

    if (kind === 'success') {
      this.noteStatusTimeoutId = setTimeout(() => {
        this.noteSaveStatus = null;
        this.noteStatusTimeoutId = null;
      }, 4000);
    }
  }

  private clearNoteStatus(): void {
    if (this.noteStatusTimeoutId !== null) {
      clearTimeout(this.noteStatusTimeoutId);
      this.noteStatusTimeoutId = null;
    }
    this.noteSaveStatus = null;
  }

  public exportToExcel(): void {
    this.grid.saveAsExcel();
  }

  public allData = (): ExcelExportData => {
    return {
      data: this.labResults,
    };
  };
}
