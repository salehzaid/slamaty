import React from 'react'
import { useLayout } from '@/context/LayoutContext'
import Header from './Header'
import DynamicLayout from './DynamicLayout'

interface MainContentProps {
  children: React.ReactNode
  onLogout: () => void
}

const MainContent: React.FC<MainContentProps> = ({ children, onLogout }) => {
  const { sidebarWidth, isMobile } = useLayout()

  return (
    <main
      className="transition-all duration-300 ease-in-out min-h-screen"
      style={{
        marginRight: isMobile ? '0' : `${sidebarWidth}px`
      }}
    >
      <Header onLogout={onLogout} />
      <DynamicLayout>
        <div className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8 lg:py-4">
          {children}
        </div>
      </DynamicLayout>
    </main>
  )
}

export default MainContent
