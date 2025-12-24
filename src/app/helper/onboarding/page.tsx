'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Upload,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Search,
  X,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Camera
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading'
import { uploadOnboardingDocuments } from '@/app/actions/helper-verification'
import { completeHelperOnboarding } from '@/app/actions/onboarding'
import { LanguageSelectorModal, LanguageButton } from '@/components/language-selector-modal'
import { useLanguage, hasSelectedLanguage } from '@/lib/language-context'

const translateWithFallback = (t: any, key: string, fallback: string) => {
  const value = typeof t === 'function' ? t(key) : ''
  return !value || value === key ? fallback : value
}

// Step 1: Service Details
function Step1ServiceDetails({ data, onChange, onNext, t }: any) {
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const nextLabel = translateWithFallback(t, 'common.next', 'Next')

  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient()

      const { data: rootCategories } = await supabase
        .from('service_categories')
        .select('id, name, slug')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      const { data: childCategories } = await supabase
        .from('service_categories')
        .select('id, name, slug, parent_id')
        .not('parent_id', 'is', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setCategories(rootCategories || [])
      setSubcategories(childCategories || [])
      setLoading(false)
    }

    loadCategories()
  }, [])

  useEffect(() => {
    if (!subcategories.length) return
    if (!data.service_categories?.length) return

    const skillNames = subcategories
      .filter((sub) => data.service_categories.includes(sub.slug))
      .map((sub) => sub.name)

    if (skillNames.length && JSON.stringify(skillNames) !== JSON.stringify(data.skills || [])) {
      onChange({ skills: skillNames })
    }
  }, [subcategories, data.service_categories, data.skills, onChange])

  const getSubcategoriesForParent = (parentId: string) =>
    subcategories.filter((sub) => sub.parent_id === parentId)

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  // Toggle individual sub-service selections; category headers stay display-only
  const toggleSubcategorySelection = (slug: string) => {
    const current = new Set(data.service_categories || [])
    if (current.has(slug)) {
      current.delete(slug)
    } else {
      current.add(slug)
    }

    const skillNames = subcategories
      .filter((sub) => current.has(sub.slug))
      .map((sub) => sub.name)

    onChange({
      service_categories: Array.from(current),
      skills: skillNames
    })
  }

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true
    const matchesRoot = cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    const subs = getSubcategoriesForParent(cat.id)
    const matchesSub = subs.some((sub: any) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesRoot || matchesSub
  })

  const selectedCount = (data.service_categories || []).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header - Compact on mobile */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {t('onboarding.step1.title')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('onboarding.step1.subtitle')}
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Your Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.full_name || ''}
          onChange={(e) => onChange({ full_name: e.target.value })}
          placeholder="Enter your full name"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          maxLength={100}
        />
        <p className="text-xs text-slate-500 mt-1">This name will be shown to customers</p>
      </div>

      {/* Service Categories */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('onboarding.step1.chooseServices')} <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-emerald-600">({selectedCount} {t('common.selected')})</span>
        </label>

        {/* Search Box - Compact */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('onboarding.step1.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800 dark:text-white text-sm"
          />
        </div>

        {/* Scrollable Categories Container */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-72 sm:max-h-80 overflow-y-auto bg-white dark:bg-slate-800">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No categories found matching "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredCategories.map((rootCategory) => {
                const subs = getSubcategoriesForParent(rootCategory.id)
                const isExpanded = expandedCategories.includes(rootCategory.id)
                const selectedSubsCount = subs.filter((sub: any) => 
                  (data.service_categories || []).includes(sub.slug)
                ).length
                const isHighlighted = selectedSubsCount > 0

                return (
                  <div
                    key={rootCategory.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${isHighlighted ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-l-4 border-emerald-500 dark:border-emerald-400' : ''}`}
                  >
                    {/* Root Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpansion(rootCategory.id)}
                      className="w-full flex items-center gap-3 p-3 text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <span className="flex-1">{rootCategory.name}</span>
                      <div className="flex items-center gap-2">
                        {selectedSubsCount > 0 && (
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full font-medium">
                            {selectedSubsCount}/{subs.length}
                          </span>
                        )}
                        {subs.length > 0 && (
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </button>

                    {/* Subcategories (Collapsible) */}
                    {subs.length > 0 && isExpanded && (
                      <div className="bg-slate-50 dark:bg-slate-900/30 px-3 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8">
                          {subs.map((sub: any) => {
                            const subSelected = (data.service_categories || []).includes(sub.slug)
                            return (
                              <label
                                key={sub.id}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                              >
                                <input
                                  type="checkbox"
                                  checked={subSelected}
                                  onChange={() => toggleSubcategorySelection(sub.slug)}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {sub.name}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Sub-services Summary */}
        {selectedCount > 0 && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              {t('onboarding.step1.selectedServiceCategories')} ({selectedCount}):
            </p>
            <div className="flex flex-wrap gap-2">
              {subcategories
                .filter((sub) => (data.service_categories || []).includes(sub.slug))
                .map((sub) => {
                  const parent = categories.find(c => c.id === sub.parent_id)
                  return (
                    <span
                      key={sub.slug}
                      onClick={() => toggleSubcategorySelection(sub.slug)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-md text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                    >
                      {sub.name}{parent ? ` · ${parent.name}` : ''}
                      <X className="h-3 w-3" />
                    </span>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Skills - Auto-populated from selected subcategories */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {t('onboarding.step1.yourSkills')} <span className="text-red-500">*</span>
        </label>
        <div className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-[60px]">
          {(data.skills || []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {(data.skills || []).map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic text-sm">{t('onboarding.step1.selectSubcategories')}</p>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">{t('onboarding.step1.autoFilled')}</p>
      </div>

      {/* Specialization */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {t('onboarding.step1.specialization')}
        </label>
        <textarea
          value={data.skills_specialization || ''}
          onChange={(e) => onChange({ skills_specialization: e.target.value })}
          placeholder={t('onboarding.step1.specializationPlaceholder')}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          rows={2}
        />
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {t('onboarding.step1.yearsExperience')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={data.experience_years || ''}
          onChange={(e) => onChange({ experience_years: parseInt(e.target.value) || 0 })}
          min="0"
          max="50"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          placeholder="5"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!data.full_name?.trim() || !data.service_categories?.length || !data.skills?.length || !data.experience_years}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// Step 2: Location & Service Area
function Step2Location({ data, onChange, onNext, onBack, t }: any) {
  const [detecting, setDetecting] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [validationError, setValidationError] = useState('')
  
  // Preset radius options (Rapido-style)
  const radiusOptions = [5, 10, 15, 20, 25, 30]
  const nextLabel = translateWithFallback(t, 'common.next', 'Next')
  const backLabel = translateWithFallback(t, 'common.back', 'Back')

  const detectLocation = async () => {
    setDetecting(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError(t('onboarding.step2.geoNotSupported'))
      setDetecting(false)
      return
    }

    const toastId = 'detecting-location'
    // Show toast to indicate we're detecting
    toast.loading(t('onboarding.step2.detecting'), { id: toastId })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Update coordinates immediately so user sees progress
          onChange({
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          })

          const geocodeGoogle = async () => {
            try {
              const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`, {
                cache: 'no-store',
                headers: { Accept: 'application/json' }
              })
              if (!response.ok) return null
              const geo = await response.json()
              const address = geo.formatted_address || ''
              return {
                address,
                pincode: geo.pincode || ''
              }
            } catch (error) {
              console.error('Geocoding error (google):', error)
              return null
            }
          }

          const geocodeFallback = async () => {
            try {
              const response = await fetch(`/api/address/reverse?lat=${latitude}&lng=${longitude}`, {
                cache: 'no-store',
                headers: { Accept: 'application/json' }
              })
              if (!response.ok) return null
              const geo = await response.json()
              const address = geo?.address?.display_name || geo?.display_name || ''
              return {
                address,
                pincode: geo?.address?.pincode || geo?.pincode || ''
              }
            } catch (error) {
              console.error('Geocoding error (fallback):', error)
              return null
            }
          }

          let result = await geocodeGoogle()
          if (!result || !result.address) {
            result = await geocodeFallback()
          }

          toast.dismiss(toastId)

          if (result && result.address) {
            onChange({
              address: result.address,
              pincode: result.pincode || data.pincode || '',
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            })
            setLocationError('')
            toast.success(t('onboarding.step2.locationDetected'))
          } else {
            // API returned error but we still have coordinates
            toast.warning(t('onboarding.step2.coordsSavedEnterManual'))
            setLocationError(t('onboarding.step2.enterAddressManually'))
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          toast.dismiss(toastId)
          toast.warning(t('onboarding.step2.coordsSaved'))
          setLocationError(t('onboarding.step2.enterAddressManually'))
        }
        
        setDetecting(false)
      },
      (error) => {
        toast.dismiss(toastId)
        let errorMessage = t('onboarding.step2.detectFailed')
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('onboarding.step2.permissionDenied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('onboarding.step2.positionUnavailable')
            break
          case error.TIMEOUT:
            errorMessage = t('onboarding.step2.timeout')
            break
        }
        
        toast.error(errorMessage)
        setLocationError(errorMessage)
        setDetecting(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000
      }
    )
  }

  const handleNext = () => {
    setValidationError('')
    
    if (!data.address?.trim()) {
      setValidationError(t('onboarding.step2.addressRequired'))
      toast.error(t('onboarding.step2.enterFullAddress'))
      return
    }
    
    if (!data.pincode?.trim()) {
      setValidationError(t('onboarding.step2.pincodeRequired'))
      toast.error(t('onboarding.step2.enterPincode'))
      return
    }
    
    // Validate pincode format: must be exactly 6 digits
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(data.pincode.trim())) {
      setValidationError('Pincode must be exactly 6 digits')
      toast.error('Please enter a valid 6-digit pincode')
      return
    }
    
    if (!data.service_radius_km || data.service_radius_km < 1) {
      setValidationError(t('onboarding.step2.radiusRequired'))
      toast.error(t('onboarding.step2.selectRadius'))
      return
    }
    
    onNext()
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header - Compact on mobile */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {t('onboarding.step2.title')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('onboarding.step2.subtitle')}
        </p>
      </div>

      {validationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* ===== YOUR ADDRESS SECTION ===== */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('onboarding.step2.yourAddress')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('onboarding.step2.whereYouAreBased')}
            </p>
          </div>
        </div>

        {/* Auto-Detect Button */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('onboarding.step2.autoDetectDesc')}
          </p>
          <button
            type="button"
            onClick={detectLocation}
            disabled={detecting}
            className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm"
          >
            {detecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {t('onboarding.step2.detecting')}
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                {t('onboarding.step2.detect')}
              </>
            )}
          </button>
          {locationError && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              {locationError}
            </div>
          )}
        </div>

        {/* Full Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('onboarding.step2.fullAddress')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.address || ''}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder={t('onboarding.step2.addressPlaceholder')}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={2}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('onboarding.step2.addressTip')}
          </p>
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('onboarding.step2.pincode')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            value={data.pincode || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
              onChange({ pincode: value })
            }}
            maxLength={6}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="400001"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter 6-digit pincode (numbers only)
          </p>
        </div>

        {/* Coordinates - Compact row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t('onboarding.step2.latitudeOptional')}
            </label>
            <input
              type="number"
              value={data.latitude || ''}
              onChange={(e) => onChange({ latitude: parseFloat(e.target.value) || null })}
              step="0.000001"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              placeholder="16.3139"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t('onboarding.step2.longitudeOptional')}
            </label>
            <input
              type="number"
              value={data.longitude || ''}
              onChange={(e) => onChange({ longitude: parseFloat(e.target.value) || null })}
              step="0.000001"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              placeholder="80.4535"
            />
          </div>
        </div>
      </div>

      {/* ===== SERVICE RADIUS SECTION ===== */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('onboarding.step2.workRadius')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('onboarding.step2.workRadiusDesc')}
            </p>
          </div>
        </div>

        {/* Radius Info */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('onboarding.step2.radiusExplanation')}
          </p>
        </div>

        {/* Radius Preset Buttons - Mobile optimized grid */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('onboarding.step2.selectWorkRadius')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {radiusOptions.map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => onChange({ service_radius_km: radius })}
                className={`w-full py-3 rounded-lg font-semibold text-center transition-all text-sm ${
                  data.service_radius_km === radius
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                {radius} km
              </button>
            ))}
          </div>
        </div>

        {/* Custom Radius Input - Inline */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {t('onboarding.step2.orEnterCustom')}
          </span>
          <input
            type="number"
            value={data.service_radius_km || ''}
            onChange={(e) => onChange({ service_radius_km: parseInt(e.target.value) || 10 })}
            min="1"
            max="100"
            className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-semibold text-sm"
            placeholder="10"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">km</span>
        </div>

        {/* Selection Summary - Compact */}
        {data.service_radius_km && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {t('onboarding.step2.radiusSelected', { radius: data.service_radius_km })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="sticky bottom-0 left-0 right-0 z-20 -mx-4 px-4 pb-3 pt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur sm:static sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2 border-t border-slate-200 dark:border-slate-700 sm:border-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onBack}
            className="w-full sm:flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </button>
          <button
            onClick={handleNext}
            className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-1 text-sm"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 3: Working Hours & Availability
function Step3Availability({ data, onChange, onNext, onBack, t }: any) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const defaultHours = {
    available: true,
    start: '09:00',
    end: '18:00'
  }

  const workingHours = data.working_hours || {}
  const nextLabel = translateWithFallback(t, 'common.next', 'Next')
  const backLabel = translateWithFallback(t, 'common.back', 'Back')

  const toggleDay = (day: string) => {
    const updated = { ...workingHours }
    if (!updated[day]) {
      updated[day] = { ...defaultHours }
    } else {
      updated[day] = { ...updated[day], available: !updated[day].available }
    }
    onChange({ working_hours: updated })
  }

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    const updated = { ...workingHours }
    if (!updated[day]) {
      updated[day] = { ...defaultHours }
    }
    updated[day] = { ...updated[day], [field]: value }
    onChange({ working_hours: updated })
  }

  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-5">
      {/* Header - Compact */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {t('onboarding.step3.title')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('onboarding.step3.subtitle')}
        </p>
      </div>

      {/* Scrollable content on mobile to avoid overflow */}
      <div className="flex-1 flex flex-col gap-3 sm:gap-4 max-h-[calc(100vh-260px)] sm:max-h-none overflow-y-auto pr-1 sm:pr-0">
        {/* Working Hours - Compact cards */}
        <div className="space-y-1.5 sm:space-y-2">
          {days.map((day) => {
            const hours = workingHours[day] || defaultHours
            return (
              <div key={day} className="bg-white dark:bg-slate-800 rounded-lg p-2.5 sm:p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={hours.available !== false}
                      onChange={() => toggleDay(day)}
                      className="w-4 h-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">{t(`day.${day}`)}</span>
                  </label>
                  
                  {hours.available !== false && (
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <input
                        type="time"
                        value={hours.start || '09:00'}
                        onChange={(e) => updateTime(day, 'start', e.target.value)}
                        className="w-[78px] sm:w-[90px] px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                      />
                      <span className="text-slate-400 text-xs">to</span>
                      <input
                        type="time"
                        value={hours.end || '18:00'}
                        onChange={(e) => updateTime(day, 'end', e.target.value)}
                        className="w-[78px] sm:w-[90px] px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Availability Toggles - Compact */}
        <div className="space-y-1.5 sm:space-y-2 pb-1">
          <label className="flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('onboarding.step3.availableNow')}</span>
            <input
              type="checkbox"
              checked={data.is_available_now !== false}
              onChange={(e) => onChange({ is_available_now: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('onboarding.step3.emergencyAvailability')}</span>
            <input
              type="checkbox"
              checked={data.emergency_availability === true}
              onChange={(e) => onChange({ emergency_availability: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Navigation */}
      <div
        className="sticky bottom-0 left-0 right-0 z-20 -mx-4 px-4 pt-3 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur sm:static sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2 border-t border-slate-200 dark:border-slate-700 sm:border-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onBack}
            className="w-full sm:flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </button>
          <button
            onClick={onNext}
            className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-1 text-sm"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 4: Bank Account Details
function Step4BankAccount({ data, onChange, onNext, onBack, t }: any) {
  const [accountType, setAccountType] = useState<'bank' | 'upi'>('bank')
  const nextLabel = translateWithFallback(t, 'common.next', 'Next')
  const backLabel = translateWithFallback(t, 'common.back', 'Back')

  return (
    <div className="space-y-5">
      {/* Header - Compact */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {t('onboarding.step4.title')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('onboarding.step4.subtitle')}
        </p>
      </div>

      {/* Important Note - Compact */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm mb-1">{t('onboarding.step4.important')}</h3>
            <p className="text-green-50 text-xs leading-relaxed">
              {t('onboarding.step4.importantDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Account Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('onboarding.step4.paymentMethod')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType('bank')}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              accountType === 'bank'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="font-medium text-sm text-slate-900 dark:text-white">{t('onboarding.step4.bankAccount')}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t('onboarding.step4.neftImps')}</div>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('upi')}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              accountType === 'upi'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="font-medium text-sm text-slate-900 dark:text-white">{t('onboarding.step4.upiId')}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t('onboarding.step4.instantPayment')}</div>
          </button>
        </div>
      </div>

      {accountType === 'bank' ? (
        <div className="space-y-3">
          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('onboarding.step4.accountHolderName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.account_holder_name || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, account_holder_name: e.target.value }
              })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              placeholder={t('onboarding.step4.placeholders.accountHolderName')}
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('onboarding.step4.accountNumber')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.account_number || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, account_number: e.target.value }
              })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              placeholder={t('onboarding.step4.placeholders.accountNumber')}
            />
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('onboarding.step4.ifscCode')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.ifsc_code || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, ifsc_code: e.target.value.toUpperCase() }
              })}
              maxLength={11}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm uppercase"
              placeholder={t('onboarding.step4.placeholders.ifsc')}
            />
          </div>

          {/* Bank Name & Branch - Stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('onboarding.step4.bankName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.bank_account?.bank_name || ''}
                onChange={(e) => onChange({ 
                  bank_account: { ...data.bank_account, bank_name: e.target.value }
                })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                placeholder={t('onboarding.step4.placeholders.bankName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('onboarding.step4.branchName')}
              </label>
              <input
                type="text"
                value={data.bank_account?.branch_name || ''}
                onChange={(e) => onChange({ 
                  bank_account: { ...data.bank_account, branch_name: e.target.value }
                })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                placeholder={t('onboarding.step4.placeholders.branchName')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('onboarding.step4.upiId')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.bank_account?.upi_id || ''}
            onChange={(e) => onChange({ 
              bank_account: { ...data.bank_account, upi_id: e.target.value }
            })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            placeholder={t('onboarding.step4.placeholders.upi')}
          />
          <p className="text-xs text-slate-500 mt-1">{t('onboarding.step4.upiHelp')}</p>
        </div>
      )}

      {/* Validation Feedback - Compact */}
      {accountType === 'bank' && data.bank_account?.account_number && data.bank_account?.ifsc_code && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Account Details Captured</strong><br />
            {data.bank_account.bank_name && `${data.bank_account.bank_name} • `}
            ****{data.bank_account.account_number.slice(-4)}
          </div>
        </div>
      )}

      {accountType === 'upi' && data.bank_account?.upi_id && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <strong>UPI ID:</strong> {data.bank_account.upi_id}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <button
          onClick={onNext}
          disabled={
            accountType === 'bank' 
              ? !data.bank_account?.account_holder_name || !data.bank_account?.account_number || !data.bank_account?.ifsc_code || !data.bank_account?.bank_name
              : !data.bank_account?.upi_id
          }
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Step 5: Document Upload
function Step5Documents({ data, onChange, onSubmit, onBack, submitting, t }: any) {
  // Local file states (upload deferred until final submit)
  const [files, setFiles] = useState<Record<string, File | null>>({
    id_proof: null,
    address_proof: null,
    professional_cert: null,
    photo: null,
  })
  const backLabel = translateWithFallback(t, 'common.back', 'Back')
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const documentTypes = [
    { key: 'id_proof', label: 'ID Proof', description: 'Aadhaar, PAN, License', required: true },
    { key: 'photo', label: 'Profile Photo', description: 'Clear selfie', required: true, allowCamera: true },
    { key: 'address_proof', label: 'Address Proof', description: 'Utility bill (optional)', required: false },
    { key: 'professional_cert', label: 'Certificate', description: 'Trade license (optional)', required: false },
  ]

  const handleSelectFile = (docKey: string, file: File) => {
    setFiles(prev => ({ ...prev, [docKey]: file }))
    const updated = { ...data.documents, [docKey]: file.name }
    onChange({ documents: updated })
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  return (
    <div className="flex flex-col">
      {/* Hidden camera input for selfie */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleSelectFile('photo', file)
        }}
        className="hidden"
        disabled={submitting}
      />

      {/* Header - Smaller */}
      <div className="pb-1.5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          📄 Upload Documents
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quick verification (24-48 hrs)
        </p>
      </div>

      {/* Documents - Very compact */}
      <div className="space-y-2">
        {documentTypes.map((docType) => (
          <div
            key={docType.key}
            className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                {docType.label}{docType.required && <span className="text-red-500 ml-0.5">*</span>}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{docType.description}</p>
            </div>
            
            {/* Show camera + upload for photo, just upload for others */}
            <div className="flex gap-1.5 flex-shrink-0">
              {docType.allowCamera && (
                <button
                  type="button"
                  onClick={openCamera}
                  disabled={submitting}
                  className="w-9 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleSelectFile(docType.key, file)
                  }}
                  className="hidden"
                  disabled={submitting}
                />
                <div
                  className={`w-9 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                    files[docType.key]
                      ? 'bg-green-600 text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {files[docType.key] ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Note - Smaller */}
      <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
        <p className="text-[10px] text-yellow-800 dark:text-yellow-300">
          <strong>Note:</strong> ID + Photo required. Verified in 24-48 hrs.
        </p>
      </div>

      {/* Navigation - natural flow, padding for safe-area */}
      <div className="pt-4 pb-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onBack}
            disabled={submitting}
            className="w-full sm:flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </button>
          <button
            onClick={() => onSubmit(files)}
            disabled={submitting || !files.id_proof || !files.photo}
            className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                {t('onboarding.step5.submitting')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {t('onboarding.step5.completeOnboarding')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Onboarding Component
export default function HelperOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const formContainerRef = useRef<HTMLDivElement | null>(null)
  const [formData, setFormData] = useState<any>({
    full_name: '',
    service_categories: [],
    skills: [],
    skills_specialization: '',
    experience_years: 0,
    hourly_rate: 0,
    address: '',
    pincode: '',
    service_radius_km: 10,
    service_areas: [],
    service_area_ids: [],
    latitude: null,
    longitude: null,
    working_hours: {
      monday: { available: true, start: '09:00', end: '18:00' },
      tuesday: { available: true, start: '09:00', end: '18:00' },
      wednesday: { available: true, start: '09:00', end: '18:00' },
      thursday: { available: true, start: '09:00', end: '18:00' },
      friday: { available: true, start: '09:00', end: '18:00' },
      saturday: { available: true, start: '09:00', end: '18:00' },
      sunday: { available: false, start: '09:00', end: '18:00' }
    },
    is_available_now: true,
    emergency_availability: false,
    bank_account: {},
    documents: {}
  })
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const { languageInfo, t } = useLanguage()

  // Show language selector popup on first visit
  useEffect(() => {
    if (!checking && !hasSelectedLanguage()) {
      setShowLanguageModal(true)
    }
  }, [checking])

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  // Keep the view anchored to the top of the form when moving between steps
  useEffect(() => {
    if (typeof window === 'undefined') return
    const target = formContainerRef.current
    const top = target ? target.getBoundingClientRect().top + window.scrollY : 0
    const offset = Math.max(top - 80, 0)
    window.scrollTo({ top: offset, behavior: 'smooth' })
  }, [currentStep])

  const checkOnboardingStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('address, service_categories, verification_status')
      .eq('user_id', user.id)
      .single()

    // If already onboarded AND not rejected, redirect to dashboard
    // Rejected helpers should be able to re-onboard
    if (profile?.address && profile?.service_categories?.length > 0 && profile?.verification_status !== 'rejected') {
      router.push('/helper/dashboard')
      return
    }

    setChecking(false)
  }

  const updateFormData = (updates: any) => {
    setFormData({ ...formData, ...updates })
  }

  const handleSubmit = async (files?: Record<string, File | null>) => {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error(t('onboarding.toast.loginRequired'))
        return
      }

      // Upload documents first if provided (Step 5)
      if (files) {
        const formFiles = new FormData()
        if (files.id_proof) formFiles.append('id_proof', files.id_proof)
        if (files.address_proof) formFiles.append('address_proof', files.address_proof)
        if (files.professional_cert) formFiles.append('professional_cert', files.professional_cert)
        if (files.photo) formFiles.append('photo', files.photo)
        const uploadResult = await uploadOnboardingDocuments(formFiles)
        if ('error' in uploadResult && uploadResult.error) {
          toast.error(uploadResult.error)
          return
        }
        toast.success(t('onboarding.toast.documentsUploaded'))
      }

      // Save complete onboarding data
      const result = await completeHelperOnboarding({
        full_name: formData.full_name,
        service_categories: formData.service_categories,
        skills: formData.skills,
        skills_specialization: formData.skills_specialization,
        experience_years: formData.experience_years,
        hourly_rate: formData.hourly_rate || 500,
        address: formData.address,
        pincode: formData.pincode,
        service_radius_km: formData.service_radius_km,
        service_areas: formData.service_areas,
        service_area_ids: formData.service_area_ids,
        latitude: formData.latitude,
        longitude: formData.longitude,
        working_hours: formData.working_hours,
        is_available_now: formData.is_available_now,
        emergency_availability: formData.emergency_availability,
        bank_account: formData.bank_account
      })

      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.message || t('onboarding.toast.completeDefault'))
      setTimeout(() => {
        router.push('/helper/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Onboarding submit error', err)
      toast.error(t('common.error') || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-teal-950 dark:to-emerald-950">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const steps = [
    { number: 1, title: t('onboarding.steps.serviceDetails'), icon: Briefcase },
    { number: 2, title: t('onboarding.steps.location'), icon: MapPin },
    { number: 3, title: t('onboarding.steps.availability'), icon: Clock },
    { number: 4, title: t('onboarding.steps.bankDetails'), icon: CreditCard },
    { number: 5, title: t('onboarding.steps.documents'), icon: Upload },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-teal-950 dark:to-emerald-950 py-4 px-3 sm:py-8 sm:px-4 overflow-x-hidden">
      {/* Language Selector Modal - shows on first visit */}
      {showLanguageModal && (
        <LanguageSelectorModal 
          forceShow={true}
          onClose={() => setShowLanguageModal(false)} 
        />
      )}

      <div className="max-w-2xl mx-auto" ref={formContainerRef}>
        {/* Language Button - top right */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowLanguageModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm text-sm"
            title={t('language.changeLanguage')}
          >
            <span className="text-base">{languageInfo?.flag}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {languageInfo?.nativeName}
            </span>
          </button>
        </div>

        {/* Progress Steps - Mobile optimized and sticky under the top bar */}
        <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide sticky top-[5.5rem] z-30 bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-teal-950 dark:to-emerald-950">
          <div className="flex items-center justify-between min-w-[320px]">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? 'bg-green-600 border-green-600 text-white'
                        : isActive
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-1.5 font-medium text-center hidden sm:block ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-4 sm:w-full sm:flex-1 mx-1 sm:mx-2 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content - Reduced padding on mobile */}
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-slate-200 dark:border-slate-700 overflow-hidden">
          {currentStep === 1 && (
            <Step1ServiceDetails
              data={formData}
              onChange={updateFormData}
              onNext={() => setCurrentStep(2)}
              t={t}
            />
          )}
          {currentStep === 2 && (
            <Step2Location
              data={formData}
              onChange={updateFormData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
              t={t}
            />
          )}
          {currentStep === 3 && (
            <Step3Availability
              data={formData}
              onChange={updateFormData}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
              t={t}
            />
          )}
          {currentStep === 4 && (
            <Step4BankAccount
              data={formData}
              onChange={updateFormData}
              onNext={() => setCurrentStep(5)}
              onBack={() => setCurrentStep(3)}
              t={t}
            />
          )}
          {currentStep === 5 && (
            <Step5Documents
              data={formData}
              onChange={updateFormData}
              onSubmit={handleSubmit}
              onBack={() => setCurrentStep(4)}
              submitting={submitting}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  )
}
