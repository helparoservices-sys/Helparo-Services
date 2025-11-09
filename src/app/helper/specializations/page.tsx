'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperSpecializations, addHelperSpecialization, deleteHelperSpecialization } from '@/app/actions/matching'

interface Specialization {
  id: string
  service_category_id: string
  experience_years: number | null
  certification_name: string | null
  certification_url: string | null
  is_verified: boolean
  verified_at: string | null
  service_category: {
    name: string
    icon: string | null
  }
}

export default function HelperSpecializationsPage() {
  const [loading, setLoading] = useState(true)
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    service_category_id: '',
    experience_years: '',
    certification_name: '',
    certification_url: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const result = await getHelperSpecializations(user.id)

    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('specializations' in result) {
      setSpecializations(result.specializations || [])
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.service_category_id) {
      setError('Please select a service category')
      return
    }

    setAdding(true)
    setError('')

    const data = new FormData()
    data.append('service_category_id', formData.service_category_id)
    if (formData.experience_years) data.append('experience_years', formData.experience_years)
    if (formData.certification_name) data.append('certification_name', formData.certification_name)
    if (formData.certification_url) data.append('certification_url', formData.certification_url)

    const result = await addHelperSpecialization(data)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setFormData({
        service_category_id: '',
        experience_years: '',
        certification_name: '',
        certification_url: ''
      })
      setShowForm(false)
      await loadData()
    }

    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this specialization?')) return

    const result = await deleteHelperSpecialization(id)
    
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      await loadData()
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Specializations</h1>
            <p className="text-muted-foreground">Showcase your expertise and certifications</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Specialization'}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Specialization</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Category *</label>
                  <Input
                    type="text"
                    value={formData.service_category_id}
                    onChange={(e) => setFormData({ ...formData, service_category_id: e.target.value })}
                    placeholder="Enter service category ID or name"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Select the service category you specialize in
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Years of Experience</label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Certification Name</label>
                    <Input
                      type="text"
                      value={formData.certification_name}
                      onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                      placeholder="Professional Certification"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Certification URL</label>
                  <Input
                    type="url"
                    value={formData.certification_url}
                    onChange={(e) => setFormData({ ...formData, certification_url: e.target.value })}
                    placeholder="https://example.com/certificate"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to your certification or portfolio
                  </p>
                </div>

                <Button type="submit" disabled={adding} className="w-full">
                  {adding ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    'Add Specialization'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Specializations List */}
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : specializations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">No specializations added yet</p>
                <Button onClick={() => setShowForm(true)}>
                  Add Your First Specialization
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {specializations.map(spec => (
              <Card key={spec.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        {spec.service_category.icon && (
                          <span className="text-2xl">{spec.service_category.icon}</span>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{spec.service_category.name}</h3>
                          {spec.is_verified && (
                            <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-1">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {spec.experience_years && (
                          <>
                            <span>💼 {spec.experience_years} years experience</span>
                            <span>•</span>
                          </>
                        )}
                        {spec.certification_name && (
                          <span>🎓 {spec.certification_name}</span>
                        )}
                      </div>

                      {spec.certification_url && (
                        <a 
                          href={spec.certification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Certificate →
                        </a>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(spec.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-sm space-y-1">
                <p className="font-medium text-blue-900">Tips for Better Visibility</p>
                <ul className="text-blue-700 space-y-1 ml-4 list-disc">
                  <li>Add certifications to get verified status</li>
                  <li>More specializations = more job opportunities</li>
                  <li>Update your experience years regularly</li>
                  <li>Link to your portfolio or certificates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
