import { useState } from 'react'
import { useParams } from 'react-router-dom'

interface Message {
  id: number
  sender: 'me' | 'them'
  text: string
  time: string
}

const messages: Message[] = [
  { id: 1, sender: 'them', text: 'Hi! Are you available for a walk tomorrow?', time: '10:00 AM' },
  { id: 2, sender: 'me', text: 'Yes, I am! What time works for you?', time: '10:05 AM' },
  { id: 3, sender: 'them', text: 'How about 9 AM?', time: '10:06 AM' },
  { id: 4, sender: 'me', text: 'That works perfectly. See you tomorrow!', time: '10:08 AM' },
]

export function ConversationPage() {
  const { userId } = useParams<{ userId: string }>()
  const [text, setText] = useState('')

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setText('')
  }

  return (
    <div className="max-w-3xl flex flex-col h-[600px]">
      <div className="card p-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900">Conversation with User #{userId}</h3>
      </div>
      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-500'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
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
