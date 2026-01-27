import React, { useState, useEffect } from 'react'
import { Search, Edit, Trash2, UserPlus, Users, Shield, Mail, Phone, Building, UserCheck, Eye, Send, ToggleLeft, ToggleRight, X, Upload, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { useUsers } from '@/hooks/useUsers'
import { useToast } from '@/hooks/useToast'
import { UserCreateForm } from '@/lib/validations'
import { User } from '@/types'
import { ToastContainer } from '@/components/ui/toast'

const UsersManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState<User | null>(null)
  const { user: currentUser } = useAuth()
  const { users, loading, error, createUser, updateUser, deleteUser, fetchUsers, sendWelcomeEmail } = useUsers()
  const { toasts, success, error: showError, removeToast } = useToast()

  // Form state for creating/editing users
  const [formData, setFormData] = useState<UserCreateForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    department: '',
    phone: '',
    position: '',
    photo_url: ''
  })

  // Photo upload state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!showCreateForm) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        role: 'viewer',
        department: '',
        phone: '',
        position: '',
        photo_url: ''
      })
      setFormErrors({})
      setEditingUser(null)
      setPhotoPreview(null)
    }
  }, [showCreateForm])

  // Load user data for editing
  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        email: editingUser.email,
        password: '',
        confirmPassword: '',
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        role: editingUser.role,
        department: editingUser.department || '',
        phone: editingUser.phone || '',
        position: editingUser.position || '',
        photo_url: editingUser.photo_url || ''
      })
      setPhotoPreview(editingUser.photo_url || null)
    }
  }, [editingUser])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.username.trim()) {
      errors.username = 'اسم المستخدم مطلوب'
    } else if (formData.username.length < 3) {
      errors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
    } else {
      // Check if username is already used by another user
      const existingUser = users.find(user => 
        user.username.toLowerCase() === formData.username.toLowerCase() && 
        (!editingUser || user.id !== editingUser.id)
      )
      if (existingUser) {
        errors.username = 'اسم المستخدم مستخدم بالفعل'
      }
    }

    if (!formData.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح'
    } else {
      // Check if email is already used by another user
      const existingUser = users.find(user => 
        user.email.toLowerCase() === formData.email.toLowerCase() && 
        (!editingUser || user.id !== editingUser.id)
      )
      if (existingUser) {
        errors.email = 'البريد الإلكتروني مستخدم بالفعل من قبل مستخدم آخر'
      }
    }

    if (!formData.first_name.trim()) {
      errors.first_name = 'الاسم الأول مطلوب'
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'اسم العائلة مطلوب'
    }

    if (!editingUser && !formData.password) {
      errors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        position: formData.position,
        photo_url: photoPreview || formData.photo_url || null,
        ...(formData.password && { password: formData.password })
      }

      console.log('🔍 UserData being sent:', userData)
      console.log('🔍 PhotoPreview:', photoPreview)
      console.log('🔍 FormData.photo_url:', formData.photo_url)
      console.log('🔍 Editing user:', editingUser)

      if (editingUser) {
        console.log('🔄 Updating user with ID:', editingUser.id)
        const result = await updateUser(editingUser.id, userData)
        console.log('✅ Update result:', result)
        
        // Show success message
        success('تم تحديث المستخدم بنجاح!')
      } else {
        console.log('🆕 Creating new user')
        const result = await createUser(userData)
        console.log('✅ Create result:', result)
        
        // Show success message
        success('تم إنشاء المستخدم الجديد بنجاح!')
      }

      setShowCreateForm(false)
      setEditingUser(null)
      setFormErrors({}) // Clear all errors
    } catch (error: any) {
      console.error('❌ Error saving user:', error)
      
      // Handle specific error types
      let errorMessage = 'فشل في حفظ المستخدم'
      
      if (error.message) {
        if (error.message.includes('المستخدم موجود بالفعل') || 
            error.message.includes('already exists') ||
            error.message.includes('duplicate')) {
          errorMessage = 'البريد الإلكتروني مستخدم بالفعل من قبل مستخدم آخر'
          setFormErrors({ email: 'البريد الإلكتروني مستخدم بالفعل' })
        } else if (error.message.includes('username') && error.message.includes('already')) {
          errorMessage = 'اسم المستخدم مستخدم بالفعل'
          setFormErrors({ username: 'اسم المستخدم مستخدم بالفعل' })
        } else if (error.message.includes('email') && error.message.includes('invalid')) {
          errorMessage = 'البريد الإلكتروني غير صحيح'
          setFormErrors({ email: 'البريد الإلكتروني غير صحيح' })
        } else if (error.message.includes('password')) {
          errorMessage = 'كلمة المرور غير صحيحة'
          setFormErrors({ password: 'كلمة المرور غير صحيحة' })
        } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          errorMessage = 'خطأ في الاتصال بالخادم. تأكد من أن الخادم يعمل'
        } else if (error.message.includes('403')) {
          errorMessage = 'ليس لديك صلاحية لإنشاء أو تعديل المستخدمين'
        } else if (error.message.includes('401')) {
          errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
        } else {
          errorMessage = error.message
        }
      }
      
      setFormErrors({ submit: errorMessage })
      
      // Show error toast for better user experience
      showError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowCreateForm(true)
  }

  const handleDeleteUser = async (userId: number) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) return

    const confirmMessage = `هل أنت متأكد من حذف المستخدم "${userToDelete.first_name} ${userToDelete.last_name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بهذا المستخدم.`
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await deleteUser(userId)
        console.log('Delete response:', response)
        success('تم حذف المستخدم بنجاح')
      } catch (error: any) {
        console.error('Failed to delete user:', error)
        const errorMessage = error.message || 'فشل في حذف المستخدم'
        showError(`فشل في حذف المستخدم: ${errorMessage}`)
      }
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('حجم الملف يجب أن يكون أقل من 5 ميجابايت')
        return
      }
      if (!file.type.startsWith('image/')) {
        showError('يجب أن يكون الملف صورة')
        return
      }
      
      // Compress image before converting to base64
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions (max 300x300)
        const maxSize = 300
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8) // 80% quality
        
        setPhotoPreview(compressedDataUrl)
        console.log('📸 Image compressed:', {
          originalSize: file.size,
          compressedSize: compressedDataUrl.length,
          dimensions: `${width}x${height}`
        })
      }
      
      img.src = URL.createObjectURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoPreview(null)
  }

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId)
      if (user) {
        await updateUser(userId, { ...user, is_active: !user.is_active })
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const handleSendWelcomeEmail = async (userId: number) => {
    try {
      await sendWelcomeEmail(userId)
      success('تم إرسال الإيميل الترحيبي بنجاح')
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      showError('فشل في إرسال الإيميل الترحيبي')
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800',
      'quality_manager': 'bg-blue-100 text-blue-800',
      'department_head': 'bg-green-100 text-green-800',
      'assessor': 'bg-yellow-100 text-yellow-800',
      'viewer': 'bg-gray-100 text-gray-800',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRoleText = (role: string) => {
    const texts = {
      'super_admin': 'مدير عام',
      'quality_manager': 'مدير الجودة',
      'department_head': 'رئيس قسم',
      'assessor': 'مقيم',
      'viewer': 'مشاهد',
    }
    return texts[role as keyof typeof texts] || role
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">خطأ في تحميل المستخدمين: {error}</p>
          <Button onClick={fetchUsers}>إعادة المحاولة</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            إدارة المستخدمين
          </h1>
          <p className="text-gray-600 mt-2">إدارة المستخدمين وصلاحياتهم في النظام</p>
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'quality_manager') ? (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <strong>مدير النظام/مدير الجودة:</strong> لديك صلاحية حذف المستخدمين. كن حذراً عند استخدام هذه الميزة.
              </p>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <strong>ملاحظة:</strong> يمكنك عرض وتعديل المستخدمين، لكن حذف المستخدمين متاح لمدير النظام ومدير الجودة فقط.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'quality_manager') && (
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              إضافة مستخدم جديد
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نشط</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">غير نشط</p>
                <p className="text-3xl font-bold text-red-600">
                  {users.filter(u => !u.is_active).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الأدوار</p>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(users.map(u => u.role)).size}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                البحث
              </Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="البحث في الأسماء، البريد، القسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="role-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                الدور
              </Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأدوار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  <SelectItem value="super_admin">مدير عام</SelectItem>
                  <SelectItem value="quality_manager">مدير الجودة</SelectItem>
                  <SelectItem value="department_head">رئيس قسم</SelectItem>
                  <SelectItem value="assessor">مقيم</SelectItem>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:w-48">
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                الحالة
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.photo_url || ''} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.first_name[0]}{user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <Badge className={getRoleColor(user.role)}>
                  {getRoleText(user.role)}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {user.department && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4" />
                    <span>{user.department}</span>
                  </div>
                )}
                {user.position && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserCheck className="w-4 h-4" />
                    <span>{user.position}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserDetails(user)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleUserStatus(user.id)}
                  >
                    {user.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendWelcomeEmail(user.id)}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  {currentUser?.id !== user.id && (currentUser?.role === 'super_admin' || currentUser?.role === 'quality_manager') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="حذف المستخدم (مدير النظام ومدير الجودة فقط)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
          <p className="text-gray-500">لا توجد مستخدمين مطابقين لمعايير البحث</p>
        </div>
      )}

      {/* Create/Edit User Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-white border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 bg-white/20 rounded-lg">
                  <UserPlus className="w-6 h-6" />
                </div>
                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </DialogTitle>
              <DialogDescription className="text-blue-100 mt-2 text-lg">
                {editingUser ? 'قم بتعديل بيانات المستخدم' : 'قم بملء البيانات المطلوبة لإضافة مستخدم جديد'}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                الصورة الشخصية
              </Label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 ring-4 ring-blue-100 shadow-lg">
                    <AvatarImage src={photoPreview || ''} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                      {formData.first_name[0] || 'U'}{formData.last_name[0] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full p-0 shadow-lg hover:scale-110 transition-transform"
                      onClick={removePhoto}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-full transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors"
                      asChild
                    >
                      <span className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        اختر صورة شخصية
                      </span>
                    </Button>
                  </Label>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="font-medium text-blue-800 mb-1">متطلبات الصورة:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• JPG, PNG أو GIF</li>
                      <li>• الحد الأقصى 5 ميجابايت</li>
                      <li>• دقة عالية للحصول على أفضل جودة</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                <div className="p-1 bg-green-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                المعلومات الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="first_name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    الاسم الأول *
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="أدخل الاسم الأول"
                    className={`h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-green-300'
                    }`}
                  />
                  {formErrors.first_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {formErrors.first_name}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="last_name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    اسم العائلة *
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="أدخل اسم العائلة"
                    className={`h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-green-300'
                    }`}
                  />
                  {formErrors.last_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {formErrors.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                <div className="p-1 bg-purple-100 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                معلومات الاتصال
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    البريد الإلكتروني *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        const newEmail = e.target.value
                        setFormData({...formData, email: newEmail})
                        
                        // Clear email error when user starts typing
                        if (formErrors.email) {
                          setFormErrors(prev => ({ ...prev, email: '' }))
                        }
                        
                        // Real-time validation for email format
                        if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
                          setFormErrors(prev => ({ ...prev, email: 'البريد الإلكتروني غير صحيح' }))
                        }
                      }}
                      onBlur={() => {
                        // Check for duplicate email when user leaves the field
                        if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
                          const existingUser = users.find(user => 
                            user.email.toLowerCase() === formData.email.toLowerCase() && 
                            (!editingUser || user.id !== editingUser.id)
                          )
                          if (existingUser) {
                            setFormErrors(prev => ({ 
                              ...prev, 
                              email: 'البريد الإلكتروني مستخدم بالفعل من قبل مستخدم آخر' 
                            }))
                          }
                        }
                      }}
                      placeholder="example@hospital.com"
                      className={`h-12 text-base border-2 pr-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    رقم الهاتف
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+966 50 123 4567"
                      className="h-12 text-base border-2 pr-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border-gray-200 hover:border-purple-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                <div className="p-1 bg-orange-100 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                معلومات المصادقة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    اسم المستخدم *
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => {
                      const newUsername = e.target.value
                      setFormData({...formData, username: newUsername})
                      
                      // Clear username error when user starts typing
                      if (formErrors.username) {
                        setFormErrors(prev => ({ ...prev, username: '' }))
                      }
                    }}
                    onBlur={() => {
                      // Check for duplicate username when user leaves the field
                      if (formData.username && formData.username.length >= 3) {
                        const existingUser = users.find(user => 
                          user.username.toLowerCase() === formData.username.toLowerCase() && 
                          (!editingUser || user.id !== editingUser.id)
                        )
                        if (existingUser) {
                          setFormErrors(prev => ({ 
                            ...prev, 
                            username: 'اسم المستخدم مستخدم بالفعل' 
                          }))
                        }
                      }
                    }}
                    placeholder="أدخل اسم المستخدم"
                    className={`h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      formErrors.username ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-orange-300'
                    }`}
                  />
                  {formErrors.username && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {formErrors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    الدور *
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value as any})}>
                    <SelectTrigger className={`h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      formErrors.role ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-orange-300'
                    }`}>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-orange-200">
                      <SelectItem value="viewer" className="hover:bg-orange-50">مشاهد</SelectItem>
                      <SelectItem value="assessor" className="hover:bg-orange-50">مقيم</SelectItem>
                      <SelectItem value="department_head" className="hover:bg-orange-50">رئيس قسم</SelectItem>
                      <SelectItem value="quality_manager" className="hover:bg-orange-50">مدير الجودة</SelectItem>
                      <SelectItem value="super_admin" className="hover:bg-orange-50">مدير عام</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {formErrors.role}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                <div className="p-1 bg-red-100 rounded-lg">
                  <Key className="w-5 h-5 text-red-600" />
                </div>
                كلمات المرور
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {editingUser ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور *'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? 'أدخل كلمة المرور الجديدة' : 'أدخل كلمة المرور'}
                    className={`h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      formErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                    }`}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {formErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {editingUser ? 'تأكيد كلمة المرور الجديدة' : 'تأكيد كلمة المرور *'}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder={editingUser ? 'أكد كلمة المرور الجديدة' : 'أكد كلمة المرور'}
                    className={`h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      formErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                    }`}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Department and Position */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                <div className="p-1 bg-indigo-100 rounded-lg">
                  <Building className="w-5 h-5 text-indigo-600" />
                </div>
                المعلومات المهنية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="department" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    القسم
                  </Label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="أدخل اسم القسم"
                      className="h-12 text-base border-2 pr-12 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-200 hover:border-indigo-300"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="position" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    المنصب
                  </Label>
                  <div className="relative">
                    <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      placeholder="أدخل المنصب"
                      className="h-12 text-base border-2 pr-12 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-200 hover:border-indigo-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 flex items-center justify-center gap-2">
                  <X className="w-5 h-5" />
                  {formErrors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="px-8 py-3 h-12 text-base font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الحفظ...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      {editingUser ? 'تحديث المستخدم' : 'إضافة المستخدم'}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              تفاصيل المستخدم
            </DialogTitle>
          </DialogHeader>
          
          {showUserDetails && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={showUserDetails.photo_url || ''} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    {showUserDetails.first_name[0]}{showUserDetails.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {showUserDetails.first_name} {showUserDetails.last_name}
                  </h3>
                  <p className="text-gray-600">{showUserDetails.position}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(showUserDetails.role)}>
                    {getRoleText(showUserDetails.role)}
                  </Badge>
                  <Badge variant={showUserDetails.is_active ? "default" : "secondary"}>
                    {showUserDetails.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{showUserDetails.email}</span>
                  </div>
                  {showUserDetails.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{showUserDetails.phone}</span>
                    </div>
                  )}
                  {showUserDetails.department && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{showUserDetails.department}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default UsersManagement