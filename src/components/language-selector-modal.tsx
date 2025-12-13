'use client'

import { useState, useEffect } from 'react'
import { X, Globe, Check, ChevronRight } from 'lucide-react'
import { SUPPORTED_LANGUAGES, LanguageCode, useLanguage, hasSelectedLanguage } from '@/lib/language-context'

interface LanguageSelectorModalProps {
  /** Force show even if user already selected a language */
  forceShow?: boolean
  /** Callback when modal closes */
  onClose?: () => void
  /** Show as inline selector instead of modal */
  inline?: boolean
}

export function LanguageSelectorModal({ forceShow = false, onClose, inline = false }: LanguageSelectorModalProps) {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(language)

  useEffect(() => {
    // Show modal on first visit (no language selected yet) or if forceShow
    if (forceShow || !hasSelectedLanguage()) {
      setIsOpen(true)
    }
  }, [forceShow])

  useEffect(() => {
    setSelectedLang(language)
  }, [language])

  const handleConfirm = () => {
    setLanguage(selectedLang)
    setIsOpen(false)
    onClose?.()
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  // Inline language selector (for settings pages, etc.)
  if (inline) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Globe className="w-4 h-4" />
          <span>{t('language.selectLanguage')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                language === lang.code
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">{lang.nativeName}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{lang.name}</span>
              </div>
              {language === lang.code && (
                <Check className="w-4 h-4 ml-auto text-emerald-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('language.chooseYourLanguage')}</h2>
              <p className="text-emerald-100 text-sm">{t('language.chooseYourLanguageHint')}</p>
            </div>
          </div>
          
          <p className="text-sm text-emerald-100">
            {t('language.chooseDescription')}
          </p>
        </div>

        {/* Language Grid */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  selectedLang === lang.code
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className={`font-semibold ${
                    selectedLang === lang.code 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {lang.nativeName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{lang.name}</span>
                </div>
                {selectedLang === lang.code && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleConfirm}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            {t('language.continueWith', { language: SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name || '' })}
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
            {t('language.changeLater')}
          </p>
        </div>
      </div>
    </div>
  )
}

// Compact language button for header/navigation
export function LanguageButton({ onClick }: { onClick?: () => void }) {
  const { languageInfo, t } = useLanguage()
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      title={t('language.changeLanguage')}
    >
      <Globe className="w-4 h-4 text-slate-500" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {languageInfo?.flag} {languageInfo?.code.toUpperCase()}
      </span>
    </button>
  )
}
