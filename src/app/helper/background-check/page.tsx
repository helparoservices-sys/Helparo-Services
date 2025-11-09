'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperBackgroundChecks, initiateBackgroundCheck } from '@/app/actions/trust-safety'

interface BackgroundCheck {
  id: string
  check_type: string
  status: string
  result: string | null
  verified_at: string | null
  expires_at: string | null
  created_at: string
  documents_submitted: boolean
}

export default function HelperBackgroundCheckPage() {
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<BackgroundCheck[]>([])
  const [error, setError] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [checkType, setCheckType] = useState('police_verification')

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

    const result = await getHelperBackgroundChecks(user.id)

    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('checks' in result) {
      setChecks(result.checks || [])
    }

    setLoading(false)
  }

  const handleRequestCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequesting(true)
    setError('')

    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setRequesting(false)
      return
    }

    const result = await initiateBackgroundCheck(user.id, checkType)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setShowRequestForm(false)
      await loadData()
    }

    setRequesting(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
      expired: 'bg-gray-100 text-gray-700 border-gray-300'
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getCheckTypeInfo = (type: string) => {
    const info: Record<string, { name: string; icon: string; description: string; duration: string }> = {
      police_verification: {
        name: 'Police Verification',
        icon: '🚔',
        description: 'Criminal background check from local police',
        duration: '7-14 business days'
      },
      identity_verification: {
        name: 'Identity Verification',
        icon: '🪪',
        description: 'Government ID verification (Aadhaar/PAN)',
        duration: 'Instant to 24 hours'
      },
      address_verification: {
        name: 'Address Verification',
        icon: '🏠',
        description: 'Current address verification',
        duration: '3-5 business days'
      },
      education_verification: {
        name: 'Education Verification',
        icon: '🎓',
        description: 'Educational qualifications check',
        duration: '7-10 business days'
      },
      employment_verification: {
        name: 'Employment Verification',
        icon: '💼',
        description: 'Previous employment history check',
        duration: '5-7 business days'
      }
    }
    return info[type] || { name: type, icon: '📋', description: 'Background check', duration: 'Varies' }
  }

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    return Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Background Verification</h1>
            <p className="text-muted-foreground">Build trust with customers through verified background checks</p>
          </div>
          <Button onClick={() => setShowRequestForm(!showRequestForm)}>
            {showRequestForm ? 'Cancel' : '+ Request New Check'}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Request Check Form */}
        {showRequestForm && (
          <Card>
            <CardHeader>
              <CardTitle>Request Background Check</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestCheck} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check Type</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={checkType}
                    onChange={(e) => setCheckType(e.target.value)}
                    required
                  >
                    <option value="police_verification">Police Verification</option>
                    <option value="identity_verification">Identity Verification</option>
                    <option value="address_verification">Address Verification</option>
                    <option value="education_verification">Education Verification</option>
                    <option value="employment_verification">Employment Verification</option>
                  </select>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getCheckTypeInfo(checkType).icon}</div>
                      <div>
                        <div className="font-medium text-sm">{getCheckTypeInfo(checkType).name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {getCheckTypeInfo(checkType).description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          ⏱️ Processing Time: {getCheckTypeInfo(checkType).duration}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You will need to submit required documents after initiating this request. 
                      Our team will contact you within 24 hours with instructions.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={requesting}>
                    {requesting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Checks List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : checks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="font-semibold mb-2">No Background Checks Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start building trust with customers by completing background verification checks
                </p>
                <Button onClick={() => setShowRequestForm(true)}>
                  Request First Check
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {checks.map(check => {
              const checkInfo = getCheckTypeInfo(check.check_type)
              const isExpiring = isExpiringSoon(check.expires_at)
              const daysLeft = check.expires_at ? getDaysUntilExpiry(check.expires_at) : null

              return (
                <Card key={check.id} className={`border-2 ${getStatusColor(check.status)}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{checkInfo.icon}</div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{checkInfo.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(check.status)}`}>
                              {check.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{checkInfo.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Requested:</span>
                            <span className="ml-2 font-medium">{new Date(check.created_at).toLocaleDateString()}</span>
                          </div>
                          {check.verified_at && (
                            <div>
                              <span className="text-muted-foreground">Verified:</span>
                              <span className="ml-2 font-medium">{new Date(check.verified_at).toLocaleDateString()}</span>
                            </div>
                          )}
                          {check.expires_at && (
                            <div>
                              <span className="text-muted-foreground">Expires:</span>
                              <span className={`ml-2 font-medium ${isExpiring ? 'text-red-600' : ''}`}>
                                {isExpiring && '⚠️ '}
                                {new Date(check.expires_at).toLocaleDateString()}
                                {daysLeft !== null && daysLeft > 0 && ` (${daysLeft}d left)`}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Documents:</span>
                            <span className="ml-2 font-medium">
                              {check.documents_submitted ? '✓ Submitted' : '⚠️ Pending'}
                            </span>
                          </div>
                        </div>

                        {check.result && (
                          <div className="p-3 bg-white rounded border">
                            <div className="text-sm font-medium mb-1">Result:</div>
                            <div className="text-sm text-muted-foreground">{check.result}</div>
                          </div>
                        )}

                        {check.status === 'pending' && !check.documents_submitted && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                              <strong>Action Required:</strong> Please submit your documents to proceed with verification.
                            </p>
                          </div>
                        )}

                        {isExpiring && check.status === 'verified' && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">
                              <strong>Renewal Required:</strong> This check expires in {daysLeft} days. Request renewal to maintain your trust score.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Why Background Checks Matter</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <div className="text-sm">
                  <div className="font-medium">Build Customer Trust</div>
                  <div className="text-muted-foreground">Verified helpers get 3x more bookings</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <div className="text-sm">
                  <div className="font-medium">Higher Trust Score</div>
                  <div className="text-muted-foreground">Each verification significantly boosts your trust score</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <div className="text-sm">
                  <div className="font-medium">Priority in Search</div>
                  <div className="text-muted-foreground">Verified helpers appear higher in customer searches</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <div className="text-sm">
                  <div className="font-medium">Platform Safety</div>
                  <div className="text-muted-foreground">Help us maintain a safe and reliable community</div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
