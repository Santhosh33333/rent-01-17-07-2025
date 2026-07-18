import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

interface Conversation {
  id: number
  name: string
  lastMessage: string
  time: string
  unread: boolean
}

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get<Conversation[]>('/messages/conversations')
        setConversations(res.data)
      } catch (err) {
        setError('Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Messages</h2>
      <div className="card overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {conversations.map(conv => (
            <li key={conv.id}>
              <Link to={`/messages/${conv.id}`} className="block hover:bg-gray-50">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {conv.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{conv.name}</p>
                      <p className="text-sm text-gray-500">{conv.lastMessage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{conv.time}</p>
                    {conv.unread && <span className="inline-block mt-1 h-2 w-2 bg-blue-600 rounded-full"></span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
