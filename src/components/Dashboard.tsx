import React from 'react';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
// Removed mock data imports - using API data instead
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  // TODO: Replace with API calls to get real dashboard stats
  const stats = {
    totalRounds: 0,
    completedRounds: 0,
    pendingRounds: 0,
    overdueRounds: 0,
    averageCompliance: 0,
    totalCapa: 0,
    openCapa: 0,
    closedCapa: 0,
    overdueCapa: 0
  };

  // Chart data
  const complianceData = [
    { name: 'قسم الطوارئ', compliance: 92, rounds: 8 },
    { name: 'العناية المركزة', compliance: 87, rounds: 6 },
    { name: 'قسم الجراحة', compliance: 95, rounds: 5 },
    { name: 'قسم الأطفال', compliance: 89, rounds: 7 },
    { name: 'قسم الباطنية', compliance: 91, rounds: 4 },
  ];

  const roundsByType = [
    { name: 'سلامة المرضى', value: 8, color: '#3b82f6' },
    { name: 'مكافحة العدوى', value: 6, color: '#ef4444' },
    { name: 'النظافة', value: 5, color: '#10b981' },
    { name: 'سلامة الأدوية', value: 4, color: '#f59e0b' },
    { name: 'سلامة المعدات', value: 3, color: '#8b5cf6' },
  ];

  const monthlyTrends = [
    { month: 'يناير', rounds: 12, compliance: 89 },
    { month: 'فبراير', rounds: 15, compliance: 91 },
    { month: 'مارس', rounds: 18, compliance: 88 },
    { month: 'أبريل', rounds: 14, compliance: 93 },
    { month: 'مايو', rounds: 16, compliance: 90 },
    { month: 'يونيو', rounds: 20, compliance: 92 },
  ];

  const capaStatusData = [
    { name: 'منفذة', value: 7, color: '#10b981' },
    { name: 'قيد التنفيذ', value: 3, color: '#3b82f6' },
    { name: 'معلقة', value: 2, color: '#f59e0b' },
    { name: 'متأخرة', value: 1, color: '#ef4444' },
  ];

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    trend,
    description
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ComponentType<any>; 
    color: string;
    trend?: string;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'scheduled': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'implemented': 'bg-green-100 text-green-800',
      'pending': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'completed': 'مكتملة',
      'in_progress': 'قيد التنفيذ',
      'scheduled': 'مجدولة',
      'overdue': 'متأخرة',
      'implemented': 'منفذة',
      'pending': 'معلقة'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const recentRounds = mockRounds.slice(0, 5);
  const recentCapa = mockCapa.slice(0, 5);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              أهلاً وسهلاً، {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-primary-100">
              مرحباً بك في نظام سلامتي لإدارة جولات الجودة وسلامة المرضى
            </p>
          </div>
          <div className="text-primary-100 text-right">
            <p className="text-sm">اليوم</p>
            <p className="text-lg font-semibold">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الجولات"
          value={stats.totalRounds}
          icon={ClipboardCheck}
          color="bg-blue-500"
          trend="+12% من الشهر الماضي"
        />
        <StatCard
          title="الجولات المكتملة"
          value={stats.completedRounds}
          icon={CheckCircle2}
          color="bg-green-500"
          trend={`${Math.round((stats.completedRounds / stats.totalRounds) * 100)}% معدل الإكمال`}
        />
        <StatCard
          title="خطط تصحيحية مفتوحة"
          value={stats.openCapa}
          icon={AlertTriangle}
          color="bg-orange-500"
          trend={stats.overdueCapa > 0 ? `${stats.overdueCapa} متأخرة` : 'لا توجد متأخرة'}
        />
        <StatCard
          title="معدل الامتثال"
          value={`${stats.averageCompliance}%`}
          icon={TrendingUp}
          color="bg-primary-500"
          trend="+2.3% تحسن"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              معدل الامتثال حسب الأقسام
            </CardTitle>
            <CardDescription>
              مقارنة معدلات الامتثال بين الأقسام المختلفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, 'معدل الامتثال']}
                    labelFormatter={(label) => `القسم: ${label}`}
                  />
                  <Bar dataKey="compliance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rounds by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-600" />
              توزيع الجولات حسب النوع
            </CardTitle>
            <CardDescription>
              عدد الجولات لكل نوع من أنواع التقييم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={roundsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roundsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            الاتجاهات الشهرية
          </CardTitle>
          <CardDescription>
            تطور عدد الجولات ومعدل الامتثال على مدى الأشهر الماضية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'rounds' ? `${value} جولة` : `${value}%`,
                    name === 'rounds' ? 'عدد الجولات' : 'معدل الامتثال'
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="rounds"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="compliance"
                  stroke="#10b981"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rounds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              الجولات الحديثة
            </CardTitle>
            <CardDescription>
              آخر الجولات المكتملة والمجدولة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRounds.map((round) => (
                <div key={round.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{round.title}</h3>
                    <p className="text-sm text-muted-foreground">{round.department}</p>
                  </div>
                  <div className="text-left">
                    <Badge variant={round.status === 'completed' ? 'default' : 'secondary'}>
                      {getStatusText(round.status)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(round.scheduledDate).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent CAPA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              الخطط التصحيحية
            </CardTitle>
            <CardDescription>
              آخر الخطط التصحيحية المطلوبة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCapa.map((capa) => (
                <div key={capa.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{capa.title}</h3>
                    <p className="text-sm text-muted-foreground">{capa.department}</p>
                    {capa.assignedTo && (
                      <p className="text-xs text-muted-foreground">المسؤول: {capa.assignedTo}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <Badge variant={capa.status === 'implemented' ? 'default' : 'secondary'}>
                      {getStatusText(capa.status)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      المهلة: {new Date(capa.targetDate).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
          <CardDescription>
            الوصول السريع للمهام الأساسية في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasPermission(['super_admin', 'quality_manager']) && (
              <button className="flex items-center gap-3 p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group">
                <div className="p-2 bg-primary rounded-lg group-hover:bg-primary/90">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-medium text-foreground">إنشاء جولة جديدة</h3>
                  <p className="text-sm text-muted-foreground">جدولة جولة تقييم جديدة</p>
                </div>
              </button>
            )}
            
            <button className="flex items-center gap-3 p-4 bg-orange-500/5 hover:bg-orange-500/10 rounded-lg transition-colors group">
              <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-500/90">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-medium text-foreground">إنشاء CAPA</h3>
                <p className="text-sm text-muted-foreground">إنشاء خطة تصحيحية جديدة</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-green-500/5 hover:bg-green-500/10 rounded-lg transition-colors group">
              <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-500/90">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-medium text-foreground">إدارة المستخدمين</h3>
                <p className="text-sm text-muted-foreground">إضافة وإدارة المستخدمين</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;