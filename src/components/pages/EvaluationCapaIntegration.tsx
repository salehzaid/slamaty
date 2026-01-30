import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  FileText,
  Target,
  Calendar,
  Edit
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface NonCompliantItem {
  evaluation_result_id: number;
  item_id: number;
  item_code: string;
  item_title: string;
  item_description: string;
  category_name: string;
  category_color: string;
  risk_level: 'MINOR' | 'MAJOR' | 'CRITICAL';
  score: number;
  comments: string;
  evaluated_at: string;
  round_id: number;
}

interface CapaSummary {
  round_id: number;
  round_title: string;
  round_department: string;
  round_compliance_percentage: number;
  total_capas: number;
  total_evaluations: number;
  non_compliant_evaluations: number;
  capas_needed: number;
  capa_by_status: Record<string, any[]>;
}

const EvaluationCapaIntegration: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const [nonCompliantItems, setNonCompliantItems] = useState<NonCompliantItem[]>([]);
  const [capaSummary, setCapaSummary] = useState<CapaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(70);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (roundId) {
      fetchData();
    }
  }, [roundId, threshold]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rounds/${roundId}/non-compliant-items?threshold=${threshold}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }),
        fetch(`${API_BASE_URL}/api/rounds/${roundId}/capa-summary`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
      ]);

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setNonCompliantItems(itemsData.items);
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setCapaSummary(summaryData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'خطأ في تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const createCapaForItem = (item: NonCompliantItem) => {
    // Navigate to CAPA form with pre-filled data
    const params = new URLSearchParams({
      itemId: item.item_id.toString(),
      itemTitle: item.item_title,
      itemComment: item.comments || 'لا توجد ملاحظات',
      itemCode: item.item_code,
      roundId: roundId || '',
      department: capaSummary?.round_department || '',
      status: item.score === 0 ? 'not_applied' : 'partial'
    });

    navigate(`/capa/new?${params.toString()}`);
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'MAJOR': return 'bg-orange-100 text-orange-800';
      case 'MINOR': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score === 0) return 'bg-red-100 text-red-800';
    if (score <= 25) return 'bg-orange-100 text-orange-800';
    if (score <= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
        <span className="mr-2">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ربط التقييمات بخطط التصحيح</h1>
          <p className="text-gray-600 mt-1">
            {capaSummary?.round_title} - {capaSummary?.round_department}
          </p>
        </div>
        <Button
          onClick={() => navigate('/rounds')}
          variant="outline"
        >
          العودة للجولات
        </Button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {capaSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">{capaSummary.total_evaluations}</p>
                  <p className="text-sm text-gray-600">إجمالي التقييمات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">{capaSummary.non_compliant_evaluations}</p>
                  <p className="text-sm text-gray-600">عناصر غير مطبقة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">{capaSummary.total_capas}</p>
                  <p className="text-sm text-gray-600">خطط التصحيح الموجودة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">{capaSummary.capas_needed}</p>
                  <p className="text-sm text-gray-600">خطط مطلوبة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Threshold Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 ml-2" />
            إعدادات العتبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">عتبة النقاط لإنشاء خطط التصحيح:</label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="px-3 py-1 border rounded-md"
            >
              <option value={50}>50 نقطة أو أقل</option>
              <option value={60}>60 نقطة أو أقل</option>
              <option value={70}>70 نقطة أو أقل</option>
              <option value={80}>80 نقطة أو أقل</option>
            </select>
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Non-Compliant Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 ml-2 text-orange-600" />
            العناصر المحتاجة لخطط تصحيح ({nonCompliantItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nonCompliantItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">ممتاز!</p>
              <p className="text-gray-600">جميع عناصر التقييم مطبقة بشكل صحيح</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nonCompliantItems.map((item) => (
                <div key={item.item_id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{item.item_title}</h3>
                        <Badge variant="outline">{item.item_code}</Badge>
                        <Badge className={getRiskBadgeColor(item.risk_level)}>
                          {item.risk_level}
                        </Badge>
                        <Badge className={getScoreBadgeColor(item.score)}>
                          {item.score}/100
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{item.item_description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>الفئة: {item.category_name}</span>
                        <span>تاريخ التقييم: {new Date(item.evaluated_at).toLocaleDateString('en-US')}</span>
                      </div>

                      {item.comments && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <strong>ملاحظات المقيم:</strong> {item.comments}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => createCapaForItem(item)}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      إنشاء خطة تصحيح
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing CAPAs Summary */}
      {capaSummary && capaSummary.total_capas > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 ml-2" />
              خطط التصحيح الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(capaSummary.capa_by_status).map(([status, capas]) => (
                <div key={status} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {status === 'pending' && 'معلقة'}
                    {status === 'assigned' && 'مكلفة'}
                    {status === 'in_progress' && 'قيد التنفيذ'}
                    {status === 'implemented' && 'منفذة'}
                    {status === 'verified' && 'متحققة'}
                    {status === 'closed' && 'مغلقة'}
                    {!['pending', 'assigned', 'in_progress', 'implemented', 'verified', 'closed'].includes(status) && status}
                    ({capas.length})
                  </h4>
                  <div className="space-y-2">
                    {capas.slice(0, 3).map((capa: any) => (
                      <div key={capa.id} className="text-sm text-gray-600 border-r-2 border-blue-200 pr-2">
                        <div className="font-medium">{capa.title}</div>
                        <div className="text-xs">
                          أولوية: {capa.priority} |
                          تاريخ الهدف: {new Date(capa.target_date).toLocaleDateString('en-US')}
                        </div>
                      </div>
                    ))}
                    {capas.length > 3 && (
                      <div className="text-xs text-gray-500">
                        و {capas.length - 3} خطط أخرى...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-4 border-gray-200" />

            <div className="flex justify-center">
              <Button
                onClick={() => navigate('/capa')}
                variant="outline"
              >
                <FileText className="h-4 w-4 ml-1" />
                عرض جميع خطط التصحيح
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EvaluationCapaIntegration;
