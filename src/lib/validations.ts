import { z } from "zod"

// User validation schemas
export const userCreateSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional(),
  confirmPassword: z.string().optional(),
  first_name: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  last_name: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
  role: z.enum(["super_admin", "quality_manager", "department_head", "assessor", "viewer"]),
  department: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  photo_url: z.string().optional(),
}).refine((data) => {
  // Only validate password match if password is provided
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword
  }
  return true
}, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
})

export const userLoginSchema = z.object({
  // Allow either username or email (backend supports both)
  email: z.string().min(1, "اسم المستخدم أو البريد الإلكتروني مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
})

// Round validation schemas
export const roundCreateSchema = z.object({
  roundCode: z.string().optional(), // Auto-generated, not required in form
  title: z.string().min(5, "عنوان الجولة يجب أن يكون 5 أحرف على الأقل"),
  description: z.string().optional(),
  roundType: z.enum([
    "patient_safety", 
    "infection_control", 
    "hygiene", 
    "medication_safety", 
    "equipment_safety", 
    "environmental", 
    "general"
  ]),
  department: z.string().min(1, "القسم مطلوب"),
  assignedTo: z.array(z.number()).min(1, "يجب تحديد مسؤول واحد على الأقل"), // Changed to array of user IDs
  scheduledDate: z.date({
    required_error: "تاريخ الجولة مطلوب",
  }),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().optional(),
  evaluationItems: z.array(z.number()).optional(), // Array of evaluation item IDs
})

// CAPA validation schemas
export const capaCreateSchema = z.object({
  title: z.string().min(5, "عنوان الخطة يجب أن يكون 5 أحرف على الأقل"),
  description: z.string().min(10, "وصف الخطة يجب أن يكون 10 أحرف على الأقل"),
  rootCauseAnalysis: z.string().optional(),
  contributingFactors: z.array(z.string()).optional(),
  actions: z.array(z.object({
    action: z.string().min(1, "الإجراء مطلوب"),
    responsible: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    resources: z.string().optional(),
  })).optional(),
  // Additional fields that might be needed
  priority: z.enum(["low", "medium", "high"]).optional(),
  targetDate: z.date().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
})

// Department validation schemas
export const departmentCreateSchema = z.object({
  name: z.string().min(2, "اسم القسم يجب أن يكون حرفين على الأقل"),
  nameEn: z.string().optional(),
  code: z.string().min(2, "رمز القسم يجب أن يكون حرفين على الأقل"),
  floor: z.enum(["الارضي", "الاول", "الثاني"], {
    errorMap: () => ({ message: "يجب اختيار طابق صحيح" })
  }),
  building: z.enum([
    "العيادات", 
    "التنويم", 
    "الادارة", 
    "الكلية", 
    "العلاج الطبيعي", 
    "الخدمات", 
    "المستودعات", 
    "السكن"
  ], {
    errorMap: () => ({ message: "يجب اختيار مبنى صحيح" })
  }),
})

// Types
export type UserCreateForm = z.infer<typeof userCreateSchema>
export type UserLoginForm = z.infer<typeof userLoginSchema>
export type RoundCreateForm = z.infer<typeof roundCreateSchema>
export type CapaCreateForm = z.infer<typeof capaCreateSchema>
export type DepartmentCreateForm = z.infer<typeof departmentCreateSchema>
