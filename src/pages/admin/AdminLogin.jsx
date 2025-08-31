import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

function AdminLogin() {
  const { login, user, isAuthenticated } = useRestaurantAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get tenant ID from URL params or state
  const tenantId = searchParams.get('tenantId') || location.state?.tenantId;
  const setupSuccess = searchParams.get('setup') === 'success';
  const fromPasswordSetup = location.state?.email;

  const [formData, setFormData] = useState({
    email: fromPasswordSetup || '',
    password: '',
    tenantId: tenantId || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTenantField, setShowTenantField] = useState(!tenantId);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Show success message if coming from password setup
  useEffect(() => {
    if (setupSuccess && location.state?.message) {
      toast.success(location.state.message);
    }
  }, [setupSuccess, location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.tenantId) {
      toast.error('Restaurant/Tenant ID is required');
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password, formData.tenantId);
      
      toast.success('Login successful! Welcome back.');
      
      // Redirect to the intended page or dashboard
      const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
      navigate(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials. Please check your email, password, and restaurant ID.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Restaurant Admin Login</CardTitle>
          <CardDescription>
            Sign in to manage your restaurant
          </CardDescription>
          
          {/* Success message for password setup */}
          {setupSuccess && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your admin account has been created successfully! Please log in below.
              </AlertDescription>
            </Alert>
          )}

          {/* Message from protected route */}
          {location.state?.message && !setupSuccess && (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {location.state.message}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Restaurant/Tenant ID Field */}
            {showTenantField && (
              <div className="space-y-2">
                <Label htmlFor="tenantId">Restaurant ID</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="tenantId"
                    name="tenantId"
                    type="text"
                    value={formData.tenantId}
                    onChange={handleInputChange}
                    placeholder="Your restaurant ID"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-600">
                  This was provided in your setup email
                </p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your admin email"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Sign In to Dashboard
                </>
              )}
            </Button>
          </form>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              <p className="mb-2">Need help accessing your account?</p>
              <div className="space-y-1">
                <p className="text-xs">• Check your setup email for your Restaurant ID</p>
                <p className="text-xs">• Make sure you've completed the password setup process</p>
                <p className="text-xs">• Contact support if you're still having issues</p>
              </div>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to BistroBytes Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLogin;