import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

function CloverOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useRestaurantAuth();

  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing Clover authorization...');
  const [details, setDetails] = useState(null);
  const hasProcessedRef = useRef(false); // Use ref to prevent duplicate processing across renders

  // Get OAuth parameters from URL
  const code = searchParams.get('code');
  const merchantId = searchParams.get('merchant_id');  
  const employeeId = searchParams.get('employee_id');
  const clientId = searchParams.get('client_id');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    const processCallback = async () => {
      // Prevent duplicate processing using ref
      if (hasProcessedRef.current) {
        console.log('Already processed callback, skipping duplicate attempt');
        return;
      }

      // Mark as processed immediately to prevent race conditions
      hasProcessedRef.current = true;

      // Check for OAuth errors first
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        setStatus('error');
        setMessage(errorDescription || `OAuth error: ${error}`);
        return;
      }

      // Validate required parameters
      if (!code) {
        setStatus('error');
        setMessage('Missing authorization code from Clover');
        return;
      }

      if (!merchantId) {
        setStatus('error');
        setMessage('Missing merchant ID from Clover');
        return;
      }

      // Get auth credentials - try context first, then fallback to localStorage
      // This handles the case where Clover opens callback in a new tab
      let authToken = user?.token;
      let tenantId = user?.tenantId;

      if (!authToken || !tenantId) {
        console.log('No auth context - checking localStorage for credentials...');

        // Fallback to localStorage (for new tab scenario)
        const storedUser = localStorage.getItem('restaurant_user');

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            authToken = parsedUser.token;
            tenantId = parsedUser.tenantId || parsedUser.tenant_id;
            console.log('Found stored credentials in localStorage - token:', authToken ? 'present' : 'missing', 'tenantId:', tenantId);
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        } else {
          console.error('No restaurant_user found in localStorage');
        }
      }

      // If we still don't have credentials, user needs to log in
      if (!authToken || !tenantId) {
        console.error('No authentication credentials available');
        setStatus('error');
        setMessage('Session expired. Please log in and try connecting Clover again.');

        // Close this tab after a delay and redirect user to login
        setTimeout(() => {
          window.close(); // Try to close the popup/tab
          // If close doesn't work, redirect to login
          if (!window.closed) {
            navigate('/admin/login');
          }
        }, 3000);

        return;
      }

      try {
        setMessage('Completing Clover authorization...');
        console.log('Making callback request with token:', authToken ? 'present' : 'missing', 'tenantId:', tenantId);

        // Make request to our OAuth callback endpoint
        const response = await axios.get('/admin/clover/oauth/callback', {
          params: {
            code,
            merchant_id: merchantId,
            employee_id: employeeId,
            client_id: clientId,
            state
          },
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-Tenant-Id': tenantId,
            'Content-Type': 'application/json'
          },
          // Ensure default includes '/api' for consistency with backend routing
          baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api'
        });

        console.log('OAuth callback response:', response.data);

        if (response.data.success) {
          setStatus('success');
          setMessage('Successfully connected to Clover POS!');
          setDetails({
            merchantId: response.data.merchantId,
            merchantName: response.data.merchantName,
            tenantSlug: response.data.tenantSlug
          });

          toast.success('Clover POS connected successfully!');

          // Notify other tabs/windows about successful connection
          localStorage.setItem('clover_oauth_success', Date.now().toString());

          // Check if we're in a popup/new tab (opened by OAuth flow)
          if (window.opener) {
            // This is a popup - notify the opener and close
            try {
              window.opener.postMessage({ type: 'CLOVER_OAUTH_SUCCESS', data: response.data }, window.location.origin);
            } catch (e) {
              console.error('Failed to notify opener window:', e);
            }

            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            // Regular navigation
            setTimeout(() => {
              navigate('/admin/settings?tab=clover', { replace: true });
            }, 3000);
          }

        } else {
          setStatus('error');
          setMessage(response.data.error || 'Failed to complete OAuth authorization');
        }

      } catch (error) {
        console.error('OAuth callback processing error:', error);

        let errorMessage = 'Failed to process OAuth callback';

        // Check if this is an app not installed error
        if (error.response?.status === 409 && error.response?.data?.appNotInstalled) {
          errorMessage = 'Please install the BizBytes app from Clover App Market first, then try connecting again.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in and try again.';
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid OAuth request';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = `Connection error: ${error.message}`;
        }

        setStatus('error');
        setMessage(errorMessage);
        toast.error('Failed to connect to Clover POS');
      }
    };

    processCallback();
  }, [code, merchantId, state, error, errorDescription, user, navigate]);

  const handleRetry = () => {
    navigate('/admin/settings?tab=clover', { replace: true });
  };

  const handleGoToSettings = () => {
    navigate('/admin/settings?tab=clover', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full">
            {status === 'processing' && (
              <div className="bg-blue-100">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'processing' && 'Connecting to Clover...'}
            {status === 'success' && 'Connection Successful!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>

          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && details && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your Clover POS is now connected and ready for menu synchronization.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Merchant Name:</label>
                  <div className="text-gray-600">{details.merchantName}</div>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Merchant ID:</label>
                  <div className="text-gray-600 font-mono">{details.merchantId}</div>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 mb-3">
                  Redirecting to settings in a few seconds...
                </p>
                <Button 
                  onClick={handleGoToSettings}
                  className="w-full"
                >
                  Go to Settings Now
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button 
                  onClick={handleRetry}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Settings
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                <p className="font-medium">Troubleshooting tips:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Make sure you're logged in to your Clover account</li>
                  <li>Ensure your Clover merchant account is active</li>
                  <li>Try the connection process again from Settings</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                This may take a few moments...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CloverOAuthCallback;
