import React, { useState, useEffect, useRef } from 'react';
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
  Filter
} from 'lucide-react';

// Set app element for react-modal accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement(document.getElementById('root') || document.body);
}

function AdminMenu() {
  const { user, getTenantId } = useRestaurantAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFeatured, setFilterFeatured] = useState('all'); // 'all', 'featured', 'regular'
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // Form for adding new items
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    isFeatured: false,
  });

  // Modal for editing items
  const [modalForm, setModalForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    isFeatured: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const tenantId = getTenantId();

  useEffect(() => {
    console.log('🚀 AdminMenu component mounted');
    fetchMenuItems();
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
    });
    setIsModalOpen(true);
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

    setUpdateLoading(true);
    try {
      const itemData = {
        ...modalForm,
        price: parseFloat(modalForm.price),
        stockQuantity: parseInt(modalForm.stockQuantity)
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            ${item.price.toFixed(2)}
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
      </div>

      {/* Update Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Update Menu Item"
        className="relative bg-white w-full max-w-2xl mx-auto mt-8 p-6 rounded-lg shadow-lg focus:outline-none max-h-[90vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50 p-4"
      >
        <h2 className="text-xl font-bold mb-4">Update Menu Item</h2>
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <Input
                type="text"
                name="name"
                value={modalForm.name}
                onChange={handleModalChange}
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
                  step="0.01"
                  min="0"
                  value={modalForm.price}
                  onChange={handleModalChange}
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
              rows={4}
              value={modalForm.description}
              onChange={handleModalChange}
              className="resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex items-center h-full pt-6">
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
    </AdminLayout>
  );
}

export default AdminMenu;
