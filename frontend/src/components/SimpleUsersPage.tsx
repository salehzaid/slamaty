import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SimpleUsersPage: React.FC = () => {
  console.log('SimpleUsersPage is rendering')
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            إدارة المستخدمين
          </h1>
          <p className="text-gray-600">إدارة المستخدمين وصلاحياتهم في النظام</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة مستخدم جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نشط</p>
                <p className="text-2xl font-bold text-green-600">4</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">غير نشط</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المديرين</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">قائمة المستخدمين</h2>
        
        {[
          { name: 'محمد العمراني', role: 'مدير النظام', email: 'admin@salamaty.com', status: 'نشط' },
          { name: 'فاطمة الأحمد', role: 'مدير الجودة', email: 'quality@salamaty.com', status: 'نشط' },
          { name: 'أحمد الفارسي', role: 'رئيس قسم', email: 'ed@salamaty.com', status: 'نشط' },
          { name: 'خالد المنصوري', role: 'مقيم', email: 'assessor@salamaty.com', status: 'نشط' },
          { name: 'نورا الزهراني', role: 'مشاهد', email: 'viewer@salamaty.com', status: 'غير نشط' },
        ].map((user, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">{user.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.role}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.status === 'نشط' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                  <Button variant="outline" size="sm">تعديل</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SimpleUsersPage
