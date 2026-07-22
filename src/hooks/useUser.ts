import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useSession } from '@/context/SessionProvider'
import { getCurrentUser } from '@/services/userService'

export function useCurrentUser() {
  const { session } = useSession()
  const email = session?.user.email
  return useQuery({ queryKey: queryKeys.user.me, queryFn: () => getCurrentUser(email) })
}
