import React from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Edit, Trash2, Eye, EyeOff, Users } from 'lucide-react'
import { Department, User } from '@/types'

interface DepartmentCardProps {
  department: Department
  onEdit: (department: Department) => void
  onDelete: (id: number) => void
  onToggleStatus: (department: Department) => void
  users?: User[]
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onEdit,
  onDelete,
  onToggleStatus,
  users = []
}) => {
  // لوحة ألوان جذابة لاستخدامها في الأيقونة وحدود البطاقة
  const palette = [
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-400' },
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
    { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' },
    { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-400' },
    { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-400' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-400' }
  ]

  const colorIndex = department.id ? Math.abs(department.id) % palette.length : (department.name?.charCodeAt(0) || 0) % palette.length
  const color = palette[colorIndex]
  // دالة لتحويل معرفات المسؤولين إلى بيانات المستخدمين
  const getManagerUsers = (managerIds: number[] | string | undefined): User[] => {
    if (!managerIds) return []
    
    let ids: number[] = []
    if (typeof managerIds === 'string') {
      try {
        ids = JSON.parse(managerIds)
      } catch {
        return []
      }
    } else {
      ids = managerIds
    }
    
    return ids.map(id => {
      const user = users.find(u => u.id === id)
      return user
    }).filter((user): user is User => user !== undefined)
  }

  const managerUsers = getManagerUsers(department.managers)

  return (
    <Card className={`hover:shadow-xl transition-shadow border border-gray-100 rounded-2xl group relative bg-white`} style={{marginTop: '24px'}}>
      {/* Decorative circular icon floating above the card - centered and overlapping from top */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center ${color.bg}`}> 
          <Building2 className={`${color.text} w-6 h-6`} />
        </div>
      </div>

      <CardContent className="pt-7 pb-3 px-4">
        <div className="flex flex-col">
          <div className="text-center">
            <CardTitle className="text-lg font-bold mb-2 leading-tight">{department.name}</CardTitle>
            {department.nameEn && (
              <p className="text-sm text-gray-600 mb-2">{department.nameEn}</p>
            )}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary">{department.code}</Badge>
              {department.isActive && (
                <Badge className="bg-green-100 text-green-700 border-green-200">نشط</Badge>
              )}
            </div>
            {/* Location info */}
            <div className="text-sm text-gray-500 mb-3">
              {department.building && <div>{department.building}</div>}
              {department.floor && <div>الطابق {department.floor}</div>}
            </div>
          </div>

          <div className="border-t pt-2 pb-1">
            {managerUsers.length > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <div className="flex -space-x-1">
                  {managerUsers.slice(0,3).map((user, idx) => (
                    <Avatar key={idx} className="w-8 h-8 border-2 border-white shadow-sm">
                      <AvatarImage 
                        src={user.photo_url} 
                        alt={`${user.first_name} ${user.last_name}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm bg-gray-100 text-gray-700">
                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {managerUsers.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm text-gray-700 shadow-sm">
                      +{managerUsers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center">لا يوجد مسؤولون</div>
            )}
          </div>

          {/* Hover actions at bottom-right */}
          <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(department)}
                aria-label="تعديل"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(department)}
                aria-label="تبديل الحالة"
              >
                {department.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(department.id)}
                className="text-red-600 hover:text-red-700"
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DepartmentCard
