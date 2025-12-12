'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')

  const features = [
    {
      title: 'Easy Manuscript Submission',
      description: 'Submit your research papers with our streamlined, user-friendly submission system.'
    },
    {
      title: 'Peer Review System',
      description: 'Rigorous peer review process ensuring high-quality academic publications.'
    },
    {
      title: 'Nigerian Focus',
      description: 'Designed specifically for Nigerian researchers and academic institutions.'
    },
    {
      title: 'Affordable Publishing',
      description: 'Low-cost alternative to expensive international journals without compromising quality.'
    },
    {
      title: 'Expert Editorial Board',
      description: 'Experienced editors and reviewers from leading Nigerian universities.'
    },
    {
      title: 'Fast Publication',
      description: 'Efficient review process with average publication time of 6-8 weeks.'
    }
  ]

  const stats = [
    { label: 'Published Articles', value: '1,200+' },
    { label: 'Active Researchers', value: '500+' },
    { label: 'Universities', value: '50+' },
    { label: 'Average Review Time', value: '3 weeks' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="header">
        <nav className="max-w-7xl container">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold text-green-600">NigJournal</h1>
              </div>
            </div>
            <div className="md-block hidden">
              <div className="flex items-center space-x-4">
                <Link href="/articles" className="nav-link">
                  Published Articles
                </Link>
                <Link href="/browse" className="nav-link">
                  Browse Journals
                </Link>
                <Link href="/about" className="nav-link">
                  About
                </Link>
                <Link href="/contact" className="nav-link">
                  Contact
                </Link>
                <Link href="/login" className="nav-link">
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="max-w-7xl container py-24">
          <div className="text-center">
            <h1 className="text-4xl md-text-6xl font-bold text-gray-900 mb-6">
              Affordable Academic Publishing for 
              <span className="text-green-600"> Nigerian Researchers</span>
            </h1>
            <p className="text-xl md-text-2xl text-gray-600 mb-8 max-w-3xl">
              Publish your research in high-quality journals at a fraction of international costs. 
              Built by Nigerians, for Nigerian academia.
            </p>
            <div className="flex flex-col sm-flex-row gap-4 justify-center items-center">
              <Link 
                href="/register"
                className="btn btn-primary text-lg py-4 px-8"
              >
                Submit Your Research →
              </Link>
              <Link 
                href="/browse"
                className="btn btn-secondary text-lg py-4 px-8"
              >
                Browse Journals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-green-600 py-12">
        <div className="max-w-7xl container">
          <div className="grid grid-cols-2 grid-md-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-4">
                  {stat.value}
                </div>
                <div className="text-white text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl container">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose NigJournal?
            </h2>
            <p className="text-xl text-gray-600">
              We understand the challenges Nigerian researchers face and provide solutions 
              tailored to your needs.
            </p>
          </div>
          <div className="grid grid-md-cols-2 grid-lg-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card">
                <div className="bg-green-100 rounded-lg inline-flex items-center justify-center p-4 mb-4">
                  <span className="text-green-600 text-xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-12">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Publish Your Research?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of Nigerian researchers who have chosen affordability without 
            compromising on quality.
          </p>
          <div className="flex flex-col sm-flex-row gap-4 justify-center" style={{maxWidth: '400px', margin: '0 auto'}}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{flex: 1}}
            />
            <button className="btn btn-primary">
              Get Started
            </button>
          </div>
          <p className="text-sm text-gray-600" style={{marginTop: '1rem'}}>
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: '#111827', color: '#ffffff', padding: '4rem 0'}}>
        <div className="max-w-7xl container">
          <div className="grid grid-md-cols-4 gap-6">
            <div style={{gridColumn: 'span 2'}}>
              <h3 className="text-2xl font-bold mb-4">NigJournal</h3>
              <p style={{color: '#9ca3af', marginBottom: '1rem', maxWidth: '400px'}}>
                Making academic publishing accessible and affordable for Nigerian researchers 
                and institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul style={{listStyle: 'none', color: '#9ca3af'}}>
                <li style={{marginBottom: '0.5rem'}}><Link href="/browse" style={{color: '#9ca3af'}}>Browse Journals</Link></li>
                <li style={{marginBottom: '0.5rem'}}><Link href="/submit" style={{color: '#9ca3af'}}>Submit Research</Link></li>
                <li style={{marginBottom: '0.5rem'}}><Link href="/review" style={{color: '#9ca3af'}}>Become a Reviewer</Link></li>
                <li style={{marginBottom: '0.5rem'}}><Link href="/pricing" style={{color: '#9ca3af'}}>Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul style={{listStyle: 'none', color: '#9ca3af'}}>
                <li style={{marginBottom: '0.5rem'}}><Link href="/help" style={{color: '#9ca3af'}}>Help Center</Link></li>
                <li style={{marginBottom: '0.5rem'}}><Link href="/contact" style={{color: '#9ca3af'}}>Contact Us</Link></li>
                <li style={{marginBottom: '0.5rem'}}><Link href="/guidelines" style={{color: '#9ca3af'}}>Guidelines</Link></li>
                <li style={{marginBottom: '0.5rem'}}><Link href="/faq" style={{color: '#9ca3af'}}>FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div style={{borderTop: '1px solid #374151', marginTop: '3rem', paddingTop: '2rem', textAlign: 'center', color: '#9ca3af'}}>
            <p>&copy; 2024 NigJournal. All rights reserved. Empowering Nigerian academia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
