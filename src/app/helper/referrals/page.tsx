'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperReferrals, generateReferralLink } from '@/app/actions/helper-referrals'
import { Share2, Copy, DollarSign, Users, Gift, TrendingUp, Facebook, Twitter, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface ReferralStats {
  total_referrals: number
  successful_referrals: number
  pending_earnings: number
  total_earned: number
  referral_code: string
}

interface Referral {
  id: string
  referred_email: string
  status: string
  bonus_amount: number
  created_at: string
}

export default function HelperReferralsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralLink, setReferralLink] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const result = await getHelperReferrals()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setStats(result.data.stats)
      setReferrals(result.data.referrals)
      
      const linkResult = await generateReferralLink()
      if ('data' in linkResult && linkResult.data) {
        setReferralLink(linkResult.data.link)
      }
    }

    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const shareVia = (platform: string) => {
    const message = `Join Helparo as a helper and earn extra income! Use my referral code: ${stats?.referral_code}`
    const encodedMessage = encodeURIComponent(message)
    const encodedLink = encodeURIComponent(referralLink)

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
      email: `mailto:?subject=Join%20Helparo&body=${encodedMessage}%20${encodedLink}`,
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Referrals & Rewards
          </h1>
          <p className="text-gray-600 mt-1">Invite friends and earn rewards together</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats?.total_referrals || 0}</p>
                      <p className="text-xs text-gray-600">Total Referrals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats?.successful_referrals || 0}</p>
                      <p className="text-xs text-gray-600">Successful</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">₹{stats?.pending_earnings || 0}</p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">₹{stats?.total_earned || 0}</p>
                      <p className="text-xs text-gray-600">Total Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Link Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
                  <p className="text-sm text-gray-600 mb-2">Referral Code</p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-lg font-bold text-teal-700 bg-white px-4 py-2 rounded">
                      {stats?.referral_code || 'Loading...'}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(stats?.referral_code || '')}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Share Link</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 text-sm bg-white px-4 py-2 rounded border-0 focus:outline-none"
                    />
                    <Button
                      onClick={() => copyToClipboard(referralLink)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Share via</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      onClick={() => shareVia('whatsapp')}
                      variant="outline"
                      className="gap-2 bg-green-50 hover:bg-green-100 text-green-700"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </Button>
                    <Button
                      onClick={() => shareVia('facebook')}
                      variant="outline"
                      className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
                    >
                      <Facebook className="h-5 w-5" />
                      Facebook
                    </Button>
                    <Button
                      onClick={() => shareVia('twitter')}
                      variant="outline"
                      className="gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700"
                    >
                      <Twitter className="h-5 w-5" />
                      Twitter
                    </Button>
                    <Button
                      onClick={() => shareVia('email')}
                      variant="outline"
                      className="gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700"
                    >
                      <Mail className="h-5 w-5" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral History */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">No referrals yet</p>
                    <p className="text-sm text-gray-500 mt-2">Start sharing your referral link to earn rewards</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrals.map(referral => (
                      <div key={referral.id} className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{referral.referred_email}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : referral.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {referral.status}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            ₹{referral.bonus_amount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
