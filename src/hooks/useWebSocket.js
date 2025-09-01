import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

/**
 * Enhanced WebSocket hook with multi-tenant support
 * Provides real-time communication for admin features with proper tenant isolation
 */
const useWebSocket = (baseUrl, onMessage, enabled = true, tenantId = null) => {
    const clientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const mountedRef = useRef(true);
    const subscriptionsRef = useRef(new Map());

    useEffect(() => {
        if (!enabled) {
            console.log('🔌 WebSocket disabled, skipping connection');
            return;
        }

        // Get tenant ID from localStorage if not provided
        let effectiveTenantId = tenantId;
        if (!effectiveTenantId) {
            try {
                const userData = localStorage.getItem('restaurant_user');
                if (userData) {
                    const user = JSON.parse(userData);
                    effectiveTenantId = user.tenantId;
                }
            } catch (error) {
                console.error('❌ Error getting tenant ID:', error);
            }
        }

        if (!effectiveTenantId) {
            console.warn('⚠️ No tenant ID available for WebSocket connection');
            setConnectionError('No tenant ID available');
            return;
        }

        // Prevent multiple connections in React StrictMode
        if (clientRef.current && clientRef.current.connected) {
            console.log('🔌 WebSocket already connected, skipping...');
            return;
        }

        console.log('🔌 Starting WebSocket connection for tenant:', effectiveTenantId);

        // Clean up any existing connection
        if (clientRef.current) {
            try {
                clientRef.current.deactivate();
            } catch (e) {
                // Ignore cleanup errors
            }
            clientRef.current = null;
            subscriptionsRef.current.clear();
        }

        // Build WebSocket URL with tenant awareness
        const wsUrl = baseUrl
            .replace('http://', 'ws://')
            .replace('https://', 'wss://')
            .replace('/api', '') + '/ws-orders/websocket';

        console.log('📡 Connecting to WebSocket:', wsUrl);

        const client = new Client({
            brokerURL: wsUrl,

            connectHeaders: {
                'X-Tenant-Id': effectiveTenantId
            },

            onConnect: (frame) => {
                if (!mountedRef.current) return; // Component unmounted

                console.log('✅ WebSocket Connected for tenant:', effectiveTenantId);
                setIsConnected(true);
                setConnectionError(null);

                // Subscribe to tenant-specific order notifications
                try {
                    const orderSubscription = client.subscribe(`/topic/orders/${effectiveTenantId}`, (message) => {
                        if (!mountedRef.current) return; // Component unmounted

                        console.log('📨 Received order message:', message.body);
                        try {
                            const notification = JSON.parse(message.body);
                            // Add tenant validation
                            if (notification.tenantId === effectiveTenantId) {
                                onMessage(notification);
                            } else {
                                console.warn('⚠️ Received message for different tenant, ignoring');
                            }
                        } catch (parseError) {
                            console.error('❌ Error parsing message:', parseError);
                        }
                    });

                    subscriptionsRef.current.set('orders', orderSubscription);
                    console.log('📡 Successfully subscribed to tenant orders:', effectiveTenantId);

                    // Subscribe to general admin notifications for this tenant
                    const adminSubscription = client.subscribe(`/topic/admin/${effectiveTenantId}`, (message) => {
                        if (!mountedRef.current) return;

                        console.log('📨 Received admin message:', message.body);
                        try {
                            const notification = JSON.parse(message.body);
                            if (notification.tenantId === effectiveTenantId) {
                                onMessage(notification);
                            }
                        } catch (parseError) {
                            console.error('❌ Error parsing admin message:', parseError);
                        }
                    });

                    subscriptionsRef.current.set('admin', adminSubscription);
                    console.log('📡 Successfully subscribed to tenant admin notifications:', effectiveTenantId);

                } catch (subscribeError) {
                    console.error('❌ Failed to subscribe:', subscribeError);
                    setConnectionError('Failed to subscribe to notifications');
                }
            },

            onDisconnect: (frame) => {
                if (!mountedRef.current) return;
                console.log('❌ WebSocket Disconnected');
                setIsConnected(false);
                subscriptionsRef.current.clear();
            },

            onStompError: (frame) => {
                if (!mountedRef.current) return;
                console.error('❌ STOMP Error:', frame);
                setConnectionError(frame.headers?.message || 'STOMP connection error');
                setIsConnected(false);
                subscriptionsRef.current.clear();
            },

            onWebSocketError: (error) => {
                if (!mountedRef.current) return;
                console.error('❌ WebSocket Error:', error);
                setConnectionError('WebSocket connection failed');
                setIsConnected(false);
            },

            onWebSocketClose: (event) => {
                if (!mountedRef.current) return;
                console.log(`🔌 WebSocket Closed: ${event.code} ${event.reason || 'Normal closure'}`);
                setIsConnected(false);
                subscriptionsRef.current.clear();

                // Only set error for unexpected closures
                if (event.code !== 1000 && event.code !== 1001) {
                    setConnectionError(`Connection closed unexpectedly (${event.code})`);
                }
            },

            // Enhanced reconnection strategy for production
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            // Minimal debug logging
            debug: function (str) {
                // Only log important connection events
                if (str.includes('CONNECT') && !str.includes('heart-beat')) {
                    console.log('🔍 STOMP:', str);
                }
            }
        });

        clientRef.current = client;

        try {
            client.activate();
            console.log('🚀 WebSocket client activated for tenant:', effectiveTenantId);
        } catch (error) {
            console.error('❌ Failed to activate WebSocket client:', error);
            if (mountedRef.current) {
                setConnectionError(`Activation failed: ${error.message}`);
            }
        }

        // Cleanup function
        return () => {
            console.log('🔌 Cleaning up WebSocket connection...');
            mountedRef.current = false;

            // Unsubscribe from all subscriptions
            subscriptionsRef.current.forEach((subscription, key) => {
                try {
                    subscription.unsubscribe();
                    console.log(`🔌 Unsubscribed from ${key}`);
                } catch (error) {
                    console.warn(`⚠️ Error unsubscribing from ${key}:`, error);
                }
            });
            subscriptionsRef.current.clear();

            if (clientRef.current) {
                try {
                    clientRef.current.deactivate();
                } catch (e) {
                    // Ignore cleanup errors
                }
                clientRef.current = null;
            }
        };
    }, [baseUrl, enabled, tenantId]); // Include tenantId in dependencies

    // Update mounted status
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    /**
     * Send a message to a specific topic
     */
    const sendMessage = (destination, message, headers = {}) => {
        if (!clientRef.current || !isConnected) {
            console.warn('⚠️ Cannot send message: WebSocket not connected');
            return false;
        }

        try {
            // Get tenant ID for headers
            const userData = localStorage.getItem('restaurant_user');
            let tenantId = null;
            if (userData) {
                const user = JSON.parse(userData);
                tenantId = user.tenantId;
            }

            const messageHeaders = {
                ...headers,
                'X-Tenant-Id': tenantId
            };

            clientRef.current.publish({
                destination,
                body: typeof message === 'string' ? message : JSON.stringify(message),
                headers: messageHeaders
            });

            console.log('📤 Message sent to:', destination);
            return true;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            return false;
        }
    };

    /**
     * Subscribe to additional topic dynamically
     */
    const subscribe = (topic, callback) => {
        if (!clientRef.current || !isConnected) {
            console.warn('⚠️ Cannot subscribe: WebSocket not connected');
            return null;
        }

        try {
            const subscription = clientRef.current.subscribe(topic, callback);
            const subscriptionKey = `dynamic_${Date.now()}`;
            subscriptionsRef.current.set(subscriptionKey, subscription);
            console.log('📡 Dynamically subscribed to:', topic);
            
            return {
                unsubscribe: () => {
                    subscription.unsubscribe();
                    subscriptionsRef.current.delete(subscriptionKey);
                    console.log('🔌 Unsubscribed from:', topic);
                }
            };
        } catch (error) {
            console.error('❌ Error subscribing to topic:', error);
            return null;
        }
    };

    /**
     * Test WebSocket connection
     */
    const testConnection = async () => {
        try {
            const testUrl = `${baseUrl.replace('/api', '')}/api/websocket/test`;
            console.log('🧪 Testing WebSocket via:', testUrl);

            const response = await fetch(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Id': tenantId || 'default'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🧪 Test result:', result);
            return result;
        } catch (error) {
            console.error('❌ Test failed:', error);
            throw new Error(`Test failed: ${error.message}`);
        }
    };

    /**
     * Reset connection manually
     */
    const resetConnection = () => {
        console.log('🔄 Manually resetting WebSocket connection...');
        setConnectionError(null);
        setIsConnected(false);

        if (clientRef.current) {
            try {
                clientRef.current.deactivate();
            } catch (e) {
                // Ignore cleanup errors
            }
            clientRef.current = null;
        }
        subscriptionsRef.current.clear();

        // Force a small delay then reconnect
        setTimeout(() => {
            if (mountedRef.current) {
                window.location.reload(); // Simple but effective reset
            }
        }, 100);
    };

    return {
        isConnected,
        connectionError,
        sendMessage,
        subscribe,
        testConnection,
        resetConnection
    };
};

export default useWebSocket;