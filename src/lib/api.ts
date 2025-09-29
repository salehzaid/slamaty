const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

  private getMockResponse<T>(endpoint: string, options: RequestInit): ApiResponse<T> {
    // إرجاع بيانات وهمية للحساب الافتراضي
    console.log('Using mock response for endpoint:', endpoint);
    
    if (endpoint === '/health') {
      return { data: { status: 'healthy' } as T, success: true };
    }
    
    if (endpoint === '/auth/me') {
      return { 
        data: {
          id: 1,
          username: 'admin',
          email: 'admin@salamaty.com',
          first_name: 'مدير',
          last_name: 'النظام',
          role: 'admin',
          department: 'الإدارة العامة',
          position: 'مدير النظام',
          phone: '+966500000000',
          is_active: true,
          created_at: new Date().toISOString()
        } as T, 
        success: true 
      };
    }
    
    if (endpoint === '/dashboard/stats') {
      return {
        data: {
          total_rounds: 15,
          completed_rounds: 12,
          pending_rounds: 3,
          total_capas: 8,
          open_capas: 5,
          closed_capas: 3,
          compliance_rate: 85.5
        } as T,
        success: true
      };
    }
    
    if (endpoint.startsWith('/rounds') && !endpoint.includes('/evaluate')) {
      return {
        data: [] as T,
        success: true
      };
    }
    
    if (endpoint.startsWith('/departments')) {
      return {
        data: [
          {
            id: 1,
            name: 'قسم الجودة',
            description: 'قسم إدارة الجودة والامتثال',
            manager_id: 1,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'قسم الموارد البشرية',
            description: 'قسم إدارة الموارد البشرية',
            manager_id: 2,
            is_active: true,
            created_at: new Date().toISOString()
          }
        ] as T,
        success: true
      };
    }
    
    if (endpoint.startsWith('/users')) {
      return {
        data: [
          {
            id: 1,
            username: 'admin',
            email: 'admin@salamaty.com',
            first_name: 'مدير',
            last_name: 'النظام',
            role: 'admin',
            department: 'الإدارة العامة',
            position: 'مدير النظام',
            phone: '+966500000000',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ] as T,
        success: true
      };
    }
    
    if (endpoint.startsWith('/api/capas')) {
      return {
        data: [] as T,
        success: true
      };
    }
    
    // Mock responses for evaluation categories
    if (endpoint.startsWith('/evaluation-categories')) {
      if (endpoint === '/evaluation-categories' && options.method === 'POST') {
        return {
          data: {
            id: Date.now(),
            name: JSON.parse(options.body || '{}').name || 'تصنيف جديد',
            description: JSON.parse(options.body || '{}').description || '',
            is_active: true,
            created_at: new Date().toISOString()
          } as T,
          success: true
        };
      }
      
      return {
        data: [
          {
            id: 1,
            name: 'الجودة والامتثال',
            description: 'تصنيف شامل لجميع معايير الجودة والامتثال',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'السلامة المهنية',
            description: 'معايير السلامة المهنية والعمالية',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            name: 'التدريب والتطوير',
            description: 'معايير التدريب وتطوير الموظفين',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ] as T,
        success: true
      };
    }
    
    // Mock responses for evaluation items
    if (endpoint.startsWith('/evaluation-items')) {
      if (endpoint === '/evaluation-items' && options.method === 'POST') {
        return {
          data: {
            id: Date.now(),
            name: JSON.parse(options.body || '{}').name || 'عنصر جديد',
            description: JSON.parse(options.body || '{}').description || '',
            category_id: JSON.parse(options.body || '{}').category_id || 1,
            weight: JSON.parse(options.body || '{}').weight || 1,
            is_active: true,
            created_at: new Date().toISOString()
          } as T,
          success: true
        };
      }
      
      return {
        data: [
          {
            id: 1,
            name: 'الالتزام بمعايير الجودة',
            description: 'تقييم الالتزام بمعايير الجودة المحددة',
            category_id: 1,
            weight: 5,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'سلامة المعدات',
            description: 'تقييم حالة وسلامة المعدات المستخدمة',
            category_id: 2,
            weight: 4,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            name: 'التدريب المستمر',
            description: 'تقييم مستوى التدريب المستمر للموظفين',
            category_id: 3,
            weight: 3,
            is_active: true,
            created_at: new Date().toISOString()
          }
        ] as T,
        success: true
      };
    }
    
    // Mock response for notifications
    if (endpoint.startsWith('/notifications')) {
      return {
        data: [] as T,
        success: true
      };
    }
    
    // إرجاع استجابة افتراضية
    return {
      data: {} as T,
      success: true,
      message: 'Mock response for development mode'
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    // إذا كان الحساب الافتراضي، نعيد بيانات وهمية
    if (this.token === 'admin-direct-access-token') {
      return this.getMockResponse<T>(endpoint, options);
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log('API Request - URL:', url)
      console.log('API Request - Config:', config)
      console.log('API Request - Body:', options.body)
      
      const response = await fetch(url, config)
      console.log('API Response - Status:', response.status)
      console.log('API Response - Headers:', response.headers)
      
      if (response.status === 401) {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        throw new Error('Session expired')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.log('API Response - Error Text:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      
      
      // إذا كانت الاستجابة مصفوفة مباشرة، نعيدها مع data wrapper
      if (Array.isArray(data)) {
        return { data, success: true } as ApiResponse<T>
      }
      // إذا كانت الاستجابة كائن، نعيده مع data wrapper
      return { data, success: true } as ApiResponse<T>
    } catch (error) {
      console.error('API request failed:', error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check if the server is running.')
      }
      throw error
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.access_token) {
      this.setToken(data.access_token)
    }

    return data
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async googleAuth(googleData: any) {
    const response = await fetch(`${this.baseURL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.access_token) {
      this.setToken(data.access_token)
    }

    return data
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Rounds endpoints
  async getRounds(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/rounds${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  async getMyRounds(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/rounds/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  async getRound(roundId: number) {
    return this.request(`/rounds/${roundId}`)
  }

  async createRound(roundData: any) {
    // Refresh token from localStorage
    this.refreshToken()
    
    console.log('API Client - Creating round with data:', roundData)
    console.log('API Client - Token:', this.token ? 'Present' : 'Missing')
    console.log('API Client - Token value:', this.token)
    console.log('API Client - Is authenticated:', this.isAuthenticated())
    
    // Check if token exists
    if (!this.token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    // Check if server is reachable
    try {
      const healthCheck = await fetch(`${this.baseURL}/health`)
      if (!healthCheck.ok) {
        throw new Error('Server is not responding. Please check if the server is running.')
      }
    } catch (error) {
      throw new Error('Cannot connect to server. Please check if the server is running on http://localhost:8000')
    }
    
    return this.request('/rounds', {
      method: 'POST',
      body: JSON.stringify(roundData),
    })
  }

  async updateRound(id: number, roundData: any) {
    return this.request(`/rounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roundData),
    })
  }

  async submitEvaluations(roundId: number, payload: any) {
    return this.request(`/rounds/${roundId}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async saveEvaluationDraft(roundId: number, payload: any) {
    return this.request(`/rounds/${roundId}/evaluations/draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async finalizeEvaluation(roundId: number, payload: any) {
    return this.request(`/rounds/${roundId}/evaluations/finalize`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // CAPA creation helpers for evaluation integration
  async createCapaForItem(roundId: number, evaluationItemData: any) {
    return this.request(`/rounds/${roundId}/create-capa-for-item`, {
      method: 'POST',
      body: JSON.stringify({ evaluation_item_data: evaluationItemData }),
    })
  }

  async createCapasForNonCompliance(roundId: number, payload: { threshold?: number } = {}) {
    return this.request(`/rounds/${roundId}/create-capas`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getRoundNonCompliantItems(roundId: number, threshold: number = 70) {
    const endpoint = `/rounds/${roundId}/non-compliant-items?threshold=${threshold}`
    const res = await this.request(endpoint)
    // normalize response shape
    const data = (res && (res.data || res)) || res
    return data
  }

  async getRoundEvaluations(roundId: number) {
    return this.request(`/rounds/${roundId}/evaluations`)
  }

  async deleteRound(id: number) {
    return this.request(`/rounds/${id}`, {
      method: 'DELETE'
    })
  }

  // CAPA endpoints
  async getCapas(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/api/capas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request(endpoint)
    return Array.isArray(response) ? response : response.data || response
  }

  async getAllCapasUnfiltered(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/api/capas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request(endpoint)
    return Array.isArray(response) ? response : response.data || response
  }

  async createCapa(capaData: any) {
    return this.request('/api/capas', {
      method: 'POST',
      body: JSON.stringify(capaData),
    })
  }

  async getCapa(id: number) {
    return this.request(`/api/capas/${id}`)
  }

  async updateCapa(id: number, capaData: any) {
    // backend exposes PATCH at /capa/{id}
    return this.request(`/capa/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(capaData),
    })
  }

  async deleteCapa(id: number) {
    // backend exposes DELETE at /capa/{id}
    return this.request(`/capa/${id}`, {
      method: 'DELETE',
    })
  }

  async deleteAllCapas() {
    return this.request('/api/capas', {
      method: 'DELETE',
    })
  }

  // Department endpoints
  async getDepartments(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/departments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request(endpoint)
    return Array.isArray(response) ? response : response.data || response
  }

  async createDepartment(departmentData: any) {
    console.log('Creating department with data:', departmentData)
    const response = await this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    })
    console.log('Create department response:', response)
    return response
  }

  async getDepartment(id: number) {
    return this.request(`/departments/${id}`)
  }

  async updateDepartment(id: number, departmentData: any) {
    console.log('Updating department with data:', departmentData)
    const response = await this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    })
    console.log('Update department response:', response)
    return response
  }

  async deleteDepartment(id: number) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    })
  }

  // User endpoints
  async getUsers(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getUser(id: number) {
    return this.request(`/users/${id}`)
  }

  async updateUser(id: number, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    })
  }

  async sendWelcomeEmail(id: number) {
    return this.request(`/users/${id}/send-welcome-email`, {
      method: 'POST',
    })
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request('/dashboard/stats')
  }

  // Evaluation Categories endpoints
  async createEvaluationCategory(categoryData: any) {
    return this.request('/evaluation-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  }

  async getEvaluationCategories(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/evaluation-categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request(endpoint)
    return Array.isArray(response) ? response : response.data || response
  }

  async getEvaluationCategory(id: number) {
    return this.request(`/evaluation-categories/${id}`)
  }

  async updateEvaluationCategory(id: number, categoryData: any) {
    return this.request(`/evaluation-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  }

  async deleteEvaluationCategory(id: number) {
    return this.request(`/evaluation-categories/${id}`, {
      method: 'DELETE',
    })
  }

  // Evaluation Items endpoints
  async createEvaluationItem(itemData: any) {
    return this.request('/evaluation-items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    })
  }

  async getEvaluationItems(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/evaluation-items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request(endpoint)
    return Array.isArray(response) ? response : response.data || response
  }

  async getEvaluationItem(id: number) {
    return this.request(`/evaluation-items/${id}`)
  }

  async updateEvaluationItem(id: number, itemData: any) {
    return this.request(`/evaluation-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    })
  }

  async deleteEvaluationItem(id: number) {
    return this.request(`/evaluation-items/${id}`, {
      method: 'DELETE',
    })
  }

  async getEvaluationItemsByCategory(categoryId: number, params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/evaluation-items/category/${categoryId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  // Assessors endpoints
  async getAssessors(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/assessors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  // Round Types endpoints
  async getRoundTypes(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/round-types${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  async createRoundType(data: any) {
    return this.request('/round-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRoundType(id: number) {
    return this.request(`/round-types/${id}`)
  }

  async updateRoundType(id: number, data: any) {
    return this.request(`/round-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteRoundType(id: number) {
    return this.request(`/round-types/${id}`, {
      method: 'DELETE',
    })
  }

  // Reports endpoints
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

  // Health check
  async healthCheck() {
    return this.request('/health')
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
