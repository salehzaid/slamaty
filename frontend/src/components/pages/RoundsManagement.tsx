import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRounds } from '@/hooks/useRounds'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { 
  Calendar as CalendarIcon, 
  BarChart3, 
  AlertTriangle,
  Target,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react'

const RoundsManagement: React.FC = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { data: rounds, loading, error, refetch } = useRounds()

  // Get rounds statistics
  const totalRounds = Array.isArray(rounds) ? rounds.length : 0
  const completedRounds = Array.isArray(rounds) ? rounds.filter((r: any) => r.status === 'completed').length : 0
  const inProgressRounds = Array.isArray(rounds) ? rounds.filter((r: any) => r.status === 'in_progress').length : 0
  const scheduledRounds = Array.isArray(rounds) ? rounds.filter((r: any) => r.status === 'scheduled').length : 0

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff] flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">جاري تحميل الجولات</h3>
          <p className="text-lg text-slate-600">يرجى الانتظار...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-6 bg-gradient-to-r from-danger-50 to-rose-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-danger-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">خطأ في تحميل الجولات</h3>
          <p className="text-lg text-slate-600 mb-8">{error}</p>
          <Button 
            onClick={refetch} 
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f0ff] via-white to-[#ecf7ff]">
      <div className="p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 p-8 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">إدارة الجولات</h1>
                <p className="text-lg text-slate-600">اختر طريقة العرض المناسبة لإدارة جولات التقييم</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-primary-100 to-primary-50 text-slate-900 border border-primary-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-700 text-sm font-medium">إجمالي الجولات</p>
                  <p className="text-3xl font-bold text-slate-900">{totalRounds}</p>
                </div>
                <Target className="w-12 h-12 text-primary-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-slate-900 border border-emerald-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 text-sm font-medium">مكتملة</p>
                  <p className="text-3xl font-bold text-slate-900">{completedRounds}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-emerald-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-100 to-amber-50 text-slate-900 border border-amber-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-700 text-sm font-medium">قيد التنفيذ</p>
                  <p className="text-3xl font-bold text-slate-900">{inProgressRounds}</p>
                </div>
                <Clock className="w-12 h-12 text-amber-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-fuchsia-100 to-fuchsia-50 text-slate-900 border border-fuchsia-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-fuchsia-700 text-sm font-medium">مجدولة</p>
                  <p className="text-3xl font-bold text-slate-900">{scheduledRounds}</p>
                </div>
                <CalendarIcon className="w-12 h-12 text-fuchsia-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List View Option */}
          <Card className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur" onClick={() => navigate('/rounds/list')}>
            <CardContent className="p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">عرض الجولات</h3>
                  <p className="text-slate-600">عرض الجولات في شكل قائمة تفصيلية</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>عرض تفصيلي لجميع الجولات</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>فلاتر بحث متقدمة</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>إحصائيات مفصلة</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>إدارة سريعة للجولات</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                عرض القائمة
              </Button>
            </CardContent>
          </Card>

          {/* Calendar View Option */}
          <Card className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur" onClick={() => navigate('/rounds/calendar')}>
            <CardContent className="p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-4 bg-gradient-to-r from-primary-400 to-primary-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <CalendarIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">تقويم الجولات</h3>
                  <p className="text-slate-600">عرض الجولات في شكل تقويم شهري</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>تقويم شهري تفاعلي</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>جدول زمني للجولات</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>عرض مرئي للأحداث</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>تخطيط زمني متقدم</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                عرض التقويم
              </Button>
            </CardContent>
          </Card>

          {/* My Rounds Option */}
          <Card className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur" onClick={() => navigate('/rounds/my-rounds')}>
            <CardContent className="p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-4 bg-gradient-to-r from-fuchsia-400 to-fuchsia-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">جولاتي</h3>
                  <p className="text-slate-600">الجولات المكلف بها شخصياً</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
                  <span>جولاتي الشخصية</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
                  <span>تتبع التقدم</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
                  <span>إدارة المهام</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
                  <span>تقارير الأداء</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                عرض جولاتي
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CAPA Integration Section */}
        {hasPermission(['super_admin', 'quality_manager', 'department_manager']) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">ربط التقييمات بخطط التصحيح</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CAPA Integration Card */}
              <Card className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur" onClick={() => navigate('/rounds/capa-integration')}>
                <CardContent className="p-8">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="p-4 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">ربط التقييمات بخطط التصحيح</h3>
                      <p className="text-slate-600">إنشاء خطط تصحيح للعناصر غير المطبقة</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>تحليل نتائج التقييم</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>إنشاء خطط تصحيح تلقائية</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>ربط العناصر غير المطبقة</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>متابعة خطط التحسين</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    ربط التقييمات بخطط التصحيح
                  </Button>
                </CardContent>
              </Card>

              {/* Round Selection for CAPA Integration */}
              <Card className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 backdrop-blur">
                <CardContent className="p-8">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="p-4 bg-gradient-to-r from-primary-400 to-primary-500 rounded-2xl">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">إحصائيات الربط</h3>
                      <p className="text-slate-600">معلومات حول التقييمات وخطط التصحيح</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-700 font-medium">الجولات المكتملة</span>
                      <span className="text-2xl font-bold text-emerald-600">{completedRounds}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-700 font-medium">جولات قيد التنفيذ</span>
                      <span className="text-2xl font-bold text-primary-600">{inProgressRounds}</span>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/capa')}
                      variant="outline" 
                      className="w-full mt-4 py-3 text-lg font-semibold rounded-xl border-2 hover:bg-primary-50 hover:border-primary-300 transition-all duration-300"
                    >
                      عرض جميع خطط التصحيح
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-white/80 rounded-2xl shadow-xl border border-slate-200/70 backdrop-blur">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">إجراءات سريعة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/rounds/list')}
                variant="outline" 
                className="h-16 text-lg flex items-center gap-3 justify-start"
              >
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                عرض جميع الجولات
              </Button>
              
              <Button 
                onClick={() => navigate('/rounds/calendar')}
                variant="outline" 
                className="h-16 text-lg flex items-center gap-3 justify-start"
              >
                <CalendarIcon className="w-6 h-6 text-primary-600" />
                فتح التقويم
              </Button>
              
              <Button 
                onClick={() => navigate('/rounds/my-rounds')}
                variant="outline" 
                className="h-16 text-lg flex items-center gap-3 justify-start"
              >
                <Users className="w-6 h-6 text-fuchsia-600" />
                جولاتي الشخصية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RoundsManagement
