'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/loading'
import { getVerificationStatus } from '@/app/actions/helper-verification'
import { getHelperOnboardingStatus } from '@/app/actions/onboarding'
import { AlertCircle, CheckCircle2, FileText, Shield, Clock, XCircle, User, MapPin, Briefcase, CreditCard, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface VerificationStatus {
  status: string
  is_approved: boolean
  documents: Array<{
    doc_type: string
    status: string
    uploaded_at: string
  }>
}

interface HelperProfile {
  service_categories?: string[]
  skills?: string[]
  experience_years?: number
  hourly_rate?: number
  address?: string
  pincode?: string
  service_areas?: string[]
  working_hours?: any
  verification_status?: string
  is_approved?: boolean
  created_at?: string
}

interface BankAccount {
  account_holder_name?: string
  account_number?: string
  ifsc_code?: string
  bank_name?: string
  upi_id?: string
  status?: string
}

interface ProfileData {
  full_name?: string
  email?: string
  phone?: string
}

// Helper function to convert slug to readable name
const formatCategoryName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to format document type
const formatDocumentType = (docType: string): string => {
  const typeMap: Record<string, string> = {
    'id_front': 'ID Proof (Front)',
    'id_back': 'ID Proof (Back)',
    'selfie': 'Profile Photo',
    'certificate': 'Professional Certificate',
    'other': 'Address Proof'
  }
  return typeMap[docType] || docType.replace('_', ' ').toUpperCase()
}

export default function HelperVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [helperProfile, setHelperProfile] = useState<HelperProfile | null>(null)
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Get verification status
    const result = await getVerificationStatus()
    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setVerificationStatus(result.data)
    }

    // Get complete onboarding status (profile + bank + documents)
    const onboardingResult = await getHelperOnboardingStatus()
    if ('data' in onboardingResult && onboardingResult.data) {
      setHelperProfile(onboardingResult.data.profile)
      setBankAccount(onboardingResult.data.bankAccount)
      setDocuments(onboardingResult.data.documents || [])
    }

    // Get user profile data
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single()
      
      if (profile) setProfileData(profile)
    }

    setLoading(false)
  }

  // No submit handler – display only

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-600" />
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return <AlertCircle className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'from-green-500 to-emerald-500'
      case 'pending':
        return 'from-yellow-500 to-orange-500'
      case 'rejected':
        return 'from-red-500 to-rose-500'
      default:
        return 'from-gray-500 to-slate-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Verification & Documents
          </h1>
          <p className="text-gray-600 mt-1">Complete verification to unlock all features</p>
        </div>

        {loading ? (
          <SkeletonCard />
        ) : (
          <>
            {/* Verification Status Card */}
            {verificationStatus && (
              <Card className={`bg-white/80 backdrop-blur-sm border-white/50 shadow-lg overflow-hidden`}>
                <div className={`h-2 bg-gradient-to-r ${getStatusColor(verificationStatus.status)}`} />
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${getStatusColor(verificationStatus.status)} flex items-center justify-center`}>
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(verificationStatus.status)}
                        <h3 className="text-xl font-bold text-gray-900">
                          {verificationStatus.status === 'approved'
                            ? 'Verified Helper'
                            : verificationStatus.status === 'pending'
                            ? 'Verification Pending'
                            : verificationStatus.status === 'rejected'
                            ? 'Verification Rejected'
                            : 'Not Verified'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {verificationStatus.status === 'approved'
                          ? 'Your account is fully verified and trusted'
                          : verificationStatus.status === 'pending'
                          ? 'We are reviewing your documents. This usually takes 24-48 hours'
                          : verificationStatus.status === 'rejected'
                          ? 'Please re-upload valid documents for verification'
                          : 'Upload documents to get verified'}
                      </p>
                    </div>
                  </div>

                  {/* Document Status */}
                  {verificationStatus.documents.length > 0 && (
                    <div className="mt-6 pt-6 border-t space-y-3">
                      <h4 className="font-semibold text-gray-900">Uploaded Documents ({verificationStatus.documents.length})</h4>
                      {verificationStatus.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {doc.doc_type === 'aadhar' ? 'Aadhaar Card' :
                                 doc.doc_type === 'voter_id' ? 'Professional Certificate' :
                                 doc.doc_type === 'address_proof' ? 'Address Proof' :
                                 doc.doc_type === 'selfie' ? 'Profile Photo' :
                                 doc.doc_type.replace('_', ' ').toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : doc.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {doc.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Profile Details - Show when verification is pending */}
            {verificationStatus?.status === 'pending' && helperProfile && (
              <>
                {/* Personal Information */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">{profileData?.full_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{profileData?.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{profileData?.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted On</p>
                        <p className="font-medium text-gray-900">
                          {helperProfile.created_at ? new Date(helperProfile.created_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Service Details */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Service Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Service Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {helperProfile.service_categories?.map((cat, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                            {formatCategoryName(cat)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {helperProfile.skills?.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="font-medium text-gray-900">{helperProfile.experience_years || 0} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Hourly Rate</p>
                        <p className="font-medium text-gray-900">₹{helperProfile.hourly_rate || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Details */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Location & Service Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{helperProfile.address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pincode</p>
                      <p className="font-medium text-gray-900">{helperProfile.pincode || '-'}</p>
                    </div>
                    {helperProfile.service_areas && helperProfile.service_areas.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Service Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {helperProfile.service_areas.map((area, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Working Hours */}
                {helperProfile.working_hours && Object.keys(helperProfile.working_hours).length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-600" />
                        Working Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                          .filter(day => helperProfile.working_hours[day])
                          .map(day => {
                            const hours = helperProfile.working_hours[day]
                            return (
                              <div key={day} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="font-medium text-gray-900 capitalize">{day}</span>
                                <span className={`text-sm ${ hours.available ? 'text-green-700' : 'text-gray-500'}`}>
                                  {hours.available ? `${hours.start} - ${hours.end}` : 'Not Available'}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bank Account */}
                {bankAccount && (
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                        Payment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        {bankAccount.account_holder_name && (
                          <div>
                            <p className="text-sm text-gray-500">Account Holder</p>
                            <p className="font-medium text-gray-900">{bankAccount.account_holder_name}</p>
                          </div>
                        )}
                        {bankAccount.bank_name && (
                          <div>
                            <p className="text-sm text-gray-500">Bank Name</p>
                            <p className="font-medium text-gray-900">{bankAccount.bank_name}</p>
                          </div>
                        )}
                        {bankAccount.account_number && (
                          <div>
                            <p className="text-sm text-gray-500">Account Number</p>
                            <p className="font-medium text-gray-900">****{bankAccount.account_number.slice(-4)}</p>
                          </div>
                        )}
                        {bankAccount.ifsc_code && (
                          <div>
                            <p className="text-sm text-gray-500">IFSC Code</p>
                            <p className="font-medium text-gray-900">{bankAccount.ifsc_code}</p>
                          </div>
                        )}
                        {bankAccount.upi_id && (
                          <div>
                            <p className="text-sm text-gray-500">UPI ID</p>
                            <p className="font-medium text-gray-900">{bankAccount.upi_id}</p>
                          </div>
                        )}
                        {bankAccount.branch_name && (
                          <div>
                            <p className="text-sm text-gray-500">Branch</p>
                            <p className="font-medium text-gray-900">{bankAccount.branch_name}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Verification Status</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            bankAccount.status === 'verified' 
                              ? 'bg-green-100 text-green-700' 
                              : bankAccount.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {bankAccount.status === 'pending_verification' ? 'Pending' : bankAccount.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Show message if no bank account */}
                {!bankAccount && (
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                        Payment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 text-center py-4">No bank account details provided during onboarding</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Info Message */}
            {(!verificationStatus || verificationStatus.status === 'not_started') && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                Documents must be uploaded during onboarding. If you missed this step, contact support.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
