'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, DollarSign, Star, Zap } from 'lucide-react'

interface InstantHelper {
  id: string
  user_id: string
  instant_booking_price: number
  instant_booking_duration_minutes: number
  auto_accept_enabled: boolean
  response_time_minutes: number
  experience_years: number
  skills: string[]
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface InstantHelperCardProps {
  helper: InstantHelper
  onSelect: (helper: InstantHelper) => void
  selected?: boolean
}

export function InstantHelperCard({ helper, onSelect, selected }: InstantHelperCardProps) {
  const initials = helper.profiles.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '??'

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected 
          ? 'border-2 border-teal-500 bg-teal-50 shadow-lg shadow-teal-100' 
          : 'border-2 border-gray-200 hover:border-teal-300'
      }`}
      onClick={() => onSelect(helper)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 border-2 border-white shadow-md">
            <AvatarImage src={helper.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-teal-500 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Helper Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900 truncate">
                {helper.profiles.full_name}
              </h3>
              {helper.auto_accept_enabled && (
                <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                  <Zap className="h-3 w-3 mr-1" />
                  Auto-Accept
                </Badge>
              )}
            </div>

            {/* Experience & Skills */}
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>{helper.experience_years || 0}+ years exp</span>
              {helper.skills.length > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="truncate">{helper.skills.slice(0, 2).join(', ')}</span>
                </>
              )}
            </div>

            {/* Price & Duration */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-teal-700 font-bold">
                <DollarSign className="h-4 w-4" />
                <span className="text-xl">₹{helper.instant_booking_price}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Clock className="h-4 w-4" />
                <span>{helper.instant_booking_duration_minutes} min</span>
              </div>
            </div>

            {/* Response Time */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>
                {helper.auto_accept_enabled 
                  ? 'Instant confirmation' 
                  : `Responds in ~${helper.response_time_minutes} min`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Select Button - Shows on hover or when selected */}
        <div className={`mt-3 transition-all ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <Button 
            className={`w-full ${
              selected
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(helper)
            }}
          >
            {selected ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Selected - Continue to Payment
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Book Instantly
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
