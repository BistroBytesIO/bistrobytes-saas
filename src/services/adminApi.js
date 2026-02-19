import axios from 'axios';

/**
 * Admin API service with multi-tenant support
 * This service handles all admin-related API requests with proper tenant isolation
 */
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api',
  timeout: 30000, // 30 second timeout for admin operations
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const devLogging = !!import.meta.env?.DEV;

/**
 * Request interceptor to attach tenant ID and Authorization header.
 * Auth token is stored in sessionStorage (set during login) for cross-origin dev compatibility.
 * The HttpOnly cookie is also set server-side for same-origin production deployments.
 */
adminApi.interceptors.request.use(
  (config) => {
    try {
      // Get user data from localStorage (non-sensitive: email, role, tenantId — not the token)
      const userData = localStorage.getItem('restaurant_user');

      if (userData) {
        const user = JSON.parse(userData);

        // Attach tenant ID for multi-tenant requests
        if (user.tenantId) {
          config.headers['X-Tenant-Id'] = user.tenantId;
        }
      } else {
        console.warn('⚠️ No tenant context found for admin request');
      }

      // Attach JWT as Bearer token if not already set on this request.
      // This handles cross-origin scenarios where the HttpOnly cookie is not sent.
      if (!config.headers['Authorization']) {
        const jwt = sessionStorage.getItem('admin_jwt');
        if (jwt) {
          config.headers['Authorization'] = `Bearer ${jwt}`;
        }
      }

      // Log request for debugging
      if (devLogging) {
        console.debug('🚀 Admin API Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          tenantId: config.headers['X-Tenant-Id'],
          hasAuth: !!config.headers['Authorization']
        });
      }

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
    if (devLogging) {
      console.debug('✅ Admin API Response:', {
        method: response.config.method?.toUpperCase(),
        url: `${response.config.baseURL}${response.config.url}`,
        status: response.status,
        tenantId: response.config.headers['X-Tenant-Id']
      });
    }
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
  },

  // Custom Domains
  customDomains: {
    root: '/admin/custom-domains',
    verify: '/admin/custom-domains/verify',
    checkCertificate: '/admin/custom-domains/check-certificate'
  },

  // Category Management
  categories: {
    all: '/categories',
    byId: (id) => `/categories/${id}`,
    create: '/categories',
    update: (id) => `/categories/${id}`,
    delete: (id) => `/categories/${id}`
  }
};

/**
 * Utility functions for common admin operations
 */
export const adminApiUtils = {
  // Basic retry helper for transient failures (5xx/network)
  withRetry: async (fn, retries = 2, delayMs = 500) => {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn();
      } catch (error) {
        const status = error?.response?.status;
        const isTransient = !status || (status >= 500 && status < 600);
        if (attempt >= retries || !isTransient) throw error;
        attempt += 1;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  },
  /**
   * Get dashboard statistics
   */
  getDashboardStats: function () { return this.withRetry(() => adminApi.get(adminEndpoints.stats.dashboard)); },
  
  /**
   * Get monthly revenue data
   */
  getMonthlyRevenue: function () { return this.withRetry(() => adminApi.get(adminEndpoints.stats.revenue.monthly)); },
  
  /**
   * Get low stock items
   */
  getLowStockItems: function () { return this.withRetry(() => adminApi.get(adminEndpoints.stats.inventory.lowStock)); },
  
  /**
   * Get performance statistics
   */
  getPerformanceStats: function () { return this.withRetry(() => adminApi.get(adminEndpoints.stats.performance)); },
  
  /**
   * Get pending orders
   */
  getPendingOrders: function () { return this.withRetry(() => adminApi.get(adminEndpoints.orders.pending)); },
  
  /**
   * Get ready for pickup orders
   */
  getReadyForPickupOrders: function () { return this.withRetry(() => adminApi.get(adminEndpoints.orders.readyForPickup)); },
  
  /**
   * Mark order as ready for pickup
   */
  markOrderReady: function (orderId) { return this.withRetry(() => adminApi.put(adminEndpoints.orders.markReady(orderId))); },
  
  /**
   * Mark order as completed/picked up
   */
  markOrderCompleted: function (orderId) { return this.withRetry(() => adminApi.put(adminEndpoints.orders.markCompleted(orderId))); },
  
  /**
   * Get all menu items
   */
  getMenuItems: function () { return this.withRetry(() => adminApi.get(adminEndpoints.menu.all)); },
  
  /**
   * Create new menu item
   */
  createMenuItem: function (itemData) { return this.withRetry(() => adminApi.post(adminEndpoints.menu.create, itemData)); },
  
  /**
   * Update menu item
   */
  updateMenuItem: function (itemId, itemData) { return this.withRetry(() => adminApi.put(adminEndpoints.menu.update(itemId), itemData)); },
  
  /**
   * Delete menu item
   */
  deleteMenuItem: function (itemId) { return this.withRetry(() => adminApi.delete(adminEndpoints.menu.delete(itemId))); },

  /**
   * Upload menu item image
   */
  uploadMenuItemImage: function (itemId, file) {
    const formData = new FormData();
    formData.append('file', file);

    return adminApi.post(`/admin/menu/${itemId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000 // 60 seconds for large uploads
    });
  },

  /**
   * Delete menu item image
   */
  deleteMenuItemImage: function (itemId) {
    return this.withRetry(() => adminApi.delete(`/admin/menu/${itemId}/image`));
  },

  /**
   * Get all categories
   */
  getCategories: function () {
    return this.withRetry(() => adminApi.get(adminEndpoints.categories.all));
  },

  /**
   * Create new category
   */
  createCategory: function (categoryData) {
    return this.withRetry(() => adminApi.post(adminEndpoints.categories.create, categoryData));
  },

  /**
   * Update category
   */
  updateCategory: function (categoryId, categoryData) {
    return this.withRetry(() => adminApi.put(adminEndpoints.categories.update(categoryId), categoryData));
  },

  /**
   * Delete category
   */
  deleteCategory: function (categoryId) {
    return this.withRetry(() => adminApi.delete(adminEndpoints.categories.delete(categoryId)));
  }
};

// Settings utilities (Phase 4)
adminApiUtils.getRestaurantProfile = function () {
  return this.withRetry(() => adminApi.get(adminEndpoints.restaurant.profile));
};

adminApiUtils.updateRestaurantProfile = function (data) {
  return this.withRetry(() => adminApi.put(adminEndpoints.restaurant.profile, data));
};

adminApiUtils.getBusinessHours = function () {
  return this.withRetry(() => adminApi.get(adminEndpoints.restaurant.hours));
};

adminApiUtils.updateBusinessHours = function (data) {
  return this.withRetry(() => adminApi.put(adminEndpoints.restaurant.hours, data));
};

// Custom Domain utilities
adminApiUtils.getCustomDomain = function () {
  return this.withRetry(() => adminApi.get(adminEndpoints.customDomains.root));
};

adminApiUtils.saveCustomDomain = function (payload) {
  return this.withRetry(() => adminApi.post(adminEndpoints.customDomains.root, payload));
};

adminApiUtils.verifyCustomDomain = function () {
  return this.withRetry(() => adminApi.post(adminEndpoints.customDomains.verify));
};

adminApiUtils.disableCustomDomain = function () {
  return this.withRetry(() => adminApi.delete(adminEndpoints.customDomains.root));
};

adminApiUtils.deleteCustomDomain = function () {
  return this.withRetry(() => adminApi.delete(`${adminEndpoints.customDomains.root}/permanent`));
};

adminApiUtils.checkCertificateStatus = function () {
  return this.withRetry(() => adminApi.post(adminEndpoints.customDomains.checkCertificate));
};

// Clover OAuth Integration utilities
adminApiUtils.getCloverStatus = function () {
  return this.withRetry(() => adminApi.get('/admin/clover/oauth/status'));
};

adminApiUtils.initiateCloverOAuth = function () {
  return this.withRetry(() => adminApi.post('/admin/clover/oauth/authorize'));
};

adminApiUtils.refreshCloverToken = function () {
  return this.withRetry(() => adminApi.post('/admin/clover/oauth/refresh'));
};

adminApiUtils.disconnectClover = function () {
  return this.withRetry(() => adminApi.patch('/admin/clover/oauth/disconnect'));
};

adminApiUtils.testCloverConnection = function () {
  return this.withRetry(() => adminApi.post('/admin/clover/oauth/test'));
};

adminApiUtils.getCloverConfig = function () {
  return this.withRetry(() => adminApi.get('/admin/clover/oauth/config'));
};

adminApiUtils.updateRestaurantSettings = function (data) {
  return this.withRetry(() => adminApi.put(adminEndpoints.restaurant.settings, data));
};

adminApiUtils.getTenantConfig = function () {
  return this.withRetry(() => adminApi.get('/admin/tenant/config'));
};

// Clover Menu Sync utilities
adminApiUtils.syncCloverMenu = function () {
  return this.withRetry(() => adminApi.post('/admin/clover/oauth/sync/menu'));
};

adminApiUtils.syncCloverMenuItem = function (itemId) {
  return this.withRetry(() => adminApi.post(`/admin/clover/oauth/sync/item/${itemId}`));
};

adminApiUtils.getCloverMenuSyncStatus = function () {
  return this.withRetry(() => adminApi.get('/admin/clover/oauth/sync/status'));
};

// Square OAuth Integration utilities
adminApiUtils.getSquareStatus = function () {
  return this.withRetry(() => adminApi.get('/admin/square/oauth/status'));
};

adminApiUtils.initiateSquareOAuth = function () {
  return this.withRetry(() => adminApi.post('/admin/square/oauth/authorize'));
};

adminApiUtils.refreshSquareToken = function () {
  return this.withRetry(() => adminApi.post('/admin/square/oauth/refresh'));
};

adminApiUtils.disconnectSquare = function () {
  return this.withRetry(() => adminApi.delete('/admin/square/oauth/disconnect'));
};

adminApiUtils.testSquareConnection = function () {
  return this.withRetry(() => adminApi.post('/admin/square/oauth/test'));
};

adminApiUtils.getSquareConfig = function () {
  return this.withRetry(() => adminApi.get('/admin/square/oauth/config'));
};

// Stripe Connect OAuth utilities
adminApiUtils.getStripeStatus = function () {
  return this.withRetry(() => adminApi.get('/admin/stripe/oauth/status'));
};

adminApiUtils.initiateStripeOAuth = function () {
  return this.withRetry(() => adminApi.post('/admin/stripe/oauth/authorize'));
};

adminApiUtils.refreshStripeAccountInfo = function () {
  return this.withRetry(() => adminApi.post('/admin/stripe/oauth/refresh'));
};

adminApiUtils.disconnectStripe = function () {
  return this.withRetry(() => adminApi.patch('/admin/stripe/oauth/disconnect'));
};

adminApiUtils.testStripeConnection = function () {
  return this.withRetry(() => adminApi.post('/admin/stripe/oauth/test'));
};

adminApiUtils.getStripeConfig = function () {
  return this.withRetry(() => adminApi.get('/admin/stripe/oauth/config'));
};

// Square Menu Sync utilities (TODO: Phase 2)
adminApiUtils.syncSquareMenu = function () {
  return this.withRetry(() => adminApi.post('/admin/square/oauth/sync/menu'));
};

adminApiUtils.syncSquareMenuItem = function (itemId) {
  return this.withRetry(() => adminApi.post(`/admin/square/oauth/sync/item/${itemId}`));
};

adminApiUtils.getSquareMenuSyncStatus = function () {
  return this.withRetry(() => adminApi.get('/admin/square/oauth/sync/status'));
};

// Payment Configuration utilities
adminApiUtils.getPaymentConfig = function () {
  return this.withRetry(() => adminApi.get('/tenant/payments/config'));
};

adminApiUtils.updatePaymentProcessor = function (processor) {
  return this.withRetry(() => adminApi.put('/tenant/payments/processor', { processor }));
};

// Promo Code Management utilities (Professional/Enterprise tier feature)
adminApiUtils.getAllPromoCodes = function () {
  return this.withRetry(() => adminApi.get('/admin/promo-codes'));
};

adminApiUtils.getActivePromoCodes = function () {
  return this.withRetry(() => adminApi.get('/admin/promo-codes/active'));
};

adminApiUtils.getPromoCodeStats = function () {
  return this.withRetry(() => adminApi.get('/admin/promo-codes/stats'));
};

adminApiUtils.createPromoCode = function (promoCodeData) {
  return this.withRetry(() => adminApi.post('/admin/promo-codes', promoCodeData));
};

adminApiUtils.updatePromoCode = function (promoCodeId, promoCodeData) {
  return this.withRetry(() => adminApi.put(`/admin/promo-codes/${promoCodeId}`, promoCodeData));
};

adminApiUtils.togglePromoCodeStatus = function (promoCodeId) {
  return this.withRetry(() => adminApi.patch(`/admin/promo-codes/${promoCodeId}/toggle`));
};

adminApiUtils.deletePromoCode = function (promoCodeId) {
  return this.withRetry(() => adminApi.delete(`/admin/promo-codes/${promoCodeId}`));
};

adminApiUtils.validatePromoCode = function (validationData) {
  return this.withRetry(() => adminApi.post('/admin/promo-codes/validate', validationData));
};

// Fulfillment Type Configuration utilities
adminApiUtils.updateFulfillmentType = function (fulfillmentType) {
  return this.withRetry(() => adminApi.put('/admin/tenant/fulfillment-type', { fulfillmentType }));
};

export default adminApi;
