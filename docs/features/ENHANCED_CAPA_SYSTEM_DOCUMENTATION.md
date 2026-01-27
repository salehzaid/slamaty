# نظام إدارة الخطط التصحيحية والوقائية المحسن

## نظرة عامة

تم تطوير نظام شامل لإدارة الخطط التصحيحية والوقائية (CAPA) مع ميزات متقدمة للتحليلات والإشعارات والتقارير.

## الميزات الرئيسية

### 1. إدارة الخطط التصحيحية
- إنشاء وتعديل الخطط التصحيحية
- تتبع الإجراءات التصحيحية والوقائية
- إدارة خطوات التحقق
- نظام الأولويات والتصعيد

### 2. لوحة التحكم المحسنة
- إحصائيات شاملة
- تتبع التقدم
- نظام التنبيهات
- التقارير الأساسية

### 3. التحليلات المتقدمة
- تنبؤات ذكية
- مقارنة أداء الأقسام
- تحليل المخاطر
- مقاييس الأداء

### 4. الإشعارات الفورية
- إشعارات WebSocket
- إشعارات المتصفح
- إدارة الإشعارات

### 5. مولد التقارير المخصصة
- قوالب تقارير قابلة للتخصيص
- فلاتر متقدمة
- تصدير PDF و Excel

### 6. محسن الأداء
- مراقبة الأداء
- توصيات التحسين
- إدارة الذاكرة المؤقتة

## البنية التقنية

### Backend (Python/FastAPI)
```
backend/
├── api_enhanced_dashboard.py      # API لوحة التحكم
├── api_analytics.py              # API التحليلات
├── api_notifications.py          # API الإشعارات
├── crud_enhanced_dashboard.py    # عمليات قاعدة البيانات
├── crud_analytics.py            # عمليات التحليلات
├── crud_notifications.py        # عمليات الإشعارات
├── models_enhanced.py           # نماذج قاعدة البيانات
├── schemas_enhanced_dashboard.py # مخططات البيانات
├── schemas_analytics.py         # مخططات التحليلات
└── schemas_notifications.py     # مخططات الإشعارات
```

### Frontend (React/TypeScript)
```
src/components/
├── dashboard/                    # مكونات لوحة التحكم
│   ├── EnhancedCapaDashboard.tsx
│   ├── ActionProgressTracker.tsx
│   ├── CapaTimelineView.tsx
│   ├── AlertSystem.tsx
│   ├── BasicReports.tsx
│   └── EnhancedCapaDashboardMain.tsx
├── analytics/                   # مكونات التحليلات
│   └── AdvancedAnalytics.tsx
├── notifications/               # مكونات الإشعارات
│   └── RealTimeNotifications.tsx
├── reports/                     # مكونات التقارير
│   └── CustomReportBuilder.tsx
├── performance/                 # مكونات الأداء
│   └── PerformanceOptimizer.tsx
├── filters/                     # مكونات الفلاتر
│   └── AdvancedFilters.tsx
├── visualization/               # مكونات الرسوم البيانية
│   └── InteractiveCharts.tsx
├── ErrorBoundary.tsx            # معالجة الأخطاء
├── LoadingSpinner.tsx           # مؤشر التحميل
└── EmptyState.tsx               # الحالة الفارغة
```

## نقاط نهاية API

### لوحة التحكم
- `GET /api/dashboard/stats/` - إحصائيات لوحة التحكم
- `GET /api/dashboard/overdue/` - الإجراءات المتأخرة
- `GET /api/dashboard/upcoming/` - المواعيد القادمة
- `GET /api/timeline/events/` - أحداث الجدول الزمني
- `GET /api/alerts/` - التنبيهات
- `GET /api/actions/` - الإجراءات
- `GET /api/reports/basic/` - التقارير الأساسية

### التحليلات
- `GET /api/analytics/advanced/` - التحليلات المتقدمة
- `GET /api/analytics/performance/` - مقاييس الأداء
- `GET /api/analytics/departments/` - مقارنة الأقسام
- `GET /api/analytics/risk/` - تحليل المخاطر
- `GET /api/analytics/predictions/` - التنبؤات

### الإشعارات
- `GET /api/notifications/` - الإشعارات
- `POST /api/notifications/` - إنشاء إشعار
- `PUT /api/notifications/{id}/read` - تعيين كمقروء
- `DELETE /api/notifications/{id}` - حذف إشعار

## قاعدة البيانات

### الجداول الرئيسية
- `capas` - الخطط التصحيحية
- `corrective_actions` - الإجراءات التصحيحية
- `preventive_actions` - الإجراءات الوقائية
- `verification_steps` - خطوات التحقق
- `capa_progress_tracking` - تتبع التقدم

### العلاقات
- كل خطة تصحيحية لها إجراءات تصحيحية ووقائية
- كل إجراء له خطوات تحقق
- تتبع التقدم لكل خطة

## التثبيت والتشغيل

### المتطلبات
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### تثبيت Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# أو
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### تثبيت Frontend
```bash
npm install
```

### تشغيل التطبيق
```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn main:app --reload

# Frontend
npm run dev
```

## الاستخدام

### 1. الوصول للوحة التحكم
- انتقل إلى `/capa-dashboard`
- عرض الإحصائيات والتنبيهات

### 2. إدارة الخطط
- انتقل إلى `/capa-enhanced`
- إنشاء أو تعديل الخطط التصحيحية

### 3. التحليلات
- انتقل إلى `/analytics`
- عرض التحليلات المتقدمة والتنبؤات

### 4. التقارير
- انتقل إلى `/reports`
- إنشاء تقارير مخصصة

## الأمان

- مصادقة المستخدمين
- تفويض الصلاحيات
- تشفير البيانات الحساسة
- سجل العمليات

## الأداء

- فهرسة قاعدة البيانات
- ذاكرة مؤقتة للاستعلامات
- تحسين الاستعلامات
- ضغط البيانات

## الصيانة

- نسخ احتياطية منتظمة
- مراقبة الأداء
- تحديثات أمنية
- تنظيف البيانات القديمة

## الدعم

للحصول على الدعم الفني، يرجى التواصل مع فريق التطوير.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.
