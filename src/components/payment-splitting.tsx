/**
 * PAYMENT SPLITTING FEATURE
 * Split service costs with friends/roommates
 * Real-world use case: Shared cleaners, group taxi rides, shared contractors
 */

'use client'

import { useState } from 'react'
import { Users, Plus, X, Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SplitParticipant {
  id: string
  name: string
  email: string
  phone: string
  amount: number
  status: 'pending' | 'paid' | 'declined'
}

/**
 * PAYMENT SPLIT CALCULATOR
 */
export function PaymentSplitCalculator({ 
  totalAmount,
  serviceId,
  onSplitCreated 
}: {
  totalAmount: number
  serviceId: string
  onSplitCreated?: (splitId: string) => void
}) {
  const { showSuccess, showError } = useToast()
  const [participants, setParticipants] = useState<SplitParticipant[]>([])
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', phone: '' })
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  const calculateSplits = () => {
    if (participants.length === 0) return []

    if (splitMethod === 'equal') {
      const amountPerPerson = totalAmount / (participants.length + 1) // +1 for creator
      return participants.map((p) => ({ ...p, amount: amountPerPerson }))
    }

    return participants
  }

  const addParticipant = () => {
    if (!newParticipant.name || !newParticipant.email) {
      showError('Required Fields', 'Please enter name and email')
      return
    }

    const amountPerPerson = totalAmount / (participants.length + 2) // +2 includes new person + creator

    setParticipants([
      ...participants,
      {
        id: Math.random().toString(36).substring(7),
        ...newParticipant,
        amount: amountPerPerson,
        status: 'pending',
      },
    ])

    setNewParticipant({ name: '', email: '', phone: '' })
  }

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const updateParticipantAmount = (id: string, amount: number) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, amount } : p))
    )
  }

  const createSplit = async () => {
    try {
      const response = await fetch('/api/payments/create-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          total_amount: totalAmount,
          participants: calculateSplits(),
          split_method: splitMethod,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShareLink(data.share_link)
        setShowShareModal(true)
        
        if (onSplitCreated) {
          onSplitCreated(data.split_id)
        }
      }
    } catch (error) {
      console.error('Failed to create split:', error)
      alert('Failed to create payment split. Please try again.')
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaWhatsApp = () => {
    const message = `Hey! Let's split the cost of this service. Pay your share here: ${shareLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const totalSplit = calculateSplits().reduce((sum, p) => sum + p.amount, 0)
  const yourShare = totalAmount - totalSplit

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Split Payment with Friends
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Share the cost with roommates, friends, or family
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total Amount */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Service Cost</p>
            <p className="text-3xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
          </div>

          {/* Split Method */}
          <div className="space-y-2">
            <Label>Split Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSplitMethod('equal')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  splitMethod === 'equal'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Split Equally
              </button>
              <button
                onClick={() => setSplitMethod('custom')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  splitMethod === 'custom'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Custom Amounts
              </button>
            </div>
          </div>

          {/* Add Participants */}
          <div className="space-y-3">
            <Label>Add People to Split With</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Name"
                value={newParticipant.name}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, name: e.target.value })
                }
              />
              <Input
                type="email"
                placeholder="Email"
                value={newParticipant.email}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, email: e.target.value })
                }
              />
              <Input
                type="tel"
                placeholder="Phone (optional)"
                value={newParticipant.phone}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, phone: e.target.value })
                }
              />
            </div>
            <Button onClick={addParticipant} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </div>

          {/* Participants List */}
          {calculateSplits().length > 0 && (
            <div className="space-y-3">
              <Label>Split Breakdown</Label>
              
              {calculateSplits().map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-xs text-gray-600">{participant.email}</p>
                  </div>
                  
                  {splitMethod === 'custom' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">₹</span>
                      <Input
                        type="number"
                        value={participant.amount}
                        onChange={(e) =>
                          updateParticipantAmount(participant.id, Number(e.target.value))
                        }
                        className="w-24"
                        min={0}
                        max={totalAmount}
                      />
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-purple-600">
                      ₹{participant.amount.toFixed(2)}
                    </div>
                  )}

                  <button
                    onClick={() => removeParticipant(participant.id)}
                    className="ml-3 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Your Share */}
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-purple-900">Your Share</p>
                    <p className="text-xs text-purple-700">Amount you'll pay</p>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    ₹{yourShare.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Validation */}
              {splitMethod === 'custom' && Math.abs(totalSplit + yourShare - totalAmount) > 0.01 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-900">
                  ⚠️ Warning: Split amounts don't add up to total (₹
                  {(totalSplit + yourShare).toFixed(2)} of ₹{totalAmount.toFixed(2)})
                </div>
              )}

              <Button onClick={createSplit} className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Create Split & Send Invites
              </Button>
            </div>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Payment Split Created! 🎉</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Share this link with your friends. They'll get notifications to pay their share.
                  </p>

                  <div className="flex gap-2">
                    <Input value={shareLink} readOnly className="flex-1" />
                    <Button onClick={copyShareLink} variant="outline">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button onClick={shareViaWhatsApp} className="w-full" variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                  </Button>

                  <Button onClick={() => setShowShareModal(false)} className="w-full">
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * PAYMENT SPLIT STATUS INDICATOR
 * Shows who has paid their share
 */
export function PaymentSplitStatus({ splitId }: { splitId: string }) {
  const [split, setSplit] = useState<{
    participants: SplitParticipant[]
    total_paid: number
    total_amount: number
  } | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        {split && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm mb-4">
              <span>Total Collected:</span>
              <span className="font-bold">
                ₹{split.total_paid.toFixed(2)} / ₹{split.total_amount.toFixed(2)}
              </span>
            </div>

            {split.participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-600">₹{p.amount.toFixed(2)}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    p.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : p.status === 'declined'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {p.status === 'paid' ? '✓ Paid' : p.status === 'declined' ? 'Declined' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
