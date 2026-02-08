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
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </div>
      </DynamicLayout>
    </main>
  )
}

export default MainContent
