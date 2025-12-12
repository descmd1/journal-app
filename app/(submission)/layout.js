'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmissionLayout({ children }) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="submission-layout">
      {children}
    </div>
  )
}