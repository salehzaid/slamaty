import React, { createContext, useContext, useState, useEffect } from 'react'

interface RTLContextType {
  isRTL: boolean
  toggleRTL: () => void
  direction: 'rtl' | 'ltr'
  language: 'ar' | 'en'
  setLanguage: (lang: 'ar' | 'en') => void
}

const RTLContext = createContext<RTLContextType | undefined>(undefined)

export const RTLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRTL, setIsRTL] = useState(true) // Default to RTL for Arabic
  const [language, setLanguage] = useState<'ar' | 'en'>(isRTL ? 'ar' : 'en')

  useEffect(() => {
    // Check if RTL preference is stored in localStorage
    const storedRTL = localStorage.getItem('rtl_preference')
    if (storedRTL !== null) {
      setIsRTL(JSON.parse(storedRTL))
    }

    const storedLang = localStorage.getItem('site_language')
    if (storedLang === 'ar' || storedLang === 'en') {
      setLanguage(storedLang)
      setIsRTL(storedLang === 'ar')
    }
  }, [])

  useEffect(() => {
    // Update document direction and save preference
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = isRTL ? 'ar' : 'en'
    localStorage.setItem('rtl_preference', JSON.stringify(isRTL))
    localStorage.setItem('site_language', language)
  }, [isRTL, language])

  const toggleRTL = () => {
    setIsRTL(prev => {
      const next = !prev
      setLanguage(next ? 'ar' : 'en')
      return next
    })
  }

  const value = {
    isRTL,
    toggleRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    language,
    setLanguage,
  }

  return (
    <RTLContext.Provider value={value}>
      {children}
    </RTLContext.Provider>
  )
}

export const useRTL = () => {
  const context = useContext(RTLContext)
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider')
  }
  return context
}
