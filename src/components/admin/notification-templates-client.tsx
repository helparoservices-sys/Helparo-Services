'use client'

import { useState } from 'react'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Plus, 
  Pencil, 
  Trash2, 
  Send, 
  Power,
  X
} from 'lucide-react'
import { 
  createNotificationTemplate, 
  updateNotificationTemplate, 
  deleteNotificationTemplate, 
  toggleNotificationTemplate, 
  sendTestNotification 
} from '@/app/actions/admin'
import { useToast } from '@/components/ui/toast-notification'

interface Template {
  id: string
  template_key: string
  channel: 'email' | 'sms' | 'push' | 'in_app'
  title: string | null
  body: string
  is_active: boolean
  created_at: string
}

interface NotificationTemplatesClientProps {
  templates: Template[]
}

export default function NotificationTemplatesClient({ templates: initialTemplates }: NotificationTemplatesClientProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()

  const [formData, setFormData] = useState<{
    template_key: string
    channel: 'email' | 'sms' | 'push' | 'in_app'
    title: string
    body: string
    is_active: boolean
  }>({
    template_key: '',
    channel: 'in_app',
    title: '',
    body: '',
    is_active: true
  })

  const getBodyPlaceholder = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'Hi {{user_name}}! 🎉\n\nYour booking for {{service_name}} has been confirmed for {{date_time}}.\n\nBooking ID: {{booking_id}}\nTotal Amount: ₹{{amount}}\nHelper: {{helper_name}}\n\nWe\'ll send you updates as your service approaches.\n\nBest regards,\nHelparo Team'
      case 'sms':
        return 'Hi {{user_name}}! Your {{service_name}} booking #{{booking_id}} is confirmed for {{date_time}}. Helper: {{helper_name}}. Amount: ₹{{amount}}. -Helparo'
      case 'push':
        return 'Your {{service_name}} booking is confirmed! {{helper_name}} will arrive on {{date_time}}. Tap to view details.'
      case 'in_app':
        return 'Hello {{user_name}}! Your booking for {{service_name}} has been confirmed. {{helper_name}} will provide the service on {{date_time}}. Total: ₹{{amount}}'
      default:
        return 'Hi {{user_name}}! Your {{service_name}} booking #{{booking_id}} is confirmed.'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-5 w-5" />
      case 'sms': return <Smartphone className="h-5 w-5" />
      case 'push': return <Bell className="h-5 w-5" />
      case 'in_app': return <MessageSquare className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      case 'sms': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      case 'push': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      case 'in_app': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
      default: return 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'
    }
  }

  const resetForm = () => {
    setFormData({
      template_key: '',
      channel: 'in_app',
      title: '',
      body: '',
      is_active: true
    })
  }

  const openCreateModal = () => {
    resetForm()
    setEditingTemplate(null)
    setShowCreateModal(true)
  }

  const openEditModal = (template: Template) => {
    setFormData({
      template_key: template.template_key,
      channel: template.channel,
      title: template.title || '',
      body: template.body,
      is_active: template.is_active
    })
    setEditingTemplate(template)
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingTemplate(null)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('saving')

    try {
      if (editingTemplate) {
        const result = await updateNotificationTemplate(editingTemplate.id, formData)
        if ('success' in result && result.success) {
          setTemplates(prev => prev.map(t => 
            t.id === editingTemplate.id ? { ...t, ...formData } : t
          ))
          showSuccess('Template Updated! ✅', 'Notification template has been updated successfully')
        } else {
          showError('Update Failed', 'error' in result ? result.error : 'Failed to update template')
        }
      } else {
        const result = await createNotificationTemplate(formData)
        if ('success' in result && result.success) {
          // Refresh page or add to list
          showSuccess('Template Created! 🎉', 'New notification template has been created successfully')
          window.location.reload()
        } else {
          showError('Creation Failed', 'error' in result ? result.error : 'Failed to create template')
        }
      }
      closeModal()
    } catch (error) {
      console.error('Error saving template:', error)
      showError('Save Failed', 'An unexpected error occurred while saving the template')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    setLoading(`deleting-${id}`)
    try {
      const result = await deleteNotificationTemplate(id)
      if ('success' in result && result.success) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        showSuccess('Template Deleted! 🗑️', 'Notification template has been removed successfully')
      } else {
        showError('Delete Failed', 'error' in result ? result.error : 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      showError('Delete Failed', 'An unexpected error occurred while deleting the template')
    } finally {
      setLoading(null)
    }
  }

  const handleToggle = async (id: string) => {
    setLoading(`toggling-${id}`)
    try {
      const result = await toggleNotificationTemplate(id)
      if ('success' in result && result.success) {
        setTemplates(prev => prev.map(t => 
          t.id === id ? { ...t, is_active: !t.is_active } : t
        ))
        const isNowActive = templates.find(t => t.id === id)?.is_active ? false : true
        showSuccess(
          isNowActive ? 'Template Activated! ⚡' : 'Template Deactivated! 💤',
          'message' in result ? result.message : `Template has been ${isNowActive ? 'enabled' : 'disabled'} successfully`
        )
      } else {
        showError('Toggle Failed', 'error' in result ? result.error : 'Failed to toggle template')
      }
    } catch (error) {
      console.error('Error toggling template:', error)
      showError('Toggle Failed', 'An unexpected error occurred while toggling the template')
    } finally {
      setLoading(null)
    }
  }

  const handleSendTest = async (id: string) => {
    setLoading(`testing-${id}`)
    try {
      const result = await sendTestNotification(id)
      if ('success' in result && result.success) {
        showSuccess('Test Sent! 🚀', 'Test notification sent successfully! Check your notifications bell.')
      } else {
        showError('Test Failed', 'error' in result ? result.error : 'Failed to send test notification')
      }
    } catch (error) {
      console.error('Error sending test:', error)
      showError('Test Failed', 'An unexpected error occurred while sending test notification')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notification Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and preview system notification templates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${getChannelColor(template.channel)} flex items-center justify-center shadow-lg`}>
                  {getChannelIcon(template.channel)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-lg text-slate-900 dark:text-white">{template.template_key}</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getChannelColor(template.channel)}`}>
                      {template.channel}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      template.is_active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {template.title && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{template.title}</div>
                  )}
                  <div className="text-sm text-slate-500 dark:text-slate-500 mt-1 line-clamp-2">{template.body}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendTest(template.id)}
                  disabled={loading === `testing-${template.id}` || !template.is_active}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {loading === `testing-${template.id}` ? 'Sending...' : 'Test'}
                </button>
                
                <button
                  onClick={() => handleToggle(template.id)}
                  disabled={loading === `toggling-${template.id}`}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    template.is_active 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Power className="h-4 w-4" />
                  {loading === `toggling-${template.id}` ? '...' : (template.is_active ? 'Disable' : 'Enable')}
                </button>
                
                <button
                  onClick={() => openEditModal(template)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                
                <button
                  onClick={() => handleDelete(template.id)}
                  disabled={loading === `deleting-${template.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  {loading === `deleting-${template.id}` ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {templates.length === 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-12 text-center">
            <Bell className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Templates Created</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Create notification templates to engage with users</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Template
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Template Key *
                </label>
                <input
                  type="text"
                  value={formData.template_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_key: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700"
                  placeholder="booking_confirmed"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Examples: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">booking_confirmed</span>, <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">payment_received</span>, <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">service_completed</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Channel *
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as 'email' | 'sms' | 'push' | 'in_app' }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700"
                  required
                >
                  <option value="in_app">In-App</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title {formData.channel === 'email' || formData.channel === 'push' ? '*' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700"
                  placeholder={formData.channel === 'email' ? '🎉 Your booking is confirmed!' : formData.channel === 'sms' ? 'Booking Confirmed' : '✅ Service Complete'}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formData.channel === 'email' ? 'Use emojis and engaging text for emails' : 
                   formData.channel === 'sms' ? 'Keep it short for SMS (under 20 characters)' :
                   formData.channel === 'push' ? 'Clear and actionable for push notifications' :
                   'Brief title for in-app notifications'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message Body *
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700"
                  placeholder={getBodyPlaceholder(formData.channel)}
                  required
                />
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    📝 Use these placeholders in your message:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{'{{user_name}}'}</span>
                        <span className="text-slate-500">User&apos;s name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">{'{{booking_id}}'}</span>
                        <span className="text-slate-500">Booking ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">{'{{service_name}}'}</span>
                        <span className="text-slate-500">Service type</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">{'{{amount}}'}</span>
                        <span className="text-slate-500">Price amount</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">{'{{date_time}}'}</span>
                        <span className="text-slate-500">Date & time</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded">{'{{helper_name}}'}</span>
                        <span className="text-slate-500">Helper&apos;s name</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    💡 Tip: Click any placeholder above to copy it to your clipboard!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">
                  Active template
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading === 'saving'}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {loading === 'saving' ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}