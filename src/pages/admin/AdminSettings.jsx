import React, { useEffect, useState } from 'react';
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
        
        // Process POS-specific results
        let resultIndex = 2;
        
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
            // TODO: Load Square menu sync status when Phase 2 is implemented
            // if (squareResult.value.data.connected && squareResult.value.data.valid) {
            //   loadSquareMenuSyncStatus();
            // }
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

  // Clover integration handlers
  const handleCloverConnect = async () => {
    try {
      setCloverStatus(prev => ({ ...prev, loading: true }));
      const response = await adminApiUtils.initiateCloverOAuth();
      if (response.data.success && response.data.authorizationUrl) {
        // Redirect to Clover OAuth
        window.location.href = response.data.authorizationUrl;
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

  // Square menu sync handlers (TODO: Phase 2)
  const handleSquareMenuSync = async () => {
    try {
      setSquareMenuSyncStatus(prev => ({ ...prev, syncing: true }));
      toast.loading('Syncing menu items from Square...', { id: 'square-menu-sync' });

      const response = await adminApiUtils.syncSquareMenu();
      
      if (response.data.success) {
        const itemMessage = `${response.data.itemsCreated} items created, ${response.data.itemsUpdated} updated`;
        const modifierMessage = `${response.data.customizationsCreated || 0} modifiers created, ${response.data.customizationsUpdated || 0} updated`;
        toast.success(`Square menu sync completed! ${itemMessage}, ${modifierMessage}.`, { id: 'square-menu-sync' });
        // TODO: Reload Square menu sync status when implemented
        // await loadSquareMenuSyncStatus();
      } else {
        toast.error('Square menu sync not yet implemented (Phase 2)', { id: 'square-menu-sync' });
      }
    } catch (error) {
      console.error('Square menu sync error:', error);
      toast.error('Square menu sync not yet implemented (Phase 2)', { id: 'square-menu-sync' });
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

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="hours">Business Hours</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            {(tenantConfig.posProvider === 'clover' || tenantConfig.posProvider === 'none') && (
              <TabsTrigger value="clover">Clover POS</TabsTrigger>
            )}
            {(tenantConfig.posProvider === 'square' || tenantConfig.posProvider === 'none') && (
              <TabsTrigger value="square">Square POS</TabsTrigger>
            )}
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
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

          <TabsContent value="hours">
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

          <TabsContent value="contact">
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

          <TabsContent value="branding">
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

          {(tenantConfig.posProvider === 'clover' || tenantConfig.posProvider === 'none') && (
            <TabsContent value="clover">
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
                          <p className="text-sm text-gray-600">Sync menu items from your Clover POS to BistroBytes</p>
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
                        Once connected, menu items from your Clover POS will automatically sync with BistroBytes. 
                        Orders placed through BistroBytes will appear in your Clover dashboard.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  // Not connected state
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        Connect your restaurant to Clover POS to enable automatic menu synchronization 
                        and seamless order management between BistroBytes and your point-of-sale system.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-center space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-500">
                        <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Clover POS Connected</p>
                        <p className="text-sm">Link your Clover account to get started</p>
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
                      <h4 className="font-medium text-gray-900">What happens when you connect:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your Clover menu items will sync to BistroBytes</li>
                        <li>Orders from BistroBytes will appear in your Clover POS</li>
                        <li>Inventory and pricing stay synchronized</li>
                        <li>Customer payments are processed through Clover</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {(tenantConfig.posProvider === 'square' || tenantConfig.posProvider === 'none') && (
            <TabsContent value="square">
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

                    {/* Menu Sync Section - TODO: Phase 2 */}
                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Menu Synchronization</h3>
                          <p className="text-sm text-gray-600">Sync menu items from your Square POS to BistroBytes (Coming in Phase 2)</p>
                        </div>
                        <Button 
                          onClick={handleSquareMenuSync}
                          disabled={true}
                          className="bg-gray-400 cursor-not-allowed"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Sync Menu (Coming Soon)
                        </Button>
                      </div>

                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-800">
                          <strong>Phase 2 Feature:</strong> Square menu synchronization will be available in the next release. 
                          This will allow automatic syncing of menu items, prices, and modifiers from your Square catalog.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                ) : (
                  // Not connected state
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertDescription className="text-orange-800">
                        Connect your Square POS to sync menu items and manage orders from BistroBytes.
                      </AlertDescription>
                    </Alert>

                    <div className="text-center py-8">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-medium mb-3">Connect to Square POS</h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Authorize BistroBytes to access your Square merchant account for menu synchronization and order management.
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
                        <li>• Phase 2: Advanced menu sync features</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          <TabsContent value="locations">
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
