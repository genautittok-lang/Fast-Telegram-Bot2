import { useQuery } from "@tanstack/react-query";

interface Stats {
  totalUsers: number;
  activeWatches: number;
  totalReports: number;
  checksToday: number;
  threatsBlocked: number;
  uptime: number;
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
