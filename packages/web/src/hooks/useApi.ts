import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
}

export function useApi<T>(fn: () => Promise<T>, options?: UseApiOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fn()
      setData(result)
      options?.onSuccess?.(result)
      return result
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Something went wrong'
      setError(message)
      options?.onError?.(err)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fn, options])

  return { data, loading, error, execute }
}
