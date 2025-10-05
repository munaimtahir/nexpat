import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { DashboardScreen } from '@/screens/DashboardScreen';
import type { AppStackParamList, AssistantTabParamList, AuthStackParamList, DoctorTabParamList } from './types';

const Auth = createNativeStackNavigator<AuthStackParamList>();
const App = createNativeStackNavigator<AppStackParamList>();
const AssistantTabsNav = createBottomTabNavigator<AssistantTabParamList>();
const DoctorTabsNav = createBottomTabNavigator<DoctorTabParamList>();

const baseTabOptions = {
  headerShown: false,
  tabBarShowLabel: false,
  tabBarActiveTintColor: '#F8FAFC',
  tabBarInactiveTintColor: 'rgba(248,250,252,0.45)',
  tabBarStyle: {
    position: 'absolute' as const,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 28,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 78,
    paddingBottom: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 }
  },
  tabBarItemStyle: {
    paddingVertical: 6
  },
  tabBarBackground: () => (
    <LinearGradient
      colors={['rgba(15,23,42,0.95)', 'rgba(30,41,59,0.85)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, borderRadius: 28 }}
    />
  )
};

const getTabIcon = (name: string, focused: boolean) => {
  switch (name) {
    case 'Dashboard':
      return focused ? 'view-dashboard' : 'view-dashboard-outline';
    case 'Queue':
      return focused ? 'clipboard-text' : 'clipboard-text-outline';
    case 'Patients':
      return focused ? 'account-group' : 'account-group-outline';
    case 'Uploads':
      return focused ? 'cloud-upload' : 'cloud-upload-outline';
    case 'Diagnostics':
      return focused ? 'pulse' : 'pulse';
    default:
      return 'circle';
  }
};

const AssistantTabs = () => (
  <AssistantTabsNav.Navigator
    initialRouteName="Dashboard"
    screenOptions={({ route }) => ({
      ...baseTabOptions,
      tabBarIcon: ({ color, focused }) => (
        <MaterialCommunityIcons name={getTabIcon(route.name, focused)} size={focused ? 28 : 24} color={color} />
      )
    })}
  >
    <AssistantTabsNav.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    <AssistantTabsNav.Screen name="Queue" component={VisitsQueueScreen} options={{ title: 'Queue' }} />
    <AssistantTabsNav.Screen name="Patients" component={PatientsListScreen} options={{ title: 'Patients' }} />
    <AssistantTabsNav.Screen name="Uploads" component={UploadManagerScreen} options={{ title: 'Uploads' }} />
    <AssistantTabsNav.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ title: 'Diagnostics' }} />
  </AssistantTabsNav.Navigator>
);

const DoctorTabs = () => (
  <DoctorTabsNav.Navigator
    initialRouteName="Dashboard"
    screenOptions={({ route }) => ({
      ...baseTabOptions,
      tabBarIcon: ({ color, focused }) => (
        <MaterialCommunityIcons name={getTabIcon(route.name, focused)} size={focused ? 28 : 24} color={color} />
      )
    })}
  >
    <DoctorTabsNav.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
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
