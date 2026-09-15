import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const CUSTOMER_SESSION_DURATION_SECONDS = 300; // 5 minutes (300 seconds)
const WARNING_THRESHOLD_SECONDS = 20; // Trigger warning drawer at <= 20 seconds

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('apex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('apex_token'));
  const [loading, setLoading] = useState(true);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Customer fixed wall-clock countdown timer state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(() => {
    const expiresAt = localStorage.getItem('apex_customer_expires_at');
    if (expiresAt) {
      const remaining = Math.floor((parseInt(expiresAt, 10) - Date.now()) / 1000);
      return Math.max(0, remaining);
    }
    return CUSTOMER_SESSION_DURATION_SECONDS;
  });

  const [isWarningActive, setIsWarningActive] = useState(false);
  const timerIntervalRef = useRef(null);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logout = useCallback((reason = '') => {
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
    localStorage.removeItem('apex_customer_expires_at');
    setUser(null);
    setToken(null);
    setIsWarningActive(false);
    setTimeRemainingSeconds(CUSTOMER_SESSION_DURATION_SECONDS);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (reason) {
      sessionStorage.setItem('logout_reason', reason);
    }
  }, []);

  const login = (tokenData, userData) => {
    localStorage.setItem('apex_token', tokenData);
    localStorage.setItem('apex_user', JSON.stringify(userData));
    
    // Set fixed 5-minute wall-clock expiration timestamp upon login for customer
    const isCust = userData.role === 'customer' || userData.role === 'client';
    if (isCust) {
      const expiresAt = Date.now() + CUSTOMER_SESSION_DURATION_SECONDS * 1000;
      localStorage.setItem('apex_customer_expires_at', expiresAt.toString());
      setTimeRemainingSeconds(CUSTOMER_SESSION_DURATION_SECONDS);
    }
    
    setToken(tokenData);
    setUser(userData);
    setIsWarningActive(false);
    addToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const extendSession = async () => {
    try {
      const res = await api.post('/auth/refresh', {});
      if (res.token) {
        localStorage.setItem('apex_token', res.token);
        setToken(res.token);
      }
      // Explicitly extend by another 5 minutes from now
      const newExpiresAt = Date.now() + CUSTOMER_SESSION_DURATION_SECONDS * 1000;
      localStorage.setItem('apex_customer_expires_at', newExpiresAt.toString());
      setTimeRemainingSeconds(CUSTOMER_SESSION_DURATION_SECONDS);
      setIsWarningActive(false);
      addToast('Session extended for 5 minutes!', 'success');
    } catch (err) {
      logout('Session could not be refreshed. Please sign in again.');
    }
  };

  // Handle global 401 session expired event
  useEffect(() => {
    const handleSessionExpired = (e) => {
      logout(e.detail || 'Your session has expired. Please log in again.');
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [logout]);

  // Fixed Wall-Clock Countdown Interval for Customer
  // Note: Runs steadily independent of mouse movements, clicks, or API requests!
  useEffect(() => {
    const isCust = user?.role === 'customer' || user?.role === 'client';
    if (!isCust || !token) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsWarningActive(false);
      return;
    }

    // Ensure expiresAt exists
    let storedExpiresAt = localStorage.getItem('apex_customer_expires_at');
    if (!storedExpiresAt) {
      storedExpiresAt = (Date.now() + CUSTOMER_SESSION_DURATION_SECONDS * 1000).toString();
      localStorage.setItem('apex_customer_expires_at', storedExpiresAt);
    }

    const checkCountdown = () => {
      const expiresAtTime = parseInt(localStorage.getItem('apex_customer_expires_at') || '0', 10);
      const remainingSeconds = Math.floor((expiresAtTime - Date.now()) / 1000);

      if (remainingSeconds <= 0) {
        clearInterval(timerIntervalRef.current);
        setTimeRemainingSeconds(0);
        setIsWarningActive(false);
        logout('Session timed out after 5 minutes.');
      } else {
        setTimeRemainingSeconds(remainingSeconds);
        if (remainingSeconds <= WARNING_THRESHOLD_SECONDS) {
          setIsWarningActive(true);
        } else {
          setIsWarningActive(false);
        }
      }
    };

    checkCountdown();
    timerIntervalRef.current = setInterval(checkCountdown, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [user?.role, token, logout]);

  // Check auth validity on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.user);
        localStorage.setItem('apex_user', JSON.stringify(res.user));
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [token, logout]);

  const isCustomer = user?.role === 'customer' || user?.role === 'client';
  const isManager = user?.role === 'manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        extendSession,
        toasts,
        addToast,
        removeToast,
        timeRemainingSeconds,
        isWarningActive,
        isCustomer,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
