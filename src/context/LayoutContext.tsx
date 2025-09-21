import React, { createContext, useContext, useState, useEffect } from 'react'

interface LayoutContextType {
  headerHeight: number
  setHeaderHeight: (height: number) => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
  isMobile: boolean
  setIsMobile: (mobile: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

interface LayoutProviderProps {
  children: React.ReactNode
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [headerHeight, setHeaderHeight] = useState(64) // Default height in pixels
  const [sidebarWidth, setSidebarWidth] = useState(288) // Default width in pixels (w-72)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const isMobileView = width < 1024 // lg breakpoint
      setIsMobile(isMobileView)
      
      // Auto-collapse sidebar on mobile
      if (isMobileView) {
        setIsSidebarCollapsed(true)
        setSidebarWidth(64) // w-16 when collapsed
      } else {
        // Check localStorage for desktop state
        const collapsed = localStorage.getItem('sidebar-collapsed') === 'true'
        setIsSidebarCollapsed(collapsed)
        setSidebarWidth(collapsed ? 64 : 288)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarToggle = (event?: CustomEvent) => {
      const collapsed = event?.detail?.collapsed ?? localStorage.getItem('sidebar-collapsed') === 'true'
      setIsSidebarCollapsed(collapsed)
      setSidebarWidth(collapsed ? 64 : 288)
    }

    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener)
    
    // Check initial state
    handleSidebarToggle()

    return () => window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener)
  }, [])

  const value: LayoutContextType = {
    headerHeight,
    setHeaderHeight,
    sidebarWidth,
    setSidebarWidth,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobile,
    setIsMobile
  }

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}
