import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Check, Clock, ExternalLink, Mail, Settings } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

const SignupSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [sessionId] = useState(searchParams.get('session_id'));
  const [buildStatus, setBuildStatus] = useState('processing'); // processing, provisioned, error
  const [progress, setProgress] = useState(10);
  const [tenantSlug, setTenantSlug] = useState('');
  const [domain, setDomain] = useState('');


  useEffect(() => {
    let poll;
    const pollStatus = async () => {
      try {
        if (!sessionId) return;
        const res = await api.get(`/subscriptions/checkout-result`, { params: { session_id: sessionId } });
        const { status, tenantSlug, domain } = res.data || {};
        if (tenantSlug) setTenantSlug(tenantSlug);
        if (domain) setDomain(domain);
        setBuildStatus(status || 'processing');
        setProgress((p) => (p < 95 ? p + 5 : p));
        if (status !== 'provisioned') return; // keep polling until ready
        clearInterval(poll);
        setProgress(100);
      } catch (e) {
        // keep polling, but cap progress
        setProgress((p) => (p < 90 ? p + 2 : p));
      }
    };
    // initial call and poll every 1.5s
    pollStatus();
    poll = setInterval(pollStatus, 1500);
    return () => clearInterval(poll);
  }, [sessionId]);

  // Generate a simple random token for setup links (dev convenience)
  const setupToken = useMemo(() => {
    const bytes = new Uint8Array(24);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''); // 48 hex chars
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <img
              src="/BizBytes Logo.png"
              alt="BizBytes logo"
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              {buildStatus !== 'provisioned' ? (
                <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
              ) : (
                <Check className="h-8 w-8 text-green-600" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {buildStatus === 'processing' ? 'Payment Successful!' : 'Welcome to BizBytes!'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
              {buildStatus !== 'provisioned' ? (
              <div className="text-center space-y-6" aria-live="polite">
                <p className="text-lg text-gray-600">
                  Thank you for your payment! We're now creating your custom restaurant website.
                </p>
                <div className="space-y-3">
                  <Progress value={progress} />
                  <p className="text-blue-700">Provisioning your tenant and building your site…</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <Alert variant="success">
                    <AlertTitle className="flex items-center gap-2"><Check className="h-4 w-4" /> Payment processed</AlertTitle>
                    <AlertDescription>Subscription activated successfully</AlertDescription>
                  </Alert>
                  <Alert variant="info">
                    <AlertTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Creating website</AlertTitle>
                    <AlertDescription>Building your custom site</AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Setup email</AlertTitle>
                    <AlertDescription>Instructions incoming</AlertDescription>
                  </Alert>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Restaurant is Ready! 🎉</h2>
                  <p className="text-gray-600">
                    Your custom restaurant website has been created and is now live.
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="font-medium text-green-900 mb-4">Next Steps</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Check your email</p>
                        <p className="text-sm text-green-700">Login credentials and setup guide sent</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <ExternalLink className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Visit your website</p>
                        <p className="text-sm text-green-700">Your site is live and ready for customers</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Settings className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Customize your site</p>
                        <p className="text-sm text-green-700">Add your menu, connect POS, and go live</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={
                      // Always use localhost during development
                      import.meta.env.DEV || window.location.hostname === 'localhost'
                        ? `http://${tenantSlug || 'demo'}.localhost:5173`
                        : domain 
                          ? `https://${domain}`
                          : `${window.location.protocol}//${tenantSlug || 'demo'}.localhost:5173`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Your Website
                  </a>
                  <Link
                    to={`/admin/setup-password/${setupToken}?tenantId=${encodeURIComponent(tenantSlug || '')}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Set Up Admin Access
                  </Link>
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Settings
                  </Link>
                </div>
              </div>
            )}
            
            {sessionId && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <strong>Session:</strong>
                  <Badge variant="outline">{sessionId.slice(0, 16)}…</Badge>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Save this for your records. Contact support if you need assistance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupSuccessPage;
