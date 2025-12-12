'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EditorLayout({ children }) {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkEditorAccess = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Check the actual user role from the backend
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          router.push('/login')
          return
        }

        const data = await response.json()
        console.log('🔍 DEBUG: Editor layout - checking user:', data.user)

        if (data.user.role !== 'editor' && data.user.role !== 'admin') {
          console.log('🔍 DEBUG: User role is', data.user.role, '- redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        console.log('🔍 DEBUG: User has editor access - role:', data.user.role)
        // Update localStorage with correct role
        localStorage.setItem('userRole', data.user.role)
        
      } catch (error) {
        console.error('Error checking editor access:', error)
        router.push('/login')
        return
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkEditorAccess()
  }, [router])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Checking editor access...</div>
      </div>
    )
  }

  return <>{children}</>
}