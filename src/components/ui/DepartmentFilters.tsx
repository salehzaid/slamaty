import React from 'react'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface DepartmentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterBuilding: string
  onBuildingChange: (value: string) => void
  filterFloor: string
  onFloorChange: (value: string) => void
  filterStatus: string
  onStatusChange: (value: string) => void
  onClearFilters: () => void
}

const DepartmentFilters: React.FC<DepartmentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterBuilding,
  onBuildingChange,
  filterFloor,
  onFloorChange,
  filterStatus,
  onStatusChange,
  onClearFilters
}) => {
  const buildings = [
    'العيادات', 'التنويم', 'الادارة', 'الكلية', 
    'العلاج الطبيعي', 'الخدمات', 'المستودعات', 'السكن'
  ]
  
  const floors = ['الارضي', 'الاول', 'الثاني', 'الثالث', 'الرابع']

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الأقسام..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterBuilding} onValueChange={onBuildingChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="المبنى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المباني</SelectItem>
                {buildings.map(building => (
                  <SelectItem key={building} value={building}>{building}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterFloor} onValueChange={onFloorChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الطابق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطوابق</SelectItem>
                {floors.map(floor => (
                  <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={onClearFilters} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              مسح الفلاتر
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DepartmentFilters
