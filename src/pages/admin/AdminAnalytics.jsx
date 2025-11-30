import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  Lock,
  Crown,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  Tag,
  TrendingDown,
  Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApiUtils } from '@/services/adminApi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState('BASIC');
  const [dashboardStats, setDashboardStats] = useState({
    todayOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    popularItems: []
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({
    averageOrderValue: 0,
    ordersByStatus: {},
    categoryPerformance: []
  });
  const [reportPreferences, setReportPreferences] = useState({
    recipientEmail: '',
    dailyReportsEnabled: false,
    weeklyReportsEnabled: false,
    lastDailyReportSent: null,
    lastWeeklyReportSent: null
  });
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [promoCodeStats, setPromoCodeStats] = useState({
    activePromoCodesCount: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0,
    topPerformingCode: null,
    topPerformingCodes: []
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch profile to get plan type
      const profileResponse = await adminApiUtils.getRestaurantProfile();
      const currentPlanType = profileResponse?.data?.planType || 'BASIC';
      setPlanType(currentPlanType);

      // Only fetch analytics data if on Professional or Enterprise plan
      if (currentPlanType !== 'BASIC') {
        const [dashboardRes, monthlyRes, performanceRes] = await Promise.all([
          fetch('/api/admin/stats/dashboard', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')).token : ''}`,
              'X-Tenant-Id': localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')).tenantId : ''
            }
          }),
          fetch('/api/admin/stats/revenue/monthly', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')).token : ''}`,
              'X-Tenant-Id': localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')).tenantId : ''
            }
          }),
          fetch('/api/admin/stats/performance', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')).token : ''}`,
              'X-Tenant-Id': localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')).tenantId : ''
            }
          })
        ]);

        const dashboardData = await dashboardRes.json();
        const monthlyData = await monthlyRes.json();
        const performanceData = await performanceRes.json();

        setDashboardStats(dashboardData);
        setMonthlyRevenue(monthlyData.map(item => ({
          month: item.month,
          revenue: parseFloat(item.revenue || 0)
        })));
        setPerformanceStats(performanceData);

        // Fetch report preferences
        await fetchReportPreferences();

        // Fetch promo code statistics
        await fetchPromoCodeStats();
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportPreferences = async () => {
    try {
      const user = localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')) : null;
      if (!user) return;

      const response = await fetch('/api/admin/report-preferences', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'X-Tenant-Id': user.tenantId
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setReportPreferences(data.data);
      }
    } catch (error) {
      console.error('Error fetching report preferences:', error);
    }
  };

  const fetchPromoCodeStats = async () => {
    try {
      const response = await adminApiUtils.getPromoCodeStats();
      if (response.data) {
        setPromoCodeStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching promo code stats:', error);
      // Don't show error toast for promo codes as it's an optional feature
    }
  };

  const saveReportPreferences = async () => {
    try {
      setSavingPreferences(true);
      const user = localStorage.getItem('restaurant_user') ? JSON.parse(localStorage.getItem('restaurant_user')) : null;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      const response = await fetch('/api/admin/report-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'X-Tenant-Id': user.tenantId
        },
        body: JSON.stringify(reportPreferences)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Report preferences saved successfully');
        setReportPreferences(data.data);
      } else {
        toast.error(data.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving report preferences:', error);
      toast.error('Failed to save report preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  // Show upgrade prompt if on BASIC plan
  if (planType === 'BASIC') {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Real-time business insights and performance metrics</p>
          </div>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-6 py-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full p-6">
                    <Lock className="h-12 w-12 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Premium Feature: Real-time Analytics
                    </h2>
                  </div>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Unlock powerful business insights to grow your restaurant with data-driven decisions
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 w-full max-w-3xl text-left">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Revenue Analytics</h3>
                        <p className="text-sm text-gray-600">Track daily, weekly, and monthly revenue trends with beautiful charts</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
                        <p className="text-sm text-gray-600">Monitor average order value, order status, and operational efficiency</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Menu Insights</h3>
                        <p className="text-sm text-gray-600">Discover top-selling items and category performance</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Customer Analytics</h3>
                        <p className="text-sm text-gray-600">Understand customer behavior and growth patterns</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={() => navigate('/admin/settings?tab=billing')}
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Upgrade to Professional - $159/month
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </div>

                <p className="text-sm text-gray-500">
                  Join hundreds of restaurants making data-driven decisions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Show analytics dashboard for Professional and Enterprise plans
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Transform orders by status for chart
  const orderStatusData = Object.entries(performanceStats.ordersByStatus || {}).map(([status, count]) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    value: count,
    count: count
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Real-time business insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">
              {planType === 'PREMIUM' ? 'Professional' : 'Enterprise'} Plan
            </span>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Revenue */}
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${parseFloat(dashboardStats.totalRevenue || 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All-time total revenue
              </p>
            </CardContent>
          </Card>

          {/* Today's Orders */}
          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Orders
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardStats.todayOrders || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Orders placed today
              </p>
            </CardContent>
          </Card>

          {/* Total Customers */}
          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Customers
              </CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalCustomers || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Unique customers all-time
              </p>
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Order Value
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${parseFloat(performanceStats.averageOrderValue || 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Average per order
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Monthly Revenue Trend
              </CardTitle>
              <CardDescription>Revenue performance over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-green-600" />
                Orders by Status
              </CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Category Performance
              </CardTitle>
              <CardDescription>Revenue breakdown by menu category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performanceStats.categoryPerformance || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                  >
                    {(performanceStats.categoryPerformance || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value}% ($${parseFloat(props.payload.revenue || 0).toFixed(2)})`,
                      props.payload.name
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Top Selling Items
            </CardTitle>
            <CardDescription>Your most popular menu items</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardStats.popularItems && dashboardStats.popularItems.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.popularItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        <span className="font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Orders: {item.count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No sales data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promo Code Analytics */}
        {(promoCodeStats.activePromoCodesCount > 0 || promoCodeStats.totalRedemptions > 0) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="h-6 w-6 text-green-600" />
                  Promo Code Performance
                </h2>
                <p className="text-sm text-gray-600">Track discount usage and savings impact</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/promo-codes')}
                className="flex items-center gap-2"
              >
                <Tag className="h-4 w-4" />
                Manage Codes
              </Button>
            </div>

            {/* Promo Code Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Active Codes */}
              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active Codes
                  </CardTitle>
                  <Tag className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {promoCodeStats.activePromoCodesCount || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Currently available for customers
                  </p>
                </CardContent>
              </Card>

              {/* Total Redemptions */}
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Redemptions
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {promoCodeStats.totalRedemptions || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    All-time promo code uses
                  </p>
                </CardContent>
              </Card>

              {/* Total Discount Given */}
              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Savings Given
                  </CardTitle>
                  <Percent className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    ${parseFloat(promoCodeStats.totalDiscountGiven || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Customer savings all-time
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Promo Codes */}
            {promoCodeStats.topPerformingCodes && promoCodeStats.topPerformingCodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Top Performing Promo Codes
                  </CardTitle>
                  <CardDescription>Most used discount codes and their impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {promoCodeStats.topPerformingCodes.slice(0, 5).map((code, index) => (
                      <div
                        key={code.promoCodeId}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            index === 0 ? 'bg-green-100 text-green-700' :
                            index === 1 ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            <span className="font-bold">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              <Tag className="h-4 w-4 text-green-600" />
                              {code.code}
                            </p>
                            <p className="text-sm text-gray-500">
                              {code.usageCount} {code.usageCount === 1 ? 'redemption' : 'redemptions'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${parseFloat(code.totalDiscount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Avg: ${parseFloat(code.averageDiscount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Promo Code Performance Chart */}
            {promoCodeStats.topPerformingCodes && promoCodeStats.topPerformingCodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Redemption Comparison
                  </CardTitle>
                  <CardDescription>Usage frequency across promo codes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={promoCodeStats.topPerformingCodes.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="code"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'usageCount') return [value, 'Redemptions'];
                          return [value, name];
                        }}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="usageCount"
                        fill="#10B981"
                        radius={[8, 8, 0, 0]}
                        name="Redemptions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Automated Email Reports Settings */}
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Automated Email Reports
            </CardTitle>
            <CardDescription>
              Schedule daily and weekly analytics reports to be delivered to your inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Address Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Recipient Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={reportPreferences.recipientEmail || ''}
                onChange={(e) => setReportPreferences({ ...reportPreferences, recipientEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Reports will be sent as PDF attachments to this email address
              </p>
            </div>

            {/* Report Toggles */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Reports */}
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Daily Reports</h3>
                      <p className="text-xs text-gray-500">Every day at 8:00 AM</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReportPreferences({
                      ...reportPreferences,
                      dailyReportsEnabled: !reportPreferences.dailyReportsEnabled
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      reportPreferences.dailyReportsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reportPreferences.dailyReportsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Today's revenue & orders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Top selling items
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Order status breakdown
                  </li>
                </ul>
                {reportPreferences.lastDailyReportSent && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Last sent: {new Date(reportPreferences.lastDailyReportSent).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Weekly Reports */}
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Weekly Reports</h3>
                      <p className="text-xs text-gray-500">Sundays at 8:00 AM</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReportPreferences({
                      ...reportPreferences,
                      weeklyReportsEnabled: !reportPreferences.weeklyReportsEnabled
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      reportPreferences.weeklyReportsEnabled ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reportPreferences.weeklyReportsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Week-over-week trends
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Top 10 best sellers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Category performance
                  </li>
                </ul>
                {reportPreferences.lastWeeklyReportSent && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Last sent: {new Date(reportPreferences.lastWeeklyReportSent).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <p>Reports are sent as professional PDF attachments</p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportPreferences.dailyReportsEnabled || reportPreferences.weeklyReportsEnabled
                    ? 'Active - you will receive reports automatically'
                    : 'Enable at least one report type to start receiving emails'}
                </p>
              </div>
              <Button
                onClick={saveReportPreferences}
                disabled={savingPreferences || !reportPreferences.recipientEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {savingPreferences ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminAnalytics;
