import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { adminApiUtils } from '@/services/adminApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import ClipLoader from 'react-spinners/ClipLoader';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  TrendingUp,
  Users,
  Percent,
  DollarSign,
  Search
} from 'lucide-react';

function PromoCodesManager() {
  const { user } = useRestaurantAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // create or edit

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minimumOrderValue: '',
    maxDiscountAmount: '',
    maxUses: '',
    maxUsesPerCustomer: '1',
    validFrom: '',
    validUntil: '',
    firstTimeCustomersOnly: false
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check for create parameter in URL
    if (searchParams.get('create') === 'true' && user?.planType !== 'BASIC') {
      openCreateModal();
    }

    fetchPromoCodes();
  }, [searchParams]);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const response = await adminApiUtils.getAllPromoCodes();
      setPromoCodes(response.data.data || []);
      console.log('✅ Promo codes loaded:', response.data.data);
    } catch (error) {
      console.error('❌ Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingCode(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minimumOrderValue: '',
      maxDiscountAmount: '',
      maxUses: '',
      maxUsesPerCustomer: '1',
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: '',
      firstTimeCustomersOnly: false
    });
    setShowModal(true);
  };

  const openEditModal = (promoCode) => {
    setModalMode('edit');
    setEditingCode(promoCode);
    setFormData({
      code: promoCode.code,
      description: promoCode.description || '',
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue.toString(),
      minimumOrderValue: promoCode.minimumOrderValue?.toString() || '',
      maxDiscountAmount: promoCode.maxDiscountAmount?.toString() || '',
      maxUses: promoCode.maxUses?.toString() || '',
      maxUsesPerCustomer: promoCode.maxUsesPerCustomer?.toString() || '1',
      validFrom: promoCode.validFrom ? promoCode.validFrom.slice(0, 16) : '',
      validUntil: promoCode.validUntil ? promoCode.validUntil.slice(0, 16) : '',
      firstTimeCustomersOnly: promoCode.firstTimeCustomersOnly || false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minimumOrderValue: formData.minimumOrderValue ? parseFloat(formData.minimumOrderValue) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        maxUsesPerCustomer: formData.maxUsesPerCustomer ? parseInt(formData.maxUsesPerCustomer) : 1,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || null,
        firstTimeCustomersOnly: formData.firstTimeCustomersOnly
      };

      if (modalMode === 'create') {
        await adminApiUtils.createPromoCode(payload);
        toast.success('Promo code created successfully!');
      } else {
        await adminApiUtils.updatePromoCode(editingCode.id, payload);
        toast.success('Promo code updated successfully!');
      }

      setShowModal(false);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error submitting promo code:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save promo code';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (promoCode) => {
    try {
      await adminApiUtils.togglePromoCodeStatus(promoCode.id);
      toast.success(`Promo code ${promoCode.isActive ? 'deactivated' : 'activated'}`);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error toggling promo code status:', error);
      toast.error('Failed to update promo code status');
    }
  };

  const handleDelete = async (promoCode) => {
    if (!window.confirm(`Are you sure you want to delete the promo code "${promoCode.code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminApiUtils.deletePromoCode(promoCode.id);
      toast.success('Promo code deleted successfully');
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  // Filter promo codes
  const filteredPromoCodes = promoCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && code.isActive) ||
                         (filterStatus === 'inactive' && !code.isActive);

    return matchesSearch && matchesStatus;
  });

  const getDiscountTypeLabel = (type) => {
    const labels = {
      'PERCENTAGE': 'Percentage',
      'FIXED_AMOUNT': 'Fixed Amount',
      'FREE_SHIPPING': 'Free Shipping',
      'BUY_X_GET_Y': 'Buy X Get Y'
    };
    return labels[type] || type;
  };

  const getDiscountDisplay = (code) => {
    switch (code.discountType) {
      case 'PERCENTAGE':
        return `${code.discountValue}% off`;
      case 'FIXED_AMOUNT':
        return `$${code.discountValue} off`;
      case 'FREE_SHIPPING':
        return 'Free Shipping';
      case 'BUY_X_GET_Y':
        return `${code.discountValue}% off`;
      default:
        return code.discountValue;
    }
  };

  // Check if user has access to this feature
  if (user?.planType === 'BASIC') {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto py-12">
          <Card className="border-2 border-purple-200">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Tag className="h-16 w-16 text-purple-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Upgrade to Professional
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Unlock powerful promo code features to boost customer engagement and drive more sales with targeted discounts and promotions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
                  <div className="bg-purple-50 p-4 rounded-lg text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Create Unlimited Codes</h3>
                    <p className="text-sm text-gray-600">Generate as many promo codes as you need for different campaigns</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Track Performance</h3>
                    <p className="text-sm text-gray-600">Monitor redemptions and measure campaign success</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Advanced Targeting</h3>
                    <p className="text-sm text-gray-600">Target first-time customers or specific menu items</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Flexible Discounts</h3>
                    <p className="text-sm text-gray-600">Percentage off, fixed amounts, or free shipping</p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/admin/subscription')}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                >
                  Upgrade to Professional
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-6 w-6 text-green-600" />
              Promo Codes
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage discount codes for your customers
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Promo Code
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search promo codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('active')}
                  size="sm"
                  className={filterStatus === 'active' ? 'bg-green-600' : ''}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('inactive')}
                  size="sm"
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promo Codes List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <ClipLoader color="#16a34a" size={50} />
          </div>
        ) : filteredPromoCodes.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No promo codes found' : 'No promo codes yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first promo code to start offering discounts to customers'}
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Promo Code
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPromoCodes.map((code) => (
              <Card key={code.id} className={`${!code.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Code Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{code.code}</h3>
                        <Badge className={code.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {code.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {code.isValid && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Valid
                          </Badge>
                        )}
                      </div>

                      {code.description && (
                        <p className="text-gray-600 mb-3">{code.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Discount</p>
                          <p className="font-semibold text-green-600 flex items-center">
                            {code.discountType === 'PERCENTAGE' ? (
                              <Percent className="h-4 w-4 mr-1" />
                            ) : (
                              <DollarSign className="h-4 w-4 mr-1" />
                            )}
                            {getDiscountDisplay(code)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 mb-1">Usage</p>
                          <p className="font-semibold flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {code.currentUses || 0}
                            {code.maxUses ? ` / ${code.maxUses}` : ' / ∞'}
                          </p>
                        </div>

                        {code.validUntil && (
                          <div>
                            <p className="text-gray-500 mb-1">Expires</p>
                            <p className="font-semibold flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(code.validUntil).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {code.minimumOrderValue > 0 && (
                          <div>
                            <p className="text-gray-500 mb-1">Min Order</p>
                            <p className="font-semibold">${code.minimumOrderValue}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        onClick={() => handleToggleStatus(code)}
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none"
                      >
                        {code.isActive ? (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => openEditModal(code)}
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        onClick={() => handleDelete(code)}
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {modalMode === 'create' ? 'Create' : 'Edit'} Promo Code
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                      disabled={modalMode === 'edit'}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Summer promotion - 20% off all orders"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Discount Type and Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED_AMOUNT">Fixed Amount</option>
                        <option value="FREE_SHIPPING">Free Shipping</option>
                        <option value="BUY_X_GET_Y">Buy X Get Y</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Value <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '10.00'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.discountType === 'PERCENTAGE' ? 'Enter percentage (e.g., 20 for 20%)' : 'Enter dollar amount'}
                      </p>
                    </div>
                  </div>

                  {/* Min Order Value and Max Discount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order Value
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.minimumOrderValue}
                        onChange={(e) => setFormData({ ...formData, minimumOrderValue: e.target.value })}
                        placeholder="25.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Discount Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maxDiscountAmount}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                        placeholder="50.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cap for percentage discounts</p>
                    </div>
                  </div>

                  {/* Max Uses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Total Uses
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        placeholder="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Uses Per Customer
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxUsesPerCustomer}
                        onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value })}
                        placeholder="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Valid Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid From <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Until
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                    </div>
                  </div>

                  {/* First Time Customers Only */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="firstTimeOnly"
                      checked={formData.firstTimeCustomersOnly}
                      onChange={(e) => setFormData({ ...formData, firstTimeCustomersOnly: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="firstTimeOnly" className="ml-2 block text-sm text-gray-700">
                      Only for first-time customers
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => setShowModal(false)}
                      variant="outline"
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <ClipLoader color="#ffffff" size={16} className="mr-2" />
                          {modalMode === 'create' ? 'Creating...' : 'Updating...'}
                        </>
                      ) : (
                        modalMode === 'create' ? 'Create Promo Code' : 'Update Promo Code'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default PromoCodesManager;
