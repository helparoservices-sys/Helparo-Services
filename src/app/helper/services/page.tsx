'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperServices, updateHelperProfileServices } from '@/app/actions/helper-services'
import { Briefcase, Clock, MapPin, Award, Star, Edit2, Save, X, AlertCircle, ChevronDown, ChevronRight, Search, Radius } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface HelperProfile {
  service_categories: string[]
  skills: string[]
  service_radius_km: number
  experience_years: number
  working_hours: any
  service_areas: string[]
  address: string
  pincode: string
}

// Map to store UUID -> name resolution
interface CategoryNameMap {
  [key: string]: string
}

export default function HelperServicesPage() {
  const [profile, setProfile] = useState<HelperProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState(false)

  // Category & Subcategory state
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryNameMap, setCategoryNameMap] = useState<CategoryNameMap>({})
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Service area state
  const [states, setStates] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [serviceAreas, setServiceAreas] = useState<any[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [selectedServiceAreaIds, setSelectedServiceAreaIds] = useState<string[]>([])

  // Edit state
  const [editedServiceRadius, setEditedServiceRadius] = useState(10)
  const [editedExperience, setEditedExperience] = useState(0)
  const [editedSkills, setEditedSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [editedWorkingHours, setEditedWorkingHours] = useState<any>({})
  const [editedServiceCategories, setEditedServiceCategories] = useState<string[]>([])
  const [editedServiceAreas, setEditedServiceAreas] = useState<string[]>([])
  const [editedServiceAreaIds, setEditedServiceAreaIds] = useState<string[]>([])

  useEffect(() => {
    loadData()
    loadCategories()
    loadServiceAreaData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setErrorMessage(null)

    const result = await getHelperServices()

    if ('error' in result && result.error) {
      setErrorMessage(result.error)
      toast.error(result.error)
      setIsApproved(false)
    } else if ('data' in result && result.data?.helperProfile) {
      const profileData = result.data.helperProfile
      
      // Resolve category names from UUIDs
      const supabase = createClient()
      if (profileData.service_categories && profileData.service_categories.length > 0) {
        // Try to resolve by both UUID and slug format
        const categoryIds = profileData.service_categories.map((cat: string) => {
          // Convert space-separated hex to UUID format if needed
          // e.g., "10000000 0000 0000 0000 000000000001" -> "10000000-0000-0000-0000-000000000001"
          if (cat.includes(' ')) {
            return cat.replace(/ /g, '-').toLowerCase()
          }
          return cat
        })
        
        const { data: categoriesData } = await supabase
          .from('service_categories')
          .select('id, name, slug')
        
        if (categoriesData) {
          const nameMap: CategoryNameMap = {}
          categoriesData.forEach(cat => {
            nameMap[cat.id] = cat.name
            nameMap[cat.slug] = cat.name
            // Also map without dashes for the space-separated format
            nameMap[cat.id.replace(/-/g, ' ')] = cat.name
          })
          setCategoryNameMap(nameMap)
        }
      }
      
      setProfile(profileData)
      setIsApproved(true)
      
      // Initialize edit state
      setEditedServiceRadius(profileData.service_radius_km || 10)
      setEditedExperience(profileData.experience_years)
      setEditedSkills(profileData.skills || [])
      setEditedWorkingHours(profileData.working_hours || {})
      setEditedServiceCategories(profileData.service_categories || [])
      setEditedServiceAreas(profileData.service_areas || [])
      
      // Load service area IDs from area names
      if (profileData.service_areas && profileData.service_areas.length > 0) {
        const { data: areaData } = await supabase
          .from('service_areas')
          .select('id')
          .in('name', profileData.service_areas)
        
        if (areaData) {
          setEditedServiceAreaIds(areaData.map(a => a.id))
        }
      }
    }

    setLoading(false)
  }

  const loadCategories = async () => {
    setCategoriesLoading(true)
    try {
      const supabase = createClient()
      
      const { data: rootCategories, error: rootError } = await supabase
        .from('service_categories')
        .select('id, name, slug')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (rootError) {
        console.error('Error loading root categories:', rootError)
      }

      const { data: allSubcategories, error: subError } = await supabase
        .from('service_categories')
        .select('id, name, slug, parent_id')
        .not('parent_id', 'is', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (subError) {
        console.error('Error loading subcategories:', subError)
      }

      console.log('Loaded categories:', rootCategories?.length, 'subcategories:', allSubcategories?.length)

      setCategories(rootCategories || [])
      setSubcategories(allSubcategories || [])
      
      // Build category name map for UUID -> name resolution
      const nameMap: CategoryNameMap = {}
      rootCategories?.forEach(cat => {
        nameMap[cat.id] = cat.name
        nameMap[cat.slug] = cat.name
      })
      allSubcategories?.forEach(cat => {
        nameMap[cat.id] = cat.name
        nameMap[cat.slug] = cat.name
      })
      setCategoryNameMap(nameMap)
    } catch (err) {
      console.error('Error in loadCategories:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadServiceAreaData = async () => {
    const supabase = createClient()
    
    const { data: statesData } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('level', 'state')
      .eq('is_active', true)
      .order('display_order')
    
    setStates(statesData || [])
  }

  const loadDistricts = async (stateId: string) => {
    setLoadingAreas(true)
    const supabase = createClient()
    
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
    const supabase = createClient()
    
    const { data: citiesData } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('parent_id', districtId)
      .eq('level', 'city')
      .eq('is_active', true)
      .order('display_order')
    
    setCities(citiesData || [])
    setLoadingAreas(false)
  }

  const loadServiceAreas = async (cityId: string) => {
    setLoadingAreas(true)
    const supabase = createClient()
    
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

  const handleSave = async () => {
    setSaving(true)

    const result = await updateHelperProfileServices({
      service_categories: editedServiceCategories,
      service_radius_km: editedServiceRadius,
      experience_years: editedExperience,
      skills: editedSkills,
      working_hours: editedWorkingHours,
      service_areas: editedServiceAreas,
      service_area_ids: editedServiceAreaIds,
    })

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Services updated successfully')
      setEditing(false)
      loadData()
    }

    setSaving(false)
  }

  const cancelEdit = async () => {
    if (profile) {
      setEditedServiceRadius(profile.service_radius_km || 10)
      setEditedExperience(profile.experience_years)
      setEditedSkills(profile.skills || [])
      setEditedWorkingHours(profile.working_hours || {})
      setEditedServiceCategories(profile.service_categories || [])
      setEditedServiceAreas(profile.service_areas || [])
      
      // Reload service area IDs
      if (profile.service_areas && profile.service_areas.length > 0) {
        const supabase = createClient()
        const { data: areaData } = await supabase
          .from('service_areas')
          .select('id')
          .in('name', profile.service_areas)
        
        if (areaData) {
          setEditedServiceAreaIds(areaData.map(a => a.id))
        }
      } else {
        setEditedServiceAreaIds([])
      }
    }
    setEditing(false)
  }

  const addSkill = () => {
    if (newSkill.trim() && !editedSkills.includes(newSkill.trim())) {
      setEditedSkills([...editedSkills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setEditedSkills(editedSkills.filter(s => s !== skill))
  }

  const toggleCategory = (categorySlug: string) => {
    const rootCategory = categories.find(c => c.slug === categorySlug)
    let updated = [...editedServiceCategories]
    
    if (rootCategory) {
      if (updated.includes(categorySlug)) {
        const subsToRemove = subcategories
          .filter(sub => sub.parent_id === rootCategory.id)
          .map(sub => sub.slug)
        updated = updated.filter(slug => slug !== categorySlug && !subsToRemove.includes(slug))
      } else {
        const subsToAdd = subcategories
          .filter(sub => sub.parent_id === rootCategory.id)
          .map(sub => sub.slug)
        updated = [...updated, categorySlug, ...subsToAdd]
      }
    } else {
      const subcategory = subcategories.find(sub => sub.slug === categorySlug)
      if (subcategory) {
        if (updated.includes(categorySlug)) {
          updated = updated.filter(slug => slug !== categorySlug)
          const parentCategory = categories.find(c => c.id === subcategory.parent_id)
          if (parentCategory) {
            const siblingSubs = subcategories.filter(sub => sub.parent_id === subcategory.parent_id)
            const selectedSiblings = siblingSubs.filter(sub => updated.includes(sub.slug))
            if (selectedSiblings.length === 0) {
              updated = updated.filter(slug => slug !== parentCategory.slug)
            }
          }
        } else {
          updated = [...updated, categorySlug]
          const parentCategory = categories.find(c => c.id === subcategory.parent_id)
          if (parentCategory && !updated.includes(parentCategory.slug)) {
            updated = [...updated, parentCategory.slug]
          }
        }
      }
    }
    
    setEditedServiceCategories(updated)
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId)
    setSelectedDistrict('')
    setSelectedCity('')
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
    setCities([])
    setServiceAreas([])
    
    if (districtId) {
      loadCities(districtId)
    }
  }

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId)
    setServiceAreas([])
    setSelectedServiceAreaIds([])
    
    if (cityId) {
      loadServiceAreas(cityId)
    }
  }

  const toggleServiceArea = (areaId: string) => {
    setSelectedServiceAreaIds(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const addServiceArea = () => {
    if (!selectedServiceAreaIds.length) {
      toast.error('Please select at least one area')
      return
    }

    // Filter out already added areas
    const newAreaIds = selectedServiceAreaIds.filter(id => !editedServiceAreaIds.includes(id))
    if (newAreaIds.length === 0) {
      toast.error('Selected areas are already added')
      return
    }

    const newAreas = serviceAreas.filter(area => newAreaIds.includes(area.id))
    const newAreaNames = newAreas.map(a => a.name)
    
    setEditedServiceAreas([...editedServiceAreas, ...newAreaNames])
    setEditedServiceAreaIds([...editedServiceAreaIds, ...newAreaIds])
    
    toast.success(`${newAreas.length} area(s) added successfully`)
    
    // Reset selections
    setSelectedState('')
    setSelectedDistrict('')
    setSelectedCity('')
    setDistricts([])
    setCities([])
    setServiceAreas([])
    setSelectedServiceAreaIds([])
  }

  const removeServiceArea = (index: number) => {
    setEditedServiceAreas(editedServiceAreas.filter((_, i) => i !== index))
    setEditedServiceAreaIds(editedServiceAreaIds.filter((_, i) => i !== index))
  }

  const updateWorkingHours = (day: string, field: 'available' | 'start' | 'end', value: any) => {
    setEditedWorkingHours({
      ...editedWorkingHours,
      [day]: {
        ...editedWorkingHours[day],
        [field]: value,
      },
    })
  }

  const formatCategoryName = (slug: string): string => {
    // If it looks like a UUID (with dashes or spaces), return placeholder
    if (slug.match(/^[0-9a-f]{8}[-\s][0-9a-f]{4}[-\s][0-9a-f]{4}[-\s][0-9a-f]{4}[-\s][0-9a-f]{12}$/i)) {
      return 'Service'
    }
    // If it looks like hex without separators
    if (slug.match(/^[0-9a-f]{32}$/i)) {
      return 'Service'
    }
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery || !editing) return true
    const matchesRoot = cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    const subs = subcategories.filter(sub => sub.parent_id === cat.id)
    const matchesSub = subs.some((sub: any) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesRoot || matchesSub
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-4 sm:py-8 px-3 sm:px-4">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 dark:border-slate-700/50 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                My Services
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base mt-0.5 sm:mt-1">View and manage your service offerings</p>
            </div>

          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : errorMessage ? (
          <Card className="bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm border-yellow-200 dark:border-yellow-800 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Verification Required</h3>
                  <p className="text-yellow-800 dark:text-yellow-300 mb-4">{errorMessage}</p>
                  <a 
                    href="/helper/verification" 
                    className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                  >
                    Check Verification Status
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !profile ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/50 dark:border-slate-700 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 dark:text-gray-400">Complete onboarding to view your services</p>
              <a 
                href="/helper/onboarding" 
                className="block mt-4 text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Go to Onboarding
              </a>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Service Categories with Subcategories */}
            <Card className="bg-white dark:bg-slate-800 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  Service Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.service_categories.map((cat, idx) => {
                    // Try multiple formats to resolve the name
                    const resolvedName = categoryNameMap[cat] || 
                                        categoryNameMap[cat.replace(/ /g, '-')] ||
                                        categoryNameMap[cat.toLowerCase()] ||
                                        formatCategoryName(cat)
                    return (
                      <span key={idx} className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                        {resolvedName}
                      </span>
                    )
                  })}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  For any services addition or configurations, contact support{' '}
                  <a href="tel:+919154781126" className="text-green-600 dark:text-green-400 font-medium hover:underline">+91 9154781126</a>
                </p>
              </CardContent>
            </Card>

            {/* Service Radius & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-white dark:bg-slate-800 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                    <Radius className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    Service Radius
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{profile.service_radius_km || 10} km</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">Maximum distance you'll travel for services</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {profile.experience_years === 0 ? 'Less than 1 year' : `${profile.experience_years}+ years`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Skills */}
            <Card className="bg-white dark:bg-slate-800 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                  Skills & Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {editedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Areas */}
            <Card className="bg-white dark:bg-slate-800 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                  Service Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {editedServiceAreas.map((area, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card className="bg-white dark:bg-slate-800 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const hours = editedWorkingHours[day] || { available: false, start: '09:00', end: '18:00' }
                    return (
                      <div key={day} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm capitalize w-20 sm:w-28">{day}</span>
                        <span className={`text-xs sm:text-sm ${hours.available ? 'text-green-700 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          {hours.available ? `${hours.start} - ${hours.end}` : 'Not Available'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
