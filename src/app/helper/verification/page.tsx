'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getVerificationStatus } from '@/app/actions/helper-verification'
import { AlertCircle, CheckCircle2, FileText, Shield, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface VerificationStatus {
  status: string
  is_approved: boolean
  documents: Array<{
    doc_type: string
    status: string
    uploaded_at: string
  }>
}

export default function HelperVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  // Upload removed – handled during onboarding

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const result = await getVerificationStatus()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setVerificationStatus(result.data)
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
                      <h4 className="font-semibold text-gray-900">Uploaded Documents</h4>
                      {verificationStatus.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {doc.doc_type.replace('_', ' ').toUpperCase()}
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

            {/* Upload removed – handled in onboarding */}
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
