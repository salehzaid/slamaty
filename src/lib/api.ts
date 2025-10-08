// Use VITE_API_URL if provided at build time; otherwise default to same-origin in production
const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')

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
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
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
      console.log('🔗 API Request - URL:', url)
      console.log('🔗 API Request - Config:', config)
      console.log('🔗 API Request - Body:', options.body)
      
      const response = await fetch(url, config)
      console.log('📥 API Response - Status:', response.status)
      console.log('📥 API Response - Headers:', response.headers)
      
      // التعامل مع 401 و 403 (غير مصادق أو غير مصرح)
      if (response.status === 401 || response.status === 403) {
        console.error('🔒 Authentication Error:', response.status)
        localStorage.removeItem('access_token')
        localStorage.removeItem('sallamaty_user')
        
        // عرض رسالة للمستخدم قبل إعادة التوجيه
        const message = response.status === 401 
          ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
          : 'غير مصرح بالوصول. يرجى تسجيل الدخول.'
        
        alert(message)
        window.location.href = '/login'
        throw new Error('Authentication required')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ API Response - Error Text:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ API Response - Data:', data)
      
      // إذا كانت الاستجابة مصفوفة مباشرة، نعيدها مع data wrapper
      if (Array.isArray(data)) {
        return { data, success: true } as ApiResponse<T>
      }
      // إذا كانت الاستجابة كائن، نعيده مع data wrapper
      return { data, success: true } as ApiResponse<T>
    } catch (error) {
      console.error('❌ API request failed:', error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check if the server is running.')
      }
      throw error
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      let detail = ''
      try {
        const text = await response.text()
        detail = text
      } catch (_) {}
      throw new Error(`HTTP error! status: ${response.status}${detail ? `, message: ${detail}` : ''}`)
    }

    const data = await response.json()

    if (data.access_token) {
      this.setToken(data.access_token)
    }

    return data
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

  async createCapa(capaData: any) {
    return this.request('/api/capas', {
      method: 'POST',
      body: JSON.stringify(capaData),
    })
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
  async getReportsDashboardStats() {
    return this.request('/api/reports/dashboard/stats')
  }

  async getComplianceTrends(months: number = 6) {
    return this.request(`/api/reports/compliance-trends?months=${months}`)
  }

  async getDepartmentPerformance() {
    return this.request('/api/reports/department-performance')
  }

  async getRoundsByType() {
    return this.request('/api/reports/rounds-by-type')
  }

  async getCapaStatusDistribution() {
    return this.request('/api/reports/capa-status-distribution')
  }

  async getMonthlyRounds(months: number = 6) {
    return this.request(`/api/reports/monthly-rounds?months=${months}`)
  }

  // Evaluation Results endpoints
  async finalizeEvaluation(roundId: number, payload: { evaluations: any[], notes?: string }) {
    return this.request(`/api/rounds/${roundId}/evaluations/finalize`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getEvaluationResults(roundId: number) {
    return this.request(`/api/rounds/${roundId}/evaluation-results`)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
