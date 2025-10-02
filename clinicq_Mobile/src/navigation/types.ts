export type AppStackParamList = {
  Tabs: undefined;
  PatientDetail: { patientId: number };
  PatientForm: { patientId?: number };
  VisitDetail: { visitId: number };
};

export type AssistantTabParamList = {
  Queue: undefined;
  Patients: undefined;
  Uploads: undefined;
  Diagnostics: undefined;
};

export type DoctorTabParamList = {
  Queue: undefined;
  Patients: undefined;
  Diagnostics: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};
