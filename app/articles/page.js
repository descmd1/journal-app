'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const base_url = process.env.NEXT_PUBLIC_API_URL;

export default function ArticlesPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVolume, setSelectedVolume] = useState('')
  const [selectedIssue, setSelectedIssue] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [sortBy, setSortBy] = useState('publishedDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchArticles = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search: searchTerm,
        sortBy,
        sortOrder
      })

      if (selectedVolume) params.append('volume', selectedVolume)
      if (selectedIssue) params.append('issue', selectedIssue)
      if (selectedYear) params.append('year', selectedYear)

      const response = await fetch(`${base_url}/api/editorial/published-articles?${params}`)
      const data = await response.json()

      if (data.success) {
        setArticles(data.articles)
        setPagination(data.pagination)
        setFilters(data.filters)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles(currentPage)
  }, [searchTerm, selectedVolume, selectedIssue, selectedYear, sortBy, sortOrder, currentPage])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchArticles(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedVolume('')
    setSelectedIssue('')
    setSelectedYear('')
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown Author'
    
    if (authors.length === 1) {
      return `${authors[0].firstName} ${authors[0].lastName}`
    } else if (authors.length === 2) {
      return `${authors[0].firstName} ${authors[0].lastName} & ${authors[1].firstName} ${authors[1].lastName}`
    } else {
      return `${authors[0].firstName} ${authors[0].lastName} et al.`
    }
  }

  const formatKeywords = (keywords) => {
    if (!keywords) return []
    
    if (Array.isArray(keywords)) {
      return keywords.map(k => typeof k === 'string' ? k : String(k)).filter(k => k.trim())
    }
    
    if (typeof keywords === 'string') {
      return keywords.split(',').map(k => k.trim()).filter(k => k)
    }
    
    return []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Published Articles</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore our collection of peer-reviewed research articles across various disciplines. 
              All articles are freely accessible to the global research community.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search articles by title, abstract, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-4 flex-wrap">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {filters.years?.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedVolume}
                onChange={(e) => setSelectedVolume(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Volumes</option>
                {filters.volumes?.map(volume => (
                  <option key={volume} value={volume}>Volume {volume}</option>
                ))}
              </select>

              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Issues</option>
                {filters.issues?.map(issue => (
                  <option key={issue} value={issue}>Issue {issue}</option>
                ))}
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="publishedDate-desc">Newest First</option>
                <option value="publishedDate-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No articles found matching your criteria.</p>
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {articles.length} of {pagination.total} articles
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            {/* Articles Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <div key={article._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="mb-4">
                      <Link 
                        href={`/articles/${article._id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                      >
                        {article.title}
                      </Link>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        By {formatAuthors([article.submittedBy])}
                      </p>
                      {article.submittedBy?.institution && (
                        <p className="text-sm text-gray-500">{article.submittedBy.institution}</p>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {article.abstract}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        {article.publicationDetails?.volume && (
                          <span>Vol. {article.publicationDetails.volume}</span>
                        )}
                        {article.publicationDetails?.issue && (
                          <span>, Issue {article.publicationDetails.issue}</span>
                        )}
                      </div>
                      <span>
                        {formatDate(article.publicationDetails?.publishedDate)}
                      </span>
                    </div>

                    {article.keywords && formatKeywords(article.keywords).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-1">
                          {formatKeywords(article.keywords).slice(0, 3).map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border text-sm rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                    disabled={currentPage === pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}