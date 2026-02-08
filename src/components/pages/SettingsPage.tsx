import React, { useState, useEffect } from 'react'
import { Save, User, Bell, Shield, Globe, Database, Download, Upload, Trash2, Plus, Edit, Settings2, CheckCircle, Target, Link, X, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/AuthContext'
import { useEvaluationSettings } from '@/hooks/useEvaluationSettings'
import { useNotificationSettings } from '@/hooks/useNotificationSettings'
import RoundTypesSettingsPage from './RoundTypesSettingsPage'

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const {
    settings: evaluationSettings,
    isLoading: evaluationLoading,
    addObjectiveOption,
    updateObjectiveOption,
    deleteObjectiveOption,
    saveSettings: saveEvaluationSettings,
  } = useEvaluationSettings()

  const {
    settings: notificationSettings,
    isLoading: notificationLoading,
    saveSettings: saveNotificationSettings,
  } = useNotificationSettings()

  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || '',
    department: user?.department || '',
  })

  const [localNotificationSettings, setLocalNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    round_assignments: true,
    round_reminders: true,
    round_deadlines: true,
    capa_assignments: true,
    capa_deadlines: true,
    system_updates: false,
    weekly_reports: true,
  })

  const [systemSettings, setSystemSettings] = useState({
    language: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h',
    autoSave: true,
    darkMode: false,
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAlerts: true,
  })

  const [newObjectiveName, setNewObjectiveName] = useState('')
  const [newObjectiveDescription, setNewObjectiveDescription] = useState('')

  // Sync local notification settings with API settings
  useEffect(() => {
    if (notificationSettings) {
      setLocalNotificationSettings({
        email_notifications: notificationSettings.email_notifications,
        sms_notifications: notificationSettings.sms_notifications,
        round_assignments: notificationSettings.round_assignments,
        round_reminders: notificationSettings.round_reminders,
        round_deadlines: notificationSettings.round_deadlines,
        capa_assignments: notificationSettings.capa_assignments,
        capa_deadlines: notificationSettings.capa_deadlines,
        system_updates: notificationSettings.system_updates,
        weekly_reports: notificationSettings.weekly_reports,
      })
    }
  }, [notificationSettings])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      console.log('Saving profile:', profileSettings)
      // Here you would call the API to save profile settings
      setTimeout(() => {
        setIsLoading(false)
        alert('تم حفظ الإعدادات بنجاح')
      }, 1000)
    } catch (error) {
      console.error('Failed to save profile:', error)
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      await saveNotificationSettings(localNotificationSettings)
      alert('تم حفظ إعدادات الإشعارات بنجاح')
    } catch (error) {
      console.error('Failed to save notifications:', error)
      alert('فشل في حفظ إعدادات الإشعارات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSystem = async () => {
    setIsLoading(true)
    try {
      console.log('Saving system settings:', systemSettings)
      // Here you would call the API to save system settings
      setTimeout(() => {
        setIsLoading(false)
        alert('تم حفظ إعدادات النظام بنجاح')
      }, 1000)
    } catch (error) {
      console.error('Failed to save system settings:', error)
      setIsLoading(false)
    }
  }

  const handleSaveSecurity = async () => {
    setIsLoading(true)
    try {
      console.log('Saving security settings:', securitySettings)
      // Here you would call the API to save security settings
      setTimeout(() => {
        setIsLoading(false)
        alert('تم حفظ إعدادات الأمان بنجاح')
      }, 1000)
    } catch (error) {
      console.error('Failed to save security settings:', error)
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    console.log('Exporting data...')
    // Here you would implement data export
  }

  const handleImportData = () => {
    console.log('Importing data...')
    // Here you would implement data import
  }

  const handleSaveEvaluationSettings = async () => {
    const success = await saveEvaluationSettings()
    if (success) {
      alert('تم حفظ إعدادات عناصر التقييم بنجاح')
    } else {
      alert('فشل في حفظ إعدادات عناصر التقييم')
    }
  }

  const handleAddObjective = async () => {
    if (!newObjectiveName.trim()) {
      alert('يرجى إدخال اسم الخيار')
      return
    }

    try {
      await addObjectiveOption({
        name: newObjectiveName,
        description: newObjectiveDescription,
        is_active: true,
      })

      setNewObjectiveName('')
      setNewObjectiveDescription('')
      alert('تم إضافة الخيار بنجاح')
    } catch (error) {
      alert('فشل في إضافة الخيار')
    }
  }

  const handleEditObjective = async (id: number, field: string, value: string) => {
    try {
      await updateObjectiveOption(id, { [field]: value })
    } catch (error) {
      alert('فشل في تحديث الخيار')
    }
  }

  const handleToggleObjective = async (id: number) => {
    const options = Array.isArray(evaluationSettings?.objectiveOptions) ? evaluationSettings.objectiveOptions : []
    const option = options.find(o => o.id === id)
    if (option) {
      try {
        await updateObjectiveOption(id, { is_active: !option.is_active })
      } catch (error) {
        alert('فشل في تحديث حالة الخيار')
      }
    }
  }

  const handleDeleteObjective = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الخيار؟')) {
      try {
        await deleteObjectiveOption(id)
        alert('تم حذف الخيار بنجاح')
      } catch (error) {
        alert('فشل في حذف الخيار')
      }
    }
  }

  const tabs = [
    { id: 'profile', name: 'الملف الشخصي', icon: User },
    { id: 'notifications', name: 'الإشعارات', icon: Bell },
    { id: 'system', name: 'النظام', icon: Globe },
    { id: 'security', name: 'الأمان', icon: Shield },
    { id: 'evaluation', name: 'عناصر التقييم', icon: Target },
    { id: 'round-types', name: 'أنواع الجولات', icon: Tag },
    { id: 'data', name: 'البيانات', icon: Database },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          الإعدادات
        </h1>
        <p className="text-gray-600">إدارة إعدادات النظام والملف الشخصي</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  الملف الشخصي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الأول *
                    </label>
                    <Input
                      value={profileSettings.firstName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="أدخل الاسم الأول"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الأخير *
                    </label>
                    <Input
                      value={profileSettings.lastName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="أدخل الاسم الأخير"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني *
                    </label>
                    <Input
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="أدخل البريد الإلكتروني"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <Input
                      value={profileSettings.phone}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="أدخل رقم الهاتف"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المنصب
                    </label>
                    <Input
                      value={profileSettings.position}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="أدخل المنصب"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      القسم
                    </label>
                    <Input
                      value={profileSettings.department}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="أدخل القسم"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">الإشعارات عبر البريد الإلكتروني</p>
                      <p className="text-sm text-gray-600">تلقي إشعارات مهمة عبر البريد الإلكتروني</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.email_notifications}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, email_notifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">الإشعارات عبر الرسائل النصية</p>
                      <p className="text-sm text-gray-600">تلقي إشعارات عاجلة عبر الرسائل النصية</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.sms_notifications}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, sms_notifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">تعيين الجولات</p>
                      <p className="text-sm text-gray-600">إشعار عند تعيين جولة جديدة لك</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.round_assignments}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, round_assignments: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">تذكيرات الجولات</p>
                      <p className="text-sm text-gray-600">تذكير قبل موعد الجولات المكلف بها</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.round_reminders}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, round_reminders: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">مواعيد الجولات</p>
                      <p className="text-sm text-gray-600">تذكير بمواعيد انتهاء الجولات</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.round_deadlines}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, round_deadlines: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">تعيين الخطط التصحيحية</p>
                      <p className="text-sm text-gray-600">إشعار عند تعيين خطة تصحيحية جديدة لك</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.capa_assignments}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, capa_assignments: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">مواعيد الخطط التصحيحية</p>
                      <p className="text-sm text-gray-600">تذكير بمواعيد انتهاء الخطط التصحيحية</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.capa_deadlines}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, capa_deadlines: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">تحديثات النظام</p>
                      <p className="text-sm text-gray-600">إشعارات حول تحديثات النظام الجديدة</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.system_updates}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, system_updates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">التقارير الأسبوعية</p>
                      <p className="text-sm text-gray-600">تلقي تقرير أسبوعي عن الأداء</p>
                    </div>
                    <Switch
                      checked={localNotificationSettings.weekly_reports}
                      onCheckedChange={(checked) => setLocalNotificationSettings(prev => ({ ...prev, weekly_reports: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  إعدادات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اللغة
                    </label>
                    <select
                      value={systemSettings.language}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المنطقة الزمنية
                    </label>
                    <select
                      value={systemSettings.timezone}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                      <option value="Asia/Dubai">دبي (GMT+4)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تنسيق التاريخ
                    </label>
                    <select
                      value={systemSettings.dateFormat}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dd/mm/yyyy">يوم/شهر/سنة</option>
                      <option value="mm/dd/yyyy">شهر/يوم/سنة</option>
                      <option value="yyyy-mm-dd">سنة-شهر-يوم</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تنسيق الوقت
                    </label>
                    <select
                      value={systemSettings.timeFormat}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, timeFormat: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="24h">24 ساعة</option>
                      <option value="12h">12 ساعة</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">الحفظ التلقائي</p>
                      <p className="text-sm text-gray-600">حفظ التغييرات تلقائياً أثناء العمل</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoSave}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoSave: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">الوضع المظلم</p>
                      <p className="text-sm text-gray-600">استخدام الواجهة المظلمة</p>
                    </div>
                    <Switch
                      checked={systemSettings.darkMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, darkMode: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSystem} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  إعدادات الأمان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">المصادقة الثنائية</p>
                      <p className="text-sm text-gray-600">إضافة طبقة حماية إضافية لحسابك</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">تنبيهات تسجيل الدخول</p>
                      <p className="text-sm text-gray-600">تلقي إشعارات عند تسجيل الدخول من أجهزة جديدة</p>
                    </div>
                    <Switch
                      checked={securitySettings.loginAlerts}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginAlerts: checked }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      انتهاء الجلسة (دقيقة)
                    </label>
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      انتهاء كلمة المرور (يوم)
                    </label>
                    <Input
                      type="number"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
                      placeholder="90"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSecurity} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evaluation Settings */}
          {activeTab === 'evaluation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  إعدادات عناصر التقييم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Objective */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">إضافة خيار ارتباط جديد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم الخيار *
                      </label>
                      <Input
                        value={newObjectiveName}
                        onChange={(e) => setNewObjectiveName(e.target.value)}
                        placeholder="أدخل اسم الخيار"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الوصف
                      </label>
                      <Input
                        value={newObjectiveDescription}
                        onChange={(e) => setNewObjectiveDescription(e.target.value)}
                        placeholder="أدخل وصف الخيار"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={handleAddObjective} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      إضافة الخيار
                    </Button>
                  </div>
                </div>

                {/* Existing Objectives */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">خيارات ارتباط العنصر الحالية</h3>
                  <div className="space-y-3">
                    {(Array.isArray(evaluationSettings?.objectiveOptions) ? evaluationSettings.objectiveOptions : []).map((option) => (
                      <div key={option.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              اسم الخيار
                            </label>
                            <Input
                              value={option.name}
                              onChange={(e) => handleEditObjective(option.id, 'name', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الوصف
                            </label>
                            <Input
                              value={option.description}
                              onChange={(e) => handleEditObjective(option.id, 'description', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={option.is_active}
                            onCheckedChange={() => handleToggleObjective(option.id)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteObjective(option.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveEvaluationSettings} disabled={evaluationLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {evaluationLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Round Types Settings */}
          {activeTab === 'round-types' && (
            <RoundTypesSettingsPage />
          )}

          {/* Data Management */}
          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  إدارة البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="flex items-center gap-2 h-20"
                  >
                    <Download className="w-6 h-6" />
                    <div className="text-right">
                      <p className="font-medium">تصدير البيانات</p>
                      <p className="text-sm text-gray-600">تصدير جميع البيانات</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleImportData}
                    className="flex items-center gap-2 h-20"
                  >
                    <Upload className="w-6 h-6" />
                    <div className="text-right">
                      <p className="font-medium">استيراد البيانات</p>
                      <p className="text-sm text-gray-600">استيراد بيانات من ملف</p>
                    </div>
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">إحصائيات البيانات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">156</p>
                      <p className="text-sm text-gray-600">إجمالي الجولات</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">23</p>
                      <p className="text-sm text-gray-600">الخطط التصحيحية</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">5</p>
                      <p className="text-sm text-gray-600">المستخدمين</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
