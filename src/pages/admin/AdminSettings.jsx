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
import { Loader2, Save, Upload, Link2, Unlink, CheckCircle, XCircle, RefreshCw, Globe2, ShieldCheck, AlertTriangle, Info, Trash2 } from 'lucide-react';
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
  timezone: 'America/New_York'
};

function AdminSettings() {
  const { restaurant, updateRestaurantData } = useRestaurantAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: restaurant?.name || '',
    description: '',
    planType: '', // BASIC, PREMIUM, or ENTERPRISE
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

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [hours, setHours] = useState(defaultHours);

  // Custom domain state
  const [customDomain, setCustomDomain] = useState(null);
  const [domainInput, setDomainInput] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('DNS_TXT');
  const [domainLoading, setDomainLoading] = useState(true);
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [domainDisabling, setDomainDisabling] = useState(false);
  const [domainDeleting, setDomainDeleting] = useState(false);
  const [certificateChecking, setCertificateChecking] = useState(false);

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

  // Check if current plan allows POS payment processors
  const isBasicPlan = profile.planType === 'BASIC';
  const canUsePosPayments = !isBasicPlan; // Only PREMIUM and ENTERPRISE can use POS payments
  const hasCustomDomainAccess = ['PREMIUM', 'ENTERPRISE', 'PROFESSIONAL'].includes(profile.planType);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setDomainLoading(true);
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
          adminApiUtils.getCustomDomain()
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
          const profileData = results[0].value.data;
          setProfile((prev) => ({
            ...prev,
            name: profileData.name || '',
            description: profileData.description || '',
            planType: profileData.planType || 'BASIC'
          }));

          // Load contact information
          setContact((prev) => ({
            ...prev,
            phone: profileData.phone || '',
            email: profileData.email || '',
            addressLine1: profileData.address || '',
            addressLine2: profileData.addressLine2 || '',
            city: profileData.city || '',
            state: profileData.state || '',
            zip: profileData.zipCode || ''
          }));

          // Load branding information
          setBranding((prev) => ({
            ...prev,
            primaryColor: profileData.primaryColor || '#3B82F6',
            secondaryColor: profileData.secondaryColor || '#10B981',
            logoUrl: profileData.logoUrl || ''
          }));

          updateRestaurantData?.({ name: profileData.name });
        }
        if (results[1].status === 'fulfilled' && results[1].value?.data) {
          setHours({ ...defaultHours, ...results[1].value.data });
        }
        if (results[2].status === 'fulfilled' && results[2].value?.data) {
          setPaymentConfig(prev => ({ ...prev, ...results[2].value.data }));
        }
        if (results[3].status === 'fulfilled' && results[3].value?.data) {
          const domainPayload = results[3].value.data?.data;
          if (domainPayload) {
            setCustomDomain(domainPayload);
            setDomainInput(domainPayload.domain || '');
            setVerificationMethod(domainPayload.verificationMethod || 'DNS_TXT');
          }
        }
        
        // Process POS-specific results
        let resultIndex = 4;
        
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
        setDomainLoading(false);
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

  // Set logo preview when branding.logoUrl changes
  useEffect(() => {
    if (branding.logoUrl) {
      setLogoPreview(branding.logoUrl);
    }
  }, [branding.logoUrl]);

  // Auto-poll certificate status when pending validation
  useEffect(() => {
    if (!customDomain || customDomain.certificateStatus !== 'PENDING_VALIDATION') {
      return;
    }

    // Poll every 30 seconds
    const intervalId = setInterval(async () => {
      try {
        const response = await adminApiUtils.checkCertificateStatus();
        const domainData = response?.data?.data || null;
        if (domainData) {
          setCustomDomain(domainData);
          // If certificate is now issued, show success message
          if (domainData.certificateStatus === 'ISSUED') {
            toast.success('SSL certificate validated successfully!');
          }
        }
      } catch (error) {
        console.error('Certificate status polling error:', error);
      }
    }, 30000); // 30 seconds

    // Cleanup interval on unmount or when status changes
    return () => clearInterval(intervalId);
  }, [customDomain?.certificateStatus]);

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

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLogoFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    // Read as base64 data URL
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setBranding({ ...branding, logoUrl: base64 });
    };
    reader.onerror = () => console.error('Failed to read logo file');
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
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

  const handleSaveCustomDomain = async () => {
    if (!hasCustomDomainAccess) {
      toast.error('Upgrade to Professional or Enterprise to use custom domains');
      return;
    }
    if (!domainInput?.trim()) {
      toast.error('Enter a domain before saving');
      return;
    }

    // Prevent using bizbytes.app subdomains - they work automatically
    const normalizedDomain = domainInput.trim().toLowerCase();
    if (normalizedDomain.endsWith('.bizbytes.app') || normalizedDomain === 'bizbytes.app') {
      toast.error('bizbytes.app subdomains work automatically - no setup needed! This feature is for your own custom domain (e.g., www.yourrestaurant.com)');
      return;
    }

    setDomainSaving(true);
    try {
      const payload = {
        domain: domainInput.trim(),
        verificationMethod
      };
      const response = await adminApiUtils.saveCustomDomain(payload);
      const domainData = response?.data?.data || null;
      if (domainData) {
        setCustomDomain(domainData);
        setVerificationMethod(domainData.verificationMethod || verificationMethod);
      }
      toast.success(response?.data?.message || 'Custom domain saved');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save custom domain';
      toast.error(message);
    } finally {
      setDomainSaving(false);
    }
  };

  const handleVerifyCustomDomain = async () => {
    if (!hasCustomDomainAccess) {
      toast.error('Upgrade to Professional or Enterprise to verify a custom domain');
      return;
    }
    if (!customDomain) {
      toast.error('Save a domain first, then verify');
      return;
    }
    setDomainVerifying(true);
    try {
      const response = await adminApiUtils.verifyCustomDomain();
      const domainData = response?.data?.data || null;
      if (domainData) {
        setCustomDomain(domainData);
        setVerificationMethod(domainData.verificationMethod || verificationMethod);
      }
      if (domainData?.active && domainData?.status === 'ACTIVE') {
        toast.success('🎉 Domain activated! Your custom domain is now live!');
      } else if (domainData?.status === 'DNS_VERIFIED') {
        toast.success('Domain verified! Provisioning SSL certificate...');
      } else if (domainData?.status === 'PROVISIONING') {
        if (domainData?.errorMessage) {
          toast.error('CNAME verification failed: ' + domainData.errorMessage);
        } else {
          toast('CloudFront provisioned! Add the CNAME record in Step 3 below.', { icon: '⏳' });
        }
      } else if (response?.data?.message && response.data.message !== 'null') {
        toast(response.data.message);
      } else {
        toast('Domain verification in progress. Please wait...', { icon: '⏳' });
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Verification failed';
      toast.error(message);
    } finally {
      setDomainVerifying(false);
    }
  };

  const handleDisableCustomDomain = async () => {
    if (!customDomain) return;
    if (!confirm('Disable custom domain and revert to your tenant URL?')) return;
    setDomainDisabling(true);
    try {
      const response = await adminApiUtils.disableCustomDomain();
      const domainData = response?.data?.data || null;
      setCustomDomain(domainData);
      toast.success(response?.data?.message || 'Custom domain disabled');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to disable domain';
      toast.error(message);
    } finally {
      setDomainDisabling(false);
    }
  };

  const handleDeleteCustomDomain = async () => {
    if (!customDomain) return;
    if (!confirm('⚠️ PERMANENT DELETE: This will delete the CloudFront distribution, SSL certificate, and all custom domain data. This action CANNOT be undone. Are you sure?')) return;
    setDomainDeleting(true);
    try {
      const response = await adminApiUtils.deleteCustomDomain();
      if (response?.data?.success) {
        setCustomDomain(null);
        setDomainInput('');
        toast.success(response?.data?.message || 'Custom domain deleted permanently');

        // Show warning if there were any issues with AWS resource cleanup
        if (response?.data?.cloudfront_warning) {
          toast(response.data.cloudfront_warning, { duration: 5000, icon: '⚠️' });
        }
      } else {
        toast.error(response?.data?.error || 'Failed to delete domain');
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete domain';
      toast.error(message);
    } finally {
      setDomainDeleting(false);
    }
  };

  const handleCheckCertificateStatus = async () => {
    if (!customDomain) return;
    setCertificateChecking(true);
    try {
      const response = await adminApiUtils.checkCertificateStatus();
      const domainData = response?.data?.data || null;
      if (domainData) {
        setCustomDomain(domainData);
        const message = response?.data?.message || 'Certificate status updated';
        if (domainData.certificateStatus === 'ISSUED' && domainData.status === 'PROVISIONING') {
          toast.success('SSL certificate validated! CloudFront provisioned. Add the CNAME record in Step 3.');
        } else if (domainData.certificateStatus === 'ISSUED') {
          toast.success(message);
        } else if (domainData.certificateStatus === 'PENDING_VALIDATION') {
          toast(message, { icon: '⏳' });
        } else {
          toast(message);
        }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to check certificate status';
      toast.error(message);
    } finally {
      setCertificateChecking(false);
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
            <TabsTrigger tabValue="custom-domain">Custom Domain</TabsTrigger>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select
                    value={hours.timezone || 'America/New_York'}
                    onChange={(e) => setHours({ ...hours, timezone: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                {Object.entries(hours).filter(([day]) => day !== 'timezone').map(([day, data]) => (
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="max-h-32 max-w-full object-contain mb-2" />
                          ) : (
                            <>
                              <Upload className="w-10 h-10 mb-3 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                    {logoPreview && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600">✓ Logo uploaded</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoPreview('');
                            setLogoFile(null);
                            setBranding({ ...branding, logoUrl: '' });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
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

          <TabsContent tabValue="custom-domain">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>Use your own URL for ordering (Professional & Enterprise)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasCustomDomainAccess && (
                  <Alert>
                    <AlertDescription>
                      <strong>Starter plan:</strong> Custom domains are available on Professional and Enterprise plans. Upgrade to enable `www.yourrestaurant.com`.
                    </AlertDescription>
                  </Alert>
                )}

                {hasCustomDomainAccess && (
                  <>
                    {domainLoading ? (
                      <div className="flex items-center text-gray-600"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading domain settings…</div>
                    ) : (
                      <>
                        <Alert>
                          <AlertDescription className="flex items-start gap-2">
                            <Globe2 className="h-4 w-4 mt-0.5 text-blue-600" />
                            <div>
                              <p className="mb-2">
                                Use your own domain (e.g., <strong>www.yourrestaurant.com</strong>) instead of your bizbytes.app subdomain.
                              </p>
                              <p className="text-sm">
                                <strong>Note:</strong> Your bizbytes.app subdomain already works automatically - no setup needed! This feature is only for using your own custom domain.
                              </p>
                            </div>
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Domain</label>
                            <Input
                              placeholder="www.yourrestaurant.com"
                              value={domainInput}
                              disabled={domainSaving || domainVerifying}
                              onChange={(e) => setDomainInput(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Verification Method</label>
                            <select
                              value={verificationMethod}
                              onChange={(e) => setVerificationMethod(e.target.value)}
                              disabled={domainSaving || domainVerifying}
                              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="DNS_TXT">DNS TXT (recommended)</option>
                              <option value="DNS_CNAME">DNS CNAME</option>
                              <option value="HTTP_FILE">HTTP file fallback</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button onClick={handleSaveCustomDomain} disabled={domainSaving || domainVerifying}>
                            {domainSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Domain
                          </Button>
                          <Button
                            onClick={handleVerifyCustomDomain}
                            disabled={domainVerifying || domainSaving || !domainInput}
                            variant="outline"
                          >
                            {domainVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                            Verify & Activate
                          </Button>
                          {customDomain?.active && (
                            <Button
                              onClick={handleDisableCustomDomain}
                              disabled={domainDisabling}
                              variant="ghost"
                            >
                              {domainDisabling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlink className="h-4 w-4 mr-2" />}
                              Disable Domain
                            </Button>
                          )}
                          {customDomain && (
                            <Button
                              onClick={handleDeleteCustomDomain}
                              disabled={domainDeleting}
                              variant="destructive"
                            >
                              {domainDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                              Delete Permanently
                            </Button>
                          )}
                        </div>

                        {/* Overall Status */}
                        <div className="rounded-lg border p-4 bg-gray-50">
                          <div className="flex items-center gap-3">
                            {customDomain?.active ? (
                              <ShieldCheck className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            )}
                            <div>
                              <p className="text-xs uppercase text-gray-500">Status</p>
                              <p className={`font-semibold ${customDomain?.active ? 'text-green-700' : 'text-gray-800'}`}>
                                {customDomain?.status || 'Not configured'}
                              </p>
                              {customDomain?.cloudfrontDomainName && (
                                <p className="text-xs text-gray-600">Edge: {customDomain.cloudfrontDomainName}</p>
                              )}
                            </div>
                          </div>
                          {customDomain?.errorMessage && (
                            <Alert className="bg-red-50 border-red-200 mt-3">
                              <AlertDescription className="text-red-700">
                                {customDomain.errorMessage}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        {/* Step 1: Domain Ownership Verification */}
                        {customDomain && (
                          <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                customDomain.status === 'PENDING_VERIFICATION'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                1
                              </div>
                              <h3 className="font-semibold text-gray-900">Domain Ownership Verification</h3>
                              {customDomain.status !== 'PENDING_VERIFICATION' && (
                                <ShieldCheck className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                            </div>

                            <p className="text-sm text-gray-600">
                              Add this DNS record to your domain registrar to prove you own the domain:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                              <div>
                                <p className="text-xs text-gray-500">Record Type</p>
                                <p className="font-mono text-sm font-semibold">{customDomain.verificationRecordType || 'TXT'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs text-gray-500">Record Name / Host</p>
                                <p className="font-mono text-sm break-words font-semibold text-blue-700">
                                  {(() => {
                                    // Extract base domain (last 2 parts: e.g., shoplandofthefree.com from www.shoplandofthefree.com)
                                    const baseDomain = customDomain.domain.split('.').slice(-2).join('.');
                                    const host = customDomain.verificationRecordName?.replace(`.${baseDomain}`, '') || `_bizbytes-verification`;
                                    // Remove trailing dot (in case backend returns FQDN with trailing dot)
                                    return host.endsWith('.') ? host.slice(0, -1) : host;
                                  })()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Full name: {customDomain.verificationRecordName || `_bizbytes-verification.${domainInput}`}
                                </p>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-xs text-gray-500">Record Value / Content</p>
                              <p className="font-mono text-sm break-words">
                                {customDomain.verificationRecordValue || 'value will appear after saving'}
                              </p>
                            </div>

                            <Alert className="bg-blue-50 border-blue-200">
                              <AlertDescription className="text-sm text-blue-900">
                                <strong>Important:</strong> When adding this to your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.),
                                only enter the <strong className="text-blue-700">highlighted subdomain part</strong> in the "Host" or "Name" field.
                                Your DNS provider automatically adds your domain name.
                                <br />
                                <span className="text-xs mt-1 block">DNS changes may take 5-30 minutes to propagate.</span>
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}

                        {/* Step 2: SSL Certificate Validation */}
                        {customDomain && customDomain.status !== 'PENDING_VERIFICATION' && customDomain.acmValidationCnameName && (
                          <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                customDomain.certificateStatus === 'ISSUED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                2
                              </div>
                              <h3 className="font-semibold text-gray-900">SSL Certificate Validation</h3>
                              {customDomain.certificateStatus === 'ISSUED' && (
                                <ShieldCheck className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                              {customDomain.certificateStatus === 'PENDING_VALIDATION' && (
                                <Loader2 className="h-4 w-4 text-blue-600 animate-spin ml-auto" />
                              )}
                            </div>

                            {customDomain.certificateStatus === 'ISSUED' ? (
                              <Alert className="bg-green-50 border-green-200">
                                <AlertDescription className="text-green-700">
                                  SSL certificate validated successfully! Your custom domain is ready.
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600">
                                  Add this CNAME record to enable SSL/HTTPS for your custom domain:
                                </p>

                                <div className="bg-gray-50 p-3 rounded space-y-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Record Type</p>
                                    <p className="font-mono text-sm font-semibold">CNAME</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Record Name / Host</p>
                                    <p className="font-mono text-sm break-words font-semibold text-blue-700">
                                      {(() => {
                                        // Extract base domain (last 2 parts)
                                        const baseDomain = customDomain.domain.split('.').slice(-2).join('.');
                                        const host = customDomain.acmValidationCnameName?.replace(`.${baseDomain}`, '') || '';
                                        // Remove trailing dot (AWS returns FQDNs with trailing dots)
                                        return host.endsWith('.') ? host.slice(0, -1) : host;
                                      })()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Full name: {customDomain.acmValidationCnameName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Record Value / Points to</p>
                                    <p className="font-mono text-sm break-words">{customDomain.acmValidationCnameValue}</p>
                                  </div>
                                </div>

                                <Alert className="bg-blue-50 border-blue-200">
                                  <AlertDescription className="text-sm text-blue-900">
                                    <strong>Important:</strong> When adding this CNAME to your DNS provider,
                                    only enter the <strong className="text-blue-700">highlighted subdomain part</strong> in the "Host" or "Name" field.
                                    Copy the full "Points to" value exactly as shown.
                                    <br />
                                    <span className="text-xs mt-1 block">SSL validation takes 5-30 minutes. We'll automatically check status every 30 seconds.</span>
                                  </AlertDescription>
                                </Alert>

                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleCheckCertificateStatus}
                                    disabled={certificateChecking}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {certificateChecking ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                    )}
                                    Check Validation Status
                                  </Button>
                                  <p className="text-xs text-gray-500 self-center">
                                    Status: {customDomain.certificateStatus || 'Unknown'}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Step 3: Point Your Domain to CloudFront */}
                        {customDomain && customDomain.certificateStatus === 'ISSUED' && customDomain.cloudfrontDomainName && (
                          <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                customDomain.active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                3
                              </div>
                              <h3 className="font-semibold text-gray-900">Point Your Domain to CloudFront</h3>
                              {customDomain.active && (
                                <ShieldCheck className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                            </div>

                            {customDomain.active ? (
                              <Alert className="bg-green-50 border-green-200">
                                <AlertDescription className="text-green-700">
                                  Your domain is live and accessible! Customers can now visit your custom domain.
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600">
                                  Add this CNAME record to route traffic from your custom domain to your website:
                                </p>

                                <div className="bg-gray-50 p-3 rounded space-y-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Record Type</p>
                                    <p className="font-mono text-sm font-semibold">CNAME</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Record Name / Host</p>
                                    <p className="font-mono text-sm break-words font-semibold text-blue-700">
                                      {customDomain.domain?.split('.')[0] || 'www'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      This is the subdomain part of your domain (e.g., "www" for www.yourrestaurant.com)
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Record Value / Points to</p>
                                    <p className="font-mono text-sm break-words font-semibold text-green-700">
                                      {customDomain.cloudfrontDomainName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">TTL (Time to Live)</p>
                                    <p className="font-mono text-sm">3600 (or Automatic)</p>
                                  </div>
                                </div>

                                <Alert className="bg-blue-50 border-blue-200">
                                  <AlertDescription className="text-sm text-blue-900">
                                    <strong>Important:</strong> Add this CNAME record to your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.).
                                    Enter only the <strong className="text-blue-700">subdomain part</strong> in the "Host" or "Name" field.
                                    <br />
                                    <span className="text-xs mt-1 block">
                                      DNS changes take 5-30 minutes to propagate globally. Click "Verify & Activate" below after adding the record.
                                    </span>
                                  </AlertDescription>
                                </Alert>

                                <Button
                                  onClick={handleVerifyDomain}
                                  disabled={verifyLoading}
                                  className="w-full"
                                >
                                  {verifyLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Verifying CNAME...
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                      Verify & Activate Domain
                                    </>
                                  )}
                                </Button>

                                {customDomain.errorMessage && (
                                  <Alert className="bg-yellow-50 border-yellow-200">
                                    <AlertDescription className="text-sm text-yellow-900">
                                      <strong>Verification Issue:</strong> {customDomain.errorMessage}
                                      <br />
                                      <span className="text-xs mt-1 block">
                                        Make sure the CNAME record has been added correctly and allow time for DNS propagation (5-30 minutes).
                                      </span>
                                    </AlertDescription>
                                  </Alert>
                                )}

                                <Alert className="bg-amber-50 border-amber-200">
                                  <AlertDescription className="text-sm text-amber-900">
                                    <strong>Example for www.yourrestaurant.com:</strong>
                                    <br />
                                    <span className="text-xs mt-1 block font-mono">
                                      Type: CNAME | Host: www | Points to: {customDomain.cloudfrontDomainName}
                                    </span>
                                  </AlertDescription>
                                </Alert>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
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

                  {/* Plan restriction notice */}
                  {isBasicPlan && (
                    <Alert className="mb-4">
                      <AlertDescription>
                        <strong>Starter Plan:</strong> You're currently on the Starter plan which includes Stripe payment processing.
                        Upgrade to Professional or Enterprise to unlock Clover and Square POS payment processing.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className={`grid grid-cols-1 gap-4 ${canUsePosPayments ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
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

                    {/* Clover Option - Only for PREMIUM and ENTERPRISE plans */}
                    {canUsePosPayments && (
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
                    )}

                    {/* Square Option - Only for PREMIUM and ENTERPRISE plans */}
                    {canUsePosPayments && (
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
                    )}
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

                    {/* Clover Status - Only for PREMIUM and ENTERPRISE plans */}
                    {canUsePosPayments && (
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
                    )}

                    {/* Square Status - Only for PREMIUM and ENTERPRISE plans */}
                    {canUsePosPayments && (
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
                    )}
                  </div>

                  {/* Clover connection info - Only for PREMIUM and ENTERPRISE plans */}
                  {canUsePosPayments && !paymentConfig.cloverConfigured && (
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

                  {/* Square connection info - Only for PREMIUM and ENTERPRISE plans */}
                  {canUsePosPayments && !paymentConfig.squareConfigured && (
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

                      <Alert className="mt-4 border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>Note:</strong> Clover does not provide item images or descriptions.
                          After syncing, please visit{' '}
                          <button
                            onClick={() => setActiveTab('menu')}
                            className="text-blue-600 underline font-semibold hover:text-blue-700"
                          >
                            Menu Management
                          </button>
                          {' '}to add these fields manually for better customer experience.
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
