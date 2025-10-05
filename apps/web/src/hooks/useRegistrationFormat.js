import { useCallback, useEffect, useState } from 'react';
import api from '../api.js';

const STORAGE_KEY = 'registration_number_format';

const readFromStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse cached registration format', error);
    return null;
  }
};

const writeToStorage = (value) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      window.REGISTRATION_NUMBER_FORMAT = value;
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      window.REGISTRATION_NUMBER_FORMAT = undefined;
    }
  } catch (error) {
    console.warn('Failed to persist registration format', error);
  }
};

export const useRegistrationFormat = () => {
  const [format, setFormat] = useState(() => readFromStorage());
  const [loading, setLoading] = useState(!format);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/settings/registration-format/');
      setFormat(response.data);
      writeToStorage(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to load registration format', err);
      setError('Failed to load registration format.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!format) {
      refresh().catch(() => {});
    } else {
      writeToStorage(format);
    }
  }, [format, refresh]);

  const updateLocalFormat = useCallback((value) => {
    setFormat(value);
    writeToStorage(value);
  }, []);

  return {
    format,
    loading,
    error,
    refresh,
    setFormat: updateLocalFormat,
  };
};

export default useRegistrationFormat;
