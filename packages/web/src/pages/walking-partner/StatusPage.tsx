import { CheckCircle, Clock, XCircle } from 'lucide-react'

const steps = [
  { name: 'Application Submitted', status: 'verified', date: '2025-01-10' },
  { name: 'Background Check', status: 'verified', date: '2025-01-12' },
  { name: 'Interview', status: 'pending', date: null },
  { name: 'Training', status: 'not-started', date: null },
]

export function StatusPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status: Pending</h3>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.name} className="flex items-center">
              <div className="flex-shrink-0">
                {step.status === 'verified' && <CheckCircle className="h-6 w-6 text-green-600" />}
                {step.status === 'pending' && <Clock className="h-6 w-6 text-yellow-600" />}
                {step.status === 'not-started' && <XCircle className="h-6 w-6 text-gray-400" />}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">{step.name}</p>
                {step.date && <p className="text-xs text-gray-500">{step.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-xl font-semibold text-gray-900">$450.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Jobs Completed</p>
            <p className="text-xl font-semibold text-gray-900">23</p>
          </div>
        </div>
      </div>
    </div>
  )
}
