'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Paperclip, Image, FileText, Mic, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
  attachment_url?: string
  attachment_type?: string
  attachment_name?: string
  is_edited: boolean
  sender?: {
    full_name: string
    avatar_url?: string
  }
}

interface ChatWindowProps {
  requestId: string
  currentUserId: string
  otherUser: {
    id: string
    name: string
    avatar?: string
    role: 'customer' | 'helper'
  }
}

export function ChatWindow({ requestId, currentUserId, otherUser }: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadMessages()
    subscribeToMessages()
    markAllAsRead()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [requestId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (
          full_name,
          avatar_url
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data as any)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, newMsg])
          
          // Mark as read if from other user
          if (newMsg.sender_id !== currentUserId) {
            markMessageRead(newMsg.id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const data = payload.new as any
            if (data.user_id !== currentUserId) {
              setIsTyping(true)
              setTimeout(() => setIsTyping(false), 5000)
            }
          } else if (payload.eventType === 'DELETE') {
            setIsTyping(false)
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  const markMessageRead = async (messageId: string) => {
    await supabase.rpc('mark_message_read', { p_message_id: messageId })
  }

  const markAllAsRead = async () => {
    await supabase.rpc('mark_all_messages_read', { p_request_id: requestId })
  }

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set typing indicator
    supabase.rpc('set_typing_indicator', { p_request_id: requestId })

    // Auto-clear after 3 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      supabase.rpc('clear_typing_indicator', { p_request_id: requestId })
    }, 3000)
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${requestId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() && !file) return

    setSending(true)

    try {
      let attachmentUrl = null
      let attachmentType = null
      let attachmentName = null
      let attachmentSize = null

      if (file) {
        attachmentUrl = await uploadFile(file)
        if (!attachmentUrl) {
          throw new Error('File upload failed')
        }
        
        attachmentType = file.type.startsWith('image/') ? 'image' :
                        file.type.startsWith('video/') ? 'video' :
                        file.type.startsWith('audio/') ? 'audio' : 'document'
        attachmentName = file.name
        attachmentSize = file.size
      }

      await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: currentUserId,
        content: newMessage.trim() || 'Sent an attachment',
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_name: attachmentName,
        attachment_size: attachmentSize
      })

      setNewMessage('')
      setFile(null)
      
      // Clear typing indicator
      await supabase.rpc('clear_typing_indicator', { p_request_id: requestId })
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getFileIcon = (type?: string) => {
    if (!type) return <FileText className="h-5 w-5" />
    if (type === 'image') return <Image className="h-5 w-5" />
    if (type === 'video') return <Video className="h-5 w-5" />
    if (type === 'audio') return <Mic className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {otherUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{otherUser.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{otherUser.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Phone className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Video className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  isMine
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                }`}>
                  {msg.attachment_url && (
                    <div className="mb-2">
                      {msg.attachment_type === 'image' ? (
                        <img
                          src={msg.attachment_url}
                          alt={msg.attachment_name || 'Image'}
                          className="rounded-lg max-w-full h-auto"
                        />
                      ) : (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          {getFileIcon(msg.attachment_type)}
                          <span className="text-sm truncate">{msg.attachment_name}</span>
                        </a>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${isMine ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isMine && (
                      <span>
                        {msg.read_at ? (
                          <CheckCheck className="h-3 w-3 text-blue-200" />
                        ) : (
                          <Check className="h-3 w-3 text-blue-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700">
        {file && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {getFileIcon(file.type.split('/')[0])}
            <span className="text-sm flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Paperclip className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !file)}
            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatWindow
