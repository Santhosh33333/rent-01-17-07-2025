import { api } from './api'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayOptions {
  amount: number
  description?: string
  notes?: Record<string, any>
  onSuccess: (paymentId: string, orderId: string, signature: string) => void
  onError: (error: any) => void
}

interface RazorpayBookingOptions {
  amount: number
  bookingId: string
  onSuccess: (paymentId: string, orderId: string, signature: string) => void
  onError: (error: any) => void
}

/**
 * Open Razorpay checkout for wallet top-up
 */
export async function openRazorpayCheckout({
  amount,
  description = 'Wallet Top-Up',
  notes = {},
  onSuccess,
  onError,
}: RazorpayOptions) {
  try {
    // Create order on backend
    const orderRes = await api.post('/payments/create-order', { amount })
    const { orderId, currency } = orderRes.data.data

    if (!window.Razorpay) {
      throw new Error('Razorpay script not loaded')
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: amount * 100, // Amount in paise
      currency: currency || 'INR',
      name: 'RentBuddy',
      description,
      order_id: orderId,
      notes,
      handler: (response: any) => {
        onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature)
      },
      modal: {
        ondismiss: () => {
          onError({ message: 'Payment cancelled by user' })
        },
      },
      prefill: {},
      theme: {
        color: '#6366f1',
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
    }

    const rzp = new window.Razorpay(options)
    
    rzp.on('payment.failed', (response: any) => {
      onError(response.error)
    })

    rzp.on('payment.authorized', (response: any) => {
      // Auto-verify payment after authorization
      onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature)
    })

    rzp.open()
  } catch (err) {
    console.error('Razorpay checkout error:', err)
    onError(err)
  }
}

/**
 * Open Razorpay checkout for booking payment
 */
export async function openRazorpayBookingCheckout({
  amount,
  bookingId,
  onSuccess,
  onError,
}: RazorpayBookingOptions) {
  try {
    // Initiate payment on backend (creates Razorpay order)
    const initiateRes = await api.post(`/bookings/${bookingId}/pay`)
    const { orderId, currency } = initiateRes.data.data

    if (!window.Razorpay) {
      throw new Error('Razorpay script not loaded')
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: amount * 100, // Amount in paise
      currency: currency || 'INR',
      name: 'RentBuddy',
      description: `Booking Payment - ${bookingId}`,
      order_id: orderId,
      notes: {
        bookingId,
      },
      handler: (response: any) => {
        onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature)
      },
      modal: {
        ondismiss: () => {
          onError({ message: 'Payment cancelled by user' })
        },
      },
      prefill: {},
      theme: {
        color: '#6366f1',
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
    }

    const rzp = new window.Razorpay(options)
    
    rzp.on('payment.failed', (response: any) => {
      onError(response.error)
    })

    rzp.open()
  } catch (err) {
    console.error('Razorpay booking checkout error:', err)
    onError(err)
  }
}
