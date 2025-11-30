import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { adminApiUtils } from '@/services/adminApi';
import useWebSocket from '@/hooks/useWebSocket';
import soundService from '@/services/soundService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  CreditCard,
  Users,
  ShoppingBag,
  TrendingUp,
  Plus,
  AlertTriangle,
  BarChart3,
  Clock,
  RefreshCw,
  Star,
  Package,
  UtensilsCrossed,
  ArrowRight,
  Wifi,
  WifiOff,
  Tag
} from 'lucide-react';

function AdminDashboard() {
  const { user, getTenantId } = useRestaurantAuth();
  const navigate = useNavigate();
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    todayOrders: 0,
    totalRevenue: 0,
    popularItems: [],
    totalCustomers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Monthly revenue data for chart
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loadingMonthlyData, setLoadingMonthlyData] = useState(true);

  // Low stock inventory alerts
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loadingLowStock, setLoadingLowStock] = useState(true);

  // Performance statistics
  const [performanceStats, setPerformanceStats] = useState({
    averageOrderValue: 0,
    ordersByStatus: {},
    categoryPerformance: []
  });
  const [loadingPerformance, setLoadingPerformance] = useState(true);

  // Promo code statistics
  const [promoCodeStats, setPromoCodeStats] = useState({
    activePromoCodesCount: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0,
    topPerformingCode: null
  });
  const [loadingPromoCodeStats, setLoadingPromoCodeStats] = useState(true);

  const tenantId = getTenantId();

  // WebSocket configuration
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api';
  
  const handleWebSocketMessage = (notification) => {
    console.log('📥 AdminDashboard received WebSocket notification:', notification);
    
    // Handle different notification types
    if (notification.notificationType === 'NEW_ORDER') {
      // Refresh dashboard stats to show new order
      fetchDashboardStats();
      fetchPerformanceStats();
      
      // Show toast notification
      toast.success(
        `New Order #${notification.orderId} - $${notification.orderTotal}`,
        {
          duration: 5000,
          icon: '📋',
        }
      );
      
      // Play notification sound
      soundService.playChaChing();
    } else if (notification.notificationType === 'ORDER_STATUS_UPDATE') {
      // Update stats when order status changes
      fetchDashboardStats();
      fetchPerformanceStats();
    } else if (notification.notificationType === 'INVENTORY_LOW') {
      // Refresh low stock alerts
      fetchLowStockItems();
      
      toast.error(`Low stock alert: ${notification.itemName}`, {
        duration: 8000,
        icon: '⚠️',
      });
    }
  };

  const { isConnected, connectionError, testConnection } = useWebSocket(
    baseUrl,
    handleWebSocketMessage,
    true,
    tenantId
  );

  useEffect(() => {
    console.log('🚀 AdminDashboard component mounted');
    fetchAllData();
    
    // Set up periodic refresh every 5 minutes as fallback
    const interval = setInterval(() => {
      console.log('🔄 Periodic dashboard refresh');
      fetchAllData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchMonthlyRevenue(),
      fetchLowStockItems(),
      fetchPerformanceStats(),
      fetchPromoCodeStats()
    ]);
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const response = await adminApiUtils.getDashboardStats();
      setDashboardStats(response.data);
      console.log('✅ Dashboard stats loaded:', response.data);
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Use mock data if API fails
      setDashboardStats({
        todayOrders: 12,
        totalRevenue: 2450.50,
        popularItems: [{ name: 'Burger Deluxe', orders: 15 }],
        totalCustomers: 85,
      });
      toast.error('Failed to load dashboard statistics - using demo data');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMonthlyRevenue = async () => {
    setLoadingMonthlyData(true);
    try {
      const response = await adminApiUtils.getMonthlyRevenue();
      setMonthlyRevenue(response.data);
      console.log('✅ Monthly revenue loaded:', response.data);
    } catch (error) {
      console.error('❌ Error fetching monthly revenue:', error);
      // Use mock data if API fails
      setMonthlyRevenue([
        { month: 'Jan', revenue: 2400 },
        { month: 'Feb', revenue: 2800 },
        { month: 'Mar', revenue: 3200 },
        { month: 'Apr', revenue: 2900 },
        { month: 'May', revenue: 3400 },
        { month: 'Jun', revenue: 3800 }
      ]);
    } finally {
      setLoadingMonthlyData(false);
    }
  };

  const fetchLowStockItems = async () => {
    setLoadingLowStock(true);
    try {
      const response = await adminApiUtils.getLowStockItems();
      setLowStockItems(response.data);
      console.log('✅ Low stock items loaded:', response.data);
    } catch (error) {
      console.error('❌ Error fetching low stock items:', error);
      // Use mock data if API fails
      setLowStockItems([
        { id: 1, name: 'French Fries', stockQuantity: 5 },
        { id: 2, name: 'Chicken Wings', stockQuantity: 3 }
      ]);
    } finally {
      setLoadingLowStock(false);
    }
  };

  const fetchPerformanceStats = async () => {
    setLoadingPerformance(true);
    try {
      const response = await adminApiUtils.getPerformanceStats();
      setPerformanceStats(response.data);
      console.log('✅ Performance stats loaded:', response.data);
    } catch (error) {
      console.error('❌ Error fetching performance stats:', error);
      // Use mock data if API fails
      setPerformanceStats({
        averageOrderValue: 28.50,
        ordersByStatus: {
          'Pending': 8,
          'Ready': 3,
          'Completed': 45
        },
        categoryPerformance: [
          { name: 'Burgers', revenue: 1200, percentage: 35 },
          { name: 'Sides', revenue: 800, percentage: 23 },
          { name: 'Drinks', revenue: 600, percentage: 17 },
          { name: 'Desserts', revenue: 450, percentage: 13 },
          { name: 'Salads', revenue: 350, percentage: 12 }
        ]
      });
    } finally {
      setLoadingPerformance(false);
    }
  };

  const fetchPromoCodeStats = async () => {
    setLoadingPromoCodeStats(true);
    try {
      const response = await adminApiUtils.getPromoCodeStats();
      setPromoCodeStats(response.data);
      console.log('✅ Promo code stats loaded:', response.data);
    } catch (error) {
      console.error('❌ Error fetching promo code stats:', error);
      // Use default empty stats if API fails
      setPromoCodeStats({
        activePromoCodesCount: 0,
        totalRedemptions: 0,
        totalDiscountGiven: 0,
        topPerformingCode: null
      });
    } finally {
      setLoadingPromoCodeStats(false);
    }
  };

  // Colors for charts
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Here's what's happening with your restaurant today.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* WebSocket Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi size={16} />
                  <span className="text-sm font-medium">Live Updates</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff size={16} />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={fetchAllData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh Data
            </Button>
            <Button
              onClick={async () => {
                try {
                  const res = await testConnection();
                  if (res?.success) {
                    toast.success('WebSocket test message sent');
                  } else {
                    toast.error('WebSocket test failed');
                  }
                } catch (e) {
                  toast.error('WebSocket test failed');
                }
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Wifi size={16} />
              Test WS
            </Button>
          </div>
        </div>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div>
                <p className="font-medium">Real-time Updates Unavailable</p>
                <p className="text-sm">{connectionError}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Orders */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Today's Orders</p>
                  {loadingStats ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold">{dashboardStats.todayOrders}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  {loadingStats ? (
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold">
                      ${parseFloat(dashboardStats.totalRevenue || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Popular Item */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                  <Star size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Popular Item</p>
                  {loadingStats ? (
                    <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-lg font-bold truncate">
                      {dashboardStats.popularItems && dashboardStats.popularItems.length > 0
                        ? dashboardStats.popularItems[0].name
                        : 'No data'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Customers */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Customers</p>
                  {loadingStats ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold">{dashboardStats.totalCustomers}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common restaurant management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate('/admin/orders')}
                className="w-full justify-between" 
                variant="outline"
              >
                <div className="flex items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Pending Orders
                </div>
                <ArrowRight size={16} />
              </Button>
              <Button 
                onClick={() => navigate('/admin/menu')}
                className="w-full justify-between" 
                variant="outline"
              >
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Menu Item
                </div>
                <ArrowRight size={16} />
              </Button>
              <Button
                onClick={() => navigate('/admin/orders/ready')}
                className="w-full justify-between"
                variant="outline"
              >
                <div className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Ready for Pickup
                </div>
                <ArrowRight size={16} />
              </Button>
              <Button
                onClick={() => navigate('/admin/promo-codes')}
                className="w-full justify-between"
                variant="outline"
                disabled={user?.planType === 'BASIC'}
              >
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" />
                  Manage Promo Codes
                  {user?.planType === 'BASIC' && (
                    <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">
                      Pro
                    </Badge>
                  )}
                </div>
                <ArrowRight size={16} />
              </Button>
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
              {loadingLowStock ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-amber-800">
                          Only {item.stockQuantity} left in stock
                        </p>
                      </div>
                      <Badge className={item.stockQuantity <= 5 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                        {item.stockQuantity} left
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    onClick={() => navigate('/admin/menu')}
                    size="sm" 
                    className="w-full mt-3"
                    variant="outline"
                  >
                    Manage Inventory
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-green-600 text-center py-4">
                  All items are well-stocked! 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trends for the current year</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMonthlyData ? (
                <div className="h-64 flex items-center justify-center">
                  <ClipLoader color="#4F46E5" size={40} />
                </div>
              ) : monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No revenue data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue breakdown by menu categories</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerformance ? (
                <div className="h-64 flex items-center justify-center">
                  <ClipLoader color="#4F46E5" size={40} />
                </div>
              ) : performanceStats.categoryPerformance?.length > 0 ? (
                <div className="space-y-4">
                  {performanceStats.categoryPerformance.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-32 mr-4">
                        <p className="font-medium truncate">{category.name}</p>
                      </div>
                      <div className="flex-1">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-100">
                            <div
                              style={{
                                width: `${category.percentage}%`,
                                backgroundColor: chartColors[index % chartColors.length]
                              }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 w-16 text-right">
                        <p className="font-semibold">${parseFloat(category.revenue).toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No category data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Key performance metrics for your restaurant</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPerformance ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Average Order Value</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${parseFloat(performanceStats.averageOrderValue || 0).toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Orders by Status</p>
                  <div className="space-y-1">
                    {Object.entries(performanceStats.ordersByStatus || {}).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span className="text-green-700">{status}:</span>
                        <span className="font-bold text-green-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">Top Categories</p>
                  <div className="space-y-1">
                    {performanceStats.categoryPerformance?.slice(0, 3).map((category, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-purple-700 truncate mr-2">{category.name}:</span>
                        <span className="font-bold text-purple-800">{category.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promo Code Performance */}
        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50/50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-600" />
                Promo Code Performance
              </div>
              {user?.planType === 'BASIC' && (
                <Badge className="bg-purple-100 text-purple-800">
                  Professional Feature
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Active promotions and redemption analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.planType === 'BASIC' ? (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upgrade to Professional
                </h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Create unlimited promo codes, track redemptions, and boost customer engagement with targeted discounts.
                </p>
                <Button onClick={() => navigate('/admin/subscription')} className="bg-purple-600 hover:bg-purple-700">
                  Upgrade Now
                </Button>
              </div>
            ) : loadingPromoCodeStats ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 mb-1">Active Codes</p>
                    <p className="text-2xl font-bold text-green-700">
                      {promoCodeStats.activePromoCodesCount || 0}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">Total Redemptions</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {promoCodeStats.totalRedemptions || 0}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 mb-1">Discount Given</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ${parseFloat(promoCodeStats.totalDiscountGiven || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {promoCodeStats.topPerformingCode && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-4 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Top Performing Code</p>
                        <p className="text-xl font-bold text-gray-900">{promoCodeStats.topPerformingCode.code}</p>
                        <p className="text-sm text-gray-600">
                          {promoCodeStats.topPerformingCode.usageCount} redemptions •
                          ${parseFloat(promoCodeStats.topPerformingCode.totalDiscount || 0).toFixed(2)} total discount
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/admin/promo-codes')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Manage Promo Codes
                  </Button>
                  <Button
                    onClick={() => navigate('/admin/promo-codes?create=true')}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
