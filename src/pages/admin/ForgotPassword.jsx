import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Building2, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', tenantId: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.tenantId) {
      toast.error('Email and Restaurant ID are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: form.email }, {
        headers: { 'X-Tenant-Id': form.tenantId }
      });
      toast.success('If the email exists, a reset link was sent');
      navigate('/admin/login');
    } catch (e) {
      // Keep generic to avoid account enumeration
      toast.success('If the email exists, a reset link was sent');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Forgot Password</CardTitle>
          <CardDescription>We’ll email you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantId">Restaurant ID</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input id="tenantId" name="tenantId" value={form.tenantId} onChange={onChange} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input id="email" name="email" type="email" value={form.email} onChange={onChange} className="pl-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : 'Send Reset Link'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/admin/login')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword;

