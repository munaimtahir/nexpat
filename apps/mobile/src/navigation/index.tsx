import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginScreen } from '@/screens/LoginScreen';
import { PatientsListScreen } from '@/screens/PatientsListScreen';
import { PatientDetailScreen } from '@/screens/PatientDetailScreen';
import { PatientFormScreen } from '@/screens/PatientFormScreen';
import { VisitDetailScreen } from '@/screens/VisitDetailScreen';
import { VisitsQueueScreen } from '@/screens/VisitsQueueScreen';
import { DoctorQueueScreen } from '@/screens/DoctorQueueScreen';
import { UploadManagerScreen } from '@/screens/UploadManagerScreen';
import { DiagnosticsScreen } from '@/screens/DiagnosticsScreen';
import { PublicDisplayScreen } from '@/screens/PublicDisplayScreen';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ROLES } from '@/constants';
import type { AppStackParamList, AssistantTabParamList, AuthStackParamList, DoctorTabParamList } from './types';

const Auth = createNativeStackNavigator<AuthStackParamList>();
const App = createNativeStackNavigator<AppStackParamList>();
const AssistantTabsNav = createBottomTabNavigator<AssistantTabParamList>();
const DoctorTabsNav = createBottomTabNavigator<DoctorTabParamList>();

const AssistantTabs = () => (
  <AssistantTabsNav.Navigator screenOptions={{ headerShown: false }}>
    <AssistantTabsNav.Screen name="Queue" component={VisitsQueueScreen} options={{ title: 'Queue' }} />
    <AssistantTabsNav.Screen name="Patients" component={PatientsListScreen} options={{ title: 'Patients' }} />
    <AssistantTabsNav.Screen name="Uploads" component={UploadManagerScreen} options={{ title: 'Uploads' }} />
    <AssistantTabsNav.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ title: 'Diagnostics' }} />
  </AssistantTabsNav.Navigator>
);

const DoctorTabs = () => (
  <DoctorTabsNav.Navigator screenOptions={{ headerShown: false }}>
    <DoctorTabsNav.Screen name="Queue" component={DoctorQueueScreen} options={{ title: 'Queue' }} />
    <DoctorTabsNav.Screen name="Patients" component={PatientsListScreen} options={{ title: 'Patients' }} />
    <DoctorTabsNav.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ title: 'Diagnostics' }} />
  </DoctorTabsNav.Navigator>
);

const AssistantStack = () => (
  <App.Navigator>
    <App.Screen name="Tabs" component={AssistantTabs} options={{ headerShown: false }} />
    <App.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient detail' }} />
    <App.Screen name="PatientForm" component={PatientFormScreen} options={{ title: 'Patient form' }} />
    <App.Screen name="VisitDetail" component={VisitDetailScreen} options={{ title: 'Visit detail' }} />
    <App.Screen
      name="PublicDisplay"
      component={PublicDisplayScreen}
      options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
    />
  </App.Navigator>
);

const DoctorStack = () => (
  <App.Navigator>
    <App.Screen name="Tabs" component={DoctorTabs} options={{ headerShown: false }} />
    <App.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient detail' }} />
    <App.Screen name="PatientForm" component={PatientFormScreen} options={{ title: 'Patient form' }} />
    <App.Screen name="VisitDetail" component={VisitDetailScreen} options={{ title: 'Visit detail' }} />
    <App.Screen
      name="PublicDisplay"
      component={PublicDisplayScreen}
      options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
    />
  </App.Navigator>
);

const AuthStack = () => (
  <Auth.Navigator>
    <Auth.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
  </Auth.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!user) {
    return <AuthStack />;
  }

  const isDoctor = user.roles.includes(ROLES.doctor);
  const isAssistant = user.roles.includes(ROLES.assistant);

  if (isDoctor && !isAssistant) {
    return <DoctorStack />;
  }

  // default to assistant navigation when user has multiple roles
  return <AssistantStack />;
};
