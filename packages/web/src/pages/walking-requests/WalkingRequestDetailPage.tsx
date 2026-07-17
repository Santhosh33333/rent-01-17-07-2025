import { useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

export function WalkingRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: string) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast.success(`Request ${action} successfully`)
  }

  return (
    <div className="max-w-3xl">
      <div className="card p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Walking Request #{id}</h2>
            <p className="text-sm text-gray-600 mt-1">Type: Walking | Location: Central Park</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Open
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-sm font-medium text-gray-900">January 20, 2025</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="text-sm font-medium text-gray-900">10:00 AM</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Reward</p>
            <p className="text-sm font-medium text-gray-900">$25.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Requester</p>
            <p className="text-sm font-medium text-gray-900">John Doe</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-500">Description</p>
          <p className="text-sm text-gray-900 mt-1">Need someone to walk my dog in the morning. Friendly golden retriever.</p>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => handleAction('accepted')} disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : 'Accept Request'}
          </button>
          <button onClick={() => handleAction('completed')} disabled={loading} className="btn-secondary">
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  )
}
