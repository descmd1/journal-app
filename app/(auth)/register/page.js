'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const base_url = process.env.NEXT_PUBLIC_BASE_URL;

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    phoneNumber: '',
    country: 'Nigeria',
    role: 'author'
  })

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  const getSelectedCountry = () => {
    return countries.find(country => country.name === formData.country) || countries.find(country => country.name === 'Nigeria')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${base_url}/api/auth/register`, {
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
        
        // Redirect to appropriate dashboard
        if (data.user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 container">
      <div className="register-header">
        <Link href="/" className="flex justify-center">
          <h1 className="text-4xl font-bold text-green-600">NigJournal</h1>
        </Link>
        <h2 className="text-center text-4xl font-bold text-gray-900" style={{marginTop: '1.5rem'}}>
          Create your account
        </h2>
        <p className="text-center text-sm text-gray-600" style={{marginTop: '0.5rem'}}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-green-600"
            style={{textDecoration: 'underline'}}
          >
            Sign in here
          </Link>
        </p>
      </div>

      <div className="register-form-container">
        <div className="card" style={{maxWidth: '500px', margin: '2rem auto'}}>
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

            <div className="grid grid-cols-2 gap-4" style={{marginBottom: '1.5rem'}}>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@university.edu.ng"
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Institution
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                required
                value={formData.institution}
                onChange={handleChange}
                placeholder="University of Lagos"
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Department (Optional)
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                placeholder="Computer Science"
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Phone Number (Optional)
              </label>
              <div className="flex">
                <div 
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    borderRight: 'none',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minWidth: '80px'
                  }}
                >
                  {getSelectedCountry().dialCode}
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber ? formData.phoneNumber.replace(getSelectedCountry().dialCode, '').replace(/^\+/, '') : ''}
                  onChange={(e) => {
                    const dialCode = getSelectedCountry().dialCode
                    const formatted = formatPhoneNumber(e.target.value, dialCode)
                    setFormData({
                      ...formData,
                      phoneNumber: formatted
                    })
                    setError('')
                  }}
                  placeholder="8012345678"
                  style={{
                    flex: 1,
                    borderTopLeftRadius: '0',
                    borderBottomLeftRadius: '0'
                  }}
                />
              </div>
              <div className="text-xs text-gray-500" style={{marginTop: '0.25rem'}}>
                Enter your phone number without the country code
              </div>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="author">Author/Researcher</option>
                <option value="reviewer">Reviewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin (Testing)</option>
              </select>
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
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

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700" style={{marginBottom: '0.25rem'}}>
                Confirm Password
              </label>
              <div style={{position: 'relative'}}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  style={{paddingRight: '3rem'}}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center" style={{marginBottom: '1.5rem'}}>
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                style={{
                  width: '1rem',
                  height: '1rem',
                  marginRight: '0.5rem'
                }}
              />
              <label htmlFor="terms" className="text-sm text-gray-900">
                I agree to the{' '}
                <Link href="/terms" className="text-green-600" style={{textDecoration: 'underline'}}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-green-600" style={{textDecoration: 'underline'}}>
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
                style={{
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}