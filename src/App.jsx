import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { RestaurantAuthProvider } from './contexts/RestaurantAuthContext'
import LandingPage from './pages/LandingPage'
import SignupPage from './pages/SignupPage'
import SignupSuccessPage from './pages/SignupSuccessPage'
import PasswordSetupPage from './pages/admin/PasswordSetupPage'
import AdminLogin from './pages/admin/AdminLogin'
import toast, { Toaster } from 'react-hot-toast'

function App() {
  return (
    <Router>
      <RestaurantAuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup-success" element={<SignupSuccessPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/setup-password/:token" element={<PasswordSetupPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* TODO: Add more admin routes in next phases */}
          </Routes>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                border: '1px solid #e5e7eb',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                }
              },
              error: {
                style: {
                  background: '#EF4444',
                  color: '#fff',
                }
              }
            }}
          />
        </div>
      </RestaurantAuthProvider>
    </Router>
  )
}

export default App
