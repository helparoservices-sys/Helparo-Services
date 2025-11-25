'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'

type LegalType = 'terms' | 'privacy'

export function LegalModal({ type, open, onOpenChange }: { type: LegalType; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [content, setContent] = useState<string>('Loading...')
  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('title, content_md')
        .eq('type', type)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) {
        setTitle(type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy')
        setContent('Unable to load document. Please try again later.')
      } else {
        setTitle(data?.title || (type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'))
        setContent(data?.content_md || 'No content available.')
      }
    })()
  }, [open, type])

  return (
    <Modal title={title || (type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy')} open={open} onOpenChange={onOpenChange}>
      <div className="prose prose-sm md:prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </Modal>
  )
}
