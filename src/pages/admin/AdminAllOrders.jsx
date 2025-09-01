import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

function AdminAllOrders() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <p className="text-gray-600">Unified view of order history across statuses.</p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This page is a placeholder. In Phase 4/5 we will wire it to backend
            pagination and filters to browse all orders.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              We’ll add search, advanced filters, and pagination here.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminAllOrders;

