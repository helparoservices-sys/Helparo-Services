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

// Step 1: Service Details
function Step1ServiceDetails({ data, onChange, onNext }: any) {
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
          Service Details
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Tell us about the services you provide
        </p>
      </div>

      {/* Service Categories */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Service Categories <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Search and select the services you provide ({selectedCount} selected)
        </p>

        {/* Search Box */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Scrollable Categories Container */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-96 overflow-y-auto bg-white dark:bg-slate-800">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
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
                          className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        {isPartiallySelected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2.5 h-0.5 bg-purple-600 rounded"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Category Name */}
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpansion(rootCategory.id)}
                        className="flex-1 flex items-center justify-between text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <span>{rootCategory.name}</span>
                        <div className="flex items-center gap-2">
                          {selectedSubsCount > 0 && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
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
                                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
              Selected Service Categories ({categories.filter(c => (data.service_categories || []).includes(c.slug)).length}):
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
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-md text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors"
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
          Your Skills <span className="text-red-500">*</span>
        </label>
        <div className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-[80px]">
          {(data.skills || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(data.skills || []).map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic">Select subcategories above to auto-populate skills</p>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">Auto-filled from selected subcategories</p>
      </div>

      {/* Specialization */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Specialization (Optional)
        </label>
        <textarea
          value={(data.skills_specialization || []).join(', ')}
          onChange={(e) => onChange({ skills_specialization: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="e.g., Emergency Repairs, Eco-friendly Solutions"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={2}
        />
      </div>

      {/* Experience & Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.experience_years || ''}
            onChange={(e) => onChange({ experience_years: parseInt(e.target.value) || 0 })}
            min="0"
            max="50"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Hourly Rate (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.hourly_rate || ''}
            onChange={(e) => onChange({ hourly_rate: parseFloat(e.target.value) || 0 })}
            min="0"
            step="50"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="500"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!data.service_categories?.length || !data.skills?.length || !data.experience_years || !data.hourly_rate}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Continue to Location
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

// Step 2: Location & Service Area
function Step2Location({ data, onChange, onNext, onBack }: any) {
  const [detecting, setDetecting] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [validationError, setValidationError] = useState('')
  
  // Service area state with backend filtering
  const [states, setStates] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [serviceAreas, setServiceAreas] = useState<any[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([])
  const [loadingAreas, setLoadingAreas] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadStates()
  }, [])

  const loadStates = async () => {
    setLoadingAreas(true)
    const { data: statesData } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('level', 'state')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('display_order')
    
    setStates(statesData || [])
    setLoadingAreas(false)
  }

  const loadDistricts = async (stateId: string) => {
    setLoadingAreas(true)
    
    // Get all districts for this state
    const { data: allDistricts } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('parent_id', stateId)
      .eq('level', 'district')
      .eq('is_active', true)
      .order('display_order')
    
    if (!allDistricts) {
      setDistricts([])
      setLoadingAreas(false)
      return
    }
    
    // Filter districts that have at least 1 active city
    const districtsWithCities = []
    for (const district of allDistricts) {
      const { count } = await supabase
        .from('service_areas')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', district.id)
        .eq('level', 'city')
        .eq('is_active', true)
      
      if (count && count > 0) {
        districtsWithCities.push(district)
      }
    }
    
    setDistricts(districtsWithCities)
    setLoadingAreas(false)
  }

  const loadCities = async (districtId: string) => {
    setLoadingAreas(true)
    
    // Get all cities for this district
    const { data: allCities } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('parent_id', districtId)
      .eq('level', 'city')
      .eq('is_active', true)
      .order('display_order')
    
    if (!allCities) {
      setCities([])
      setLoadingAreas(false)
      return
    }
    
    // Filter cities that have at least 1 active service area
    const citiesWithAreas = []
    for (const city of allCities) {
      const { count } = await supabase
        .from('service_areas')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', city.id)
        .eq('level', 'area')
        .eq('is_active', true)
      
      if (count && count > 0) {
        citiesWithAreas.push(city)
      }
    }
    
    setCities(citiesWithAreas)
    setLoadingAreas(false)
  }

  const loadServiceAreas = async (cityId: string) => {
    setLoadingAreas(true)
    const { data: areasData } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('parent_id', cityId)
      .eq('level', 'area')
      .eq('is_active', true)
      .order('display_order')
    
    setServiceAreas(areasData || [])
    setLoadingAreas(false)
  }

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId)
    setSelectedDistrict('')
    setSelectedCity('')
    setSelectedServiceAreas([])
    setDistricts([])
    setCities([])
    setServiceAreas([])
    if (stateId) {
      loadDistricts(stateId)
    }
  }

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId)
    setSelectedCity('')
    setSelectedServiceAreas([])
    setCities([])
    setServiceAreas([])
    if (districtId) {
      loadCities(districtId)
    }
  }

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId)
    setSelectedServiceAreas([])
    setServiceAreas([])
    if (cityId) {
      loadServiceAreas(cityId)
    }
  }

  const toggleServiceArea = (areaId: string) => {
    const updated = selectedServiceAreas.includes(areaId)
      ? selectedServiceAreas.filter(id => id !== areaId)
      : [...selectedServiceAreas, areaId]
    setSelectedServiceAreas(updated)
    onChange({ service_area_ids: updated })
  }

  const detectLocation = async () => {
    setDetecting(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          let geoData = null
          
          try {
            const response1 = await fetch(
              `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
            )
            if (response1.ok) {
              geoData = await response1.json()
            }
          } catch (err) {
            console.log('geocode.maps.co failed, trying nominatim')
          }

          if (!geoData || !geoData.address) {
            const response2 = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'HelparoServices/1.0',
                  'Accept-Language': 'en'
                }
              }
            )
            if (response2.ok) {
              geoData = await response2.json()
            }
          }
          
          if (geoData && geoData.address) {
            const addr = geoData.address
            const formattedAddress = geoData.display_name || [
              addr.house_number,
              addr.road || addr.street,
              addr.suburb || addr.neighbourhood || addr.locality,
              addr.city || addr.town || addr.village || addr.municipality,
              addr.state || addr.region,
              addr.postcode || addr.postal_code
            ].filter(Boolean).join(', ')

            onChange({
              address: formattedAddress,
              pincode: (addr.postcode || addr.postal_code || ''),
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            })

            toast.success('✓ Location detected and address filled successfully!')
          } else {
            onChange({
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            })
            toast.success('Coordinates saved! Please enter address manually.')
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          onChange({
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          })
          toast.success('Location coordinates saved!')
          setLocationError('Please enter your address manually in the field below.')
        }
        
        setDetecting(false)
      },
      (error) => {
        let errorMessage = 'Failed to detect location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
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
      setValidationError('Full Address is required')
      toast.error('Please enter your full address')
      return
    }
    
    if (!data.pincode?.trim()) {
      setValidationError('Pincode is required')
      toast.error('Please enter your pincode')
      return
    }
    
    if (!selectedServiceAreas.length) {
      setValidationError('Please select at least one service area')
      toast.error('Please select at least one service area where you provide services')
      return
    }
    
    onNext()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Location & Service Area
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Where do you provide your services?
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
              Your Address
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Where you are based
            </p>
          </div>
        </div>

        {/* Auto-Detect Location Button */}
        <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Auto-Detect Your Location
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Allow location access to automatically fill your address details
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
                  Detecting...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Detect
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
            Full Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.address || ''}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Enter your complete address"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Pincode & Service Radius */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pincode <span className="text-red-500">*</span>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Service Radius (km) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={data.service_radius_km || 10}
              onChange={(e) => onChange({ service_radius_km: parseInt(e.target.value) || 10 })}
              min="1"
              max="100"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10"
            />
            <p className="text-xs text-slate-500 mt-1">How far you can travel for jobs</p>
          </div>
        </div>

        {/* Coordinates (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Latitude (Optional)
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
              Longitude (Optional)
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

      {/* ===== SECTION 2: SERVICE AREAS ===== */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-600 rounded-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300">
              Service Areas
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Where you provide services (select cities)
            </p>
          </div>
        </div>

        {/* Cascading Selectors */}
        <div className="space-y-4">
          {/* State Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select State <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={loadingAreas}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">-- Select State --</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>{state.name}</option>
              ))}
            </select>
          </div>

          {/* District Selector (only visible when state selected) */}
          {selectedState && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select District <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={loadingAreas || !districts.length}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Select District --</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
              {!loadingAreas && !districts.length && (
                <p className="text-xs text-slate-500 mt-1">No districts available for this state</p>
              )}
            </div>
          )}

          {/* City Selector (only visible when district selected) */}
          {selectedDistrict && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select City <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={loadingAreas || !cities.length}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Select City --</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              {!loadingAreas && !cities.length && (
                <p className="text-xs text-slate-500 mt-1">No cities available for this district</p>
              )}
            </div>
          )}

          {/* Service Area Multi-Selector (only visible when city selected) */}
          {selectedCity && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Service Areas <span className="text-red-500">*</span> ({selectedServiceAreas.length} selected)
              </label>
              <div className="max-h-60 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {loadingAreas ? (
                  <div className="p-4 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent mx-auto mb-2"></div>
                    Loading service areas...
                  </div>
                ) : serviceAreas.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No service areas available for this city
                  </div>
                ) : (
                  serviceAreas.map((area) => (
                    <label
                      key={area.id}
                      className="flex items-center gap-3 p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServiceAreas.includes(area.id)}
                        onChange={() => toggleServiceArea(area.id)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-900 dark:text-white">{area.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Service Areas Summary */}
        {selectedServiceAreas.length > 0 && (
          <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
              ✓ Service Areas Selected ({selectedServiceAreas.length} areas)
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedServiceAreas.map((areaId) => {
                const area = serviceAreas.find(a => a.id === areaId)
                return area ? (
                  <span
                    key={areaId}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 border border-purple-400 dark:border-purple-600 rounded-full text-xs text-purple-700 dark:text-purple-300 font-medium"
                  >
                    {area.name}
                    <button onClick={() => toggleServiceArea(areaId)} className="hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null
              })}
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
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          Continue to Availability
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Step 3: Working Hours & Availability
function Step3Availability({ data, onChange, onNext, onBack }: any) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels: any = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }

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
          Working Hours & Availability
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Set your weekly schedule and availability preferences
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
                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-medium text-slate-900 dark:text-white">{dayLabels[day]}</span>
                </label>
              </div>
              
              {hours.available !== false && (
                <div className="grid grid-cols-2 gap-4 ml-8">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={hours.start || '09:00'}
                      onChange={(e) => updateTime(day, 'start', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">End Time</label>
                    <input
                      type="time"
                      value={hours.end || '18:00'}
                      onChange={(e) => updateTime(day, 'end', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Available Now</span>
          <input
            type="checkbox"
            checked={data.is_available_now !== false}
            onChange={(e) => onChange({ is_available_now: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Emergency Services</span>
          <input
            type="checkbox"
            checked={data.emergency_availability === true}
            onChange={(e) => onChange({ emergency_availability: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
          />
        </label>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          Continue to Bank Details
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Step 4: Bank Account Details
function Step4BankAccount({ data, onChange, onNext, onBack }: any) {
  const [accountType, setAccountType] = useState<'bank' | 'upi'>('bank')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Bank Account Details
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Add your bank account to receive payments
        </p>
      </div>

      {/* IMPORTANT NOTE */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">💰 Important: Payment Information</h3>
            <p className="text-green-50 text-sm leading-relaxed">
              All your earnings from completed jobs will be <strong>directly credited to this bank account</strong>. 
              Please ensure the details are accurate to avoid payment delays.
            </p>
          </div>
        </div>
      </div>

      {/* Account Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Preferred Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setAccountType('bank')}
            className={`p-4 rounded-lg border-2 transition-all ${
              accountType === 'bank'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
            }`}
          >
            <div className="font-medium">Bank Account</div>
            <div className="text-xs text-slate-500 mt-1">NEFT/IMPS Transfer</div>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('upi')}
            className={`p-4 rounded-lg border-2 transition-all ${
              accountType === 'upi'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
            }`}
          >
            <div className="font-medium">UPI ID</div>
            <div className="text-xs text-slate-500 mt-1">Instant Payment</div>
          </button>
        </div>
      </div>

      {accountType === 'bank' ? (
        <div className="space-y-4">
          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.account_holder_name || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, account_holder_name: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="As per bank records"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.account_number || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, account_number: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter account number"
            />
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              IFSC Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.bank_account?.ifsc_code || ''}
              onChange={(e) => onChange({ 
                bank_account: { ...data.bank_account, ifsc_code: e.target.value.toUpperCase() }
              })}
              maxLength={11}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
              placeholder="SBIN0001234"
            />
          </div>

          {/* Bank Name & Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.bank_account?.bank_name || ''}
                onChange={(e) => onChange({ 
                  bank_account: { ...data.bank_account, bank_name: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="State Bank of India"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Branch Name
              </label>
              <input
                type="text"
                value={data.bank_account?.branch_name || ''}
                onChange={(e) => onChange({ 
                  bank_account: { ...data.bank_account, branch_name: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Andheri West"
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            UPI ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.bank_account?.upi_id || ''}
            onChange={(e) => onChange({ 
              bank_account: { ...data.bank_account, upi_id: e.target.value }
            })}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="yourname@paytm"
          />
          <p className="text-xs text-slate-500 mt-1">Enter your UPI ID (e.g., 9876543210@paytm)</p>
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
          Back
        </button>
        <button
          onClick={onNext}
          disabled={
            accountType === 'bank' 
              ? !data.bank_account?.account_holder_name || !data.bank_account?.account_number || !data.bank_account?.ifsc_code || !data.bank_account?.bank_name
              : !data.bank_account?.upi_id
          }
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue to Documents
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Step 5: Document Upload
function Step5Documents({ data, onChange, onSubmit, onBack, submitting }: any) {
  // Local file states (upload deferred until final submit)
  const [files, setFiles] = useState<Record<string, File | null>>({
    id_proof: null,
    address_proof: null,
    professional_cert: null,
    photo: null,
  })

  const documentTypes = [
    { key: 'id_proof', label: 'ID Proof', description: 'Aadhaar, PAN, Driving License (Required)' },
    { key: 'address_proof', label: 'Address Proof', description: 'Utility bill, Rental agreement (Optional but recommended)' },
    { key: 'professional_cert', label: 'Professional Certificate', description: 'Trade license, certificates (Optional)' },
    { key: 'photo', label: 'Profile Photo', description: 'Clear photo of yourself (Required)' },
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
          Verification Documents
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Upload documents to verify your identity
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
                <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${files[docType.key] ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-purple-600 text-white hover:bg-purple-700'}`}> 
                  <Upload className="h-4 w-4" />
                  {files[docType.key] ? 'Selected' : 'Select File'}
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
          <strong>Note:</strong> At least ID proof and photo are required. Your profile will be reviewed within 24-48 hours.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <button
          onClick={() => onSubmit(files)}
          disabled={submitting || !files.id_proof || !files.photo}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <LoadingSpinner size="sm" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              Complete Onboarding
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
    skills_specialization: [],
    experience_years: 0,
    hourly_rate: 0,
    address: '',
    pincode: '',
    service_radius_km: 10,
    service_areas: [],
    service_area_ids: [],
    latitude: null,
    longitude: null,
    working_hours: {},
    is_available_now: true,
    emergency_availability: false,
    bank_account: {},
    documents: {}
  })
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)

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

    // If already onboarded, redirect to dashboard
    if (profile?.address && profile?.service_categories?.length > 0) {
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
      toast.error('Please login to continue')
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
    }

    // Then, save helper profile
    const { error: profileError } = await supabase
      .from('helper_profiles')
      .upsert({
        user_id: user.id,
        service_categories: formData.service_categories,
        skills: formData.skills,
        skills_specialization: formData.skills_specialization,
        experience_years: formData.experience_years,
        hourly_rate: formData.hourly_rate,
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
        verification_status: 'pending',
        is_approved: false,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      toast.error('Failed to save profile: ' + profileError.message)
      setSubmitting(false)
      return
    }

    // Save bank account details
    if (formData.bank_account?.account_number || formData.bank_account?.upi_id) {
      const { error: bankError } = await supabase
        .from('helper_bank_accounts')
        .insert({
          helper_id: user.id,
          account_holder_name: formData.bank_account.account_holder_name || '',
          account_number: formData.bank_account.account_number || null,
          ifsc_code: formData.bank_account.ifsc_code || null,
          bank_name: formData.bank_account.bank_name || null,
          branch_name: formData.bank_account.branch_name || null,
          upi_id: formData.bank_account.upi_id || null,
          is_primary: true,
          status: 'pending_verification'
        })

      if (bankError) {
        toast.error('Failed to save bank details: ' + bankError.message)
        setSubmitting(false)
        return
      }
    }

    toast.success('Onboarding complete! Documents submitted for verification review.')
    router.push('/helper/dashboard')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const steps = [
    { number: 1, title: 'Service Details', icon: Briefcase },
    { number: 2, title: 'Location', icon: MapPin },
    { number: 3, title: 'Availability', icon: Clock },
    { number: 4, title: 'Bank Details', icon: CreditCard },
    { number: 5, title: 'Documents', icon: Upload },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <span className={`text-xs mt-2 font-medium hidden md:block ${
                      isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'
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
            />
          )}
          {currentStep === 2 && (
            <Step2Location
              data={formData}
              onChange={updateFormData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <Step3Availability
              data={formData}
              onChange={updateFormData}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 4 && (
            <Step4BankAccount
              data={formData}
              onChange={updateFormData}
              onNext={() => setCurrentStep(5)}
              onBack={() => setCurrentStep(3)}
            />
          )}
          {currentStep === 5 && (
            <Step5Documents
              data={formData}
              onChange={updateFormData}
              onSubmit={handleSubmit}
              onBack={() => setCurrentStep(4)}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  )
}
