import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Building2,
  Users,
  Bell,
  ChevronDown
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, restaurant, logout, getTenantId, updateRestaurantData, fetchRestaurantData } = useRestaurantAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const tenantId = getTenantId();
  const formatSlugToName = (slug) => {
    return (slug || '')
      .split(/[-_]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ') || 'Restaurant';
  };
  const displayName = restaurant?.name || formatSlugToName(tenantId);
  const locations = Array.isArray(restaurant?.locations) && restaurant.locations.length > 0
    ? restaurant.locations
    : [{ id: tenantId || 'primary', name: restaurant?.name || 'Primary Location' }];

  useEffect(() => {
    // Initialize selection from stored value or default to first location
    const stored = localStorage.getItem('selected_location');
    if (stored) {
      setSelectedLocation(stored);
    } else if (locations.length > 0) {
      setSelectedLocation(locations[0].id);
    }
  }, [locations]);

  useEffect(() => {
    // Ensure restaurant data is populated (e.g., on hard refresh after auth restore)
    if (user?.tenantId && !restaurant?.name) {
      fetchRestaurantData?.();
    }
  }, [user?.tenantId]);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSelectedLocation(value);
    localStorage.setItem('selected_location', value);
    // Store on restaurant context for future use
    updateRestaurantData?.({ selectedLocation: value });
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/admin/dashboard'
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
      current: location.pathname.startsWith('/admin/orders'),
      subItems: [
        { name: 'Pending Orders', href: '/admin/orders' },
        { name: 'Ready for Pickup', href: '/admin/orders/ready' },
        { name: 'All Orders', href: '/admin/orders/all' }
      ]
    },
    {
      name: 'Menu Management',
      href: '/admin/menu',
      icon: UtensilsCrossed,
      current: location.pathname.startsWith('/admin/menu')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/admin/analytics')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname.startsWith('/admin/settings')
    }
  ];

  const handleLogout = () => {
    logout(navigate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar (fixed on large screens so content sits to the right) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">{displayName}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-md p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Restaurant info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigationItems.map((item) => (
            <div key={item.name}>
              <Link
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
                {item.subItems && (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </Link>

              {/* Sub-items (for future implementation) */}
              {item.subItems && item.current && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setSidebarOpen(false)}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout button */}
        <div className="px-4 py-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Page title + breadcrumbs */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {getPageTitle(location.pathname)}
              </h1>
              <nav aria-label="Breadcrumb" className="mt-1">
                <ol className="flex items-center space-x-2 text-xs text-gray-500">
                  {getBreadcrumbs(location.pathname).map((bc, idx) => (
                    <li key={bc.path} className="flex items-center">
                      {idx > 0 && <span className="mx-1 text-gray-400">/</span>}
                      {bc.to ? (
                        <Link to={bc.to} className="hover:text-gray-700">
                          {bc.label}
                        </Link>
                      ) : (
                        <span className="text-gray-700">{bc.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-4">
              {/* Location switcher (placeholder) */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-xs text-gray-500">Location</span>
                <select
                  value={selectedLocation || ''}
                  onChange={handleLocationChange}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              {/* Notifications - placeholder for future */}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>

              {/* User menu - could be expanded in future */}
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.email?.split('@')[0]}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper function to get page titles
const getPageTitle = (pathname) => {
  const titleMap = {
    '/admin/dashboard': 'Dashboard',
    '/admin/orders': 'Pending Orders',
    '/admin/orders/ready': 'Ready for Pickup',
    '/admin/orders/all': 'All Orders',
    '/admin/menu': 'Menu Management',
    '/admin/analytics': 'Analytics & Reports',
    '/admin/settings': 'Restaurant Settings'
  };
  
  return titleMap[pathname] || 'Admin Dashboard';
};

export default AdminLayout;

// Generate breadcrumb items for known admin routes
const getBreadcrumbs = (pathname) => {
  const base = [{ label: 'Admin', to: '/admin/dashboard', path: '/admin' }];
  const map = {
    '/admin/dashboard': [...base, { label: 'Dashboard', path: '/admin/dashboard' }],
    '/admin/orders': [...base, { label: 'Orders', to: '/admin/orders', path: '/admin/orders' }, { label: 'Pending', path: '/admin/orders' }],
    '/admin/orders/ready': [...base, { label: 'Orders', to: '/admin/orders', path: '/admin/orders' }, { label: 'Ready for Pickup', path: '/admin/orders/ready' }],
    '/admin/orders/all': [...base, { label: 'Orders', to: '/admin/orders', path: '/admin/orders' }, { label: 'All Orders', path: '/admin/orders/all' }],
    '/admin/menu': [...base, { label: 'Menu', path: '/admin/menu' }],
    '/admin/analytics': [...base, { label: 'Analytics', path: '/admin/analytics' }],
    '/admin/settings': [...base, { label: 'Settings', path: '/admin/settings' }],
  };
  return map[pathname] || [...base, { label: 'Dashboard', path: '/admin/dashboard' }];
};
