'use client'

import { useState, useEffect } from 'react'

export default function TestPayment() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)

  useEffect(() => {
    const checkPaystack = () => {
      if (window.PaystackPop) {
        setPaystackLoaded(true)
      } else {
        setTimeout(checkPaystack, 1000)
      }
    }
    
    checkPaystack()
  }, [])

  const testPaystackPayment = () => {
    if (!paystackLoaded || !window.PaystackPop) {
      alert('Payment system is still loading. Please wait a moment and try again.')
      return
    }
    
    setIsProcessing(true)

    const handler = window.PaystackPop.setup({
      key: 'pk_test_74c4b550392bc81ab2814162710b3eae987d0fce', // Test public key
      email: 'test@example.com',
      amount: 5000000, // ₦50,000 in kobo
      currency: 'NGN',
      ref: `test_${Date.now()}`,
      metadata: {
        testPayment: true,
        description: 'Test publication fee payment'
      },
      callback: function(response) {
        alert(`Payment successful! Reference: ${response.reference}`)
        setIsProcessing(false)
        console.log('Payment response:', response)
      },
      onClose: function() {
        setIsProcessing(false)
        console.log('Payment window closed.')
      }
    })
    
    handler.openIframe()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Paystack Payment</h1>
        
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Test Card Details:</h3>
          <div className="bg-gray-100 p-4 rounded text-sm">
            <p><strong>Card Number:</strong> 4084084084084081</p>
            <p><strong>CVV:</strong> 408</p>
            <p><strong>Expiry:</strong> 12/30</p>
            <p><strong>Pin:</strong> 0000</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">Amount: <strong>₦50,000.00</strong></p>
          <p className="text-sm text-gray-500">Publication fee for manuscript</p>
        </div>

        <button
          onClick={testPaystackPayment}
          disabled={isProcessing || !paystackLoaded}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing 
            ? 'Processing...' 
            : !paystackLoaded 
              ? 'Loading Payment System...'
              : 'Test Payment with Paystack'
          }
        </button>

        <div className="mt-4 text-xs text-gray-500 text-center">
          🔒 TEST MODE: No real charges will be made
        </div>
      </div>
    </div>
  )
}