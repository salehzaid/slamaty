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
      className="transition-all duration-300 ease-in-out" 
      style={{ 
        marginRight: isMobile ? '0px' : `${sidebarWidth}px` 
      }}
    >
      <Header onLogout={onLogout} />
      <DynamicLayout>
        {children}
      </DynamicLayout>
    </main>
  )
}

export default MainContent
