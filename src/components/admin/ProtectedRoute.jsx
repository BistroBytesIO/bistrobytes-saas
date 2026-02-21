import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Protected Route component for admin sections
 * Ensures user is authenticated and has proper permissions
 */
const ProtectedRoute = ({ 
  children, 
  requireRole = 'ROLE_ADMIN', 
  redirectTo = '/admin/login' 
}) => {
  const { user, isAuthenticated, isLoading, hasRole, validateSession, logout } = useRestaurantAuth();
  const location = useLocation();

  // Validate session on route access and logout if the backend no longer recognises it
  // (e.g. after a server restart). Calling logout() clears user state which causes the
  // Navigate below to fire and send the user back to the login screen.
  useEffect(() => {
    if (isAuthenticated && user) {
      validateSession().then((isValid) => {
        if (!isValid) {
          logout();
        }
      });
    }
  }, [isAuthenticated, user, validateSession, logout]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: 'Please log in to access the admin dashboard.' 
        }} 
        replace 
      />
    );
  }

  // Check role permissions if required
  if (requireRole && !hasRole(requireRole)) {
    return (
      <Navigate 
        to="/admin/unauthorized" 
        state={{ 
          from: location,
          message: 'You do not have permission to access this page.' 
        }} 
        replace 
      />
    );
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;