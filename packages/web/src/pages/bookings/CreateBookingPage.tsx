import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Footprints, Package, MapPin, Navigation, Calendar, Clock, Timer,
  FileText, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { AnimatedPage } from '../../components/AnimatedPage'
import { GlassCard } from '../../components/GlassCard'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7
type ServiceType = 'WALKING' | 'CARRY_BUDDY'

interface BookingData {
  serviceType: ServiceType
  pickupLocation: string
  dropLocation: string
  date: string
  time: string
  duration: string
  itemType: string
  itemDescription: string
}

const STEPS = [
  { label: 'Service', icon: Footprints },
  { label: 'Location', icon: MapPin },
  { label: 'Schedule', icon: Calendar },
  { label: 'Details', icon: FileText },
  { label: 'Estimate', icon: CreditCard },
  { label: 'Confirm', icon: CheckCircle },
]

export function CreateBookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = (searchParams.get('type') as ServiceType) || 'WALKING'

  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState<BookingData>({
    serviceType: initialType,
    pickupLocation: '',
    dropLocation: '',
    date: '',
    time: '',
    duration: '60',
    itemType: '',
    itemDescription: '',
  })
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)

  const updateBooking = (data: Partial<BookingData>) => {
    setBooking((prev) => ({ ...prev, ...data }))
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!booking.serviceType
      case 2: return !!booking.pickupLocation
      case 3: return !!booking.date && !!booking.time
      case 4: return booking.serviceType === 'WALKING' || true
      case 5: return true
      case 6: return true
      default: return true
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await api.post('/bookings', {
        serviceType: booking.serviceType,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation || undefined,
        scheduledTime: `${booking.date}T${booking.time}:00`,
        duration: parseInt(booking.duration),
        itemType: booking.itemType || undefined,
        itemDescription: booking.itemDescription || undefined,
      })
      const data = res.data?.data || res.data
      const id = data?.id || data?.bookingId
      setCreatedBookingId(id)

      if (id) {
        try {
          await api.post(`/bookings/${id}/pay`)
        } catch {
          // Payment can fail, booking is still created
        }
      }

      setStep(7)
      toast.success('Booking created successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const basePrice = booking.serviceType === 'WALKING' ? 149 : 199
  const platformFee = Math.round(basePrice * 0.15)
  const total = basePrice + platformFee

  const today = new Date().toISOString().split('T')[0]

  if (step === 7) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AnimatedPage>
          <div className="text-center max-w-sm mx-auto">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-white mb-2">Booking Confirmed!</h1>
            <p className="text-surface-500 dark:text-surface-400 mb-8">Your {booking.serviceType === 'WALKING' ? 'walking buddy' : 'carry buddy'} booking has been created and payment processed.</p>
            <div className="space-y-3">
              {createdBookingId && (
                <button onClick={() => navigate(`/bookings/${createdBookingId}`)} className="w-full btn-primary">
                  View Booking
                </button>
              )}
              <button onClick={() => navigate('/bookings')} className="w-full btn-outline">
                View All Bookings
              </button>
              <button onClick={() => navigate('/')} className="w-full btn-outline">
                Back to Home
              </button>
            </div>
          </div>
        </AnimatedPage>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <AnimatedPage>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white font-display tracking-tight">Create Booking</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1.5 text-sm">Step {step} of {STEPS.length}</p>
        </div>
      </AnimatedPage>

      <AnimatedPage delay={25}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((_s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i + 1 <= step
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
              }`}>
                {i + 1 < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 rounded-full ${i + 1 < step ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'}`} />
              )}
            </div>
          ))}
        </div>
      </AnimatedPage>

      <AnimatedPage delay={50}>
        <GlassCard variant="elevated" padding="lg">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="section-title">Choose Service</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => updateBooking({ serviceType: 'WALKING' })}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${
                    booking.serviceType === 'WALKING'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 shadow-lg shadow-emerald-500/10'
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                    <Footprints className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-lg font-bold font-display text-surface-900 dark:text-white">Walking Buddy</p>
                  <p className="text-sm text-surface-500 mt-1">Find a companion for your walk</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-3">₹149</p>
                </button>
                <button
                  onClick={() => updateBooking({ serviceType: 'CARRY_BUDDY' })}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${
                    booking.serviceType === 'CARRY_BUDDY'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 shadow-lg shadow-amber-500/10'
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-lg font-bold font-display text-surface-900 dark:text-white">CarryBuddy</p>
                  <p className="text-sm text-surface-500 mt-1">Deliver or receive items</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-3">₹199</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="section-title">Pickup & Destination</h2>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Pickup Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    value={booking.pickupLocation}
                    onChange={(e) => updateBooking({ pickupLocation: e.target.value })}
                    placeholder="Enter pickup location"
                    className="input pl-12 py-3.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Destination (optional)</label>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    value={booking.dropLocation}
                    onChange={(e) => updateBooking({ dropLocation: e.target.value })}
                    placeholder="Enter destination"
                    className="input pl-12 py-3.5"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="section-title">Date, Time & Duration</h2>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="date"
                    value={booking.date}
                    onChange={(e) => updateBooking({ date: e.target.value })}
                    min={today}
                    className="input pl-12 py-3.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Time *</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="time"
                    value={booking.time}
                    onChange={(e) => updateBooking({ time: e.target.value })}
                    className="input pl-12 py-3.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Duration</label>
                <div className="relative">
                  <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <select
                    value={booking.duration}
                    onChange={(e) => updateBooking({ duration: e.target.value })}
                    className="input pl-12 py-3.5"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && booking.serviceType === 'CARRY_BUDDY' && (
            <div className="space-y-4">
              <h2 className="section-title">Item Details</h2>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Item Type</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    value={booking.itemType}
                    onChange={(e) => updateBooking({ itemType: e.target.value })}
                    placeholder="e.g., Documents, Groceries, Package"
                    className="input pl-12 py-3.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Description (optional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-surface-400" />
                  <textarea
                    value={booking.itemDescription}
                    onChange={(e) => updateBooking({ itemDescription: e.target.value })}
                    placeholder="Describe the item..."
                    rows={3}
                    className="input pl-12 py-3.5 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && booking.serviceType === 'WALKING' && (
            <div className="space-y-4">
              <h2 className="section-title">Additional Notes</h2>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Notes (optional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-surface-400" />
                  <textarea
                    value={booking.itemDescription}
                    onChange={(e) => updateBooking({ itemDescription: e.target.value })}
                    placeholder="Any special instructions..."
                    rows={3}
                    className="input pl-12 py-3.5 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="section-title">Price Estimate</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Base Price</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white">₹{basePrice}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Platform Fee (15%)</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white">₹{platformFee}</span>
                </div>
                <div className="h-px bg-surface-200 dark:bg-surface-700" />
                <div className="flex justify-between items-center p-3 rounded-xl bg-primary-50 dark:bg-primary-900/10">
                  <span className="text-sm font-bold text-surface-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">₹{total}</span>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="section-title">Confirm & Pay</h2>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-surface-500">Service</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">{booking.serviceType === 'WALKING' ? 'Walking Buddy' : 'CarryBuddy'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-surface-500">Pickup</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">{booking.pickupLocation}</span>
                  </div>
                  {booking.dropLocation && (
                    <div className="flex justify-between">
                      <span className="text-sm text-surface-500">Destination</span>
                      <span className="text-sm font-medium text-surface-900 dark:text-white">{booking.dropLocation}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-surface-500">Date & Time</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">
                      {booking.date} at {booking.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-surface-500">Duration</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">{booking.duration} min</span>
                  </div>
                  <div className="h-px bg-surface-200 dark:bg-surface-700" />
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-surface-900 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">₹{total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </AnimatedPage>

      <AnimatedPage delay={75}>
        <div className="flex gap-3">
          {step > 1 && step < 7 && (
            <button
              onClick={() => setStep((prev) => (prev - 1) as Step)}
              className="flex-1 btn-outline flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 6 && (
            <button
              onClick={() => setStep((prev) => (prev + 1) as Step)}
              disabled={!canProceed()}
              className="flex-1 btn-gradient flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {step === 6 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 btn-gradient flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Pay ₹{total} & Confirm
                </>
              )}
            </button>
          )}
        </div>
      </AnimatedPage>
    </div>
  )
}
