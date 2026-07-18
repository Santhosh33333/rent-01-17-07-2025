import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

interface Partner {
  id: string
  user: { fullName: string; email: string }
  status: string
  totalWalks: number
  rating: number
}

export function AdminWalkingPartnersPage() {
  const [list, setList] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await api.get('/admin/walking-partners')
        const result = response.data
        if (result.success) {
          setList(result.data.items)
        } else {
          setError(result.error || 'Failed to fetch walking partners')
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to fetch walking partners')
      } finally {
        setLoading(false)
      }
    }
    fetchPartners()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const endpoint = action === 'approve' ? `/admin/walking-partners/${id}/approve` : `/admin/walking-partners/${id}/reject`
      await api.post(endpoint)
      toast.success(`Partner ${action}d`)
      setList(list.filter(p => p.id !== id))
    } catch {
      toast.error(`Failed to ${action} partner`)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Walks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.map(partner => (
              <tr key={partner.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.user.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    partner.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    partner.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {partner.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.totalWalks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.rating > 0 ? partner.rating.toFixed(1) : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {partner.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleAction(partner.id, 'approve')} className="text-green-600 hover:text-green-800">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleAction(partner.id, 'reject')} className="text-red-600 hover:text-red-800">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No walking partners found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
