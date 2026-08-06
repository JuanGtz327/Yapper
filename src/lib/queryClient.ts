import { QueryClient } from '@tanstack/react-query'

function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 1) return false
  const message = error?.message ?? ''
  if (message.includes('401') || message.includes('403')) return false
  if (message.includes('PGRST301')) return false
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
