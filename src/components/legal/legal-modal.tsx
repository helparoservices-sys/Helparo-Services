'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'

type LegalType = 'terms' | 'privacy'
type LegalAudience = 'all' | 'customer' | 'helper'

export function LegalModal({
  type,
  open,
  onOpenChange,
  audience = 'all',
}: {
  type: LegalType
  open: boolean
  onOpenChange: (open: boolean) => void
  audience?: LegalAudience
}) {
  const [content, setContent] = useState<string>('Loading...')
  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    if (!open) return
    ;(async () => {
      // Try role-specific doc first; fall back to 'all'
      const fetchDoc = async (aud: LegalAudience) => {
        // Backward compatible: if `audience` column doesn't exist yet, retry without it.
        const attempt = await supabase
          .from('legal_documents')
          .select('title, content_md')
          .eq('type', type)
          .eq('audience', aud)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!attempt.error) return attempt

        const fallback = await supabase
          .from('legal_documents')
          .select('title, content_md')
          .eq('type', type)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        return fallback
      }

      const primary = await fetchDoc(audience)
      const secondary = audience !== 'all' ? await fetchDoc('all') : primary
      const data = primary.data ?? secondary.data
      const error = primary.error ?? secondary.error
      if (error) {
        setTitle(type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy')
        setContent('Unable to load document. Please try again later.')
      } else {
        setTitle(data?.title || (type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'))
        setContent(data?.content_md || 'No content available.')
      }
    })()
  }, [open, type, audience])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold">{title || (type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy')}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="prose prose-sm md:prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
