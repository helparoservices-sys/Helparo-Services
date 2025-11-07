import { Shield, Lock, CheckCircle2, Award, Star, Verified } from 'lucide-react'

interface TrustBadgeProps {
  variant?: 'ssl' | 'verified' | 'payment' | 'trusted' | 'top-rated' | 'background-checked'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function TrustBadge({ variant = 'ssl', size = 'md', showText = true }: TrustBadgeProps) {
  const configs = {
    ssl: {
      icon: Lock,
      text: 'SSL Secured',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    verified: {
      icon: CheckCircle2,
      text: 'Verified Helper',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    payment: {
      icon: Shield,
      text: 'Payment Protected',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    trusted: {
      icon: Award,
      text: 'Trusted Platform',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    'top-rated': {
      icon: Star,
      text: 'Top Rated',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    'background-checked': {
      icon: Verified,
      text: 'Background Checked',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  }

  const config = configs[variant]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs px-2 py-1',
    md: 'h-5 w-5 text-sm px-3 py-1.5',
    lg: 'h-6 w-6 text-base px-4 py-2'
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      <Icon className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} ${config.color}`} />
      {showText && <span className={`font-medium ${config.color}`}>{config.text}</span>}
    </div>
  )
}

interface SecurityBannerProps {
  className?: string
}

export function SecurityBanner({ className = '' }: SecurityBannerProps) {
  return (
    <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Shield className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Your Security is Our Priority</h3>
          <p className="text-sm text-gray-600 mb-2">
            We protect your data and transactions with industry-standard security measures.
          </p>
          <div className="flex flex-wrap gap-2">
            <TrustBadge variant="ssl" size="sm" />
            <TrustBadge variant="payment" size="sm" />
            <TrustBadge variant="verified" size="sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface PaymentProtectionInfoProps {
  className?: string
}

export function PaymentProtectionInfo({ className = '' }: PaymentProtectionInfoProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Payment Protection
      </h3>
      <ul className="space-y-2 text-sm text-blue-800">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Your money is held in escrow until service completion</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Full refund if helper cancels</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>24/7 dispute resolution support</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>No payment to helper until you confirm completion</span>
        </li>
      </ul>
    </div>
  )
}

interface VerificationBadgeProps {
  isVerified: boolean
  verifiedAt?: string
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function VerificationBadge({
  isVerified,
  verifiedAt,
  size = 'md',
  showTooltip = true
}: VerificationBadgeProps) {
  if (!isVerified) return null

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const tooltipText = verifiedAt
    ? `Verified on ${new Date(verifiedAt).toLocaleDateString()}`
    : 'Verified Helper'

  return (
    <div className="inline-flex items-center gap-1" title={showTooltip ? tooltipText : undefined}>
      <CheckCircle2
        className={`${sizeClasses[size]} text-blue-600 fill-blue-100`}
      />
      <span className="text-xs font-medium text-blue-600">Verified</span>
    </div>
  )
}

interface SecurityScoreProps {
  score: number // 0-100
  className?: string
}

export function SecurityScore({ score, className = '' }: SecurityScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <svg className="h-16 w-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(score / 100) * 175.93} 175.93`}
            className={getColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${getColor(score)}`}>{score}</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700">Security Score</div>
        <div className={`text-lg font-bold ${getColor(score)}`}>{getLabel(score)}</div>
      </div>
    </div>
  )
}

export function TrustIndicators({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
        <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">256-bit</div>
        <div className="text-xs text-gray-600">SSL Encryption</div>
      </div>
      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
        <CheckCircle2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">100%</div>
        <div className="text-xs text-gray-600">Verified Helpers</div>
      </div>
      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
        <Lock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">Escrow</div>
        <div className="text-xs text-gray-600">Protected Payments</div>
      </div>
      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
        <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">24/7</div>
        <div className="text-xs text-gray-600">Support Available</div>
      </div>
    </div>
  )
}
