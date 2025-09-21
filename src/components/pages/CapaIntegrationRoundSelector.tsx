import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Calendar, 
  Building2, 
  Target, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useRounds } from '@/hooks/useRounds';

interface Round {
  id: number;
  title: string;
  department: string;
  status: string;
  compliance_percentage: number;
  completion_percentage: number;
  scheduled_date: string;
  round_type: string;
  priority: string;
}

const CapaIntegrationRoundSelector: React.FC = () => {
  const navigate = useNavigate();
  const { data: rounds, loading, error } = useRounds();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Filter rounds - only show completed rounds as they have evaluation results
  const filteredRounds = Array.isArray(rounds) ? rounds.filter((round: Round) => {
    const matchesSearch = round.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         round.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || round.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || round.department === departmentFilter;
    
    // Only show completed rounds or rounds with evaluation results
    const hasEvaluations = round.status === 'completed' || round.completion_percentage > 0;
    
    return matchesSearch && matchesStatus && matchesDepartment && hasEvaluations;
  }) : [];

  // Get unique departments for filter
  const departments = Array.isArray(rounds) ? 
    [...new Set(rounds.map((round: Round) => round.department))] : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'overdue': 'متأخرة',
      'cancelled': 'ملغية'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return priorityMap[priority] || priority;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl" dir="rtl">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل الجولات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl" dir="rtl">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في تحميل الجولات</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">اختيار جولة للربط بخطط التصحيح</h1>
          <p className="text-gray-600 mt-1">اختر جولة مكتملة لإنشاء خطط تصحيح للعناصر غير المطبقة</p>
        </div>
        <Button
          onClick={() => navigate('/rounds')}
          variant="outline"
        >
          العودة للجولات
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="البحث في الجولات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">جميع الحالات</option>
              <option value="completed">مكتملة</option>
              <option value="in_progress">قيد التنفيذ</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">جميع الأقسام</option>
              {departments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Rounds List */}
      {filteredRounds.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد جولات متاحة</h3>
            <p className="text-gray-600">
              لا توجد جولات مكتملة أو تحتوي على نتائج تقييم متاحة للربط بخطط التصحيح.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRounds.map((round: Round) => (
            <Card key={round.id} className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => navigate(`/rounds/${round.id}/capa-integration`)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{round.title}</h3>
                      <Badge className={getStatusColor(round.status)}>
                        {getStatusIcon(round.status)}
                        <span className="mr-1">{getStatusText(round.status)}</span>
                      </Badge>
                      <Badge className={getPriorityColor(round.priority)}>
                        {getPriorityText(round.priority)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{round.department}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(round.scheduled_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">نسبة الامتثال</span>
                          <span className="text-sm font-medium">{round.compliance_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              round.compliance_percentage >= 80 ? 'bg-green-600' :
                              round.compliance_percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${round.compliance_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">نسبة الإنجاز</span>
                          <span className="text-sm font-medium">{round.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${round.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mr-4">
                    <Button variant="outline" size="sm">
                      <ArrowRight className="w-4 h-4 ml-1" />
                      اختيار الجولة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CapaIntegrationRoundSelector;
