import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Home, Mail } from 'lucide-react';

function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message || 'You do not have permission to access this page.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>This could be because:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>You don't have the required admin permissions</li>
              <li>Your session may have expired</li>
              <li>You're trying to access a restricted area</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <Button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>

            <Button
              onClick={() => navigate('/admin/login')}
              variant="ghost"
              className="w-full"
            >
              Sign In Again
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Need help?</p>
              <Button variant="link" size="sm" className="text-xs">
                <Mail className="mr-1 h-3 w-3" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Unauthorized;