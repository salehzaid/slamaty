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
  
  return (
    <PageWrapper 
      title="لوحة التحكم" 
      description="مرحباً بك في نظام سلامتي"
      className="p-6"
    >

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">إجمالي الجولات</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRounds}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">من قاعدة البيانات</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">الخطط التصحيحية</CardTitle>
            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCapas}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">من قاعدة البيانات</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">من قاعدة البيانات</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">الأقسام</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDepartments}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">من قاعدة البيانات</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إجمالي الجولات</p>
                  <p className="text-sm text-gray-600">من قاعدة البيانات</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {stats.totalRounds}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">الخطط التصحيحية</p>
                  <p className="text-sm text-gray-600">من قاعدة البيانات</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {stats.totalCapas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">المستخدمين المسجلين</p>
                  <p className="text-sm text-gray-600">من قاعدة البيانات</p>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {stats.totalUsers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حالة النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">الاتصال بقاعدة البيانات</p>
                  <p className="text-sm text-gray-600">salamaty_db</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  متصل
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">الخادم</p>
                  <p className="text-sm text-gray-600">localhost:8000</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  نشط
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">الواجهة الأمامية</p>
                  <p className="text-sm text-gray-600">localhost:5174</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  نشط
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}

export default SimpleDashboard
