import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Zap
} from 'lucide-react'

const RoundsManagement: React.FC = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth() as any
  const { data: rounds, loading, error, refetch } = useRounds()

  // Get rounds statistics
  const totalRounds = Array.isArray(rounds) ? rounds.length : 0
  const completedRounds = Array.isArray(rounds) ? rounds.filter((r: any) => r.status === 'completed').length : 0
  const inProgressRounds = Array.isArray(rounds) ? rounds.filter((r: any) => r.status === 'in_progress').length : 0
  const scheduledRounds = Array.isArray(rounds) ? rounds.filter((r: any) => r.status === 'scheduled').length : 0

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">جاري تحميل الجولات</h3>
          <p className="text-lg text-gray-600">يرجى الانتظار...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-red-100">
        <div className="p-6 bg-red-50 rounded-full mb-6">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">تعذر تحميل البيانات</h3>
        <p className="text-slate-500 mb-8">{error}</p>
        <Button
          onClick={refetch}
          className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-xl font-bold transition-all active:scale-95"
        >
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card className="relative overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-slate-200/40 rounded-3xl group">
      <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-60", color.replace('text-', 'bg-').replace('600', '100'))} />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl", color.replace('text-', 'bg-').replace('600', '100'))}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )

  const PortalCard = ({ title, description, icon: Icon, gradient, color, onClick, features }: any) => (
    <Card
      className="relative overflow-hidden bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2rem] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer group"
      onClick={onClick}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500", gradient)} />
      <CardContent className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div className={cn("p-5 rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", color)}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <div className="p-2 bg-slate-50 rounded-full group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="text-2xl font-black text-slate-900">{title}</h3>
          <p className="text-slate-500 leading-relaxed font-medium">{description}</p>
        </div>

        <div className="space-y-3">
          {features.map((feature: string, i: number) => (
            <div key={i} className="flex items-center gap-3 text-slate-600 font-medium">
              <div className={cn("w-2 h-2 rounded-full", color.split(' ')[0])} />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex items-center justify-between text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
            <span className={cn("bg-clip-text text-transparent bg-gradient-to-r", gradient)}>ابدأ الآن</span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-10">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الجولات" value={totalRounds} icon={Target} color="text-blue-600" trend="+12%" />
        <StatCard title="الجولات المكتملة" value={completedRounds} icon={CheckCircle2} color="text-green-600" trend="+5%" />
        <StatCard title="قيد التنفيذ" value={inProgressRounds} icon={Clock} color="text-amber-600" trend="+2%" />
        <StatCard title="المجدولة" value={scheduledRounds} icon={CalendarIcon} color="text-indigo-600" trend="+0%" />
      </div>

      {/* Main Portals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PortalCard
          title="عرض الجولات"
          description="عرض تفصيلي لجميع الجولات في شكل قائمة تفاعلية مع خيارات بحث وفلترة متقدمة."
          icon={BarChart3}
          gradient="from-green-500 to-emerald-600"
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          onClick={() => navigate('/rounds/list')}
          features={['عرض تفصيلي متكامل', 'فلاتر بحث ذكية', 'إحصائيات فورية']}
        />

        <PortalCard
          title="تقويم الجولات"
          description="تتبع الجدران الزمنية والمواعيد المجدولة من خلال واجهة تقويم تفاعلية وسهلة."
          icon={CalendarIcon}
          gradient="from-blue-500 to-indigo-600"
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClick={() => navigate('/rounds/calendar')}
          features={['جدولة زمنية مرئية', 'تخطيط شهري وأسبوعي', 'مزامنة المواعيد']}
        />

        <PortalCard
          title="جولاتي الشخصية"
          description="منصة مخصصة لمتابعة جولاتك الخاصة، المهام المسندة إليك، وتتبع تقدمك الشخصي."
          icon={Users}
          gradient="from-purple-500 to-violet-600"
          color="bg-gradient-to-br from-purple-500 to-violet-600"
          onClick={() => navigate('/rounds/my-rounds')}
          features={['قائمة مهامي', 'تتبع الأداء الشخصي', 'تقارير الإنجاز']}
        />
      </div>

      {/* Modern CAPA Section */}
      {hasPermission(['super_admin', 'quality_manager', 'department_manager']) && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900">ربط النتائج بخطط التصحيح</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card
              className="relative overflow-hidden bg-slate-900 text-white rounded-[2rem] shadow-2xl transition-transform hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/rounds/capa-integration')}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-10 relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="p-8 bg-orange-500/10 backdrop-blur-xl border border-orange-500/20 rounded-3xl shrink-0">
                  <Target className="w-16 h-16 text-orange-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black">خطط التصحيح الفورية</h3>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    قم بتحويل النتائج السلبية تلقائياً إلى خطط عمل تصحيحية لمتابعة التحسين.
                  </p>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 px-8 font-bold text-lg border-none shadow-lg shadow-orange-900/20">
                    استعراض الربط والتكامل
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-xl rounded-[2rem] p-4 flex flex-col justify-center">
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-sm font-bold text-slate-500">الجولات المكتملة</span>
                    <span className="text-4xl font-black text-green-600">{completedRounds}</span>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-sm font-bold text-slate-500">تحت التنفيذ</span>
                    <span className="text-4xl font-black text-blue-600">{inProgressRounds}</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/capa')}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-lg font-bold transition-all"
                >
                  فتح لوحة تحكم CAPA الشاملة
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Access Bar */}
      <div className="bg-slate-900/5 backdrop-blur-sm border border-slate-200/50 p-6 rounded-[2rem] flex flex-wrap items-center justify-center gap-4">
        <span className="text-slate-500 font-bold ml-4">الوصول السريع:</span>
        {[
          { icon: BarChart3, label: 'جميع الجولات', path: '/rounds/list' },
          { icon: CalendarIcon, label: 'التقويم', path: '/rounds/calendar' },
          { icon: Users, label: 'جولاتي', path: '/rounds/my-rounds' }
        ].map((item, i) => (
          <Button
            key={i}
            variant="ghost"
            onClick={() => navigate(item.path)}
            className="group flex items-center gap-2 px-6 h-11 rounded-xl font-bold bg-white border border-slate-200 shadow-sm hover:bg-slate-900 hover:text-white transition-all"
          >
            <item.icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default RoundsManagement
