import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const status = error.response?.status
    const url = String(originalRequest.url || '')

    const shouldSkipRefresh =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/google') ||
      url.includes('/auth/phone') ||
      url.includes('/auth/clerk')

    if (status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw error

        const refreshResponse = await refreshClient.post('/auth/refresh-token', { refreshToken })
        const payload = refreshResponse.data?.data || refreshResponse.data
        const newAccessToken = payload?.accessToken
        const newRefreshToken = payload?.refreshToken

        if (!newAccessToken) throw error

        localStorage.setItem('token', newAccessToken)
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('activeRole')
        if (typeof window !== 'undefined' && !['/login', '/register', '/forgot-password'].includes(window.location.pathname)) {
          window.location.assign('/login')
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Booking API
export const bookingApi = {
  create: (data: any) => api.post('/bookings', data),
  list: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  pay: (id: string) => api.post(`/bookings/${id}/pay`),
  verifyPayment: (id: string, data: any) => api.post(`/bookings/${id}/verify-payment`, data),
  cancel: (id: string, data?: any) => api.post(`/bookings/${id}/cancel`, data),
  rate: (id: string, data: any) => api.post(`/bookings/${id}/rate`, data),
  priceEstimate: (params: any) => api.get('/bookings/price-estimate', { params }),
}

// Partner API
export const partnerApi = {
  apply: (data: any) => api.post('/partner/apply', data),
  status: () => api.get('/partner/status'),
  nearbyBookings: () => api.get('/partner/nearby-bookings'),
  acceptBooking: (id: string) => api.post(`/partner/bookings/${id}/accept`),
  rejectBooking: (id: string) => api.post(`/partner/bookings/${id}/reject`),
  generateOTP: (id: string) => api.post(`/partner/bookings/${id}/otp/generate`),
  verifyOTP: (id: string, data: any) => api.post(`/partner/bookings/${id}/otp/verify`, data),
  completeBooking: (id: string) => api.post(`/partner/bookings/${id}/complete`),
  bookings: (params?: any) => api.get('/partner/bookings', { params }),
  performance: () => api.get('/partner/performance'),
  toggleAvailability: (data: any) => api.put('/partner/availability', data),
  updateLocation: (data: any) => api.put('/partner/location', data),
  updateServices: (data: any) => api.put('/partner/services', data),
}

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUserDetail: (id: string) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id: string, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  getKycQueue: (params?: any) => api.get('/admin/kyc-queue', { params }),
  approveKyc: (id: string) => api.post(`/admin/kyc/${id}/approve`),
  rejectKyc: (id: string, data: any) => api.post(`/admin/kyc/${id}/reject`, data),
  getPartners: (params?: any) => api.get('/admin/walking-partners', { params }),
  approvePartner: (id: string) => api.post(`/admin/walking-partners/${id}/approve`),
  rejectPartner: (id: string, reason?: string) => api.post(`/admin/walking-partners/${id}/reject`, { reason }),
  getBookings: (params?: any) => api.get('/admin/bookings', { params }),
  getBookingDetail: (id: string) => api.get(`/admin/bookings/${id}`),
  getWithdrawals: (params?: any) => api.get('/admin/withdrawals', { params }),
  approveWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id: string, reason?: string) => api.post(`/admin/withdrawals/${id}/reject`, { reason }),
  getReports: (params?: any) => api.get('/admin/reports', { params }),
  resolveReport: (id: string, data?: any) => api.post(`/admin/reports/${id}/resolve`, data),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
}
