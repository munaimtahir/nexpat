import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      login: {
        title: 'Welcome back',
        subtitle: 'Log in to manage today\'s clinic flow',
        username: 'Username',
        password: 'Password',
        submit: 'Sign in'
      },
      dashboard: {
        assistant: 'Assistant dashboard',
        doctor: 'Doctor dashboard'
      },
      actions: {
        addPatient: 'Add patient',
        enqueueVisit: 'Add to queue',
        refresh: 'Refresh'
      }
    }
  }
};

export const initI18n = () => {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      compatibilityJSON: 'v4',
      lng: Localization.locale.split('-')[0],
      fallbackLng: 'en',
      resources
    });
  }

  return i18n;
};
