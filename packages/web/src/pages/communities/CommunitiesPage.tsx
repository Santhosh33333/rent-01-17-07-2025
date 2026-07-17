import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Community {
  id: number
  name: string
  members: number
  description: string
  joined: boolean
}

const communities: Community[] = [
  { id: 1, name: 'Dog Walkers United', members: 245, description: 'A community for dog walking enthusiasts', joined: false },
  { id: 2, name: 'Morning Walkers', members: 189, description: 'Early morning walking group', joined: true },
  { id: 3, name: 'Pet Parents', members: 512, description: 'Community for pet owners', joined: false },
]

export function CommunitiesPage() {
  const [list, setList] = useState(communities)

  const toggleJoin = (id: number) => {
    setList(list.map(c => c.id === id ? { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 } : c))
  }

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
