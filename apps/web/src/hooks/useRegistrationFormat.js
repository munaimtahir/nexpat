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

let cachedFormat = readFromStorage();
let pendingRequest = null;
const listeners = new Set();

const emitChange = () => {
  listeners.forEach((listener) => listener(cachedFormat));
};

const fetchFormat = async () => {
  if (!pendingRequest) {
    pendingRequest = api
      .get('/settings/registration-format/')
      .then((response) => {
        cachedFormat = response.data;
        writeToStorage(cachedFormat);
        emitChange();
        return cachedFormat;
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }
  return pendingRequest;
};

export const useRegistrationFormat = () => {
  const [format, setFormatState] = useState(() => {
    if (cachedFormat) {
      return cachedFormat;
    }
    cachedFormat = readFromStorage();
    return cachedFormat;
  });
  const [loading, setLoading] = useState(!format);
  const [error, setError] = useState('');

  useEffect(() => {
    const listener = (value) => {
      setFormatState(value);
      setLoading(false);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    if (!format) {
      fetchFormat().catch(() => {
        setError('Failed to load registration format.');
        setLoading(false);
      });
    }
  }, [format]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFormat();
      return data;
    } catch (err) {
      console.error('Failed to load registration format', err);
      setError('Failed to load registration format.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocalFormat = useCallback((value) => {
    cachedFormat = value;
    writeToStorage(value);
    emitChange();
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
