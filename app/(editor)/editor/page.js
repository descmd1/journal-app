'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function EditorDashboard() {
  const [activeTab, setActiveTab] = useState('manuscripts')
  const [user, setUser] = useState(null)
  const [manuscripts, setManuscripts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedManuscript, setSelectedManuscript] = useState(null)
  const [showManuscriptModal, setShowManuscriptModal] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [editorDecision, setEditorDecision] = useState('')
  const [editorNotes, setEditorNotes] = useState('')
  const [revisionInstructions, setRevisionInstructions] = useState('')
  const [revisionDeadline, setRevisionDeadline] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [reviewers, setReviewers] = useState([])
  const [showAssignReviewerModal, setShowAssignReviewerModal] = useState(false)
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([])
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userRole = localStorage.getItem('userRole')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (userRole !== 'editor' && userRole !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadEditorData()
  }, [router])

  const loadEditorData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Load user info
      const userResponse = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
      }

      // Load assigned manuscripts
      await loadManuscripts()
      await loadReviewers()
      
    } catch (error) {
      console.error('Error loading editor data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadManuscripts = async () => {
    try {
      const token = localStorage.getItem('token')
      const userRole = localStorage.getItem('userRole')
      
      console.log('🔍 DEBUG: Loading manuscripts for editor:', { token: !!token, userRole })
      
      const response = await fetch('http://localhost:5000/api/editorial/editor-manuscripts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()      
      if (data.success) {
        setManuscripts(data.manuscripts)
      } else {
      }
    } catch (error) {
      console.error('Error loading manuscripts:', error)
    }
  }

  const loadReviewers = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:5000/api/admin/users?role=reviewer', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      
      if (data.success) {
        setReviewers(data.users.filter(user => user.role === 'reviewer'))
      }
    } catch (error) {
      console.error('Error loading reviewers:', error)
    }
  }

  const makeInitialDecision = async (manuscriptId, decision, notes) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`http://localhost:5000/api/editorial/initial-review/${manuscriptId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: decision, // 'send-for-review' or 'desk-reject'
          editorNotes: notes,
          internalNotes: internalNotes,
          revisionInstructions: revisionInstructions,
          revisionDeadline: revisionDeadline
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      
      if (data.success) {
        alert('Decision submitted successfully! Email notification sent to author.')
        loadManuscripts()
        resetDecisionModal()
      } else {
        alert(data.message || 'Error submitting decision')
      }
    } catch (error) {
      console.error('Error making decision:', error)
      alert('Error submitting decision. Please try again.')
    }
  }

  // Reset decision modal form
  const resetDecisionModal = () => {
    setShowDecisionModal(false)
    setEditorDecision('')
    setEditorNotes('')
    setRevisionInstructions('')
    setRevisionDeadline('')
    setInternalNotes('')
  }

  // Open decision modal with proper setup
  const openDecisionModal = (manuscript) => {
    setSelectedManuscript(manuscript)
    setEditorDecision('')
    setEditorNotes('')
    setRevisionInstructions('')
    setRevisionDeadline('')
    setInternalNotes('')
    setShowDecisionModal(true)
  }

  const submitBackToAuthor = async (manuscriptId, remarks) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`http://localhost:5000/api/editorial/submit-back/${manuscriptId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editorRemarks: remarks,
          internalNotes: internalNotes,
          revisionInstructions: revisionInstructions,
          revisionDeadline: revisionDeadline
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      
      if (data.success) {
        alert('Manuscript submitted back to author successfully! Email notification sent.')
        loadManuscripts()
        resetDecisionModal()
      } else {
        alert(data.message || 'Error submitting back to author')
      }
    } catch (error) {
      console.error('Error submitting back to author:', error)
      alert('Error submitting back to author. Please try again.')
    }
  }

  const makeFinalDecision = async (manuscriptId, decision, notes) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`http://localhost:5000/api/editorial/make-decision/${manuscriptId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: decision, // 'accept', 'minor-revisions', 'major-revisions', 'reject'
          editorNotes: notes,
          internalNotes: internalNotes,
          revisionInstructions: revisionInstructions,
          revisionDeadline: revisionDeadline
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      
      if (data.success) {
        alert('Final decision submitted successfully! Email notification sent to author.')
        loadManuscripts()
        resetDecisionModal()
      } else {
        alert(data.message || 'Error submitting decision')
      }
    } catch (error) {
      console.error('Error making final decision:', error)
      alert('Error submitting decision. Please try again.')
    }
  }

  const assignReviewer = async (manuscriptId, reviewerIds) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:5000/api/reviews/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptId: manuscriptId,
          reviewerIds: reviewerIds,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      
      if (data.success) {
        alert('Reviewer(s) assigned successfully')
        loadManuscripts()
        setShowAssignReviewerModal(false)
        setSelectedReviewerIds([])
      } else {
        alert(data.message || 'Error assigning reviewer')
      }
    } catch (error) {
      console.error('Error assigning reviewer:', error)
      alert('Error assigning reviewer. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    router.push('/login')
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      'draft': { bg: '#f3f4f6', color: '#374151' },
      'submitted': { bg: '#dbeafe', color: '#1e40af' },
      'awaiting-reviewer-assignment': { bg: '#fef3c7', color: '#92400e' },
      'under-review': { bg: '#fef3c7', color: '#92400e' },
      'revision-requested': { bg: '#fed7aa', color: '#c2410c' },
      'revised': { bg: '#e0e7ff', color: '#3730a3' },
      'accepted': { bg: '#dcfce7', color: '#166534' },
      'rejected': { bg: '#fee2e2', color: '#dc2626' },
      'published': { bg: '#d1fae5', color: '#065f46' }
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

  const openAssignReviewerModal = (manuscript) => {
    setSelectedManuscript(manuscript)
    setSelectedReviewerIds([])
    setShowAssignReviewerModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading Editor Dashboard...</div>
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
              NigJournal Editor
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Editor: {user.firstName} {user.lastName}
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
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editor Dashboard</h1>
                <p className="text-gray-600 mt-2">
                  Manage manuscripts assigned to you and make editorial decisions
                </p>
              </div>
            </div>
          </div>

          {/* Manuscripts Section */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Assigned Manuscripts ({manuscripts.length})
              </h2>
              
              {manuscripts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No manuscripts assigned to you yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manuscript
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reviews
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {manuscripts.map((manuscript) => (
                        <tr key={manuscript._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {manuscript.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {manuscript.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {manuscript.submittedBy?.firstName} {manuscript.submittedBy?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {manuscript.submittedBy?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(manuscript.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {manuscript.reviewStats?.completed}/{manuscript.reviewStats?.total} completed
                            </div>
                            {manuscript.reviewStats?.averageScore && (
                              <div className="text-sm text-gray-500">
                                Avg: {manuscript.reviewStats.averageScore.toFixed(1)}/5
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(manuscript.submittedDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => {
                                setSelectedManuscript(manuscript)
                                setShowManuscriptModal(true)
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              View
                            </button>
                            
                            {manuscript.status === 'submitted' && (
                              <button
                                onClick={() => openDecisionModal(manuscript)}
                                className="btn btn-primary btn-sm"
                              >
                                Initial Review
                              </button>
                            )}
                            
                            {manuscript.status === 'awaiting-reviewer-assignment' && (
                              <button
                                onClick={() => openAssignReviewerModal(manuscript)}
                                className="btn btn-primary btn-sm"
                              >
                                Assign Reviewer
                              </button>
                            )}
                            
                            {manuscript.status === 'under-review' && manuscript.reviewStats?.completed > 0 && (
                              <button
                                onClick={() => openDecisionModal(manuscript)}
                                className="btn btn-primary btn-sm"
                              >
                                Make Decision
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manuscript Details Modal */}
      {showManuscriptModal && selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Manuscript Details</h3>
                <button
                  onClick={() => setShowManuscriptModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  × 
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Title</h4>
                  <p className="text-gray-700">{selectedManuscript.title}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Abstract</h4>
                  <p className="text-gray-700">{selectedManuscript.abstract}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Authors</h4>
                  <div className="space-y-2">
                    {selectedManuscript.authors?.map((author, index) => (
                      <div key={index} className="text-gray-700">
                        {author.name} ({author.email}) - {author.institution}
                        {author.isCorresponding && <span className="text-green-600 ml-2">(Corresponding)</span>}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Keywords</h4>
                  <p className="text-gray-700">{selectedManuscript.keywords?.join(', ')}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Category</h4>
                  <p className="text-gray-700">{selectedManuscript.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(selectedManuscript.status)}
                    <span className="text-sm text-gray-500">
                      Submitted: {new Date(selectedManuscript.submittedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedManuscript.editorDecision && (
                  <div>
                    <h4 className="font-medium text-gray-900">Editorial Decision</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">Decision:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          selectedManuscript.editorDecision.decision === 'accept' ? 'bg-green-100 text-green-800' :
                          selectedManuscript.editorDecision.decision === 'reject' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedManuscript.editorDecision.decision?.replace('-', ' ')}
                        </span>
                      </div>
                      {selectedManuscript.editorDecision.notes && (
                        <div>
                          <span className="font-medium">Notes:</span>
                          <p className="text-gray-700 mt-1">{selectedManuscript.editorDecision.notes}</p>
                        </div>
                      )}
                      {selectedManuscript.editorDecision.decidedAt && (
                        <div className="text-sm text-gray-500 mt-2">
                          Decided on: {new Date(selectedManuscript.editorDecision.decidedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedManuscript.editorNotes && selectedManuscript.editorNotes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900">Editorial Notes</h4>
                    <div className="space-y-2">
                      {selectedManuscript.editorNotes.map((note, index) => (
                        <div key={index} className="bg-gray-50 border rounded p-3">
                          <p className="text-gray-700">{note.note}</p>
                          <div className="text-sm text-gray-500 mt-2">
                            Added: {new Date(note.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedManuscript.files && selectedManuscript.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900">Files</h4>
                    <div className="space-y-2">
                      {selectedManuscript.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <span className="text-gray-700">{file.originalName}</span>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedManuscript.plagiarismCheck && (
                  <div>
                    <h4 className="font-medium text-gray-900">Plagiarism Check</h4>
                    <div className="bg-gray-50 border rounded p-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          selectedManuscript.plagiarismCheck.status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedManuscript.plagiarismCheck.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedManuscript.plagiarismCheck.status}
                        </span>
                      </div>
                      {selectedManuscript.plagiarismCheck.similarity && (
                        <div className="mt-2">
                          <span className="font-medium">Similarity:</span>
                          <span className="ml-2">{selectedManuscript.plagiarismCheck.similarity}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedManuscript.reviews && selectedManuscript.reviews.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900">Reviews</h4>
                    <div className="space-y-3">
                      {selectedManuscript.reviews.map((review, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">
                              Reviewer {index + 1}
                              {review.reviewer && ` (${review.reviewer.firstName} ${review.reviewer.lastName})`}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {review.status}
                            </span>
                          </div>
                          {review.recommendation && (
                            <div>
                              <span className="font-medium">Recommendation: </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                review.recommendation === 'accept' ? 'bg-green-100 text-green-800' :
                                review.recommendation === 'reject' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {review.recommendation.replace('-', ' ')}
                              </span>
                            </div>
                          )}
                          {review.overallScore && (
                            <div className="mt-2">
                              <span className="font-medium">Overall Score: </span>
                              <span>{review.overallScore}/5</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <button
                  onClick={() => setShowManuscriptModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                
                <div className="flex space-x-2">
                  {selectedManuscript.status === 'submitted' && (
                    <button
                      onClick={() => {
                        setShowManuscriptModal(false)
                        openDecisionModal(selectedManuscript)
                      }}
                      className="btn btn-primary"
                    >
                      Initial Review
                    </button>
                  )}
                  
                  {selectedManuscript.status === 'awaiting-reviewer-assignment' && (
                    <button
                      onClick={() => {
                        setShowManuscriptModal(false)
                        openAssignReviewerModal(selectedManuscript)
                      }}
                      className="btn btn-primary"
                    >
                      Assign Reviewers
                    </button>
                  )}
                  
                  {selectedManuscript.status === 'under-review' && selectedManuscript.reviewStats?.completed > 0 && (
                    <button
                      onClick={() => {
                        setShowManuscriptModal(false)
                        openDecisionModal(selectedManuscript)
                      }}
                      className="btn btn-primary"
                    >
                      Make Decision
                    </button>
                  )}
                  
                  {/* Submit Back to Author button - available for most statuses */}
                  {(selectedManuscript.status === 'submitted' || 
                    selectedManuscript.status === 'awaiting-reviewer-assignment' || 
                    selectedManuscript.status === 'under-review') && (
                    <button
                      onClick={() => {
                        setShowManuscriptModal(false)
                        setSelectedManuscript(selectedManuscript)
                        setEditorDecision('submit-back') // Special decision type
                        setShowDecisionModal(true)
                      }}
                      className="btn bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Submit Back to Author
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowManuscriptModal(false)
                      openDecisionModal(selectedManuscript)
                    }}
                    className="btn btn-primary"
                  >
                    Add Editorial Remarks
                  </button>
                  
                  {selectedManuscript.status === 'accepted' && (
                    <button
                      onClick={() => {
                        alert('This manuscript has been accepted and is ready for publication processing.')
                      }}
                      className="btn btn-success"
                    >
                      Publication Ready
                    </button>
                  )}
                  
                  {['revision-requested', 'revised'].includes(selectedManuscript.status) && (
                    <button
                      onClick={() => {
                        setShowManuscriptModal(false)
                        openDecisionModal(selectedManuscript)
                      }}
                      className="btn btn-primary"
                    >
                      Review Revision
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editorDecision === 'submit-back' ? 'Submit Back to Author' : 
                   selectedManuscript.status === 'submitted' ? 'Initial Review Decision' : 'Final Editorial Decision'}
                </h3>
                <button
                  onClick={() => setShowDecisionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision
                </label>
                <select
                  value={editorDecision}
                  onChange={(e) => setEditorDecision(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select decision...</option>
                  {editorDecision === 'submit-back' ? (
                    <option value="submit-back">Submit Back to Author</option>
                  ) : selectedManuscript.status === 'submitted' ? (
                    <>
                      <option value="send-for-review">Send for Peer Review</option>
                      <option value="desk-reject">Desk Reject</option>
                    </>
                  ) : (
                    <>
                      <option value="accept">Accept</option>
                      <option value="minor-revisions">Minor Revisions</option>
                      <option value="major-revisions">Major Revisions</option>
                      <option value="reject">Reject</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* Editorial Remarks Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Editorial Remarks for Author
                </label>
                <textarea
                  value={editorNotes}
                  onChange={(e) => setEditorNotes(e.target.value)}
                  rows={6}
                  className="input w-full"
                  placeholder="Detailed feedback and comments for the author..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  These remarks will be sent to the author along with your decision.
                </p>
              </div>

              {/* Submission Instructions (for revisions) */}
              {(editorDecision === 'minor-revisions' || editorDecision === 'major-revisions') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revision Instructions
                  </label>
                  <textarea
                    value={revisionInstructions}
                    onChange={(e) => setRevisionInstructions(e.target.value)}
                    rows={4}
                    className="input w-full"
                    placeholder="Specific instructions for revisions..."
                  />
                </div>
              )}

              {/* Deadline for Revisions */}
              {(editorDecision === 'minor-revisions' || editorDecision === 'major-revisions') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revision Deadline
                  </label>
                  <input
                    type="date"
                    value={revisionDeadline}
                    onChange={(e) => setRevisionDeadline(e.target.value)}
                    className="input w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              {/* Confidential Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes (Confidential)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                  className="input w-full"
                  placeholder="Internal notes for editorial team (not sent to author)..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  These notes are for internal use only and will not be shared with the author.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editorDecision === 'submit-back') {
                    submitBackToAuthor(selectedManuscript._id, editorNotes)
                  } else if (selectedManuscript.status === 'submitted') {
                    makeInitialDecision(selectedManuscript._id, editorDecision, editorNotes)
                  } else {
                    makeFinalDecision(selectedManuscript._id, editorDecision, editorNotes)
                  }
                }}
                className="btn btn-primary"
                disabled={!editorDecision}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Reviewer Modal */}
      {showAssignReviewerModal && selectedManuscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Reviewers to: {selectedManuscript.title}
                </h3>
                <button
                  onClick={() => setShowAssignReviewerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Reviewers (select multiple)
                </label>
                <div className="max-h-60 overflow-y-auto border rounded p-2">
                  {reviewers.map(reviewer => (
                    <label key={reviewer._id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedReviewerIds.includes(reviewer._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReviewerIds([...selectedReviewerIds, reviewer._id])
                          } else {
                            setSelectedReviewerIds(selectedReviewerIds.filter(id => id !== reviewer._id))
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{reviewer.firstName} {reviewer.lastName}</div>
                        <div className="text-sm text-gray-500">{reviewer.email}</div>
                        {reviewer.institution && (
                          <div className="text-sm text-gray-500">{reviewer.institution}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
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
                onClick={() => assignReviewer(selectedManuscript._id, selectedReviewerIds)}
                className="btn btn-primary"
                disabled={selectedReviewerIds.length === 0}
              >
                Assign {selectedReviewerIds.length > 0 ? `(${selectedReviewerIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}