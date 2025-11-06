import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Our Solution', to: '/our-solution' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' }
]

const PublicNavbar = () => {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#C8E1F5]/50 bg-gradient-to-b from-[#C8E1F5] to-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <img
            src="/BizBytes Logo.png"
            alt="BizBytes logo"
            className="h-12 w-auto"
          />
        </Link>
        <div className="hidden items-center space-x-3 md:flex">
          {navLinks.map((item) => (
            <Button
              key={item.to}
              asChild
              variant={isActive(item.to) ? 'default' : 'ghost'}
              className={
                isActive(item.to)
                  ? 'text-sm font-medium'
                  : 'bg-transparent text-sm font-medium text-gray-700 hover:bg-transparent hover:text-gray-900'
              }
            >
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
          <Button asChild variant="outline" className="text-sm font-medium">
            <Link to="/admin/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default PublicNavbar
