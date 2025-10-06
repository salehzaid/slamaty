import React, { useEffect, useRef } from 'react'
import { 
  Sun,
  Moon,
  Monitor,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'
import EnhancedLanguageSwitcher from './EnhancedLanguageSwitcher'
import UserDropdown from './UserDropdown'
import NotificationDropdown from './NotificationDropdown'
import { useLayout } from '@/context/LayoutContext'

interface HeaderProps {
  onLogout: () => void
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { theme, setTheme } = useTheme()
  const { setHeaderHeight, sidebarWidth, isMobile } = useLayout()
  const headerRef = useRef<HTMLElement>(null)

  // Measure and update header height
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight
        setHeaderHeight(height)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [setHeaderHeight])

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
  }

  return (
    <header 
      ref={headerRef}
      className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/50 shadow-lg transition-all duration-300 ease-in-out"
    >
      <div className="flex items-center justify-between px-3 md:px-6 py-3 w-full gap-2 md:gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </Button>

        {/* Search Bar */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="بحث..."
              className="pr-10 pl-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Language Switcher - Hidden on mobile */}
          <div className="hidden lg:block">
            <EnhancedLanguageSwitcher />
          </div>

          {/* Separator - Hidden on mobile */}
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden lg:block" />

          {/* Theme Toggle - Compact on mobile */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme('light')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                theme === 'light' 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm" 
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
              )}
            >
              <Sun className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme('dark')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                theme === 'dark' 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm" 
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
              )}
            >
              <Moon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme('system')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                theme === 'system' 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm" 
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
              )}
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>

          {/* Separator - Hidden on mobile */}
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

          {/* Notifications */}
          <div className="hidden sm:block">
            <NotificationDropdown />
          </div>

          {/* User Dropdown */}
          <UserDropdown onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}

export default Header
