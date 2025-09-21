import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building2,
  ClipboardCheck,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { mockRounds, mockDepartments } from '../data/mockData';
import { Round, RoundStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import RoundForm from './forms/RoundForm';

const RoundsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoundStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredRounds = mockRounds.filter(round => {
    const matchesSearch = round.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         round.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || round.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || round.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusIcon = (status: RoundStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <ClipboardCheck className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: RoundStatus) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'scheduled': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'pending_review': 'bg-purple-100 text-purple-800',
      'under_review': 'bg-indigo-100 text-indigo-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'on_hold': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: RoundStatus) => {
    const texts = {
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'pending_review': 'بانتظار المراجعة',
      'under_review': 'تحت المراجعة',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة',
      'on_hold': 'معلقة',
      'overdue': 'متأخرة'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getPriorityText = (priority: string) => {
    const texts = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return texts[priority as keyof typeof texts] || priority;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الجولات</h1>
          <p className="text-gray-600">إدارة وتتبع جولات التقييم والجودة</p>
        </div>
        {hasPermission(['super_admin', 'quality_manager']) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            جولة جديدة
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الجولات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RoundStatus | 'all')}
            className="input-field"
          >
            <option value="all">جميع الحالات</option>
            <option value="scheduled">مجدولة</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="pending_review">بانتظار المراجعة</option>
            <option value="completed">مكتملة</option>
            <option value="overdue">متأخرة</option>
          </select>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">جميع الأقسام</option>
            {mockDepartments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فلاتر متقدمة
          </button>
        </div>
      </div>

      {/* Rounds Grid - Ticket Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRounds.map((round) => (
          <div key={round.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Ticket Header */}
            <div className={`text-white p-3 ${
              round.status === 'completed' 
                ? 'bg-gradient-to-r from-green-600 to-green-700'
                : round.status === 'in_progress'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                : round.status === 'scheduled'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                : 'bg-gradient-to-r from-red-600 to-red-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{round.department}</h3>
                    <p className="text-blue-100 text-xs">{round.roundCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(round.status)}`}>
                    {getStatusText(round.status)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ticket Content */}
            <div className="p-4">
              <div className="mb-3">
                <h4 className="text-base font-semibold text-gray-900 mb-1">{round.title}</h4>
                {round.description && (
                  <p className="text-gray-600 text-xs line-clamp-1">{round.description}</p>
                )}
              </div>
              
              {/* Flight Details Style */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {new Date(round.scheduledDate).toLocaleDateString('ar-SA', { 
                      day: '2-digit',
                      month: 'short'
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(round.scheduledDate).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">تاريخ الجولة</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-bold px-3 py-2 rounded-lg ${
                    round.priority === 'urgent' 
                      ? 'bg-red-100 text-red-800'
                      : round.priority === 'high'
                      ? 'bg-orange-100 text-orange-800'
                      : round.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {getRoundTypeText(round.roundType)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                    round.priority === 'urgent' 
                      ? 'bg-red-200 text-red-700'
                      : round.priority === 'high'
                      ? 'bg-orange-200 text-orange-700'
                      : round.priority === 'medium'
                      ? 'bg-yellow-200 text-yellow-700'
                      : 'bg-green-200 text-green-700'
                  }`}>
                    {getPriorityText(round.priority)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">نوع الجولة</div>
                </div>
              </div>

              {/* Assigned To */}
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <div>
                    <div className="text-xs font-medium text-gray-900">المكلف</div>
                    <div className="text-xs text-gray-600 truncate">{round.assignedTo.join(', ')}</div>
                  </div>
                </div>
              </div>

              {/* Compliance */}
              {round.status === 'completed' && round.compliancePercentage > 0 && (
                <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium text-sm">الامتثال: {round.compliancePercentage}%</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex gap-2">
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm">
                    عرض التفاصيل
                  </button>
                  {round.status === 'scheduled' && (
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors text-sm">
                      بدء الجولة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRounds.length === 0 && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد جولات</h3>
          <p className="text-gray-600 mb-6">لم يتم العثور على جولات تتطابق مع معايير البحث</p>
          {hasPermission(['super_admin', 'quality_manager']) && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              إنشاء جولة جديدة
            </button>
          )}
        </div>
      )}

      {/* Create Round Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <RoundForm
              onSubmit={(data) => {
                console.log('Round created:', data);
                alert('تم إنشاء الجولة بنجاح!');
                setShowCreateForm(false);
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundsPage;