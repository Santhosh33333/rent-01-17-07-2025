import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Partner {
  id: number
  name: string
  email: string
  status: 'pending' | 'active' | 'inactive'
  jobs: number
  rating: number
}

const partners: Partner[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active', jobs: 45, rating: 4.8 },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'pending', jobs: 0, rating: 0 },
  { id: 3, name: 'Carol White', email: 'carol@example.com', status: 'active', jobs: 23, rating: 4.5 },
]

export function AdminWalkingPartnersPage() {
  const [list, setList] = useState(partners)

  const handleAction = (id: number, action: 'activate' | 'deactivate') => {
    setList(list.map(p => p.id === id ? { ...p, status: action === 'activate' ? 'active' : 'inactive' } : p))
    toast.success(`Partner ${action}d`)
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jobs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.map(partner => (
              <tr key={partner.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    partner.status === 'active' ? 'bg-green-100 text-green-800' :
                    partner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {partner.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.jobs}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.rating > 0 ? partner.rating : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {partner.status === 'pending' && (
                    <button onClick={() => handleAction(partner.id, 'activate')} className="text-green-600 hover:text-green-800">
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  )}
                  {partner.status === 'active' && (
                    <button onClick={() => handleAction(partner.id, 'deactivate')} className="text-red-600 hover:text-red-800">
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
