# تحسين عملية الخطط التصحيحية (CAPA) — خطوات وأوامر جاهزة لـ Cursor AI

> وثيقة عملية خطوة‑بخطوة لبدء تنفيذ وتحسين نموذج الخطط التصحيحية داخل مشروع **نظام سلامتي**. تحتوي على أوامر (prompts) جاهزة للصق في دردشة Cursor AI، تغييرات قاعدة البيانات، واجهات برمجة التطبيقات، مكونات الواجهة، اختبارات، وأفضل الممارسات.

---

## 🎯 الهدف

تحسين دورة حياة الخطط التصحيحية (CAPA) لتكون آلية، قابلة للتتبع، قابلة للتحقق، وتدعم أدوار متعددة (إنشاء، متابعة، تنفيذ، تحقق، إغلاق، تصعيد).

---

## 📌 كيف تستخدم هذه الوثيقة
1. افتح مشروعك في Cursor AI.  
2. أنشئ فرع جديد: `git checkout -b feat/capa-improvements`  
3. انسخ كل prompt (الأمر) في القسم "أوامر Cursor AI جاهزة" إلى دردشة Cursor AI بالتسلسل.

---

## الخطة العامة (نظرة سريعة)
1. تصميم البيانات (تعديل نموذج CAPA + مهاجرتين لقاعدة البيانات).  
2. واجهات الـ API (CRUD + Verify + Audit).  
3. واجهة المستخدم (نموذج إنشاء/تعديل CAPA + لوحة متابعة).  
4. قواعد العمل الآلية (إنشاء تلقائي، تذكير، تصعيد).  
5. اختبارات (وحدات، تكامل، واجهة).  
6. CI/CD ونشر.

---

## ✳️ نموذج بيانات مقترح — تغييرات على **capas**

**إضافات للحقل (capas table)**
- `root_cause: TEXT`  
- `corrective_actions: JSONB` — قائمة إجراءات مع تواريخ ومرؤوسين وحالة كل إجراء.  
- `preventive_actions: JSONB`  
- `verification_steps: JSONB` — خطوات التحقق المطلوبة لإغلاق الخطة.  
- `verification_status: ENUM('pending','in_review','verified','rejected')`  
- `severity: SMALLINT` — 1 (منخفض) .. 5 (حرج)  
- `estimated_cost: NUMERIC`  
- `status_history: JSONB` — سجل الحركات (timestamp, user_id, from, to, note).  
- `sla_days: INT` — مهلة الحل المطلوبة.  
- `escalation_level: INT` — عدد مستويات التصعيد المطبقة.  
- `closed_at: TIMESTAMP NULLABLE`  
- `verified_at: TIMESTAMP NULLABLE`  

**مؤشرات وفهارس**
- فهرس على: `(department, status, severity)`  
- فهرس GIN على الحقول JSONB (e.g. `corrective_actions`) لتحسين الاستعلام.

---

## ✅ ملف مهاجرة Alembic — مثال (SQL)
```sql
-- alembic revision: add_capa_fields
ALTER TABLE capas
  ADD COLUMN root_cause TEXT,
  ADD COLUMN corrective_actions JSONB DEFAULT '[]',
  ADD COLUMN preventive_actions JSONB DEFAULT '[]',
  ADD COLUMN verification_steps JSONB DEFAULT '[]',
  ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN severity SMALLINT DEFAULT 3,
  ADD COLUMN estimated_cost NUMERIC,
  ADD COLUMN status_history JSONB DEFAULT '[]',
  ADD COLUMN sla_days INT DEFAULT 14,
  ADD COLUMN escalation_level INT DEFAULT 0,
  ADD COLUMN closed_at TIMESTAMP NULL,
  ADD COLUMN verified_at TIMESTAMP NULL;

CREATE INDEX ix_capa_department_status_severity ON capas(department, verification_status, severity);
CREATE INDEX ix_capa_corrective_actions_gin ON capas USING gin(corrective_actions);
```

---

## 🧠 منطق الخطة التصحيحية (Business rules)
- **إنشاء تلقائي**: إذا كانت نتيجة عنصر التقييم `non_compliant` و `risk_level >= 3` فقم بإنشاء CAPA تلقائيًا مع ملء `target_date = now() + sla_days` و `severity` بناءً على `risk_level`.
- **حالة الدورة**: `draft -> assigned -> in_progress -> pending_verification -> verified/closed`.
- **التحقق**: لا تُقفل الخطة إلا بعد إتمام كل `verification_steps` والـ verifier يقوم بتأكيد كل خطوة.
- **التصعيد**: إذا تجاوزت الخطة `target_date` أو `sla_days` بدون تحديث، التدرج الآلي إلى المدير الأعلى وإرسال إشعار.
- **تتبع التغييرات**: كل تغيير في CAPA يُسجل في `status_history` ويُدخل في `audit_logs`.

---

## 🔌 واجهات API مقترحة (FastAPI)

### Endpoints
- `POST /api/capas` — إنشاء خطة جديدة.  
- `GET /api/capas/{id}` — جلب خطة واحد.  
- `PATCH /api/capas/{id}` — تعديل (حالة، إجراءات، خطوات التحقق).  
- `POST /api/capas/{id}/verify` — عملية تحقق (مع body يشرح الخطوات المكتملة).  
- `GET /api/capas?department=&status=&severity=` — فلترة.

### مثال جسم الطلب — إنشاء
```json
{
  "title": "تسرب دواء في مخزن الصيدلية",
  "description": "وصف المشكلة...",
  "round_id": 123,
  "department": "Pharmacy",
  "assigned_to_id": 45,
  "severity": 4,
  "estimated_cost": 1200.00,
  "corrective_actions": [{"task":"تحقق من حاويات التخزين","due_date":"2025-10-01","assigned_to_id":45}],
  "verification_steps": [{"step":"مراجعة سجلات الحرارة","required":true},{"step":"تأكيد تدريب الموظف","required":false}]
}
```

---

## 🧩 مثال كود FastAPI (Router مختصر)
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/capas")

class Action(BaseModel):
    task: str
    due_date: Optional[datetime]
    assigned_to_id: Optional[int]
    status: Optional[str] = "open"

class CAPACreate(BaseModel):
    title: str
    description: Optional[str]
    round_id: Optional[int]
    department: str
    assigned_to_id: Optional[int]
    severity: int = Field(ge=1, le=5)
    estimated_cost: Optional[float]
    corrective_actions: List[Action] = []
    verification_steps: List[dict] = []

@router.post("/")
async def create_capa(payload: CAPACreate, user=Depends(get_current_user)):
    # تحقق من الصلاحيات
    # أنشئ السجل في DB
    # أضف سجل في audit_logs
    # أرسل إشعار للمكلف
    return {"status":"ok","capa_id": 123}
```

---

## 🖥️ الواجهة (React) — نموذج CAPA مع React Hook Form + Zod (مختصر)

```tsx
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  title: z.string().min(5),
  department: z.string().min(1),
  severity: z.number().min(1).max(5),
  corrective_actions: z.array(z.object({ task: z.string().min(3), due_date: z.string().optional() }))
})

export default function CapaForm({ defaultValues, onSubmit }){
  const { control, handleSubmit, register } = useForm({ resolver: zodResolver(schema), defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} placeholder="عنوان الخطة" />
      <input {...register('department')} placeholder="القسم" />
      <input type="number" {...register('severity')} placeholder="شِدّة" />
      {/* مكون لإدارة corrective_actions */}
      <button type="submit">حفظ</button>
    </form>
  )
}
```

---

## ⚙️ قواعد أتمتة (Automation) — أمثلة جاهزة
1. **إنشاء CAPA تلقائي** (Server-side hook عند تسجيل نتيجة تقييم):
   - شرط: `result == 'non_compliant' AND risk_level >= 3`  
   - إجراء: استدعاء `POST /api/capas` مع ملء الحقول الأساسية.

2. **تذكير تلقائي**: مهمة مجدولة تعمل يوميًا تفحص `capas` حيث `verification_status != 'verified' AND now() > target_date - 2` ثم ترسل إشعارًا.

3. **تصعيد تلقائي**: إذا `now() > target_date + escalation_threshold` قم بزيادة `escalation_level` وأرسل رسالة للمدير.

---

## ✅ اختبارات مقترحة
- **Backend**: pytest للاختبارات التالية: إنشاء CAPA، تحديث الإجراءات، عملية التحقق، قواعد التصعيد.
- **Frontend**: اختبار وحدة لمكون النموذج (React Testing Library).  
- **E2E**: سيناريو كامل (إنشاء → أداء الإجراءات → تحقق → غلق).

---

## 📋 أوامر Cursor AI جاهزة — الصق هذه الأوامر بالترتيب في دردشة Cursor AI

### المرحلة A — التحضير والفرع
1. **افتح الفرع الجديد** (قم محليًا):
```
git checkout -b feat/capa-improvements
```
2. **Prompt in Cursor AI:**
```
Project: Salamaty. I want to improve the CAPA (corrective action plan) data model and lifecycle. Suggest a minimal DB schema diff (Postgres SQL) to add root_cause, corrective_actions (JSONB), verification_steps, verification_status, severity, sla_days, status_history and indexes. Provide the Alembic migration SQL only.
```
(نتيجة متوقعة: ملف مهاجرة SQL كما في قسم المهاجرة أعلاه)


### المرحلة B — Backend endpoints & logic
3. **Prompt in Cursor AI:**
```
Based on the new DB fields, generate a FastAPI router with endpoints: POST /api/capas, GET /api/capas/{id}, PATCH /api/capas/{id}, POST /api/capas/{id}/verify. Include Pydantic models, permission checks (quality_manager or super_admin can create), audit log insertion, and events for notifications. Return code only.
```

4. **Prompt in Cursor AI (business rules):**
```
Write Python functions for: auto_create_capa_on_noncompliant(result_record), check_and_escalate_overdue_capas(), and update_status_history(capa_id, user_id, from_status, to_status, note). Use SQLAlchemy session examples. Return code only.
```


### المرحلة C — Frontend forms & UI
5. **Prompt in Cursor AI:**
```
Create a React TypeScript component (default export) named CapaForm using React Hook Form and Zod. It should support adding/removing corrective actions, validation, and submitting to POST /api/capas. Use Tailwind classes and follow RTL. Return full component file code.
```

6. **Prompt in Cursor AI:**
```
Create a dashboard React component that lists CAPAs with filters (status, severity, department) and shows progress bar per CAPA (based on completed corrective_actions). Use Recharts to display severity distribution chart. Return code only.
```


### المرحلة D — Automations & Cron jobs
7. **Prompt in Cursor AI:**
```
Provide a Python script (or FastAPI background task) named kapa_scheduler.py that: 1) runs daily, 2) finds overdue CAPAs, 3) increments escalation_level, 4) sends email notifications via a send_email(user_email, subject, body) function, and 5) updates audit_logs. Use SQLAlchemy pseudo code. Return code only.
```


### المرحلة E — Tests & CI
8. **Prompt in Cursor AI:**
```
Generate pytest unit tests for the CAPA router: test_create_capa, test_update_capa_actions, test_verify_capa. Use TestClient from fastapi.testclient and a sqlite in-memory DB fixture. Return test files.
```

9. **Prompt in Cursor AI:**
```
Write a GitHub Actions workflow file .github/workflows/ci.yml that runs: lint (flake8), tests (pytest), and builds frontend (npm ci && npm run build). Use matrix for python versions [3.8,3.10]. Return YAML file.
```


### المرحلة F — Documentation & release
10. **Prompt in Cursor AI:**
```
Create a Markdown release note titled 'CAPA improvements v1.1' summarizing DB changes, API changes, UI changes, automation, and migration instructions for operators. Include migration command examples. Return markdown.
```

---

## 🧾 مقترحات لرسائل الالتزام وأسماء الفروع
- فرع العمل: `feat/capa-improvements`  
- Commit messages:
  - `feat(capa): add verification_steps and corrective_actions to capas table`
  - `feat(api): add CAPA CRUD and verify endpoints`
  - `feat(ui): add CapaForm and CapaDashboard components`
  - `test(ci): add unit and e2e tests for CAPA flow`

---

## 📌 ملاحظات تنفيذية سريعة
- ابدأ بالمهاجرة وقاعدة البيانات أولًا، ثم الـ API ثم الواجهة—هذا يقلل من التعارضات.  
- أضف Feature Flag لتفعيل الـ automation الآلي تدريجيًا.  
- وثق كل نموذج (Pydantic) وواجهات API في Swagger.  
- ضع طرق استرجاع (backfill) لأي CAPAs القديمة التي تحتاج إلى الحقول الجديدة.

---

## 🚀 الخطوة التالية (مباشر)
نسخ الـ prompts من قسم **أوامر Cursor AI جاهزة** والصقها في دردشة Cursor AI بالتسلسل بدءًا من المرحلة A. لكل نتيجة يجلبها Cursor AI: راجع رمز المهاجرة ثم نفّذه محليًا، وشغّل الاختبارات، ثم انتقل للخطوة التالية.

---

إذا رغبت، أستطيع الآن:
- توليد ملف Alembic migration مفصّل (Python) جاهز للصق في مشروعك.  
- أو إنشاء مكوّن React CapaForm كامل (ملف واحد).  

اختر أحد الخيارات التالية بذكر رقمها: 1) توليد مهاجرة Alembic كاملة، 2) توليد ملف React CapaForm كامل، 3) كلاهما الآن.

