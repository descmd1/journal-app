'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const base_url = process.env.NEXT_PUBLIC_API_URL;

export default function Submit() {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    category: '',
    manuscriptType: 'research-article',
    authors: [{ name: '', email: '', institution: '', isCorresponding: true, order: 1 }]
  })
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const categories = [
    'Agricultural Sciences',
    'Arts and Humanities',
    'Business and Economics',
    'Computer Science',
    'Education',
    'Engineering',
    'Environmental Science',
    'Health Sciences',
    'Law',
    'Life Sciences',
    'Physical Sciences',
    'Social Sciences',
    'Other'
  ]

  const manuscriptTypes = [
    { value: 'research-article', label: 'Research Article' },
    { value: 'review-article', label: 'Review Article' },
    { value: 'case-study', label: 'Case Study' },
    { value: 'short-communication', label: 'Short Communication' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'letter', label: 'Letter to Editor' }
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAuthorChange = (index, field, value) => {
    const newAuthors = [...formData.authors]
    newAuthors[index][field] = value
    setFormData({ ...formData, authors: newAuthors })
  }

  const addAuthor = () => {
    const newOrder = formData.authors.length + 1
    setFormData({
      ...formData,
      authors: [...formData.authors, { name: '', email: '', institution: '', isCorresponding: false, order: newOrder }]
    })
  }

  const removeAuthor = (index) => {
    if (formData.authors.length > 1) {
      const newAuthors = formData.authors
        .filter((_, i) => i !== index)
        .map((author, i) => ({ ...author, order: i + 1 })) // Reorder remaining authors
      setFormData({ ...formData, authors: newAuthors })
    }
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles([...files, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required')
        setIsLoading(false)
        return
      }

      if (!formData.abstract.trim()) {
        setError('Abstract is required')
        setIsLoading(false)
        return
      }

      if (!formData.category) {
        setError('Category is required')
        setIsLoading(false)
        return
      }

      // Validate authors
      const invalidAuthor = formData.authors.find(author => 
        !author.name.trim() || !author.email.trim() || !author.institution.trim()
      )
      
      if (invalidAuthor) {
        setError('All author fields (name, email, institution) are required')
        setIsLoading(false)
        return
      }

      // Check if at least one author is corresponding
      const hasCorrespondingAuthor = formData.authors.some(author => author.isCorresponding)
      if (!hasCorrespondingAuthor) {
        setError('At least one author must be marked as corresponding author')
        setIsLoading(false)
        return
      }

      const formDataToSend = new FormData()
      
      // Prepare the authors data with proper order
      const authorsWithOrder = formData.authors.map((author, index) => ({
        ...author,
        order: index + 1
      }))

      // Log the authors data for debugging
      console.log('Authors being sent:', authorsWithOrder)

      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key === 'authors') {
          formDataToSend.append(key, JSON.stringify(authorsWithOrder))
        } else if (key === 'keywords') {
          formDataToSend.append(key, JSON.stringify(formData[key].split(',').map(k => k.trim())))
        } else {
          formDataToSend.append(key, formData[key])
        }
      })

      // Append files
      files.forEach(file => {
        formDataToSend.append('files', file)
      })

      const response = await fetch(`${base_url}/api/manuscripts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Submission failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Submission error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header bg-white" style={{boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'}}>
        <div style={{
          maxWidth: '80rem', 
          margin: '0 auto', 
          padding: '0 1rem'
        }}>
          <div className="flex justify-between items-center py-6">
            <Link href="/dashboard" className="text-2xl font-bold text-green-600">
              NigJournal
            </Link>
            <Link 
              href="/dashboard"
              className="text-gray-600"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="py-8 centered-container">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Submit New Manuscript
          </h1>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div style={{marginBottom: '2rem'}}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              
              <div style={{marginBottom: '1.5rem'}}>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter your manuscript title"
                />
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-2">
                  Abstract *
                </label>
                <textarea
                  name="abstract"
                  id="abstract"
                  rows={6}
                  required
                  value={formData.abstract}
                  onChange={handleChange}
                  placeholder="Enter your abstract (max 2000 characters)"
                  maxLength={2000}
                />
                <p className="text-sm text-gray-500" style={{marginTop: '0.25rem'}}>
                  {formData.abstract.length}/2000 characters
                </p>
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  name="keywords"
                  id="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="Enter keywords separated by commas"
                />
              </div>

              <div className="grid grid-md-cols-2 gap-4" style={{marginBottom: '1.5rem'}}>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    id="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="manuscriptType" className="block text-sm font-medium text-gray-700 mb-2">
                    Manuscript Type *
                  </label>
                  <select
                    name="manuscriptType"
                    id="manuscriptType"
                    required
                    value={formData.manuscriptType}
                    onChange={handleChange}
                  >
                    {manuscriptTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Authors */}
            <div style={{marginBottom: '2rem'}}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Authors</h2>
              
              {formData.authors.map((author, index) => (
                <div key={index} className="card" style={{marginBottom: '1rem'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Author {index + 1} {author.isCorresponding && '(Corresponding)'}
                    </h3>
                    {formData.authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAuthor(index)}
                        className="text-red-600"
                        style={{background: 'none', border: 'none', cursor: 'pointer'}}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="grid grid-md-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={author.name}
                        onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={author.email}
                        onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{marginTop: '1rem'}}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution *
                    </label>
                    <input
                      type="text"
                      required
                      value={author.institution}
                      onChange={(e) => handleAuthorChange(index, 'institution', e.target.value)}
                    />
                  </div>

                  <div style={{marginTop: '1rem'}}>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={author.isCorresponding}
                        onChange={(e) => {
                          // Only one corresponding author allowed
                          if (e.target.checked) {
                            const newAuthors = formData.authors.map((a, i) => ({
                              ...a,
                              isCorresponding: i === index,
                              order: i + 1 // Maintain proper order
                            }))
                            setFormData({ ...formData, authors: newAuthors })
                          }
                        }}
                        style={{marginRight: '0.5rem'}}
                      />
                      <span className="text-sm text-gray-900">
                        Corresponding author
                      </span>
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addAuthor}
                className="btn btn-secondary"
              >
                Add Author
              </button>
            </div>

            {/* File Upload */}
            <div style={{marginBottom: '2rem'}}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Files</h2>
              
              <div style={{
                border: '2px dashed #d1d5db',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{fontSize: '3rem', color: '#9ca3af', marginBottom: '1rem'}}>📄</div>
                  <div>
                    <label htmlFor="file-upload" style={{cursor: 'pointer'}}>
                      <span className="block text-sm font-medium text-gray-900 mb-2">
                        Upload manuscript files
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        style={{display: 'none'}}
                      />
                      <span className="btn btn-secondary">
                        Choose files
                      </span>
                    </label>
                    <p className="text-sm text-gray-500" style={{marginTop: '0.5rem'}}>
                      PDF, DOC, DOCX up to 50MB each
                    </p>
                  </div>
                </div>
              </div>

              {files.length > 0 && (
                <div style={{marginTop: '1rem'}}>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Selected Files:
                  </h3>
                  <div>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-4" style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.375rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div className="flex items-center">
                          <span style={{marginRight: '0.5rem'}}>📄</span>
                          <span className="text-sm text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500" style={{marginLeft: '0.5rem'}}>
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600"
                          style={{background: 'none', border: 'none', cursor: 'pointer'}}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Link
                href="/dashboard"
                className="btn btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Submitting...' : 'Submit Manuscript'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}