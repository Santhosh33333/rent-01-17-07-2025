import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

interface Request {
  id: number
  type: 'walking' | 'companionship'
  location: string
  date: string
  status: 'open' | 'accepted' | 'completed'
  reward: number
}

const requests: Request[] = [
  { id: 1, type: 'walking', location: 'Central Park', date: '2025-01-20', status: 'open', reward: 25.00 },
  { id: 2, type: 'companionship', location: 'Downtown Mall', date: '2025-01-21', status: 'accepted', reward: 30.00 },
  { id: 3, type: 'walking', location: 'Riverside', date: '2025-01-19', status: 'completed', reward: 20.00 },
]

export function WalkingRequestsPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'accepted' | 'completed'>('all')
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {['all', 'open', 'accepted', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Link to="/walking-requests/create" className="btn-primary">Create Request</Link>
      </div>
      <div className="grid gap-4">
        {filtered.map(req => (
          <div key={req.id} className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900 capitalize">{req.type} Request</h3>
                <p className="text-sm text-gray-600">{req.location}</p>
                <p className="text-sm text-gray-500">{format(new Date(req.date), 'MMM d, yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">${req.reward.toFixed(2)}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  req.status === 'open' ? 'bg-green-100 text-green-800' :
                  req.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {req.status}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Link to={`/walking-requests/${req.id}`} className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
