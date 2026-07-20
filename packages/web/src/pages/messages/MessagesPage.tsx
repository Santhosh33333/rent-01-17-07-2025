import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Search, ChevronRight, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { AnimatedPage } from '../../components/AnimatedPage'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonLoader } from '../../components/SkeletonLoader'
import { useAsync } from '../../hooks/useAsync'

interface Conversation {
  id: number
  name: string
  lastMessage: string
  time: string
  unread: boolean
  online?: boolean
}

export function MessagesPage() {
  const [search, setSearch] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])

  const { loading, error, retry } = useAsync(
    async () => {
      const res = await api.get('/messages/conversations')
      const data = res.data?.data || res.data || []
      setConversations(data)
      return data
    },
    true
  )

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const unreadCount = conversations.filter(c => c.unread).length

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48 rounded-2xl" />
          <div className="skeleton h-12 rounded-2xl" />
        </div>
        <SkeletonLoader lines={5} variant="list" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState 
        icon={MessageCircle} 
        title="Failed to load messages" 
        description="Please check your connection and try again"
        action={<button onClick={retry} className="btn btn-primary btn-sm">Retry</button>} 
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <AnimatedPage>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 p-6 text-white shadow-xl shadow-primary-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22g%22%20width%3D%2230%22%20height%3D%2230%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%221%22%20fill%3D%22rgba(255,255,255,0.08)%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23g)%22/%3E%3C/svg%3E')] opacity-30" />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">Messages</h1>
              <p className="text-white/60 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread conversations` : 'No unread messages'}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="input bg-white/15 border-white/20 text-white placeholder:text-white/40 pl-11 focus:bg-white/20 focus:border-white/30"
            />
          </div>
        </div>
      </AnimatedPage>

      {/* Conversation List */}
      <AnimatedPage delay={100}>
        <div className="glass-elevated overflow-hidden divide-y divide-surface-100 dark:divide-surface-800">
          {filtered.length === 0 ? (
            <EmptyState icon={MessageCircle} title={search ? 'No conversations found' : 'No conversations yet'}
              description={search ? 'Try a different search term' : 'Start chatting with your walking partners!'} />
          ) : (
            filtered.map((conv) => (
              <Link key={conv.id} to={`/messages/${conv.id}`}
                className="block p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/20">
                      {conv.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    {conv.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-surface-900 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-sm font-bold ${conv.unread ? 'text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>
                        {conv.name}
                      </h3>
                      <span className="text-xs text-surface-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {conv.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${conv.unread ? 'text-surface-700 dark:text-surface-300 font-medium' : 'text-surface-500 dark:text-surface-400'}`}>
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 ml-2">
                        {conv.unread && <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                        <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </AnimatedPage>
    </div>
  )
}
