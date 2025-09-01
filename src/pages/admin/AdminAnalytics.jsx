import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Info } from 'lucide-react';

function AdminAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Insights and performance metrics (coming soon)</p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a placeholder page. We can connect to the existing stats endpoints
            or add more detailed reports in Phase 6.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Overview</CardTitle>
            <CardDescription>Summary charts will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-md flex items-center justify-center text-gray-500">
              Charts coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminAnalytics;

