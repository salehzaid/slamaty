import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { Department } from '@/types'

interface DepartmentStatsProps {
  departments: Department[]
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({ departments }) => {
  const stats = {
    total: departments.length,
    active: departments.filter(d => d.isActive).length,
    inactive: departments.filter(d => !d.isActive).length,
    buildings: [...new Set(departments.map(d => d.building).filter(Boolean))].length,
    floors: [...new Set(departments.map(d => d.floor).filter(Boolean))].length
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي الأقسام</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">نشط</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">المباني</p>
              <p className="text-2xl font-bold text-blue-600">{stats.buildings}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DepartmentStats
