"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchHealth, fetchModels } from "@/lib/api"

/**
 * Router liveness + the active model fleet. Previously an inline useEffect in
 * the console page; as a query it gets caching, retry and refetch for free.
 */
export function useRouterHealth() {
  const health = useQuery({
    queryKey: ["router", "health"],
    queryFn: fetchHealth,
    refetchInterval: 20_000,
  })

  const models = useQuery({
    queryKey: ["router", "models"],
    queryFn: fetchModels,
    retry: 0,
  })

  return {
    healthy: health.isPending ? null : (health.data ?? false),
    models: models.data ?? [],
  }
}
