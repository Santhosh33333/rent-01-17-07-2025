import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface KycRequest {
  id: number
  user: string
  type: string
  submittedAt: string
}

const requests: KycRequest[] = [
  { id: 1, user: 'Alice Johnson', type: 'Government ID', submittedAt: '2025-01-15' },
  { id: 2, user: 'Bob Smith', type: 'Address Proof', submittedAt: '2025-01-14' },
  { id: 3, user: 'Carol White', type: 'Selfie', submittedAt: '2025-01-13' },
]

export function AdminKycPage() {
  const [list, setList] = useState(requests)

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    setList(list.filter(r => r.id !== id))
    toast.success(`KYC request ${action}d`)
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.map(req => (
              <tr key={req.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.user}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.submittedAt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button onClick={() => handleAction(req.id, 'approve')} className="text-green-600 hover:text-green-800">
                    <CheckCircle className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleAction(req.id, 'reject')} className="text-red-600 hover:text-red-800">
                    <XCircle className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
