'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const base_url = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('manuscripts')
  const [user, setUser] = useState(null)
  const [manuscripts, setManuscripts] = useState([])
  const [payments, setPayments] = useState([])
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedManuscript, setSelectedManuscript] = useState(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [showManuscriptModal, setShowManuscriptModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [notification, setNotification] = useState('')
  const [reviewForm, setReviewForm] = useState({
    recommendation: '',
    overallScore: 5,
    originality: 5,
    methodology: 5,
    significance: 5,
    clarity: 5,
    comments: '',
    confidentialComments: ''
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    department: '',
    phoneNumber: '',
    country: 'Nigeria',
    orcidId: '',
    biography: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Country list with common African and international countries
  const countries = [
    { code: 'NG', name: 'Nigeria', dialCode: '+234' },
    { code: 'GH', name: 'Ghana', dialCode: '+233' },
    { code: 'KE', name: 'Kenya', dialCode: '+254' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27' },
    { code: 'EG', name: 'Egypt', dialCode: '+20' },
    { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
    { code: 'UG', name: 'Uganda', dialCode: '+256' },
    { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
    { code: 'RW', name: 'Rwanda', dialCode: '+250' },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226' },
    { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225' },
    { code: 'SN', name: 'Senegal', dialCode: '+221' },
    { code: 'ML', name: 'Mali', dialCode: '+223' },
    { code: 'BJ', name: 'Benin', dialCode: '+229' },
    { code: 'TG', name: 'Togo', dialCode: '+228' },
    { code: 'CM', name: 'Cameroon', dialCode: '+237' },
    { code: 'CD', name: 'Democratic Republic of Congo', dialCode: '+243' },
    { code: 'ZM', name: 'Zambia', dialCode: '+260' },
    { code: 'ZW', name: 'Zimbabwe', dialCode: '+263' },
    { code: 'MW', name: 'Malawi', dialCode: '+265' },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258' },
    { code: 'AO', name: 'Angola', dialCode: '+244' },
    { code: 'BW', name: 'Botswana', dialCode: '+267' },
    { code: 'NA', name: 'Namibia', dialCode: '+264' },
    { code: 'LS', name: 'Lesotho', dialCode: '+266' },
    { code: 'SZ', name: 'Eswatini', dialCode: '+268' },
    { code: 'US', name: 'United States', dialCode: '+1' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
    { code: 'CA', name: 'Canada', dialCode: '+1' },
    { code: 'AU', name: 'Australia', dialCode: '+61' },
    { code: 'DE', name: 'Germany', dialCode: '+49' },
    { code: 'FR', name: 'France', dialCode: '+33' },
    { code: 'IN', name: 'India', dialCode: '+91' },
    { code: 'CN', name: 'China', dialCode: '+86' },
    { code: 'JP', name: 'Japan', dialCode: '+81' },
    { code: 'BR', name: 'Brazil', dialCode: '+55' }
  ].sort((a, b) => a.name.localeCompare(b.name))

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Scroll to modal when it opens
  useEffect(() => {
    if (showManuscriptModal || showReviewModal) {
      // Wait for modal to render then scroll
      setTimeout(() => {
        const modal = document.querySelector('.fixed.inset-0')
        if (modal) {
          modal.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // Focus the modal for accessibility
          modal.focus()
        }
      }, 100)
    }
  }, [showManuscriptModal, showReviewModal])

  // Check authentication and load user data
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }
    
    try {
      const parsedUser = JSON.parse(userData)
      console.log('🔍 DEBUG: User data loaded:', {
        id: parsedUser.id,
        name: parsedUser.firstName + ' ' + parsedUser.lastName,
        role: parsedUser.role,
        email: parsedUser.email
      })
      setUser(parsedUser)
      setEditForm({
        firstName: parsedUser.firstName || parsedUser.name || '',
        lastName: parsedUser.lastName || '',
        email: parsedUser.email || '',
        institution: parsedUser.institution || '',
        department: parsedUser.department || '',
        phoneNumber: parsedUser.phoneNumber || '',
        country: parsedUser.country || 'Nigeria',
        orcidId: parsedUser.orcidId || '',
        biography: parsedUser.biography || parsedUser.bio || ''
      })
      loadManuscripts(token)
      loadPayments(token)
      
      // Only load reviews if user has reviewer role
      if (parsedUser.role === 'reviewer' || parsedUser.role === 'admin') {
        console.log('🔍 DEBUG: User is reviewer/admin, loading reviews...')
        loadReviews(token)
      } else {
        console.log('🔍 DEBUG: User is not reviewer/admin, skipping reviews')
      }
      
      // Check for payment success callback
      checkPaymentCallback(token)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }
  }, [router])

  // Check for payment callback parameters
  const checkPaymentCallback = async (token) => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const manuscriptId = urlParams.get('manuscriptId')
    const reference = urlParams.get('trxref') // Paystack sends this parameter
    
    if (paymentStatus === 'success' && reference) {
      console.log('Payment callback detected:', { reference, manuscriptId })
      
      try {
        // Verify the payment with our backend
        const verifyResponse = await fetch(`${base_url}/api/payments/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference: reference,
            manuscriptId: manuscriptId
          }),
        })

        const verifyData = await verifyResponse.json()
        
        if (verifyData.success) {
          alert('✅ Payment successful! Your manuscript payment has been confirmed.')
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname)
          // Reload data to reflect payment status
          loadManuscripts(token)
          loadPayments(token)
        } else {
          alert('❌ Payment verification failed. Please contact support with reference: ' + reference)
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        alert('❌ Payment verification error. Please contact support with reference: ' + reference)
      }
    }
  }

  // No need to check for Paystack loading since we're using server-to-server integration
  useEffect(() => {
    setPaystackLoaded(true) // Always ready for server-side payment
  }, [])

  const loadManuscripts = async (token) => {
    try {
      const response = await fetch(`${base_url}/api/manuscripts`, {
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
        // Map the backend data to frontend format and add payment info for accepted manuscripts
        const mappedManuscripts = (data.manuscripts || []).map(manuscript => ({
          id: manuscript._id,
          title: manuscript.title,
          status: manuscript.status,
          submissionDate: new Date(manuscript.submissionDate || manuscript.createdAt).toLocaleDateString(),
          category: manuscript.category,
          reviewers: manuscript.reviewAssignments ? manuscript.reviewAssignments.length : 0,
          paymentRequired: manuscript.status === 'accepted' && !manuscript.paymentCompleted,
          publicationFee: manuscript.publicationFee || 5000000, // Use backend value or default to ₦50,000 in kobo
          paymentCompleted: manuscript.paymentCompleted || false,
          paymentReference: manuscript.paymentReference
        }))
        setManuscripts(mappedManuscripts)
      } else {
        console.error('Failed to load manuscripts:', data.message)
        setManuscripts([])
      }
    } catch (error) {
      console.error('Error loading manuscripts:', error)
      // Fallback to empty array on error
      setManuscripts([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadPayments = async (token) => {
    try {
      const response = await fetch(`${base_url}/api/payments`, {
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
        // Map payment data to expected format
        const mappedPayments = (data.payments || []).map(payment => ({
          id: payment._id,
          manuscriptId: payment.manuscript?._id,
          manuscriptTitle: payment.manuscript?.title,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentReference: payment.paymentReference,
          paystackReference: payment.paystackReference,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          metadata: payment.metadata
        }))
        setPayments(mappedPayments)
      } else {
        console.error('Failed to load payments:', data.message)
        setPayments([])
      }
    } catch (error) {
      console.error('Error loading payments:', error)
      setPayments([])
    }
  }

  const loadReviews = async (token) => {
    try {
      console.log('🔍 DEBUG: Loading reviews for user...')
      console.log('🔍 DEBUG: Token being used:', token ? 'Token exists' : 'No token')
      
      const response = await fetch(`${base_url}/api/reviews/my-assignments?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      })

      console.log('🔍 DEBUG: Reviews response status:', response.status)
      console.log('🔍 DEBUG: Reviews response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔍 DEBUG: Reviews failed with response:', errorText)
        console.error('🔍 DEBUG: This might be an authentication or server issue')
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('🔍 DEBUG: Reviews response data:', data)
      console.log('🔍 DEBUG: Data success:', data.success)
      console.log('🔍 DEBUG: Reviews array:', data.reviews)
      
      if (data.success) {
        console.log('🔍 DEBUG: Setting reviews:', data.reviews?.length || 0, 'reviews found')
        if (data.reviews?.length > 0) {
          console.log('🔍 DEBUG: First review sample:', data.reviews[0])
        }
        setReviews(data.reviews || [])
      } else {
        console.error('🔍 DEBUG: API returned success=false:', data.message)
        setReviews([])
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error loading reviews:', error)
      console.error('🔍 DEBUG: Error details:', error.message)
      setReviews([])
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleEditProfile = () => {
    setIsEditingProfile(true)
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    // Reset form to original user data
    setEditForm({
      firstName: user.firstName || user.name || '',
      lastName: user.lastName || '',
      email: user.email || '',
      institution: user.institution || '',
      department: user.department || '',
      phoneNumber: user.phoneNumber || '',
      country: user.country || 'Nigeria',
      orcidId: user.orcidId || '',
      biography: user.biography || user.bio || ''
    })
  }

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getSelectedCountry = () => {
    return countries.find(country => country.name === editForm.country) || countries.find(country => country.name === 'Nigeria')
  }

  const formatPhoneNumber = (phone, dialCode) => {
    if (!phone) return ''
    // Remove any existing dial code or special characters
    let cleaned = phone.replace(/[^\d]/g, '')
    
    // If it doesn't start with the country code, add it
    const codeDigits = dialCode.replace('+', '')
    if (!cleaned.startsWith(codeDigits)) {
      // Remove leading zeros or local prefixes if any
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1)
      }
      cleaned = codeDigits + cleaned
    }
    
    return '+' + cleaned
  }

  const handlePaymentClick = (manuscript) => {
    setSelectedManuscript(manuscript)
    setShowPaymentModal(true)
  }

  const processPayment = async (paymentMethod) => {
    if (!selectedManuscript) {
      console.error('No manuscript selected for payment')
      return
    }
    
    console.log('Processing payment for manuscript:', selectedManuscript)
    setIsProcessingPayment(true)
    
    try {
      const token = localStorage.getItem('token')
      const userData = JSON.parse(localStorage.getItem('user'))
      
      if (!token || !userData) {
        alert('Authentication required. Please log in again.')
        setIsProcessingPayment(false)
        return
      }
      
      console.log('Initiating Paystack payment via server...')
      
      // Call backend to initialize Paystack payment
      const response = await fetch(`${base_url}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptId: selectedManuscript.id
        }),
      })

      const data = await response.json()
      console.log('Payment initialization response:', data)
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to initialize payment')
      }

      // Redirect to Paystack payment page
      console.log('Redirecting to Paystack payment page:', data.authorization_url)
      window.location.href = data.authorization_url
      
    } catch (error) {
      console.error('Payment initialization error:', error)
      
      // More specific error messages
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        alert('Network connection error. Please check your internet connection and try again.')
      } else {
        alert(`Payment initialization failed: ${error.message}`)
      }
      
      setIsProcessingPayment(false)
    }
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    if (currency === 'NGN') {
      return `₦${(amount / 100).toFixed(2)}`
    }
    return `${amount} ${currency}`
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      // For now, we'll update localStorage. In a real app, this would be an API call
      const updatedUser = {
        ...user,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        institution: editForm.institution,
        department: editForm.department,
        phoneNumber: editForm.phoneNumber,
        country: editForm.country,
        orcidId: editForm.orcidId,
        biography: editForm.biography,
        bio: editForm.biography, // Keep both for compatibility
        name: editForm.firstName // Update name field for compatibility
      }
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setIsEditingProfile(false)
      
      // In a real application, you would make an API call here:
      // const response = await fetch('/api/users/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(editForm),
      // })
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = [
    { label: 'Total Manuscripts', value: manuscripts.length.toString() },
    { label: 'Under Review', value: manuscripts.filter(m => m.status === 'under-review').length.toString() },
    { label: 'Accepted', value: manuscripts.filter(m => m.status === 'accepted').length.toString() },
    { label: 'Published', value: manuscripts.filter(m => m.status === 'published').length.toString() }
  ]

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="header">
        <div className="max-w-7xl container">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              NigJournal
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user.firstName || user.name} {user.lastName || ''}
              </span>
              {user.role === 'admin' && (
                <Link 
                  href="/admin"
                  className="btn btn-primary text-sm"
                  title="Admin Panel"
                >
                  Admin Panel
                </Link>
              )}
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
        {/* Stats */}
        <div className="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4 gap-4 mb-8">
          {stats.map((item, index) => (
            <div key={index} className="card">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {item.value}
                </div>
                <div className="text-sm text-gray-600">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="card">
          {/* Tabs */}
          <div style={{borderBottom: '1px solid #e5e7eb'}}>
            <nav className="flex">
              <button
                onClick={() => setActiveTab('manuscripts')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'manuscripts' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'manuscripts' ? '#059669' : '#6b7280'
                }}
              >
                My Manuscripts
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'profile' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'profile' ? '#059669' : '#6b7280'
                }}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('publications')}
                className="py-4 px-6 text-sm font-medium"
                style={{
                  borderBottom: activeTab === 'publications' ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === 'publications' ? '#059669' : '#6b7280'
                }}
              >
                Publications
              </button>
              {(user.role === 'admin' || user.role === 'author') && (
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
              )}
              {(user.role === 'reviewer' || user.role === 'admin') && (
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
              )}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'manuscripts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Your Manuscripts</h2>
                  <Link
                    href="/submit"
                    className="btn btn-primary text-sm"
                  >
                    + New Submission
                  </Link>
                </div>

                {manuscripts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">No manuscripts submitted yet</div>
                    <Link
                      href="/submit"
                      className="btn btn-primary"
                    >
                      Submit Your First Manuscript
                    </Link>
                  </div>
                ) : (
                  <div className="manuscripts-table" style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                      <thead>
                        <tr style={{backgroundColor: '#f9fafb'}}>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Title</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Category</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Submitted</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Payment</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manuscripts.map((manuscript, index) => (
                          <tr 
                            key={manuscript.id} 
                            style={{
                              borderBottom: '1px solid #e5e7eb',
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                            }}
                          >
                            <td className="p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {manuscript.title}
                              </div>
                            </td>
                            <td className="p-4">
                              {getStatusBadge(manuscript.status)}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {manuscript.category}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {manuscript.submissionDate}
                            </td>
                            <td className="p-4">
                              {manuscript.paymentRequired && manuscript.status === 'accepted' ? (
                                <button
                                  onClick={() => handlePaymentClick(manuscript)}
                                  className="btn btn-primary text-xs"
                                  style={{ padding: '0.5rem 1rem' }}
                                >
                                  Pay {formatCurrency(manuscript.publicationFee)}
                                </button>
                              ) : manuscript.paymentCompleted || manuscript.status === 'published' ? (
                                <span className="text-green-600 text-sm font-medium">Paid</span>
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </td>
                            <td className="p-4">
                              <Link
                                href={`/manuscript/${manuscript.id}`}
                                className="text-green-600 text-sm"
                                style={{textDecoration: 'underline'}}
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'publications' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Your Published Articles</h2>
                </div>

                {manuscripts.filter(m => m.status === 'published').length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Articles Yet</h3>
                    <p className="text-gray-500">Your articles will appear here once they are published.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {manuscripts.filter(m => m.status === 'published').map((manuscript) => (
                      <div key={manuscript._id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{manuscript.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{manuscript.abstract}</p>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                              {manuscript.publicationDetails?.publishedDate && (
                                <span>Published: {new Date(manuscript.publicationDetails.publishedDate).toLocaleDateString()}</span>
                              )}
                              {manuscript.publicationDetails?.volume && (
                                <span>Vol. {manuscript.publicationDetails.volume}</span>
                              )}
                              {manuscript.publicationDetails?.issue && (
                                <span>Issue {manuscript.publicationDetails.issue}</span>
                              )}
                              {manuscript.publicationDetails?.doi && (
                                <span>DOI: {manuscript.publicationDetails.doi}</span>
                              )}
                            </div>

                            {/* Article Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">{manuscript.metrics?.views || 0}</div>
                                <div className="text-xs text-gray-500">Views</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-green-600">{manuscript.metrics?.downloads || 0}</div>
                                <div className="text-xs text-gray-500">Downloads</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-purple-600">{manuscript.metrics?.citations || 0}</div>
                                <div className="text-xs text-gray-500">Citations</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-orange-600">{manuscript.metrics?.shares || 0}</div>
                                <div className="text-xs text-gray-500">Shares</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4 border-t">
                          <Link
                            href={`/articles/${manuscript._id}`}
                            className="btn btn-primary text-sm"
                            target="_blank"
                          >
                            View Public Article
                          </Link>
                          {manuscript.publicationDetails?.doi && (
                            <a
                              href={`https://doi.org/${manuscript.publicationDetails.doi}`}
                              className="btn btn-secondary text-sm"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View DOI
                            </a>
                          )}
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/articles/${manuscript._id}`
                              const title = manuscript.title
                              const text = `Check out my published research: "${title}"`
                              
                              if (navigator.share) {
                                navigator.share({ title, text, url })
                              } else {
                                navigator.clipboard.writeText(url)
                                alert('Article URL copied to clipboard!')
                              }
                            }}
                            className="btn btn-secondary text-sm"
                          >
                            Share Article
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                  {!isEditingProfile && (
                    <button 
                      onClick={handleEditProfile}
                      className="btn btn-secondary"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  // Edit Form
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    <div className="grid grid-cols-1 grid-md-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => handleFormChange('firstName', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => handleFormChange('lastName', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Institution
                        </label>
                        <input
                          type="text"
                          value={editForm.institution}
                          onChange={(e) => handleFormChange('institution', e.target.value)}
                          className="form-input"
                          placeholder="Your university or organization"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          value={editForm.department}
                          onChange={(e) => handleFormChange('department', e.target.value)}
                          className="form-input"
                          placeholder="Your department or faculty"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          value={editForm.country}
                          onChange={(e) => handleFormChange('country', e.target.value)}
                          className="form-input"
                        >
                          {countries.map((country) => (
                            <option key={country.code} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="flex">
                          <div 
                            className="form-input" 
                            style={{
                              width: '100px',
                              marginRight: '0.5rem',
                              backgroundColor: '#f9fafb',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            {getSelectedCountry().dialCode}
                          </div>
                          <input
                            type="tel"
                            value={editForm.phoneNumber ? editForm.phoneNumber.replace(getSelectedCountry().dialCode, '').replace(/^\+/, '') : ''}
                            onChange={(e) => {
                              const dialCode = getSelectedCountry().dialCode
                              const formatted = formatPhoneNumber(e.target.value, dialCode)
                              handleFormChange('phoneNumber', formatted)
                            }}
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="8012345678"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Enter your phone number without the country code
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ORCID ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={editForm.orcidId}
                          onChange={(e) => handleFormChange('orcidId', e.target.value)}
                          className="form-input"
                          placeholder="0000-0000-0000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <div className="text-sm text-gray-500 py-2">
                          {user.role || 'Author'} (Contact admin to change role)
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Biography
                      </label>
                      <textarea
                        value={editForm.biography}
                        onChange={(e) => handleFormChange('biography', e.target.value)}
                        className="form-input"
                        rows="4"
                        placeholder="Tell us about yourself, your research interests, academic background, etc."
                        maxLength="1000"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(editForm.biography || '').length}/1000 characters
                      </div>
                    </div>

                    <div className="mt-8 flex space-x-4">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn btn-secondary"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // Display Mode
                  <div>
                    <div className="grid grid-cols-1 grid-md-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="text-sm text-gray-900">
                          {user.firstName || user.name} {user.lastName || ''}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Institution
                        </label>
                        <div className="text-sm text-gray-900">{user.institution || 'Not specified'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <div className="text-sm text-gray-900">{user.department || 'Not specified'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="text-sm text-gray-900">{user.phoneNumber || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <div className="text-sm text-gray-900">{user.country || 'Not specified'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ORCID ID
                        </label>
                        <div className="text-sm text-gray-900">
                          {user.orcidId ? (
                            <a 
                              href={`https://orcid.org/${user.orcidId}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline"
                            >
                              {user.orcidId}
                            </a>
                          ) : (
                            'Not provided'
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <div className="text-sm text-gray-900">{user.role || 'Author'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Since
                        </label>
                        <div className="text-sm text-gray-900">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>
                    
                    {(user.biography || user.bio) && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Biography
                        </label>
                        <div className="text-sm text-gray-900 p-4 bg-gray-50 rounded-md">
                          {user.biography || user.bio}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (user.role === 'admin' || user.role === 'author') && (
              <div>
                {/* ...existing code for payment tab... */}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Assigned Reviews</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        const token = localStorage.getItem('token')
                        console.log('🔍 Manual refresh - User role:', user?.role)
                        console.log('🔍 Manual refresh - User ID:', user?.id)
                        loadReviews(token)
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      🔄 Refresh Reviews
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem('token')
                          try {
                            console.log('🔍 DEBUG: Calling debug endpoint...')
                            const debugResponse = await fetch('http://localhost:5000/api/reviews/debug/all', {
                              headers: { 'Authorization': `Bearer ${token}` }
                            })
                            const debugData = await debugResponse.json()
                            console.log('🔍 DEBUG ENDPOINT RESULT:', debugData)
                            alert(`Found ${debugData.totalReviews} total reviews in database. Check console for details.`)
                          } catch (err) {
                            console.error('🔍 DEBUG ENDPOINT ERROR:', err)
                            alert('Error calling debug endpoint')
                          }
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        🔍 Debug All Reviews
                      </button>
                    )}
                    <div className="text-sm text-gray-500">
                      Total Assignments: {reviews.length}
                    </div>
                  </div>
                </div>

                {/* Reviews Table */}
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">No manuscripts assigned for review yet</div>
                    <div className="text-sm text-gray-400">
                      You'll receive email notifications when manuscripts are assigned to you
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Manuscripts for Review</h3>
                    <div className="reviews-table" style={{overflowX: 'auto'}}>
                      <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead>
                          <tr style={{backgroundColor: '#f9fafb'}}>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Manuscript Title</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Author</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Deadline</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.map((review, index) => (
                            <tr 
                              key={review._id || review.id} 
                              style={{
                                borderBottom: '1px solid #e5e7eb',
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                              }}
                            >
                              <td className="p-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {review.manuscript?.title || 'Untitled Manuscript'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Assigned: {new Date(review.assignedDate || review.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="p-4 text-sm text-gray-900">
                                {review.manuscript?.author?.name || 'Unknown Author'}
                              </td>
                              <td className="p-4">
                                <span 
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: review.status === 'completed' ? '#dcfce7' : 
                                                   review.status === 'in-progress' ? '#fef3c7' : '#f3f4f6',
                                    color: review.status === 'completed' ? '#166534' : 
                                           review.status === 'in-progress' ? '#92400e' : '#6b7280'
                                  }}
                                >
                                  {review.status === 'completed' ? 'Completed' : 
                                   review.status === 'in-progress' ? 'In Progress' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-500">
                                {review.deadline ? new Date(review.deadline).toLocaleDateString() : 'No deadline set'}
                              </td>
                              <td className="p-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedReview(review)
                                      setShowManuscriptModal(true)
                                      setNotification('📖 Opening manuscript viewer...')
                                      // Scroll to top and add slight delay to ensure modal is rendered
                                      setTimeout(() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                        setNotification('')
                                      }, 1500)
                                    }}
                                    className="btn btn-sm btn-secondary"
                                  >
                                    View
                                  </button>
                                  {review.status !== 'completed' && (
                                    <button
                                      onClick={() => {
                                        setSelectedReview(review)
                                        setShowReviewModal(true)
                                        setNotification('📝 Opening review form...')
                                        // Scroll to top and add slight delay to ensure modal is rendered
                                        setTimeout(() => {
                                          window.scrollTo({ top: 0, behavior: 'smooth' })
                                          setNotification('')
                                        }, 1500)
                                      }}
                                      className="btn btn-sm btn-primary"
                                    >
                                      {review.status === 'in-progress' ? 'Continue' : 'Start Review'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Review Information */}
                <div className="card mt-6" style={{backgroundColor: '#f0f9f4'}}>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Review Guidelines</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div>• <strong>Review Timeframe:</strong> Complete reviews within 2-4 weeks of assignment</div>
                    <div>• <strong>Confidentiality:</strong> Maintain strict confidentiality of all manuscripts</div>
                    <div>• <strong>Quality Standards:</strong> Provide detailed, constructive feedback</div>
                    <div>• <strong>Conflict of Interest:</strong> Decline reviews if conflicts exist</div>
                    <div>• <strong>Communication:</strong> Contact editor for questions or deadline extensions</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manuscript Viewer Modal */}
      {showManuscriptModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-slideIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Manuscript Viewer
                </h3>
                <button
                  onClick={() => {
                    setShowManuscriptModal(false)
                    setSelectedReview(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedReview.manuscript?.title || 'Untitled Manuscript'}
                  </h4>
                  <div className="text-sm text-gray-600 mb-4">
                    Author: {selectedReview.manuscript?.author?.name || 'Unknown Author'} | 
                    Category: {selectedReview.manuscript?.category || 'Not specified'} | 
                    Submitted: {selectedReview.manuscript?.submissionDate ? 
                      new Date(selectedReview.manuscript.submissionDate).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Abstract</h5>
                  <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700">
                    {selectedReview.manuscript?.abstract || 'No abstract available'}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Keywords</h5>
                  <div className="text-sm text-gray-700">
                    {selectedReview.manuscript?.keywords?.join(', ') || 'No keywords specified'}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Manuscript Files</h5>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-700 mb-2">📄 Full manuscript file would be available here</p>
                    <button className="btn btn-primary btn-sm">
                      📥 Download Manuscript PDF
                    </button>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Review Assignment Details</h5>
                  <div className="bg-gray-50 p-4 rounded-md text-sm">
                    <p><strong>Status:</strong> {selectedReview.status}</p>
                    <p><strong>Assigned Date:</strong> {new Date(selectedReview.assignedDate || selectedReview.createdAt).toLocaleDateString()}</p>
                    <p><strong>Deadline:</strong> {selectedReview.deadline ? new Date(selectedReview.deadline).toLocaleDateString() : 'No deadline set'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowManuscriptModal(false)
                    setSelectedReview(null)
                  }}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                {selectedReview.status !== 'completed' && (
                  <button
                    onClick={() => {
                      setShowManuscriptModal(false)
                      setShowReviewModal(true)
                      // Scroll to top when opening review form
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }, 100)
                    }}
                    className="btn btn-primary"
                  >
                    Start Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-slideIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Review Submission Form
                </h3>
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedReview(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900">
                  {selectedReview.manuscript?.title || 'Untitled Manuscript'}
                </h4>
                <p className="text-sm text-gray-600">
                  Author: {selectedReview.manuscript?.author?.name || 'Unknown Author'}
                </p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault()
                try {
                  const token = localStorage.getItem('token')
                  const response = await fetch(`http://localhost:5000/api/reviews/${selectedReview._id || selectedReview.id}/submit`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(reviewForm)
                  })

                  if (response.ok) {
                    alert('Review submitted successfully!')
                    setShowReviewModal(false)
                    setSelectedReview(null)
                    // Reload reviews to update status
                    loadReviews(token)
                  } else {
                    alert('Error submitting review. Please try again.')
                  }
                } catch (error) {
                  console.error('Review submission error:', error)
                  alert('Error submitting review. Please try again.')
                }
              }} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Recommendation *
                  </label>
                  <select
                    value={reviewForm.recommendation}
                    onChange={(e) => setReviewForm({...reviewForm, recommendation: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="">Select recommendation</option>
                    <option value="accept">Accept</option>
                    <option value="minor-revision">Minor Revision Required</option>
                    <option value="major-revision">Major Revision Required</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'originality', label: 'Originality' },
                    { key: 'methodology', label: 'Methodology' },
                    { key: 'significance', label: 'Significance' },
                    { key: 'clarity', label: 'Clarity' }
                  ].map(criterion => (
                    <div key={criterion.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {criterion.label} (1-5 scale)
                      </label>
                      <select
                        value={reviewForm[criterion.key]}
                        onChange={(e) => setReviewForm({...reviewForm, [criterion.key]: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      >
                        <option value={1}>1 - Poor</option>
                        <option value={2}>2 - Fair</option>
                        <option value={3}>3 - Good</option>
                        <option value={4}>4 - Very Good</option>
                        <option value={5}>5 - Excellent</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments for Authors *
                  </label>
                  <textarea
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                    required
                    rows={6}
                    placeholder="Provide detailed feedback for the authors..."
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidential Comments for Editor
                  </label>
                  <textarea
                    value={reviewForm.confidentialComments}
                    onChange={(e) => setReviewForm({...reviewForm, confidentialComments: e.target.value})}
                    rows={4}
                    placeholder="Private comments for the editor only..."
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false)
                      setSelectedReview(null)
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Complete Publication Payment
            </h3>
            
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Manuscript:</div>
              <div className="font-medium text-gray-900 mb-4">{selectedManuscript.title}</div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Publication Fee:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedManuscript.publicationFee)}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Choose your payment method:
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => processPayment('paystack')}
                  disabled={isProcessingPayment || !paystackLoaded}
                  className="w-full btn btn-primary flex items-center justify-center"
                >
                  {isProcessingPayment 
                    ? '🔄 Redirecting to Paystack...' 
                    : '💳 Pay with Paystack'
                  }
                </button>
                
                <div className="text-xs text-gray-500 text-center">
                  <p>🔒 Secure payment powered by Paystack</p>
                  <p>You'll be redirected to Paystack's secure payment page</p>
                </div>
                
                <button
                  onClick={() => processPayment('bank-transfer')}
                  disabled={isProcessingPayment}
                  className="w-full btn btn-secondary flex items-center justify-center"
                >
                  {isProcessingPayment ? 'Processing...' : '🏦 Bank Transfer'}
                </button>
                
                <button
                  onClick={() => processPayment('ussd')}
                  disabled={isProcessingPayment}
                  className="w-full btn btn-secondary flex items-center justify-center"
                >
                  {isProcessingPayment ? 'Processing...' : '📱 USSD Payment'}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedManuscript(null)
                }}
                disabled={isProcessingPayment}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              🔒 TEST MODE: Secure payment powered by Paystack. No real charges will be made.
            </div>
          </div>
        </div>
      )}
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-slideInRight">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <span className="text-lg">✓</span>
            <span>{notification}</span>
          </div>
        </div>
      )}
    </div>
  )
}