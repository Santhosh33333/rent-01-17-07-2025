import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

interface Community {
  id: number
  name: string
  members: number
  description: string
  joined: boolean
}

export function CommunitiesPage() {
  const [list, setList] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await api.get<Community[]>('/communities')
        setList(res.data)
      } catch (err) {
        setError('Failed to load communities')
      } finally {
        setLoading(false)
      }
    }
    fetchCommunities()
  }, [])

  const toggleJoin = async (id: number) => {
    try {
      const community = list.find(c => c.id === id)
      if (!community) return

      if (community.joined) {
        await api.post(`/communities/${id}/leave`)
      } else {
        await api.post(`/communities/${id}/join`)
      }
      setList(list.map(c => c.id === id ? { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 } : c))
    } catch (err) {
      // keep UI optimistic but don't revert
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {list.map(community => (
          <div key={community.id} className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  <Link to={`/communities/${community.id}`} className="hover:text-blue-600">
                    {community.name}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 mt-1">{community.description}</p>
                <p className="text-sm text-gray-500 mt-2">{community.members} members</p>
              </div>
              <button
                onClick={() => toggleJoin(community.id)}
                className={community.joined ? 'btn-secondary' : 'btn-primary'}
              >
                {community.joined ? 'Leave' : 'Join'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
