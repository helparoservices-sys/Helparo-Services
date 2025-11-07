'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { joinVideoCall, endVideoCall } from '@/app/actions/video-calls'

export default function HelperVideoCallInterfacePage() {
  const params = useParams()
  const router = useRouter()
  const callId = params.id as string

  const [loading, setLoading] = useState(true)
  const [callDetails, setCallDetails] = useState<any>(null)
  const [error, setError] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [duration, setDuration] = useState(0)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (callId) {
      loadCallDetails()
    }
  }, [callId])

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isConnected])

  const loadCallDetails = async () => {
    setLoading(true)
    const result = await joinVideoCall(callId)

    if (result.error) {
      setError(result.error)
    } else if (result.session) {
      setCallDetails(result.session)
      // In production, initialize Agora SDK here with the token
      initializeVideoCall(result.session)
    }
    setLoading(false)
  }

  const initializeVideoCall = async (session: any) => {
    // In production, you would:
    // 1. Initialize Agora RTC client with session.agora_token
    // 2. Join channel with session.channel_name
    // 3. Setup local and remote video streams
    // 4. Handle call events
    
    // Simulating connection
    setTimeout(() => {
      setIsConnected(true)
    }, 2000)
  }

  const handleEndCall = async () => {
    const result = await endVideoCall(callId)
    
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/helper/video-calls/history')
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // In production: call.muteLocalAudio(!isMuted)
  }

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff)
    // In production: call.muteLocalVideo(!isVideoOff)
  }

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
    // In production: call.startScreenSharing() or call.stopScreenSharing()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !callDetails) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 mb-4">{error || 'Call not found'}</p>
            <Button onClick={() => router.push('/helper/video-calls/history')}>
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <LoadingSpinner size="lg" />
                <p className="mt-4">Connecting to customer...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-white text-4xl">
                You
              </div>
            </div>
          )}
          {isScreenSharing && (
            <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-1">
              Sharing Screen
            </div>
          )}
        </div>

        {/* Call Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 rounded-lg px-4 py-2 text-white">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <div>
              <div className="font-semibold capitalize">{callDetails.call_type.replace('_', ' ')}</div>
              <div className="text-sm opacity-80">
                {isConnected ? formatDuration(duration) : 'Connecting...'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
                isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
                isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
            >
              {isVideoOff ? '📷' : '📹'}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
                isScreenSharing ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            >
              🖥️
            </button>

            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
              title="End Call"
            >
              📞
            </button>
          </div>

          {isScreenSharing && (
            <div className="text-center mt-3 text-white text-sm">
              You are sharing your screen with the customer
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-600 text-white text-center">
          {error}
        </div>
      )}
    </div>
  )
}
