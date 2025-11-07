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
  MapPin
} from 'lucide-react'

interface Session {
  id: string
  device: string
  browser: string
  location: string
  ipAddress: string
  lastActive: string
  isCurrent: boolean
}

interface LoginAttempt {
  id: string
  timestamp: string
  success: boolean
  ipAddress: string
  location: string
}

export function SecurityDashboard() {
  const [securityScore, setSecurityScore] = useState(75)
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows PC',
      browser: 'Chrome 120',
      location: 'Mumbai, India',
      ipAddress: '103.xxx.xxx.xxx',
      lastActive: '2 minutes ago',
      isCurrent: true
    }
  ])
  const [recentLogins, setRecentLogins] = useState<LoginAttempt[]>([])

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
            <Button variant="destructive" size="sm">
              Log Out All Devices
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  {session.device.includes('Mobile') ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{session.device}</h4>
                    {session.isCurrent && (
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
                      {session.lastActive}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">IP: {session.ipAddress}</p>
                </div>
              </div>
              {!session.isCurrent && (
                <Button variant="ghost" size="sm">
                  Revoke
                </Button>
              )}
            </div>
          ))}
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
          {recentLogins.length > 0 ? (
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
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{login.timestamp}</span>
                        <span>•</span>
                        <span>{login.location}</span>
                        <span>•</span>
                        <span className="text-xs">{login.ipAddress}</span>
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
