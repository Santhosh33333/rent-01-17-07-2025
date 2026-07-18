import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { api } from '../../lib/api'

interface Event {
  id: number
  name: string
  date: string
  location: string
  rsvp: boolean
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get<Event[]>('/events')
        setEvents(res.data)
      } catch (err) {
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {events.map(event => (
          <div key={event.id} className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  <Link to={`/events/${event.id}`} className="hover:text-blue-600">
                    {event.name}
                  </Link>
                </h3>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                </div>
                <p className="text-sm text-gray-600 mt-1">{event.location}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                event.rsvp ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {event.rsvp ? 'RSVPed' : 'Not RSVPed'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
