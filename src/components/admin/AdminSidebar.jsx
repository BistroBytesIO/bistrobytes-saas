import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  BarChart3, 
  Settings, 
  Building2,
  ChevronDown
} from 'lucide-react';

const AdminSidebar = ({ onNavigate }) => {
  const location = useLocation();

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
      badge: '3', // This would be dynamic based on pending orders
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

  return (
    <nav className="flex-1 px-4 py-6 space-y-1">
      {navigationItems.map((item) => (
        <div key={item.name}>
          <Link
            to={item.href}
            className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              item.current
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => onNavigate && onNavigate()}
          >
            <div className="flex items-center">
              <item.icon
                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                  item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </div>
            
            <div className="flex items-center">
              {/* Notification badge */}
              {item.badge && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full mr-2">
                  {item.badge}
                </span>
              )}
              
              {/* Dropdown indicator */}
              {item.subItems && (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </Link>

          {/* Sub-items */}
          {item.subItems && item.current && (
            <div className="ml-8 mt-1 space-y-1">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.name}
                  to={subItem.href}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    location.pathname === subItem.href
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => onNavigate && onNavigate()}
                >
                  {subItem.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default AdminSidebar;