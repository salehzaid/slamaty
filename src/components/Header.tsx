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
      className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-all duration-300 ease-in-out"
    >
      <div className="flex items-center justify-between px-3 md:px-6 py-3 w-full gap-2 md:gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </Button>

        {/* Search Bar */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="بحث..."
              className="pr-10 pl-3 py-2 text-sm bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
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
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block" />

          {/* Theme Toggle - Compact on mobile */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme('light')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                theme === 'light' 
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm" 
                  : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
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
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm" 
                  : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
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
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm" 
                  : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              )}
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>

          {/* Separator - Hidden on mobile */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

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
