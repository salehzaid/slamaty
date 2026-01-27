import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { Department, User } from '@/types'
import DepartmentForm from '@/components/forms/DepartmentForm'

const DepartmentFormPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<Partial<Department> | undefined>(undefined)

  // Load users and department data (if editing)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load users
        const usersResponse = await apiClient.getUsers()
        const usersData = Array.isArray(usersResponse) ? usersResponse : (usersResponse.data || [])
        setUsers(usersData)

        // Load department data if editing
        if (isEdit && id) {
          const deptResponse = await apiClient.getDepartment(parseInt(id))
          const deptData = deptResponse.data || deptResponse
          
          // Parse managers from JSON string to array
          let managers = []
          if (deptData.managers) {
            try {
              if (typeof deptData.managers === 'string') {
                managers = JSON.parse(deptData.managers)
              } else {
                managers = deptData.managers
              }
            } catch (e) {
              console.error('Failed to parse managers:', e)
              managers = []
            }
          }
          
          setInitialData({
            name: deptData.name,
            nameEn: deptData.name_en || '',
            code: deptData.code,
            floor: deptData.floor || '',
            building: deptData.building || '',
            managers: managers
          })
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('فشل في تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEdit])

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    console.log('🚀 DepartmentFormPage: handleFormSubmit called with data:', data)
    console.log('🚀 isEdit:', isEdit, 'id:', id)
    
    try {
      setLoading(true)
      setError(null)
      
      const departmentData = {
        name: data.name,
        name_en: data.nameEn || null,
        code: data.code,
        floor: data.floor,
        building: data.building,
        managers: data.managers || []
      }
      
      console.log('🚀 Submitting department data:', departmentData)
      
      if (isEdit && id) {
        // Update existing department
        const response = await apiClient.updateDepartment(parseInt(id), departmentData)
        console.log('Update response:', response)
        
        if (response && (response.success || response.data || response.id || response.name)) {
          console.log('Update successful, navigating back...')
          navigate('/departments')
        } else {
          throw new Error('فشل في تحديث القسم')
        }
      } else {
        // Create new department
        const response = await apiClient.createDepartment(departmentData)
        console.log('Create response:', response)
        
        if (response && (response.success || response.data || response.id || response.name)) {
          console.log('Create successful, navigating back...')
          navigate('/departments')
        } else {
          throw new Error('فشل في إنشاء القسم')
        }
      }
    } catch (err) {
      console.error('Failed to save department:', err)
      setError(`فشل في ${isEdit ? 'تحديث' : 'إنشاء'} القسم: ${err.message || 'خطأ غير معروف'}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    navigate('/departments')
  }

  if (loading && !initialData) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-green-600" />
            {isEdit ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'قم بتعديل بيانات القسم' : 'قم بملء البيانات المطلوبة لإضافة قسم جديد'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للأقسام
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl">
        <DepartmentForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isLoading={loading}
          users={users}
          initialData={initialData}
          title={isEdit ? 'تعديل القسم' : 'إضافة قسم جديد'}
          description={isEdit ? 'قم بتعديل بيانات القسم' : 'قم بملء البيانات المطلوبة لإضافة قسم جديد'}
        />
      </div>
    </div>
  )
}

export default DepartmentFormPage
