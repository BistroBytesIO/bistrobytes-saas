import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import adminApi, { adminApiUtils } from '@/services/adminApi';
import soundService from '@/services/soundService';
import Modal from 'react-modal';
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ImageUpload from '@/components/admin/ImageUpload';
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  UtensilsCrossed,
  DollarSign,
  Package,
  Star,
  Search,
  Filter,
  Gift,
  Lock,
  X,
  FolderOpen
} from 'lucide-react';

// Set app element for react-modal accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement(document.getElementById('root') || document.body);
}

function AdminMenu() {
  const { user, getTenantId } = useRestaurantAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFeatured, setFilterFeatured] = useState('all'); // 'all', 'featured', 'regular'
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [planType, setPlanType] = useState(''); // BASIC, PREMIUM, or ENTERPRISE

  // Form for adding new items
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    isFeatured: false,
    categoryId: '',
  });

  // Modal for editing items
  const [modalForm, setModalForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    isFeatured: false,
    isRewardItem: false,
    pointsToRedeem: '',
    imageUrl: '',
    cloverItemId: null,
    squareItemId: null,
    categoryId: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Category management state
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const tenantId = getTenantId();

  // Check if current plan allows rewards features
  const canUseRewards = planType !== 'BASIC'; // Only PREMIUM and ENTERPRISE can use rewards

  useEffect(() => {
    console.log('🚀 AdminMenu component mounted');
    fetchMenuItems();
    loadRestaurantProfile();
    fetchCategories();
  }, []);

  // Filter items based on search and featured filter
  useEffect(() => {
    let filtered = menuItems;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply featured filter
    if (filterFeatured === 'featured') {
      filtered = filtered.filter(item => item.isFeatured);
    } else if (filterFeatured === 'regular') {
      filtered = filtered.filter(item => !item.isFeatured);
    }

    setFilteredItems(filtered);
  }, [menuItems, searchTerm, filterFeatured]);

  const fetchMenuItems = async () => {
    console.log('📊 Fetching menu items...');
    setIsLoadingItems(true);
    try {
      const response = await adminApiUtils.getMenuItems();
      console.log('✅ Fetched menu items:', response.data);
      if (Array.isArray(response.data)) {
        setMenuItems(response.data);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('❌ Error fetching menu items:', error);
      setMenuItems([]);
      toast.error('Failed to fetch menu items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const loadRestaurantProfile = async () => {
    try {
      const response = await adminApiUtils.getRestaurantProfile();
      if (response?.data) {
        setPlanType(response.data.planType || 'BASIC');
      }
    } catch (error) {
      console.error('❌ Error loading restaurant profile:', error);
      // Default to BASIC if loading fails
      setPlanType('BASIC');
    }
  };

  const fetchCategories = async () => {
    console.log('📂 Fetching categories...');
    setIsLoadingCategories(true);
    try {
      const response = await adminApiUtils.getCategories();
      console.log('✅ Fetched categories:', response.data);
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategories([]);
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Category management handlers
  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setCategoryLoading(true);
    try {
      await adminApiUtils.createCategory(categoryForm);
      toast.success('Category created successfully');
      soundService.playSuccess();
      setCategoryForm({ name: '', description: '' });
      await fetchCategories();
    } catch (error) {
      console.error('❌ Error creating category:', error);
      if (error.response?.data?.error?.includes('already exists')) {
        toast.error('A category with this name already exists');
      } else {
        toast.error(error.response?.data?.error || 'Failed to create category');
      }
      soundService.playError();
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCategoryEditClick = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || '' });
    setIsCategoryModalOpen(true);
  };

  const handleCategoryUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setCategoryLoading(true);
    try {
      await adminApiUtils.updateCategory(editingCategory.id, categoryForm);
      toast.success('Category updated successfully');
      soundService.playSuccess();
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '' });
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      console.error('❌ Error updating category:', error);
      if (error.response?.data?.error?.includes('already exists')) {
        toast.error('A category with this name already exists');
      } else {
        toast.error(error.response?.data?.error || 'Failed to update category');
      }
      soundService.playError();
    } finally {
      setCategoryLoading(false);
    }
  };

  const confirmCategoryDelete = (category) => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="mb-3">
            Delete <strong>{category.name}</strong>?
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                toast.dismiss(t.id);
                deleteCategoryItem(category);
              }}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete
            </Button>
            <Button
              onClick={() => toast.dismiss(t.id)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-center',
      }
    );
  };

  const deleteCategoryItem = async (category) => {
    try {
      await adminApiUtils.deleteCategory(category.id);
      toast.success('Category deleted successfully');
      soundService.playSuccess();
      await fetchCategories();
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      if (error.response?.data?.error?.includes('menu items are assigned')) {
        toast.error('Cannot delete: Items are assigned to this category. Reassign items first.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to delete category');
      }
      soundService.playError();
    }
  };

  // Helper functions for POS-aware field locking
  const isPOSSynced = (item) => {
    return !!(item?.cloverItemId || item?.squareItemId);
  };

  const isSquareImage = (imageUrl) => {
    if (!imageUrl) return false;
    return imageUrl.includes('squarecdn.com') || imageUrl.includes('square.com');
  };

  const isImageReadOnly = (item) => {
    return item?.squareItemId && isSquareImage(item?.imageUrl);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name || !form.description || !form.price || !form.stockQuantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(form.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (parseInt(form.stockQuantity) < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        ...form,
        price: parseFloat(form.price),
        stockQuantity: parseInt(form.stockQuantity)
      };

      await adminApiUtils.createMenuItem(itemData);
      toast.success('Menu item added successfully!');
      soundService.playSuccess();
      
      // Reset form
      setForm({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        isFeatured: false,
        categoryId: '',
      });
      
      await fetchMenuItems();
    } catch (error) {
      toast.error('Failed to add menu item.');
      soundService.playError();
      console.error('Error adding menu item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setModalForm({
      name: item.name,
      description: item.description,
      price: item?.price != null ? item.price.toString() : '',
      stockQuantity: item?.stockQuantity != null ? item.stockQuantity.toString() : '',
      isFeatured: item.isFeatured,
      isRewardItem: item.isRewardItem || false,
      pointsToRedeem: item?.pointsToRedeem != null ? item.pointsToRedeem.toString() : '',
      imageUrl: item.imageUrl || '',
      cloverItemId: item.cloverItemId || null,
      squareItemId: item.squareItemId || null,
      categoryId: item.categoryId || '',
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file) => {
    try {
      console.log('Uploading image for item:', selectedItem.id, 'File:', file.name);
      const response = await adminApiUtils.uploadMenuItemImage(selectedItem.id, file);
      console.log('Upload image response:', response);

      if (response.data?.imageUrl) {
        const newImageUrl = response.data.imageUrl;

        // Update modal form state
        setModalForm(prev => ({ ...prev, imageUrl: newImageUrl }));

        // Update selected item state so modal shows updated data immediately
        setSelectedItem(prev => ({ ...prev, imageUrl: newImageUrl }));

        // Update the item in menuItems array immediately so reopening modal shows the image
        setMenuItems(prevItems =>
          prevItems.map(item =>
            item.id === selectedItem.id
              ? { ...item, imageUrl: newImageUrl }
              : item
          )
        );

        // Show success toast
        toast.success('Image uploaded successfully');

        // Refresh menu items list in background for consistency (don't await)
        fetchMenuItems().catch(err => {
          console.error('Failed to refresh menu items (non-critical):', err);
        });
      }
    } catch (error) {
      console.error('Failed to upload image - Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error(`Failed to upload image: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      throw error; // Re-throw to trigger error state in ImageUpload component
    }
  };

  const handleImageRemove = async () => {
    try {
      console.log('Removing image for item:', selectedItem.id);
      const response = await adminApiUtils.deleteMenuItemImage(selectedItem.id);
      console.log('Delete image response:', response);

      // Update modal form state
      setModalForm(prev => ({ ...prev, imageUrl: '' }));

      // Update selected item state so modal shows updated data immediately
      setSelectedItem(prev => ({ ...prev, imageUrl: null }));

      // Update the item in menuItems array immediately so reopening modal reflects deletion
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item.id === selectedItem.id
            ? { ...item, imageUrl: null }
            : item
        )
      );

      // Show success toast
      toast.success('Image removed');

      // Refresh menu items list in background for consistency (don't await)
      fetchMenuItems().catch(err => {
        console.error('Failed to refresh menu items (non-critical):', err);
      });

    } catch (error) {
      console.error('Failed to remove image - Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error(`Failed to remove image: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      throw error; // Re-throw to trigger error state in ImageUpload component
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!modalForm.name || !modalForm.description || !modalForm.price || !modalForm.stockQuantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(modalForm.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (parseInt(modalForm.stockQuantity) < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    // Validate reward item fields
    if (modalForm.isRewardItem) {
      if (!modalForm.pointsToRedeem || parseInt(modalForm.pointsToRedeem) <= 0) {
        toast.error('Points to redeem must be greater than 0 for reward items');
        return;
      }
    }

    setUpdateLoading(true);
    try {
      const itemData = {
        ...modalForm,
        price: parseFloat(modalForm.price),
        stockQuantity: parseInt(modalForm.stockQuantity),
        pointsToRedeem: modalForm.isRewardItem && modalForm.pointsToRedeem
          ? parseInt(modalForm.pointsToRedeem)
          : null,
        categoryId: modalForm.categoryId ? parseInt(modalForm.categoryId) : null
      };

      await adminApiUtils.updateMenuItem(selectedItem.id, itemData);
      toast.success('Menu item updated successfully!');
      soundService.playSuccess();
      setIsModalOpen(false);
      await fetchMenuItems();
    } catch (error) {
      toast.error('Failed to update menu item.');
      soundService.playError();
      console.error('Error updating menu item:', error);
    } finally {
      setUpdateLoading(false);
      setModalForm({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        isFeatured: false,
        isRewardItem: false,
        pointsToRedeem: '',
        categoryId: '',
      });
    }
  };

  const confirmDelete = async (item) => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="mb-3">
            Are you sure you want to delete <strong>{item.name}</strong>?
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                toast.dismiss(t.id);
                deleteItem(item);
              }}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete
            </Button>
            <Button
              onClick={() => toast.dismiss(t.id)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-center',
      }
    );
  };

  const deleteItem = async (item) => {
    try {
      await adminApiUtils.deleteMenuItem(item.id);
      toast.success(`${item.name} has been deleted successfully!`);
      soundService.playSuccess();
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete the item.');
      soundService.playError();
    }
  };

  const getStockStatus = (stockQuantity) => {
    if (stockQuantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (stockQuantity <= 10) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600">
              Manage your restaurant's menu items, pricing, and inventory
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <UtensilsCrossed size={14} />
              {menuItems.length} Items
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star size={14} />
              {menuItems.filter(item => item.isFeatured).length} Featured
            </Badge>
          </div>
        </div>

        {/* Tabs for Menu Items and Categories */}
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="items">
              <UtensilsCrossed size={16} className="mr-2" />
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderOpen size={16} className="mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Menu Items Tab */}
          <TabsContent value="items" className="mt-6 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <select
                      value={filterFeatured}
                      onChange={(e) => setFilterFeatured(e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="all">All Items</option>
                      <option value="featured">Featured Only</option>
                      <option value="regular">Regular Only</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Plan Upgrade Prompt for Starter users */}
        {planType === 'BASIC' && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <strong>Starter Plan:</strong> You have full menu management including modifiers and options.
                Upgrade to Professional for combo meals, menu analytics, loyalty rewards, and advanced upsells.
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/settings?tab=billing')}>
                View Upgrade Options
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Add New Item Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} />
              Add New Menu Item
            </CardTitle>
            <CardDescription>
              Create a new menu item for your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="e.g., Burger Deluxe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      type="number"
                      name="price"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <Textarea
                  name="description"
                  placeholder="Describe your menu item..."
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      type="number"
                      name="stockQuantity"
                      placeholder="0"
                      min="0"
                      value={form.stockQuantity}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={form.isFeatured}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700 flex items-center gap-1">
                      <Star size={16} />
                      Featured Item
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {loading ? (
                    <ClipLoader color="#ffffff" size={20} />
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Add Menu Item
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Menu Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Menu Items</CardTitle>
            <CardDescription>
              {filteredItems.length} of {menuItems.length} items shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ClipLoader color="#4F46E5" size={40} />
                  <p className="mt-4 text-gray-600">Loading menu items...</p>
                </div>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.stockQuantity);
                  return (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            {item.name}
                            {item.isFeatured && (
                              <Star size={16} className="text-yellow-500 fill-current" />
                            )}
                          </h4>
                          <span className="font-bold text-green-600 text-lg">
                            ${item.price ? item.price.toFixed(2) : '0.00'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Stock: {item.stockQuantity}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateClick(item)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => confirmDelete(item)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <UtensilsCrossed size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterFeatured !== 'all' ? 'No items match your filters' : 'No menu items found'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterFeatured !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Add your first menu item using the form above!'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6 space-y-6">
            {/* Add New Category Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus size={20} />
                  Add New Category
                </CardTitle>
                <CardDescription>
                  Create menu categories to organize your items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name *
                      </label>
                      <Input
                        type="text"
                        name="name"
                        placeholder="e.g., Appetizers, Main Courses"
                        value={categoryForm.name}
                        onChange={handleCategoryChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <Input
                        type="text"
                        name="description"
                        placeholder="Brief description of this category"
                        value={categoryForm.description}
                        onChange={handleCategoryChange}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={categoryLoading}>
                      {categoryLoading ? (
                        <ClipLoader color="#ffffff" size={20} />
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Add Category
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Categories List Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen size={20} />
                  All Categories
                </CardTitle>
                <CardDescription>
                  {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <ClipLoader color="#4F46E5" size={40} />
                      <p className="mt-4 text-gray-600">Loading categories...</p>
                    </div>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="space-y-3">
                    {categories.map(category => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryEditClick(category)}
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmCategoryDelete(category)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                    <p className="text-gray-500">
                      Add your first category above to organize your menu items!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Update Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Update Menu Item"
        className="relative bg-white w-full max-w-2xl mx-auto mt-8 p-6 rounded-lg shadow-lg focus:outline-none max-h-[90vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50 p-4"
      >
        {/* Modal Header with Close Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Update Menu Item</h2>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {/* POS Sync Notice */}
          {isPOSSynced(selectedItem) && (
            <Alert className="bg-blue-50 border-blue-200">
              <Lock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>POS-Synced Item:</strong> Name and Price are managed by{' '}
                {selectedItem?.cloverItemId ? 'Clover' : 'Square'} POS.
                {selectedItem?.cloverItemId && ' Add images and descriptions manually.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Image Upload Section */}
          <ImageUpload
            currentImageUrl={modalForm.imageUrl}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            readOnly={isImageReadOnly(selectedItem)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                Item Name *
                {isPOSSynced(selectedItem) && <Lock size={12} className="text-gray-400" />}
              </label>
              <Input
                type="text"
                name="name"
                value={modalForm.name}
                onChange={handleModalChange}
                disabled={isPOSSynced(selectedItem)}
                className={isPOSSynced(selectedItem) ? 'bg-gray-100 cursor-not-allowed' : ''}
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                Price ($) *
                {isPOSSynced(selectedItem) && <Lock size={12} className="text-gray-400" />}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  value={modalForm.price}
                  onChange={handleModalChange}
                  disabled={isPOSSynced(selectedItem)}
                  className={isPOSSynced(selectedItem) ? 'bg-gray-100 cursor-not-allowed pl-10' : 'pl-10'}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Textarea
              name="description"
              rows={4}
              value={modalForm.description}
              onChange={handleModalChange}
              className="resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="number"
                  name="stockQuantity"
                  min="0"
                  value={modalForm.stockQuantity}
                  onChange={handleModalChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (Optional)
              </label>
              <select
                name="categoryId"
                value={modalForm.categoryId}
                onChange={handleModalChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {isPOSSynced(selectedItem) && (
                <p className="text-xs text-blue-600 mt-1">
                  Categories can be set for POS-synced items
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={modalForm.isFeatured}
                  onChange={handleModalChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-2 text-gray-700 flex items-center gap-1">
                  <Star size={16} />
                  Featured Item
                </span>
              </label>
            </div>
          </div>

          {/* Reward Item Section - Only for PREMIUM and ENTERPRISE plans */}
          {canUseRewards && (
            <div className="border-t pt-4">
              <div className="mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isRewardItem"
                    checked={modalForm.isRewardItem}
                    onChange={handleModalChange}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-gray-700 flex items-center gap-1 font-medium">
                    <Gift size={16} className="text-purple-600" />
                    Reward Item
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Allow customers to redeem this item with loyalty points
                </p>
              </div>

              {modalForm.isRewardItem && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points to Redeem *
                  </label>
                  <div className="relative max-w-xs">
                    <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      type="number"
                      name="pointsToRedeem"
                      placeholder="e.g., 100"
                      min="1"
                      value={modalForm.pointsToRedeem}
                      onChange={handleModalChange}
                      className="pl-10"
                      required={modalForm.isRewardItem}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Number of loyalty points required to redeem this item
                  </p>
                </div>
              )}
            </div>
          )}

          {!canUseRewards && (
            <Alert className="mt-4">
              <AlertDescription>
                <strong>Starter Plan:</strong> Loyalty rewards are available on Professional and Enterprise plans.
                Upgrade your plan to enable reward items and customer loyalty programs.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {updateLoading ? (
                <ClipLoader color="#ffffff" size={20} />
              ) : (
                <>
                  <Edit size={16} className="mr-2" />
                  Update Item
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setModalForm({
                  name: '',
                  description: '',
                  price: '',
                  stockQuantity: '',
                  isFeatured: false,
                  isRewardItem: false,
                  pointsToRedeem: '',
                });
                setIsModalOpen(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Edit Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onRequestClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryForm({ name: '', description: '' });
          setEditingCategory(null);
        }}
        contentLabel="Edit Category"
        className="relative bg-white w-full max-w-md mx-auto mt-8 p-6 rounded-lg shadow-lg focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Category</h2>
          <button
            type="button"
            onClick={() => {
              setIsCategoryModalOpen(false);
              setCategoryForm({ name: '', description: '' });
              setEditingCategory(null);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleCategoryUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <Input
              type="text"
              name="name"
              value={categoryForm.name}
              onChange={handleCategoryChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <Input
              type="text"
              name="description"
              value={categoryForm.description}
              onChange={handleCategoryChange}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={categoryLoading}
              className="flex-1"
            >
              {categoryLoading ? (
                <ClipLoader color="#ffffff" size={20} />
              ) : (
                <>
                  <Edit size={16} className="mr-2" />
                  Update Category
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setCategoryForm({ name: '', description: '' });
                setEditingCategory(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

export default AdminMenu;
