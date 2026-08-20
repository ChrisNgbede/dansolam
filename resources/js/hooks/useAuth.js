import { useState, useEffect } from 'react';
import { getAdminToken } from '../components/auth/RequireAdminAuth';

// Common helper to make fetch requests with auth headers
export const apiFetch = async (url, options = {}) => {
  const isAdminRequest = typeof url === 'string' && (url.startsWith('/api/admin') || url.startsWith('/api/pos'));
  const token = isAdminRequest
    ? getAdminToken()
    : localStorage.getItem('dansolam_customer_token') || sessionStorage.getItem('dansolam_customer_token');
  
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired, clear tokens
    localStorage.removeItem('dansolam_customer_token');
    sessionStorage.removeItem('dansolam_customer_token');
    localStorage.removeItem('dansolam_admin_token');
    sessionStorage.removeItem('dansolam_admin_token');
    
    // Dispatch custom event to sync all useAuth hook states
    window.dispatchEvent(new Event('dansolam_auth_logout'));
    
    // Auto-redirect admin panel to login page to avoid blank page layout corruption
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
  }

  return response;
};

export const useAuth = () => {
  const [customer, setCustomer] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize state changes when a logout event is fired
  useEffect(() => {
    const handleAuthLogout = () => {
      setCustomer(null);
      setAdmin(null);
    };

    window.addEventListener('dansolam_auth_logout', handleAuthLogout);
    return () => {
      window.removeEventListener('dansolam_auth_logout', handleAuthLogout);
    };
  }, []);

  // Monitor user activity and auto-logout after 30 minutes of inactivity
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const updateActivity = () => {
      localStorage.setItem('dansolam_last_activity', Date.now().toString());
    };

    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Initial activity timestamp set
    updateActivity();

    const interval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('dansolam_last_activity') || '0', 10);
      const now = Date.now();
      const hasCustomer = !!localStorage.getItem('dansolam_customer_token') || !!sessionStorage.getItem('dansolam_customer_token');
      const hasAdmin = !!localStorage.getItem('dansolam_admin_token') || !!sessionStorage.getItem('dansolam_admin_token');

      if ((hasCustomer || hasAdmin) && now - lastActivity > INACTIVITY_TIMEOUT) {
        localStorage.removeItem('dansolam_customer_token');
        sessionStorage.removeItem('dansolam_customer_token');
        localStorage.removeItem('dansolam_admin_token');
        sessionStorage.removeItem('dansolam_admin_token');
        setCustomer(null);
        setAdmin(null);

        window.dispatchEvent(new Event('dansolam_auth_logout'));

        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/shop';
        }
      }
    }, 15000); // Check every 15 seconds

    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(interval);
    };
  }, []);

  // Check auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      const customerToken = localStorage.getItem('dansolam_customer_token') || sessionStorage.getItem('dansolam_customer_token');
      const adminToken = getAdminToken();

      if (customerToken) {
        try {
          const res = await apiFetch('/api/customer/profile');
          const data = await res.json();
          if (data.success) {
            setCustomer(data.data);
          } else {
            localStorage.removeItem('dansolam_customer_token');
            sessionStorage.removeItem('dansolam_customer_token');
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (adminToken) {
        try {
          const res = await apiFetch('/api/admin/profile');
          const data = await res.json();
          if (data.success) {
            setAdmin(data.data);
          } else {
            localStorage.removeItem('dansolam_admin_token');
            sessionStorage.removeItem('dansolam_admin_token');
          }
        } catch (e) {
          console.error(e);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const customerLogin = async (email, password, remember = false) => {
    const res = await apiFetch('/api/customer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      if (remember) {
        localStorage.setItem('dansolam_customer_token', data.data.token);
        localStorage.setItem('dansolam_remembered_email', email);
      } else {
        sessionStorage.setItem('dansolam_customer_token', data.data.token);
        localStorage.removeItem('dansolam_customer_token');
        localStorage.removeItem('dansolam_remembered_email');
      }
      setCustomer(data.data.customer);
      return { success: true, customer: data.data.customer };
    }
    return { success: false, message: data.message };
  };

  const customerRegister = async (name, email, phone, password, password_confirmation) => {
    const res = await apiFetch('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, password_confirmation }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('dansolam_customer_token', data.data.token);
      setCustomer(data.data.customer);
      return { success: true, customer: data.data.customer };
    }
    return { success: false, message: data.message };
  };

  const customerLogout = async () => {
    try {
      await apiFetch('/api/customer/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('dansolam_customer_token');
    sessionStorage.removeItem('dansolam_customer_token');
    setCustomer(null);
  };

  const adminLogin = async (email, password, remember = false) => {
    const res = await apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      if (remember) {
        localStorage.setItem('dansolam_admin_token', data.data.token);
        localStorage.setItem('dansolam_remembered_admin_email', email);
      } else {
        sessionStorage.setItem('dansolam_admin_token', data.data.token);
        localStorage.removeItem('dansolam_admin_token');
        localStorage.removeItem('dansolam_remembered_admin_email');
      }
      setAdmin(data.data.user);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const adminLogout = async () => {
    try {
      await apiFetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('dansolam_admin_token');
    sessionStorage.removeItem('dansolam_admin_token');
    setAdmin(null);
  };

  return {
    customer,
    admin,
    loading,
    customerLogin,
    customerRegister,
    customerLogout,
    adminLogin,
    adminLogout,
    setCustomer,
    setAdmin,
  };
};
