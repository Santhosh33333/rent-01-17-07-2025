import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Event {
  id: number
  name: string
  date: string
  location: string
  rsvp: boolean
}

const events: Event[] = [
  { id: 1, name: 'Morning Dog Walk', date: '2025-01-20T08:00:00', location: 'Central Park', rsvp: false },
  { id: 2, name: 'Community Meetup', date: '2025-01-25T14:00:00', location: 'Downtown Community Center', rsvp: true },
  { id: 3, name: 'Pet Parade', date: '2025-02-01T10:00:00', location: 'Riverside', rsvp: false },
]

export function EventsPage() {
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
