import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Calendar, TrendingUp } from 'lucide-react'
import { apiClient } from '@/lib/api'
import PageWrapper from './PageWrapper'

interface DashboardStats {
  totalRounds: number
  totalCapas: number
  totalUsers: number
  totalDepartments: number
}

const SimpleDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRounds: 0,
    totalCapas: 0,
    totalUsers: 0,
    totalDepartments: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Skip loading if user is not authenticated
        if (!apiClient.isAuthenticated()) {
          console.log('⚠️ User not authenticated, skipping dashboard data load')
          setLoading(false)
          return
        }
        
        setLoading(true)
        setError('')
        
        console.log('Loading dashboard data...')
        
        // تحميل البيانات من API
        const [roundsResponse, capasResponse, usersResponse, departmentsResponse] = await Promise.all([
          apiClient.getRounds(),
          apiClient.getCapas(),
          apiClient.getUsers(),
          apiClient.getDepartments()
        ])
        
        console.log('Dashboard data loaded:', {
          rounds: roundsResponse,
          capas: capasResponse,
          users: usersResponse,
          departments: departmentsResponse
        })
        
        setStats({
          totalRounds: Array.isArray(roundsResponse) ? roundsResponse.length : (roundsResponse.data?.length || 0),
          totalCapas: Array.isArray(capasResponse) ? capasResponse.length : (capasResponse.data?.length || 0),
          totalUsers: Array.isArray(usersResponse) ? usersResponse.length : (usersResponse.data?.length || 0),
          totalDepartments: Array.isArray(departmentsResponse) ? departmentsResponse.length : (departmentsResponse.data?.length || 0)
        })
        
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('فشل في تحميل البيانات من قاعدة البيانات')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])
  
  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-white dark:bg-slate-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <span className="h-8 w-8 inline-block border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <PageWrapper title="خطأ في التحميل" description="حدث خطأ أثناء تحميل البيانات">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </PageWrapper>
    )
  }
  
  return null
}

export default SimpleDashboard
