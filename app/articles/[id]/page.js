'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ArticlePage() {
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCitation, setShowCitation] = useState(false)
  const [citationStyle, setCitationStyle] = useState('apa')
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    if (params.id) {
      fetchArticle()
    }
  }, [params.id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/editorial/article/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setArticle(data.article)
      } else {
        router.push('/articles')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      router.push('/articles')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generateCitation = (style) => {
    if (!article) return ''

    const author = `${article.submittedBy.firstName} ${article.submittedBy.lastName}`
    const year = new Date(article.publicationDetails.publishedDate).getFullYear()
    const title = article.title
    const volume = article.publicationDetails.volume
    const issue = article.publicationDetails.issue
    const pages = article.publicationDetails.pages
    const doi = article.publicationDetails.doi

    switch (style) {
      case 'apa':
        return `${author} (${year}). ${title}. Nigerian Journal Platform, ${volume}${issue ? `(${issue})` : ''}, ${pages || 'n.p.'}. ${doi ? `https://doi.org/${doi}` : ''}`

      case 'mla':
        return `${author}. "${title}." Nigerian Journal Platform, vol. ${volume}${issue ? `, no. ${issue}` : ''}, ${year}, ${pages ? `pp. ${pages}` : 'n.p.'}${doi ? `, doi:${doi}` : ''}.`

      case 'chicago':
        return `${author}. "${title}." Nigerian Journal Platform ${volume}${issue ? `, no. ${issue}` : ''} (${year}): ${pages || 'n.p.'}${doi ? `, https://doi.org/${doi}` : ''}.`

      case 'bibtex':
        return `@article{${author.replace(' ', '').toLowerCase()}${year},\n  title={${title}},\n  author={${author}},\n  journal={Nigerian Journal Platform},\n  volume={${volume}},${issue ? `\n  number={${issue}},` : ''}\n  year={${year}},${pages ? `\n  pages={${pages}},` : ''}${doi ? `\n  doi={${doi}},` : ''}\n}`

      default:
        return generateCitation('apa')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Citation copied to clipboard!')
    })
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

  const downloadPDF = async () => {
    if (article?.filePath) {
      // Track download
      try {
        await fetch(`http://localhost:5000/api/editorial/article/${params.id}/download`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Error tracking download:', error)
      }
      
      window.open(`http://localhost:5000${article.filePath}`, '_blank')
    }
  }

  const trackShare = async () => {
    try {
      await fetch(`http://localhost:5000/api/editorial/article/${params.id}/share`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Article not found</p>
          <Link href="/articles" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/articles" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Articles
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm">
          {/* Article Header */}
          <div className="p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{article.title}</h1>
            
            <div className="mb-6">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-900">
                    {article.submittedBy.firstName} {article.submittedBy.lastName}
                  </span>
                  {article.submittedBy.institution && (
                    <div className="text-gray-500">{article.submittedBy.institution}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Published:</span> {formatDate(article.publicationDetails.publishedDate)}
                </div>
                {article.publicationDetails.volume && (
                  <div>
                    <span className="font-medium">Volume:</span> {article.publicationDetails.volume}
                  </div>
                )}
                {article.publicationDetails.issue && (
                  <div>
                    <span className="font-medium">Issue:</span> {article.publicationDetails.issue}
                  </div>
                )}
                {article.publicationDetails.pages && (
                  <div>
                    <span className="font-medium">Pages:</span> {article.publicationDetails.pages}
                  </div>
                )}
                {article.publicationDetails.doi && (
                  <div>
                    <span className="font-medium">DOI:</span> 
                    <a 
                      href={`https://doi.org/${article.publicationDetails.doi}`}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {article.publicationDetails.doi}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {article.filePath && (
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  📄 Download PDF
                </button>
              )}
              <button
                onClick={() => setShowCitation(!showCitation)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                📝 Cite Article
              </button>
              <button
                onClick={async () => {
                  await trackShare()
                  
                  const url = window.location.href
                  const title = article.title
                  const text = `Check out this research article: "${title}"`
                  
                  if (navigator.share) {
                    navigator.share({ title, text, url })
                  } else {
                    navigator.clipboard.writeText(url)
                    alert('Article URL copied to clipboard!')
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                🔗 Share
              </button>
            </div>

            {/* Citation Modal */}
            {showCitation && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">Cite this article</h3>
                <div className="mb-3">
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="apa">APA Style</option>
                    <option value="mla">MLA Style</option>
                    <option value="chicago">Chicago Style</option>
                    <option value="bibtex">BibTeX</option>
                  </select>
                </div>
                <div className="bg-white p-3 rounded border text-sm font-mono">
                  {generateCitation(citationStyle)}
                </div>
                <button
                  onClick={() => copyToClipboard(generateCitation(citationStyle))}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Copy Citation
                </button>
              </div>
            )}
          </div>

          {/* Article Body */}
          <div className="p-8">
            {/* Abstract */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Abstract</h2>
              <p className="text-gray-700 leading-relaxed">{article.abstract}</p>
            </div>

            {/* Keywords */}
            {article.keywords && formatKeywords(article.keywords).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {formatKeywords(article.keywords).map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Research Areas */}
            {article.researchAreas && article.researchAreas.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Research Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {article.researchAreas.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Article Metrics */}
            {article.metrics && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Article Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{article.metrics.views || 0}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{article.metrics.downloads || 0}</div>
                    <div className="text-sm text-gray-600">Downloads</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{article.metrics.citations || 0}</div>
                    <div className="text-sm text-gray-600">Citations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{article.metrics.shares || 0}</div>
                    <div className="text-sm text-gray-600">Shares</div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Text Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Full Text Access</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      The complete article is available for download as a PDF. 
                      This article is published under an open access license and is freely available to all readers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}