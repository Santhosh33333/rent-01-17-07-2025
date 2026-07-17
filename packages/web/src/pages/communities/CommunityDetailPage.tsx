import { useParams } from 'react-router-dom'
import { Users } from 'lucide-react'

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900">Community #{id}</h2>
        <p className="text-sm text-gray-600 mt-2">A community for pet lovers and walking enthusiasts.</p>
        <div className="flex items-center mt-4 text-sm text-gray-500">
          <Users className="h-4 w-4 mr-1" />
          245 members
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Members</h3>
        <div className="space-y-3">
          {['Alice Johnson', 'Bob Smith', 'Carol White'].map(member => (
            <div key={member} className="flex items-center py-2 border-b border-gray-100 last:border-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                {member.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="ml-3 text-sm text-gray-900">{member}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
