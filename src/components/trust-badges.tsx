/**
 * Trust Badge Components
 * Display security and trust indicators across the platform
 */

import { Shield, CheckCircle, Lock, Award, Star, TrendingUp } from 'lucide-react'

export function SecurityBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
      <Shield className="w-4 h-4" />
      <span>SSL Secured</span>
    </div>
  )
}

export function PaymentProtectionBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
      <Lock className="w-4 h-4" />
      <span>Payment Protected</span>
    </div>
  )
}

export function VerifiedHelperBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
      <CheckCircle className="w-4 h-4" />
      <span>Verified</span>
    </div>
  )
}

export function TopRatedBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200">
      <Star className="w-4 h-4 fill-current" />
      <span>Top Rated</span>
    </div>
  )
}

export function TrustedProBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200">
      <Award className="w-4 h-4" />
      <span>Trusted Pro</span>
    </div>
  )
}

interface TrustInfoCardProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function TrustInfoCard({ title, description, icon }: TrustInfoCardProps) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-lg">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

export function PaymentSafetyInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <Lock className="w-5 h-5" />
        Your Payment is Protected
      </h3>
      <ul className="space-y-2 text-sm text-blue-800">
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Money held in secure escrow until service completion</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Full refund if helper cancels or doesn't show up</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>24/7 dispute resolution support</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Payment released only after your confirmation</span>
        </li>
      </ul>
    </div>
  )
}

export function TrustScoreIndicator({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold ${getScoreColor(score)}`}>
      <TrendingUp className="w-5 h-5" />
      <div className="flex items-baseline gap-2">
        <span className="text-2xl">{score}</span>
        <span className="text-sm font-medium opacity-75">/ 100</span>
      </div>
      <span className="text-sm ml-1">{getScoreLabel(score)}</span>
    </div>
  )
}

export function PlatformTrustBadges() {
  return (
    <div className="flex flex-wrap gap-2">
      <SecurityBadge />
      <PaymentProtectionBadge />
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
        <Shield className="w-4 h-4" />
        <span>Background Checked</span>
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
        <CheckCircle className="w-4 h-4" />
        <span>Insured Services</span>
      </div>
    </div>
  )
}

interface SecurityFeatureProps {
  features: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
}

export function SecurityFeatures({ features }: SecurityFeatureProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature, index) => (
        <TrustInfoCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  )
}

// Verification Purchase Badge
export function VerifiedPurchaseBadge() {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
      <CheckCircle className="w-3 h-3" />
      <span>Verified Service</span>
    </div>
  )
}

// Money Back Guarantee Badge
export function MoneyBackGuarantee() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
      <Shield className="w-4 h-4" />
      <span>Money-Back Guarantee</span>
    </div>
  )
}
