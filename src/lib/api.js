import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443/api',
  timeout: 30000, // 30 second timeout for tenant provisioning
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.debug('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      hasData: !!config.data
    })
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.debug('✅ API Response:', {
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL}${response.config.url}`,
      status: response.status
    })
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown',
      status: error.response?.status,
      message: error.message
    })

    // Handle specific error cases
    if (error.response?.status === 500) {
      console.error('🔥 Server error - tenant provisioning failed')
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('🌐 Network error - check backend connectivity')
    }

    return Promise.reject(error)
  }
)

export default api