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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    
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
    
    const endpoint = `/capa${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request(endpoint)
    return Array.isArray(response) ? response : response.data || response
  }

  async getAllCapasUnfiltered(params?: { skip?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/capa/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.request(endpoint)
    return Array.isArray(response) ? response : response.data || response
  }

  async createCapa(capaData: any) {
    return this.request('/capa', {
      method: 'POST',
      body: JSON.stringify(capaData),
    })
  }

  async getCapa(id: number) {
    return this.request(`/capa/${id}`)
  }

  async updateCapa(id: number, capaData: any) {
    return this.request(`/capa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(capaData),
    })
  }

  async deleteCapa(id: number) {
    return this.request(`/capa/${id}`, {
      method: 'DELETE',
    })
  }

  async deleteAllCapas() {
    return this.request('/capa/all', {
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
