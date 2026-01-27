import React from 'react'
import PageWrapper from './PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { useLayout } from '@/context/LayoutContext'

const LayoutTestPage: React.FC = () => {
  const { headerHeight, sidebarWidth, isSidebarCollapsed, isMobile } = useLayout()
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getDeviceType = () => {
    if (windowSize.width < 768) return { type: 'Mobile', icon: Smartphone, color: 'text-blue-600' }
    if (windowSize.width < 1024) return { type: 'Tablet', icon: Tablet, color: 'text-green-600' }
    return { type: 'Desktop', icon: Monitor, color: 'text-purple-600' }
  }

  const device = getDeviceType()
  const DeviceIcon = device.icon

  return (
    <PageWrapper 
      title="اختبار التخطيط الديناميكي" 
      description="صفحة اختبار للتحقق من التخطيط المتجاوب بين الشريط الجانبي والرأس"
    >
      <div className="space-y-6">
        {/* Device Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DeviceIcon className={`w-5 h-5 ${device.color}`} />
              معلومات الجهاز الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">نوع الجهاز</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{device.type}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">العرض</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{windowSize.width}px</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">الارتفاع</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{windowSize.height}px</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">ارتفاع الرأس</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{headerHeight}px</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>اختبار الشريط الجانبي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                جرب تغيير حجم النافذة أو النقر على زر طي الشريط الجانبي لرؤية التغييرات الديناميكية.
              </p>
              <div className="space-y-2">
                <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded"></div>
                <div className="h-2 bg-green-200 dark:bg-green-800 rounded w-3/4"></div>
                <div className="h-2 bg-purple-200 dark:bg-purple-800 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اختبار الاستجابة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                يجب أن تتكيف هذه البطاقات مع حجم الشاشة تلقائياً.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                  متجاوب
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                  ديناميكي
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                  سلس
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اختبار المحتوى</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                المحتوى يجب أن يملأ المساحة المتاحة بين الرأس والشريط الجانبي.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                زر اختبار
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Layout Status */}
        <Card>
          <CardHeader>
            <CardTitle>حالة التخطيط الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">عرض الشريط الجانبي:</span>
                  <span className="font-semibold">{sidebarWidth}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">حالة الشريط الجانبي:</span>
                  <span className={`font-semibold ${isSidebarCollapsed ? 'text-orange-600' : 'text-green-600'}`}>
                    {isSidebarCollapsed ? 'مطوي' : 'مفتوح'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">الوضع المحمول:</span>
                  <span className={`font-semibold ${isMobile ? 'text-blue-600' : 'text-gray-600'}`}>
                    {isMobile ? 'نعم' : 'لا'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ارتفاع الرأس:</span>
                  <span className="font-semibold">{headerHeight}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">المساحة المتاحة:</span>
                  <span className="font-semibold">{windowSize.height - headerHeight}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">عرض المحتوى:</span>
                  <span className="font-semibold">{windowSize.width - (isMobile ? 0 : sidebarWidth)}px</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>تعليمات الاختبار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>1. جرب تغيير حجم نافذة المتصفح لرؤية التكيف مع أحجام الشاشات المختلفة</p>
              <p>2. انقر على زر طي الشريط الجانبي لرؤية التغيير في عرض المحتوى</p>
              <p>3. تحقق من أن المحتوى يملأ المساحة المتاحة بشكل صحيح</p>
              <p>4. تأكد من أن التخطيط يعمل بشكل صحيح على الأجهزة المحمولة</p>
              <p>5. لاحظ كيف يتغير ارتفاع الرأس تلقائياً مع تغيير المحتوى</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}

export default LayoutTestPage
