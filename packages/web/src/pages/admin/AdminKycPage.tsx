import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'

interface KycRequest {
  id: number
  user: string
  type: string
  submittedAt: string
}

export function AdminKycPage() {
  const [list, setList] = useState<KycRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get<KycRequest[]>('/admin/kyc-queue')
        setList(res.data)
      } catch (err) {
        setError('Failed to load KYC queue')
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/admin/kyc/${id}/${action}`)
      setList(list.filter(r => r.id !== id))
      toast.success(`KYC request ${action}d`)
    } catch (err) {
      toast.error('Action failed')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>

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
