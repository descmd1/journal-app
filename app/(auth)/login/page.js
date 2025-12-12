'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const base_url = process.env.NEXT_PUBLIC_API_URL;

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${base_url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Redirect based on user role
        switch (data.user.role) {
          case 'admin':
            router.push('/admin')
            break
          case 'editor':
            router.push('/editor')
            break
          default:
            router.push('/dashboard')
        }
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 container">
      <div className="login-header">
        <Link href="/" className="flex justify-center">
          <h1 className="text-4xl font-bold text-green-600">NigJournal</h1>
        </Link>
        <h2 className="text-center text-4xl font-bold text-gray-900" style={{marginTop: '1.5rem'}}>
          Sign in to your account
        </h2>
        <p className="text-center text-sm text-gray-600" style={{marginTop: '0.5rem'}}>
          Or{' '}
          <Link
            href="/register"
            className="font-medium text-green-600"
            style={{textDecoration: 'underline'}}
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="login-form-container">
        <div className="card" style={{maxWidth: '400px', margin: '2rem auto'}}>
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

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Password
              </label>
              <div style={{position: 'relative'}}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  style={{paddingRight: '3rem'}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center" style={{marginBottom: '1.5rem'}}>
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={{
                    width: '1rem',
                    height: '1rem',
                    marginRight: '0.5rem'
                  }}
                />
                <label htmlFor="remember-me" className="text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-green-600"
                  style={{textDecoration: 'underline'}}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
                style={{
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div style={{marginTop: '1.5rem'}}>
            <div style={{position: 'relative', marginBottom: '1.5rem'}}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: '#d1d5db'
              }} />
              <div style={{
                position: 'relative',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                padding: '0 1rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                New to NigJournal?
              </div>
            </div>

            <Link
              href="/register"
              className="btn btn-secondary w-full text-center"
              style={{display: 'block'}}
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}