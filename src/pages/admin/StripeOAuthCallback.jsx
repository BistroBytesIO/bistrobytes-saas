import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

function StripeOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useRestaurantAuth();

  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Stripe authorization...');
  const [details, setDetails] = useState(null);
  const hasProcessedRef = useRef(false);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    const processCallback = async () => {
      if (hasProcessedRef.current) {
        console.log('Already processed Stripe callback, skipping duplicate attempt');
        return;
      }

      hasProcessedRef.current = true;

      if (error) {
        console.error('Stripe OAuth error:', error, errorDescription);
        setStatus('error');
        setMessage(errorDescription || `Stripe OAuth error: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Missing authorization code from Stripe');
        return;
      }

      let authToken = user?.token;
      let tenantId = user?.tenantId;

      if (!authToken || !tenantId) {
        console.log('No auth context - checking localStorage for credentials...');
        const storedUser = localStorage.getItem('restaurant_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            authToken = parsedUser.token;
            tenantId = parsedUser.tenantId || parsedUser.tenant_id;
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }
      }

      if (!authToken || !tenantId) {
        console.error('No authentication credentials available');
        setStatus('error');
        setMessage('Session expired. Please log in and try connecting Stripe again.');

        setTimeout(() => {
          window.close();
          if (!window.closed) {
            navigate('/admin/login');
          }
        }, 3000);
        return;
      }

      try {
        setMessage('Completing Stripe authorization...');

        const response = await axios.get('/admin/stripe/oauth/callback', {
          params: {
            code,
            state
          },
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-Tenant-Id': tenantId,
            'Content-Type': 'application/json'
          },
          baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api'
        });

        if (response.data.success) {
          setStatus('success');
          setMessage('Successfully connected to Stripe!');
          setDetails({
            stripeUserId: response.data.stripeUserId,
            accountBusinessName: response.data.accountBusinessName,
            accountEmail: response.data.accountEmail
          });

          toast.success('Stripe account connected successfully!');
          localStorage.setItem('stripe_oauth_success', Date.now().toString());

          if (window.opener) {
            try {
              window.opener.postMessage({ type: 'STRIPE_OAUTH_SUCCESS', data: response.data }, window.location.origin);
            } catch (e) {
              console.error('Failed to notify opener window:', e);
            }

            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            setTimeout(() => {
              navigate('/admin/settings?tab=stripe', { replace: true });
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Failed to complete Stripe OAuth authorization');
        }
      } catch (error) {
        console.error('Stripe OAuth callback processing error:', error);

        let errorMessage = 'Failed to process Stripe OAuth callback';
        if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in and try again.';
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid Stripe OAuth request';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = `Connection error: ${error.message}`;
        }

        setStatus('error');
        setMessage(errorMessage);
        toast.error('Failed to connect Stripe account');
      }
    };

    processCallback();
  }, [code, state, error, errorDescription, user, navigate]);

  const handleRetry = () => {
    navigate('/admin/settings?tab=stripe', { replace: true });
  };

  const handleGoToSettings = () => {
    navigate('/admin/settings?tab=stripe', { replace: true });
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
          <CardTitle>
            {status === 'processing' && 'Connecting to Stripe'}
            {status === 'success' && 'Stripe Connected'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && details && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                <div className="space-y-1">
                  <p><strong>Account ID:</strong> {details.stripeUserId}</p>
                  <p><strong>Business:</strong> {details.accountBusinessName || 'N/A'}</p>
                  <p><strong>Email:</strong> {details.accountEmail || 'N/A'}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {message}
                </AlertDescription>
              </Alert>
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center text-sm text-gray-600">
              Please wait while we finalize your Stripe connection...
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Button variant="ghost" onClick={handleGoToSettings}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StripeOAuthCallback;
