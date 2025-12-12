'use client'

import { useState, useEffect } from 'react'

export default function PaymentDebug() {
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const [debugInfo, setDebugInfo] = useState([])

  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, `${timestamp}: ${message}`])
    console.log(message)
  }

  useEffect(() => {
    addDebugInfo('Component mounted, checking Paystack...')
    
    const checkPaystack = () => {
      addDebugInfo(`window.PaystackPop exists: ${!!window.PaystackPop}`)
      
      if (window.PaystackPop) {
        addDebugInfo('✅ Paystack loaded successfully')
        setPaystackLoaded(true)
      } else {
        addDebugInfo('❌ Paystack not yet loaded, retrying...')
        setTimeout(checkPaystack, 1000)
      }
    }
    
    checkPaystack()
  }, [])

  const testPaystackModal = () => {
    addDebugInfo('🔥 Test payment button clicked')
    
    if (!window.PaystackPop) {
      addDebugInfo('❌ PaystackPop not available')
      alert('Paystack not loaded!')
      return
    }

    try {
      addDebugInfo('🚀 Initializing Paystack modal...')
      
      const handler = window.PaystackPop.setup({
        key: 'pk_test_74c4b550392bc81ab2814162710b3eae987d0fce', 
        email: 'test@example.com',
        amount: 5000000, // ₦50,000 in kobo
        currency: 'NGN',
        ref: `test_${Date.now()}`,
        metadata: {
          testPayment: true
        },
        callback: function(response) {
          addDebugInfo(`✅ Payment successful! Reference: ${response.reference}`)
          alert(`Payment successful! Reference: ${response.reference}`)
        },
        onClose: function() {
          addDebugInfo('🚪 Payment modal closed by user')
        }
      })
      
      addDebugInfo('📱 Opening Paystack modal...')
      handler.openIframe()
      
    } catch (error) {
      addDebugInfo(`❌ Error: ${error.message}`)
      console.error('Paystack error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold mb-4">Paystack Payment Debug Tool</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Status:</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${paystackLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{paystackLoaded ? 'Paystack Loaded' : 'Paystack Loading...'}</span>
            </div>
          </div>

          <button
            onClick={testPaystackModal}
            disabled={!paystackLoaded}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {paystackLoaded ? '🧪 Test Paystack Payment' : '⏳ Loading...'}
          </button>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Instructions:</strong> Click the test button above. If the Paystack modal opens, your payment system is working. 
              If not, check the debug log below for errors.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Debug Log:</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <div className="text-gray-500">Waiting for debug information...</div>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="mb-1">{info}</div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold mb-4">Browser Console Check:</h2>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Open your browser console (F12) and look for:</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Any JavaScript errors (red text)</li>
              <li>• Network errors when loading Paystack script</li>
              <li>• CORS errors</li>
              <li>• Any blocked content warnings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}