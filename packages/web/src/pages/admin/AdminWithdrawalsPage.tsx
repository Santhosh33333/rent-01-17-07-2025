import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Withdrawal {
  id: number
  user: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  date: string
}

const withdrawals: Withdrawal[] = [
  { id: 1, user: 'Alice Johnson', amount: 250.00, status: 'pending', date: '2025-01-15' },
  { id: 2, user: 'Bob Smith', amount: 100.00, status: 'pending', date: '2025-01-14' },
  { id: 3, user: 'Carol White', amount: 500.00, status: 'pending', date: '2025-01-13' },
]

export function AdminWithdrawalsPage() {
  const [list, setList] = useState(withdrawals)

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    setList(list.map(w => w.id === id ? { ...w, status: action === 'approve' ? 'approved' : 'rejected' } : w))
    toast.success(`Withdrawal ${action}d`)
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.map(w => (
              <tr key={w.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.user}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${w.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    w.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    w.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {w.status}
                  </span>
                </td>
                {w.status === 'pending' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button onClick={() => handleAction(w.id, 'approve')} className="text-green-600 hover:text-green-800">
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleAction(w.id, 'reject')} className="text-red-600 hover:text-red-800">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
