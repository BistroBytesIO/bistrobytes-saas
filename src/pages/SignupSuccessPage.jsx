import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Check, Clock, ExternalLink, Mail, Settings } from 'lucide-react';

const SignupSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [sessionId] = useState(searchParams.get('session_id'));
  const [buildStatus, setBuildStatus] = useState('processing'); // processing, completed, failed

  useEffect(() => {
    // You could poll for build status here
    // For now, we'll simulate a delay and set to completed
    const timer = setTimeout(() => {
      setBuildStatus('completed');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BistroBytes
            </span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              {buildStatus === 'processing' ? (
                <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
              ) : (
                <Check className="h-8 w-8 text-green-600" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {buildStatus === 'processing' ? 'Payment Successful!' : 'Welcome to BistroBytes!'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {buildStatus === 'processing' ? (
              <div className="text-center space-y-4">
                <p className="text-lg text-gray-600">
                  Thank you for your payment! We're now creating your custom restaurant website.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-lg font-medium text-blue-900">Building Your Website...</span>
                  </div>
                  <p className="text-blue-700">
                    This process typically takes 2-3 minutes. Please don't close this page.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-3">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">Payment Processed</h3>
                    <p className="text-sm text-gray-600">Subscription activated successfully</p>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-3">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">Creating Website</h3>
                    <p className="text-sm text-gray-600">Building your custom site</p>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mx-auto mb-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">Setup Email</h3>
                    <p className="text-sm text-gray-600">Instructions incoming</p>
                  </div>
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
                    href="https://your-restaurant.bistrobytes.app" // This would be dynamic
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Your Website
                  </a>
                  <Link
                    to="/dashboard"
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
                <p className="text-sm text-gray-600">
                  <strong>Session ID:</strong> {sessionId}
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