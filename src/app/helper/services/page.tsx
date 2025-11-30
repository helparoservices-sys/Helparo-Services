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

  // Service area state
  const [states, setStates] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [serviceAreas, setServiceAreas] = useState<any[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

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
      setProfile(profileData)
      setIsApproved(true)
      
      // Initialize edit state
      setEditedServiceRadius(profileData.service_radius_km || 10)
      setEditedExperience(profileData.experience_years)
      setEditedSkills(profileData.skills || [])
      setEditedWorkingHours(profileData.working_hours || {})
      setEditedServiceCategories(profileData.service_categories || [])
      setEditedServiceAreas(profileData.service_areas || [])
    }

    setLoading(false)
  }

  const loadCategories = async () => {
    const supabase = createClient()
    
    const { data: rootCategories } = await supabase
      .from('service_categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    const { data: allSubcategories } = await supabase
      .from('service_categories')
      .select('id, name, slug, parent_id')
      .not('parent_id', 'is', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    setCategories(rootCategories || [])
    setSubcategories(allSubcategories || [])
  }

  const loadServiceAreaData = async () => {
    const supabase = createClient()
    
    const { data: statesData } = await supabase
      .from('service_areas')
      .select('*')
      .eq('area_type', 'state')
      .order('name')
    
    setStates(statesData || [])
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

  const cancelEdit = () => {
    if (profile) {
      setEditedServiceRadius(profile.service_radius_km || 10)
      setEditedExperience(profile.experience_years)
      setEditedSkills(profile.skills || [])
      setEditedWorkingHours(profile.working_hours || {})
      setEditedServiceCategories(profile.service_categories || [])
      setEditedServiceAreas(profile.service_areas || [])
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

  const handleStateChange = async (stateId: string) => {
    setSelectedState(stateId)
    setSelectedDistrict('')
    setSelectedCity('')
    setDistricts([])
    setCities([])

    if (!stateId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('service_areas')
      .select('*')
      .eq('area_type', 'district')
      .eq('parent_id', stateId)
      .order('name')
    
    setDistricts(data || [])
  }

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrict(districtId)
    setSelectedCity('')
    setCities([])

    if (!districtId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('service_areas')
      .select('*')
      .eq('area_type', 'city')
      .eq('parent_id', districtId)
      .order('name')
    
    setCities(data || [])
  }

  const addServiceArea = () => {
    if (!selectedCity) {
      toast.error('Please select a city')
      return
    }

    const city = cities.find(c => c.id === selectedCity)
    if (!city) return

    if (editedServiceAreaIds.includes(city.id)) {
      toast.error('Area already added')
      return
    }

    setEditedServiceAreas([...editedServiceAreas, city.name])
    setEditedServiceAreaIds([...editedServiceAreaIds, city.id])
    toast.success(`${city.name} added to service areas`)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              My Services
            </h1>
            <p className="text-gray-600 mt-1">View and manage your service offerings</p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Services
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={cancelEdit} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : errorMessage ? (
          <Card className="bg-yellow-50/80 backdrop-blur-sm border-yellow-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">Verification Required</h3>
                  <p className="text-yellow-800 mb-4">{errorMessage}</p>
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
          <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Complete onboarding to view your services</p>
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
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  Service Categories {editing && `(${editedServiceCategories.length} selected)`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!editing ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {profile.service_categories.map((cat, idx) => (
                        <span key={idx} className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium capitalize">
                          {formatCategoryName(cat)}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      Click "Edit Services" to modify your service categories
                    </p>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {/* Categories */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredCategories.map((rootCategory) => {
                        const subs = subcategories.filter(sub => sub.parent_id === rootCategory.id)
                        const isExpanded = expandedCategories.includes(rootCategory.id)
                        const rootSelected = editedServiceCategories.includes(rootCategory.slug)
                        const someSubSelected = subs.some((sub: any) => editedServiceCategories.includes(sub.slug))

                        return (
                          <div key={rootCategory.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100">
                              <input
                                type="checkbox"
                                checked={rootSelected}
                                onChange={() => toggleCategory(rootCategory.slug)}
                                className="w-4 h-4 text-green-600 rounded"
                              />
                              <button
                                onClick={() => toggleCategoryExpansion(rootCategory.id)}
                                className="flex-1 text-left font-medium flex items-center justify-between"
                              >
                                <span>{rootCategory.name}</span>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </div>

                            {isExpanded && subs.length > 0 && (
                              <div className="p-2 space-y-1 bg-white">
                                {subs.map((sub: any) => {
                                  const subSelected = editedServiceCategories.includes(sub.slug)
                                  return (
                                    <label key={sub.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={subSelected}
                                        onChange={() => toggleCategory(sub.slug)}
                                        className="w-4 h-4 text-green-600 rounded"
                                      />
                                      <span className="text-sm">{sub.name}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Radius & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radius className="h-5 w-5 text-blue-600" />
                    Service Radius
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editedServiceRadius}
                        onChange={e => setEditedServiceRadius(Number(e.target.value))}
                        className="flex-1 text-2xl font-bold px-4 py-2 rounded-lg border-2 border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-600 text-xl font-bold">km</span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{profile.service_radius_km || 10} km</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">Maximum distance you'll travel for services</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <select
                      value={editedExperience}
                      onChange={e => setEditedExperience(Number(e.target.value))}
                      className="w-full text-xl font-bold px-4 py-2 rounded-lg border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={0}>Less than 1 year</option>
                      <option value={1}>1 year</option>
                      <option value={2}>2 years</option>
                      <option value={3}>3 years</option>
                      <option value={4}>4 years</option>
                      <option value={5}>5+ years</option>
                      <option value={10}>10+ years</option>
                    </select>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {profile.experience_years === 0 ? 'Less than 1 year' : `${profile.experience_years}+ years`}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skills */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Skills & Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-2">
                      {skill}
                      {editing && (
                        <button onClick={() => removeSkill(skill)} className="text-yellow-900 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addSkill()}
                      placeholder="Add new skill..."
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <Button onClick={addSkill} size="sm">Add</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Areas */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Service Areas {editing && `(${editedServiceAreas.length} areas)`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editedServiceAreas.map((area, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
                      {area}
                      {editing && (
                        <button onClick={() => removeServiceArea(idx)} className="text-red-900 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        value={selectedState}
                        onChange={e => handleStateChange(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state.id} value={state.id}>{state.name}</option>
                        ))}
                      </select>

                      <select
                        value={selectedDistrict}
                        onChange={e => handleDistrictChange(e.target.value)}
                        disabled={!selectedState}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <option value="">Select District</option>
                        {districts.map(district => (
                          <option key={district.id} value={district.id}>{district.name}</option>
                        ))}
                      </select>

                      <select
                        value={selectedCity}
                        onChange={e => setSelectedCity(e.target.value)}
                        disabled={!selectedDistrict}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <option value="">Select City</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={addServiceArea} size="sm" disabled={!selectedCity}>
                      Add Service Area
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const hours = editedWorkingHours[day] || { available: false, start: '09:00', end: '18:00' }
                    return (
                      <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900 capitalize w-28">{day}</span>
                        {editing ? (
                          <div className="flex items-center gap-3 flex-1">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hours.available}
                                onChange={e => updateWorkingHours(day, 'available', e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded"
                              />
                              <span className="text-sm text-gray-700">Available</span>
                            </label>
                            {hours.available && (
                              <>
                                <input
                                  type="time"
                                  value={hours.start}
                                  onChange={e => updateWorkingHours(day, 'start', e.target.value)}
                                  className="px-3 py-1 rounded border border-gray-300 text-sm"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="time"
                                  value={hours.end}
                                  onChange={e => updateWorkingHours(day, 'end', e.target.value)}
                                  className="px-3 py-1 rounded border border-gray-300 text-sm"
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <span className={`text-sm ${hours.available ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                            {hours.available ? `${hours.start} - ${hours.end}` : 'Not Available'}
                          </span>
                        )}
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
