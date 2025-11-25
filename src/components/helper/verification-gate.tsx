'use client'

import Link from 'next/link'
import { Shield, AlertCircle, Upload } from 'lucide-react'

interface VerificationGateProps {
  isVerified: boolean
  children: React.ReactNode
}

export function VerificationGate({ isVerified, children }: VerificationGateProps) {
  if (isVerified) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
              <Shield className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Verification Required
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You need to complete your verification before accessing this feature.
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Why Verification Matters</h3>
                <ul className="space-y-2 text-sm text-yellow-50">
                  <li>• Build trust with customers</li>
                  <li>• Access all platform features</li>
                  <li>• Receive more job requests</li>
                  <li>• Earn verified helper badge</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex-shrink-0">
                <span className="text-sm font-bold text-purple-600">1</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Upload Documents</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">ID proof, address proof, and professional certificates</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex-shrink-0">
                <span className="text-sm font-bold text-purple-600">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Admin Review</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Our team will verify your documents (24-48 hours)</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex-shrink-0">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Start Earning</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Access all features and start accepting jobs</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link 
              href="/helper/verification"
              className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium text-center hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-5 w-5" />
                Complete Verification Now
              </div>
            </Link>
            
            <Link 
              href="/helper/dashboard"
              className="block w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-lg font-medium text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
