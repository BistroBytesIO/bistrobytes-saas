import axios from 'axios';

/**
 * Admin API service with multi-tenant support
 * This service handles all admin-related API requests with proper tenant isolation
 */
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api',
  timeout: 30000, // 30 second timeout for admin operations
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor to attach authentication token and tenant ID
 */
adminApi.interceptors.request.use(
  (config) => {
    try {
      // Get user data from localStorage (using restaurant_user key from our auth context)
      const userData = localStorage.getItem('restaurant_user');
      
      if (userData) {
        const user = JSON.parse(userData);
        
        // Attach Bearer token
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
        
        // Attach tenant ID for multi-tenant requests
        if (user.tenantId) {
          config.headers['X-Tenant-Id'] = user.tenantId;
        }
      } else {
        console.warn('⚠️ No authentication token found for admin request');
      }

      // Log request for debugging
      console.debug('🚀 Admin API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        tenantId: config.headers['X-Tenant-Id'],
        hasAuth: !!config.headers.Authorization
      });

      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for logging and error handling
 */
adminApi.interceptors.response.use(
  (response) => {
    console.debug('✅ Admin API Response:', {
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL}${response.config.url}`,
      status: response.status,
      tenantId: response.config.headers['X-Tenant-Id']
    });
    return response;
  },
  (error) => {
    console.error('❌ Admin API Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown',
      status: error.response?.status,
      message: error.message,
      tenantId: error.config?.headers?.['X-Tenant-Id']
    });

    // Handle specific admin error cases
    if (error.response?.status === 401) {
      console.error('🔐 Admin authentication failed - redirecting to login');
      // The auth context will handle the redirect
    } else if (error.response?.status === 403) {
      console.error('🚫 Admin access forbidden - insufficient permissions');
    } else if (error.response?.status === 404 && error.config?.url?.includes('/admin/')) {
      console.error('🔍 Admin endpoint not found');
    } else if (error.response?.status === 500) {
      console.error('🔥 Admin server error - check backend logs');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('🌐 Admin API network error - check backend connectivity');
    }

    return Promise.reject(error);
  }
);

/**
 * Admin API endpoints organized by feature
 */
export const adminEndpoints = {
  // Dashboard & Stats
  stats: {
    dashboard: '/admin/stats/dashboard',
    revenue: {
      monthly: '/admin/stats/revenue/monthly',
      daily: '/admin/stats/revenue/daily'
    },
    inventory: {
      lowStock: '/admin/stats/inventory/low-stock'
    },
    performance: '/admin/stats/performance'
  },
  
  // Order Management
  orders: {
    pending: '/admin/orders/pending',
    readyForPickup: '/admin/orders/readyForPickup',
    all: '/admin/orders',
    byId: (id) => `/admin/orders/${id}`,
    markReady: (id) => `/admin/orders/${id}/ready`,
    markCompleted: (id) => `/admin/orders/${id}/completed`
  },
  
  // Menu Management
  menu: {
    all: '/admin/menu',
    byId: (id) => `/admin/menu/${id}`,
    create: '/admin/menu',
    update: (id) => `/admin/menu/${id}`,
    delete: (id) => `/admin/menu/${id}`
  },
  
  // Restaurant Settings
  restaurant: {
    profile: '/admin/restaurant/profile',
    settings: '/admin/restaurant/settings',
    hours: '/admin/restaurant/hours'
  }
};

/**
 * Utility functions for common admin operations
 */
export const adminApiUtils = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: () => adminApi.get(adminEndpoints.stats.dashboard),
  
  /**
   * Get monthly revenue data
   */
  getMonthlyRevenue: () => adminApi.get(adminEndpoints.stats.revenue.monthly),
  
  /**
   * Get low stock items
   */
  getLowStockItems: () => adminApi.get(adminEndpoints.stats.inventory.lowStock),
  
  /**
   * Get performance statistics
   */
  getPerformanceStats: () => adminApi.get(adminEndpoints.stats.performance),
  
  /**
   * Get pending orders
   */
  getPendingOrders: () => adminApi.get(adminEndpoints.orders.pending),
  
  /**
   * Get ready for pickup orders
   */
  getReadyForPickupOrders: () => adminApi.get(adminEndpoints.orders.readyForPickup),
  
  /**
   * Mark order as ready for pickup
   */
  markOrderReady: (orderId) => adminApi.put(adminEndpoints.orders.markReady(orderId)),
  
  /**
   * Mark order as completed/picked up
   */
  markOrderCompleted: (orderId) => adminApi.put(adminEndpoints.orders.markCompleted(orderId)),
  
  /**
   * Get all menu items
   */
  getMenuItems: () => adminApi.get(adminEndpoints.menu.all),
  
  /**
   * Create new menu item
   */
  createMenuItem: (itemData) => adminApi.post(adminEndpoints.menu.create, itemData),
  
  /**
   * Update menu item
   */
  updateMenuItem: (itemId, itemData) => adminApi.put(adminEndpoints.menu.update(itemId), itemData),
  
  /**
   * Delete menu item
   */
  deleteMenuItem: (itemId) => adminApi.delete(adminEndpoints.menu.delete(itemId))
};

export default adminApi;