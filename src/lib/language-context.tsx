'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { getTranslation } from './translations'

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  languageInfo: typeof SUPPORTED_LANGUAGES[number] | undefined
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'helparo_preferred_language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')
  const [mounted, setMounted] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      setLanguageState(stored)
    }
    setMounted(true)
  }, [])

  // Persist language to localStorage
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    
    // Update document lang attribute for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getTranslation(language, key)

      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          // Replace all occurrences of {paramKey}
          value = value.replaceAll(`{${paramKey}}`, String(paramValue))
        }
      }

      return value
    },
    [language]
  )

  const languageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language)

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languageInfo, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Helper to check if user has selected a language before
export function hasSelectedLanguage(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) !== null
}
