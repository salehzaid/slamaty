import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  User,
  Building2, 
  BarChart3, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Target,
  Zap,
  Trophy,
  ChevronDown,
  Folder,
  Link2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useLayout } from '@/context/LayoutContext'

interface AnimatedSidebarProps {
  onLogout: () => void
}

const AnimatedSidebar: React.FC<AnimatedSidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isSidebarCollapsed, setIsSidebarCollapsed, isMobile } = useLayout()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['unified-evaluation']))

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
      hasSubmenu: true,
      path: '/rounds',
      submenu: [
        {
          id: 'rounds-list',
          label: 'عرض الجولات',
          icon: BarChart3,
          color: 'text-green-500',
          path: '/rounds/list'
        },
        {
          id: 'rounds-calendar',
          label: 'تقويم الجولات',
          icon: Calendar,
          color: 'text-blue-500',
          path: '/rounds/calendar'
        },
        {
          id: 'my-rounds',
          label: 'جولاتي',
          icon: User,
          color: 'text-purple-500',
          path: '/rounds/my-rounds'
        },
      ]
    },
    {
      id: 'capa',
      label: 'الخطط التصحيحية',
      icon: Shield,
      badge: null,
      color: 'text-orange-600',
      path: '/capa'
    },
    {
      id: 'capa-enhanced',
      label: 'الخطط التصحيحية المحسنة',
      icon: Shield,
      badge: 'NEW',
      color: 'text-orange-600',
      path: '/capa-enhanced'
    },
    {
      id: 'reports',
      label: 'التقارير',
      icon: BarChart3,
      badge: null,
      color: 'text-indigo-600',
      path: '/reports'
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
      id: 'unified-evaluation',
      label: 'لوحة التقييمات',
      icon: Target,
      badge: null,
      color: 'text-blue-600',
      hasSubmenu: true,
      path: '/unified-evaluation',
      submenu: [
        {
          id: 'evaluation-categories',
          label: 'تصنيفات التقييم',
          icon: Folder,
          color: 'text-blue-500',
          path: '/evaluation-categories'
        },
        {
          id: 'evaluation-items',
          label: 'عناصر التقييم',
          icon: FileText,
          color: 'text-green-500',
          path: '/evaluation-items'
        },
      ]
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
      id: 'test-api',
      label: 'اختبار API',
      icon: HelpCircle,
      badge: null,
      color: 'text-red-600',
      path: '/test-api'
    },
    {
      id: 'layout-test',
      label: 'اختبار التخطيط',
      icon: LayoutDashboard,
      badge: null,
      color: 'text-indigo-600',
      path: '/layout-test'
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

  const toggleSubmenu = (itemId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
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
        isCollapsed ? "w-16" : "w-72",
        // Mobile: overlay behavior
        isMobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {!isCollapsed && (
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
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path) || (item.submenu && item.submenu.some(sub => isActive(sub.path)))
              const isHovered = hoveredItem === item.id
              const isExpanded = expandedMenus.has(item.id)
              const hasSubmenu = item.hasSubmenu && item.submenu

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => hasSubmenu ? toggleSubmenu(item.id) : handleItemClick(item.path)}
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
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className={cn(
                          "text-sm font-medium truncate transition-all duration-200",
                          active ? "text-white drop-shadow-lg shadow-blue-400/50" : "text-slate-300",
                          isHovered && !active && "text-white drop-shadow-md"
                        )}>
                          {item.label}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs px-2 py-0.5 transition-all duration-200",
                                active && "bg-blue-500/20 text-blue-300 border-blue-400/30 shadow-lg shadow-blue-400/20"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {hasSubmenu && (
                            <div className="w-4 h-4 flex items-center justify-center">
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className={cn(
                        "absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 pointer-events-none transition-opacity duration-200 shadow-lg shadow-blue-500/20",
                        isHovered && "opacity-100"
                      )}>
                        {item.label}
                        {item.badge && (
                          <span className="ml-1 px-1 py-0.5 bg-blue-500/20 rounded text-xs">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && !isCollapsed && (
                    <div className="mr-4 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon
                        const subActive = isActive(subItem.path)
                        
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleItemClick(subItem.path)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                              "hover:bg-slate-800",
                              subActive && "bg-blue-900/20 text-blue-300 shadow-lg shadow-blue-400/10"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-4 h-4 transition-all duration-200",
                              subActive ? "text-blue-400 drop-shadow-lg shadow-blue-400/50" : "text-slate-500"
                            )}>
                              <SubIcon className="w-full h-full" />
                            </div>
                            <span className={cn(
                              "text-xs font-medium truncate transition-all duration-200",
                              subActive ? "text-blue-300 drop-shadow-md" : "text-slate-400"
                            )}>
                              {subItem.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
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
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className={cn(
                        "text-sm font-medium truncate transition-all duration-200",
                        active ? "text-white drop-shadow-lg shadow-blue-400/50" : "text-slate-300",
                        isHovered && !active && "text-white drop-shadow-md"
                      )}>
                        {item.label}
                      </span>
                      
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs px-2 py-0.5 transition-all duration-200",
                            active && "bg-blue-500/20 text-blue-300 border-blue-400/30 shadow-lg shadow-blue-400/20"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className={cn(
                      "absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 pointer-events-none transition-opacity duration-200 shadow-lg shadow-blue-500/20",
                      isHovered && "opacity-100"
                    )}>
                      {item.label}
                      {item.badge && (
                        <span className="ml-1 px-1 py-0.5 bg-blue-500/20 rounded text-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 mt-auto">
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* Empty space for future additions */}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              {/* Empty space for future additions */}
            </div>
          )}
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
