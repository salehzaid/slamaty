import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  User,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Trash2,
  Play
} from 'lucide-react';
import { mockDepartments } from '../data/mockData';
import { Capa, CapaStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDeleteCapa, useCapas } from '../hooks/useCapas';

const CapaPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CapaStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  const { hasPermission } = useAuth();
  const deleteCapaMutation = useDeleteCapa();
  const { data: capaData, loading: capaLoading, error: capaError } = useCapas();

  // وظائف الأزرار
  const handleViewDetails = (capaId: number) => {
    console.log('عرض تفاصيل CAPA:', capaId);
    // TODO: إضافة وظيفة عرض التفاصيل
    alert(`عرض تفاصيل خطة التصحيح رقم ${capaId}`);
  };

  const handleAssignManager = (capaId: number) => {
    console.log('تعيين مسؤول للـ CAPA:', capaId);
    // TODO: إضافة وظيفة تعيين المسؤول
    alert(`تعيين مسؤول لخطة التصحيح رقم ${capaId}`);
  };

  const handleStartImplementation = (capaId: number) => {
    console.log('بدء تنفيذ CAPA:', capaId);
    // TODO: إضافة وظيفة بدء التنفيذ
    alert(`بدء تنفيذ خطة التصحيح رقم ${capaId}`);
  };

  const handleStartCapaPlan = (capaId: number) => {
    console.log('بدء خطة التصحيح:', capaId);
    // TODO: إضافة وظيفة بدء خطة التصحيح
    alert(`تم بدء خطة التصحيح رقم ${capaId} بنجاح!`);
  };

  // Use actual data from API, fallback to empty array if loading or error
  const capaList = capaData || [];
  
  const filteredCapa = capaList.filter(capa => {
    const matchesSearch = capa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         capa.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || capa.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || capa.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusIcon = (status: CapaStatus) => {
    switch (status) {
      case 'verified':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: CapaStatus) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'implemented': 'bg-green-100 text-green-800',
      'verification': 'bg-purple-100 text-purple-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: CapaStatus) => {
    const texts = {
      'pending': 'معلقة',
      'assigned': 'معينة',
      'in_progress': 'قيد التنفيذ',
      'implemented': 'منفذة',
      'verification': 'بانتظار التحقق',
      'verified': 'محققة',
      'rejected': 'مرفوضة',
      'closed': 'مغلقة'
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

  const handleDeleteCapa = async (capaId: number) => {
    try {
      console.log('Attempting to delete CAPA with ID:', capaId);
      console.log('Current user permissions:', hasPermission(['super_admin', 'quality_manager']));
      
      await deleteCapaMutation.mutate(capaId);
      console.log('CAPA deleted successfully');
      
      // Refresh the page or update the data
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to delete CAPA:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Handle different error types
      if (error?.response?.status === 401) {
        alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        // Redirect to login or refresh token
        window.location.href = '/login';
      } else if (error?.response?.status === 403) {
        alert('ليس لديك صلاحية لحذف خطط التصحيح.');
      } else if (error?.response?.status === 404) {
        alert('خطة التصحيح غير موجودة.');
      } else {
        alert(`فشل في حذف خطة التصحيح: ${error?.message || 'خطأ غير معروف'}`);
      }
    }
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

  const getRiskLevel = (score?: number) => {
    if (!score) return { level: 'غير محدد', color: 'text-gray-500' };
    
    if (score >= 15) return { level: 'عالية', color: 'text-red-600' };
    if (score >= 10) return { level: 'متوسطة', color: 'text-orange-600' };
    return { level: 'منخفضة', color: 'text-green-600' };
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date();
  };

  // Show loading state
  if (capaLoading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل الخطط التصحيحية...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (capaError) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-6">{capaError}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">الخطط التصحيحية (CAPA)</h1>
          <p className="text-gray-600">إدارة ومتابعة الخطط التصحيحية والوقائية</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          خطة جديدة
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">إجمالي الخطط</p>
              <p className="text-2xl font-bold text-gray-900">{capaList.length}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-gray-900">
                {capaList.filter(c => c.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-xl">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">مكتملة</p>
              <p className="text-2xl font-bold text-gray-900">
                {capaList.filter(c => ['verified', 'closed'].includes(c.status)).length}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">متأخرة</p>
              <p className="text-2xl font-bold text-gray-900">
                {capaList.filter(c => isOverdue(c.targetDate) && !['verified', 'closed'].includes(c.status)).length}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-xl">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الخطط التصحيحية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CapaStatus | 'all')}
            className="input-field"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">معلقة</option>
            <option value="assigned">معينة</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="implemented">منفذة</option>
            <option value="verified">محققة</option>
            <option value="closed">مغلقة</option>
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

      {/* CAPA Grid - تصميم جديد */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCapa.map((capa) => {
          const riskLevel = getRiskLevel(capa.riskScore);
          const overdue = isOverdue(capa.targetDate) && !['verified', 'closed'].includes(capa.status);
          
          return (
            <div key={capa.id} className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 ${overdue ? 'border-red-300 bg-red-50' : ''}`}>
              
              {/* Header مع العنوان والحالة */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{capa.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{capa.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(capa.status)}`}>
                    {getStatusIcon(capa.status)}
                    {getStatusText(capa.status)}
                  </span>
                  
                  {overdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <Clock className="w-3 h-3" />
                      متأخرة
                    </span>
                  )}
                </div>
              </div>
              
              {/* معلومات القسم والمسؤول */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="font-semibold">القسم:</span>
                  <span className="font-bold">{capa.department}</span>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-blue-700">
                  <User className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">المسؤول:</span>
                      <span className="font-bold">
                        {capa.assignedManager 
                          ? `${capa.assignedManager.firstName} ${capa.assignedManager.lastName}` 
                          : capa.assignedTo || 'غير محدد'
                        }
                      </span>
                    </div>
                    {capa.assignedManager?.position && (
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        المنصب: {capa.assignedManager.position}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* تفاصيل إضافية */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    المهلة: {new Date(capa.targetDate).toLocaleDateString('ar-SA', { 
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${getPriorityColor(capa.priority)}`}>
                    الأولوية: {getPriorityText(capa.priority)}
                  </span>
                  {capa.riskScore && (
                    <span className={`font-medium ${riskLevel.color}`}>
                      المخاطر: {riskLevel.level} ({capa.riskScore})
                    </span>
                  )}
                </div>
              </div>
              
              {/* معلومات إضافية */}
              <div className="border-t border-gray-200 pt-3 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>ID: {capa.id}</span>
                  <span>
                    بواسطة: {
                      capa.creator 
                        ? `${capa.creator.firstName} ${capa.creator.lastName}` 
                        : capa.createdBy || 'غير محدد'
                    }
                  </span>
                </div>
                {capa.evaluationItemId && (
                  <div className="mt-2 text-xs text-blue-600">
                    مرتبط بعنصر التقييم: #{capa.evaluationItemId}
                  </div>
                )}
              </div>
              
              {/* أزرار العمل */}
              <div className="space-y-3">
                {/* الأزرار الأساسية */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(capa.id)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    عرض التفاصيل
                  </button>
                  {capa.status === 'pending' && (
                    <button 
                      onClick={() => handleAssignManager(capa.id)}
                      className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      تعيين مسؤول
                    </button>
                  )}
                  {capa.status === 'assigned' && (
                    <button 
                      onClick={() => handleStartImplementation(capa.id)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      بدء التنفيذ
                    </button>
                  )}
                </div>
                
                {/* زر بدء خطة التصحيح - مميز */}
                <button 
                  onClick={() => handleStartCapaPlan(capa.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  بدء خطة التصحيح
                </button>
                
                {/* زر الحذف */}
                {hasPermission(['super_admin', 'quality_manager']) && (
                  <button 
                    onClick={() => {
                      if (hasPermission(['super_admin', 'quality_manager'])) {
                        setShowDeleteConfirm(capa.id);
                      } else {
                        alert('ليس لديك صلاحية لحذف خطط التصحيح');
                      }
                    }}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCapa.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد خطط تصحيحية</h3>
          <p className="text-gray-600 mb-6">لم يتم العثور على خطط تتطابق مع معايير البحث</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            إنشاء خطة جديدة
          </button>
        </div>
      )}

      {/* Create CAPA Modal - Placeholder */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">إنشاء خطة تصحيحية جديدة</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600">نموذج إنشاء CAPA سيتم إضافته قريباً</p>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary mt-4"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">تأكيد الحذف</h3>
                <p className="text-sm text-gray-600">هل أنت متأكد من حذف خطة التصحيح هذه؟</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه. سيتم حذف خطة التصحيح نهائياً من النظام.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  handleDeleteCapa(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                disabled={deleteCapaMutation.isPending}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteCapaMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    حذف نهائياً
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapaPage;