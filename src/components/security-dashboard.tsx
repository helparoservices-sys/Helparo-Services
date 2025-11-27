/**
 * Security Dashboard Component
 * Shows account security status, active sessions, and security settings
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Smartphone, 
  Globe, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Key,
  Activity,
  MapPin,
  Loader2
} from 'lucide-react'
import { getUserSessions, revokeSession, revokeAllOtherSessions, getLoginAttempts } from '@/app/actions/sessions'
import { useToast } from '@/components/ui/toast-notification'

interface Session {
  id: string
  device_name: string
  browser: string
  os: string
  location: string
  ip_address: string
  last_active_at: string
  is_current: boolean
  created_at: string
}

interface LoginAttempt {
  id: string
  created_at: string
  success: boolean
  ip_address: string
  location: string
  failure_reason?: string
}

export function SecurityDashboard() {
  const { showSuccess, showError, showInfo } = useToast()
  const [securityScore, setSecurityScore] = useState(75)
  const [sessions, setSessions] = useState<Session[]>([])
  const [recentLogins, setRecentLogins] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  // Load sessions and login attempts
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load sessions
      const sessionsResult = await getUserSessions()
      if ('sessions' in sessionsResult && sessionsResult.sessions) {
        setSessions(sessionsResult.sessions)
      } else if ('error' in sessionsResult && sessionsResult.error) {
        showError('Failed to load sessions', sessionsResult.error)
      }

      // Load login attempts
      const attemptsResult = await getLoginAttempts(10)
      if ('attempts' in attemptsResult && attemptsResult.attempts) {
        setRecentLogins(attemptsResult.attempts)
      } else if ('error' in attemptsResult && attemptsResult.error) {
        showError('Failed to load login history', attemptsResult.error)
      }
    } catch (error: any) {
      showError('Error loading security data', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRevokeSession(sessionId: string) {
    setRevoking(sessionId)
    try {
      const result = await revokeSession(sessionId)
      if ('success' in result && result.success) {
        showSuccess('Session Revoked', 'The device has been logged out successfully')
        // Reload sessions
        await loadData()
      } else if ('error' in result && result.error) {
        showError('Failed to revoke session', result.error)
      }
    } catch (error: any) {
      showError('Error', error.message)
    } finally {
      setRevoking(null)
    }
  }

  async function handleRevokeAllSessions() {
    const confirmed = confirm('Are you sure you want to log out all other devices? You will remain logged in on this device.')
    if (!confirmed) return

    setRevoking('all')
    try {
      const result = await revokeAllOtherSessions()
      if ('success' in result && result.success) {
        showSuccess('All Sessions Revoked', 'All other devices have been logged out')
        await loadData()
      } else if ('error' in result && result.error) {
        showError('Failed to revoke sessions', result.error)
      }
    } catch (error: any) {
      showError('Error', error.message)
    } finally {
      setRevoking(null)
    }
  }

  function formatTimestamp(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const securityFeatures = [
    {
      enabled: true,
      title: 'Strong Password',
      description: 'Your password meets security requirements',
      icon: <Key className="w-5 h-5" />
    },
    {
      enabled: false,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      icon: <Shield className="w-5 h-5" />
    },
    {
      enabled: true,
      title: 'Email Verification',
      description: 'Your email is verified',
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      enabled: false,
      title: 'Login Alerts',
      description: 'Get notified of new logins',
      icon: <AlertTriangle className="w-5 h-5" />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Account Security Score
          </CardTitle>
          <CardDescription>
            Your account security health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - securityScore / 100)}`}
                  className="text-primary"
                  strokeLinecap="round"
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{securityScore}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                {securityScore >= 80 ? 'Good Security' : 'Improve Your Security'}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {securityScore >= 80 
                  ? 'Your account is well protected. Keep it up!'
                  : 'Enable two-factor authentication to improve your security score.'
                }
              </p>
              {securityScore < 80 && (
                <Button size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Improve Security
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${feature.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {feature.enabled ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Devices where you're currently logged in
              </CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={handleRevokeAllSessions} disabled={revoking === 'all' || loading}>
              {revoking === 'all' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Log Out All Devices'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active sessions found
            </p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    {session.device_name?.includes('Mobile') || session.device_name?.includes('Android') || session.device_name?.includes('iOS') ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{session.device_name}</h4>
                      {session.is_current && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.browser}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(session.last_active_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">IP: {session.ip_address}</p>
                  </div>
                </div>
                {!session.is_current && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revoking === session.id}
                  >
                    {revoking === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Revoke'
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Login Activity
          </CardTitle>
          <CardDescription>
            Your login history from the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentLogins.length > 0 ? (
            <div className="space-y-3">
              {recentLogins.map((login) => (
                <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {login.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {login.success ? 'Successful Login' : 'Failed Login Attempt'}
                      </p>
                      {!login.success && login.failure_reason && (
                        <p className="text-xs text-red-600">
                          Reason: {login.failure_reason}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{formatTimestamp(login.created_at)}</span>
                        <span>•</span>
                        <span>{login.location}</span>
                        <span>•</span>
                        <span className="text-xs">{login.ip_address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent login activity to display
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-1">Enable Two-Factor Authentication</h4>
              <p className="text-sm text-yellow-800 mb-2">
                Add an extra layer of security to prevent unauthorized access to your account.
              </p>
              <Button size="sm" variant="outline" className="border-yellow-300">
                Set Up 2FA
              </Button>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Review Your Privacy Settings</h4>
              <p className="text-sm text-blue-800 mb-2">
                Make sure you're comfortable with who can see your profile information.
              </p>
              <Button size="sm" variant="outline" className="border-blue-300">
                Review Privacy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SecurityDashboard
