'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, X } from 'lucide-react'

interface ServiceArea {
  id: string
  parent_id: string | null
  level: string
  name: string
  slug: string
}

interface Props {
  selectedAreaIds: string[]
  onChange: (areaIds: string[]) => void
}

export function CascadingAreaSelector({ selectedAreaIds, onChange }: Props) {
  const [states, setStates] = useState<ServiceArea[]>([])
  const [districts, setDistricts] = useState<ServiceArea[]>([])
  const [cities, setCities] = useState<ServiceArea[]>([])
  const [areas, setAreas] = useState<ServiceArea[]>([])
  
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStates()
  }, [])

  useEffect(() => {
    if (selectedState) loadDistricts(selectedState)
  }, [selectedState])

  useEffect(() => {
    if (selectedDistrict) loadCities(selectedDistrict)
  }, [selectedDistrict])

  useEffect(() => {
    if (selectedCity) loadAreas(selectedCity)
  }, [selectedCity])

  const loadStates = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('service_areas')
      .select('*')
      .eq('level', 'state')
      .eq('is_active', true)
      .order('display_order')

    setStates(data || [])
    setLoading(false)
  }

  const loadDistricts = async (stateId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('service_areas')
      .select('*')
      .eq('level', 'district')
      .eq('parent_id', stateId)
      .eq('is_active', true)
      .order('display_order')

    setDistricts(data || [])
    setCities([])
    setAreas([])
  }

  const loadCities = async (districtId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('service_areas')
      .select('*')
      .eq('level', 'city')
      .eq('parent_id', districtId)
      .eq('is_active', true)
      .order('display_order')

    setCities(data || [])
    setAreas([])
  }

  const loadAreas = async (cityId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('service_areas')
      .select('*')
      .eq('level', 'area')
      .eq('parent_id', cityId)
      .eq('is_active', true)
      .order('display_order')

    setAreas(data || [])
  }

  const toggleArea = (areaId: string) => {
    if (selectedAreaIds.includes(areaId)) {
      onChange(selectedAreaIds.filter(id => id !== areaId))
    } else {
      onChange([...selectedAreaIds, areaId])
    }
  }

  const getAreaName = (areaId: string): string => {
    const allAreas = [...states, ...districts, ...cities, ...areas]
    const area = allAreas.find(a => a.id === areaId)
    return area ? area.name : areaId
  }

  const getAreaPath = (areaId: string): string => {
    const allAreas = [...states, ...districts, ...cities, ...areas]
    const area = allAreas.find(a => a.id === areaId)
    if (!area) return ''

    const path: string[] = [area.name]
    let current = area

    while (current.parent_id) {
      const parent = allAreas.find(a => a.id === current.parent_id)
      if (!parent) break
      path.unshift(parent.name)
      current = parent
    }

    return path.join(' → ')
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading service areas...</div>
  }

  return (
    <div className="space-y-4">
      {/* Cascading Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            State <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value)
              setSelectedDistrict('')
              setSelectedCity('')
            }}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select State</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            District {selectedState && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value)
              setSelectedCity('')
            }}
            disabled={!selectedState}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white disabled:opacity-50"
          >
            <option value="">Select District</option>
            {districts.map(district => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            City {selectedDistrict && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedDistrict}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white disabled:opacity-50"
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>

        {/* Areas Count */}
        <div className="flex items-end">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {selectedCity ? `${areas.length} areas available` : 'Select city to view areas'}
          </div>
        </div>
      </div>

      {/* Area Selection */}
      {selectedCity && areas.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Select Areas (You can select multiple) <span className="text-red-500">*</span>
          </label>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {areas.map(area => (
                <label
                  key={area.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreaIds.includes(area.id)}
                    onChange={() => toggleArea(area.id)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {area.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Areas Display */}
      {selectedAreaIds.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
            Selected Service Areas ({selectedAreaIds.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAreaIds.map(areaId => (
              <span
                key={areaId}
                onClick={() => toggleArea(areaId)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-md text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-colors"
                title={getAreaPath(areaId)}
              >
                {getAreaName(areaId)}
                <X className="h-3 w-3" />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
