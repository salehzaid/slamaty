import React, { useState } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRTL } from './RTLProvider'

const EnhancedLanguageSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage } = useRTL()

  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between gap-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">{currentLanguage.flag} {currentLanguage.name}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute bottom-full right-0 mb-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as 'ar' | 'en')
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors",
                  language === lang.code && "bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default EnhancedLanguageSwitcher
