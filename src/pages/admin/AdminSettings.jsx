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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, h, c] = await Promise.allSettled([
          adminApiUtils.getRestaurantProfile(),
          adminApiUtils.getBusinessHours(),
          adminApiUtils.getCloverStatus(),
        ]);

        if (p.status === 'fulfilled' && p.value?.data) {
          setProfile((prev) => ({ ...prev, ...p.value.data }));
          updateRestaurantData?.({ name: p.value.data.name });
        }
        if (h.status === 'fulfilled' && h.value?.data) {
          setHours({ ...defaultHours, ...h.value.data });
        }
        if (c.status === 'fulfilled' && c.value?.data) {
          setCloverStatus(prev => ({ ...prev, ...c.value.data }));
        }
      } catch (e) {
        // Fallback to defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [updateRestaurantData]);

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
            <TabsTrigger value="clover">Clover POS</TabsTrigger>
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
