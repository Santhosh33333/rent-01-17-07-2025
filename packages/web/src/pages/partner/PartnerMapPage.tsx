import { useState, useEffect } from 'react'
import {
  Navigation, List, Loader2, Footprints, Package, User
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { AnimatedPage } from '../../components/AnimatedPage'
import { GlassCard } from '../../components/GlassCard'

interface NearbyBooking {
  id: string
  serviceType: string
  pickupLocation: string
  dropLocation?: string
  userName?: string
  estimatedEarning?: number
}

export function PartnerMapPage() {
  const [view, setView] = useState<'map' | 'list'>('map')
  const [nearby, setNearby] = useState<NearbyBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        const res = await api.get('/partner/nearby-bookings')
        const raw = res.data?.data || res.data || []
        setNearby(Array.isArray(raw) ? raw : [])
      } catch {
        toast.error('Failed to load nearby requests')
      } finally {
        setLoading(false)
      }
    }
    fetchNearby()
    const interval = setInterval(fetchNearby, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatedPage>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-surface-900 dark:text-white flex items-center gap-3">
              <Navigation className="w-7 h-7 text-emerald-500" />
              Map
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Nearby booking requests</p>
          </div>
          <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
            <button onClick={() => setView('map')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'map' ? 'bg-white dark:bg-surface-700 shadow text-surface-900 dark:text-white' : 'text-surface-500'}`}>
              <Navigation className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'list' ? 'bg-white dark:bg-surface-700 shadow text-surface-900 dark:text-white' : 'text-surface-500'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AnimatedPage>

      {view === 'map' ? (
        <AnimatedPage delay={100}>
          <div className="relative h-[60vh] rounded-3xl overflow-hidden bg-gradient-to-br from-sky-100 via-emerald-50 to-blue-100 dark:from-sky-900 dark:via-emerald-900 dark:to-blue-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Navigation className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
                <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">Interactive map coming soon</p>
              </div>
            </div>
            <div className="absolute top-1/4 left-1/3 w-24 h-24 rounded-full bg-emerald-200/30 dark:bg-emerald-800/20 blur-2xl" />
            <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-sky-200/30 dark:bg-sky-800/20 blur-2xl" />

            {/* Simulated nearby markers */}
            {nearby.slice(0, 5).map((b, i) => (
              <div
                key={b.id}
                className="absolute w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${15 + i * 18}%`,
                  animationDelay: `${i * 200}ms`,
                }}
              />
            ))}
          </div>
        </AnimatedPage>
      ) : (
        <AnimatedPage delay={100}>
          <div className="space-y-3">
            {nearby.map((booking) => (
              <GlassCard key={booking.id} variant="elevated" padding="sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                    booking.serviceType === 'WALKING' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}>
                    {booking.serviceType === 'WALKING' ? <Footprints className="w-4 h-4 text-white" /> : <Package className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{booking.pickupLocation}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-surface-500">{booking.serviceType === 'WALKING' ? 'Walking' : 'Carry'}</span>
                      {booking.userName && <span className="text-xs text-surface-400 flex items-center gap-1"><User className="w-3 h-3" /> {booking.userName}</span>}
                    </div>
                  </div>
                  {booking.estimatedEarning !== undefined && (
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{booking.estimatedEarning}</span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </AnimatedPage>
      )}

      <AnimatedPage delay={200}>
        <div className="sticky bottom-24 md:bottom-8 z-30">
          <GlassCard variant="elevated" padding="sm" className="bg-emerald-600 text-white border-0">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-semibold">{nearby.length} nearby request{nearby.length !== 1 ? 's' : ''}</span>
              <button onClick={() => setView(view === 'map' ? 'list' : 'map')} className="text-xs font-medium text-white/80 hover:text-white">
                {view === 'map' ? 'View List' : 'View Map'}
              </button>
            </div>
          </GlassCard>
        </div>
      </AnimatedPage>
    </div>
  )
}
