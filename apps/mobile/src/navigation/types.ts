export type AppStackParamList = {
  Tabs: undefined;
  PatientDetail: { patientId: number };
  PatientForm: { patientId?: number };
  VisitDetail: { visitId: number };
  PublicDisplay: undefined;
};

export type AssistantTabParamList = {
  Dashboard: undefined;
  Queue: undefined;
  Patients: undefined;
  Uploads: undefined;
  Diagnostics: undefined;
};

export type DoctorTabParamList = {
  Dashboard: undefined;
  Queue: undefined;
  Patients: undefined;
  Diagnostics: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};
