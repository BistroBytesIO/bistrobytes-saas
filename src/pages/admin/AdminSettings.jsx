import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Upload, Link2, Unlink, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApiUtils } from '@/services/adminApi';

const defaultHours = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '21:00', closed: false },
  saturday: { open: '10:00', close: '21:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: true },
};

function AdminSettings() {
  const { restaurant, updateRestaurantData } = useRestaurantAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: restaurant?.name || '',
    description: '',
  });

  const [contact, setContact] = useState({
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });

  const [branding, setBranding] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    logoUrl: '',
  });

  const [hours, setHours] = useState(defaultHours);
  
  // Clover integration state
  const [cloverStatus, setCloverStatus] = useState({
    connected: false,
    valid: false,
    merchantId: '',
    merchantName: '',
    environment: 'sandbox',
    loading: false
  });

  // Clover menu sync state
  const [menuSyncStatus, setMenuSyncStatus] = useState({
    totalMenuItems: 0,
    syncedItems: 0,
    syncPercentage: 0,
    lastSyncAt: null,
    syncing: false
  });

  // Square integration state
  const [squareStatus, setSquareStatus] = useState({
    connected: false,
    valid: false,
    merchantId: '',
    merchantName: '',
    environment: 'sandbox',
    loading: false
  });

  // Square menu sync state (TODO: Phase 2)
  const [squareMenuSyncStatus, setSquareMenuSyncStatus] = useState({
    totalMenuItems: 0,
    syncedItems: 0,
    syncPercentage: 0,
    lastSyncAt: null,
    syncing: false
  });

  // Tenant configuration state
  const [tenantConfig, setTenantConfig] = useState({
    posProvider: 'none' // none, clover, square
  });

  // Payment configuration state
  const [paymentConfig, setPaymentConfig] = useState({
    paymentProcessor: 'STRIPE', // STRIPE, CLOVER, SQUARE
    cloverConfigured: false,
    squareConfigured: false,
    stripeConfigured: false,
    loading: false,
    saving: false
  });

  // Track active tab via query param (default profile)
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // First load tenant config to know which POS provider to load
        const tenantConfigResponse = await adminApiUtils.getTenantConfig();
        const posProvider = tenantConfigResponse?.data?.posProvider || 'none';
        
        // Set tenant config first
        setTenantConfig(prev => ({ ...prev, posProvider }));

        // Build the promise array based on POS provider
        const promises = [
          adminApiUtils.getRestaurantProfile(),
          adminApiUtils.getBusinessHours(),
          adminApiUtils.getPaymentConfig(), // Load payment configuration
        ];
        
        // Only load POS status for the configured provider or if none is set
        let cloverPromise = null;
        let squarePromise = null;
        
        if (posProvider === 'clover' || posProvider === 'none') {
          cloverPromise = adminApiUtils.getCloverStatus();
          promises.push(cloverPromise);
        }
        
        if (posProvider === 'square' || posProvider === 'none') {
          squarePromise = adminApiUtils.getSquareStatus();
          promises.push(squarePromise);
        }

        const results = await Promise.allSettled(promises);
        
        // Process basic results
        if (results[0].status === 'fulfilled' && results[0].value?.data) {
          setProfile((prev) => ({ ...prev, ...results[0].value.data }));
          updateRestaurantData?.({ name: results[0].value.data.name });
        }
        if (results[1].status === 'fulfilled' && results[1].value?.data) {
          setHours({ ...defaultHours, ...results[1].value.data });
        }
        if (results[2].status === 'fulfilled' && results[2].value?.data) {
          setPaymentConfig(prev => ({ ...prev, ...results[2].value.data }));
        }
        
        // Process POS-specific results
        let resultIndex = 3;
        
        if (cloverPromise) {
          const cloverResult = results[resultIndex];
          if (cloverResult.status === 'fulfilled' && cloverResult.value?.data) {
            setCloverStatus(prev => ({ ...prev, ...cloverResult.value.data }));
            // Load menu sync status if Clover is connected
            if (cloverResult.value.data.connected && cloverResult.value.data.valid) {
              loadMenuSyncStatus();
            }
          }
          resultIndex++;
        }
        
        if (squarePromise) {
          const squareResult = results[resultIndex];
          if (squareResult.status === 'fulfilled' && squareResult.value?.data) {
            setSquareStatus(prev => ({ ...prev, ...squareResult.value.data }));
            // Load Square menu sync status if Square is connected
            if (squareResult.value.data.connected && squareResult.value.data.valid) {
              loadSquareMenuSyncStatus();
            }
          }
        }
      } catch (e) {
        // Fallback to defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // Remove updateRestaurantData from dependency array to prevent infinite loop

  // Keep query param in sync with active tab
  useEffect(() => {
    const current = searchParams.get('tab');
    if (activeTab && activeTab !== current) {
      const sp = new URLSearchParams(searchParams);
      sp.set('tab', activeTab);
      setSearchParams(sp, { replace: true });
    }
    // If landing directly on the Square tab, fetch status immediately
    if (activeTab === 'square') {
      adminApiUtils.getSquareStatus()
        .then(res => {
          if (res?.data) setSquareStatus(prev => ({ ...prev, ...res.data }));
        })
        .catch(() => {/* noop */});
    }
    if (activeTab === 'clover') {
      adminApiUtils.getCloverStatus()
        .then(res => {
          if (res?.data) setCloverStatus(prev => ({ ...prev, ...res.data }));
        })
        .catch(() => {/* noop */});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Update payment config when clover status changes
  useEffect(() => {
    setPaymentConfig(prev => ({
      ...prev,
      cloverConfigured: cloverStatus.connected && cloverStatus.valid
    }));
  }, [cloverStatus.connected, cloverStatus.valid]);

  // Update payment config when Square status changes
  useEffect(() => {
    setPaymentConfig(prev => ({
      ...prev,
      squareConfigured: squareStatus.connected && squareStatus.valid
    }));
  }, [squareStatus.connected, squareStatus.valid]);

  const handleSaveProfile = async () => {
    if (!profile.name?.trim()) {
      toast.error('Restaurant name is required');
      return;
    }
    setSaving(true);
    try {
      await adminApiUtils.updateRestaurantProfile(profile);
      updateRestaurantData?.({ name: profile.name });
      toast.success('Profile saved');
    } catch (e) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (contact.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) {
      toast.error('Please provide a valid email address');
      return;
    }
    setSaving(true);
    try {
      await adminApiUtils.updateRestaurantSettings({ contact });
      toast.success('Contact saved');
    } catch (e) {
      toast.error('Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (branding.logoUrl && !/^https?:\/\//i.test(branding.logoUrl)) {
      toast.error('Logo URL must start with http or https');
      return;
    }
    setSaving(true);
    try {
      await adminApiUtils.updateRestaurantSettings({ branding });
      toast.success('Branding saved');
    } catch (e) {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      await adminApiUtils.updateBusinessHours(hours);
      toast.success('Business hours saved');
    } catch (e) {
      toast.error('Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentConfig = async () => {
    // Validate Clover selection
    if (paymentConfig.paymentProcessor === 'CLOVER' && !paymentConfig.cloverConfigured) {
      toast.error('Please connect your Clover POS before selecting it as payment processor');
      return;
    }

    // Validate Square selection
    if (paymentConfig.paymentProcessor === 'SQUARE' && !paymentConfig.squareConfigured) {
      toast.error('Please connect your Square POS before selecting it as payment processor');
      return;
    }

    setPaymentConfig(prev => ({ ...prev, saving: true }));
    try {
      await adminApiUtils.updatePaymentProcessor(paymentConfig.paymentProcessor);
      toast.success(`Payment processor updated to ${paymentConfig.paymentProcessor}`);

      // Optional: Reload payment config to confirm server state
      const response = await adminApiUtils.getPaymentConfig();
      if (response?.data) {
        setPaymentConfig(prev => ({ ...prev, ...response.data, saving: false }));
      }
    } catch (e) {
      console.error('Payment config save error:', e);
      const errorMessage = e.response?.data?.message || 'Failed to save payment configuration';
      toast.error(errorMessage);
      setPaymentConfig(prev => ({ ...prev, saving: false }));
    }
  };

  // Payment config utility function
  const loadPaymentConfig = async () => {
    try {
      const response = await adminApiUtils.getPaymentConfig();
      if (response?.data) {
        setPaymentConfig(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to load payment config:', error);
    }
  };

  // Menu sync utility functions
  const loadMenuSyncStatus = async () => {
    try {
      const response = await adminApiUtils.getCloverMenuSyncStatus();
      if (response.data.success) {
        setMenuSyncStatus(prev => ({
          ...prev,
          ...response.data,
          syncing: false
        }));
      }
    } catch (error) {
      console.error('Failed to load menu sync status:', error);
    }
  };

  const loadSquareMenuSyncStatus = async () => {
    try {
      const response = await adminApiUtils.getSquareMenuSyncStatus();
      if (response.data.success) {
        setSquareMenuSyncStatus(prev => ({
          ...prev,
          ...response.data,
          syncing: false
        }));
      }
    } catch (error) {
      console.error('Failed to load Square menu sync status:', error);
    }
  };

  // Clover integration handlers
  const handleCloverConnect = async () => {
    try {
      setCloverStatus(prev => ({ ...prev, loading: true }));

      const response = await adminApiUtils.initiateCloverOAuth();
      if (response.data.success && response.data.authorizationUrl) {
        // Redirect to Clover OAuth
        window.location.href = response.data.authorizationUrl;
        // Note: loadPaymentConfig will be called when user returns from OAuth
      } else {
        toast.error('Failed to initiate Clover connection');
      }
    } catch (error) {
      console.error('Clover OAuth initiation error:', error);
      toast.error('Failed to connect to Clover');
      setCloverStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCloverDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Clover? This will disable menu sync and order integration.')) {
      return;
    }

    try {
      setCloverStatus(prev => ({ ...prev, loading: true }));
      await adminApiUtils.disconnectClover();
      setCloverStatus({
        connected: false,
        valid: false,
        merchantId: '',
        merchantName: '',
        environment: 'sandbox',
        loading: false
      });
      // Reload payment config to synchronize connection state
      await loadPaymentConfig();
      toast.success('Disconnected from Clover successfully');
    } catch (error) {
      console.error('Clover disconnect error:', error);
      toast.error('Failed to disconnect from Clover');
      setCloverStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCloverRefresh = async () => {
    try {
      setCloverStatus(prev => ({ ...prev, loading: true }));
      const response = await adminApiUtils.refreshCloverToken();
      if (response.data.success) {
        toast.success('Clover token refreshed successfully');
        // Reload status
        const statusResponse = await adminApiUtils.getCloverStatus();
        if (statusResponse.data) {
          setCloverStatus(prev => ({ ...prev, ...statusResponse.data, loading: false }));
        }
        // Reload payment config to synchronize connection state
        await loadPaymentConfig();
      } else {
        toast.error('Failed to refresh Clover token');
        setCloverStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Clover token refresh error:', error);
      toast.error('Failed to refresh Clover token');
      setCloverStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Menu sync handlers
  const handleMenuSync = async () => {
    try {
      setMenuSyncStatus(prev => ({ ...prev, syncing: true }));
      toast.loading('Syncing menu items from Clover...', { id: 'menu-sync' });

      const response = await adminApiUtils.syncCloverMenu();
      
      if (response.data.success) {
        const itemMessage = `${response.data.itemsCreated} items created, ${response.data.itemsUpdated} updated`;
        const modifierMessage = `${response.data.customizationsCreated || 0} modifiers created, ${response.data.customizationsUpdated || 0} updated`;
        toast.success(`Menu sync completed! ${itemMessage}, ${modifierMessage}.`, { id: 'menu-sync' });
        // Reload menu sync status
        await loadMenuSyncStatus();
      } else {
        toast.error('Menu sync completed with errors. Check the logs for details.', { id: 'menu-sync' });
        if (response.data.errors && response.data.errors.length > 0) {
          console.error('Menu sync errors:', response.data.errors);
        }
      }
    } catch (error) {
      console.error('Menu sync error:', error);
      toast.error('Failed to sync menu items from Clover', { id: 'menu-sync' });
    } finally {
      setMenuSyncStatus(prev => ({ ...prev, syncing: false }));
    }
  };

  // Square integration handlers
  const handleSquareConnect = async () => {
    try {
      setSquareStatus(prev => ({ ...prev, loading: true }));
      const response = await adminApiUtils.initiateSquareOAuth();
      if (response.data.success && response.data.authorizationUrl) {
        // Redirect to Square OAuth
        window.location.href = response.data.authorizationUrl;
      } else {
        toast.error('Failed to initiate Square connection');
      }
    } catch (error) {
      console.error('Square OAuth initiation error:', error);
      toast.error('Failed to connect to Square');
      setSquareStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSquareDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Square? This will disable menu sync and order integration.')) {
      return;
    }

    try {
      setSquareStatus(prev => ({ ...prev, loading: true }));
      await adminApiUtils.disconnectSquare();
      setSquareStatus({
        connected: false,
        valid: false,
        merchantId: '',
        merchantName: '',
        environment: 'sandbox',
        loading: false
      });
      // Reload payment config to synchronize connection state
      await loadPaymentConfig();
      toast.success('Disconnected from Square successfully');
    } catch (error) {
      console.error('Square disconnect error:', error);
      toast.error('Failed to disconnect from Square');
      setSquareStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSquareRefresh = async () => {
    try {
      setSquareStatus(prev => ({ ...prev, loading: true }));
      const response = await adminApiUtils.refreshSquareToken();
      if (response.data.success) {
        toast.success('Square token refreshed successfully');
        // Reload status
        const statusResponse = await adminApiUtils.getSquareStatus();
        if (statusResponse.data) {
          setSquareStatus(prev => ({ ...prev, ...statusResponse.data, loading: false }));
        }
      } else {
        toast.error('Failed to refresh Square token');
        setSquareStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Square token refresh error:', error);
      toast.error('Failed to refresh Square token');
      setSquareStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Square menu sync handlers
  const handleSquareMenuSync = async () => {
    try {
      setSquareMenuSyncStatus(prev => ({ ...prev, syncing: true }));
      toast.loading('Syncing menu items from Square...', { id: 'square-menu-sync' });

      const response = await adminApiUtils.syncSquareMenu();

      if (response.data.success) {
        const itemMessage = `${response.data.itemsCreated} items created, ${response.data.itemsUpdated} updated`;
        const modifierMessage = `${response.data.customizationsCreated || 0} modifiers created, ${response.data.customizationsUpdated || 0} updated`;
        toast.success(`Square menu sync completed! ${itemMessage}, ${modifierMessage}.`, { id: 'square-menu-sync' });
        // Reload Square menu sync status
        await loadSquareMenuSyncStatus();
      } else {
        toast.error('Square menu sync completed with errors. Check the logs for details.', { id: 'square-menu-sync' });
        if (response.data.errors && response.data.errors.length > 0) {
          console.error('Square menu sync errors:', response.data.errors);
        }
      }
    } catch (error) {
      console.error('Square menu sync error:', error);
      toast.error('Failed to sync menu items from Square', { id: 'square-menu-sync' });
    } finally {
      setSquareMenuSyncStatus(prev => ({ ...prev, syncing: false }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center text-gray-600"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading settings…</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
          <p className="text-gray-600">Manage your profile, hours, contact, branding, and locations.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger tabValue="profile">Profile</TabsTrigger>
            <TabsTrigger tabValue="hours">Business Hours</TabsTrigger>
            <TabsTrigger tabValue="contact">Contact</TabsTrigger>
            <TabsTrigger tabValue="branding">Branding</TabsTrigger>
            <TabsTrigger tabValue="payments">Payment Processing</TabsTrigger>
            {(tenantConfig.posProvider === 'clover' || tenantConfig.posProvider === 'none') && (
              <TabsTrigger tabValue="clover">Clover POS</TabsTrigger>
            )}
            {(tenantConfig.posProvider === 'square' || tenantConfig.posProvider === 'none') && (
              <TabsTrigger tabValue="square">Square POS</TabsTrigger>
            )}
            <TabsTrigger tabValue="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent tabValue="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Basic information about your restaurant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea rows={3} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="hours">
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Configure opening and closing times</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(hours).map(([day, data]) => (
                  <div key={day} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    <div className="capitalize text-sm font-medium">{day}</div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Open</label>
                      <Input type="time" value={data.open} onChange={(e) => setHours({ ...hours, [day]: { ...data, open: e.target.value } })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Close</label>
                      <Input type="time" value={data.close} onChange={(e) => setHours({ ...hours, [day]: { ...data, close: e.target.value } })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" checked={data.closed} onChange={(e) => setHours({ ...hours, [day]: { ...data, closed: e.target.checked } })} />
                      <span className="text-sm">Closed</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={handleSaveHours} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Hours
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How customers can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 1</label>
                  <Input value={contact.addressLine1} onChange={(e) => setContact({ ...contact, addressLine1: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 2</label>
                  <Input value={contact.addressLine2} onChange={(e) => setContact({ ...contact, addressLine2: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <Input value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <Input value={contact.state} onChange={(e) => setContact({ ...contact, state: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ZIP</label>
                    <Input value={contact.zip} onChange={(e) => setContact({ ...contact, zip: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveContact} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize your brand appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Primary Color</label>
                    <Input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Secondary Color</label>
                    <Input type="color" value={branding.secondaryColor} onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logo</label>
                  <div className="flex items-center gap-3">
                    <Input type="url" placeholder="https://…" value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} />
                    <Button type="button" variant="outline"><Upload className="h-4 w-4 mr-2" /> Upload (soon)</Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Image upload to be implemented with backend file handling.</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveBranding} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Branding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>Configure how customer payments are processed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading payment configuration...</span>
                  </div>
                )}

                {!loading && (
                  <>

                {/* Payment Processor Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Processor</h3>
                  <p className="text-sm text-gray-600">
                    Choose which payment system will process customer transactions
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stripe Option */}
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentConfig.paymentProcessor === 'STRIPE'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentConfig({...paymentConfig, paymentProcessor: 'STRIPE'})}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          paymentConfig.paymentProcessor === 'STRIPE'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {paymentConfig.paymentProcessor === 'STRIPE' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">Stripe</h4>
                          <p className="text-sm text-gray-600">Industry-leading payment processing</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        • Express checkout with Apple Pay & Google Pay
                        • Comprehensive fraud protection
                        • Global payment methods support
                      </div>
                      {paymentConfig.paymentProcessor === 'STRIPE' && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">Selected</span>
                        </div>
                      )}
                    </div>

                    {/* Clover Option */}
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentConfig.paymentProcessor === 'CLOVER'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!paymentConfig.cloverConfigured ? 'opacity-50' : ''}`}
                      onClick={() => {
                        if (paymentConfig.cloverConfigured) {
                          setPaymentConfig({...paymentConfig, paymentProcessor: 'CLOVER'});
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          paymentConfig.paymentProcessor === 'CLOVER'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {paymentConfig.paymentProcessor === 'CLOVER' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">Clover</h4>
                          <p className="text-sm text-gray-600">Integrated POS payment processing</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        • Direct integration with your Clover POS
                        • Real-time transaction synchronization
                        • Unified reporting and reconciliation
                      </div>
                      {!paymentConfig.cloverConfigured && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Requires Clover POS connection</span>
                        </div>
                      )}
                      {paymentConfig.paymentProcessor === 'CLOVER' && paymentConfig.cloverConfigured && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">Selected</span>
                        </div>
                      )}
                    </div>

                    {/* Square Option */}
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentConfig.paymentProcessor === 'SQUARE'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!paymentConfig.squareConfigured ? 'opacity-50' : ''}`}
                      onClick={() => {
                        if (paymentConfig.squareConfigured) {
                          setPaymentConfig({...paymentConfig, paymentProcessor: 'SQUARE'});
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          paymentConfig.paymentProcessor === 'SQUARE'
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                        }`}>
                          {paymentConfig.paymentProcessor === 'SQUARE' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">Square</h4>
                          <p className="text-sm text-gray-600">Square POS payment processing</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        • Direct integration with your Square POS
                        • Real-time transaction synchronization
                        • Comprehensive payment tools
                      </div>
                      {!paymentConfig.squareConfigured && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Requires Square POS connection</span>
                        </div>
                      )}
                      {paymentConfig.paymentProcessor === 'SQUARE' && paymentConfig.squareConfigured && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600">Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configuration Status */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Integration Status</h3>

                  <div className="space-y-3">
                    {/* Stripe Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">Stripe</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Ready</span>
                      </div>
                    </div>

                    {/* Clover Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          paymentConfig.cloverConfigured ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-medium">Clover</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {paymentConfig.cloverConfigured ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Not Connected</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Square Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          paymentConfig.squareConfigured ? 'bg-orange-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-medium">Square</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {paymentConfig.squareConfigured ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-600">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Not Connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!paymentConfig.cloverConfigured && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Want to use Clover for payments?</strong> Connect your Clover POS in the
                        {' '}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-600 underline"
                          onClick={() => setActiveTab('clover')}
                        >
                          Clover POS tab
                        </Button>
                        {' '}
                        first, then return here to select it as your payment processor.
                      </p>
                    </div>
                  )}

                  {!paymentConfig.squareConfigured && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Want to use Square for payments?</strong> Connect your Square POS in the
                        {' '}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-orange-600 underline"
                          onClick={() => setActiveTab('square')}
                        >
                          Square POS tab
                        </Button>
                        {' '}
                        first, then return here to select it as your payment processor.
                      </p>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="border-t pt-6">
                  <Button
                    onClick={handleSavePaymentConfig}
                    disabled={paymentConfig.saving}
                    className="flex items-center gap-2"
                  >
                    {paymentConfig.saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Payment Configuration
                      </>
                    )}
                  </Button>
                </div>

                  </>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {(tenantConfig.posProvider === 'clover' || tenantConfig.posProvider === 'none') && (
            <TabsContent tabValue="clover">
            <Card>
              <CardHeader>
                <CardTitle>Clover POS Integration</CardTitle>
                <CardDescription>Connect with your Clover POS system for menu sync and order management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cloverStatus.connected ? (
                  // Connected state
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Successfully connected to Clover POS
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Merchant Name</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {cloverStatus.merchantName || 'Loading...'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Merchant ID</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
                          {cloverStatus.merchantId || 'Loading...'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Environment</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {cloverStatus.environment || 'sandbox'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Connection Status</label>
                        <div className={`text-sm p-2 rounded flex items-center gap-2 ${
                          cloverStatus.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                          {cloverStatus.valid ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Active & Valid
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Token Expired
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handleCloverRefresh} 
                        disabled={cloverStatus.loading}
                        variant="outline"
                      >
                        {cloverStatus.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh Token
                      </Button>
                      <Button 
                        onClick={handleCloverDisconnect}
                        disabled={cloverStatus.loading}
                        variant="destructive"
                      >
                        {cloverStatus.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlink className="h-4 w-4 mr-2" />
                        )}
                        Disconnect
                      </Button>
                    </div>

                    {/* Menu Sync Section */}
                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Menu Synchronization</h3>
                          <p className="text-sm text-gray-600">Sync menu items from your Clover POS to BizBytes</p>
                        </div>
                        <Button 
                          onClick={handleMenuSync}
                          disabled={menuSyncStatus.syncing}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {menuSyncStatus.syncing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          {menuSyncStatus.syncing ? 'Syncing...' : 'Sync Menu'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{menuSyncStatus.totalMenuItems}</div>
                          <div className="text-sm text-gray-600">Total Menu Items</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{menuSyncStatus.syncedItems}</div>
                          <div className="text-sm text-gray-600">Synced from Clover</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{menuSyncStatus.syncPercentage}%</div>
                          <div className="text-sm text-gray-600">Sync Coverage</div>
                        </div>
                      </div>

                      {menuSyncStatus.lastSyncAt && (
                        <div className="text-sm text-gray-600 mb-4">
                          Last synced: {new Date(menuSyncStatus.lastSyncAt).toLocaleString()}
                        </div>
                      )}

                      <Alert>
                        <AlertDescription>
                          Click "Sync Menu" to pull the latest menu items from your Clover POS. 
                          This will create new items and update existing ones with current pricing and availability.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <Alert>
                      <AlertDescription>
                        Once connected, menu items from your Clover POS will automatically sync with BizBytes. 
                        Orders placed through BizBytes will appear in your Clover dashboard.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  // Not connected state
                  <div className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800">
                        <strong>Important:</strong> Before connecting, you must install the BizBytes app in your Clover App Market.
                      </AlertDescription>
                    </Alert>

                    <div className="border rounded-lg p-6 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Setup Instructions (First-Time Connection)</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li className="font-medium">
                          Install the BizBytes App
                          <p className="ml-6 mt-1 text-gray-600">
                            Visit the{' '}
                            <a
                              href={`https://sandbox.dev.clover.com/appmarket/apps/${import.meta.env.VITE_CLOVER_APP_ID || 'T0WRP6E4WNB3Y'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              Clover App Market
                            </a>
                            {' '}and click "Connect" to install BizBytes to your merchant account.
                          </p>
                        </li>
                        <li className="font-medium">
                          Return here and click "Connect to Clover POS"
                          <p className="ml-6 mt-1 text-gray-600">
                            After installing the app in Clover, come back to this page and click the green button below.
                          </p>
                        </li>
                        <li className="font-medium">
                          Complete the authorization
                          <p className="ml-6 mt-1 text-gray-600">
                            You'll be redirected to Clover to select your merchant and authorize the connection.
                          </p>
                        </li>
                      </ol>
                    </div>

                    <div className="text-center space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-500">
                        <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Clover POS Connected</p>
                        <p className="text-sm">Follow the instructions above, then click below</p>
                      </div>

                      <Button
                        onClick={handleCloverConnect}
                        disabled={cloverStatus.loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {cloverStatus.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Link2 className="h-4 w-4 mr-2" />
                        )}
                        Connect to Clover POS
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <h4 className="font-medium text-gray-900">What you'll get after connecting:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your Clover menu items will sync to BizBytes</li>
                        <li>Orders from BizBytes will appear in your Clover POS</li>
                        <li>Inventory and pricing stay synchronized</li>
                        <li>Customer payments can be processed through Clover</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {(tenantConfig.posProvider === 'square' || tenantConfig.posProvider === 'none') && (
            <TabsContent tabValue="square">
            <Card>
              <CardHeader>
                <CardTitle>Square POS Integration</CardTitle>
                <CardDescription>Connect with your Square POS system for menu sync and order management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {squareStatus.connected ? (
                  // Connected state
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Successfully connected to Square POS
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Merchant Name</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {squareStatus.merchantName || 'Loading...'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Merchant ID</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
                          {squareStatus.merchantId || 'Loading...'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Environment</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {squareStatus.environment || 'sandbox'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Connection Status</label>
                        <div className={`text-sm p-2 rounded flex items-center gap-2 ${
                          squareStatus.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                          {squareStatus.valid ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Active & Valid
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Token Expired
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSquareRefresh} 
                        disabled={squareStatus.loading}
                        variant="outline"
                      >
                        {squareStatus.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh Token
                      </Button>
                      <Button 
                        onClick={handleSquareDisconnect}
                        disabled={squareStatus.loading}
                        variant="destructive"
                      >
                        {squareStatus.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlink className="h-4 w-4 mr-2" />
                        )}
                        Disconnect
                      </Button>
                    </div>

                    {/* Menu Sync Section */}
                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Menu Synchronization</h3>
                          <p className="text-sm text-gray-600">Sync menu items from your Square POS to BizBytes</p>
                        </div>
                        <Button
                          onClick={handleSquareMenuSync}
                          disabled={squareMenuSyncStatus.syncing}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {squareMenuSyncStatus.syncing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          {squareMenuSyncStatus.syncing ? 'Syncing...' : 'Sync Menu'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{squareMenuSyncStatus.totalMenuItems}</div>
                          <div className="text-sm text-gray-600">Total Menu Items</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{squareMenuSyncStatus.syncedItems}</div>
                          <div className="text-sm text-gray-600">Synced from Square</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{squareMenuSyncStatus.syncPercentage}%</div>
                          <div className="text-sm text-gray-600">Sync Coverage</div>
                        </div>
                      </div>

                      {squareMenuSyncStatus.lastSyncAt && (
                        <div className="text-sm text-gray-600 mb-4">
                          Last synced: {new Date(squareMenuSyncStatus.lastSyncAt).toLocaleString()}
                        </div>
                      )}

                      <Alert>
                        <AlertDescription>
                          Click "Sync Menu" to pull the latest menu items from your Square POS.
                          This will create new items and update existing ones with current pricing and availability.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <Alert>
                      <AlertDescription>
                        Once connected, menu items from your Square POS will automatically sync with BizBytes.
                        Orders placed through BizBytes will appear in your Square dashboard.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  // Not connected state
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertDescription className="text-orange-800">
                        Connect your Square POS to sync menu items and manage orders from BizBytes.
                      </AlertDescription>
                    </Alert>

                    <div className="text-center py-8">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-medium mb-3">Connect to Square POS</h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Authorize BizBytes to access your Square merchant account for menu synchronization and order management.
                        </p>
                        
                        <Button 
                          onClick={handleSquareConnect}
                          disabled={squareStatus.loading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {squareStatus.loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Link2 className="h-4 w-4 mr-2" />
                              Connect Square POS
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">What you'll get:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Automatic menu synchronization from Square</li>
                        <li>• Real-time inventory updates</li>
                        <li>• Unified order management</li>
                        <li>• Item pricing and modifier sync</li>
                        <li>• Advanced menu sync features</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}

          <TabsContent tabValue="locations">
            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
                <CardDescription>Manage restaurant locations (placeholder)</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Location CRUD will be wired in Phase 5 with backend endpoints.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default AdminSettings;
