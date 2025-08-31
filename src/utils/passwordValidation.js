/**
 * Password validation utilities for admin account setup
 */

export const passwordValidation = {
  minLength: 8,
  maxLength: 128,
  
  /**
   * Validate password strength
   * @param {string} password - The password to validate
   * @returns {Object} validation result with isValid boolean and errors array
   */
  validate: (password) => {
    const errors = [];
    
    if (!password || password.length === 0) {
      errors.push('Password is required');
      return { isValid: false, errors, strength: 0 };
    }
    
    if (password.length < passwordValidation.minLength) {
      errors.push(`Password must be at least ${passwordValidation.minLength} characters long`);
    }
    
    if (password.length > passwordValidation.maxLength) {
      errors.push(`Password must be no more than ${passwordValidation.maxLength} characters long`);
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Calculate strength score
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: Math.min(strength, 5) // Max strength of 5
    };
  },
  
  /**
   * Get strength description
   * @param {number} strength - Strength score (0-5)
   * @returns {Object} strength info with label and color
   */
  getStrengthInfo: (strength) => {
    const strengthMap = {
      0: { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
      1: { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
      2: { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-600' },
      3: { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
      4: { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' },
      5: { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' }
    };
    
    return strengthMap[strength] || strengthMap[0];
  }
};

/**
 * Token validation utilities
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
  }
};