import { useState, useEffect } from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

interface Step {
  name: string
  status: 'verified' | 'pending' | 'not-started'
  link?: string
}

export function VerificationPage() {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        const response = await api.get('/verification/status')
        const result = response.data
        if (result.success) {
          const data = result.data
          const mappedSteps: Step[] = [
            { name: 'Email Verification', status: data.emailVerified ? 'verified' : 'not-started' },
            { name: 'Mobile Verification', status: data.mobileVerified ? 'verified' : 'not-started' },
            { name: 'Selfie Verification', status: data.selfieUrl ? 'pending' : 'not-started', link: '/verification/selfie' },
            { name: 'Government ID', status: data.govIdUrl ? 'pending' : 'not-started', link: '/verification/gov-id' },
            { name: 'Address Proof', status: data.addressProofUrl ? 'pending' : 'not-started', link: '/verification/address' },
          ]
          setSteps(mappedSteps)
        } else {
          setError(result.error || 'Failed to fetch verification status')
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to fetch verification status')
      } finally {
        setLoading(false)
      }
    }
    fetchVerificationStatus()
  }, [])

  const getIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'pending': return <Clock className="h-6 w-6 text-yellow-600" />
      default: return <XCircle className="h-6 w-6 text-gray-400" />
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Steps</h2>
      <div className="card overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {steps.map((step) => (
            <li key={step.name} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getIcon(step.status)}
                  <span className="ml-3 text-sm font-medium text-gray-900">{step.name}</span>
                </div>
                {step.link && step.status !== 'verified' ? (
                  <button onClick={() => toast.success('Redirecting to verification...')} className="text-sm text-blue-600 hover:text-blue-500">
                    Verify
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 capitalize">{step.status.replace('-', ' ')}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
