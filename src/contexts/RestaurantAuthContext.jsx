import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/lib/api';
import { adminApiUtils } from '@/services/adminApi';

const RestaurantAuthContext = createContext();

export const useRestaurantAuth = () => {
  const context = useContext(RestaurantAuthContext);
  if (!context) {
    throw new Error('useRestaurantAuth must be used within a RestaurantAuthProvider');
  }
  return context;
};

export const RestaurantAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('restaurant_user');
        const storedRestaurant = localStorage.getItem('restaurant_data');

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          if (parsedUser.tenantId) {
            api.defaults.headers.common['X-Tenant-Id'] = parsedUser.tenantId;
          }
        }

        // Restore Authorization header from sessionStorage on page reload.
        const savedJwt = sessionStorage.getItem('admin_jwt');
        if (savedJwt) {
          api.defaults.headers.common['Authorization'] = `Bearer ${savedJwt}`;
        }

        if (storedRestaurant) {
          const parsedRestaurant = JSON.parse(storedRestaurant);
          setRestaurant(parsedRestaurant);
        }
      } catch (error) {
        console.error("Error parsing stored auth data, clearing localStorage:", error);
        localStorage.removeItem('restaurant_user');
        localStorage.removeItem('restaurant_data');
        delete api.defaults.headers.common['X-Tenant-Id'];
      }

      // If we have a tenant context, confirm the session with the backend.
      // setIsLoading(false) is intentionally deferred to here so that ProtectedRoute
      // never sees isAuthenticated=true with a stale/invalid token. The loading spinner
      // covers this round-trip and prevents a flash of the dashboard before redirect.
      try {
        const tenantId = (() => {
          try {
            const s = localStorage.getItem('restaurant_user');
            if (!s) return null;
            const u = JSON.parse(s);
            return u?.tenantId || null;
          } catch {
            return null;
          }
        })();
        if (tenantId) {
          const resp = await api.get('/auth/me', { headers: { 'X-Tenant-Id': tenantId } });
          const me = resp?.data || null;
          if (me?.email) {
            const normalized = {
              email: me.email,
              role: me.role?.trim?.().toUpperCase?.() || me.role,
              tenantId: me.tenantId || tenantId
            };
            localStorage.setItem('restaurant_user', JSON.stringify(normalized));
            setUser(normalized);
            api.defaults.headers.common['X-Tenant-Id'] = normalized.tenantId;
          }
        }
      } catch (error) {
        // Backend explicitly rejected the session (e.g. after a restart) — clear all auth state
        // so the user is sent back to login rather than seeing a fake authenticated dashboard.
        // Network errors (no error.response) are NOT treated as auth failures — the backend may
        // simply be temporarily unreachable and the token could still be valid.
        if (error.response?.status === 401 || error.response?.status === 403) {
          setUser(null);
          setRestaurant(null);
          localStorage.removeItem('restaurant_user');
          localStorage.removeItem('restaurant_data');
          sessionStorage.removeItem('admin_jwt');
          delete api.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['X-Tenant-Id'];
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Ensure restaurant data is fetched when user is present but restaurant info is missing
  useEffect(() => {
    if (user?.tenantId && !restaurant?.name) {
      fetchRestaurantData().catch(() => {/* no-op */});
    }
  }, [user?.tenantId]);

  /**
   * Login function with tenant isolation
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {string} tenantId - Restaurant tenant ID
   */
  const login = async (email, password, tenantId) => {
    const devLogging = !!import.meta.env?.DEV;
    try {
      // Make login request with tenant header
      const response = await api.post('/auth/login', {
        email,
        password
      }, {
        headers: {
          'X-Tenant-Id': tenantId
        }
      });

      if (devLogging) { console.log("Login response:", response.data); }

      // Ensure role is properly formatted
      const userData = {
        ...response.data,
        role: response.data.role?.trim().toUpperCase(),
        tenantId: tenantId || response.data.tenantId
      };

      // Store user metadata (non-sensitive: email, role, tenantId — NOT the token).
      localStorage.setItem('restaurant_user', JSON.stringify(userData));
      setUser(userData);

      if (userData.tenantId) {
        api.defaults.headers.common['X-Tenant-Id'] = userData.tenantId;
      }

      // Persist the JWT for cross-origin requests (HTTP dev frontend → HTTPS API).
      // sessionStorage is per-tab and cleared on close — strictly safer than localStorage.
      // The HttpOnly cookie is also set server-side for same-origin production setups.
      if (response.data.token) {
        sessionStorage.setItem('admin_jwt', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }

      // Fetch restaurant data if available
      await fetchRestaurantData();

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  };

  /**
   * Logout function with cleanup
   */
  const logout = async (navigate) => {
    // Tell the backend to clear the HttpOnly cookie (Max-Age=0).
    // Fire-and-forget: clear local state regardless of whether the request succeeds.
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — the token in sessionStorage will no longer be sent anyway.
    }

    setUser(null);
    setRestaurant(null);

    // Clear localStorage and sessionStorage
    localStorage.removeItem('restaurant_user');
    localStorage.removeItem('restaurant_data');
    sessionStorage.removeItem('admin_jwt');

    // Clear axios default headers
    delete api.defaults.headers.common['X-Tenant-Id'];
    delete api.defaults.headers.common['Authorization'];

    // Navigate to login page
    if (navigate) {
      navigate('/admin/login');
    }
  };

  /**
   * Fetch restaurant/tenant-specific data
   */
  const fetchRestaurantData = async () => {
    if (!user?.tenantId) return;

    try {
      // Try to fetch from backend profile first
      let name = null;
      try {
        const resp = await adminApiUtils.getRestaurantProfile();
        const data = resp?.data || {};
        name = data.companyName || data.name || null;
      } catch (e) {
        // ignore and fallback
      }

      if (!name) {
        // Fallback: derive from tenantId (slug -> Title Case)
        const slug = user.tenantId || '';
        name = slug
          .split(/[-_]/)
          .filter(Boolean)
          .map(s => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ') || 'Your Restaurant';
      }

      const restaurantData = {
        tenantId: user.tenantId,
        name,
        settings: {}
      };

      localStorage.setItem('restaurant_data', JSON.stringify(restaurantData));
      setRestaurant(restaurantData);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    }
  };

  /**
   * Update restaurant data
   */
  const updateRestaurantData = (newData) => {
    const updatedRestaurant = { ...restaurant, ...newData };
    localStorage.setItem('restaurant_data', JSON.stringify(updatedRestaurant));
    setRestaurant(updatedRestaurant);
  };

  /**
   * Check if user has required role
   */
  const hasRole = (requiredRole) => {
    if (!user?.role) return false;
    return user.role === requiredRole.toUpperCase();
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => {
    return hasRole('ROLE_ADMIN') || hasRole('ADMIN');
  };

  /**
   * Get current tenant ID
   */
  const getTenantId = () => {
    return user?.tenantId || restaurant?.tenantId;
  };

  /**
   * Refresh user token if needed
   */
  const refreshToken = async () => {
    if (!user?.tenantId) return false;

    try {
      // Cookie-based session: confirm we are still authenticated.
      await api.get('/auth/me', { headers: { 'X-Tenant-Id': user.tenantId } });
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  /**
   * Validate current session
   */
  const validateSession = async () => {
    if (!user?.tenantId) return false;
    try {
      await api.get('/auth/me', { headers: { 'X-Tenant-Id': user.tenantId } });
      return true;
    } catch {
      return false;
    }
  };

  const contextValue = {
    // User state
    user,
    restaurant,
    isLoading,
    isAuthenticated: !!user,
    
    // Auth actions
    login,
    logout,
    
    // Restaurant actions
    fetchRestaurantData,
    updateRestaurantData,
    
    // Utility functions
    hasRole,
    isAdmin,
    getTenantId,
    refreshToken,
    validateSession
  };

  return (
    <RestaurantAuthContext.Provider value={contextValue}>
      {children}
    </RestaurantAuthContext.Provider>
  );
};

// Export the context itself for direct access if needed
export { RestaurantAuthContext };
