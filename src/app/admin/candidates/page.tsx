'use client'

import { useEffect, useState } from 'react'
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Linkedin,
  Globe,
  Building2,
  IndianRupee,
  MoreVertical,
  Search,
  Filter,
  FileText,
  UserCheck,
  AlertCircle,
  Star,
  MessageSquare,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast-notification'
import { PageLoader } from '@/components/ui/loading'

interface JobApplication {
  id: string
  full_name: string
  email: string
  phone: string
  job_title: string
  department: string
  linkedin_url: string | null
  portfolio_url: string | null
  current_company: string | null
  current_role: string | null
  experience_years: string | null
  expected_salary: string | null
  notice_period: string | null
  location: string | null
  willing_to_relocate: boolean
  how_did_you_hear: string | null
  cover_letter: string | null
  resume_url: string | null
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Star },
  interview: { label: 'Interview', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Users },
  offered: { label: 'Offered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700 border-green-200', icon: UserCheck },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

const departmentColors: Record<string, string> = {
  engineering: 'bg-violet-100 text-violet-700',
  design: 'bg-pink-100 text-pink-700',
  marketing: 'bg-orange-100 text-orange-700',
  operations: 'bg-cyan-100 text-cyan-700',
  support: 'bg-amber-100 text-amber-700',
}

export default function AdminCandidatesPage() {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('id, full_name, email, phone, position, status, resume_url, cover_letter, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      showError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId)

      if (error) throw error

      setApplications(prev => 
        prev.map(app => app.id === applicationId ? { ...app, status: newStatus as JobApplication['status'] } : app)
      )
      showSuccess(`Status updated to ${statusConfig[newStatus as keyof typeof statusConfig].label}`)
    } catch (error) {
      console.error('Error updating status:', error)
      showError('Failed to update status')
    }
  }

  const saveNotes = async () => {
    if (!selectedApplication) return
    
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', selectedApplication.id)

      if (error) throw error

      setApplications(prev => 
        prev.map(app => app.id === selectedApplication.id ? { ...app, admin_notes: adminNotes } : app)
      )
      setShowNotesModal(false)
      showSuccess('Notes saved successfully')
    } catch (error) {
      console.error('Error saving notes:', error)
      showError('Failed to save notes')
    }
  }

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || app.department === departmentFilter
    
    return matchesSearch && matchesStatus && matchesDepartment
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interview: applications.filter(a => a.status === 'interview').length,
    hired: applications.filter(a => a.status === 'hired').length,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-violet-600" />
            Job Applications
          </h1>
          <p className="text-gray-500 mt-1">Manage candidate applications and hiring pipeline</p>
        </div>
        <button
          onClick={loadApplications}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.reviewing}</p>
              <p className="text-xs text-gray-500">Reviewing</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.shortlisted}</p>
              <p className="text-xs text-gray-500">Shortlisted</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{stats.interview}</p>
              <p className="text-xs text-gray-500">Interview</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.hired}</p>
              <p className="text-xs text-gray-500">Hired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-violet-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="offered">Offered</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-violet-500 outline-none bg-white"
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
              <option value="support">Support</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-violet-500 outline-none bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here when candidates apply'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{app.full_name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {app.email}
                          </span>
                          {app.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {app.phone}
                            </span>
                          )}
                        </div>
                        {app.location && (
                          <span className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {app.location}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{app.job_title}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${departmentColors[app.department] || 'bg-gray-100 text-gray-600'}`}>
                        {app.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{app.experience_years || 'N/A'}</p>
                        {app.current_company && (
                          <p className="text-gray-500 text-xs mt-0.5">{app.current_role} at {app.current_company}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(app.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusConfig[app.status].color} cursor-pointer outline-none`}
                      >
                        {Object.entries(statusConfig).map(([value, config]) => (
                          <option key={value} value={value}>{config.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(app)
                            setShowDetailModal(true)
                          }}
                          className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download Resume"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedApplication(app)
                            setAdminNotes(app.admin_notes || '')
                            setShowNotesModal(true)
                          }}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Add Notes"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedApplication.full_name}</h2>
                <p className="text-sm text-violet-600 font-medium">{selectedApplication.job_title}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig[selectedApplication.status].color}`}>
                  {(() => {
                    const Icon = statusConfig[selectedApplication.status].icon
                    return <Icon className="w-4 h-4" />
                  })()}
                  {statusConfig[selectedApplication.status].label}
                </span>
                <span className="text-sm text-gray-500">
                  Applied {formatDate(selectedApplication.created_at)}
                </span>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${selectedApplication.email}`} className="text-violet-600 hover:underline">
                      {selectedApplication.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${selectedApplication.phone}`} className="text-gray-900">
                      {selectedApplication.phone}
                    </a>
                  </div>
                  {selectedApplication.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedApplication.location}</span>
                      {selectedApplication.willing_to_relocate && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Willing to relocate
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Links */}
              {(selectedApplication.linkedin_url || selectedApplication.portfolio_url) && (
                <div className="flex flex-wrap gap-3">
                  {selectedApplication.linkedin_url && (
                    <a
                      href={selectedApplication.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedApplication.portfolio_url && (
                    <a
                      href={selectedApplication.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Portfolio / GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Experience Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                {selectedApplication.current_company && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Building2 className="w-4 h-4" />
                      Current Company
                    </div>
                    <p className="font-semibold text-gray-900">{selectedApplication.current_company}</p>
                    {selectedApplication.current_role && (
                      <p className="text-sm text-gray-600">{selectedApplication.current_role}</p>
                    )}
                  </div>
                )}
                {selectedApplication.experience_years && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </div>
                    <p className="font-semibold text-gray-900">{selectedApplication.experience_years}</p>
                  </div>
                )}
                {selectedApplication.expected_salary && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <IndianRupee className="w-4 h-4" />
                      Expected Salary
                    </div>
                    <p className="font-semibold text-gray-900">{selectedApplication.expected_salary}</p>
                  </div>
                )}
                {selectedApplication.notice_period && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      Notice Period
                    </div>
                    <p className="font-semibold text-gray-900">{selectedApplication.notice_period}</p>
                  </div>
                )}
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Cover Letter
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-gray-700 whitespace-pre-wrap">
                    {selectedApplication.cover_letter}
                  </div>
                </div>
              )}

              {/* Resume */}
              {selectedApplication.resume_url && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Resume</h3>
                  <a
                    href={selectedApplication.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Resume
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Admin Notes */}
              {selectedApplication.admin_notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Admin Notes
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-gray-700 whitespace-pre-wrap">
                    {selectedApplication.admin_notes}
                  </div>
                </div>
              )}

              {/* Source */}
              {selectedApplication.how_did_you_hear && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Source:</span> {selectedApplication.how_did_you_hear}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setAdminNotes(selectedApplication.admin_notes || '')
                  setShowNotesModal(true)
                  setShowDetailModal(false)
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Add Notes
              </button>
              <a
                href={`mailto:${selectedApplication.email}`}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Send Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNotesModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Admin Notes</h2>
              <p className="text-sm text-gray-500">{selectedApplication.full_name} - {selectedApplication.job_title}</p>
            </div>
            <div className="p-6">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this candidate..."
                className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none resize-none"
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
