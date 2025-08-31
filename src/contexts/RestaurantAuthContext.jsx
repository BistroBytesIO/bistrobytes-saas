import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/lib/api';

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
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('restaurant_user');
        const storedRestaurant = localStorage.getItem('restaurant_data');

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Set up axios default headers for authenticated requests
          if (parsedUser.token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
          }
          if (parsedUser.tenantId) {
            api.defaults.headers.common['X-Tenant-Id'] = parsedUser.tenantId;
          }
        }

        if (storedRestaurant) {
          const parsedRestaurant = JSON.parse(storedRestaurant);
          setRestaurant(parsedRestaurant);
        }
      } catch (error) {
        console.error("Error parsing stored auth data, clearing localStorage:", error);
        localStorage.removeItem('restaurant_user');
        localStorage.removeItem('restaurant_data');
        // Clear any default headers
        delete api.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['X-Tenant-Id'];
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login function with tenant isolation
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {string} tenantId - Restaurant tenant ID
   */
  const login = async (email, password, tenantId) => {
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

      console.log("Login response:", response.data);

      // Ensure role is properly formatted
      const userData = {
        ...response.data,
        role: response.data.role?.trim().toUpperCase(),
        tenantId: tenantId || response.data.tenantId
      };

      // Store user data
      localStorage.setItem('restaurant_user', JSON.stringify(userData));
      setUser(userData);

      // Set up axios default headers for future requests
      if (userData.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      }
      if (userData.tenantId) {
        api.defaults.headers.common['X-Tenant-Id'] = userData.tenantId;
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
  const logout = (navigate) => {
    setUser(null);
    setRestaurant(null);
    
    // Clear localStorage
    localStorage.removeItem('restaurant_user');
    localStorage.removeItem('restaurant_data');
    
    // Clear axios default headers
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['X-Tenant-Id'];
    
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
      // This would fetch restaurant-specific data
      // For now, we'll create a placeholder structure
      const restaurantData = {
        tenantId: user.tenantId,
        name: 'Your Restaurant', // This would come from backend
        settings: {
          // Restaurant-specific settings
        }
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
    if (!user?.token) return false;

    try {
      // This would implement token refresh logic
      // For now, just return current state
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
    if (!user?.token) return false;

    try {
      // Make a test request to validate the session
      const response = await api.get('/auth/validate');
      return response.status === 200;
    } catch (error) {
      console.error('Session validation failed:', error);
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