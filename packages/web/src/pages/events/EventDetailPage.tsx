import { useParams } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()

  const handleRsvp = () => {
    toast.success('RSVP confirmed!')
  }

  return (
    <div className="max-w-3xl">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900">Event #{id}</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            January 20, 2025 at 8:00 AM
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            Central Park
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            45 attending
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-700">
          Join us for a morning dog walk in Central Park. All dogs and owners welcome!
        </p>
        <div className="mt-6">
          <button onClick={handleRsvp} className="btn-primary">RSVP</button>
        </div>
      </div>
    </div>
  )
}
