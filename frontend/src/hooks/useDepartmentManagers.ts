import { useState, useEffect, useMemo } from 'react'
import { useUsers } from './useUsers'
import { useDepartments } from './useDepartments'
import { User } from '@/types'

export interface DepartmentManager {
  id: number
  name: string
  email: string
  role: string
  department: string
}

export function useDepartmentManagers() {
  const { users, loading: usersLoading, error: usersError } = useUsers()
  const { data: departments, loading: departmentsLoading, error: departmentsError } = useDepartments()

  const [departmentManagers, setDepartmentManagers] = useState<Record<string, DepartmentManager[]>>({})

  // Process managers when users and departments data is available
  useEffect(() => {
    if (!users || !departments) return

    const managersMap: Record<string, DepartmentManager[]> = {}

    departments.forEach(dept => {
      const managers: DepartmentManager[] = []
      
      if (dept.managers && Array.isArray(dept.managers)) {
        dept.managers.forEach(managerId => {
          const user = users.find(u => u.id === managerId)
          if (user) {
            managers.push({
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              email: user.email,
              role: user.role,
              department: dept.name
            })
          }
        })
      }
      
      managersMap[dept.name] = managers
    })

    setDepartmentManagers(managersMap)
  }, [users, departments])

  // Get managers for a specific department
  const getManagersForDepartment = (departmentName: string): DepartmentManager[] => {
    return departmentManagers[departmentName] || []
  }

  // Get all managers across all departments
  const getAllManagers = (): DepartmentManager[] => {
    return Object.values(departmentManagers).flat()
  }

  // Check if a department has managers
  const hasManagers = (departmentName: string): boolean => {
    return departmentManagers[departmentName]?.length > 0
  }

  return {
    departmentManagers,
    getManagersForDepartment,
    getAllManagers,
    hasManagers,
    loading: usersLoading || departmentsLoading,
    error: usersError || departmentsError
  }
}
