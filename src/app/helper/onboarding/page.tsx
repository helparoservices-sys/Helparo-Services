'use client'

import { useState, useEffect } from 'react'
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
  CheckCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading'
import { uploadOnboardingDocuments } from '@/app/actions/helper-verification'
import { completeHelperOnboarding } from '@/app/actions/onboarding'
import { LanguageSelectorModal, LanguageButton } from '@/components/language-selector-modal'
import { useLanguage, hasSelectedLanguage } from '@/lib/language-context'

// Step 1: Service Details
function Step1ServiceDetails({ data, onChange, onNext, t }: any) {
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const supabase = createClient()
    
    // Fetch root categories (parent_id is null)
    const { data: rootCategories } = await supabase
      .from('service_categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // Fetch all subcategories
    const { data: allSubcategories } = await supabase
      .from('service_categories')
      .select('id, name, slug, parent_id')
      .not('parent_id', 'is', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    setCategories(rootCategories || [])
    setSubcategories(allSubcategories || [])
    setLoading(false)
  }

  const getSubcategoriesForParent = (parentId: string) => {
    return subcategories.filter(sub => sub.parent_id === parentId)
  }

  const toggleCategory = (categorySlug: string, isRoot: boolean = false, parentId?: string) => {
    const current = data.service_categories || []
    let updated = [...current]
    
    // Check if this is a root category
    const rootCategory = categories.find(c => c.slug === categorySlug)
    
    if (rootCategory) {
      // Toggling a ROOT category
      if (current.includes(categorySlug)) {
        // Unselecting root - also unselect all its subcategories
        const subsToRemove = subcategories
          .filter(sub => sub.parent_id === rootCategory.id)
          .map(sub => sub.slug)
        updated = updated.filter(slug => slug !== categorySlug && !subsToRemove.includes(slug))
      } else {
        // Selecting root - also select all its subcategories
        const subsToAdd = subcategories
          .filter(sub => sub.parent_id === rootCategory.id)
          .map(sub => sub.slug)
        updated = [...updated, categorySlug, ...subsToAdd]
      }
    } else {
      // Toggling a SUBCATEGORY
      const subcategory = subcategories.find(sub => sub.slug === categorySlug)
      
      if (subcategory) {
        if (current.includes(categorySlug)) {
          // Unselecting subcategory
          updated = updated.filter(slug => slug !== categorySlug)
          
          // Check if this was the last selected subcategory for this parent
          const parentCategory = categories.find(c => c.id === subcategory.parent_id)
          if (parentCategory) {
            const siblingSubs = subcategories.filter(sub => sub.parent_id === subcategory.parent_id)
            const selectedSiblings = siblingSubs.filter(sub => updated.includes(sub.slug))
            
            // If no subcategories selected, unselect parent too
            if (selectedSiblings.length === 0) {
              updated = updated.filter(slug => slug !== parentCategory.slug)
            }
          }
        } else {
          // Selecting subcategory - also select parent if not already selected
          updated = [...updated, categorySlug]
          
          const parentCategory = categories.find(c => c.id === subcategory.parent_id)
          if (parentCategory && !updated.includes(parentCategory.slug)) {
            updated = [...updated, parentCategory.slug]
          }
        }
      }
    }
    
    // Auto-update skills with selected subcategories
    const selectedSubcategories = subcategories
      .filter(sub => updated.includes(sub.slug))
      .map(sub => sub.name)
    
    onChange({ 
      service_categories: updated,
      skills: selectedSubcategories
    })
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Filter categories based on search
  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('onboarding.step1.title')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {t('onboarding.step1.subtitle')}
        </p>
      </div>

      {/* Service Categories */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          {t('onboarding.step1.chooseServices')} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t('onboarding.step1.tapCategories')} ({selectedCount} {t('common.selected')})
        </p>

        {/* Search Box */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('onboarding.step1.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Scrollable Categories Container */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-96 overflow-y-auto bg-white dark:bg-slate-800">
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
                const rootSelected = (data.service_categories || []).includes(rootCategory.slug)
                const selectedSubsCount = subs.filter((sub: any) => 
                  (data.service_categories || []).includes(sub.slug)
                ).length
                const isPartiallySelected = selectedSubsCount > 0 && selectedSubsCount < subs.length && !rootSelected

                return (
                  <div key={rootCategory.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    {/* Root Category Header */}
                    <div className="flex items-center gap-3 p-3">
                      {/* Checkbox with indeterminate state */}
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rootSelected}
                          onChange={() => toggleCategory(rootCategory.slug)}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        {isPartiallySelected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2.5 h-0.5 bg-emerald-600 rounded"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Category Name */}
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpansion(rootCategory.id)}
                        className="flex-1 flex items-center justify-between text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <span>{rootCategory.name}</span>
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
                    </div>

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
                                  onChange={() => toggleCategory(sub.slug)}
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

        {/* Selected Categories Summary */}
        {selectedCount > 0 && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              {t('onboarding.step1.selectedServiceCategories')} ({categories.filter(c => (data.service_categories || []).includes(c.slug)).length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {(data.service_categories || [])
                .filter((slug: string) => categories.some(c => c.slug === slug))
                .map((slug: string) => {
                  const category = categories.find(c => c.slug === slug)
                  return category ? (
                    <span
                      key={slug}
                      onClick={() => toggleCategory(slug)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-md text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                    >
                      {category.name}
                      <X className="h-3 w-3" />
                    </span>
                  ) : null
                })}
            </div>
          </div>
        )}
      </div>

      {/* Skills - Auto-populated from selected subcategories */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('onboarding.step1.yourSkills')} <span className="text-red-500">*</span>
        </label>
        <div className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-[80px]">
          {(data.skills || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(data.skills || []).map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic">{t('onboarding.step1.selectSubcategories')}</p>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">{t('onboarding.step1.autoFilled')}</p>
      </div>

      {/* Specialization */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('onboarding.step1.specialization')}
        </label>
        <textarea
          value={data.skills_specialization || ''}
          onChange={(e) => onChange({ skills_specialization: e.target.value })}
          placeholder={t('onboarding.step1.specializationPlaceholder')}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          rows={2}
        />
      </div>

      {/* Experience & Rate */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('onboarding.step1.yearsExperience')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={data.experience_years || ''}
          onChange={(e) => onChange({ experience_years: parseInt(e.target.value) || 0 })}
          min="0"
          max="50"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="5"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!data.service_categories?.length || !data.skills?.length || !data.experience_years}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {t('onboarding.step1.continueToLocation')}
        <ChevronRight className="h-5 w-5" />
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

  const detectLocation = async () => {
    setDetecting(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError(t('onboarding.step2.geoNotSupported'))
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`, { cache: 'no-store' })
          if (response.ok) {
            const geo = await response.json()
            const formattedAddress = geo.formatted_address || ''
            const detectedPincode = geo.pincode || ''

            onChange({
              address: formattedAddress,
              pincode: detectedPincode,
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            })

            toast.success(t('onboarding.step2.locationDetected'))
          } else {
            onChange({
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            })
            toast.success(t('onboarding.step2.coordsSavedEnterManual'))
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          onChange({
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          })
          toast.success(t('onboarding.step2.coordsSaved'))
          setLocationError(t('onboarding.step2.enterAddressManually'))
        }
        
        setDetecting(false)
      },
      (error) => {
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
        
        setLocationError(errorMessage)
        setDetecting(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
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
    
    if (!data.service_radius_km || data.service_radius_km < 1) {
      setValidationError(t('onboarding.step2.radiusRequired'))
      toast.error(t('onboarding.step2.selectRadius'))
      return
    }
    
    onNext()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('onboarding.step2.title')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {t('onboarding.step2.subtitle')}
        </p>
      </div>

      {validationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* ===== SECTION 1: YOUR ADDRESS ===== */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300">
              {t('onboarding.step2.yourAddress')}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {t('onboarding.step2.whereYouAreBased')}
            </p>
          </div>
        </div>

        {/* Auto-Detect Location Button */}
        <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {t('onboarding.step2.autoDetect')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('onboarding.step2.autoDetectDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
          </div>
          {locationError && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              {locationError}
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('onboarding.step2.fullAddress')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.address || ''}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder={t('onboarding.step2.addressPlaceholder')}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('onboarding.step2.addressTip')}
          </p>
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('onboarding.step2.pincode')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.pincode || ''}
            onChange={(e) => onChange({ pincode: e.target.value })}
            maxLength={10}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="400001"
          />
        </div>

        {/* Coordinates (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('onboarding.step2.latitudeOptional')}
            </label>
            <input
              type="number"
              value={data.latitude || ''}
              onChange={(e) => onChange({ latitude: parseFloat(e.target.value) || null })}
              step="0.000001"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="19.0760"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('onboarding.step2.longitudeOptional')}
            </label>
            <input
              type="number"
              value={data.longitude || ''}
              onChange={(e) => onChange({ longitude: parseFloat(e.target.value) || null })}
              step="0.000001"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="72.8777"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-4 border-dashed border-slate-300 dark:border-slate-600"></div>

      {/* ===== SECTION 2: SERVICE RADIUS (Rapido-style) ===== */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
              {t('onboarding.step2.workRadius')}
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {t('onboarding.step2.workRadiusDesc')}
            </p>
          </div>
        </div>

        {/* Radius Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-600 rounded-full flex-shrink-0">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {t('onboarding.step2.howItWorks')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {t('onboarding.step2.radiusExplanation')}
              </p>
            </div>
          </div>
        </div>

        {/* Radius Preset Buttons */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            {t('onboarding.step2.selectWorkRadius')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {radiusOptions.map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => onChange({ service_radius_km: radius })}
                className={`py-3 px-4 rounded-xl font-semibold text-center transition-all ${
                  data.service_radius_km === radius
                    ? 'bg-emerald-600 text-white shadow-lg scale-105 ring-2 ring-emerald-400'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
              >
                {radius} {t('onboarding.step2.km')}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Radius Input */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('onboarding.step2.orEnterCustom')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={data.service_radius_km || ''}
              onChange={(e) => onChange({ service_radius_km: parseInt(e.target.value) || 10 })}
              min="1"
              max="100"
              className="w-32 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center font-semibold"
              placeholder="10"
            />
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t('onboarding.step2.kilometers')}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{t('onboarding.step2.radiusRange')}</p>
        </div>

        {/* Current Selection Summary */}
        {data.service_radius_km && (
          <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-full">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                  {t('onboarding.step2.radiusSelected', { radius: data.service_radius_km })}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {t('onboarding.step2.radiusSelectedDesc')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          {t('common.back')}
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {t('onboarding.step2.continueToAvailability')}
          <ChevronRight className="h-5 w-5" />
        </button>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('onboarding.step3.title')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {t('onboarding.step3.subtitle')}
        </p>
      </div>

      {/* Working Hours */}
      <div className="space-y-3">
        {days.map((day) => {
          const hours = workingHours[day] || defaultHours
          return (
            <div key={day} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours.available !== false}
                    onChange={() => toggleDay(day)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-900 dark:text-white">{t(`day.${day}`)}</span>
                </label>
              </div>
              
              {hours.available !== false && (
                <div className="grid grid-cols-2 gap-4 ml-8">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('onboarding.step3.startTime')}</label>
                    <input
                      type="time"
                      value={hours.start || '09:00'}
                      onChange={(e) => updateTime(day, 'start', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('onboarding.step3.endTime')}</label>
                    <input
                      type="time"
                      value={hours.end || '18:00'}
                      onChange={(e) => updateTime(day, 'end', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Availability Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('onboarding.step3.availableNow')}</span>
          <input
            type="checkbox"
            checked={data.is_available_now !== false}
            onChange={(e) => onChange({ is_available_now: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('onboarding.step3.emergencyAvailability')}</span>
          <input
            type="checkbox"
            checked={data.emergency_availability === true}
            onChange={(e) => onChange({ emergency_availability: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          {t('common.back')}
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {t('onboarding.step3.continueToBankDetails')}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Step 4: Bank Account Details
function Step4BankAccount({ data, onChange, onNext, onBack, t }: any) {
  const [accountType, setAccountType] = useState<'bank' | 'upi'>('bank')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('onboarding.step4.title')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {t('onboarding.step4.subtitle')}
        </p>
      </div>

      {/* IMPORTANT NOTE */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">{t('onboarding.step4.important')}</h3>
            <p className="text-green-50 text-sm leading-relaxed">
              {t('onboarding.step4.importantDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Account Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          {t('onboarding.step4.paymentMethod')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setAccountType('bank')}
            className={`p-4 rounded-lg border-2 transition-all ${
              accountType === 'bank'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <div className="font-medium">{t('onboarding.step4.bankAccount')}</div>
            <div className="text-xs text-slate-500 mt-1">{t('onboarding.step4.neftImps')}</div>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('upi')}
            className={`p-4 rounded-lg border-2 transition-all ${
              accountType === 'upi'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <div className="font-medium">{t('onboarding.step4.upiId')}</div>
            <div className="text-xs text-slate-500 mt-1">{t('onboarding.step4.instantPayment')}</div>
          </button>
        </div>
      </div>

      {accountType === 'bank' ? (
        <div className="space-y-4">
          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('onboarding.step4.accountHolderName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.account_holder_name || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, account_holder_name: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder={t('onboarding.step4.placeholders.accountHolderName')}
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('onboarding.step4.accountNumber')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.account_number || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, account_number: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder={t('onboarding.step4.placeholders.accountNumber')}
            />
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('onboarding.step4.ifscCode')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.ifsc_code || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, ifsc_code: e.target.value.toUpperCase() }
              })}
              maxLength={11}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
              placeholder={t('onboarding.step4.placeholders.ifsc')}
            />
          </div>

          {/* Bank Name & Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('onboarding.step4.bankName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.bank_account?.bank_name || ''}
                onChange={(e) => onChange({ 
                  bank_account: { ...data.bank_account, bank_name: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('onboarding.step4.placeholders.bankName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('onboarding.step4.branchName')}
              </label>
              <input
                type="text"
                value={data.bank_account?.branch_name || ''}
                onChange={(e) => onChange({ 
                  bank_account: { ...data.bank_account, branch_name: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('onboarding.step4.placeholders.branchName')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('onboarding.step4.upiId')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.bank_account?.upi_id || ''}
            onChange={(e) => onChange({ 
              bank_account: { ...data.bank_account, upi_id: e.target.value }
            })}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder={t('onboarding.step4.placeholders.upi')}
          />
          <p className="text-xs text-slate-500 mt-1">{t('onboarding.step4.upiHelp')}</p>
        </div>
      )}

      {/* Real-time Validation Feedback */}
      {accountType === 'bank' && data.bank_account?.account_number && data.bank_account?.ifsc_code && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Account Details Captured</strong><br />
              {data.bank_account.bank_name && `Bank: ${data.bank_account.bank_name}`}<br />
              Account ending in ...{data.bank_account.account_number.slice(-4)}
            </div>
          </div>
        </div>
      )}

      {accountType === 'upi' && data.bank_account?.upi_id && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>UPI ID Captured</strong><br />
              {data.bank_account.upi_id}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          {t('common.back')}
        </button>
        <button
          onClick={onNext}
          disabled={
            accountType === 'bank' 
              ? !data.bank_account?.account_holder_name || !data.bank_account?.account_number || !data.bank_account?.ifsc_code || !data.bank_account?.bank_name
              : !data.bank_account?.upi_id
          }
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {t('onboarding.step4.continueToDocuments')}
          <ChevronRight className="h-5 w-5" />
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

  const documentTypes = [
    { key: 'id_proof', label: t('onboarding.step5.idProof'), description: t('onboarding.step5.idProofDesc') },
    { key: 'address_proof', label: t('onboarding.step5.addressProof'), description: t('onboarding.step5.addressProofDesc') },
    { key: 'professional_cert', label: t('onboarding.step5.professionalCert'), description: t('onboarding.step5.professionalCertDesc') },
    { key: 'photo', label: t('onboarding.step5.photo'), description: t('onboarding.step5.photoDesc') },
  ]

  const handleSelectFile = (docKey: string, file: File) => {
    setFiles(prev => ({ ...prev, [docKey]: file }))
    const updated = { ...data.documents, [docKey]: file.name }
    onChange({ documents: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('onboarding.step5.title')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {t('onboarding.step5.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        {documentTypes.map((docType) => (
          <div key={docType.key} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 dark:text-white mb-1">{docType.label}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{docType.description}</p>
              </div>
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
                <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${files[docType.key] ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}> 
                  <Upload className="h-4 w-4" />
                  {files[docType.key] ? t('onboarding.step5.selected') : t('onboarding.step5.selectFile')}
                </div>
              </label>
            </div>
            {files[docType.key] && (
              <p className="mt-2 text-xs text-green-600 truncate">{files[docType.key]?.name}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>{t('common.note')}</strong> {t('onboarding.step5.note')}
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          {t('common.back')}
        </button>
        <button
          onClick={() => onSubmit(files)}
          disabled={submitting || !files.id_proof || !files.photo}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <LoadingSpinner size="sm" />
              {t('onboarding.step5.submitting')}
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              {t('onboarding.step5.completeOnboarding')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Main Onboarding Component
export default function HelperOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>({
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

  const checkOnboardingStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('*')
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
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error(t('onboarding.toast.loginRequired'))
      setSubmitting(false)
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
        setSubmitting(false)
        return
      }
      toast.success(t('onboarding.toast.documentsUploaded'))
    }

    // Save complete onboarding data
    const result = await completeHelperOnboarding({
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
      setSubmitting(false)
      return
    }

    toast.success(result.message || t('onboarding.toast.completeDefault'))
    setTimeout(() => {
      router.push('/helper/dashboard')
    }, 2000)
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-teal-950 dark:to-emerald-950 py-8 px-4">
      {/* Language Selector Modal - shows on first visit */}
      {showLanguageModal && (
        <LanguageSelectorModal 
          forceShow={true}
          onClose={() => setShowLanguageModal(false)} 
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Language Button - top right */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowLanguageModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
            title={t('language.changeLanguage')}
          >
            <span className="text-lg">{languageInfo?.flag}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {languageInfo?.nativeName}
            </span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? 'bg-green-600 border-green-600 text-white'
                        : isActive
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <span className={`text-xs mt-2 font-medium hidden md:block ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
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
