export interface DailyAlert {
  id: number;
  title: string;
  patient: string;
  patientId: string;
  time: string;
  condition: string;
  value: string;
  normalRange: string;
  priority: 'High' | 'Medium';
  details: string;
  recommendations: string[];
  suggestedAction: string;
}

export interface HomePatient {
  id: number;
  name: string;
  patientId: string;
}

export interface LabTest {
  id: number;
  name: string;
  selected: boolean;
}

export const DAILY_ALERTS: DailyAlert[] = [
  {
    id: 1,
    title: 'CRP elevated - Olivia Martinez',
    patient: 'Olivia Martinez',
    patientId: 'P-104501',
    time: 'Now',
    condition: 'CRP Elevated',
    value: '12.5 mg/L',
    normalRange: '0-10 mg/L',
    priority: 'High',
    details:
      'C-reactive protein (CRP) levels are significantly elevated, indicating possible inflammation or infection. Recent lab results show a marked increase from the last test.',
    recommendations: [
      'Order additional inflammatory markers panel',
      'Review recent medical history for infection symptoms',
      'Schedule follow-up appointment within 48 hours',
      'Consider antibiotic treatment if infection is suspected',
    ],
    suggestedAction: 'Order inflammatory markers panel and review for infection signs immediately',
  },
  {
    id: 2,
    title: 'Blood pressure high - Daniel Thompson',
    patient: 'Daniel Thompson',
    patientId: 'P-104502',
    time: '2 min ago',
    condition: 'Blood Pressure High',
    value: '165/98 mmHg',
    normalRange: '120/80 mmHg',
    priority: 'High',
    details:
      'Blood pressure readings are consistently elevated above normal range. Patient has history of hypertension but readings have increased despite current medication.',
    recommendations: [
      'Review current antihypertensive medication dosage',
      'Check for medication compliance',
      'Order ECG and kidney function tests',
      'Consider adjusting or adding medication',
      'Advise lifestyle modifications (diet, exercise, stress management)',
    ],
    suggestedAction: 'Review antihypertensive medication dosage and order ECG for cardiac assessment',
  },
  {
    id: 3,
    title: 'Glucose levels elevated - Isabella Rossi',
    patient: 'Isabella Rossi',
    patientId: 'P-104503',
    time: '8 min ago',
    condition: 'Glucose Levels Elevated',
    value: '185 mg/dL',
    normalRange: '70-100 mg/dL',
    priority: 'Medium',
    details:
      'Fasting glucose levels are elevated above normal range. Patient has pre-diabetes diagnosis and recent readings show progression.',
    recommendations: [
      'Order HbA1c test to assess long-term glucose control',
      'Review dietary habits and suggest nutritionist consultation',
      'Discuss diabetes prevention program enrollment',
      'Consider starting metformin if HbA1c confirms progression',
      'Schedule follow-up in 2 weeks to monitor glucose levels',
    ],
    suggestedAction: 'Schedule HbA1c test and diabetes education consultation within one week',
  },
  {
    id: 4,
    title: 'High cholesterol detected - Michael Carter',
    patient: 'Michael Carter',
    patientId: 'P-104504',
    time: '15 min ago',
    condition: 'High Cholesterol',
    value: 'Total: 265 mg/dL, LDL: 175 mg/dL',
    normalRange: 'Total: <200 mg/dL, LDL: <100 mg/dL',
    priority: 'Medium',
    details:
      'Lipid panel shows significantly elevated total cholesterol and LDL levels, increasing cardiovascular risk. Patient has family history of heart disease.',
    recommendations: [
      'Prescribe statin therapy (e.g., atorvastatin 20mg)',
      'Order comprehensive cardiovascular risk assessment',
      'Refer to dietitian for heart-healthy diet plan',
      'Recommend regular aerobic exercise program',
      'Recheck lipid panel in 6-8 weeks after treatment initiation',
    ],
    suggestedAction: 'Discuss statin therapy options and refer to dietitian for lifestyle counseling',
  },
  {
    id: 5,
    title: 'Low hemoglobin - Sophia Bennett',
    patient: 'Sophia Bennett',
    patientId: 'P-104505',
    time: '22 min ago',
    condition: 'Low Hemoglobin',
    value: '9.2 g/dL',
    normalRange: '13.5-17.5 g/dL',
    priority: 'High',
    details:
      'Hemoglobin levels are critically below the normal range suggesting moderate anemia. Patient reports fatigue and shortness of breath on exertion.',
    recommendations: [
      'Order full blood count and iron studies',
      'Assess for underlying cause (nutritional deficiency, chronic disease, bleeding)',
      'Consider iron supplementation if iron-deficiency confirmed',
      'Schedule transfusion evaluation if levels drop below 8 g/dL',
    ],
    suggestedAction: 'Order iron studies and complete blood count; assess for bleeding source urgently',
  },
  {
    id: 6,
    title: 'Elevated creatinine - James Walker',
    patient: 'James Walker',
    patientId: 'P-104506',
    time: '35 min ago',
    condition: 'Elevated Creatinine',
    value: '2.1 mg/dL',
    normalRange: '0.5-1.1 mg/dL',
    priority: 'High',
    details:
      'Serum creatinine is markedly elevated indicating reduced kidney function. Patient is on NSAIDs which may be contributing to renal impairment.',
    recommendations: [
      'Discontinue NSAIDs immediately',
      'Order renal ultrasound and GFR estimation',
      'Ensure adequate hydration',
      'Consult nephrology if levels do not improve within 48 hours',
    ],
    suggestedAction: 'Discontinue nephrotoxic medications immediately and order renal ultrasound',
  },
  {
    id: 7,
    title: 'Abnormal ECG - Ava Johnson',
    patient: 'Ava Johnson',
    patientId: 'P-104507',
    time: '52 min ago',
    condition: 'Abnormal ECG',
    value: 'ST-segment depression',
    normalRange: 'Normal sinus rhythm',
    priority: 'High',
    details:
      'ECG shows ST-segment depression in leads V4-V6, potentially indicating myocardial ischemia. Patient reports intermittent chest tightness.',
    recommendations: [
      'Perform repeat ECG immediately',
      'Order troponin and BNP blood tests',
      'Place patient on cardiac monitoring',
      'Cardiology consult urgently',
      'Prepare for possible stress test or angiography',
    ],
    suggestedAction: 'Order troponin levels stat and request urgent cardiology consultation',
  },
  {
    id: 8,
    title: 'Potassium level low - Emily Carter',
    patient: 'Emily Carter',
    patientId: 'P-104508',
    time: '1 hr ago',
    condition: 'Hypokalemia',
    value: '2.9 mEq/L',
    normalRange: '3.5-5.0 mEq/L',
    priority: 'Medium',
    details:
      'Potassium levels are below normal range. Patient is on loop diuretics for heart failure management which can cause potassium depletion.',
    recommendations: [
      'Initiate oral potassium supplementation',
      'Review diuretic dosage and consider potassium-sparing diuretic',
      'Order repeat electrolyte panel in 24 hours',
      'Advise high-potassium diet (bananas, leafy greens)',
    ],
    suggestedAction: 'Start oral potassium supplementation and recheck electrolytes in 24 hours',
  },
];

export const HOME_PATIENTS: HomePatient[] = [
  { id: 1, name: 'James Wilson', patientId: 'P-104582' },
  { id: 2, name: 'Sarah Johnson', patientId: 'P-102439' },
  { id: 3, name: 'Michael Chen', patientId: 'P-105821' },
  { id: 4, name: 'Emily Davis', patientId: 'P-103764' },
  { id: 5, name: 'Robert Martinez', patientId: 'P-106235' },
];

export const LAB_TESTS: LabTest[] = [
  { id: 1, name: 'Complete blood count (CBC)', selected: false },
  { id: 2, name: 'Comprehensive metabolic panel (CMP)', selected: true },
  { id: 3, name: 'Basic metabolic panel (BMP)', selected: false },
  { id: 4, name: 'Lipid panel', selected: false },
  { id: 5, name: 'Thyroid function tests (TSH, T3, T4)', selected: false },
  { id: 6, name: 'Hemoglobin A1C (HbA1c)', selected: false },
  { id: 7, name: 'Liver function tests (LFTs)', selected: false },
  { id: 8, name: 'Urinalysis', selected: false },
  { id: 9, name: 'Vitamin D levels', selected: false },
  { id: 10, name: 'Prostate-specific antigen (PSA)', selected: false },
];
