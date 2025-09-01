import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  AlertTriangle,
  BarChart3,
  Clock
} from 'lucide-react';

function AdminDashboard() {
  // Placeholder data - will be replaced with real API calls in Phase 3
  const dashboardStats = {
    todayOrders: 12,
    totalRevenue: 2450.50,
    totalCustomers: 85,
    popularItems: [
      { name: 'Burger Deluxe', orders: 15 }
    ]
  };

  const lowStockItems = [
    { id: 1, name: 'French Fries', stockQuantity: 5 },
    { id: 2, name: 'Chicken Wings', stockQuantity: 3 }
  ];

  return (
    <AdminLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
        <p className="text-gray-600">Here's what's happening with your restaurant today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Orders</p>
                <p className="text-2xl font-bold">{dashboardStats.todayOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${dashboardStats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Popular Item</p>
                <p className="text-lg font-bold truncate">
                  {dashboardStats.popularItems?.[0]?.name || 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">{dashboardStats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common restaurant management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Pending Orders
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Menu Item
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Update Business Hours
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Inventory Alerts
            </CardTitle>
            <CardDescription>Items running low on stock</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-amber-800">
                        Only {item.stockQuantity} left in stock
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                All items are well-stocked! 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue for the current year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Revenue chart will be implemented in Phase 3</p>
              <p className="text-sm text-gray-400">Using recharts for data visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Status */}
      <Card>
        <CardHeader>
          <CardTitle>🚧 Migration Status</CardTitle>
          <CardDescription>Admin dashboard migration progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Phase 1: Authentication System</span>
              <span className="text-sm text-green-600 font-medium">✅ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Phase 2: Admin Layout & Navigation</span>
              <span className="text-sm text-blue-600 font-medium">🔄 In Progress</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Phase 3: Core Features Migration</span>
              <span className="text-sm text-gray-500 font-medium">⏳ Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default AdminDashboard;