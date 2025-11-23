'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 4000)
  }

  const showSuccess = (title: string, message?: string) => 
    showToast({ type: 'success', title, message })

  const showError = (title: string, message?: string) => 
    showToast({ type: 'error', title, message })

  const showWarning = (title: string, message?: string) => 
    showToast({ type: 'warning', title, message })

  const showInfo = (title: string, message?: string) => 
    showToast({ type: 'info', title, message })

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }: { 
  toasts: Toast[]
  onRemove: (id: string) => void 
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { 
  toast: Toast
  onRemove: (id: string) => void 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 150)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div
      className={`
        ${getColors()}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        transform transition-all duration-300 ease-in-out
        min-w-[320px] max-w-md
        rounded-lg border shadow-lg
        p-4 pr-8
        relative
        backdrop-blur-sm
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 rounded-b-lg overflow-hidden">
        <div 
          className={`h-full ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          } animate-toast-progress`}
          style={{ 
            animationDuration: `${toast.duration || 4000}ms`
          }}
        />
      </div>
    </div>
  )
}