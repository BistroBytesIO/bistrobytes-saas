import api from '@/lib/api';

/**
 * Token validation utilities for password setup
 */

export const tokenValidation = {
  /**
   * Validate setup token format and expiration
   * @param {string} token - The setup token
   * @returns {Object} validation result
   */
  validateToken: (token) => {
    if (!token || typeof token !== 'string') {
      return { isValid: false, error: 'Invalid token format' };
    }
    
    // Basic token format validation (adjust based on backend implementation)
    if (token.length < 32) {
      return { isValid: false, error: 'Token too short' };
    }
    
    // Additional validation can be added here based on token structure
    return { isValid: true };
  },
  
  /**
   * Extract information from token if needed
   * @param {string} token - The setup token
   * @returns {Object} extracted info or null
   */
  parseToken: (token) => {
    // This would depend on how the backend generates tokens
    // For now, just return basic validation
    const validation = tokenValidation.validateToken(token);
    return validation.isValid ? { token } : null;
  },
  
  /**
   * Verify token with backend (placeholder for future implementation)
   * @param {string} token - The setup token
   * @returns {Promise<Object>} validation result
   */
  verifyTokenWithBackend: async (token, tenantId, email) => {
    const local = tokenValidation.validateToken(token);
    if (!local.isValid) {
      return local;
    }

    try {
      const response = await api.post('/auth/verify-setup-token', {
        token,
        tenantId,
        email
      });

      return {
        isValid: !!response?.data?.valid,
        email: response?.data?.email,
        error: response?.data?.error
      };
    } catch (error) {
      return {
        isValid: false,
        error: error?.response?.data?.error || 'Token verification failed'
      };
    }
  }
};
