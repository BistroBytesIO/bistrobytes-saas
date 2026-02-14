import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, Lock, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { passwordValidation } from '@/utils/passwordValidation';
import { tokenValidation } from '@/utils/tokenValidation';

function PasswordSetupPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const tenantId = searchParams.get('tenantId'); // Get tenant ID from URL params

  const [formData, setFormData] = useState({
    email: email || '',
    password: '',
    confirmPassword: ''
  });
  
  const [validation, setValidation] = useState({
    password: { isValid: false, errors: [], strength: 0 },
    confirmPassword: { isValid: false, errors: [] }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const toastShownRef = useRef(false);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      // Clear any existing authentication data to prevent conflicts
      localStorage.removeItem('restaurant_user');
      localStorage.removeItem('restaurant_data');
      delete api.defaults.headers.common['X-Tenant-Id'];
      
      if (!token) {
        setTokenValid(false);
        setIsVerifyingToken(false);
        return;
      }

      // Check for required parameters
      if (!tenantId) {
        console.error('Missing tenant ID in setup URL');
        setTokenValid(false);
        setIsVerifyingToken(false);
        // Only show toast once
        if (!toastShownRef.current) {
          toast.error('Invalid setup link - missing tenant information');
          toastShownRef.current = true;
        }
        return;
      }

      try {
        // Verify setup token with backend (authoritative)
        const emailForVerification = (formData.email || email || '').trim();
        const tokenResult = await tokenValidation.verifyTokenWithBackend(
          token,
          tenantId,
          emailForVerification
        );

        if (!tokenResult.isValid) {
          setTokenValid(false);
          // Only show toast once
          if (!toastShownRef.current) {
            toast.error(tokenResult.error || 'Invalid setup token');
            toastShownRef.current = true;
          }
        } else {
          setTokenValid(true);
          if (tokenResult.email) {
            setFormData(prev => ({ ...prev, email: tokenResult.email }));
          }
          // Only show toast once
          if (!toastShownRef.current) {
            toast.success('Setup token verified successfully');
            toastShownRef.current = true;
          }
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
        // Only show toast once
        if (!toastShownRef.current) {
          toast.error('Failed to verify setup token');
          toastShownRef.current = true;
        }
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token, tenantId, email]);

  // Validate password in real-time
  useEffect(() => {
    const passwordResult = passwordValidation.validate(formData.password);
    setValidation(prev => ({ ...prev, password: passwordResult }));
  }, [formData.password]);

  // Validate confirm password in real-time
  useEffect(() => {
    const confirmPasswordErrors = [];
    let isValid = true;

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      confirmPasswordErrors.push('Passwords do not match');
      isValid = false;
    }

    setValidation(prev => ({
      ...prev,
      confirmPassword: { isValid, errors: confirmPasswordErrors }
    }));
  }, [formData.password, formData.confirmPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validation.password.isValid || !validation.confirmPassword.isValid) {
      toast.error('Please fix the password validation errors');
      return;
    }

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    setIsLoading(true);

    try {
      // Use the existing create-admin endpoint from AuthController with tenant header
      const response = await api.post('/auth/create-admin', {
        email: formData.email,
        password: formData.password
      }, {
        headers: {
          'X-Tenant-Id': tenantId || 'default', // Include tenant ID in request header
          'X-Setup-Token': token // Forward setup token for backend validation (when enabled)
        }
      });

      if (response.status === 200) {
        toast.success('Admin account created successfully!');
        
        // Cookie-based session: backend sets HttpOnly auth cookie on success.
        const userData = {
          email: response.data.email,
          role: response.data.role,
          tenantId: response.data.tenantId
        };

        localStorage.setItem('restaurant_user', JSON.stringify(userData));
        api.defaults.headers.common['X-Tenant-Id'] = userData.tenantId;

        setTimeout(() => {
          navigate('/admin/dashboard', { 
            state: { 
              message: 'Welcome! Your admin account has been created and you are now logged in.'
            }
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Password setup error:', error);
      
      if (error.response?.status === 409) {
        toast.error('An admin account with this email already exists');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to create admin account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthInfo = passwordValidation.getStrengthInfo(validation.password.strength);
  const strengthPercentage = (validation.password.strength / 5) * 100;

  // Loading state while verifying token
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Verifying setup token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-900">Invalid Setup Link</CardTitle>
            <CardDescription>
              This setup link is invalid or has expired. Please contact support for a new setup link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/')}
              className="w-full"
              variant="outline"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Set Up Your Admin Account</CardTitle>
          <CardDescription>
            Create a secure password for your restaurant management account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                  disabled={!!email} // Disable if email came from URL
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
                  placeholder="Create a strong password"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${getStrengthInfo.textColor}`}>
                      {getStrengthInfo.label}
                    </span>
                  </div>
                  <Progress value={strengthPercentage} className="h-2" />
                </div>
              )}

              {/* Password Validation Errors */}
              {validation.password.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validation.password.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirm Password Errors */}
              {validation.confirmPassword.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {validation.confirmPassword.errors[0]}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !validation.password.isValid || !validation.confirmPassword.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Admin Account
                </>
              )}
            </Button>
          </form>

          {/* Success Message */}
          <div className="mt-6 text-center text-sm text-gray-600">
            After creating your account, you'll be able to log in to manage your restaurant.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PasswordSetupPage;
