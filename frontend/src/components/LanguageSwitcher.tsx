import React from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ChevronDown } from 'lucide-react'
import { useRTL } from './RTLProvider'

const LanguageSwitcher: React.FC = () => {
  const { isRTL, toggleRTL } = useRTL()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleRTL}
      className="flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      <span>{isRTL ? 'English' : 'العربية'}</span>
      <ChevronDown className="w-3 h-3" />
    </Button>
  )
}

export default LanguageSwitcher
