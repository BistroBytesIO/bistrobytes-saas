import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignupPage from './pages/SignupPage'
import toast, { Toaster } from 'react-hot-toast'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
    </Router>
  )
}

export default App
