import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import adminApi, { adminApiUtils } from '@/services/adminApi';
import useWebSocket from '@/hooks/useWebSocket';
import soundService from '@/services/soundService';
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Check, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  User,
  CreditCard,
  ShoppingBag
} from 'lucide-react';

function AdminOrders() {
  const { user, getTenantId } = useRestaurantAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // WebSocket configuration with tenant support
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api';
  const tenantId = getTenantId();
  
  console.log('🔧 Admin Orders - Base URL:', baseUrl, 'Tenant ID:', tenantId);
  
  const handleWebSocketMessage = (notification) => {
    console.log('📥 AdminOrders received WebSocket notification:', notification);
    
    // Play sound for new orders
    if (notification.notificationType === 'NEW_ORDER' && soundEnabled) {
      console.log('🔊 Playing cha-ching sound...');
      soundService.playChaChing();
      
      // Show toast notification
      toast.success(
        `New Order #${notification.orderId} from ${notification.customerName}`,
        {
          duration: 6000,
          icon: '🔔',
          style: {
            background: '#10B981',
            color: 'white',
          },
        }
      );
    }
    
    // Refresh orders list
    console.log('🔄 Refreshing orders list...');
    fetchOrders();
  };

  const { isConnected, connectionError } = useWebSocket(
    baseUrl,
    handleWebSocketMessage,
    true,
    tenantId
  );

  useEffect(() => {
    console.log('🚀 AdminOrders component mounted');
    fetchOrders();
  }, []);

  // Update sound service when sound preference changes
  useEffect(() => {
    soundService.setEnabled(soundEnabled);
    console.log('🔊 Sound notifications:', soundEnabled ? 'enabled' : 'disabled');
  }, [soundEnabled]);

  const fetchOrders = async () => {
    console.log('📊 Fetching pending orders...');
    setIsLoadingOrders(true);
    try {
      const response = await adminApiUtils.getPendingOrders();
      console.log('✅ Fetched orders:', response.data);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const markAsReady = async (orderId) => {
    setLoadingOrderId(orderId);
    try {
      console.log(`📝 Marking order ${orderId} as ready...`);
      await adminApiUtils.markOrderReady(orderId);
      await fetchOrders(); // Refresh the list
      toast.success(`Order #${orderId} marked as ready!`);
      soundService.playSuccess(); // Play success sound
    } catch (error) {
      console.error('Error marking order as ready:', error);
      toast.error('Failed to update order status');
      soundService.playError(); // Play error sound
    } finally {
      setLoadingOrderId(null);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      // Test sound when enabling
      console.log('🎵 Testing sound...');
      soundService.playChaChing();
    }
    toast.success(`Sound notifications ${!soundEnabled ? 'enabled' : 'disabled'}`);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      'PAID': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'PENDING': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      'FAILED': { variant: 'destructive', className: 'bg-red-100 text-red-800' }
    };
    
    return statusConfig[status] || statusConfig['PENDING'];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Orders</h1>
            <p className="text-gray-600">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} waiting to be prepared
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

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleSound}
                variant={soundEnabled ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-2 ${
                  soundEnabled 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "text-gray-600 border-gray-300"
                }`}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {soundEnabled ? "Sound On" : "Sound Off"}
              </Button>

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
        </div>

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
            {orders.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Order Header */}
                    <CardHeader className="bg-gray-50 border-b">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ShoppingBag size={18} className="text-gray-600" />
                          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock size={14} className="mr-1" />
                          {formatDateTime(order.orderDate)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      {/* Customer & Payment Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <User size={16} className="text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">{order.customerName}</p>
                            <p className="text-sm text-gray-500">{order.customerEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Payment</p>
                            <Badge className={getPaymentStatusBadge(order.paymentStatus).className}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
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
                          <span>${order.totalAmount?.toFixed(2)}</span>
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
                      <Button
                        onClick={() => markAsReady(order.id)}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        disabled={loadingOrderId === order.id}
                      >
                        {loadingOrderId === order.id ? (
                          <ClipLoader color="#ffffff" size={20} />
                        ) : (
                          <>
                            <Check size={18} className="mr-2" />
                            Mark Ready for Pickup
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending orders</h3>
                  <p className="text-gray-500">
                    All caught up! New orders will appear here automatically.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminOrders;