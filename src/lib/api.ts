// Use VITE_API_URL if provided at build time; otherwise default to same-origin in production
const API_BASE_URL = (() => {
  // Prefer explicit env var at build time
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL

  // Production: Use Render backend
  if (import.meta.env.PROD) {
    return 'https://salamaty-5fw9.onrender.com'
  }

  // At runtime (dev server) if the frontend is served from vite (ports 5173/5174)
  // default backend to 127.0.0.1:8000 (preferred) or localhost:8000 (fallback)
  if (typeof window !== 'undefined') {
    const port = window.location.port
    if (port === '5173' || port === '5174') {
      // Always use 127.0.0.1 for consistency and to avoid CORS issues
      return 'http://127.0.0.1:8000'
    }
    return window.location.origin
  }
  return 'http://127.0.0.1:8000'
})()


// Log the API base URL on initialization to help debug (dev only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.debug('🌐 API Base URL:', API_BASE_URL)
}

interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('access_token')
  }

  // Generic HTTP helpers
  async get<T = any>(endpoint: string) {
    return this.request<T>(endpoint)
  }

  async post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
  }

  async put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) })
  }

  async delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('access_token', token)
  }

  refreshToken() {
    this.token = localStorage.getItem('access_token')
  }

  isAuthenticated() {
    this.refreshToken()
    return !!this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('access_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    // Ensure we use 127.0.0.1 instead of localhost to avoid CORS issues
    let baseURL = this.baseURL
    if (baseURL.includes('localhost:8000')) {
      baseURL = baseURL.replace('localhost:8000', '127.0.0.1:8000')
      console.log('🔄 Switched from localhost to 127.0.0.1')
    }

    const url = `${baseURL}${endpoint}`

    // تم إزالة فحص التوكن القديم لاستخدام البيانات الحقيقية من قاعدة البيانات
    // الآن سيتم استخدام البيانات الحقيقية دائماً من قاعدة البيانات salamaty_db

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      // Use AbortController to enforce a request timeout to avoid hanging requests
      const controller = new AbortController()
      const timeoutMs = 8000 // 8s timeout for dev responsiveness
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      const response = await fetch(url, { signal: controller.signal, ...config })
      clearTimeout(timeout)

      // التعامل مع 401 و 403 (غير مصادق أو غير مصرح)
      if (response.status === 401 || response.status === 403) {
        // Authentication failure - clear local token and surface error to caller
        // Do NOT redirect here; let the UI decide how to handle authentication flows.
        // eslint-disable-next-line no-console
        console.error('🔒 Authentication Error:', response.status)
        try {
          localStorage.removeItem('access_token')
          localStorage.removeItem('sallamaty_user')
        } catch { }
        throw new Error('Authentication required')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Response - Error:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()

      // Normalize payloads so frontend always receives the underlying data:
      // - If API returns an array -> return the array
      // - If API returns { data: [...] } -> return data
      // - If API returns { rounds: [...], count } -> return rounds
      // - Otherwise return the raw object
      if (Array.isArray(data)) {
        return data
      }

      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data
        if (Array.isArray((data as any).rounds)) return (data as any).rounds
        // Some endpoints may wrap inside { data: { ... } }
        if (data.data && !Array.isArray(data.data)) return data.data
      }

      return data
    } catch (error: any) {
      // Clear potential fetch abort reason
      const isAbort = error?.name === 'AbortError'
      console.error('❌ API request failed:', isAbort ? 'timeout/abort' : error)
      // Mark global flag to indicate backend unavailable
      try { (window as any).__API_UNAVAILABLE__ = true } catch { }

      // In development, attempt to use mock data on any network error (not only timeout)
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('🔁 API network error — attempting DEV mock fallback for endpoint:', endpoint)
        try {
          const { MOCK_ROUNDS, MOCK_REPORTS, MOCK_CAPAS, MOCK_DEPARTMENTS, MOCK_USERS } = await import('./mockData')
          if (endpoint.startsWith('/api/rounds/my/stats')) return MOCK_REPORTS
          if (endpoint.startsWith('/api/rounds/my') || endpoint.startsWith('/api/rounds')) return MOCK_ROUNDS
          if (endpoint.startsWith('/api/capas')) return MOCK_CAPAS
          if (endpoint.startsWith('/api/departments')) return MOCK_DEPARTMENTS
          if (endpoint.startsWith('/api/users')) return MOCK_USERS
          if (endpoint.startsWith('/api/reports')) return MOCK_REPORTS
        } catch (mErr) {
          // ignore mock import errors
        }
      }
      if (isAbort) {
        throw new Error('انتهى وقت الاتصال بالخادم. تأكد من أن الخادم يعمل أو أن إعدادات VITE_API_URL صحيحة.')
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('خطأ في الاتصال بالخادم. تأكد من أن الخادم يعمل')
      }

      if (error?.message) {
        if (error.message.includes('خطأ') || error.message.includes('فشل') || error.message.includes('error')) {
          throw error
        }
      }

      throw error
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const url = `${this.baseURL}/api/auth/signin`
    const requestBody = { email, password }

    try {
      let response: Response
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
      } catch (netErr) {
        // Network-level failure (connection refused / DNS / CORS) — mark API unavailable
        try { (window as any).__API_UNAVAILABLE__ = true } catch { }
        console.error('❌ Network error during login fetch:', netErr)
        throw netErr
      }

      if (!response.ok) {
        let errorMessage = 'فشل في تسجيل الدخول. تحقق من بياناتك.'
        try {
          const errorData = await response.json()
          console.error('📥 Login error response:', errorData)
          if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          // If JSON parsing fails, try text
          try {
            const text = await response.text()
            console.error('📥 Login error text:', text)
            if (text) {
              errorMessage = text
            }
          } catch (textError) {
            console.error('📥 Failed to parse error text:', textError)
          }
        }

        console.error('❌ Login failed:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage
        })

        throw new Error(errorMessage)
      }

      const data = await response.json()
      // eslint-disable-next-line no-console
      console.debug('📥 Login response data:', {
        hasAccessToken: !!data.access_token,
        hasUser: !!data.user,
        userEmail: data.user?.email,
        userId: data.user?.id
      })

      if (data.access_token) {
        this.setToken(data.access_token)
        // eslint-disable-next-line no-console
        console.debug('✅ Login successful, token saved')
      } else {
        console.error('❌ Login response missing access_token. Full response:', data)
        throw new Error('فشل في تسجيل الدخول: لا يوجد رمز الوصول')
      }

      return data
    } catch (error: any) {
      // If network-level failure, ensure API_UNAVAILABLE is set to allow demo fallback
      try {
        if (!navigator.onLine) {
          try { (window as any).__API_UNAVAILABLE__ = true } catch { }
        }
      } catch { }

      console.error('❌ Login error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.')
    }
  }

  async register(userData: any) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getCurrentUser() {
    return this.request('/api/auth/me')
  }

  // Rounds endpoints - استخدام البيانات الحقيقية من قاعدة البيانات
  async getRounds(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `/api/rounds${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  async getMyRounds(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `/api/rounds/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  async getMyRoundsStats() {
    return this.request('/api/rounds/my/stats')
  }

  async getRound(roundId: number) {
    return this.request(`/api/rounds/${roundId}`)
  }

  async createRound(roundData: any) {
    return this.request('/api/rounds', {
      method: 'POST',
      body: JSON.stringify(roundData),
    })
  }

  async updateRound(roundId: number, roundData: any) {
    return this.request(`/api/rounds/${roundId}`, {
      method: 'PUT',
      body: JSON.stringify(roundData),
    })
  }

  async deleteRound(roundId: number) {
    return this.request(`/api/rounds/${roundId}`, {
      method: 'DELETE',
    })
  }

  // Departments endpoints - استخدام البيانات الحقيقية من قاعدة البيانات
  async getDepartments() {
    return this.request('/api/departments')
  }

  async getDepartment(departmentId: number) {
    return this.request(`/api/departments/${departmentId}`)
  }

  async createDepartment(departmentData: any) {
    return this.request('/api/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    })
  }

  async updateDepartment(departmentId: number, departmentData: any) {
    return this.request(`/api/departments/${departmentId}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    })
  }

  async deleteDepartment(departmentId: number) {
    return this.request(`/api/departments/${departmentId}`, {
      method: 'DELETE',
    })
  }

  // Round Types endpoints - إدارة أنواع الجولات
  async getRoundTypes() {
    return this.request('/api/round-types')
  }

  async createRoundType(roundTypeData: any) {
    return this.request('/api/round-types', {
      method: 'POST',
      body: JSON.stringify(roundTypeData),
    })
  }

  async updateRoundType(roundTypeId: number, roundTypeData: any) {
    return this.request(`/api/round-types/${roundTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(roundTypeData),
    })
  }

  async deleteRoundType(roundTypeId: number) {
    return this.request(`/api/round-types/${roundTypeId}`, {
      method: 'DELETE',
    })
  }

  // Users endpoints - استخدام البيانات الحقيقية من قاعدة البيانات
  async getUsers() {
    return this.request('/api/users')
  }

  async createUser(userData: any) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: number, userData: any) {
    return this.request(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: number) {
    return this.request(`/api/users/${userId}`, {
      method: 'DELETE',
    })
  }

  // CAPA endpoints - استخدام البيانات الحقيقية من قاعدة البيانات
  async getCapas() {
    return this.request('/api/capas')
  }

  async deleteAllCapas() {
    return this.request('/api/capa/all', {
      method: 'DELETE',
    })
  }

  async getCapa(capaId: number) {
    return this.request(`/api/capas/${capaId}`)
  }

  async getItemsNeedingCapa(roundId: number) {
    return this.request(`/api/rounds/${roundId}/items-needing-capa`)
  }

  async createCapa(capaData: any) {
    return this.request('/api/capas', {
      method: 'POST',
      body: JSON.stringify(capaData),
    })
  }

  async markEvaluationNeedsCapa(resultId: number, needsCapa: boolean, capaNote: string = '') {
    return this.request(`/api/evaluation-results/${resultId}/mark-needs-capa`, {
      method: 'POST',
      body: JSON.stringify({ needs_capa: needsCapa, capa_note: capaNote }),
    })
  }

  async getAllCapasUnfiltered(params?: { skip?: number; limit?: number }) {
    const qs = params ? `?skip=${params.skip || 0}&limit=${params.limit || 100}` : ''
    return this.request(`/api/capa/all${qs}`)
  }

  // Wrapper for round non-compliant items
  async getRoundNonCompliantItems(roundId: number) {
    return this.request(`/api/capas/rounds/${roundId}/non-compliant`)
  }

  async updateCapa(capaId: number, capaData: any) {
    return this.request(`/api/capas/${capaId}`, {
      method: 'PUT',
      body: JSON.stringify(capaData),
    })
  }

  async deleteCapa(capaId: number) {
    return this.request(`/api/capas/${capaId}`, {
      method: 'DELETE',
    })
  }

  // Evaluation Categories endpoints - استخدام البيانات الحقيقية من قاعدة البيانات
  async getEvaluationCategories() {
    return this.request('/api/evaluation-categories')
  }

  async createEvaluationCategory(categoryData: any) {
    return this.request('/api/evaluation-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  }

  async updateEvaluationCategory(categoryId: number, categoryData: any) {
    return this.request(`/api/evaluation-categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  }

  async deleteEvaluationCategory(categoryId: number) {
    return this.request(`/api/evaluation-categories/${categoryId}`, {
      method: 'DELETE',
    })
  }

  // Evaluation Items endpoints - استخدام البيانات الحقيقية من قاعدة البيانات
  async getEvaluationItems() {
    return this.request('/api/evaluation-items')
  }

  async createEvaluationItem(itemData: any) {
    return this.request('/api/evaluation-items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    })
  }

  async updateEvaluationItem(itemId: number, itemData: any) {
    return this.request(`/api/evaluation-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    })
  }

  async deleteEvaluationItem(itemId: number) {
    return this.request(`/api/evaluation-items/${itemId}`, {
      method: 'DELETE',
    })
  }

  // Reports endpoints - استخدام البيانات الحقيقية من قاعدة البيانات
  async getReportsDashboardStats(months: number = 6, department?: string) {
    const params = new URLSearchParams({ months: months.toString() })
    if (department && department !== 'all') {
      params.append('department', department)
    }
    return this.request(`/api/reports/dashboard/stats?${params.toString()}`)
  }

  async getDashboardStats() {
    return this.request('/api/reports/dashboard/stats?months=6')
  }

  async getComplianceTrends(months: number = 6, department?: string) {
    const params = new URLSearchParams({ months: months.toString() })
    if (department && department !== 'all') {
      params.append('department', department)
    }
    return this.request(`/api/reports/compliance-trends?${params.toString()}`)
  }

  async getDepartmentPerformance(months: number = 6, department?: string) {
    const params = new URLSearchParams({ months: months.toString() })
    if (department && department !== 'all') {
      params.append('department', department)
    }
    return this.request(`/api/reports/department-performance?${params.toString()}`)
  }

  async getRoundsByType(months: number = 6, department?: string) {
    const params = new URLSearchParams({ months: months.toString() })
    if (department && department !== 'all') {
      params.append('department', department)
    }
    return this.request(`/api/reports/rounds-by-type?${params.toString()}`)
  }

  async getCapaStatusDistribution(months: number = 6, department?: string) {
    const params = new URLSearchParams({ months: months.toString() })
    if (department && department !== 'all') {
      params.append('department', department)
    }
    return this.request(`/api/reports/capa-status-distribution?${params.toString()}`)
  }

  async getMonthlyRounds(months: number = 6, department?: string) {
    const params = new URLSearchParams({ months: months.toString() })
    if (department && department !== 'all') {
      params.append('department', department)
    }
    return this.request(`/api/reports/monthly-rounds?${params.toString()}`)
  }

  // Evaluation Results endpoints
  async finalizeEvaluation(roundId: number, payload: { evaluations: any[], notes?: string }) {
    return this.request(`/api/rounds/${roundId}/evaluations/finalize`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getCapasByRound(roundId: number) {
    return this.request(`/api/capas?roundId=${roundId}`)
  }

  async getEvaluationResults(roundId: number) {
    return this.request(`/api/rounds/${roundId}/evaluations`)
  }

  async saveEvaluationDraft(roundId: number, payload: { evaluations: any[], notes?: string }) {
    return this.request(`/api/rounds/${roundId}/evaluations/draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Backwards-compatible wrapper used elsewhere
  async getRoundEvaluations(roundId: number) {
    return this.getEvaluationResults(roundId)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
