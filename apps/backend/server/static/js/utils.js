/**
 * Common utility functions for the clinicq application
 */

// API utility functions
const api = {
  baseURL: window.location.origin,
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Redirect to login on unauthorized
        window.location.href = '/login/';
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  
  get(endpoint) {
    return this.request(endpoint);
  },
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};

// Date/time utilities
const dateUtils = {
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  },
  
  formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  },
  
  formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  },
  
  isToday(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
};

// Form validation utilities
const validation = {
  required(value) {
    return value && value.toString().trim().length > 0;
  },
  
  minLength(value, min) {
    return value && value.toString().length >= min;
  },
  
  maxLength(value, max) {
    return value && value.toString().length <= max;
  },
  
  email(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  phone(value) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value);
  },
  
  registrationNumber(value) {
    // Track the source pattern string and rebuild the cached RegExp when it changes
    let rawPattern = null;
    if (typeof window !== 'undefined') {
      if (window.REGISTRATION_NUMBER_FORMAT?.pattern) {
        rawPattern = window.REGISTRATION_NUMBER_FORMAT.pattern;
      } else {
        try {
          const stored = window.localStorage.getItem('registration_number_format');
          if (stored) {
            const parsed = JSON.parse(stored);
            rawPattern = parsed?.pattern || null;
          }
        } catch (error) {
          console.warn('Failed to read registration format from storage', error);
        }
      }
    }
    // Only rebuild the RegExp if the pattern string has changed
    if (
      validation._cachedRegPattern === undefined ||
      validation._cachedRegPatternSource !== rawPattern
    ) {
      try {
        validation._cachedRegPattern = rawPattern ? new RegExp(rawPattern) : /^\d{2}-\d{2}-\d{3}$/;
        validation._cachedRegPatternSource = rawPattern;
      } catch (error) {
        console.warn('Invalid registration format pattern. Falling back to default.', error);
        validation._cachedRegPattern = /^\d{2}-\d{2}-\d{3}$/;
        validation._cachedRegPatternSource = null;
      }
    }
    return validation._cachedRegPattern.test(value);
  }
};

// UI utilities
const ui = {
  showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  loading(show = true) {
    let loader = document.getElementById('global-loader');
    if (show) {
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = '<div class="spinner"></div>';
        loader.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
        `;
        document.body.appendChild(loader);
      }
    } else if (loader) {
      loader.remove();
    }
  },
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Status utilities for visit management
const status = {
  getStatusColor(status) {
    const colors = {
      'WAITING': 'status-waiting',
      'START': 'status-start', 
      'IN_ROOM': 'status-in-room',
      'DONE': 'status-done'
    };
    return colors[status] || 'status-waiting';
  },
  
  getStatusLabel(status) {
    const labels = {
      'WAITING': 'Waiting',
      'START': 'Start',
      'IN_ROOM': 'In Room', 
      'DONE': 'Done'
    };
    return labels[status] || status;
  }
};

// Make utilities available globally
window.clinicq = {
  api,
  dateUtils,
  validation,
  ui,
  status
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideOut {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

.spinner {
  border: 4px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top: 4px solid white;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);