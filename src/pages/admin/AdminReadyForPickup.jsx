import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import adminApi, { adminApiUtils } from '@/services/adminApi';
import useWebSocket from '@/hooks/useWebSocket';
import usePosStatus from '@/hooks/usePosStatus';
import soundService from '@/services/soundService';
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Info, 
  Wifi, 
  WifiOff, 
  ShoppingBag,
  RefreshCw,
  User,
  Package,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

function AdminReadyForPickup() {
  const { user, getTenantId } = useRestaurantAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const { hasPosIntegration, posProvider, isLoading: isPosStatusLoading } = usePosStatus();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('longest_wait'); // longest_wait, newest, oldest, amount_high, amount_low
  const [filterBy, setFilterBy] = useState('all'); // all, urgent (>30min), recent (<15min)

  // WebSocket configuration with tenant support
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api';
  const tenantId = getTenantId();
  
  console.log('🔧 Admin Ready for Pickup - Base URL:', baseUrl, 'Tenant ID:', tenantId);
  
  const handleWebSocketMessage = (notification) => {
    console.log('📥 AdminReadyForPickup received WebSocket notification:', notification);
    
    // Refresh orders list when there are updates
    if (notification.notificationType === 'ORDER_STATUS_UPDATE' || notification.notificationType === 'NEW_ORDER') {
      fetchOrders();
      
      // Show toast for status updates
      if (notification.message && notification.message.includes('READY_FOR_PICKUP')) {
        toast.success(`Order #${notification.orderId} is ready for pickup!`, {
          icon: '✅',
          duration: 4000,
        });
        soundService.playSuccess();
      }
    }
  };

  const { isConnected, connectionError } = useWebSocket(
    baseUrl,
    handleWebSocketMessage,
    true,
    tenantId
  );

  // Filtered and sorted orders
  const filteredAndSortedOrders = useMemo(() => {
    let filteredOrders = [...orders];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.id.toString().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower) ||
        order.items?.some(item => item.name?.toLowerCase().includes(searchLower))
      );
    }

    // Apply wait time filter
    if (filterBy !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        const now = new Date();
        const orderTime = new Date(order.orderDate);
        const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
        
        if (filterBy === 'urgent') {
          return diffInMinutes > 30;
        } else if (filterBy === 'recent') {
          return diffInMinutes < 15;
        }
        return true;
      });
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      switch (sortBy) {
        case 'longest_wait': {
          const aTime = new Date(a.orderDate);
          const bTime = new Date(b.orderDate);
          return aTime - bTime; // Oldest first (longest wait)
        }
        case 'newest':
          return new Date(b.orderDate) - new Date(a.orderDate);
        case 'oldest':
          return new Date(a.orderDate) - new Date(b.orderDate);
        case 'amount_high':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'amount_low':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        default:
          return new Date(a.orderDate) - new Date(b.orderDate);
      }
    });

    return filteredOrders;
  }, [orders, searchTerm, sortBy, filterBy]);

  useEffect(() => {
    console.log('🚀 AdminReadyForPickup component mounted');
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    console.log('📊 Fetching ready for pickup orders...');
    setIsLoadingOrders(true);
    try {
      const response = await adminApiUtils.getReadyForPickupOrders();
      console.log('✅ Fetched READY orders:', response.data);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching ready for pickup orders:', error);
      setOrders([]);
      toast.error('Failed to fetch ready for pickup orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const markAsPickedUp = async (orderId) => {
    setLoadingOrderId(orderId);
    try {
      console.log(`📝 Marking order ${orderId} as picked up...`);
      await adminApiUtils.markOrderCompleted(orderId);
      await fetchOrders(); // Refresh the list
      toast.success(`Order #${orderId} marked as picked up!`);
      soundService.playSuccess(); // Play success sound
    } catch (error) {
      console.error('Error marking order as picked up:', error);
      toast.error('Failed to update order status');
      soundService.playError(); // Play error sound
    } finally {
      setLoadingOrderId(null);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateWaitTime = (orderDate) => {
    const now = new Date();
    const orderTime = new Date(orderDate);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getWaitTimeColor = (orderDate) => {
    const now = new Date();
    const orderTime = new Date(orderDate);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffInMinutes > 30) return 'text-red-600';
    if (diffInMinutes > 15) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ready for Pickup</h1>
            <p className="text-gray-600">
              {filteredAndSortedOrders.length} of {orders.length} {orders.length === 1 ? 'order' : 'orders'} 
              {searchTerm || filterBy !== 'all' ? ' shown' : ' ready for customer pickup'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* WebSocket Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi size={16} />
                  <span className="text-sm font-medium">Live</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff size={16} />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <Button
              onClick={fetchOrders}
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300"
              disabled={isLoadingOrders}
            >
              <RefreshCw size={16} className={isLoadingOrders ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by order ID, customer name, email, or items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Wait Time Filter */}
              <div className="sm:w-48">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Orders</option>
                  <option value="urgent">Urgent (30+ min)</option>
                  <option value="recent">Recent (&lt;15 min)</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="longest_wait">Longest Wait</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_high">Highest Amount</option>
                  <option value="amount_low">Lowest Amount</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchTerm || filterBy !== 'all' || sortBy !== 'longest_wait') && (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                    setSortBy('longest_wait');
                  }}
                  variant="outline"
                  size="sm"
                  className="text-gray-600"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div>
                <p className="font-medium">WebSocket Connection Failed</p>
                <p className="text-sm">{connectionError}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* PoS Sync Notice */}
        {!isPosStatusLoading && hasPosIntegration && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <p className="font-medium text-blue-900">Order status is managed by {posProvider} PoS</p>
              <p className="text-sm text-blue-800">
                Mark orders as picked up in your {posProvider} system and BistroBytes will sync automatically.
              </p>
            </AlertDescription>
          </Alert>
        )}


        {/* Loading State */}
        {isLoadingOrders ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <ClipLoader color="#4F46E5" size={40} />
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Orders Display */}
            {filteredAndSortedOrders.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {filteredAndSortedOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-green-500">
                    {/* Order Header */}
                    <CardHeader className="bg-green-50 border-b">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Package size={18} className="text-green-600" />
                          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Ready for Pickup
                          </Badge>
                          {order.statusUpdatedBy && (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                              {order.statusUpdatedBy === 'MANUAL' ? 'Via BistroBytes' : `Via ${posProvider || 'PoS'}`}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <Clock size={14} className="mr-1" />
                            {formatDateTime(order.orderDate)}
                          </div>
                          <div className={`text-sm font-medium ${getWaitTimeColor(order.orderDate)}`}>
                            Wait: {calculateWaitTime(order.orderDate)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>


                    <CardContent className="p-6">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3 mb-6">
                        <User size={20} className="text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900 text-lg">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{order.customerEmail}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                          {order.items ? (
                            <ul className="space-y-3">
                              {order.items.map((item, index) => (
                                <li key={index} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-900">
                                        {item.name} × {item.quantity}
                                      </span>
                                      {item.customizations?.length > 0 && (
                                        <ul className="mt-1 text-sm text-gray-600">
                                          {item.customizations.map((customization, idx) => (
                                            <li key={idx} className="ml-4">
                                              • {customization.name}
                                              {+customization.price > 0 && (
                                                <span className="text-green-600">
                                                  {' '}(+${customization.price.toFixed(2)})
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                    <span className="font-medium text-gray-900 ml-4">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-center">No items found for this order.</p>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span>${order.subTotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Fee:</span>
                          <span>${order.serviceFee?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span>${order.tax?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span className="text-green-600">${order.totalAmount?.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Special Notes */}
                      {order.specialNotes && (
                        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription>
                            <p className="font-medium text-yellow-800">Special Notes:</p>
                            <p className="text-yellow-700 mt-1">{order.specialNotes}</p>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Action Button */}
                      {hasPosIntegration ? (
                        <Alert className="border-blue-200 bg-blue-50">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <p className="font-medium text-blue-900">Status synced via {posProvider}</p>
                            <p className="text-sm text-blue-800">
                              Mark this order as picked up in {posProvider} to update BistroBytes.
                            </p>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button
                          onClick={() => markAsPickedUp(order.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={loadingOrderId === order.id}
                        >
                          {loadingOrderId === order.id ? (
                            <ClipLoader color="#ffffff" size={20} />
                          ) : (
                            <>
                              <ShoppingBag size={18} className="mr-2" />
                              Mark as Picked Up
                            </>
                          )}
                        </Button>
                      )}

                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Package size={48} className="mx-auto text-gray-400 mb-4" />
                  {orders.length === 0 ? (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders ready for pickup</h3>
                      <p className="text-gray-500">
                        Orders marked as ready will appear here for customer pickup.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders match your filters</h3>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your search or filter criteria.
                      </p>
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterBy('all');
                          setSortBy('longest_wait');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Clear All Filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminReadyForPickup;