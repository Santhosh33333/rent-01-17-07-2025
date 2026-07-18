import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

export function ConversationPage() {
  const { userId } = useParams<{ userId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${userId}`)
        const result = response.data
        if (result.success) {
          setMessages(result.data)
        } else {
          setError(result.error || 'Failed to fetch messages')
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to fetch messages')
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchMessages()
  }, [userId])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !userId) return
    try {
      await api.post('/messages', { receiverId: userId, content: text, conversationId: [userId].sort().join('_') })
      setText('')
    } catch {
      // handle error
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>

  return (
    <div className="max-w-3xl flex flex-col h-[600px]">
      <div className="card p-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900">Conversation with User #{userId}</h3>
      </div>
      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId === 'me' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.senderId === 'me' ? 'text-blue-200' : 'text-gray-500'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">No messages yet</div>
          )}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="input rounded-md flex-1"
            />
            <button type="submit" className="btn-primary">Send</button>
          </div>
        </form>
      </div>
    </div>
  )
}
