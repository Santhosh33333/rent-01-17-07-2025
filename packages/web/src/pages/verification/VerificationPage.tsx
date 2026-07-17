import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Step {
  name: string
  status: 'verified' | 'pending' | 'not-started'
  link?: string
}

const steps: Step[] = [
  { name: 'Email Verification', status: 'verified' },
  { name: 'Mobile Verification', status: 'verified' },
  { name: 'Government ID', status: 'not-started', link: '/verification/gov-id' },
  { name: 'Address Proof', status: 'not-started', link: '/verification/address' },
  { name: 'Selfie Verification', status: 'not-started', link: '/verification/selfie' },
]

export function VerificationPage() {
  const getIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'pending': return <Clock className="h-6 w-6 text-yellow-600" />
      default: return <XCircle className="h-6 w-6 text-gray-400" />
    }
  }

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
                  <Link to={step.link} className="text-sm text-blue-600 hover:text-blue-500">
                    Verify
                  </Link>
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
