import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  HelpCircle,
  Menu,
  Target,
  Trophy,
  ArrowRightLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLayout } from '@/context/LayoutContext'
import { isCapaEnabled } from '@/lib/features'

interface AnimatedSidebarProps {
  onLogout: () => void
}

const AnimatedSidebar: React.FC<AnimatedSidebarProps> = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Sync with layout context
  useEffect(() => {
    setIsCollapsed(isSidebarCollapsed)
  }, [isSidebarCollapsed])

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
        setIsMobileOpen(false)
        setIsSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIsSidebarCollapsed])

  // Listen for mobile menu toggle from Header
  useEffect(() => {
    const handleMobileToggle = () => {
      if (window.innerWidth < 1024) {
        setIsMobileOpen(prev => !prev)
      }
    }

    window.addEventListener("toggle-mobile-sidebar", handleMobileToggle)
    return () => window.removeEventListener("toggle-mobile-sidebar", handleMobileToggle)
  }, [])

  const menuItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badge: null,
      color: 'text-blue-600',
      path: '/'
    },
    {
      id: 'rounds',
      label: 'إدارة الجولات',
      icon: FileText,
      badge: null,
      color: 'text-green-600',
      path: '/rounds'
    },
    {
      id: 'capa-dashboard',
      label: 'داشبورد الخطط',
      icon: BarChart3,
      badge: null,
      color: 'text-blue-600',
      path: '/capa-dashboard'
    },
    {
      id: 'departments',
      label: 'الأقسام',
      icon: Building2,
      badge: null,
      color: 'text-cyan-600',
      path: '/departments'
    },
    {
      id: 'users',
      label: 'المستخدمين',
      icon: Users,
      badge: null,
      color: 'text-pink-600',
      path: '/users'
    },
    {
      id: 'templates',
      label: 'القوالب',
      icon: FileText,
      badge: null,
      color: 'text-emerald-600',
      path: '/templates'
    },
    {
      id: 'evaluation',
      label: 'لوحة التقييمات',
      icon: Target,
      badge: null,
      color: 'text-blue-600',
      path: '/evaluation'
    },
    {
      id: 'category-mapping',
      label: 'ربط التصنيفات',
      icon: ArrowRightLeft,
      badge: null,
      color: 'text-orange-600',
      path: '/category-mapping'
    },
    {
      id: 'gamified-system',
      label: 'النظام التفاعلي',
      icon: Trophy,
      badge: null,
      color: 'text-yellow-600',
      path: '/gamified-system'
    }
  ]

  const visibleMenuItems = menuItems.filter(item => {
    if (item.id === 'capa-dashboard' && !isCapaEnabled()) return false
    return true
  })

  const bottomItems = [
    {
      id: 'notifications',
      label: 'الإشعارات',
      icon: Bell,
      badge: null,
      color: 'text-yellow-600',
      path: '/notifications'
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: Settings,
      badge: null,
      color: 'text-gray-600',
      path: '/settings'
    },
    {
      id: 'help',
      label: 'المساعدة',
      icon: HelpCircle,
      badge: null,
      color: 'text-gray-600',
      path: '/help'
    }
  ]

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    setIsSidebarCollapsed(newCollapsedState)

    // Store state in localStorage
    localStorage.setItem('sidebar-collapsed', newCollapsedState.toString())

    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('sidebar-toggle', {
      detail: { collapsed: newCollapsedState }
    }))

    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen)
    }
  }

  const handleItemClick = (path: string) => {
    navigate(path)
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false)
    }
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-screen bg-slate-900 shadow-2xl transition-all duration-300 ease-in-out flex flex-col z-40",
        "border-l border-slate-700 backdrop-blur-sm",
        "shadow-slate-900/50",
        (isCollapsed && !isMobileOpen) ? "w-16" : "w-72",
        // Mobile: overlay behavior
        isMobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white drop-shadow-lg shadow-blue-500/50">نظام سلامتي</h1>
                <p className="text-xs text-slate-300 drop-shadow-md">إدارة الجودة وسلامة المرضى</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              const isHovered = hoveredItem === item.id

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => handleItemClick(item.path)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                      "hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/10",
                      active && "bg-gradient-to-r from-blue-900/30 to-purple-900/30 shadow-lg shadow-blue-500/20",
                      "text-slate-300 hover:text-white"
                    )}
                  >
                    {/* Active indicator */}
                    {active && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-l-full shadow-lg shadow-blue-400/50" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-5 h-5 transition-all duration-200",
                      active ? "text-blue-400 drop-shadow-lg shadow-blue-400/50" : "text-slate-400",
                      isHovered && !active && "text-blue-300 drop-shadow-md"
                    )}>
                      <Icon className="w-full h-full" />
                    </div>

                    {/* Label and Badge */}
                    {(!isCollapsed || isMobileOpen) && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className={cn(
                          "text-sm font-medium truncate transition-all duration-200",
                          active ? "text-white drop-shadow-lg shadow-blue-400/50" : "text-slate-300",
                          isHovered && !active && "text-white drop-shadow-md"
                        )}>
                          {item.label}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && !isMobileOpen && (
                      <div className={cn(
                        "absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 pointer-events-none transition-opacity duration-200 shadow-lg shadow-blue-500/20",
                        isHovered && "opacity-100"
                      )}>
                        {item.label}
                      </div>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Divider */}
          <div className="mx-3 my-4 h-px bg-slate-700" />

          {/* Bottom Items */}
          <div className="px-3 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              const isHovered = hoveredItem === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.path)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                    "hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/10",
                    active && "bg-gradient-to-r from-blue-900/30 to-purple-900/30 shadow-lg shadow-blue-500/20"
                  )}
                >
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-l-full shadow-lg shadow-blue-400/50" />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-5 h-5 transition-all duration-200",
                    active ? "text-blue-400 drop-shadow-lg shadow-blue-400/50" : "text-slate-400",
                    isHovered && !active && "text-blue-300 drop-shadow-md"
                  )}>
                    <Icon className="w-full h-full" />
                  </div>

                  {/* Label and Badge */}
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className={cn(
                        "text-sm font-medium truncate transition-all duration-200",
                        active ? "text-white drop-shadow-lg shadow-blue-400/50" : "text-slate-300",
                        isHovered && !active && "text-white drop-shadow-md"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobileOpen && (
                    <div className={cn(
                      "absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 pointer-events-none transition-opacity duration-200 shadow-lg shadow-blue-500/20",
                      isHovered && "opacity-100"
                    )}>
                      {item.label}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 mt-auto">
          {/* Footer content removed for clarity */}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-slate-800 text-white shadow-lg hover:bg-slate-700"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </>
  )
}

export default AnimatedSidebar
