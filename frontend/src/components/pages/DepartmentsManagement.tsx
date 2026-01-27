import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { Department } from '@/types'
import DepartmentCard from '@/components/ui/DepartmentCard'
import DepartmentStats from '@/components/ui/DepartmentStats'
import DepartmentFilters from '@/components/ui/DepartmentFilters'
import { useDepartments } from '@/hooks/useDepartments'
import { useUsers } from '@/hooks/useUsers'
import PageWrapper from '../PageWrapper'

const DepartmentsManagement: React.FC = () => {
  const navigate = useNavigate()

  // Use custom hooks for data management
  const { data: departments, loading: departmentsLoading, error: departmentsError, refetch: refetchDepartments } = useDepartments()
  const { users, loading: usersLoading, error: usersError, fetchUsers } = useUsers()
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [filterFloor, setFilterFloor] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Load users on component mount
  useEffect(() => {
    // التحقق من وجود token قبل جلب البيانات
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUsers()
    } else {
      // إعادة توجيه إلى صفحة تسجيل الدخول
      window.location.href = '/login'
    }
  }, [])

  // Combined loading state
  const loading = departmentsLoading || usersLoading
  const error = departmentsError || usersError

  // helper functions are defined in DepartmentCard; these kept for future use if needed

  // Handle edit department
  const handleEdit = (dept: Department) => {
    navigate(`/departments/edit/${dept.id}`)
  }

  // Handle add new department
  const handleAddNew = () => {
    navigate('/departments/new')
  }

  // Handle delete department
  const handleDelete = async (deptId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      try {
        await apiClient.deleteDepartment(deptId)
        await refetchDepartments()
      } catch (err) {
        console.error('Failed to delete department:', err)
      }
    }
  }

  // Toggle department status
  const toggleStatus = async (dept: Department) => {
    try {
      await apiClient.updateDepartment(dept.id, {
        ...dept,
        isActive: !dept.isActive
      })
      await refetchDepartments()
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setFilterBuilding('all')
    setFilterFloor('all')
    setFilterStatus('all')
  }

  // Filter departments
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBuilding = filterBuilding === 'all' || dept.building === filterBuilding
    const matchesFloor = filterFloor === 'all' || dept.floor === filterFloor
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && dept.isActive)
    
    return matchesSearch && matchesBuilding && matchesFloor && matchesStatus
  })

  return (
    <PageWrapper 
      title="إدارة الأقسام" 
      description="إدارة أقسام المستشفى ومواقعها ومسؤوليها"
      className="p-6"
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetchDepartments}
            disabled={loading}
          >
            إعادة تحميل
          </Button>
          <Button 
            onClick={handleAddNew}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            إضافة قسم جديد
          </Button>
        </div>
      }
    >

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}


      {/* Statistics */}
      <DepartmentStats departments={departments} />

      {/* Filters */}
      <DepartmentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterBuilding={filterBuilding}
        onBuildingChange={setFilterBuilding}
        filterFloor={filterFloor}
        onFloorChange={setFilterFloor}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        onClearFilters={clearFilters}
      />

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            قائمة الأقسام ({filteredDepartments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  department={dept}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={toggleStatus}
                  users={users}
                />
              ))}
            </div>
          )}
          
          {filteredDepartments.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد أقسام مطابقة للبحث</p>
            </div>
          )}
        </CardContent>
      </Card>

    </PageWrapper>
  )
}

export default DepartmentsManagement