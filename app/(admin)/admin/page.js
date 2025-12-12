'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ...existing code...
const base_url = process.env.NEXT_PUBLIC_BASE_URL;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [users, setUsers] = useState([])
  const [manuscripts, setManuscripts] = useState([])
  const [payments, setPayments] = useState([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState('')
  const [userFilters, setUserFilters] = useState({
    role: '',
    status: '',
    search: ''
  })
  const [manuscriptFilters, setManuscriptFilters] = useState({
    status: '',
    category: '',
    search: ''
  })
  const [selectedManuscript, setSelectedManuscript] = useState(null)
  const [showManuscriptModal, setShowManuscriptModal] = useState(false)
  const [reviewers, setReviewers] = useState([])
  const [editors, setEditors] = useState([])
  const [showAssignReviewerModal, setShowAssignReviewerModal] = useState(false)
  const [showAssignEditorModal, setShowAssignEditorModal] = useState(false)
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([])
  const [selectedEditorId, setSelectedEditorId] = useState('')
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false)
  const [plagiarismReport, setPlagiarismReport] = useState(null)
  const router = useRouter()

  // Check authentication and admin access
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }
    
    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      
      setUser(parsedUser)
  loadDashboardData(token)
  loadPayments(token)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/admin')
    }
  }, [router])

  const loadDashboardData = async (token) => {
    try {
      // Load dashboard statistics
      await loadStatistics(token)
      // Load users
      await loadUsers(token, userFilters)
      // Load manuscripts
      await loadManuscripts(token)
      // Load reviewers
      await loadReviewers()
      await loadEditors()
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async (token) => {
    try {
      const response = await fetch(`${base_url}/api/admin/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setStatistics(data.statistics)
      } else {
        console.error('Failed to load statistics:', data.message)
        // Fallback to empty statistics if API fails
        setStatistics({
          totals: { users: 0, manuscripts: 0, reviews: 0, journals: 0, activeUsers: 0, pendingReviews: 0 },
          userStats: [],
          manuscriptStats: []
        })
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
      // Fallback to empty statistics on network error
      setStatistics({
        totals: { users: 0, manuscripts: 0, reviews: 0, journals: 0, activeUsers: 0, pendingReviews: 0 },
        userStats: [],
        manuscriptStats: []
      })
    }
  }

  const loadUsers = async (token, filters = {}) => {
    setIsLoadingUsers(true)
    setError('')
    try {
      // Clean up filters - remove empty strings
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )

      const queryParams = new URLSearchParams({
        page: 1,
        limit: 100,
        ...cleanFilters
      }).toString()

      const response = await fetch(`${base_url}/api/admin/users?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
      } else {
        console.error('Failed to load users:', data.message)
        setError(data.message || 'Failed to load users')
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setError(error.message || 'Error loading users')
      setUsers([])
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const loadManuscripts = async (token) => {
    try {
      const response = await fetch(`${base_url}/api/manuscripts/admin/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setManuscripts(data.manuscripts || [])
      } else {
        console.error('Failed to load manuscripts:', data.message)
        setManuscripts([])
      }
    } catch (error) {
      console.error('Error loading manuscripts:', error)
      setManuscripts([])
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        const updatedUsers = users.map(user => 
          user._id === userId 
            ? { ...user, isActive: !currentStatus }
            : user
        )
        setUsers(updatedUsers)
        alert(data.message || `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      } else {
        alert(data.message || 'Error updating user status')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Error updating user status. Please try again.')
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        const updatedUsers = users.map(user => 
          user._id === userId 
            ? { ...user, role: newRole }
            : user
        )
        setUsers(updatedUsers)
        alert(data.message || 'User role updated successfully')
      } else {
        alert(data.message || 'Error updating user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error updating user role. Please try again.')
    }
  }

  const handleUserFilterChange = async (filterType, value) => {
    const newFilters = { ...userFilters, [filterType]: value }
    setUserFilters(newFilters)
    
    const token = localStorage.getItem('token')
    if (token) {
      await loadUsers(token, newFilters)
    }
  }

  const handleManuscriptFilterChange = async (filterType, value) => {
    const newFilters = { ...manuscriptFilters, [filterType]: value }
    setManuscriptFilters(newFilters)
    
    const token = localStorage.getItem('token')
    if (token) {
      await loadFilteredManuscripts(token, newFilters)
    }
  }

  const loadFilteredManuscripts = async (token, filters = {}) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )

      const queryParams = new URLSearchParams({
        page: 1,
        limit: 100,
        ...cleanFilters
      }).toString()

      const response = await fetch(`${base_url}/api/manuscripts/admin/all?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setManuscripts(data.manuscripts || [])
      } else {
        console.error('Failed to load manuscripts:', data.message)
        setManuscripts([])
      }
    } catch (error) {
      console.error('Error loading manuscripts:', error)
      setManuscripts([])
    }
  }

  const updateManuscriptStatus = async (manuscriptId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/manuscripts/${manuscriptId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        const updatedManuscripts = manuscripts.map(manuscript => 
          manuscript._id === manuscriptId 
            ? { ...manuscript, status: newStatus }
            : manuscript
        )
        setManuscripts(updatedManuscripts)
        alert('Manuscript status updated successfully')
      } else {
        alert(data.message || 'Error updating manuscript status')
      }
    } catch (error) {
      console.error('Error updating manuscript status:', error)
      alert('Error updating manuscript status. Please try again.')
    }
  }

  const loadReviewers = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/admin/users?role=reviewer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setReviewers(data.users.filter(user => user.role === 'reviewer'))
      } else {
        console.error('Failed to load reviewers:', data.message)
      }
    } catch (error) {
      console.error('Error loading reviewers:', error)
    }
  }

  const loadEditors = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/admin/users?role=editor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setEditors(data.users.filter(user => user.role === 'editor'))
      } else {
        console.error('Failed to load editors:', data.message)
      }
    } catch (error) {
      console.error('Error loading editors:', error)
    }
  }

  const assignReviewer = async (manuscriptId, reviewerIds) => {
    try {
      const token = localStorage.getItem('token')
      
      console.log('🔍 DEBUG: Assigning reviewers:', {
        manuscriptId,
        reviewerIds,
        reviewerIdsArray: Array.isArray(reviewerIds) ? reviewerIds : [reviewerIds]
      })

      const response = await fetch(`${base_url}/api/reviews/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptId,
          reviewerIds: Array.isArray(reviewerIds) ? reviewerIds : [reviewerIds],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }),
      })

      console.log('🔍 DEBUG: Assignment response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        alert('Reviewer(s) assigned successfully')
        // Optionally reload manuscripts to reflect changes
        loadManuscripts()
      } else {
        alert(data.message || 'Error assigning reviewer')
      }
    } catch (error) {
      console.error('Error assigning reviewer:', error)
      alert('Error assigning reviewer. Please try again.')
    }
  }

  const assignEditor = async (manuscriptId, editorId) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/editorial/assign-editor/${manuscriptId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editorId: editorId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        alert('Editor assigned successfully')
        setShowAssignEditorModal(false)
        setSelectedManuscript(null)
        setSelectedEditorId('')
        // Reload manuscripts to reflect changes
        loadManuscripts()
      } else {
        alert(data.message || 'Error assigning editor')
      }
    } catch (error) {
      console.error('Error assigning editor:', error)
      alert('Error assigning editor. Please try again.')
    }
  }

  const openAssignEditorModal = (manuscript) => {
    setSelectedManuscript(manuscript)
    setSelectedEditorId('')
    setShowAssignEditorModal(true)
  }

  const openAssignReviewerModal = (manuscript) => {
    setSelectedManuscript(manuscript)
    setSelectedReviewerIds([])
    setShowAssignReviewerModal(true)
  }

  const handleAssignReviewer = async () => {
    if (selectedReviewerIds.length === 0) {
      alert('Please select at least one reviewer')
      return
    }

    await assignReviewer(selectedManuscript._id, selectedReviewerIds)
    setShowAssignReviewerModal(false)
    setSelectedReviewerIds([])
  }

  const runPlagiarismCheck = async (manuscriptId) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/plagiarism/check/${manuscriptId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setPlagiarismReport(data.report)
        setShowPlagiarismModal(true)
        // Reload manuscripts to reflect updated plagiarism status
        loadManuscripts()
      } else {
        alert(data.message || 'Error running plagiarism check')
      }
    } catch (error) {
      console.error('Error running plagiarism check:', error)
      alert('Error running plagiarism check. Please try again.')
    }
  }

  const viewPlagiarismReport = async (manuscriptId) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/plagiarism/report/${manuscriptId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setPlagiarismReport(data.report)
        setShowPlagiarismModal(true)
      } else {
        alert(data.message || 'Error fetching plagiarism report')
      }
    } catch (error) {
      console.error('Error fetching plagiarism report:', error)
      alert('Error fetching plagiarism report. Please try again.')
    }
  }

  const viewManuscriptDetails = (manuscript) => {
    setSelectedManuscript(manuscript)
    setShowManuscriptModal(true)
  }

  const debugManuscripts = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${base_url}/api/editorial/debug-manuscripts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log('🔍 DEBUG: Manuscript assignment debug:', data)
      alert(`Debug Info:\nTotal manuscripts: ${data.totalManuscripts}\nAssigned manuscripts: ${data.assignedManuscripts}\nCheck console for details.`)
      
    } catch (error) {
      console.error('Error in debug:', error)
      alert('Debug failed - check console')
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      'draft': { bg: '#f3f4f6', color: '#374151' },
      'submitted': { bg: '#dbeafe', color: '#1e40af' },
      'under-review': { bg: '#fef3c7', color: '#92400e' },
      'revision-requested': { bg: '#fed7aa', color: '#c2410c' },
      'accepted': { bg: '#dcfce7', color: '#166534' },
      'rejected': { bg: '#fee2e2', color: '#dc2626' },
      'published': { bg: '#e9d5ff', color: '#7c3aed' }
    }

    const style = statusStyles[status] || statusStyles['draft']

    return (
      <span 
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: style.bg,
          color: style.color
        }}
      >
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    )
  }

  const getRoleBadge = (role) => {
    const roleStyles = {
      'admin': { bg: '#fee2e2', color: '#dc2626' },
      'editor': { bg: '#e9d5ff', color: '#7c3aed' },
      'reviewer': { bg: '#dbeafe', color: '#1e40af' },
      'author': { bg: '#dcfce7', color: '#166534' }
    }

    const style = roleStyles[role] || roleStyles['author']

    return (
      <span 
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: style.bg,
          color: style.color
        }}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  // Main component render logic
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading Admin Dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="header">
        <div className="max-w-7xl container">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              NigJournal Admin
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Admin: {user.firstName} {user.lastName}
              </span>
              <Link 
                href="/dashboard"
                className="text-green-600 text-sm"
                style={{textDecoration: 'underline'}}
              >
                User Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl container py-6">
        {/* Main content */}
        <div className="card">
          {/* Tabs */}
          <div style={{borderBottom: '1px solid #e5e7eb'}}>
            <nav className="flex">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'dashboard' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'dashboard' ? '#059669' : '#6b7280'
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'users' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'users' ? '#059669' : '#6b7280'
                }}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('manuscripts')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'manuscripts' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'manuscripts' ? '#059669' : '#6b7280'
                }}
              >
                Manuscripts
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'reviews' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'reviews' ? '#059669' : '#6b7280'
                }}
              >
                Reviews
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'payments' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'payments' ? '#059669' : '#6b7280'
                }}
              >
                Payments
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && statistics && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">System Overview</h2>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-3 gap-4 mb-8">
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {statistics.totals.users}
                    </div>
                    <div className="text-sm text-gray-600">Total Users</div>
                    <div className="text-xs text-green-600 mt-1">
                      {statistics.totals.activeUsers} active
                    </div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {statistics.totals.manuscripts}
                    </div>
                    <div className="text-sm text-gray-600">Total Manuscripts</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {statistics.totals.pendingReviews}
                    </div>
                    <div className="text-sm text-gray-600">Pending Reviews</div>
                  </div>
                </div>

                {/* User Roles Distribution */}
                <div className="grid grid-cols-1 grid-md-cols-2 gap-6 mb-8">
                  <div className="card">
                    <h3 className="text-md font-medium text-gray-900 mb-4">User Roles</h3>
                    <div className="space-y-3">
                      {statistics.userStats.map((stat) => (
                        <div key={stat._id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            {getRoleBadge(stat._id)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {stat.count} users
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Manuscript Status</h3>
                    <div className="space-y-3">
                      {statistics.manuscriptStats.map((stat) => (
                        <div key={stat._id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            {getStatusBadge(stat._id)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {stat.count} manuscripts
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                  <div className="flex space-x-4">
                    <select
                      value={userFilters.role}
                      onChange={(e) => handleUserFilterChange('role', e.target.value)}
                      className="form-input text-sm"
                      style={{ width: 'auto' }}
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="author">Author</option>
                    </select>
                    <select
                      value={userFilters.status}
                      onChange={(e) => handleUserFilterChange('status', e.target.value)}
                      className="form-input text-sm"
                      style={{ width: 'auto' }}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userFilters.search}
                      onChange={(e) => handleUserFilterChange('search', e.target.value)}
                      className="form-input text-sm"
                      style={{ width: '200px' }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-red-700 text-sm">{error}</div>
                  </div>
                )}

                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading users...</div>
                  </div>
                ) : (
                  <div className="users-table" style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                      <thead>
                        <tr style={{backgroundColor: '#f9fafb'}}>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Name</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Role</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Institution</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-gray-500">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map((user, index) => (
                            <tr 
                              key={user._id} 
                              style={{
                                borderBottom: '1px solid #e5e7eb',
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                              }}
                            >
                              <td className="p-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                              </td>
                              <td className="p-4 text-sm text-gray-500">
                                {user.email}
                              </td>
                              <td className="p-4">
                                <select
                                  value={user.role}
                                  onChange={(e) => updateUserRole(user._id, e.target.value)}
                                  className="text-xs border rounded px-2 py-1"
                                >
                                  <option value="author">Author</option>
                                  <option value="reviewer">Reviewer</option>
                                  <option value="editor">Editor</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="p-4 text-sm text-gray-500">
                                {user.institution || 'Not specified'}
                              </td>
                              <td className="p-4">
                                <span 
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2',
                                    color: user.isActive ? '#166534' : '#dc2626'
                                  }}
                                >
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => toggleUserStatus(user._id, user.isActive)}
                                  className="text-sm btn btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem' }}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Manuscripts Tab */}
            {activeTab === 'manuscripts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Manuscript Management</h2>
                  <div className="flex space-x-4">
                    <select
                      value={manuscriptFilters.status}
                      onChange={(e) => handleManuscriptFilterChange('status', e.target.value)}
                      className="form-input text-sm"
                      style={{ width: 'auto' }}
                    >
                      <option value="">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="under-review">Under Review</option>
                      <option value="revision-requested">Revision Requested</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="published">Published</option>
                    </select>
                    <select
                      value={manuscriptFilters.category}
                      onChange={(e) => handleManuscriptFilterChange('category', e.target.value)}
                      className="form-input text-sm"
                      style={{ width: 'auto' }}
                    >
                      <option value="">All Categories</option>
                      <option value="Agricultural Sciences">Agricultural Sciences</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Environmental Science">Environmental Science</option>
                      <option value="Health Sciences">Health Sciences</option>
                      <option value="Social Sciences">Social Sciences</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search manuscripts..."
                      value={manuscriptFilters.search}
                      onChange={(e) => handleManuscriptFilterChange('search', e.target.value)}
                      className="form-input text-sm"
                      style={{ width: '200px' }}
                    />
                  </div>
                </div>

                {/* Manuscript Statistics */}
                <div className="grid grid-cols-1 grid-md-cols-4 gap-4 mb-6">
                  <div className="card text-center">
                    <div className="text-xl font-bold text-blue-600 mb-1">
                      {manuscripts.filter(m => m.status === 'submitted').length}
                    </div>
                    <div className="text-sm text-gray-600">New Submissions</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-xl font-bold text-yellow-600 mb-1">
                      {manuscripts.filter(m => m.status === 'under-review').length}
                    </div>
                    <div className="text-sm text-gray-600">Under Review</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-xl font-bold text-green-600 mb-1">
                      {manuscripts.filter(m => m.status === 'accepted').length}
                    </div>
                    <div className="text-sm text-gray-600">Accepted</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-xl font-bold text-red-600 mb-1">
                      {manuscripts.filter(m => m.status === 'rejected').length}
                    </div>
                    <div className="text-sm text-gray-600">Rejected</div>
                  </div>
                </div>
                
                <div className="manuscripts-table" style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{backgroundColor: '#f9fafb'}}>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Title</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Author</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Category</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Submitted</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manuscripts.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-500">
                            No manuscripts found
                          </td>
                        </tr>
                      ) : (
                        manuscripts.map((manuscript, index) => (
                          <tr 
                            key={manuscript._id} 
                            style={{
                              borderBottom: '1px solid #e5e7eb',
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                            }}
                          >
                            <td className="p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {manuscript.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {manuscript._id}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-gray-900">
                                {manuscript.submittedBy.firstName} {manuscript.submittedBy.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {manuscript.submittedBy.email}
                              </div>
                            </td>
                            <td className="p-4">
                              <select
                                value={manuscript.status}
                                onChange={(e) => updateManuscriptStatus(manuscript._id, e.target.value)}
                                className="text-xs border rounded px-2 py-1"
                              >
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="under-review">Under Review</option>
                                <option value="revision-requested">Revision Requested</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="published">Published</option>
                              </select>
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {manuscript.category}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {new Date(manuscript.submissionDate || manuscript.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => viewManuscriptDetails(manuscript)}
                                  className="text-green-600 text-sm"
                                  style={{textDecoration: 'underline'}}
                                >
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Review Management</h2>
                <div className="text-center py-12">
                  <div className="text-gray-500">Review management features coming soon</div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: '2rem' }}>
                <h2 className="text-xl font-semibold text-gray-900 mb-8">All Payments</h2>
                <div className="flex md:flex-col md:items-center md:justify-center gap-8 mb-8 w-full">
                  <div className="bg-gray-50 rounded-lg shadow p-6 flex flex-col items-center border border-gray-100 min-w-[180px]">
                    <div className="text-2xl font-bold text-green-600 mb-1">{payments.filter(p => p.status === 'completed').length}</div>
                    <div className="text-base text-gray-600">Successful Payments</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg shadow p-6 flex flex-col items-center border border-gray-100 min-w-[180px]">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{payments.filter(p => p.status === 'pending' || p.status === 'processing').length}</div>
                    <div className="text-base text-gray-600">Pending Payments</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg shadow p-6 flex flex-col items-center border border-gray-100 min-w-[180px]">
                    <div className="text-2xl font-bold text-gray-700 mb-1">₦{(payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) / 100).toFixed(2)}</div>
                    <div className="text-base text-gray-600">Total Amount Paid</div>
                  </div>
                </div>
                {isLoadingPayments ? (
                  <div className="text-center py-12 w-full">
                    <div className="text-gray-500 text-lg">Loading payments...</div>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 w-full">
                    <div className="text-5xl mb-4">💸</div>
                    <div className="text-lg text-gray-700 font-semibold mb-2">No payments found</div>
                    <div className="text-gray-400">Payments will appear here once authors complete their publication fees.</div>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto mt-8">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manuscript</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment, index) => (
                          <tr key={payment._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.manuscript?.title || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.manuscript?.author?.name || payment.manuscript?.submittedBy?.firstName || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">₦{(payment.amount / 100).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                payment.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {payment.status === 'completed' ? 'Successful' :
                                  payment.status === 'failed' ? 'Failed' :
                                  payment.status === 'processing' ? 'Processing' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{payment.paymentReference || payment.paystackReference || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manuscript Details Modal */}
      {showManuscriptModal && selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Manuscript Details
              </h3>
              <button
                onClick={() => {
                  setShowManuscriptModal(false)
                  setSelectedManuscript(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 grid-md-cols-2 gap-6">
              {/* Basic Information */}
              <div className="card">
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>
                    <div className="mt-1">{selectedManuscript.title}</div>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedManuscript.status)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <div className="mt-1">{selectedManuscript.category}</div>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <div className="mt-1">{selectedManuscript.manuscriptType || 'Research Article'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Submission Date:</span>
                    <div className="mt-1">{new Date(selectedManuscript.submissionDate || selectedManuscript.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="font-medium">Plagiarism Check:</span>
                    <div className="mt-1">
                      {selectedManuscript.plagiarismCheck?.status === 'completed' ? (
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedManuscript.plagiarismCheck.similarityStatus === 'acceptable' 
                              ? 'bg-green-100 text-green-800'
                              : selectedManuscript.plagiarismCheck.similarityStatus === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedManuscript.plagiarismCheck.overallSimilarity}% similarity
                          </span>
                          <span className="text-xs text-gray-500">
                            ({selectedManuscript.plagiarismCheck.similarityStatus})
                          </span>
                        </div>
                      ) : selectedManuscript.plagiarismCheck?.status === 'processing' ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          ⏳ Processing...
                        </span>
                      ) : selectedManuscript.plagiarismCheck?.status === 'failed' ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          ❌ Check Failed
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          📋 Not Checked
                        </span>
                      )}
                      {selectedManuscript.plagiarismCheck?.scanDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Checked: {new Date(selectedManuscript.plagiarismCheck.scanDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Author Information */}
              <div className="card">
                <h4 className="font-medium text-gray-900 mb-3">Author Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Submitted By:</span>
                    <div className="mt-1">
                      {selectedManuscript.submittedBy.firstName} {selectedManuscript.submittedBy.lastName}
                    </div>
                    <div className="text-gray-500">{selectedManuscript.submittedBy.email}</div>
                    <div className="text-gray-500">{selectedManuscript.submittedBy.institution}</div>
                  </div>
                  {selectedManuscript.authors && selectedManuscript.authors.length > 0 && (
                    <div>
                      <span className="font-medium">Co-authors:</span>
                      <div className="mt-1 space-y-1">
                        {selectedManuscript.authors.map((author, index) => (
                          <div key={index} className="text-gray-600">
                            {author.name} - {author.institution}
                            {author.isCorresponding && <span className="text-green-600 ml-2">(Corresponding)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Abstract */}
              <div className="card col-span-full">
                <h4 className="font-medium text-gray-900 mb-3">Abstract</h4>
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                  {selectedManuscript.abstract || 'No abstract available'}
                </div>
              </div>

              {/* Keywords */}
              {selectedManuscript.keywords && selectedManuscript.keywords.length > 0 && (
                <div className="card">
                  <h4 className="font-medium text-gray-900 mb-3">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedManuscript.keywords.map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              <div className="card">
                <h4 className="font-medium text-gray-900 mb-3">Files</h4>
                <div className="space-y-2 text-sm">
                  {selectedManuscript.files && selectedManuscript.files.length > 0 ? (
                    selectedManuscript.files.map((file, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{file.originalName}</div>
                          <div className="text-gray-500 text-xs">
                            {file.fileType} • {Math.round(file.size / 1024)} KB
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline text-xs"
                        >
                          Download
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No files uploaded</div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Admin Actions</h4>
              <div className="flex space-x-4">
                <select
                  value={selectedManuscript.status}
                  onChange={(e) => {
                    updateManuscriptStatus(selectedManuscript._id, e.target.value)
                    setSelectedManuscript({...selectedManuscript, status: e.target.value})
                  }}
                  className="form-input"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under-review">Under Review</option>
                  <option value="revision-requested">Revision Requested</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
                <button 
                  className="btn btn-secondary"
                  onClick={() => openAssignReviewerModal(selectedManuscript)}
                >
                  Assign Reviewer
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => openAssignEditorModal(selectedManuscript)}
                >
                  Assign Editor
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => runPlagiarismCheck(selectedManuscript._id)}
                  disabled={selectedManuscript.plagiarismCheck?.status === 'processing'}
                >
                  {selectedManuscript.plagiarismCheck?.status === 'processing' 
                    ? '⏳ Checking...' 
                    : selectedManuscript.plagiarismCheck?.status === 'completed'
                    ? '🔍 Re-check Plagiarism'
                    : '🔍 Check Plagiarism'
                  }
                </button>
                {selectedManuscript.plagiarismCheck?.status === 'completed' && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => viewPlagiarismReport(selectedManuscript._id)}
                  >
                    📊 View Report
                  </button>
                )}
                <button className="btn btn-outline">
                  Send Message to Author
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowManuscriptModal(false)
                  setSelectedManuscript(null)
                }}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Reviewer Modal */}
      {showAssignReviewerModal && selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Reviewer to: {selectedManuscript.title}
              </h3>
              <button
                onClick={() => {
                  setShowAssignReviewerModal(false)
                  setSelectedReviewerIds([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Reviewers:
              </label>
              <div className="space-y-2 max-h-60 overflow-auto">
                {reviewers.map((reviewer) => (
                  <label key={reviewer._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedReviewerIds.includes(reviewer._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReviewerIds(prev => [...prev, reviewer._id])
                        } else {
                          setSelectedReviewerIds(prev => prev.filter(id => id !== reviewer._id))
                        }
                      }}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {reviewer.firstName} {reviewer.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reviewer.email}
                      </div>
                      {reviewer.affiliation && (
                        <div className="text-xs text-gray-400">
                          {reviewer.affiliation}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignReviewerModal(false)
                  setSelectedReviewerIds([])
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignReviewer}
                className="btn btn-primary"
                disabled={selectedReviewerIds.length === 0}
              >
                Assign {selectedReviewerIds.length > 0 ? `(${selectedReviewerIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Editor Modal */}
      {showAssignEditorModal && selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Editor to: {selectedManuscript.title}
                </h3>
                <button
                  onClick={() => {
                    setShowAssignEditorModal(false)
                    setSelectedEditorId('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Editor
                </label>
                <select
                  value={selectedEditorId}
                  onChange={(e) => setSelectedEditorId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select an editor...</option>
                  {editors.map(editor => (
                    <option key={editor._id} value={editor._id}>
                      {editor.firstName} {editor.lastName} ({editor.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignEditorModal(false)
                  setSelectedEditorId('')
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => assignEditor(selectedManuscript._id, selectedEditorId)}
                className="btn btn-primary"
                disabled={!selectedEditorId}
              >
                Assign Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plagiarism Report Modal */}
      {showPlagiarismModal && plagiarismReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Plagiarism Report
                </h3>
                <button
                  onClick={() => {
                    setShowPlagiarismModal(false)
                    setPlagiarismReport(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Color Legend */}
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-800 mb-2">Color Legend</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="plagiarism-highlight plagiarism-high px-2 py-1">High Risk</span>
                    <span className="text-gray-600">70%+ similarity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="plagiarism-highlight plagiarism-moderate px-2 py-1">Moderate</span>
                    <span className="text-gray-600">40-69% similarity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="plagiarism-highlight plagiarism-low px-2 py-1">Low Risk</span>
                    <span className="text-gray-600">0-39% similarity</span>
                  </div>
                </div>
              </div>

              {/* Overall Statistics */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      plagiarismReport.similarity <= 15 ? 'text-green-600' : 
                      plagiarismReport.similarity <= 30 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {plagiarismReport.similarity}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Similarity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {plagiarismReport.sources?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Sources Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {plagiarismReport.textMatches ? 
                        Object.values(plagiarismReport.textMatches).flat().length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Text Matches</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-semibold px-2 py-1 rounded ${
                      plagiarismReport.similarity <= 15 ? 'bg-green-100 text-green-800' : 
                      plagiarismReport.similarity <= 30 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {plagiarismReport.similarity <= 15 ? 'ACCEPTABLE' : 
                       plagiarismReport.similarity <= 30 ? 'MODERATE' : 'HIGH RISK'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Highlights */}
              {plagiarismReport.textMatches && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Highlighted Matches</h4>
                  
                  {/* Title Matches */}
                  {plagiarismReport.textMatches.title?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Title</h5>
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <HighlightedText 
                          text={selectedManuscript?.title || ''} 
                          matches={plagiarismReport.textMatches.title}
                        />
                      </div>
                    </div>
                  )}

                  {/* Abstract Matches */}
                  {plagiarismReport.textMatches.abstract?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Abstract</h5>
                      <div className="p-3 border rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                        <HighlightedText 
                          text={selectedManuscript?.abstract || ''} 
                          matches={plagiarismReport.textMatches.abstract}
                        />
                      </div>
                    </div>
                  )}

                  {/* Content Matches */}
                  {plagiarismReport.textMatches.content?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Content</h5>
                      <div className="p-3 border rounded-lg bg-gray-50 max-h-60 overflow-y-auto">
                        <HighlightedText 
                          text={selectedManuscript?.content || ''} 
                          matches={plagiarismReport.textMatches.content}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sources */}
              {plagiarismReport.sources?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Similar Sources</h4>
                  <div className="space-y-3">
                    {plagiarismReport.sources.map((source, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{source.title}</h5>
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: source.color }}
                            ></span>
                            <span className="text-sm font-semibold">
                              {source.similarity?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Type: {source.matchType} • Location: {source.location}
                        </div>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {source.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {plagiarismReport.recommendations && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Recommendations</h4>
                  <div className="space-y-2">
                    {plagiarismReport.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowPlagiarismModal(false)
                    setPlagiarismReport(null)
                  }}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component to highlight text matches
function HighlightedText({ text, matches }) {
  if (!text || !matches || matches.length === 0) {
    return <span>{text}</span>
  }

  // Sort matches by start index to avoid overlapping
  const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex)
  
  const parts = []
  let lastIndex = 0

  sortedMatches.forEach((match, i) => {
    // Add text before the match
    if (match.startIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.startIndex),
        key: `text-${i}`
      })
    }

    // Add the highlighted match
    parts.push({
      type: 'highlight',
      content: text.slice(match.startIndex, match.endIndex),
      color: match.color,
      similarity: match.similarity,
      key: `match-${i}`
    })

    lastIndex = match.endIndex
  })

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
      key: 'text-end'
    })
  }

  return (
    <span>
      {parts.map((part) => {
        if (part.type === 'highlight') {
          const severityClass = part.similarity >= 70 ? 'plagiarism-high' :
                               part.similarity >= 40 ? 'plagiarism-moderate' : 'plagiarism-low'
          
          return (
            <span
              key={part.key}
              className={`plagiarism-highlight ${severityClass}`}
              data-similarity={`${part.similarity?.toFixed(1)}% similarity`}
              title={`${part.similarity?.toFixed(1)}% similarity - Click to view source`}
            >
              {part.content}
            </span>
          )
        }
        return <span key={part.key}>{part.content}</span>
      })}
    </span>
  )
}