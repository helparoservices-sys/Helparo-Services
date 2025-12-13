import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Scale, Home, ArrowLeft, FileText, Calendar, Shield } from 'lucide-react'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function extractToc(markdown: string): { level: number; text: string; slug: string }[] {
  const lines = markdown.split('\n')
  const toc: { level: number; text: string; slug: string }[] = []
  for (const line of lines) {
    const m2 = /^##\s+(.*)$/.exec(line)
    const m3 = /^###\s+(.*)$/.exec(line)
    if (m2) {
      const text = m2[1].trim()
      toc.push({ level: 2, text, slug: slugify(text) })
    } else if (m3) {
      const text = m3[1].trim()
      toc.push({ level: 3, text, slug: slugify(text) })
    }
  }
  return toc
}

function flattenChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(flattenChildren).join('')
  if (typeof children === 'object' && children && 'props' in children) {
    return flattenChildren((children as React.ReactElement).props?.children)
  }
  return ''
}

const MarkdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => {
    const text = flattenChildren(children)
    const id = slugify(text)
    return (
      <h2 id={id} className="scroll-mt-28">
        {children}
      </h2>
    )
  },
  h3: ({ children }: { children?: React.ReactNode }) => {
    const text = flattenChildren(children)
    const id = slugify(text)
    return (
      <h3 id={id} className="scroll-mt-28">
        {children}
      </h3>
    )
  },
}

export function LegalDoc({
  title,
  contentMd,
  version,
  updatedAt,
  backHref = '/auth/signup',
}: {
  title: string
  contentMd: string
  version?: number | string
  updatedAt?: string
  backHref?: string
}) {
  const toc = extractToc(contentMd)
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-teal-950 dark:to-emerald-950">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.svg" 
                alt="Helparo" 
                width={40} 
                height={40} 
                className="rounded-lg shadow-md"
                priority
                quality={90}
              />
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Helparo</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Services Platform</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link 
                href={backHref}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm uppercase tracking-wider text-white/80 font-medium">Legal Document</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
            {typeof version !== 'undefined' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <FileText className="h-4 w-4" />
                Version {String(version)}
              </div>
            )}
            {formattedDate && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <Calendar className="h-4 w-4" />
                Last updated: {formattedDate}
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <Shield className="h-4 w-4" />
              Legally Binding
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar with TOC */}
          <aside className="lg:col-span-3 order-last lg:order-first">
            <div className="sticky top-24 space-y-4">
              {/* Table of Contents */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Table of Contents</h3>
                </div>
                {toc.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {toc.map((item) => (
                      <li key={item.slug} className={item.level === 3 ? 'pl-4' : ''}>
                        <a 
                          href={`#${item.slug}`} 
                          className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block py-1"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No sections available</p>
                )}
              </div>

              {/* Quick Links */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/40 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Related Documents</h3>
                <div className="space-y-2">
                  <Link 
                    href="/legal/terms"
                    className="block text-sm text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Terms & Conditions
                  </Link>
                  <Link 
                    href="/legal/privacy"
                    className="block text-sm text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  <Link 
                    href="/legal/consent"
                    className="block text-sm text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    User Consent
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-9">
            <article className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 md:p-10">
              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-700 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-a:text-emerald-700 dark:prose-a:text-emerald-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {contentMd}
                </ReactMarkdown>
              </div>

              {/* Footer in content */}
              <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image 
                      src="/logo.svg" 
                      alt="Helparo" 
                      width={32} 
                      height={32} 
                      className="rounded-lg"
                      loading="lazy"
                    />
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p className="font-medium text-slate-900 dark:text-white">Helparo Services</p>
                      <p>Connecting helpers with those who need them</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    © {currentYear} Helparo. All rights reserved.
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.svg" 
                alt="Helparo" 
                width={36} 
                height={36} 
                className="rounded-lg shadow-md"
                loading="lazy"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Helparo Services</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your trusted service platform</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <Link href="/legal/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Privacy
              </Link>
              <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Home
              </Link>
              <Link href="/auth/signin" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LegalDoc
