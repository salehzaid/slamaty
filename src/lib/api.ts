// Use VITE_API_URL if provided at build time; otherwise default to same-origin in production
const API_BASE_URL = (() => {
  // Prefer explicit env var at build time
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  // At runtime (dev server) if the frontend is served from vite (ports 5173/5174)
  // default backend to localhost:8000 so API calls reach the running backend container
  if (typeof window !== 'undefined') {
    const port = window.location.port
    if (port === '5173' || port === '5174') {
      return 'http://127.0.0.1:8000'
    }
    return window.location.origin
  }
  return 'http://localhost:8000'
})()

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

  async getItemsNeedingCapa(roundId: number) {
    return this.request(`/api/rounds/${roundId}/items-needing-capa`)
  }

  async createCapa(payload: any) {
    return this.request(`/api/capa/`, {
      method: 'POST',
      body: JSON.stringify(payload)
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
